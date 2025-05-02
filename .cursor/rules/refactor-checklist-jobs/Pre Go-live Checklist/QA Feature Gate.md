# Feature Gating Implementation Plan

## Database Schema Checklist

- [ ] Create a `subscription_tiers` table:
  ```sql
  CREATE TABLE subscription_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    description TEXT,
    features JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] Add tier information to the `subscriptions` table:
  ```sql
  ALTER TABLE subscriptions 
  ADD COLUMN tier_id INTEGER REFERENCES subscription_tiers(id);
  ```

- [ ] Create a features definition table (optional):
  ```sql
  CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

## Feature Definition Checklist

- [ ] Define feature flags for your application
  ```typescript
  // Define feature keys as constants
  export const FEATURES = {
    BASIC_ANALYTICS: 'basic_analytics',
    ADVANCED_ANALYTICS: 'advanced_analytics',
    CSV_EXPORT: 'csv_export',
    PORTFOLIO_TRACKING: 'portfolio_tracking',
    API_ACCESS: 'api_access',
    MAX_CSV_SIZE: 'max_csv_size',
    // Add more features as needed
  };
  ```

- [ ] Map features to subscription tiers:
  ```typescript
  export const TIER_FEATURES = {
    free: {
      [FEATURES.BASIC_ANALYTICS]: true,
      [FEATURES.PORTFOLIO_TRACKING]: true,
      [FEATURES.MAX_CSV_SIZE]: 5, // MB
    },
    pro: {
      [FEATURES.BASIC_ANALYTICS]: true,
      [FEATURES.ADVANCED_ANALYTICS]: true,
      [FEATURES.PORTFOLIO_TRACKING]: true,
      [FEATURES.CSV_EXPORT]: true,
      [FEATURES.MAX_CSV_SIZE]: 50, // MB
    },
    business: {
      [FEATURES.BASIC_ANALYTICS]: true,
      [FEATURES.ADVANCED_ANALYTICS]: true,
      [FEATURES.PORTFOLIO_TRACKING]: true,
      [FEATURES.CSV_EXPORT]: true,
      [FEATURES.API_ACCESS]: true,
      [FEATURES.MAX_CSV_SIZE]: 100, // MB
    }
  };
  ```

## Server-Side Implementation Checklist

- [ ] Create a utility to fetch user's subscription tier:
  ```typescript
  // utils/subscription.ts
  import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

  export async function getUserSubscriptionTier(req, res) {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 'anonymous';
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, subscription_tiers(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    return subscription?.subscription_tiers?.name || 'free';
  }
  ```

- [ ] Create middleware for protected routes:
  ```typescript
  // middleware.ts
  import { NextResponse } from 'next/server';
  import { getUserSubscriptionTier } from './utils/subscription';
  import { TIER_FEATURES, FEATURES } from './utils/features';

  export async function middleware(req) {
    // Check if route requires subscription
    if (req.nextUrl.pathname.startsWith('/api/premium')) {
      const tier = await getUserSubscriptionTier(req);
      
      // Check if user has API access
      if (!TIER_FEATURES[tier][FEATURES.API_ACCESS]) {
        return NextResponse.json(
          { error: 'Subscription required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.next();
  }
  ```

## Client-Side Implementation Checklist

- [ ] Create a subscription context:
  ```typescript
  // contexts/SubscriptionContext.tsx
  import { createContext, useContext, useEffect, useState } from 'react';
  import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
  import { TIER_FEATURES } from '../utils/features';

  const SubscriptionContext = createContext(null);

  export function SubscriptionProvider({ children }) {
    const [subscription, setSubscription] = useState(null);
    const [tier, setTier] = useState('free');
    const [features, setFeatures] = useState(TIER_FEATURES.free);
    const supabase = useSupabaseClient();
    const user = useUser();

    useEffect(() => {
      if (!user) {
        setTier('anonymous');
        setFeatures(TIER_FEATURES.free);
        return;
      }

      async function loadSubscription() {
        const { data } = await supabase
          .from('subscriptions')
          .select('*, subscription_tiers(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        setSubscription(data);
        const tierName = data?.subscription_tiers?.name || 'free';
        setTier(tierName);
        setFeatures(TIER_FEATURES[tierName] || TIER_FEATURES.free);
      }

      loadSubscription();
    }, [user, supabase]);

    function hasFeature(featureKey) {
      return !!features[featureKey];
    }

    function getFeatureValue(featureKey) {
      return features[featureKey];
    }

    return (
      <SubscriptionContext.Provider 
        value={{ 
          subscription, 
          tier, 
          features, 
          hasFeature, 
          getFeatureValue 
        }}
      >
        {children}
      </SubscriptionContext.Provider>
    );
  }

  export function useSubscription() {
    return useContext(SubscriptionContext);
  }
  ```

