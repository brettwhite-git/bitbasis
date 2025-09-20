import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasProMonthlyPrice: !!process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    hasLifetimePrice: !!process.env.STRIPE_LIFETIME_PRICE_ID,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    // Don't expose actual values, just check if they exist
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
    timestamp: new Date().toISOString()
  })
}
