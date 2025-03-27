import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

async function fetchFromCoinMarketCap(): Promise<number> {
  const response = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD',
    {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY!,
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

function determineNextUpdateInterval(priceChange: number): number {
  const { priceChangeThresholds, adaptiveIntervals } = config.cache

  if (priceChange <= priceChangeThresholds.low) {
    return adaptiveIntervals.stable // Very stable - check every 45 minutes
  } else if (priceChange <= priceChangeThresholds.medium) {
    return adaptiveIntervals.normal // Moderately stable - check every 20 minutes
  } else {
    return adaptiveIntervals.volatile // Volatile - check every 10 minutes
  }
}

async function shouldStorePrice(newPrice: number, latestPrice?: { price_usd: number, last_updated: string }): Promise<boolean> {
  if (!latestPrice) return true

  const priceChange = Math.abs(newPrice - latestPrice.price_usd) / latestPrice.price_usd
  const timeSinceLastStore = Date.now() - new Date(latestPrice.last_updated).getTime()
  
  // Store if:
  // 1. Price change is significant (> 0.5%)
  // 2. It's been more than 1 hour since last storage
  // 3. New all-time high
  if (
    priceChange > config.cache.priceChangeThresholds.low ||
    timeSinceLastStore > 60 * 60 * 1000 || // 1 hour
    newPrice > latestPrice.price_usd
  ) {
    return true
  }

  return false
}

export async function GET() {
  try {
    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, last_updated')
      .order('last_updated', { ascending: false })
      .limit(2) // Get last 2 prices to check rate of change
      .throwOnError()

    const latestPrice = cachedPrices?.[0]
    const previousPrice = cachedPrices?.[1]

    if (latestPrice) {
      const cacheAge = Date.now() - new Date(latestPrice.last_updated).getTime()
      
      if (previousPrice) {
        const priceChange = Math.abs(latestPrice.price_usd - previousPrice.price_usd) / previousPrice.price_usd
        const nextUpdateInterval = determineNextUpdateInterval(priceChange)
        
        if (cacheAge < nextUpdateInterval) {
          return NextResponse.json({ 
            price: latestPrice.price_usd,
            cached: true,
            cacheAge,
            nextUpdate: nextUpdateInterval - cacheAge
          })
        }
      } else if (cacheAge < config.cache.duration) {
        return NextResponse.json({ 
          price: latestPrice.price_usd,
          cached: true,
          cacheAge
        })
      }
    }

    // If cache miss or expired, fetch new price
    const price = await fetchFromCoinMarketCap()

    // Only store the price if it meets our storage criteria
    if (await shouldStorePrice(price, latestPrice)) {
      await supabase
        .from('bitcoin_prices')
        .insert({
          date: new Date().toISOString().split('T')[0],
          price_usd: price,
          last_updated: new Date().toISOString()
        })
        .throwOnError()
    }

    // Return the new price regardless of whether we stored it
    return NextResponse.json({ 
      price,
      cached: false,
      nextUpdate: config.cache.duration
    })
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error)
    
    // If error occurs, try to return most recent cached price
    try {
      const { data: lastPrice } = await supabase
        .from('bitcoin_prices')
        .select('price_usd, last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()
        .throwOnError()
      
      if (lastPrice) {
        const cacheAge = Date.now() - new Date(lastPrice.last_updated).getTime()
        return NextResponse.json({ 
          price: lastPrice.price_usd,
          cached: true,
          cacheAge,
          error: error instanceof Error ? error.message : 'Unknown error',
          nextUpdate: config.cache.retryDelay // Use retry delay for next update
        })
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback price:', fallbackError)
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 