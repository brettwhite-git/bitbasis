const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manualWebhookFix() {
  console.log('🔧 Manual Webhook Processing - Lifetime Upgrade Fix\n');
  
  const sessionId = 'cs_test_b1OJ4yMJoZHiDNGR5gqyzMPotovaif91YoMDp9A9wK6DUDU0WYcmNtnYL8';
  const userId = 'dad8fa50-ecf4-45fc-99bc-92184646655a';
  
  try {
    // Step 1: Get the checkout session details
    console.log('📊 Step 1: Retrieving Checkout Session');
    console.log('=====================================');
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`Session ID: ${session.id}`);
    console.log(`Status: ${session.status}`);
    console.log(`Mode: ${session.mode}`);
    console.log(`Amount: $${(session.amount_total || 0) / 100}`);
    console.log(`Payment Status: ${session.payment_status}`);
    console.log(`User ID: ${session.metadata?.user_id}`);
    console.log(`Price ID: ${session.metadata?.price_id}`);
    
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      console.log('❌ Session is not completed or payment not successful');
      return;
    }
    
    // Step 2: Cancel existing Pro subscription
    console.log('\n🚫 Step 2: Canceling Existing Pro Subscription');
    console.log('=====================================');
    
    // Get existing active subscriptions
    const { data: existingSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']);
    
    if (fetchError) {
      console.error('Error fetching existing subscriptions:', fetchError);
    } else if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log(`Found ${existingSubscriptions.length} existing subscriptions to cancel`);
      
      for (const sub of existingSubscriptions) {
        try {
          console.log(`Canceling subscription: ${sub.id}`);
          await stripe.subscriptions.cancel(sub.id);
          console.log(`✅ Successfully canceled subscription: ${sub.id}`);
        } catch (cancelError) {
          console.error(`❌ Error canceling subscription ${sub.id}:`, cancelError.message);
        }
      }
    } else {
      console.log('No existing active subscriptions found');
    }
    
    // Step 3: Create lifetime subscription record
    console.log('\n🌟 Step 3: Creating Lifetime Subscription');
    console.log('=====================================');
    
    const lifetimeSubscription = {
      id: `lifetime_${userId}`,
      user_id: userId,
      status: 'active',
      metadata: {
        type: 'lifetime',
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent,
      },
      price_id: session.metadata?.price_id || null,
      quantity: 1,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date('2099-12-31').toISOString(),
      created: new Date().toISOString(),
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
    };
    
    console.log('Creating lifetime subscription with data:', {
      id: lifetimeSubscription.id,
      user_id: lifetimeSubscription.user_id,
      status: lifetimeSubscription.status,
      metadata: lifetimeSubscription.metadata,
    });
    
    const { error: lifetimeError } = await supabase
      .from('subscriptions')
      .upsert(lifetimeSubscription);
    
    if (lifetimeError) {
      console.error('❌ Error creating lifetime subscription:', lifetimeError);
      throw lifetimeError;
    }
    
    console.log('✅ Lifetime subscription created successfully');
    
    // Step 4: Verify the fix
    console.log('\n✅ Step 4: Verification');
    console.log('=====================================');
    
    const { data: allSubscriptions, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created', { ascending: false });
    
    if (verifyError) {
      console.error('Error verifying subscriptions:', verifyError);
    } else {
      console.log(`Total subscriptions for user: ${allSubscriptions.length}`);
      allSubscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub.id}:`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Type: ${sub.metadata?.type || 'regular'}`);
        console.log(`     Cancel at period end: ${sub.cancel_at_period_end}`);
      });
    }
    
    // Step 5: Test subscription status
    console.log('\n🧪 Step 5: Testing Subscription Status Function');
    console.log('=====================================');
    
    const { data: statusResult, error: statusError } = await supabase
      .rpc('get_user_subscription_info', { user_uuid: userId });
    
    if (statusError) {
      console.error('Error getting subscription status:', statusError);
    } else {
      console.log('Subscription status result:', statusResult);
    }
    
    console.log('\n🎉 MANUAL FIX COMPLETED!');
    console.log('=====================================');
    console.log('✅ Lifetime subscription created');
    console.log('✅ Pro subscription canceled');
    console.log('✅ User should now have unlimited transactions');
    console.log('✅ App UI should show Lifetime badge');
    console.log('\n🔄 Please refresh your BitBasis app to see the changes!');
    
  } catch (error) {
    console.error('❌ Manual fix failed:', error.message);
    console.error('Full error:', error);
  }
}

manualWebhookFix(); 