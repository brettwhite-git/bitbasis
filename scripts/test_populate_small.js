#!/usr/bin/env node

/**
 * Small Test Script for Bitcoin Monthly Close Price Population
 * 
 * Tests the API and database functions with just the last 3 months
 * to verify everything works before running the full historical population.
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration for test
const CONFIG = {
  API_BASE_URL: 'https://min-api.cryptocompare.com/data/v2/histoday',
  BATCH_SIZE: 100, // Small batch for testing
  RATE_LIMIT_DELAY: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 10000000,
};

// Initialize Supabase client with local credentials
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  console.log(logEntry);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function getLastDayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function fetchBitcoinData(limit, toTs = null) {
  const url = new URL(CONFIG.API_BASE_URL);
  url.searchParams.set('fsym', 'BTC');
  url.searchParams.set('tsym', 'USD');
  url.searchParams.set('limit', limit.toString());
  
  if (toTs) {
    url.searchParams.set('toTs', Math.floor(toTs / 1000).toString());
  }

  log('info', `Fetching test data from CryptoCompare: ${url.toString()}`);

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
          
          log('info', `Successfully fetched ${jsonData.Data.Data.length} days of test data`);
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
  const currentMonth = today.getFullYear() * 12 + today.getMonth(); // Current month as a number for comparison
  
  for (const day of dailyData) {
    const date = new Date(day.time * 1000);
    const dayMonth = date.getFullYear() * 12 + date.getMonth(); // Day's month as a number
    
    // Skip current month - only process completed months
    if (dayMonth >= currentMonth) {
      continue;
    }
    
    const lastDayOfMonth = getLastDayOfMonth(date);
    const monthKey = formatDate(lastDayOfMonth);
    
    if (!day.close || day.close < CONFIG.MIN_PRICE || day.close > CONFIG.MAX_PRICE) {
      log('warn', `Invalid price data for ${formatDate(date)}`, { price: day.close });
      continue;
    }
    
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

async function testDatabaseFunctions() {
  log('info', 'Testing database functions...');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('btc_monthly_close').select('count').limit(1);
    if (error) throw error;
    log('info', 'Database connection: SUCCESS');
    
    // Test upsert function with test data
    const testResult = await supabase.rpc('upsert_monthly_close', {
      month_date: '2024-01-15',
      close_price: 42000.50
    });
    
    if (testResult.error) throw testResult.error;
    log('info', 'Upsert function test: SUCCESS', testResult.data[0]);
    
    // Test validation function
    const validationResult = await supabase.rpc('validate_monthly_close_completeness', {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    });
    
    if (validationResult.error) throw validationResult.error;
    log('info', 'Validation function test: SUCCESS');
    
    return true;
  } catch (error) {
    log('error', 'Database function test failed', { error: error.message });
    return false;
  }
}

async function testApiAndProcessing() {
  log('info', 'Testing API and data processing...');
  
  try {
    // Fetch last 100 days of data
    const dailyData = await fetchBitcoinData(100);
    
    if (!dailyData || dailyData.length === 0) {
      throw new Error('No data returned from API');
    }
    
    log('info', `API test: SUCCESS - fetched ${dailyData.length} days`);
    
    // Test data processing
    const monthlyCloses = extractMonthlyCloses(dailyData);
    log('info', `Data processing test: SUCCESS - extracted ${monthlyCloses.length} monthly closes`);
    
    // Show sample data
    if (monthlyCloses.length > 0) {
      log('info', 'Sample monthly data:', {
        first: {
          date: formatDate(monthlyCloses[0].date),
          close: monthlyCloses[0].close
        },
        last: {
          date: formatDate(monthlyCloses[monthlyCloses.length - 1].date),
          close: monthlyCloses[monthlyCloses.length - 1].close
        }
      });
    }
    
    return monthlyCloses;
  } catch (error) {
    log('error', 'API/processing test failed', { error: error.message });
    return null;
  }
}

async function testFullWorkflow() {
  log('info', 'Testing full workflow with real data insertion...');
  
  try {
    // Get test data
    const monthlyCloses = await testApiAndProcessing();
    if (!monthlyCloses) return false;
    
    // Insert a few months of data
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const monthData of monthlyCloses.slice(-3)) { // Last 3 months only
      const result = await supabase.rpc('upsert_monthly_close', {
        month_date: formatDate(monthData.date),
        close_price: monthData.close
      });
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data[0]?.was_updated) {
        updatedCount++;
      } else {
        insertedCount++;
      }
      
      log('info', `${result.data[0]?.was_updated ? 'Updated' : 'Inserted'} ${formatDate(monthData.date)}: $${monthData.close}`);
    }
    
    log('info', 'Full workflow test: SUCCESS', {
      inserted: insertedCount,
      updated: updatedCount,
      total: insertedCount + updatedCount
    });
    
    return true;
  } catch (error) {
    log('error', 'Full workflow test failed', { error: error.message });
    return false;
  }
}

async function main() {
  log('info', 'Starting Bitcoin Monthly Close Price System Test');
  
  try {
    // Test 1: Database functions
    const dbTest = await testDatabaseFunctions();
    if (!dbTest) {
      log('error', 'Database tests failed - stopping');
      process.exit(1);
    }
    
    // Test 2: API and processing
    const apiTest = await testApiAndProcessing();
    if (!apiTest) {
      log('error', 'API tests failed - stopping');
      process.exit(1);
    }
    
    // Test 3: Full workflow
    const workflowTest = await testFullWorkflow();
    if (!workflowTest) {
      log('error', 'Workflow tests failed - stopping');
      process.exit(1);
    }
    
    // Final validation
    const { data: finalData } = await supabase
      .from('btc_monthly_close')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    log('info', '✅ All tests passed! Latest data in database:');
    console.table(finalData);
    
    log('info', '🚀 Ready to run full historical population script!');
    
  } catch (error) {
    log('error', 'Test script failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 