- [ ] Create feature-gated components:
  ```typescript
  // components/FeatureGate.tsx
  import { useSubscription } from '../contexts/SubscriptionContext';

  export function FeatureGate({ 
    feature, 
    fallback = null, 
    children 
  }) {
    const { hasFeature } = useSubscription();
    
    if (!hasFeature(feature)) {
      return fallback;
    }
    
    return children;
  }
  ```

- [ ] Example usage in a component:
  ```tsx
  import { FeatureGate } from '../components/FeatureGate';
  import { FEATURES } from '../utils/features';
  import { useSubscription } from '../contexts/SubscriptionContext';

  export default function PortfolioPage() {
    const { tier, getFeatureValue } = useSubscription();
    const maxCsvSize = getFeatureValue(FEATURES.MAX_CSV_SIZE);
    
    return (
      <div>
        <h1>Portfolio</h1>
        
        {/* Basic features available to all */}
        <BasicAnalytics />
        
        {/* Feature gated advanced analytics */}
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          fallback={<UpgradePrompt feature="Advanced Analytics" />}
        >
          <AdvancedAnalytics />
        </FeatureGate>
        
        {/* Feature with value */}
        <p>Maximum CSV size: {maxCsvSize}MB</p>
        
        {/* Feature gated export button */}
        <FeatureGate feature={FEATURES.CSV_EXPORT}>
          <ExportButton />
        </FeatureGate>
      </div>
    );
  }
  ```

## API Route Protection Checklist

- [ ] Create a utility for API routes:
  ```typescript
  // utils/withSubscription.ts
  import { NextApiRequest, NextApiResponse } from 'next';
  import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
  import { TIER_FEATURES, FEATURES } from './features';

  export function withSubscription(handler, requiredFeature) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const supabase = createServerSupabaseClient({ req, res });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, subscription_tiers(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const tier = subscription?.subscription_tiers?.name || 'free';
      
      // Check if user's tier has the required feature
      if (requiredFeature && !TIER_FEATURES[tier][requiredFeature]) {
        return res.status(403).json({ 
          error: 'Subscription required',
          upgrade: true,
          feature: requiredFeature
        });
      }
      
      return handler(req, res, user, tier);
    };
  }
  ```

- [ ] Example API route with feature gate:
  ```typescript
  // pages/api/export-data.ts
  import { withSubscription } from '../../utils/withSubscription';
  import { FEATURES } from '../../utils/features';

  async function handler(req, res, user, tier) {
    // Export logic here - only accessible to users with CSV_EXPORT feature
    const data = await generateExport(user.id);
    return res.status(200).json(data);
  }

  export default withSubscription(handler, FEATURES.CSV_EXPORT);
  ```

## User Experience Checklist

- [ ] Design upgrade prompts for locked features:
  ```tsx
  // components/UpgradePrompt.tsx
  import { useSubscription } from '../contexts/SubscriptionContext';
  import Link from 'next/link';

  export function UpgradePrompt({ feature }) {
    const { tier } = useSubscription();
    
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Upgrade to access {feature}</h3>
        <p className="mt-2">
          Your current plan ({tier}) doesn't include this feature.
        </p>
        <Link href="/pricing">
          <a className="mt-3 inline-block bg-orange-500 text-white px-4 py-2 rounded">
            View pricing
          </a>
        </Link>
      </div>
    );
  }
  ```

