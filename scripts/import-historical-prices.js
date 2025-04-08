// Import Historical Bitcoin Prices Script
// This script fetches historical Bitcoin price data and imports it into the Supabase database
// Run this script once to populate the historical_prices table with past data

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env files
const envPath = path.resolve(process.cwd(), '.env');
const localEnvPath = path.resolve(process.cwd(), '.env.local');

// Try to load from .env.local first, then fall back to .env
if (fs.existsSync(localEnvPath)) {
  console.log('Loading environment from .env.local');
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment from .env');
  dotenv.config({ path: envPath });
} else {
  console.log('No .env or .env.local found, using process.env directly');
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Current ENV:', { 
    url: supabaseUrl ? 'Found' : 'Missing',
    key: supabaseServiceKey ? 'Found' : 'Missing'
  });
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log('Service key found:', !!supabaseServiceKey);

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API endpoints for Bitcoin price data
// Main API endpoint (try this first)
const MEMPOOL_API_URL = 'https://mempool.space/api/v1/historical-price';
// Alternative API for current price (as fallback)
const COINPAPRIKA_API_URL = 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin';
// CoinGecko API for historical data (as fallback)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart';

// Function to fetch historical Bitcoin prices from Mempool.space
async function fetchHistoricalPricesFromMempool() {
  try {
    console.log('Fetching historical Bitcoin prices from Mempool.space API...');
    
    const response = await fetch(MEMPOOL_API_URL);
    
    if (!response.ok) {
      console.error(`Mempool API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format from Mempool API');
      return null;
    }
    
    console.log('Mempool API data structure:', Object.keys(data));
    
    // Extract price data from the new Mempool API format
    if (data.prices && Array.isArray(data.prices)) {
      // Transform the data into our expected format - only take USD values
      const formattedData = data.prices
        .filter(pricePoint => pricePoint.USD !== undefined) // Ensure USD price exists
        .map(pricePoint => ({
          time: pricePoint.time,
          USD: pricePoint.USD
        }));
      
      console.log(`Extracted ${formattedData.length} USD price points from Mempool data`);
      return formattedData;
    } else {
      console.error('Unexpected Mempool API response structure');
      return null;
    }
  } catch (error) {
    console.error('Error fetching historical prices from Mempool:', error);
    return null;
  }
}

// Function to fetch historical Bitcoin prices from CoinGecko
async function fetchHistoricalPricesFromCoinGecko() {
  try {
    console.log('Falling back to CoinGecko API for historical data...');
    
    // Get data for the past 2 years (max allowed by free tier)
    const params = new URLSearchParams({
      vs_currency: 'usd',
      days: '730', // 2 years
      interval: 'daily'
    });
    
    const response = await fetch(`${COINGECKO_API_URL}?${params}`);
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.prices || !Array.isArray(data.prices)) {
      console.error('Invalid data format from CoinGecko API');
      return null;
    }
    
    // Transform CoinGecko data to our format
    // CoinGecko returns [timestamp, price] pairs
    const formattedData = data.prices.map(([timestamp, price]) => ({
      // CoinGecko timestamps are in milliseconds, convert to seconds
      time: Math.floor(timestamp / 1000),
      USD: price
    }));
    
    console.log(`Got ${formattedData.length} price points from CoinGecko`);
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching historical prices from CoinGecko:', error);
    return null;
  }
}

// Function to manually generate historical price data (as a last resort)
async function generateCurrentPricePoint() {
  try {
    console.log('All APIs failed. Generating single price point from Coinpaprika...');
    
    const response = await fetch(COINPAPRIKA_API_URL);
    
    if (!response.ok) {
      console.error(`Coinpaprika API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.quotes || !data.quotes.USD || !data.quotes.USD.price) {
      console.error('Invalid data format from Coinpaprika API');
      return null;
    }
    
    // Create a single price point for today
    const pricePoint = {
      time: Math.floor(Date.now() / 1000),
      USD: data.quotes.USD.price
    };
    
    console.log(`Generated current price point: $${pricePoint.USD}`);
    
    return [pricePoint];
  } catch (error) {
    console.error('Error fetching current price from Coinpaprika:', error);
    return null;
  }
}

// Main function to fetch price data from any available source
async function fetchHistoricalPrices() {
  // Try Mempool.space first
  const mempoolData = await fetchHistoricalPricesFromMempool();
  if (mempoolData && Array.isArray(mempoolData) && mempoolData.length > 0) {
    console.log(`Received ${mempoolData.length} historical price points from Mempool.space`);
    return mempoolData;
  }
  
  // If Mempool fails, try CoinGecko
  const coinGeckoData = await fetchHistoricalPricesFromCoinGecko();
  if (coinGeckoData && Array.isArray(coinGeckoData) && coinGeckoData.length > 0) {
    console.log(`Received ${coinGeckoData.length} historical price points from CoinGecko`);
    return coinGeckoData;
  }
  
  // If both APIs fail, try to at least get the current price
  const currentPricePoint = await generateCurrentPricePoint();
  if (currentPricePoint && Array.isArray(currentPricePoint) && currentPricePoint.length > 0) {
    console.log(`Using single current price point as fallback`);
    return currentPricePoint;
  }
  
  // If all APIs fail, return empty array
  console.error('All API sources failed to provide Bitcoin price data');
  return [];
}

// Function to process and import price data
async function importHistoricalPrices() {
  try {
    // Fetch historical price data
    const historicalData = await fetchHistoricalPrices();
    
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      throw new Error('No valid data received from APIs');
    }
    
    console.log(`Processing ${historicalData.length} historical price points`);
    
    // Transform data for database insertion
    const formattedData = historicalData.map(item => ({
      timestamp: item.time,
      price_usd: parseFloat(item.USD)
    }));
    
    // Save to a JSON file as backup
    const backupPath = path.resolve(process.cwd(), 'historical-prices-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(formattedData, null, 2));
    console.log(`Backup saved to ${backupPath}`);
    
    // Import data in batches to avoid any potential size limits
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < formattedData.length; i += batchSize) {
      batches.push(formattedData.slice(i, i + batchSize));
    }
    
    console.log(`Importing data in ${batches.length} batches...`);
    
    // Import each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`Importing batch ${i + 1}/${batches.length} (${batch.length} records)...`);
      
      try {
        const { data, error } = await supabase
          .from('historical_prices')
          .upsert(batch, { onConflict: 'timestamp' });
        
        if (error) {
          console.error(`Error importing batch ${i + 1}:`, error);
        } else {
          console.log(`Successfully imported batch ${i + 1}/${batches.length}`);
        }
      } catch (error) {
        console.error(`Exception during batch ${i + 1} import:`, error);
      }
    }
    
    console.log('Historical price import complete!');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import process
importHistoricalPrices()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 