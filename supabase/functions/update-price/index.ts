// @ts-ignore: Deno module is not available in TypeScript
// Bitcoin price update Supabase Edge Function
// This function fetches the current Bitcoin price and stores it in the historical_prices table
// It's designed to be called by the pg_cron job every hour

// @ts-ignore: Import from URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
// @ts-ignore: Deno namespace
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://npcvbxrshuflujcnikon.supabase.co'
// @ts-ignore: Deno namespace
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey!)

// Mempool.space API endpoint for BTC price
const MEMPOOL_API_URL = 'https://mempool.space/api/v1/prices'

// Helper function to fetch the current BTC price
async function fetchBitcoinPrice() {
  try {
    const response = await fetch(MEMPOOL_API_URL)
    
    if (!response.ok) {
      throw new Error(`Mempool API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      timestamp: Math.floor(Date.now() / 1000), // Current Unix timestamp in seconds
      price_usd: data.USD
    }
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error)
    throw error
  }
}

// Main handler function
// @ts-ignore: Deno namespace
Deno.serve(async (req: Request) => {
  try {
    // Check for POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch current Bitcoin price
    const priceData = await fetchBitcoinPrice()
    
    // Store in database
    const { data, error } = await supabase
      .from('historical_prices')
      .insert([priceData])
      .select()
    
    if (error) {
      console.error('Database insertion error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bitcoin price updated successfully',
        data: priceData
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 