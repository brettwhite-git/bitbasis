const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkDuplicateCustomers() {
  try {
    console.log('🔍 Checking for duplicate customers with email: bwhite.mail@proton.me\n');
    
    // Get all customers with this email
    const customers = await stripe.customers.list({
      email: 'bwhite.mail@proton.me',
      limit: 20,
    });

    console.log(`📊 Found ${customers.data.length} customer(s) with this email:\n`);

    for (let i = 0; i < customers.data.length; i++) {
      const customer = customers.data[i];
      console.log(`--- Customer ${i + 1} ---`);
      console.log(`ID: ${customer.id}`);
      console.log(`Email: ${customer.email}`);
      console.log(`Created: ${new Date(customer.created * 1000).toISOString()}`);
      console.log(`Metadata:`, customer.metadata);
      
      // Check subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });
      
      console.log(`Subscriptions: ${subscriptions.data.length}`);
      if (subscriptions.data.length > 0) {
        subscriptions.data.forEach((sub, index) => {
          console.log(`  - ${sub.id} (${sub.status}) - $${(sub.items.data[0]?.price.unit_amount || 0) / 100}`);
        });
      }
      console.log('');
    }

    // Summary
    const totalSubscriptions = await Promise.all(
      customers.data.map(async (customer) => {
        const subs = await stripe.subscriptions.list({ customer: customer.id });
        return subs.data.length;
      })
    );

    const totalSubCount = totalSubscriptions.reduce((sum, count) => sum + count, 0);
    const activeCustomers = customers.data.filter(c => !c.deleted);

    console.log('📈 Summary:');
    console.log(`- Total customers: ${customers.data.length}`);
    console.log(`- Active customers: ${activeCustomers.length}`);
    console.log(`- Total subscriptions across all customers: ${totalSubCount}`);
    console.log(`- Customer in our database: cus_SMp75N8e3deI2w`);

    // Check which customer is in our database
    const dbCustomer = customers.data.find(c => c.id === 'cus_SMp75N8e3deI2w');
    if (dbCustomer) {
      console.log(`✅ Database customer found in Stripe`);
    } else {
      console.log(`❌ Database customer NOT found in Stripe results`);
    }

    if (customers.data.length > 1) {
      console.log('\n⚠️  MULTIPLE CUSTOMERS DETECTED!');
      console.log('This indicates a serious issue with customer creation logic.');
      console.log('Each checkout/upgrade attempt is creating a new customer instead of reusing the existing one.');
    }

  } catch (error) {
    console.error('❌ Error checking duplicate customers:', error.message);
  }
}

checkDuplicateCustomers(); 