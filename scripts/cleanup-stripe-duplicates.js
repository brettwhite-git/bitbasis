const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function cleanupStripeDuplicates() {
  try {
    console.log('🧹 Starting Stripe cleanup for bwhite.mail@proton.me\n');
    
    // Step 1: Find all customers with this email
    console.log('📋 Step 1: Finding all customers...');
    const customers = await stripe.customers.list({
      email: 'bwhite.mail@proton.me',
      limit: 20,
    });

    console.log(`Found ${customers.data.length} customer(s) with this email\n`);

    // Step 2: Analyze each customer and their subscriptions
    const customerAnalysis = [];
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      customerAnalysis.push({
        customer,
        subscriptions: subscriptions.data,
        activeSubscriptions: subscriptions.data.filter(s => s.status === 'active'),
        totalSubscriptions: subscriptions.data.length
      });
    }

    // Step 3: Display analysis
    console.log('📊 Customer Analysis:');
    customerAnalysis.forEach((analysis, index) => {
      console.log(`\n--- Customer ${index + 1} ---`);
      console.log(`ID: ${analysis.customer.id}`);
      console.log(`Created: ${new Date(analysis.customer.created * 1000).toISOString()}`);
      console.log(`Total subscriptions: ${analysis.totalSubscriptions}`);
      console.log(`Active subscriptions: ${analysis.activeSubscriptions.length}`);
      console.log(`Metadata:`, analysis.customer.metadata);
      
      if (analysis.subscriptions.length > 0) {
        console.log('Subscriptions:');
        analysis.subscriptions.forEach(sub => {
          console.log(`  - ${sub.id} (${sub.status}) - $${(sub.items.data[0]?.price.unit_amount || 0) / 100}`);
        });
      }
    });

    // Step 4: Determine cleanup strategy
    console.log('\n🎯 Cleanup Strategy:');
    
    // Find the customer that should be kept (the one in our database)
    const dbCustomerId = 'cus_SMp75N8e3deI2w';
    const keepCustomer = customerAnalysis.find(a => a.customer.id === dbCustomerId);
    
    if (!keepCustomer) {
      console.log('❌ Database customer not found in Stripe results!');
      console.log('This might indicate the customer was already cleaned up or there\'s a sync issue.');
      return;
    }

    console.log(`✅ Will keep customer: ${keepCustomer.customer.id} (in database)`);
    console.log(`   - Has ${keepCustomer.activeSubscriptions.length} active subscription(s)`);

    // Find customers to remove
    const customersToRemove = customerAnalysis.filter(a => a.customer.id !== dbCustomerId);
    console.log(`❌ Will remove ${customersToRemove.length} duplicate customer(s)`);

    // Find duplicate subscriptions on the kept customer
    if (keepCustomer.activeSubscriptions.length > 1) {
      console.log(`⚠️  Customer ${dbCustomerId} has ${keepCustomer.activeSubscriptions.length} active subscriptions`);
      
      // Sort by creation date (keep newest)
      const sortedSubs = [...keepCustomer.activeSubscriptions].sort((a, b) => b.created - a.created);
      const subToKeep = sortedSubs[0];
      const subsToCancel = sortedSubs.slice(1);
      
      console.log(`   ✅ Will keep: ${subToKeep.id} (newest)`);
      console.log(`   ❌ Will cancel: ${subsToCancel.map(s => s.id).join(', ')}`);
    }

    // Step 5: Ask for confirmation
    console.log('\n⚠️  CONFIRMATION REQUIRED');
    console.log('This script will:');
    console.log(`1. Keep customer: ${dbCustomerId}`);
    if (keepCustomer.activeSubscriptions.length > 1) {
      const sortedSubs = [...keepCustomer.activeSubscriptions].sort((a, b) => b.created - a.created);
      console.log(`2. Cancel ${sortedSubs.length - 1} duplicate subscription(s) on kept customer`);
    }
    console.log(`3. Delete ${customersToRemove.length} duplicate customer(s) and their subscriptions`);
    console.log('\nPress Ctrl+C to cancel, or any key to continue...');

    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });

    // Step 6: Execute cleanup
    console.log('\n🚀 Starting cleanup...\n');

    // Cancel duplicate subscriptions on the kept customer
    if (keepCustomer.activeSubscriptions.length > 1) {
      console.log('📝 Canceling duplicate subscriptions...');
      const sortedSubs = [...keepCustomer.activeSubscriptions].sort((a, b) => b.created - a.created);
      const subsToCancel = sortedSubs.slice(1);
      
      for (const sub of subsToCancel) {
        try {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`   ✅ Canceled subscription: ${sub.id}`);
        } catch (error) {
          console.log(`   ❌ Failed to cancel ${sub.id}: ${error.message}`);
        }
      }
    }

    // Delete duplicate customers (this will also cancel their subscriptions)
    if (customersToRemove.length > 0) {
      console.log('\n🗑️  Deleting duplicate customers...');
      for (const analysis of customersToRemove) {
        try {
          // First cancel all subscriptions
          for (const sub of analysis.activeSubscriptions) {
            try {
              await stripe.subscriptions.cancel(sub.id);
              console.log(`   ✅ Canceled subscription ${sub.id} for customer ${analysis.customer.id}`);
            } catch (error) {
              console.log(`   ⚠️  Failed to cancel subscription ${sub.id}: ${error.message}`);
            }
          }
          
          // Then delete the customer
          await stripe.customers.del(analysis.customer.id);
          console.log(`   ✅ Deleted customer: ${analysis.customer.id}`);
        } catch (error) {
          console.log(`   ❌ Failed to delete customer ${analysis.customer.id}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Cleanup complete!');
    console.log('\n📊 Final verification...');
    
    // Verify cleanup
    const finalCustomers = await stripe.customers.list({
      email: 'bwhite.mail@proton.me',
      limit: 20,
    });

    console.log(`Remaining customers: ${finalCustomers.data.length}`);
    
    if (finalCustomers.data.length === 1) {
      const remainingCustomer = finalCustomers.data[0];
      const remainingSubs = await stripe.subscriptions.list({
        customer: remainingCustomer.id,
        limit: 10,
      });
      
      const activeSubs = remainingSubs.data.filter(s => s.status === 'active');
      console.log(`Customer ${remainingCustomer.id} has ${activeSubs.length} active subscription(s)`);
      
      if (activeSubs.length === 1) {
        console.log('✅ Perfect! You now have exactly 1 customer with 1 active subscription.');
      } else if (activeSubs.length === 0) {
        console.log('⚠️  No active subscriptions remaining. You may need to create a new subscription.');
      } else {
        console.log('⚠️  Still multiple active subscriptions. Manual cleanup may be needed.');
      }
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupStripeDuplicates(); 