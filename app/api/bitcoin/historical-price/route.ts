import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CoinPaprikaHistoricalResponse {
  timestamp: string
  price: number
  volume_24h: number
  market_cap: number
}

async function fetchHistoricalPrices(start: string, end: string): Promise<CoinPaprikaHistoricalResponse[]> {
  const response = await fetch(
    `https://api.coinpaprika.com/v1/coins/btc-bitcoin/ohlcv/historical?start=${start}&end=${end}`,
    {
      headers: {
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Coinpaprika API error: ${response.statusText}`)
  }

  return response.json()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')
    
    // Calculate date range
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - months)

    // Format dates for API
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from('bitcoin_prices')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })

    // If we have enough cached data, return it
    if (cachedPrices && cachedPrices.length > 0) {
      const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (cachedPrices.length >= daysBetween * 0.9) { // 90% coverage threshold
        return NextResponse.json({
          prices: cachedPrices,
          cached: true
        })
      }
    }

    // Fetch new data from CoinPaprika
    const historicalPrices = await fetchHistoricalPrices(startStr, endStr)

    // Store new prices in database
    const newPrices = historicalPrices.map(price => ({
      date: price.timestamp.split('T')[0],
      price_usd: price.price,
      last_updated: new Date().toISOString()
    }))

    // Batch insert new prices
    const { error: insertError } = await supabase
      .from('bitcoin_prices')
      .upsert(newPrices, {
        onConflict: 'date',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('Error storing historical prices:', insertError)
    }

    return NextResponse.json({
      prices: newPrices,
      cached: false
    })
  } catch (error) {
    console.error('Error fetching historical Bitcoin prices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 