- [ ] Create a subscription comparison component:
  ```tsx
  // components/PricingTable.tsx
  import { useSubscription } from '../contexts/SubscriptionContext';
  import { FEATURES } from '../utils/features';
  import { useState } from 'react';

  const TIERS = [
    {
      name: 'Free',
      price: '$0',
      description: 'Basic portfolio tracking',
      stripePriceId: null,
      features: [
        'Basic analytics',
        'Portfolio tracking',
        '5MB max CSV size',
      ]
    },
    {
      name: 'Pro',
      price: '$9.99',
      description: 'Enhanced analytics and exports',
      stripePriceId: 'price_abc123',
      features: [
        'Basic analytics',
        'Advanced analytics',
        'Portfolio tracking',
        'CSV exports',
        '50MB max CSV size',
      ]
    },
    // etc.
  ];

  export function PricingTable() {
    const { tier: currentTier } = useSubscription();
    const [billingType, setBillingType] = useState('monthly');
    
    return (
      <div>
        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setBillingType('monthly')}
            className={billingType === 'monthly' ? 'active' : ''}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingType('yearly')}
            className={billingType === 'yearly' ? 'active' : ''}
          >
            Yearly (20% off)
          </button>
        </div>
        
        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map(tier => (
            <div 
              key={tier.name} 
              className={`border rounded-lg p-6 ${
                currentTier === tier.name.toLowerCase() ? 'border-orange-500' : ''
              }`}
            >
              <h3 className="text-2xl font-bold">{tier.name}</h3>
              <p className="text-3xl font-bold mt-4">{tier.price}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{tier.description}</p>
              
              <ul className="mt-6 space-y-3">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full mt-8 py-2 px-4 rounded ${
                  currentTier === tier.name.toLowerCase() 
                    ? 'bg-gray-200 dark:bg-gray-700 cursor-default' 
                    : 'bg-orange-500 text-white'
                }`}
                disabled={currentTier === tier.name.toLowerCase()}
              >
                {currentTier === tier.name.toLowerCase() 
                  ? 'Current Plan' 
                  : tier.price === '$0' ? 'Get Started' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

## Testing Checklist

- [ ] Test different subscription tiers and feature access
- [ ] Test subscription upgrades and immediate feature activation
- [ ] Test subscription downgrades and feature restrictions
- [ ] Test subscription cancellation and feature removal
- [ ] Test client-side feature gates
- [ ] Test server-side API protections
- [ ] Test feature values (e.g., CSV size limits)
- [ ] Test upgrade prompts and CTAs
- [ ] Test with various edge cases (expired subscriptions, trialing, etc.)

## Monitoring and Analytics Checklist

- [ ] Track feature usage by subscription tier
- [ ] Monitor subscription upgrades triggered by feature gates
- [ ] Analyze which features drive conversions
- [ ] Set up alerts for unusual subscription changes
- [ ] Create dashboard for feature gate analytics
- [ ] Document procedures for adding new features to tiers
- [ ] Plan A/B tests for feature positioning and messaging

## Integration with Stripe Checklist

- [ ] Sync Stripe Products/Prices with `subscription_tiers` table
- [ ] Update feature access immediately after subscription changes
- [ ] Handle subscription events in Stripe webhooks:
  ```typescript
  // pages/api/webhooks.ts (partial)
  
  // Handle subscription updated
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();
      
    if (customer) {
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          // Map the price ID to the appropriate tier_id
          tier_id: await getTierIdFromPriceId(subscription.items.data[0].price.id),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);
    }
  }
  ```

## Best Practices

- [ ] Keep feature definitions in a single location
- [ ] Cache feature access to minimize database queries
- [ ] Design for graceful degradation when features are not available
- [ ] Provide clear upgrade paths with focused value propositions
- [ ] Consider offering trial access to premium features
- [ ] Implement feature usage analytics
- [ ] Make subscription management self-service via Stripe Customer Portal
- [ ] Provide meaningful feedback when a user attempts to use unavailable features
- [ ] Consider grandfathering feature access during pricing changes
- [ ] Document your feature gates for internal team reference 