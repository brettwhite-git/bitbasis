import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BitcoinDayData {
  time: number;
  close: number;
  open: number;
  high: number;
  low: number;
}

interface CryptoCompareResponse {
  Response: string;
  Data: {
    Data: BitcoinDayData[];
  };
  Message?: string;
}

/**
 * Utility Functions
 */

function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function getLastDayOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0); // Last day of the month
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isLastDayOfMonth(date: Date): boolean {
  const lastDay = getLastDayOfMonth(date);
  return date.getDate() === lastDay.getDate() && 
         date.getMonth() === lastDay.getMonth() && 
         date.getFullYear() === lastDay.getFullYear();
}

/**
 * Fetch Bitcoin price data from CryptoCompare API
 */
async function fetchBitcoinData(limit: number = 3): Promise<BitcoinDayData[]> {
  const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${limit}`;
  
  log('info', `Fetching Bitcoin data from CryptoCompare (${limit} days)`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CryptoCompareResponse = await response.json();
    
    if (data.Response === 'Error') {
      throw new Error(`CryptoCompare API Error: ${data.Message}`);
    }
    
    if (!data.Data || !data.Data.Data) {
      throw new Error('Invalid API response structure');
    }
    
    log('info', `Successfully fetched ${data.Data.Data.length} days of Bitcoin data`);
    return data.Data.Data;
    
  } catch (error) {
    log('error', 'Failed to fetch Bitcoin data', { error: error.message });
    throw error;
  }
}

/**
 * Extract the current month's close price from daily data
 */
function extractCurrentMonthClose(dailyData: BitcoinDayData[]): { date: Date; close: number; sourceDate: Date } | null {
  const today = new Date();
  const currentMonth = today.getFullYear() * 12 + today.getMonth();
  
  let monthEndData: { date: Date; close: number; sourceDate: Date } | null = null;
  
  for (const day of dailyData) {
    const date = new Date(day.time * 1000); // Convert Unix timestamp to Date
    const dayMonth = date.getFullYear() * 12 + date.getMonth();
    
    // Only process current month data
    if (dayMonth !== currentMonth) {
      continue;
    }
    
    // Validate price data
    if (!day.close || day.close <= 0) {
      log('warn', `Invalid price data for ${formatDate(date)}`, { price: day.close });
      continue;
    }
    
    // Keep the latest data from current month (should be today if running on last day)
    if (!monthEndData || date > monthEndData.sourceDate) {
      const lastDayOfMonth = getLastDayOfMonth(date);
      monthEndData = {
        date: lastDayOfMonth,
        close: day.close,
        sourceDate: date
      };
    }
  }
  
  return monthEndData;
}

/**
 * Update monthly close price in database
 */
async function updateMonthlyClose(
  supabase: any,
  monthData: { date: Date; close: number; sourceDate: Date }
): Promise<boolean> {
  try {
    log('info', `Updating monthly close for ${formatDate(monthData.date)}`, {
      close: monthData.close,
      sourceDate: formatDate(monthData.sourceDate)
    });
    
    const { data, error } = await supabase.rpc('upsert_monthly_close', {
      month_date: formatDate(monthData.date),
      close_price: monthData.close
    });
    
    if (error) {
      throw error;
    }
    
    const wasUpdated = data[0]?.was_updated || false;
    log('info', `${wasUpdated ? 'Updated' : 'Inserted'} monthly close: ${formatDate(monthData.date)} = $${monthData.close}`);
    
    return true;
  } catch (error) {
    log('error', 'Failed to update monthly close in database', { error: error.message });
    throw error;
  }
}

/**
 * Main Edge Function Handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    log('info', 'Starting monthly Bitcoin close price update');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if today is the last day of the month
    const today = new Date();
    if (!isLastDayOfMonth(today)) {
      const message = `Today (${formatDate(today)}) is not the last day of the month. Skipping update.`;
      log('info', message);
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          message,
          date: formatDate(today)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    log('info', `Today (${formatDate(today)}) is the last day of the month. Proceeding with update.`);
    
    // Fetch recent Bitcoin data (last 3 days for safety)
    const dailyData = await fetchBitcoinData(3);
    
    if (!dailyData || dailyData.length === 0) {
      throw new Error('No Bitcoin data received from API');
    }
    
    // Extract current month's close price
    const monthData = extractCurrentMonthClose(dailyData);
    
    if (!monthData) {
      throw new Error('Could not extract current month close price from API data');
    }
    
    log('info', 'Extracted month-end data', {
      monthEndDate: formatDate(monthData.date),
      closePrice: monthData.close,
      sourceDate: formatDate(monthData.sourceDate)
    });
    
    // Update database
    await updateMonthlyClose(supabase, monthData);
    
    // Success response
    const response = {
      success: true,
      date: formatDate(monthData.date),
      close: monthData.close,
      sourceDate: formatDate(monthData.sourceDate),
      timestamp: new Date().toISOString()
    };
    
    log('info', '✅ Monthly Bitcoin close price update completed successfully', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    log('error', '❌ Monthly Bitcoin close price update failed', { 
      error: error.message,
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-monthly-btc-close' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/ 