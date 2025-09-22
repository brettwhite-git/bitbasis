#!/usr/bin/env node

/**
 * Direct SQL Population of BTC Monthly Close Data
 * Uses raw SQL INSERT to bypass RLS policies
 */

const https = require('https');
require('dotenv').config();

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://min-api.cryptocompare.com/data/v2/histoday',
  BATCH_SIZE: 2000,
  RATE_LIMIT_DELAY: 1000,
  START_DATE: new Date('2010-07-17'),
  END_DATE: new Date(),
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 10000000,
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
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
  return new Date(year, month + 1, 0);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function daysBetween(startDate, endDate) {
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function fetchBitcoinData(limit, toTs = null) {
  const url = new URL(CONFIG.API_BASE_URL);
  url.searchParams.set('fsym', 'BTC');
  url.searchParams.set('tsym', 'USD');
  url.searchParams.set('limit', limit.toString());
  
  if (toTs) {
    url.searchParams.set('toTs', Math.floor(toTs / 1000).toString());
  }

  return new Promise((resolve, reject) => {
    const request = https.get(url.toString(), (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
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
          resolve(jsonData.Data.Data);
        } catch (error) {
          reject(new Error(`JSON parsing error: ${error.message}`));
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function extractMonthlyCloses(dailyData) {
  const monthlyCloses = new Map();
  const today = new Date();
  const currentMonth = today.getFullYear() * 12 + today.getMonth();
  
  for (const day of dailyData) {
    const date = new Date(day.time * 1000);
    const dayMonth = date.getFullYear() * 12 + date.getMonth();
    
    // Skip current month - only process completed months
    if (dayMonth >= currentMonth) continue;
    
    const lastDayOfMonth = getLastDayOfMonth(date);
    const monthKey = formatDate(lastDayOfMonth);
    
    // Validate price data
    if (!day.close || day.close < CONFIG.MIN_PRICE || day.close > CONFIG.MAX_PRICE) {
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

async function populateHistoricalData() {
  log('info', 'Starting Bitcoin monthly close price population');
  
  try {
    const totalDays = daysBetween(CONFIG.START_DATE, CONFIG.END_DATE);
    const totalBatches = Math.ceil(totalDays / CONFIG.BATCH_SIZE);
    
    log('info', `Processing ${totalDays} days in ${totalBatches} batches`);
    
    let allMonthlyData = [];
    let currentEndDate = CONFIG.END_DATE;
    
    // Collect all monthly data first
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      try {
        log('info', `Fetching batch ${batchIndex + 1}/${totalBatches}`);
        
        const toTs = currentEndDate.getTime();
        const batchSize = Math.min(CONFIG.BATCH_SIZE, totalDays - (batchIndex * CONFIG.BATCH_SIZE));
        
        const dailyData = await fetchBitcoinData(batchSize, toTs);
        
        if (!dailyData || dailyData.length === 0) {
          log('warn', `No data returned for batch ${batchIndex + 1}`);
          continue;
        }
        
        const monthlyCloses = extractMonthlyCloses(dailyData);
        log('info', `Extracted ${monthlyCloses.length} monthly close prices from batch`);
        
        allMonthlyData.push(...monthlyCloses);
        
        // Update current end date for next batch
        const oldestDateInBatch = Math.min(...dailyData.map(d => d.time * 1000));
        currentEndDate = new Date(oldestDateInBatch - 24 * 60 * 60 * 1000);
        
        // Rate limiting
        if (batchIndex < totalBatches - 1) {
          await sleep(CONFIG.RATE_LIMIT_DELAY);
        }
        
      } catch (error) {
        log('error', `Batch ${batchIndex + 1} failed`, { error: error.message });
        continue;
      }
    }
    
    // Remove duplicates and sort
    const uniqueMonths = new Map();
    allMonthlyData.forEach(month => {
      const key = formatDate(month.date);
      if (!uniqueMonths.has(key) || month.sourceDate > uniqueMonths.get(key).sourceDate) {
        uniqueMonths.set(key, month);
      }
    });
    
    const sortedMonthlyData = Array.from(uniqueMonths.values()).sort((a, b) => a.date - b.date);
    
    log('info', `Collected ${sortedMonthlyData.length} unique monthly close prices`);
    
    // Generate SQL INSERT statements
    const sqlStatements = [];
    
    // First, create a temporary function to bypass RLS
    sqlStatements.push(`
-- Temporarily disable RLS for data population
ALTER TABLE public.btc_monthly_close DISABLE ROW LEVEL SECURITY;
    `);
    
    // Generate INSERT statements in batches
    const insertBatchSize = 50;
    for (let i = 0; i < sortedMonthlyData.length; i += insertBatchSize) {
      const batch = sortedMonthlyData.slice(i, i + insertBatchSize);
      
      const values = batch.map(month => 
        `('${formatDate(month.date)}', ${month.close})`
      ).join(',\n    ');
      
      sqlStatements.push(`
-- Insert batch ${Math.floor(i / insertBatchSize) + 1}
INSERT INTO public.btc_monthly_close (date, close) 
VALUES 
    ${values}
ON CONFLICT (date) 
DO UPDATE SET 
    close = EXCLUDED.close,
    updated_at = NOW();
      `);
    }
    
    // Re-enable RLS
    sqlStatements.push(`
-- Re-enable RLS after population
ALTER TABLE public.btc_monthly_close ENABLE ROW LEVEL SECURITY;
    `);
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n\n');
    require('fs').writeFileSync('populate_btc_monthly_close.sql', sqlContent);
    
    log('info', `Generated SQL file with ${sortedMonthlyData.length} monthly records`);
    log('info', 'SQL file written to: populate_btc_monthly_close.sql');
    log('info', 'To execute: Run this SQL file with service role permissions');
    
    // Print first few records for verification
    log('info', 'Sample records:', {
      first: sortedMonthlyData.slice(0, 3).map(m => ({
        date: formatDate(m.date),
        close: m.close
      })),
      last: sortedMonthlyData.slice(-3).map(m => ({
        date: formatDate(m.date),
        close: m.close
      }))
    });
    
  } catch (error) {
    log('error', 'Population failed', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  populateHistoricalData().catch(error => {
    log('error', 'Script failed', { error: error.message });
    process.exit(1);
  });
}
