export const config = {
  coinmarketcap: {
    apiKey: process.env.COINMARKETCAP_API_KEY,
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    endpoints: {
      price: '/cryptocurrency/quotes/latest',
      metadata: '/cryptocurrency/info'
    }
  },
  cache: {
    duration: 15 * 60 * 1000, // 15 minutes base duration
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (for all-time high)
    retryDelay: 60 * 1000, // 1 minute retry delay
    priceChangeThresholds: {
      low: 0.005, // 0.5% change - typical intraday movement
      medium: 0.015, // 1.5% change - notable movement
      high: 0.03 // 3% change - significant movement
    },
    adaptiveIntervals: {
      stable: 45 * 60 * 1000, // 45 minutes if very stable
      normal: 20 * 60 * 1000, // 20 minutes if moderately stable
      volatile: 10 * 60 * 1000 // 10 minutes if volatile
    }
  }
} as const

// Only validate environment variables on the server side
if (typeof window === 'undefined' && !config.coinmarketcap.apiKey) {
  throw new Error('COINMARKETCAP_API_KEY environment variable is required')
} 