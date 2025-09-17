import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE CHECKOUT SESSION START ===')
    const { priceId, successUrl, cancelUrl } = await request.json()
    console.log('Request body:', { priceId, successUrl, cancelUrl })

    // Validate required fields
    if (!priceId) {
      console.log('ERROR: Missing price ID')
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }
    console.log('✅ Price ID validation passed')

    // Get authenticated user
    console.log('📝 Getting authenticated user...')
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    console.log('✅ User authenticated:', user.id)

    // Get or create Stripe customer with better race condition handling
    console.log('💳 Getting/creating Stripe customer...')
    let customerId: string | undefined

    // First, check if user already has a Stripe customer ID
    console.log('🔍 Checking for existing customer in database...')
    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (customerLookupError) {
      console.log('⚠️ Customer lookup error (might be expected for new users):', customerLookupError.message)
    }

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
      console.log('✅ Found existing customer:', customerId)
      
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
        console.log('✅ Customer verified in Stripe')
      } catch {
        console.log('⚠️ Customer not found in Stripe, will create new one')
        customerId = undefined
      }
    }

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer...')
      
      // Before creating, do one more check for existing customers by email
      // This helps prevent duplicates from race conditions
      console.log('🔍 Checking Stripe for existing customer by email...')
      const existingStripeCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existingStripeCustomers.data.length > 0) {
        const existingStripeCustomer = existingStripeCustomers.data[0]
        if (existingStripeCustomer) {
          console.log('✅ Found existing Stripe customer by email:', existingStripeCustomer.id)
          customerId = existingStripeCustomer.id

          // Update our database with this customer ID
          console.log('💾 Updating database with existing Stripe customer...')
          const { error: upsertError } = await supabase
            .from('customers')
            .upsert({
              id: user.id,
              stripe_customer_id: customerId,
            })
          
          if (upsertError) {
            console.log('⚠️ Failed to update customer in database:', upsertError.message)
            // Continue anyway - the customer exists in Stripe
          } else {
            console.log('✅ Database updated with existing customer')
          }
        }
      } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id
      console.log('✅ Created new Stripe customer:', customerId)

      // Save customer ID to database
      console.log('💾 Saving customer to database...')
      const { error: upsertError } = await supabase
        .from('customers')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
        })
      
      if (upsertError) {
        console.log('❌ Failed to save customer to database:', upsertError.message)
        throw new Error(`Database error: ${upsertError.message}`)
      }
      console.log('✅ Customer saved to database')
      }
    }

    // Debug environment variables
    console.log('Server-side environment check:')
    console.log('NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID)
    console.log('STRIPE_LIFETIME_PRICE_ID:', process.env.STRIPE_LIFETIME_PRICE_ID)
    console.log('Received priceId:', priceId)
    
    // Determine mode based on price ID (one-time vs subscription)
    // Try both environment variable patterns
    const lifetimePriceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || process.env.STRIPE_LIFETIME_PRICE_ID
    const isLifetime = priceId === lifetimePriceId
    const mode = isLifetime ? 'payment' : 'subscription'
    
    console.log('Lifetime price ID from env:', lifetimePriceId)
    console.log('Is lifetime purchase:', isLifetime)
    console.log('Checkout mode:', mode)

    // Check if user already has a lifetime subscription
    if (isLifetime) {
      console.log('🔍 Checking for existing lifetime subscription...')
      const { data: existingLifetime, error: lifetimeCheckError } = await supabase
        .from('subscriptions')
        .select('id, metadata')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('metadata', 'is', null)
        .single()

      if (lifetimeCheckError && lifetimeCheckError.code !== 'PGRST116') {
        console.log('⚠️ Error checking for lifetime subscription:', lifetimeCheckError.message)
      }

      if (existingLifetime?.metadata && 
          typeof existingLifetime.metadata === 'object' && 
          'type' in existingLifetime.metadata && 
          existingLifetime.metadata.type === 'lifetime') {
        console.log('❌ User already has lifetime subscription:', existingLifetime.id)
        return NextResponse.json(
          { error: 'You already have a lifetime subscription' },
          { status: 400 }
        )
      }
      console.log('✅ No existing lifetime subscription found')
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${request.nextUrl.origin}/dashboard/success`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/dashboard/cancel`,
      allow_promotion_codes: true,
      // Disable automatic tax in development mode
      ...(process.env.NODE_ENV === 'production' && {
        automatic_tax: {
          enabled: true,
        },
      }),
      metadata: {
        user_id: user.id,
        price_id: priceId,
      },
      // For subscription mode, add additional configuration
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      }),
    })

    console.log('✅ Checkout session created:', session.id)
    console.log('🔗 Checkout URL:', session.url)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 