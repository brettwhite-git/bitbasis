#!/usr/bin/env node

/**
 * Historical Bitcoin Monthly Close Population via Edge Function
 * 
 * Uses the edge function to populate historical data in batches
 * since the edge function has service role permissions
 */

const https = require('https');
require('dotenv').config();

// Configuration
const CONFIG = {
  SUPABASE_URL: 'https://npcvbxrshuflujcnikon.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3ZieHJzaHVmbHVqY25pa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTgxNTQsImV4cCI6MjA1NzU3NDE1NH0.Hya3qaRopTxcWIhLV_tEgWZonGWay2xgltJE7h4SVmA',
  FUNCTION_URL: 'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-monthly-btc-close',
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

function extractMonthlyCloses(dailyData) {
  const monthlyCloses = new Map();
  const today = new Date();
  const currentMonth = today.getFullYear() * 12 + today.getMonth();
  
  for (const day of dailyData) {
    const date = new Date(day.time * 1000);
    const dayMonth = date.getFullYear() * 12 + date.getMonth();
    
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

async function insertMonthlyCloseViaEdgeFunction(monthData) {
  const payload = {
    source: 'historical_population',
    force: true,
    historical_data: {
      date: formatDate(monthData.date),
      close: monthData.close,
      sourceDate: formatDate(monthData.sourceDate)
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(CONFIG.FUNCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Edge function returned error'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse edge function response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Edge function request error: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Edge function request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function populateHistoricalData() {
  log('info', 'Starting historical Bitcoin monthly close price population via edge function');
  
  try {
    // Calculate total work
    const totalDays = daysBetween(CONFIG.START_DATE, CONFIG.END_DATE);
    const totalBatches = Math.ceil(totalDays / CONFIG.BATCH_SIZE);
    
    log('info', `Processing ${totalDays} days in ${totalBatches} batches`);
    
    let processedBatches = 0;
    let totalInserted = 0;
    let currentEndDate = CONFIG.END_DATE;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStartTime = Date.now();
      
      try {
        log('info', `Processing batch ${batchIndex + 1}/${totalBatches}`);
        
        // Calculate batch parameters
        const toTs = currentEndDate.getTime();
        const batchSize = Math.min(CONFIG.BATCH_SIZE, totalDays - (batchIndex * CONFIG.BATCH_SIZE));
        
        // Fetch daily data for this batch
        const dailyData = await fetchBitcoinData(batchSize, toTs);
        
        if (!dailyData || dailyData.length === 0) {
          log('warn', `No data returned for batch ${batchIndex + 1}`);
          continue;
        }
        
        // Extract monthly closes from daily data
        const monthlyCloses = extractMonthlyCloses(dailyData);
        log('info', `Extracted ${monthlyCloses.length} monthly close prices from batch`);
        
        // Insert each monthly close via edge function
        for (const monthData of monthlyCloses) {
          try {
            const result = await insertMonthlyCloseViaEdgeFunction(monthData);
            log('info', `Inserted ${formatDate(monthData.date)}: $${monthData.close}`);
            totalInserted++;
            
            // Small delay between edge function calls
            await sleep(200);
            
          } catch (error) {
            log('error', `Failed to insert data for ${formatDate(monthData.date)}`, { error: error.message });
            // Continue with next month rather than failing entirely
          }
        }
        
        processedBatches++;
        
        // Update current end date for next batch
        const oldestDateInBatch = Math.min(...dailyData.map(d => d.time * 1000));
        currentEndDate = new Date(oldestDateInBatch - 24 * 60 * 60 * 1000); // Go back one more day
        
        // Rate limiting between batches
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
        continue;
      }
    }
    
    // Summary
    log('info', 'Historical Population Summary', {
      processedBatches,
      totalInserted,
    });
    
    if (totalInserted > 0) {
      log('info', '✅ Historical data population completed successfully!');
    } else {
      log('warn', 'No data was inserted. Check for errors above.');
    }
    
  } catch (error) {
    log('error', 'Population failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function main() {
  await populateHistoricalData();
}

if (require.main === module) {
  main().catch(error => {
    log('error', 'Script failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}
