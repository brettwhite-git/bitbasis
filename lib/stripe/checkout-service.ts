import { getStripe } from '@/lib/stripe-client'

export interface CheckoutOptions {
  priceId: string
  successUrl?: string
  cancelUrl?: string
}

export interface PortalOptions {
  returnUrl?: string
}

// Global state to prevent multiple simultaneous checkout sessions
let isCreatingCheckout = false
let lastCheckoutTime = 0
const CHECKOUT_COOLDOWN = 3000 // 3 seconds between checkout attempts

export class CheckoutService {
  /**
   * Create a checkout session and redirect to Stripe
   */
  static async createCheckoutSession(options: CheckoutOptions): Promise<void> {
    // Prevent multiple rapid checkout attempts
    const now = Date.now()
    if (isCreatingCheckout) {
      console.log('Checkout already in progress, ignoring request')
      throw new Error('Checkout session creation already in progress')
    }

    if (now - lastCheckoutTime < CHECKOUT_COOLDOWN) {
      console.log('Checkout cooldown active, please wait')
      throw new Error('Please wait a moment before creating another checkout session')
    }

    isCreatingCheckout = true
    lastCheckoutTime = now

    try {
      console.log('Creating checkout session with options:', options)
      
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      console.log('Checkout session created successfully:', result.sessionId)

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe is not loaded')
      }

      console.log('Redirecting to Stripe checkout...')
      const { error } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }

      // If we reach here, redirect was successful
      console.log('Stripe redirect initiated successfully')
      
    } catch (error) {
      console.error('Checkout error:', error)
      isCreatingCheckout = false // Reset on error
      throw error
    }
    // Note: Don't reset isCreatingCheckout on success - user will be redirected
  }

  /**
   * Reset checkout state (for testing or error recovery)
   */
  static resetCheckoutState(): void {
    isCreatingCheckout = false
    lastCheckoutTime = 0
    console.log('Checkout state reset')
  }

  /**
   * Open the customer portal for subscription management
   */
  static async openCustomerPortal(options: PortalOptions = {}): Promise<void> {
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create portal session')
      }

      // Redirect to customer portal
      window.location.href = result.url
    } catch (error) {
      console.error('Portal error:', error)
      throw error
    }
  }

  /**
   * Get price IDs from environment
   */
  static getPriceIds() {
    return {
      proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      lifetime: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID,
    }
  }

  /**
   * Start Pro Monthly checkout
   */
  static async upgradeToProMonthly(options: Omit<CheckoutOptions, 'priceId'> = {}): Promise<void> {
    const priceIds = this.getPriceIds()
    
    if (!priceIds.proMonthly) {
      throw new Error('Pro Monthly price ID is not configured')
    }

    return this.createCheckoutSession({
      ...options,
      priceId: priceIds.proMonthly,
    })
  }

  /**
   * Start Lifetime checkout
   */
  static async upgradeToLifetime(options: Omit<CheckoutOptions, 'priceId'> = {}): Promise<void> {
    const priceIds = this.getPriceIds()
    
    if (!priceIds.lifetime) {
      throw new Error('Lifetime price ID is not configured')
    }

    return this.createCheckoutSession({
      ...options,
      priceId: priceIds.lifetime,
    })
  }
} 