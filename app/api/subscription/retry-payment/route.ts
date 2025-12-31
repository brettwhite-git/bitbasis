import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { sanitizeStripeError } from '@/lib/utils/error-sanitization'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get the latest invoice for this subscription
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 1,
      status: 'open', // Only get unpaid invoices
    })

    if (invoices.data.length === 0) {
      return NextResponse.json(
        { error: 'No unpaid invoices found' },
        { status: 404 }
      )
    }

    const invoice = invoices.data[0]
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    try {
      // Attempt to pay the invoice
      const paidInvoice = await stripe.invoices.pay(invoice.id!)

      return NextResponse.json({
        success: true,
        invoice: {
          id: paidInvoice.id,
          status: paidInvoice.status,
          amount_paid: paidInvoice.amount_paid,
        },
        message: 'Payment successful'
      })

    } catch (paymentError: unknown) {
      // Payment failed - return specific error
      console.error('Payment retry failed:', paymentError)

      let errorMessage = 'Payment failed'
      if (paymentError && typeof paymentError === 'object' && 'code' in paymentError) {
        const stripeError = paymentError as { code: string }
        if (stripeError.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please update your payment method.'
        } else if (stripeError.code === 'insufficient_funds') {
          errorMessage = 'Insufficient funds. Please check your account balance.'
        } else if (stripeError.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please update your payment method.'
        }
      }

      const stripeError = paymentError && typeof paymentError === 'object' ? paymentError as { code?: string; decline_code?: string } : {}
      return NextResponse.json(
        { 
          error: errorMessage,
          code: stripeError.code,
          decline_code: stripeError.decline_code,
        },
        { status: 402 } // Payment Required
      )
    }

  } catch (error) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeStripeError(error, 'Failed to retry payment')
    
    return NextResponse.json(
      sanitized,
      { status: 500 }
    )
  }
} 