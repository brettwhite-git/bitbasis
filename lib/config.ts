import dotenv from 'dotenv'

dotenv.config()

export const config = {
  app: {
    name: 'BitBasis',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  coinpaprika: {
    baseUrl: 'https://api.coinpaprika.com/v1',
  },
  cache: {
    duration: 10 * 60 * 1000, // 10 minutes default cache
    retryDelay: 5 * 60 * 1000, // 5 minutes retry on error
    priceChangeThresholds: {
      low: 0.005, // 0.5%
      medium: 0.015, // 1.5%
    },
    adaptiveIntervals: {
      stable: 45 * 60 * 1000, // 45 minutes
      normal: 20 * 60 * 1000, // 20 minutes
      volatile: 10 * 60 * 1000, // 10 minutes
    },
  },
}

// Runtime validation (optional but recommended for critical vars)
if (typeof window === 'undefined') {
  if (!config.supabase.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }
  if (!config.supabase.anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  }
  if (!config.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }
} 