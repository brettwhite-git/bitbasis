require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRecentProUpgrade() {
  console.log('🔍 Debugging Recent Pro Upgrade\n');
  
  const userId = 'dad8fa50-ecf4-45fc-99bc-92184646655a';
  
  try {
    // Step 1: Get user's Stripe customer ID
    console.log('📊 Step 1: Finding User\'s Stripe Customer');
    console.log('=====================================');
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (customerError || !customer) {
      console.log('❌ No customer record found');
      return;
    }
    
    const customerId = customer.stripe_customer_id;
    console.log(`✅ Found customer: ${customerId}`);
    
    // Step 2: Get recent checkout sessions
    console.log('\n📊 Step 2: Recent Checkout Sessions');
    console.log('=====================================');
    
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 5,
    });
    
    console.log(`Found ${sessions.data.length} recent sessions:`);
    
    let recentProSession = null;
    
    sessions.data.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Mode: ${session.mode}`);
      console.log(`   Amount: $${(session.amount_total || 0) / 100}`);
      console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);
      console.log(`   Payment Status: ${session.payment_status}`);
      console.log(`   Metadata:`, session.metadata);
      
      // Look for recent completed subscription sessions (Pro upgrade)
      if (session.status === 'complete' && 
          session.mode === 'subscription' && 
          session.payment_status === 'paid' &&
          session.created > (Date.now() / 1000) - (24 * 60 * 60)) { // Last 24 hours
        recentProSession = session;
      }
    });
    
    if (!recentProSession) {
      console.log('\n❌ No recent Pro upgrade sessions found in last 24 hours');
      return;
    }
    
    console.log('\n🎯 Found Recent Pro Upgrade Session');
    console.log('=====================================');
    console.log(`Session ID: ${recentProSession.id}`);
    console.log(`Subscription ID: ${recentProSession.subscription}`);
    console.log(`User ID: ${recentProSession.metadata?.user_id}`);
    console.log(`Price ID: ${recentProSession.metadata?.price_id}`);
    
    // Step 3: Check if subscription exists in our database
    console.log('\n💾 Step 3: Checking Database');
    console.log('=====================================');
    
    const { data: existingSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', recentProSession.subscription)
      .single();
    
    if (subError && subError.code !== 'PGRST116') {
      console.log('❌ Error checking subscription:', subError.message);
    }
    
    if (existingSubscription) {
      console.log('✅ Subscription exists in database:', existingSubscription.status);
      console.log('   This suggests webhook processed but status might be wrong');
    } else {
      console.log('❌ Subscription NOT found in database');
      console.log('   This suggests webhook failed to process');
      
      // Step 4: Manually process the webhook
      console.log('\n🔧 Step 4: Manual Webhook Processing');
      console.log('=====================================');
      
      // Get the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(recentProSession.subscription);
      console.log(`Stripe subscription status: ${subscription.status}`);
      console.log(`Price ID: ${subscription.items.data[0]?.price.id}`);
      
      // Create the subscription record
      const subscriptionData = {
        id: subscription.id,
        user_id: userId,
        status: subscription.status,
        metadata: subscription.metadata || {},
        price_id: subscription.items.data[0]?.price.id,
        quantity: subscription.items.data[0]?.quantity || 1,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created: new Date(subscription.created * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      };
      
      console.log('Creating subscription with data:', {
        id: subscriptionData.id,
        user_id: subscriptionData.user_id,
        status: subscriptionData.status,
        price_id: subscriptionData.price_id,
      });
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData);
      
      if (insertError) {
        console.log('❌ Error creating subscription:', insertError.message);
      } else {
        console.log('✅ Subscription created successfully!');
        
        // Verify the fix
        console.log('\n✅ Step 5: Verification');
        console.log('=====================================');
        
        const { data: verifyResult } = await supabase
          .rpc('get_user_subscription_info', { user_uuid: userId });
        
        if (verifyResult && verifyResult.length > 0) {
          console.log(`New subscription status: ${verifyResult[0].subscription_status}`);
          console.log(`Can add transactions: ${verifyResult[0].can_add_transaction}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the debug
debugRecentProUpgrade().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 