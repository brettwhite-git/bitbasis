import { Stripe } from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  appInfo: {
    name: 'BitBasis',
    version: '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bitbasis.io',
  },
}) 