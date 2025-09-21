// Debug Stripe key configuration
async function debugStripeKeys() {
  console.log('🔍 Debugging Stripe Key Configuration');
  console.log('=====================================');
  
  try {
    // Check production environment
    const response = await fetch('https://bitbasis.io/api/debug-env');
    const data = await response.json();
    
    console.log('Production Environment:');
    console.log('- NODE_ENV:', data.NODE_ENV);
    console.log('- hasStripeSecret:', data.hasStripeSecret);
    console.log('- hasStripePublishable:', data.hasStripePublishable);
    console.log('- stripeSecretPrefix:', data.stripeSecretPrefix);
    
    // Check what publishable key the frontend is using
    console.log('\nFrontend Configuration:');
    console.log('- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    
    if (typeof window !== 'undefined') {
      // Client-side check
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      console.log('- Publishable key prefix:', publishableKey?.substring(0, 8) + '...');
      console.log('- Is live key:', publishableKey?.startsWith('pk_live_'));
      console.log('- Is test key:', publishableKey?.startsWith('pk_test_'));
    }
    
    // Check if keys match environment
    const secretIsLive = data.stripeSecretPrefix === 'sk_live_';
    console.log('\nKey Environment Check:');
    console.log('- Backend secret key is LIVE:', secretIsLive);
    console.log('- Expected publishable key should start with:', secretIsLive ? 'pk_live_' : 'pk_test_');
    
  } catch (error) {
    console.error('Error debugging keys:', error);
  }
}

debugStripeKeys();
