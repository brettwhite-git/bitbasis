import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    // Get authenticated user
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please make sure you are logged in to BitBasis',
        authError: authError?.message 
      }, { status: 401 })
    }

    console.log('Debug: User authenticated:', user.id, user.email)

    // Get customer ID from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    console.log('Debug: Customer lookup result:', { customer, customerError })

    if (customerError || !customer?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer found',
        user: { id: user.id, email: user.email },
        customerError: customerError?.message 
      }, { status: 404 })
    }

    // Fetch all subscriptions for this customer from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      limit: 10,
    })

    console.log('Debug: Stripe subscriptions found:', subscriptions.data.length)

    // Fetch database subscriptions for comparison
    const { data: dbSubscriptions, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    console.log('Debug: Database subscriptions found:', dbSubscriptions?.length || 0)

    // Format the response
    const stripeSubsFormatted = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      price_id: sub.items.data[0]?.price.id,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      created: new Date(sub.created * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    }))

    return NextResponse.json({
      status: 'SUCCESS',
      user: {
        id: user.id,
        email: user.email,
      },
      stripe_customer_id: customer.stripe_customer_id,
      stripe_subscriptions: stripeSubsFormatted,
      database_subscriptions: dbSubscriptions || [],
      summary: {
        stripe_subscription_count: subscriptions.data.length,
        database_subscription_count: dbSubscriptions?.length || 0,
        active_stripe_subscriptions: subscriptions.data.filter(s => s.status === 'active').length,
        active_database_subscriptions: dbSubscriptions?.filter(s => s.status === 'active').length || 0,
        discrepancy: subscriptions.data.length !== (dbSubscriptions?.length || 0)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug subscription status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 