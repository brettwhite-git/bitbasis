#!/usr/bin/env node

/**
 * Populate historical data via edge function calls
 * Since the edge function works with service role permissions
 */

const https = require('https');
const fs = require('fs');

// Read the generated SQL file to extract the data
const sqlContent = fs.readFileSync('populate_btc_monthly_close.sql', 'utf8');

// Extract INSERT statements and parse the data
const insertMatches = sqlContent.match(/VALUES\s+([\s\S]*?);/g);
const allData = [];

if (insertMatches) {
  insertMatches.forEach(match => {
    const valuesText = match.replace(/VALUES\s+/, '').replace(/;$/, '');
    const valueRows = valuesText.match(/\('[^']*',\s*[0-9.]+\)/g);
    
    if (valueRows) {
      valueRows.forEach(row => {
        const matches = row.match(/\('([^']*)',\s*([0-9.]+)\)/);
        if (matches) {
          allData.push({
            date: matches[1],
            close: parseFloat(matches[2])
          });
        }
      });
    }
  });
}

console.log(`Extracted ${allData.length} records from SQL file`);

// Configuration
const CONFIG = {
  FUNCTION_URL: 'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-monthly-btc-close',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3ZieHJzaHVmbHVqY25pa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTgxNTQsImV4cCI6MjA1NzU3NDE1NH0.Hya3qaRopTxcWIhLV_tEgWZonGWay2xgltJE7h4SVmA',
  DELAY_BETWEEN_CALLS: 500, // 500ms between calls
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

async function insertViaEdgeFunction(date, close) {
  const payload = {
    source: 'historical_population',
    force: true,
    historical_data: { date, close }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(CONFIG.FUNCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function populateHistoricalData() {
  log('info', `Starting population of ${allData.length} historical records`);
  
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < allData.length; i++) {
    const record = allData[i];
    
    try {
      log('info', `Processing ${i + 1}/${allData.length}: ${record.date} = $${record.close}`);
      
      const result = await insertViaEdgeFunction(record.date, record.close);
      
      if (result.success) {
        inserted++;
        log('info', `✅ Inserted: ${record.date}`);
      } else {
        errors++;
        log('error', `❌ Failed: ${record.date}`, { error: result.error });
      }
      
    } catch (error) {
      errors++;
      log('error', `❌ Request failed: ${record.date}`, { error: error.message });
    }
    
    // Rate limiting
    if (i < allData.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_CALLS);
    }
    
    // Progress report every 20 records
    if ((i + 1) % 20 === 0) {
      log('info', `Progress: ${i + 1}/${allData.length} (${inserted} inserted, ${errors} errors)`);
    }
  }
  
  log('info', 'Population complete!', {
    total: allData.length,
    inserted,
    errors,
    success_rate: `${((inserted / allData.length) * 100).toFixed(1)}%`
  });
}

if (require.main === module) {
  populateHistoricalData().catch(error => {
    log('error', 'Script failed', { error: error.message });
    process.exit(1);
  });
}
