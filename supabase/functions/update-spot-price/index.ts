// Supabase Edge Function to update Bitcoin spot price
// Scheduled to run every 10 minutes

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const COINPAPRIKA_API_URL = 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin'

// Main handler function
Deno.serve(async (req: Request) => {
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch current Bitcoin price from Coinpaprika
    console.log('Fetching current Bitcoin price from Coinpaprika')
    const response = await fetch(COINPAPRIKA_API_URL)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    const priceUsd = parseFloat(data.quotes.USD.price)
    
    if (isNaN(priceUsd) || priceUsd <= 0) {
      throw new Error('Invalid price received from API')
    }

    // Round to 2 decimal places
    const price = Math.round(priceUsd * 100) / 100

    // Insert the price into the spot_price table
    const { error } = await supabase
      .from('spot_price')
      .insert({
        price_usd: price,
        source: 'coinpaprika',
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Error inserting price: ${error.message}`)
    }

    // Log the successful update
    console.log(`Updated BTC spot price to ${price} USD`)

    // Clean up old records (keep only the most recent 100)
    const { count } = await supabase
      .from('spot_price')
      .select('*', { count: 'exact', head: true })

    if (count > 100) {
      const { data: oldRecords } = await supabase
        .from('spot_price')
        .select('id')
        .order('updated_at', { ascending: true })
        .limit(count - 100)

      if (oldRecords && oldRecords.length > 0) {
        const oldIds = oldRecords.map(record => record.id)
        await supabase
          .from('spot_price')
          .delete()
          .in('id', oldIds)
      }
    }

    return new Response(
      JSON.stringify({ success: true, price }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error updating spot price:', error.message)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 