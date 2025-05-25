const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugRecentCheckout() {
  console.log('🔍 Debugging Recent Checkout Session\n');
  
  const testCustomerId = 'cus_SMp75N8e3deI2w';
  
  try {
    // Get recent checkout sessions
    console.log('📊 Recent Checkout Sessions');
    console.log('=====================================');
    
    const sessions = await stripe.checkout.sessions.list({
      customer: testCustomerId,
      limit: 5,
    });
    
    console.log(`Found ${sessions.data.length} recent sessions:`);
    
    sessions.data.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Mode: ${session.mode}`);
      console.log(`   Amount: $${(session.amount_total || 0) / 100}`);
      console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);
      console.log(`   Payment Status: ${session.payment_status}`);
      console.log(`   Metadata:`, session.metadata);
      
      if (session.payment_intent) {
        console.log(`   Payment Intent: ${session.payment_intent}`);
      }
    });
    
    // Find the most recent completed session
    const recentSession = sessions.data.find(s => s.status === 'complete' && s.mode === 'payment');
    
    if (recentSession) {
      console.log('\n🎯 Most Recent Lifetime Purchase');
      console.log('=====================================');
      console.log(`Session ID: ${recentSession.id}`);
      console.log(`Amount: $${(recentSession.amount_total || 0) / 100}`);
      console.log(`User ID: ${recentSession.metadata?.user_id}`);
      console.log(`Price ID: ${recentSession.metadata?.price_id}`);
      console.log(`Payment Intent: ${recentSession.payment_intent}`);
      
      // Check if this should have triggered our webhook
      console.log('\n🔄 Expected Webhook Processing');
      console.log('=====================================');
      console.log('1. checkout.session.completed webhook should have fired');
      console.log('2. handleLifetimePayment() should have run');
      console.log('3. Existing Pro subscription should have been canceled');
      console.log('4. Lifetime subscription should have been created');
      
      // Check what webhooks were sent for this session
      console.log('\n📡 Checking Webhook Events');
      console.log('=====================================');
      
      const events = await stripe.events.list({
        type: 'checkout.session.completed',
        limit: 10,
      });
      
      const sessionEvent = events.data.find(event => 
        event.data.object.id === recentSession.id
      );
      
      if (sessionEvent) {
        console.log(`✅ Webhook event found: ${sessionEvent.id}`);
        console.log(`   Created: ${new Date(sessionEvent.created * 1000).toLocaleString()}`);
        console.log(`   Delivered: ${sessionEvent.pending_webhooks === 0 ? 'Yes' : 'Pending'}`);
        console.log(`   Pending webhooks: ${sessionEvent.pending_webhooks}`);
      } else {
        console.log('❌ No webhook event found for this session');
      }
      
    } else {
      console.log('\n❌ No recent completed payment sessions found');
    }
    
    // Check current database state
    console.log('\n💾 Database State Check Needed');
    console.log('=====================================');
    console.log('Next steps:');
    console.log('1. Check if lifetime subscription exists in database');
    console.log('2. Check if Pro subscription was canceled');
    console.log('3. Manually process the webhook if needed');
    console.log('4. Verify webhook endpoint is working');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugRecentCheckout(); 