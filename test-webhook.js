const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  console.log('🧪 Testing Stripe webhook integration...');
  
  const userId = 'dad8fa50-ecf4-45fc-99bc-92184646655a'; // Your test user ID
  
  try {
    // Create a test checkout session
    console.log('📝 Creating test checkout session...');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // Test lifetime purchase
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Lifetime Subscription',
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/dashboard/success',
      cancel_url: 'http://localhost:3000/dashboard/cancel',
      metadata: {
        user_id: userId,
        price_id: 'test_lifetime_price',
      },
    });

    console.log('✅ Test session created:', session.id);
    console.log('🔗 Session URL:', session.url);
    
    // Simulate completing the checkout
    console.log('📝 Simulating checkout completion...');
    
    // Create a test event
    const testEvent = {
      id: 'evt_test_' + Date.now(),
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: session.id,
          mode: 'payment',
          customer: 'cus_test_customer',
          metadata: {
            user_id: userId,
            price_id: 'test_lifetime_price',
          },
          payment_intent: 'pi_test_payment_intent',
        }
      }
    };

    // Send the webhook to your local endpoint
    console.log('📡 Sending webhook to local endpoint...');
    const response = await fetch('http://localhost:3000/api/subscription/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature', // This will fail signature verification, but we can see the logs
      },
      body: JSON.stringify(testEvent),
    });

    console.log('📊 Webhook response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Webhook response:', responseText);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhook(); 