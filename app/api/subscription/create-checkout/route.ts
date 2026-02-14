import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { validateRedirectUrl } from '@/lib/utils/url-validation'
import { sanitizeStripeError } from '@/lib/utils/error-sanitization'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, createRateLimitResponse, RateLimits } from '@/lib/rate-limiting'

export async function POST(request: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json()

    // Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // SEC-011: Validate price ID against known whitelist
    const validPriceIds = [
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      process.env.STRIPE_LIFETIME_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID,
    ].filter(Boolean)

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // SEC-006: Rate limiting per user
    const rateLimitResult = checkRateLimit(
      `checkout:${user.id}`,
      RateLimits.SUBSCRIPTION_OPERATIONS.limit,
      RateLimits.SUBSCRIPTION_OPERATIONS.windowMs
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    // Get or create Stripe customer with race condition handling
    let customerId: string | undefined

    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (customerLookupError && customerLookupError.code !== 'PGRST116') {
      // Unexpected error (not "no rows found")
    }

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id

      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = undefined
      }
    }

    if (!customerId) {
      // Check for existing customers by email to prevent duplicates
      const existingStripeCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existingStripeCustomers.data.length > 0) {
        const existingStripeCustomer = existingStripeCustomers.data[0]
        if (existingStripeCustomer) {
          customerId = existingStripeCustomer.id

          const { error: upsertError } = await supabase
            .from('customers')
            .upsert({
              id: user.id,
              stripe_customer_id: customerId,
            })

          if (upsertError) {
            // Continue anyway - the customer exists in Stripe
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

      const { error: upsertError } = await supabase
        .from('customers')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
        })

      if (upsertError) {
        throw new Error(`Database error: ${upsertError.message}`)
      }
      }
    }

    // Determine mode based on price ID (one-time vs subscription)
    const lifetimePriceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || process.env.STRIPE_LIFETIME_PRICE_ID
    const isLifetime = priceId === lifetimePriceId
    const mode = isLifetime ? 'payment' : 'subscription'

    // Check if user already has a lifetime subscription
    if (isLifetime) {
      const { data: existingLifetime, error: lifetimeCheckError } = await supabase
        .from('subscriptions')
        .select('id, metadata')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('metadata', 'is', null)
        .single()

      if (lifetimeCheckError && lifetimeCheckError.code !== 'PGRST116') {
        // Unexpected error checking lifetime subscription
      }

      if (existingLifetime?.metadata &&
          typeof existingLifetime.metadata === 'object' &&
          'type' in existingLifetime.metadata &&
          existingLifetime.metadata.type === 'lifetime') {
        return NextResponse.json(
          { error: 'You already have a lifetime subscription' },
          { status: 400 }
        )
      }
    }

    // SEC-009: Validate redirect URLs to prevent open redirect attacks
    const safeSuccessUrl = validateRedirectUrl(
      successUrl,
      '/dashboard/success',
      request.nextUrl.origin
    )
    const safeCancelUrl = validateRedirectUrl(
      cancelUrl,
      '/dashboard/cancel',
      request.nextUrl.origin
    )

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
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        user_id: user.id,
        price_id: priceId,
      },
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      }),
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeStripeError(error, 'Failed to create checkout session')

    return NextResponse.json(
      sanitized,
      { status: 500 }
    )
  }
}
