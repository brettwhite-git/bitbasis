import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { validateRedirectUrl } from '@/lib/utils/url-validation'
import { sanitizeError } from '@/lib/utils/error-sanitization'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, createRateLimitResponse, RateLimits } from '@/lib/rate-limiting'

// Helper function to create portal configuration if none exists
async function ensurePortalConfiguration() {
  try {
    // Check if a configuration already exists
    const configurations = await stripe.billingPortal.configurations.list({ limit: 1 })

    if (configurations.data.length > 0) {
      const existingConfig = configurations.data[0]
      if (existingConfig) {
        console.log('✅ Portal configuration already exists')
        return existingConfig.id
      }
    }

    // Create a default configuration
    console.log('Creating default portal configuration...')
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'BitBasis - Manage your subscription',
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address'],
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'immediately',
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
        },
      },
    })

    console.log('✅ Created portal configuration:', configuration.id)
    return configuration.id
  } catch (error) {
    console.error('Error creating portal configuration:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PORTAL SESSION START ===')
    const { returnUrl } = await request.json()
    console.log('Return URL:', returnUrl)

    // Get authenticated user
    console.log('Getting authenticated user...')
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // SEC-006: Rate limiting per user
    const rateLimitResult = checkRateLimit(
      `portal:${user.id}`,
      RateLimits.SUBSCRIPTION_OPERATIONS.limit,
      RateLimits.SUBSCRIPTION_OPERATIONS.windowMs
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    // Get or create user's Stripe customer ID
    let customerId: string | undefined

    // First, check if user already has a Stripe customer ID
    console.log('Checking for existing customer...')
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (customerError) {
      console.log('Customer lookup error:', customerError.message)
    }

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
      console.log('✅ Found existing customer:', customerId)
    } else {
      console.log('No customer record found, checking for subscription...')
      // User doesn't have a customer record, but might have a subscription
      // Let's check if they have an active subscription first
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subError) {
        console.log('Subscription lookup error:', subError.message)
      }

      if (subscription) {
        console.log('✅ Found active subscription, looking for Stripe customer...')
        // User has an active subscription but no customer record
        // This can happen if they were upgraded manually or webhook failed
        // Let's find their Stripe customer by email
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        })

        if (customers.data.length > 0) {
          const existingCustomer = customers.data[0]
          if (existingCustomer) {
            customerId = existingCustomer.id
            console.log('✅ Found Stripe customer by email:', customerId)
            
            // Save the customer ID to our database
            const { error: upsertError } = await supabase
              .from('customers')
              .upsert({
                id: user.id,
                stripe_customer_id: customerId,
              })
            
            if (upsertError) {
              console.log('Error saving customer to database:', upsertError.message)
            } else {
              console.log('✅ Customer saved to database')
            }
          }
        } else {
          console.log('No Stripe customer found, creating new one...')
          // Create a new customer if none exists
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              supabase_user_id: user.id,
            },
          })

          customerId = customer.id
          console.log('✅ Created new Stripe customer:', customerId)

          // Save customer ID to database
          const { error: upsertError } = await supabase
            .from('customers')
            .upsert({
              id: user.id,
              stripe_customer_id: customerId,
            })
          
          if (upsertError) {
            console.log('Error saving new customer to database:', upsertError.message)
          } else {
            console.log('✅ New customer saved to database')
          }
        }
      } else {
        console.log('❌ No subscription found')
        // User has no subscription and no customer record
        return NextResponse.json(
          { error: 'No subscription found. Please create a subscription first.' },
          { status: 404 }
        )
      }
    }

    if (!customerId) {
      console.log('❌ No customer ID available')
      return NextResponse.json(
        { error: 'Unable to find or create Stripe customer.' },
        { status: 404 }
      )
    }

    // Ensure portal configuration exists before creating session
    try {
      await ensurePortalConfiguration()
    } catch (configError) {
      console.error('Failed to ensure portal configuration:', configError)
      // Continue anyway - maybe the configuration exists but we can't list it
    }

    // SEC-009: Validate return URL to prevent open redirect attacks
    const safeReturnUrl = validateRedirectUrl(
      returnUrl,
      '/dashboard/settings',
      request.nextUrl.origin
    )

    // Create customer portal session
    console.log('Creating portal session for customer:', customerId)
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturnUrl,
    })

    console.log('✅ Portal session created:', portalSession.id)
    console.log('Portal URL:', portalSession.url)

    return NextResponse.json({
      url: portalSession.url,
    })

  } catch (error) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeError(error, 'Failed to create customer portal session', 'portal session creation')
    
    return NextResponse.json(
      sanitized,
      { status: 500 }
    )
  }
} 