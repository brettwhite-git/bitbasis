import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

interface CoinPaprikaHistoricalResponse {
  timestamp: string
  price: number
  volume_24h: number
  market_cap: number
}

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchHistoricalPrices(): Promise<CoinPaprikaHistoricalResponse[]> {
  console.log('[Historical Prices] Fetching historical data...')
  
  const response = await fetch(
    'https://api.coinpaprika.com/v1/tickers/btc-bitcoin/historical?start=2024-04-02&interval=30d',
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[Historical Prices] API error details: ${errorBody}`)
    throw new Error(`CoinPaprika API error: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`[Historical Prices] Fetched ${data.length} price points`)
  return data
}

export async function GET() {
  try {
    console.log('[Historical Prices] Starting historical price fetch...')

    // Fetch historical prices
    const historicalPrices = await fetchHistoricalPrices()

    if (!historicalPrices || historicalPrices.length === 0) {
      throw new Error('No historical price data received')
    }

    // Process the data points and prepare for storage
    console.log('[Historical Prices] Processing data...')
    const priceRecords = historicalPrices.map(price => {
      const date = new Date(price.timestamp)
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        price_usd: price.price,
        last_updated: new Date().toISOString()
      }
    })

    console.log(`[Historical Prices] Prepared ${priceRecords.length} records`)

    // For each record, delete any existing entries for that date and insert the new one
    for (const record of priceRecords) {
      // Delete existing records for this date
      const { error: deleteError } = await supabase
        .from('bitcoin_prices')
        .delete()
        .eq('date', record.date)

      if (deleteError) {
        console.error(`[Historical Prices] Error deleting existing record for ${record.date}:`, deleteError)
        continue
      }

      // Insert new record
      const { error: insertError } = await supabase
        .from('bitcoin_prices')
        .insert(record)

      if (insertError) {
        console.error(`[Historical Prices] Error inserting record for ${record.date}:`, insertError)
        continue
      }

      console.log(`[Historical Prices] Successfully processed record for ${record.date}`)
    }

    console.log('[Historical Prices] Successfully stored historical prices')
    return NextResponse.json({
      success: true,
      message: `Successfully stored ${priceRecords.length} price records`,
      data: priceRecords
    })

  } catch (error) {
    console.error('[Historical Prices] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 