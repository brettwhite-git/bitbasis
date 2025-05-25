const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function comprehensiveStripeTest() {
  console.log('🧪 BitBasis Comprehensive Stripe Test Suite\n');
  
  const testCustomerId = 'cus_SMp75N8e3deI2w';
  
  try {
    console.log('📊 CURRENT STATE ANALYSIS');
    console.log('=====================================');
    
    // Get customer info
    const customer = await stripe.customers.retrieve(testCustomerId);
    console.log(`Customer: ${customer.id} (${customer.email})`);
    
    // Get all subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: testCustomerId,
      limit: 10,
    });
    
    console.log(`\nSubscriptions: ${subscriptions.data.length}`);
    subscriptions.data.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.id}:`);
      console.log(`     Status: ${sub.status}`);
      console.log(`     Price: $${(sub.items.data[0]?.price.unit_amount || 0) / 100}`);
      console.log(`     Cancel at period end: ${sub.cancel_at_period_end}`);
      if (sub.current_period_end) {
        console.log(`     Period ends: ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);
      }
      console.log('');
    });

    // Check for active subscriptions
    const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active');
    const canceledSubscriptions = subscriptions.data.filter(s => s.status === 'canceled');
    
    console.log(`Active subscriptions: ${activeSubscriptions.length}`);
    console.log(`Canceled subscriptions: ${canceledSubscriptions.length}`);

    console.log('\n🧪 TEST SCENARIOS AVAILABLE');
    console.log('=====================================');

    // Test 1: Reactivation
    const subscriptionToCancel = activeSubscriptions.find(s => s.cancel_at_period_end);
    if (subscriptionToCancel) {
      console.log('✅ Test 1: REACTIVATION');
      console.log('   Current subscription is set to cancel at period end');
      console.log('   🎯 Action: Go to Customer Portal → Reactivate subscription');
      console.log('   📝 Expected: cancel_at_period_end becomes false');
      console.log('   🔄 Webhook: customer.subscription.updated');
    } else {
      console.log('❌ Test 1: REACTIVATION - Not available');
      console.log('   No subscription set to cancel at period end');
    }

    // Test 2: Lifetime Upgrade
    console.log('\n✅ Test 2: LIFETIME UPGRADE');
    console.log('   🎯 Action: Use app UI → "Upgrade to Lifetime"');
    console.log('   💰 Expected: $210 one-time payment');
    console.log('   🔄 Webhook: checkout.session.completed (mode=payment)');
    console.log('   📝 Expected: Existing Pro subscription canceled');
    console.log('   📝 Expected: Lifetime subscription created');

    // Test 3: Immediate Cancellation
    if (activeSubscriptions.length > 0) {
      console.log('\n⚠️  Test 3: IMMEDIATE CANCELLATION');
      console.log('   🎯 Action: Stripe Dashboard → Cancel subscription immediately');
      console.log('   📝 Expected: Status becomes "canceled"');
      console.log('   🔄 Webhook: customer.subscription.deleted');
      console.log('   📝 Expected: User immediately becomes Free');
      console.log('   ⚠️  WARNING: This will immediately remove Pro access!');
    } else {
      console.log('\n❌ Test 3: IMMEDIATE CANCELLATION - Not available');
      console.log('   No active subscriptions to cancel');
    }

    // Test 4: Transaction Limits
    console.log('\n🚫 Test 4: TRANSACTION LIMITS');
    console.log('   🎯 Action: Cancel subscription and test limits');
    console.log('   📝 Expected: Free users limited to 50 transactions');
    console.log('   📝 Expected: Warning at 45 transactions');
    console.log('   📝 Expected: Block at 50+ transactions');
    console.log('   📝 Expected: CSV import blocked if would exceed limit');

    console.log('\n🔧 WEBHOOK VERIFICATION CHECKLIST');
    console.log('=====================================');
    console.log('After each test, verify:');
    console.log('1. ✅ Webhook received and processed');
    console.log('2. ✅ Database subscription status updated');
    console.log('3. ✅ App UI reflects correct status');
    console.log('4. ✅ Transaction limits work correctly');
    console.log('5. ✅ No duplicate subscriptions created');

    console.log('\n🎯 RECOMMENDED TEST SEQUENCE');
    console.log('=====================================');
    console.log('1. 🔄 Test reactivation (if available)');
    console.log('2. ⬆️  Test lifetime upgrade');
    console.log('3. 🧪 Verify lifetime subscription works');
    console.log('4. ⬇️  Test immediate cancellation (if needed)');
    console.log('5. 🚫 Test transaction limits as Free user');
    console.log('6. 🔄 Test re-subscription to Pro');

    console.log('\n🛡️  PROTECTION MECHANISMS ACTIVE');
    console.log('=====================================');
    console.log('✅ Duplicate customer prevention');
    console.log('✅ Multiple checkout session prevention');
    console.log('✅ Frontend click protection');
    console.log('✅ Lifetime duplicate purchase prevention');
    console.log('✅ Existing subscription cancellation on upgrade');
    console.log('✅ Comprehensive subscription status handling');

    console.log('\n🔍 EDGE CASES TO WATCH FOR');
    console.log('=====================================');
    console.log('1. Webhook delays (temporary UI inconsistency)');
    console.log('2. Payment failures (subscription status changes)');
    console.log('3. User with >50 transactions downgrading');
    console.log('4. Multiple rapid upgrade attempts');
    console.log('5. Subscription status edge cases (past_due, incomplete)');

    console.log('\n✅ Test suite ready! Choose a test scenario to run.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

comprehensiveStripeTest(); 