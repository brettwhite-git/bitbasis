import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import Stripe from 'stripe'

// Use service role key for webhook processing (bypasses RLS)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Map Stripe subscription statuses to our database enum
function mapStripeStatusToDbStatus(stripeStatus: Stripe.Subscription.Status): Database["public"]["Enums"]["subscription_status"] {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
      return 'incomplete'
    case 'incomplete_expired':
      return 'incomplete_expired'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
      return 'unpaid'
    case 'paused':
      return 'active' // Map paused to active since we don't have paused status
    default:
      return 'active' // Default fallback
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(request: NextRequest) {
  console.log('🔔 WEBHOOK RECEIVED - START')
  console.log('Timestamp:', new Date().toISOString())
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('Body length:', body.length)
  console.log('Has signature:', !!signature)
  console.log('Webhook secret configured:', !!webhookSecret)

  if (!signature || !webhookSecret) {
    console.error('❌ Missing Stripe signature or webhook secret')
    return NextResponse.json(
      { error: 'Missing Stripe signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Webhook signature verified successfully')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  if (!relevantEvents.has(event.type)) {
    console.log(`⏭️ Ignoring irrelevant event: ${event.type}`)
    return NextResponse.json({ received: true })
  }

  console.log(`🎯 Processing relevant event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('📝 Handling checkout.session.completed')
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('📝 Handling subscription update/create')
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        console.log('📝 Handling subscription deletion')
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        console.log('📝 Handling invoice payment succeeded')
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        console.log('📝 Handling invoice payment failed')
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processing completed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`❌ Error processing webhook event ${event.type}:`, error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 Processing checkout session completed:', session.id)
  console.log('Session mode:', session.mode)
  console.log('Session metadata:', session.metadata)
  console.log('Session customer:', session.customer)
  console.log('Session subscription:', session.subscription)

  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('❌ No user_id in checkout session metadata')
    console.error('Available metadata keys:', Object.keys(session.metadata || {}))
    return
  }

  console.log('✅ Found user_id in metadata:', userId)

  // Handle different modes
  if (session.mode === 'payment') {
    console.log('💰 Processing one-time payment (Lifetime)')
    await handleLifetimePayment(session, userId)
  } else if (session.mode === 'subscription') {
    console.log('🔄 Processing subscription payment (Pro Monthly)')
    await handleSubscriptionPayment(session, userId)
  } else {
    console.error('❌ Unknown session mode:', session.mode)
  }
}

async function handleLifetimePayment(session: Stripe.Checkout.Session, userId: string) {
  console.log('Processing lifetime payment for user:', userId)

  // First, cancel any existing active subscriptions for this user
  try {
    console.log('Looking for existing active subscriptions to cancel...')
    
    // Get existing active subscriptions from our database
    const { data: existingSubscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
    
    if (fetchError) {
      console.error('Error fetching existing subscriptions:', fetchError)
    } else if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log(`Found ${existingSubscriptions.length} existing subscriptions to cancel`)
      
      // Cancel each subscription in Stripe
      for (const sub of existingSubscriptions) {
        try {
          console.log(`Canceling subscription: ${sub.id}`)
          await stripe.subscriptions.cancel(sub.id)
          console.log(`Successfully canceled subscription: ${sub.id}`)
        } catch (cancelError) {
          console.error(`Error canceling subscription ${sub.id}:`, cancelError)
          // Continue with other subscriptions even if one fails
        }
      }
    } else {
      console.log('No existing active subscriptions found')
    }
  } catch (error) {
    console.error('Error handling existing subscriptions:', error)
    // Continue with lifetime creation even if cancellation fails
  }

  // Create a special "lifetime" subscription record
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      id: `lifetime_${userId}`, // Custom ID for lifetime subscriptions
      user_id: userId,
      status: 'active',
      metadata: {
        type: 'lifetime',
        checkout_session_id: session.id,
        payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      },
      price_id: session.metadata?.price_id || null,
      quantity: 1,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date('2099-12-31').toISOString(), // Far future date
      created: new Date().toISOString(),
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
    })

  if (error) {
    console.error('Error creating lifetime subscription:', error)
    throw error
  }

  console.log('Lifetime subscription created successfully for user:', userId)
}

async function handleSubscriptionPayment(session: Stripe.Checkout.Session, userId: string) {
  console.log('Processing subscription payment for user:', userId)

  if (!session.subscription) {
    console.error('No subscription ID in checkout session')
    return
  }

  // Fetch the subscription from Stripe to get full details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  await handleSubscriptionUpdate(subscription)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id)
  console.log('Subscription metadata:', subscription.metadata)

  let userId = subscription.metadata?.user_id
  
  // If no user_id in subscription metadata, try to get it from the customer
  if (!userId) {
    console.log('No user_id in subscription metadata, looking up customer...')
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (customer && !customer.deleted) {
        userId = customer.metadata?.supabase_user_id
        console.log('Found user_id from customer metadata:', userId)
      }
    } catch (error) {
      console.error('Error retrieving customer:', error)
    }
  }

  if (!userId) {
    console.error('No user_id found in subscription or customer metadata for subscription:', subscription.id)
    
    // Try to find user by customer ID in our database
    try {
      const { data: customerRecord } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single()
      
      if (customerRecord) {
        userId = customerRecord.id
        console.log('Found user_id from database customer record:', userId)
      } else {
        console.error('No customer record found for stripe customer:', subscription.customer)
        return
      }
    } catch (dbError) {
      console.error('Error looking up customer in database:', dbError)
      return
    }
  }

  const priceId = subscription.items.data[0]?.price.id

  console.log('Attempting to upsert subscription with data:', {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: priceId,
  })

  // Add detailed logging before database operation
  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: mapStripeStatusToDbStatus(subscription.status),
    metadata: subscription.metadata || {},
    price_id: priceId,
    quantity: subscription.items.data[0]?.quantity || 1,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    current_period_start: subscription.current_period_start 
      ? new Date(subscription.current_period_start * 1000).toISOString() 
      : new Date().toISOString(),
    current_period_end: subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created: subscription.created 
      ? new Date(subscription.created * 1000).toISOString() 
      : new Date().toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  }

  console.log('💾 Attempting to upsert subscription with data:', JSON.stringify(subscriptionData, null, 2))

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData)

  if (error) {
    console.error('Error updating subscription:', error)
    console.error('Subscription data that failed:', {
      id: subscription.id,
      user_id: userId,
      status: subscription.status,
      price_id: priceId,
    })
    throw error
  }

  console.log('Subscription updated successfully:', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
      canceled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  if (error) {
    console.error('Error marking subscription as deleted:', error)
    throw error
  }

  console.log('Subscription marked as canceled:', subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing successful invoice payment:', invoice.id)

  if ('subscription' in invoice && invoice.subscription) {
    // Fetch and update the subscription status
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionUpdate(subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing failed invoice payment:', invoice.id)
  console.log('Invoice details:', {
    id: invoice.id,
    subscription: 'subscription' in invoice ? invoice.subscription : null,
    customer: invoice.customer,
    amount_due: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt,
  })

  if ('subscription' in invoice && invoice.subscription) {
    // Fetch and update the subscription status
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionUpdate(subscription)

    // Get user ID for notification/logging
    let userId = subscription.metadata?.user_id
    if (!userId) {
      try {
        const { data: customerRecord } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()
        
        if (customerRecord) {
          userId = customerRecord.id
        }
      } catch (error) {
        console.error('Error finding user for failed payment:', error)
      }
    }

    // Log the payment failure for potential follow-up
    if (userId) {
      console.log(`Payment failed for user ${userId}, subscription ${subscription.id}`)
      
      // Here you could:
      // 1. Send email notification to user
      // 2. Create a record in a "payment_failures" table
      // 3. Set up retry logic
      // 4. Trigger dunning management
      
      // For now, we'll just log it comprehensively
      console.log('Payment failure details:', {
        userId,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count,
        subscriptionStatus: subscription.status,
        nextAttempt: invoice.next_payment_attempt,
      })

      // If this is the final attempt, the subscription will be marked as past_due or canceled
      if (subscription.status === 'past_due' || subscription.status === 'canceled') {
        console.log(`Subscription ${subscription.id} is now ${subscription.status} due to payment failure`)
        
        // You could implement additional logic here:
        // - Grace period handling
        // - Downgrade to free tier
        // - Send recovery email
      }
    }
  }
} 