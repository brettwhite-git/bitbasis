/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function GET() {
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get customer ID from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (customerError || !customer?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Fetch customer info from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customer.stripe_customer_id)
    
    // Fetch all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      limit: 10,
    })

    // Fetch database subscriptions for comparison
    const { data: dbSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      stripe_customer: stripeCustomer,
      stripe_subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        price_id: sub.items.data[0]?.price.id,
        current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        created: new Date(sub.created * 1000).toISOString(),
        cancel_at_period_end: (sub as any).cancel_at_period_end,
        canceled_at: (sub as any).canceled_at ? new Date((sub as any).canceled_at * 1000).toISOString() : null,
      })),
      database_subscriptions: dbSubscriptions || [],
      summary: {
        stripe_subscription_count: subscriptions.data.length,
        database_subscription_count: dbSubscriptions?.length || 0,
        active_stripe_subscriptions: subscriptions.data.filter(s => s.status === 'active').length,
        active_database_subscriptions: dbSubscriptions?.filter(s => s.status === 'active').length || 0,
      }
    })

  } catch (error) {
    console.error('Debug customer info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch customer info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 