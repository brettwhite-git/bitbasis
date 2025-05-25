import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    const config = {
      hasPublishableKey: !!publishableKey && publishableKey !== 'pk_test_YOUR_KEY_HERE',
      hasSecretKey: !!secretKey && secretKey !== 'sk_test_YOUR_KEY_HERE',
      hasWebhookSecret: !!webhookSecret && webhookSecret !== 'whsec_YOUR_WEBHOOK_SECRET_HERE',
      publishableKeyPrefix: publishableKey?.substring(0, 12) + '...',
      secretKeyPrefix: secretKey?.substring(0, 12) + '...',
    }
    
    return NextResponse.json({
      status: 'Stripe configuration check',
      config,
      ready: config.hasPublishableKey && config.hasSecretKey
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Configuration check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 