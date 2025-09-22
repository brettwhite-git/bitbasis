#!/usr/bin/env node

/**
 * Bitcoin Monthly Close Price Population Script
 * 
 * Fetches historical Bitcoin daily prices from CryptoCompare API
 * and populates the btc_monthly_close table with month-end close prices.
 * 
 * ⚠️  PRODUCTION NOTE: The btc_monthly_close table is now automatically 
 *     maintained by a cron job + edge function. This script is kept for:
 *     - Emergency data recovery
 *     - Historical data backfill for new date ranges
 *     - Reference implementation for other cryptocurrencies
 * 
 * Features:
 * - Efficient API batching (2000 days per request)
 * - Error recovery and checkpointing
 * - Data validation and gap detection
 * - Comprehensive logging
 * - Rate limiting respect
 * 
 * Usage: node scripts/populate_monthly_close_cryptocompare.js
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const CONFIG = {
  // API Configuration
  API_BASE_URL: 'https://min-api.cryptocompare.com/data/v2/histoday',
  BATCH_SIZE: 2000, // Max days per API request
  RATE_LIMIT_DELAY: 1000, // 1 second between requests
  
  // Date Configuration
  START_DATE: new Date('2010-07-17'), // Bitcoin's first recorded price
  END_DATE: new Date(), // Today
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Validation
  MIN_PRICE: 0.01, // Minimum reasonable BTC price
  MAX_PRICE: 10000000, // Maximum reasonable BTC price ($10M)
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Utility Functions
 */

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  console.log(logEntry);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getLastDayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0); // Last day of the month
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function daysBetween(startDate, endDate) {
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * API Functions
 */

async function fetchBitcoinData(limit, toTs = null) {
  const url = new URL(CONFIG.API_BASE_URL);
  url.searchParams.set('fsym', 'BTC');
  url.searchParams.set('tsym', 'USD');
  url.searchParams.set('limit', limit.toString());
  
  if (toTs) {
    url.searchParams.set('toTs', Math.floor(toTs / 1000).toString());
  }

  log('info', `Fetching data from CryptoCompare: ${url.toString()}`);

  return new Promise((resolve, reject) => {
    const request = https.get(url.toString(), (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (jsonData.Response === 'Error') {
            reject(new Error(`API Error: ${jsonData.Message}`));
            return;
          }
          
          if (!jsonData.Data || !jsonData.Data.Data) {
            reject(new Error('Invalid API response structure'));
            return;
          }
          
          log('info', `Successfully fetched ${jsonData.Data.Data.length} days of data`);
          resolve(jsonData.Data.Data);
        } catch (error) {
          reject(new Error(`JSON parsing error: ${error.message}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(new Error(`HTTP request error: ${error.message}`));
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function fetchWithRetry(limit, toTs = null, retryCount = 0) {
  try {
    const data = await fetchBitcoinData(limit, toTs);
    return data;
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      log('warn', `Request failed, retrying in ${CONFIG.RETRY_DELAY}ms (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`, { error: error.message });
      await sleep(CONFIG.RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return fetchWithRetry(limit, toTs, retryCount + 1);
    } else {
      throw error;
    }
  }
}

/**
 * Data Processing Functions
 */

function extractMonthlyCloses(dailyData) {
  const monthlyCloses = new Map();
  const today = new Date();
  const currentMonth = today.getFullYear() * 12 + today.getMonth(); // Current month as a number for comparison
  
  for (const day of dailyData) {
    const date = new Date(day.time * 1000); // Convert Unix timestamp to Date
    const dayMonth = date.getFullYear() * 12 + date.getMonth(); // Day's month as a number
    
    // Skip current month - only process completed months
    if (dayMonth >= currentMonth) {
      continue;
    }
    
    const lastDayOfMonth = getLastDayOfMonth(date);
    const monthKey = formatDate(lastDayOfMonth);
    
    // Validate price data
    if (!day.close || day.close < CONFIG.MIN_PRICE || day.close > CONFIG.MAX_PRICE) {
      log('warn', `Invalid price data for ${formatDate(date)}`, { price: day.close });
      continue;
    }
    
    // Keep the latest (closest to month-end) price for each completed month
    if (!monthlyCloses.has(monthKey) || date > new Date(monthlyCloses.get(monthKey).sourceDate)) {
      monthlyCloses.set(monthKey, {
        date: lastDayOfMonth,
        close: day.close,
        sourceDate: date
      });
    }
  }
  
  return Array.from(monthlyCloses.values()).sort((a, b) => a.date - b.date);
}

/**
 * Database Functions
 */

async function getExistingMonths() {
  try {
    const { data, error } = await supabase
      .from('btc_monthly_close')
      .select('date')
      .order('date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return new Set(data.map(row => row.date));
  } catch (error) {
    log('error', 'Failed to fetch existing months', { error: error.message });
    throw error;
  }
}

async function insertMonthlyCloses(monthlyData) {
  const results = [];
  
  for (const monthData of monthlyData) {
    try {
      const { data, error } = await supabase.rpc('upsert_monthly_close', {
        month_date: formatDate(monthData.date),
        close_price: monthData.close
      });
      
      if (error) {
        throw error;
      }
      
      results.push({
        date: formatDate(monthData.date),
        close: monthData.close,
        was_updated: data[0]?.was_updated || false
      });
      
      log('info', `${data[0]?.was_updated ? 'Updated' : 'Inserted'} ${formatDate(monthData.date)}: $${monthData.close}`);
      
    } catch (error) {
      log('error', `Failed to upsert data for ${formatDate(monthData.date)}`, { error: error.message });
      throw error;
    }
  }
  
  return results;
}

async function validateDataCompleteness() {
  try {
    const { data, error } = await supabase.rpc('validate_monthly_close_completeness');
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      log('warn', `Found ${data.length} missing months`, { missing: data.map(row => row.missing_month) });
      return data.map(row => row.missing_month);
    } else {
      log('info', 'No missing months found - data is complete');
      return [];
    }
  } catch (error) {
    log('error', 'Failed to validate data completeness', { error: error.message });
    throw error;
  }
}

/**
 * Main Population Logic
 */

async function populateHistoricalData() {
  log('info', 'Starting Bitcoin monthly close price population');
  
  try {
    // Calculate total work
    const totalDays = daysBetween(CONFIG.START_DATE, CONFIG.END_DATE);
    const totalBatches = Math.ceil(totalDays / CONFIG.BATCH_SIZE);
    
    log('info', `Processing ${totalDays} days in ${totalBatches} batches`);
    
    // Get existing data to avoid unnecessary work
    const existingMonths = await getExistingMonths();
    log('info', `Found ${existingMonths.size} existing months in database`);
    
    let processedBatches = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    
    // Process data in batches, working backwards from today
    let currentEndDate = CONFIG.END_DATE;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStartTime = Date.now();
      
      try {
        log('info', `Processing batch ${batchIndex + 1}/${totalBatches}`);
        
        // Calculate batch parameters
        const toTs = currentEndDate.getTime();
        const batchSize = Math.min(CONFIG.BATCH_SIZE, totalDays - (batchIndex * CONFIG.BATCH_SIZE));
        
        // Fetch daily data for this batch
        const dailyData = await fetchWithRetry(batchSize, toTs);
        
        if (!dailyData || dailyData.length === 0) {
          log('warn', `No data returned for batch ${batchIndex + 1}`);
          continue;
        }
        
        // Extract monthly closes from daily data
        const monthlyCloses = extractMonthlyCloses(dailyData);
        log('info', `Extracted ${monthlyCloses.length} monthly close prices from batch`);
        
        // Filter out months that already exist (unless we want to update them)
        const newMonthlyCloses = monthlyCloses.filter(month => {
          const monthKey = formatDate(month.date);
          return !existingMonths.has(monthKey);
        });
        
        if (newMonthlyCloses.length === 0) {
          log('info', 'All months in this batch already exist, skipping');
        } else {
          // Insert new monthly data
          const results = await insertMonthlyCloses(newMonthlyCloses);
          
          // Update counters
          const inserted = results.filter(r => !r.was_updated).length;
          const updated = results.filter(r => r.was_updated).length;
          totalInserted += inserted;
          totalUpdated += updated;
          
          log('info', `Batch ${batchIndex + 1} complete: ${inserted} inserted, ${updated} updated`);
        }
        
        processedBatches++;
        
        // Update current end date for next batch
        const oldestDateInBatch = Math.min(...dailyData.map(d => d.time * 1000));
        currentEndDate = new Date(oldestDateInBatch - 24 * 60 * 60 * 1000); // Go back one more day
        
        // Rate limiting
        if (batchIndex < totalBatches - 1) {
          const batchDuration = Date.now() - batchStartTime;
          const sleepTime = Math.max(CONFIG.RATE_LIMIT_DELAY - batchDuration, 0);
          
          if (sleepTime > 0) {
            log('info', `Rate limiting: sleeping for ${sleepTime}ms`);
            await sleep(sleepTime);
          }
        }
        
      } catch (error) {
        log('error', `Batch ${batchIndex + 1} failed`, { error: error.message });
        
        // For now, continue with next batch rather than failing entirely
        // In production, you might want to implement more sophisticated error handling
        continue;
      }
    }
    
    // Final validation
    log('info', 'Population complete, validating data completeness...');
    const missingMonths = await validateDataCompleteness();
    
    // Summary
    log('info', 'Population Summary', {
      processedBatches,
      totalInserted,
      totalUpdated,
      missingMonths: missingMonths.length,
      totalMonthsInDb: existingMonths.size + totalInserted
    });
    
    if (missingMonths.length > 0) {
      log('warn', 'Some months are still missing. You may need to run the script again or investigate API data gaps.');
    } else {
      log('info', '✅ Historical data population completed successfully!');
    }
    
  } catch (error) {
    log('error', 'Population failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * CLI Interface
 */

async function main() {
  // Validate environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    log('error', 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('error', 'Missing Supabase key environment variable');
    process.exit(1);
  }
  
  // Test database connection
  try {
    const { data, error } = await supabase.from('btc_monthly_close').select('count').limit(1);
    if (error) {
      throw error;
    }
    log('info', 'Database connection successful');
  } catch (error) {
    log('error', 'Database connection failed', { error: error.message });
    process.exit(1);
  }
  
  // Run population
  await populateHistoricalData();
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Bitcoin Monthly Close Price Population Script

Usage: node populate_monthly_close_cryptocompare.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     Supabase service role key (preferred)
  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anon key (fallback)

Examples:
  node populate_monthly_close_cryptocompare.js
  `);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log('error', 'Script failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = {
  populateHistoricalData,
  fetchBitcoinData,
  extractMonthlyCloses
}; 