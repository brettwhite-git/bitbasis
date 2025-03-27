// Load environment variables first
import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '.env.local') })

// Then import our modules
import { getCurrentBitcoinPrice } from '../lib/coinmarketcap'
import { createClient } from '@supabase/supabase-js'
import { config as configLib } from '../lib/config'

const API_KEY = '5ea0dc16-fa7c-4bae-9467-d8621691e3a8'
const SUPABASE_URL = 'https://npcvbxrshuflujcnikon.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3ZieHJzaHVmbHVqY25pa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTgxNTQsImV4cCI6MjA1NzU3NDE1NH0.Hya3qaRopTxcWIhLV_tEgWZonGWay2xgltJE7h4SVmA'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testPrice() {
  try {
    console.log('1. Fetching Bitcoin price from CoinMarketCap...')
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
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    const price = data.data.BTC.quote.USD.price
    console.log(`Current BTC price: $${price.toLocaleString()}`)
    
    // Insert price into Supabase
    console.log('\n2. Inserting price into Supabase...')
    const { data: insertData, error: insertError } = await supabase
      .from('bitcoin_prices')
      .insert({
        date: new Date().toISOString().split('T')[0],
        price_usd: price,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert price: ${insertError.message}`)
    }
    console.log('Successfully cached price in Supabase')

    // Verify the cached price
    console.log('\n3. Verifying cached price...')
    const { data: cachedData, error: fetchError } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch cached price: ${fetchError.message}`)
    }

    console.log(`Cached price: $${cachedData.price_usd.toLocaleString()}`)
    console.log(`Last updated: ${new Date(cachedData.last_updated).toLocaleString()}`)

  } catch (error) {
    console.error('\nError:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    process.exit(1)
  }
}

// Run the test
testPrice() 