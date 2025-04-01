// Uses Node.js built-in fetch (available in Node.js v18+)
// If you are using an older Node.js version (<18), you might need to:
// 1. Install node-fetch: npm install node-fetch
// 2. Uncomment the next line:
// const fetch = require('node-fetch');

const PRICE_API_ENDPOINT = 'http://localhost:3000/api/bitcoin/price';
const HISTORICAL_API_ENDPOINT = 'http://localhost:3000/api/cron/historical-prices';
const INTERVAL_MINUTES = 10; // Updated to 10 minutes for Coinpaprika free tier
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

async function triggerApi() {
  const currentTime = new Date().toLocaleTimeString();
  
  // Trigger current price API
  console.log(`[Local Cron Trigger] Triggering current price API at ${currentTime}`);
  try {
    const response = await fetch(`${PRICE_API_ENDPOINT}?t=${Date.now()}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(`[Local Cron Trigger] Price API Error (${response.status}):`, data.error || response.statusText);
    } else {
      console.log(`[Local Cron Trigger] Current price API call successful:
        Current Price: $${data.price?.toLocaleString()}
        ATH Price: $${data.ath?.price?.toLocaleString()}
        ATH Date: ${new Date(data.ath?.date).toLocaleDateString()}
        Cached: ${data.cached ? 'Yes' : 'No'}
      `);
    }
  } catch (error) {
    console.error('[Local Cron Trigger] Failed to fetch or parse current price API response:', error.message);
  }

  // Trigger historical prices API once per day at midnight
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() < INTERVAL_MINUTES) {
    console.log(`[Local Cron Trigger] Triggering historical prices API at ${currentTime}`);
    try {
      const response = await fetch(`${HISTORICAL_API_ENDPOINT}?t=${Date.now()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(`[Local Cron Trigger] Historical API Error (${response.status}):`, data.error || response.statusText);
      } else {
        console.log(`[Local Cron Trigger] Historical prices API call successful:
          Records Updated: ${data.data?.length || 0}
          Success: ${data.success ? 'Yes' : 'No'}
        `);
      }
    } catch (error) {
      console.error('[Local Cron Trigger] Failed to fetch or parse historical API response:', error.message);
    }
  }
}

console.log(`[Local Cron Trigger] Starting script to call APIs every ${INTERVAL_MINUTES} minutes.`);
triggerApi(); // Initial call
setInterval(triggerApi, INTERVAL_MS);

// Optional: Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Local Cron Trigger] Stopping script...');
  process.exit(0);
}); 