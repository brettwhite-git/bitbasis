// Supabase Edge Function to update the Fear & Greed Index
// Scheduled to run daily at 1 AM UTC

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Alternative Fear & Greed Index API (free tier)
const FEAR_GREED_API_URL = 'https://api.alternative.me/fng/'

// Function to log updates and errors
async function logMessage(
  supabase: SupabaseClient, 
  service: string, 
  status: string, 
  message: string
): Promise<void> {
  try {
    await supabase
      .from('price_update_logs')
      .insert({
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        success: status === 'success' || status === 'info',
        error_message: status === 'error' ? message : null,
        response_status: status === 'success' ? 200 : (status === 'error' ? 500 : 200),
        response_content: message
      })
  } catch (error: any) {
    console.error('Error logging message:', error.message)
  }
}

// Function to determine classification based on the index value
function getClassification(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

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

    // Fetch current Fear & Greed Index from API
    console.log('Fetching current Fear & Greed Index')
    const response = await fetch(FEAR_GREED_API_URL)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    
    // Validate the response
    if (!data.data || !data.data[0] || !data.data[0].value) {
      throw new Error('Invalid data format received from API')
    }
    
    const indexValue = parseInt(data.data[0].value)
    
    if (isNaN(indexValue) || indexValue < 0 || indexValue > 100) {
      throw new Error(`Invalid index value received: ${data.data[0].value}`)
    }
    
    const classification = getClassification(indexValue)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Check if we already have an entry for today
    const { data: existingEntry, error: queryError } = await supabase
      .from('fear_greed_index')
      .select('id')
      .eq('date', today)
      .maybeSingle()
      
    if (queryError) {
      throw new Error(`Error checking existing entry: ${queryError.message}`)
    }
    
    let result
    
    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('fear_greed_index')
        .update({
          value: indexValue,
          classification,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingEntry.id)
        
      if (updateError) {
        throw new Error(`Error updating fear and greed index: ${updateError.message}`)
      }
      
      result = {
        success: true,
        message: 'Updated existing Fear & Greed Index entry',
        value: indexValue,
        classification,
        date: today
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from('fear_greed_index')
        .insert({
          value: indexValue,
          classification,
          date: today
        })
        
      if (insertError) {
        throw new Error(`Error inserting fear and greed index: ${insertError.message}`)
      }
      
      result = {
        success: true,
        message: 'Created new Fear & Greed Index entry',
        value: indexValue,
        classification,
        date: today
      }
    }
    
    // Log the successful update
    await logMessage(
      supabase,
      'fear_greed_update',
      'success',
      `Updated Fear & Greed Index to ${indexValue} (${classification})`
    )
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error updating Fear & Greed Index:', error.message)
    
    // Try to log the error to the database if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await logMessage(
          supabase,
          'fear_greed_update',
          'error',
          `Error updating Fear & Greed Index: ${error.message}`
        )
      }
    } catch (logError: any) {
      console.error('Failed to log error:', logError.message)
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 