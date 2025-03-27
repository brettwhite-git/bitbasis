import { createClient } from '@supabase/supabase-js'

interface CoinMarketCapResponse {
  data: {
    BTC: {
      quote: {
        USD: {
          price: number
        }
      }
    }
  }
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fetchFromCoinMarketCapAPI(): Promise<number> {
  if (!process.env.COINMARKETCAP_API_KEY) {
    throw new Error('CoinMarketCap API key not available')
  }

  const response = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD',
    {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`CoinMarketCap API error: ${response.statusText}`)
  }

  const data = await response.json() as CoinMarketCapResponse
  return data.data.BTC.quote.USD.price
}

export async function getCurrentBitcoinPrice(): Promise<number> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Client-side: Use our API route
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/api/bitcoin/price`)
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price')
      }
      const data = await response.json()
      return data.price
    } else {
      // Server-side: Check cache first
      const { data: cachedPrice, error: cacheError } = await supabase
        .from('bitcoin_prices')
        .select('price_usd, last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()

      if (cachedPrice && !cacheError) {
        const cacheAge = Date.now() - new Date(cachedPrice.last_updated).getTime()
        if (cacheAge < 60000) { // 1 minute cache
          return cachedPrice.price_usd
        }
      }

      // If no valid cache, fetch new price
      const price = await fetchFromCoinMarketCapAPI()

      // Update cache
      await supabase.from('bitcoin_prices').insert({
        date: new Date().toISOString().split('T')[0],
        price_usd: price,
        last_updated: new Date().toISOString()
      })

      return price
    }
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error)
    throw error
  }
}

export async function getAllTimeHigh(): Promise<{ price: number; date: string }> {
  try {
    // Get highest price from our cache
    const { data: ath, error } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, date')
      .order('price_usd', { ascending: false })
      .limit(1)
      .single()

    if (ath && !error) {
      return {
        price: ath.price_usd,
        date: ath.date
      }
    }

    throw new Error('No price data available')
  } catch (error) {
    console.error('Error fetching all-time high:', error)
    throw error
  }
} 