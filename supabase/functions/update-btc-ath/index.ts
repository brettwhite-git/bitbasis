// Supabase Edge Function to check and update Bitcoin ATH
// Scheduled to run daily at midnight UTC

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Coinpaprika API URL for Bitcoin ticker data (free endpoint)
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

    // Fetch Bitcoin ticker data from Coinpaprika
    console.log('Fetching Bitcoin ticker data from Coinpaprika')
    const response = await fetch(COINPAPRIKA_API_URL)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract ATH (all-time high) data
    if (!data || !data.quotes || !data.quotes.USD || !data.quotes.USD.ath_price) {
      throw new Error('No ATH data found in API response')
    }
    
    const apiAthPrice = data.quotes.USD.ath_price
    const apiAthDate = data.quotes.USD.ath_date
    
    if (!apiAthPrice || !apiAthDate) {
      throw new Error('Invalid ATH data in API response')
    }
    
    const currentAthPrice = Math.round(apiAthPrice * 100) / 100
    const athTimestamp = new Date(apiAthDate).toISOString()

    // Get the current ATH from the database
    const { data: currentAth, error: athError } = await supabase
      .from('ath')
      .select('price_usd')
      .order('price_usd', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dbAthPrice = currentAth?.price_usd || 0

    // If no ATH exists in DB or the API ATH is higher, update
    if (!currentAth || currentAthPrice > dbAthPrice) {
      const { error: insertError } = await supabase
        .from('ath')
        .insert({
          price_usd: currentAthPrice,
          ath_date: athTimestamp,
          source: 'coinpaprika',
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        throw new Error(`Error inserting new ATH: ${insertError.message}`)
      }

      // Log the successful update
      console.log(`Updated BTC ATH to ${currentAthPrice} USD (date: ${apiAthDate})`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'New ATH recorded', 
          price: currentAthPrice,
          date: apiAthDate,
          previousAth: dbAthPrice
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      // Log the info that no new ATH was found
      console.log(`No new ATH detected. Current API ATH: ${currentAthPrice} USD, DB ATH: ${dbAthPrice} USD`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new ATH detected',
          currentApiAth: currentAthPrice,
          currentDbAth: dbAthPrice,
          athDate: apiAthDate
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
  } catch (error: any) {
    console.error('Error checking/updating ATH:', error.message)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 