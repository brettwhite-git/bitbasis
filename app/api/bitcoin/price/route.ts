import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CoinPaprikaResponse {
  quotes: {
    USD: {
      price: number
      ath_price: number
      ath_date: string
    }
  }
}

async function fetchFromCoinPaprika(): Promise<{ price: number; ath: { price: number; date: string } }> {
  const response = await fetch(
    'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
    {
      headers: {
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Coinpaprika API error: ${response.statusText}`)
  }

  const data = await response.json() as CoinPaprikaResponse
  return {
    price: data.quotes.USD.price,
    ath: {
      price: data.quotes.USD.ath_price,
      date: data.quotes.USD.ath_date
    }
  }
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
  // 2. It's been more than 30 minutes since last storage
  if (
    priceChange > 0.02 || // Store if absolute change is > 2%
    timeSinceLastStore > 30 * 60 * 1000 // Or store if > 30 minutes since last store
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
      .select('price_usd, last_updated, ath_price, ath_date')
      .order('last_updated', { ascending: false })
      .limit(2)
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
            ath: {
              price: latestPrice.ath_price,
              date: latestPrice.ath_date
            },
            cached: true,
            cacheAge,
            nextUpdate: nextUpdateInterval - cacheAge
          })
        }
      } else if (cacheAge < config.cache.duration) {
        return NextResponse.json({ 
          price: latestPrice.price_usd,
          ath: {
            price: latestPrice.ath_price,
            date: latestPrice.ath_date
          },
          cached: true,
          cacheAge
        })
      }
    }

    // If cache miss or expired, fetch new price from Coinpaprika
    const { price, ath } = await fetchFromCoinPaprika()

    // Store the newly fetched price
    try {
      await supabase
        .from('bitcoin_prices')
        .insert({
          date: new Date().toISOString().split('T')[0],
          price_usd: price,
          last_updated: new Date().toISOString(),
          ath_price: ath.price,
          ath_date: ath.date
        })
        .throwOnError()
      console.log(`[API /bitcoin/price] Stored new price: ${price} and ATH: ${ath.price}`)
    } catch (dbError) {
      console.error('[API /bitcoin/price] Failed to store fetched price:', dbError)
    }

    return NextResponse.json({ 
      price,
      ath,
      cached: false
    })
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error)
    
    // If error occurs, try to return most recent cached price
    try {
      const { data: lastPrice } = await supabase
        .from('bitcoin_prices')
        .select('price_usd, last_updated, ath_price, ath_date')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()
        .throwOnError()
      
      if (lastPrice) {
        const cacheAge = Date.now() - new Date(lastPrice.last_updated).getTime()
        return NextResponse.json({ 
          price: lastPrice.price_usd,
          ath: {
            price: lastPrice.ath_price,
            date: lastPrice.ath_date
          },
          cached: true,
          cacheAge,
          error: error instanceof Error ? error.message : 'Unknown error',
          nextUpdate: config.cache.retryDelay
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