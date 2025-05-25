const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkSubscriptions() {
  try {
    console.log('🔍 Checking Stripe subscriptions for customer: cus_SMp75N8e3deI2w\n');
    
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: 'cus_SMp75N8e3deI2w',
      limit: 10,
    });

    console.log(`📊 Found ${subscriptions.data.length} subscription(s) in Stripe:\n`);

    subscriptions.data.forEach((sub, index) => {
      console.log(`--- Subscription ${index + 1} ---`);
      console.log(`ID: ${sub.id}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Price ID: ${sub.items.data[0]?.price.id}`);
      console.log(`Created: ${new Date(sub.created * 1000).toISOString()}`);
      console.log(`Current Period Start: ${sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : 'N/A'}`);
      console.log(`Current Period End: ${sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : 'N/A'}`);
      console.log(`Cancel at period end: ${sub.cancel_at_period_end}`);
      console.log(`Canceled at: ${sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : 'Not canceled'}`);
      console.log('');
    });

    // Summary
    const activeCount = subscriptions.data.filter(s => s.status === 'active').length;
    const canceledCount = subscriptions.data.filter(s => s.status === 'canceled').length;
    const cancelingCount = subscriptions.data.filter(s => s.cancel_at_period_end).length;

    console.log('📈 Summary:');
    console.log(`- Total subscriptions: ${subscriptions.data.length}`);
    console.log(`- Active: ${activeCount}`);
    console.log(`- Canceled: ${canceledCount}`);
    console.log(`- Set to cancel at period end: ${cancelingCount}`);

    if (activeCount > 1) {
      console.log('\n⚠️  WARNING: Multiple active subscriptions detected!');
      console.log('This means the customer is being charged multiple times.');
      console.log('You should cancel the duplicate subscriptions.');
    }

    if (cancelingCount > 0) {
      console.log('\n📅 Some subscriptions are set to cancel at the end of their billing period.');
    }

  } catch (error) {
    console.error('❌ Error checking subscriptions:', error.message);
  }
}

checkSubscriptions(); 