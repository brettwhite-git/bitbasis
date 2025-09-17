import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import type { Database } from '@/types/supabase'

// Use service role for subscription modifications (like webhooks do)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, cancelOption } = await request.json()

    if (!subscriptionId || !cancelOption) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user authentication using regular client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the subscription belongs to the user using admin client
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      console.error('Subscription lookup error:', subError)
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    console.log('Found subscription:', {
      id: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata
    })

    // Check if this is a lifetime subscription
    const metadata = subscription.metadata as Record<string, unknown> | null
    const isLifetime = metadata?.type === 'lifetime' || 
                      subscription.id.startsWith('lifetime_')

    if (isLifetime) {
      console.log('Cancelling lifetime subscription - updating database only')
      // For lifetime subscriptions, we only update our database (no Stripe subscription to cancel)
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)

      if (updateError) {
        console.error('Error updating lifetime subscription:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        cancelOption,
        message: 'Lifetime subscription cancelled successfully'
      })
    }

    // Handle regular Stripe subscriptions
    console.log('Cancelling regular Stripe subscription:', subscriptionId)

    switch (cancelOption) {
      case 'immediate':
        // Cancel immediately
        await stripe.subscriptions.cancel(subscriptionId)
        break

      case 'period_end':
        // Cancel at period end (default recommended option)
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })
        break

      case 'cleanup':
        // Same as period_end, but user indicated they want to clean up first
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid cancel option' },
          { status: 400 }
        )
    }

    // Update our database record
    const updateData: { 
      cancel_at_period_end: boolean; 
      status?: Database["public"]["Enums"]["subscription_status"]; 
      canceled_at?: string 
    } = {
      cancel_at_period_end: cancelOption === 'period_end' || cancelOption === 'cleanup',
    }

    if (cancelOption === 'immediate') {
      updateData.status = 'canceled'
      updateData.canceled_at = new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
      // Don't fail the request since Stripe was updated successfully
    }

    return NextResponse.json({
      success: true,
      cancelOption,
      cancelAtPeriodEnd: cancelOption !== 'immediate',
      message: cancelOption === 'immediate' 
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at the end of the current billing period'
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 