#!/usr/bin/env node

/**
 * Efficient Batch Upsert for BTC Monthly Close Data
 * Uses a single SQL statement to upsert all 182 records at once
 */

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

// Generate a single batch upsert SQL statement
const values = allData.map(record => 
  `('${record.date}', ${record.close})`
).join(',\n    ');

const batchUpsertSQL = `
-- Batch upsert all BTC monthly close data at once
INSERT INTO public.btc_monthly_close (date, close) 
VALUES 
    ${values}
ON CONFLICT (date) 
DO UPDATE SET 
    close = EXCLUDED.close,
    updated_at = NOW();

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_records,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MIN(close) as min_price,
    MAX(close) as max_price
FROM public.btc_monthly_close;
`;

// Write the batch upsert SQL file
fs.writeFileSync('batch_upsert_btc_monthly.sql', batchUpsertSQL);

console.log('Generated batch upsert SQL file: batch_upsert_btc_monthly.sql');
console.log(`This will upsert all ${allData.length} records in a single operation`);
console.log('Sample records:');
console.log('First 3:', allData.slice(0, 3));
console.log('Last 3:', allData.slice(-3));
