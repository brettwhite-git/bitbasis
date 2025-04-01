// Uses Node.js built-in fetch (available in Node.js v18+)
// If you are using an older Node.js version (<18), you might need to:
// 1. Install node-fetch: npm install node-fetch
// 2. Uncomment the next line:
// const fetch = require('node-fetch');

const API_ENDPOINT = 'http://localhost:3000/api/bitcoin/price';
const INTERVAL_MINUTES = 10; // Updated to 10 minutes for Coinpaprika free tier
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

async function triggerApi() {
  console.log(`[Local Cron Trigger] Triggering ${API_ENDPOINT} at ${new Date().toLocaleTimeString()}`);
  try {
    // Add cache-busting parameter just in case there's browser/proxy caching involved locally
    const response = await fetch(`${API_ENDPOINT}?t=${Date.now()}`); 
    const data = await response.json(); // Always try to parse JSON

    if (!response.ok) {
      console.error(`[Local Cron Trigger] API Error (${response.status}):`, data.error || response.statusText);
    } else {
      // Enhanced logging to include ATH data
      console.log(`[Local Cron Trigger] API call successful:
        Current Price: $${data.price?.toLocaleString()}
        ATH Price: $${data.ath?.price?.toLocaleString()}
        ATH Date: ${new Date(data.ath?.date).toLocaleDateString()}
        Cached: ${data.cached ? 'Yes' : 'No'}
      `);
    }
  } catch (error) {
    console.error('[Local Cron Trigger] Failed to fetch or parse API response:', error.message);
  }
}

console.log(`[Local Cron Trigger] Starting script to call Coinpaprika API every ${INTERVAL_MINUTES} minutes.`);

// Trigger immediately on start
console.log("[Local Cron Trigger] Performing initial trigger...");
triggerApi();

// Set up the interval for subsequent triggers
const intervalId = setInterval(triggerApi, INTERVAL_MS);

console.log("[Local Cron Trigger] Script running. Press Ctrl+C to stop.");

// Optional: Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Local Cron Trigger] Stopping script...');
  clearInterval(intervalId);
  process.exit(0);
}); 