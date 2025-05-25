import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    console.log('=== STRIPE DEBUG START ===')
    
    // Test 1: Check environment variables
    const envVars = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
      STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'MISSING',
      STRIPE_LIFETIME_PRICE_ID: process.env.STRIPE_LIFETIME_PRICE_ID || 'MISSING',
      NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'MISSING',
      NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || 'MISSING',
    }
    
    console.log('Environment Variables:', envVars)
    
    // Test 2: Check Stripe connection
    let stripeTest = 'NOT_TESTED'
    try {
      const account = await stripe.accounts.retrieve()
      stripeTest = `SUCCESS - Account: ${account.id}`
      console.log('Stripe connection successful:', account.id)
    } catch (stripeError) {
      stripeTest = `ERROR - ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
      console.error('Stripe connection failed:', stripeError)
    }
    
    // Test 3: Check specific price IDs
    const priceTests = {}
    const priceIds = [
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      process.env.STRIPE_LIFETIME_PRICE_ID,
    ].filter(Boolean)
    
    for (const priceId of priceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId!)
        priceTests[priceId!] = `SUCCESS - ${price.nickname || price.id}`
        console.log(`Price ${priceId} found:`, price.nickname || price.id)
      } catch (priceError) {
        priceTests[priceId!] = `ERROR - ${priceError instanceof Error ? priceError.message : 'Unknown'}`
        console.error(`Price ${priceId} failed:`, priceError)
      }
    }
    
    console.log('=== STRIPE DEBUG END ===')
    
    return NextResponse.json({
      status: 'Stripe Debug Complete',
      environmentVariables: envVars,
      stripeConnection: stripeTest,
      priceValidation: priceTests,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 