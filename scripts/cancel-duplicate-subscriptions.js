const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function cancelDuplicateSubscriptions() {
  try {
    console.log('🔍 Checking subscriptions to cancel duplicates...\n');
    
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: 'cus_SMp75N8e3deI2w',
      limit: 10,
    });

    console.log(`Found ${subscriptions.data.length} subscriptions\n`);

    // Filter to only active subscriptions
    const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active');
    
    if (activeSubscriptions.length <= 1) {
      console.log('✅ No duplicate subscriptions found.');
      return;
    }

    console.log(`⚠️  Found ${activeSubscriptions.length} active subscriptions - canceling duplicates...\n`);

    // Sort by creation date (newest first)
    activeSubscriptions.sort((a, b) => b.created - a.created);

    // Keep the newest subscription, cancel the rest
    const subscriptionToKeep = activeSubscriptions[0];
    const subscriptionsToCancel = activeSubscriptions.slice(1);

    console.log(`✅ Keeping subscription: ${subscriptionToKeep.id} (created: ${new Date(subscriptionToKeep.created * 1000).toISOString()})`);
    
    for (const sub of subscriptionsToCancel) {
      console.log(`❌ Canceling duplicate: ${sub.id} (created: ${new Date(sub.created * 1000).toISOString()})`);
      
      try {
        await stripe.subscriptions.cancel(sub.id);
        console.log(`   ✅ Successfully canceled ${sub.id}`);
      } catch (error) {
        console.log(`   ❌ Failed to cancel ${sub.id}: ${error.message}`);
      }
    }

    console.log('\n🎉 Duplicate subscription cleanup complete!');
    console.log(`You should now have only 1 active subscription: ${subscriptionToKeep.id}`);

  } catch (error) {
    console.error('❌ Error canceling duplicate subscriptions:', error.message);
  }
}

// Ask for confirmation before running
console.log('⚠️  WARNING: This will cancel duplicate subscriptions!');
console.log('This script will:');
console.log('1. Find all active subscriptions for customer cus_SMp75N8e3deI2w');
console.log('2. Keep the newest subscription');
console.log('3. Cancel all older duplicate subscriptions');
console.log('');
console.log('Press Ctrl+C to cancel, or any key to continue...');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
  process.stdin.setRawMode(false);
  cancelDuplicateSubscriptions();
}); 