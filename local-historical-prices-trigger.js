// Uses Node.js built-in fetch (available in Node.js v18+)

async function triggerHistoricalPrices() {
  try {
    console.log('Triggering historical prices endpoint...')
    const response = await fetch('http://localhost:3000/api/cron/historical-prices')
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

triggerHistoricalPrices() 