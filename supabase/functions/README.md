# BitBasis Edge Functions

This directory contains Supabase Edge Functions for the BitBasis application. These functions are scheduled to run periodically to update pricing data and other market information.

## Functions Overview

| Function | Description | Schedule |
|----------|-------------|----------|
| update-spot-price | Updates the current Bitcoin spot price | Every 10 minutes |
| update-btc-ath | Checks for new Bitcoin all-time high prices | Daily at midnight UTC |
| update-fear-greed | Updates the Fear & Greed Index | Daily at 1 AM UTC |

## Data Flow

These Edge Functions fetch data from external APIs and update the corresponding tables in Supabase:

1. **Spot Price**: Fetches the current Bitcoin price from Coinpaprika and stores it in the `spot_price` table.
2. **ATH**: Checks if the current Bitcoin price is higher than the stored all-time high value and updates the `ath` table if necessary.
3. **Fear & Greed Index**: Fetches the current market sentiment from the Fear & Greed API and updates the `fear_greed_index` table.

## Development & Deployment

### Local Development

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g @supabase/cli
   ```

2. Serve the functions locally:
   ```bash
   cd supabase
   supabase functions serve
   ```

3. Test a function locally:
   ```bash
   curl http://localhost:54321/functions/v1/update-spot-price
   ```

### Deployment

1. Deploy to Supabase:
   ```bash
   supabase functions deploy update-spot-price
   supabase functions deploy update-btc-ath
   supabase functions deploy update-fear-greed
   ```

2. Set up the scheduled runs using the schedule.json configuration:
   ```bash
   supabase functions deploy-schedule
   ```

## Environment Variables

These functions require the following environment variables to be set in the Supabase dashboard:

- `SUPABASE_URL`: The Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for database access

## Error Handling

All functions include comprehensive error handling and logging. Errors are:

1. Logged to the console
2. Stored in the `price_update_logs` table for later analysis
3. Returned in the response with appropriate HTTP status codes 