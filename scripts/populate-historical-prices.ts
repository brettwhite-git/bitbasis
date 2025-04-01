import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

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

async function fetchHistoricalPrices(): Promise<CoinPaprikaHistoricalResponse[]> {
  console.log('Fetching historical prices...')
  
  // Using the exact curl command structure that worked
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
    console.error(`API error details: ${errorBody}`)
    throw new Error(`CoinPaprika API error: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`Fetched ${data.length} price points`)
  return data
}

async function populateHistoricalPrices() {
  try {
    console.log('Starting historical price population...')

    // Fetch historical prices using the working curl structure
    const historicalPrices = await fetchHistoricalPrices()

    if (!historicalPrices || historicalPrices.length === 0) {
      throw new Error('No historical price data received')
    }

    // Process the data points and prepare for storage
    const priceRecords = historicalPrices.map(price => {
      const date = new Date(price.timestamp)
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
        price_usd: price.price,
        last_updated: new Date().toISOString()
      }
    })

    console.log(`Prepared ${priceRecords.length} price records`)
    console.log('Price records:', priceRecords)

    // Store in database
    console.log('Storing prices in database...')
    const { error: insertError } = await supabase
      .from('bitcoin_prices')
      .upsert(priceRecords, {
        onConflict: 'date',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('Error storing prices:', insertError)
      throw insertError
    }

    console.log('Successfully stored historical prices')
    console.log(`Total records: ${priceRecords.length}`)

  } catch (error) {
    console.error('Error in historical price population:', error)
  }
}

// Run once
populateHistoricalPrices() 