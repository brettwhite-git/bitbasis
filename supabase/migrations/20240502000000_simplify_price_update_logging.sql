-- Simplify the fetch_and_update_btc_spot_price function to use PostgreSQL's native logging
CREATE OR REPLACE FUNCTION public.fetch_and_update_btc_spot_price()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
BEGIN
  -- Log the start of the function using Postgres's RAISE NOTICE
  RAISE NOTICE 'Starting Bitcoin price update from Coinpaprika API';

  -- Fetch from Coinpaprika API using pg_net
  SELECT content::jsonb INTO api_response 
  FROM http((
    'GET',
    'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
    NULL,
    NULL,
    NULL
  )::http_request);
  
  -- Extract the price from the API response
  current_price = (api_response->'quotes'->'USD'->>'price')::NUMERIC(20, 2);
  
  -- Validate the price
  IF current_price IS NULL OR current_price <= 0 THEN
    RAISE EXCEPTION 'Invalid price received from API: %', current_price;
  END IF;
  
  -- Log success using RAISE NOTICE
  RAISE NOTICE 'Successfully fetched BTC price: % USD', current_price;
  
  -- Update the spot price using our function
  PERFORM public.update_spot_price(current_price, 'coinpaprika');
  
  -- Log completion
  RAISE NOTICE 'Completed Bitcoin price update to % USD', current_price;
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors using RAISE WARNING
  RAISE WARNING 'Error updating BTC spot price: %', SQLERRM;
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Function to explain the migration approach
COMMENT ON FUNCTION public.fetch_and_update_btc_spot_price() IS 'Fetches the current Bitcoin price from Coinpaprika API and updates the spot_price table. Uses PostgreSQL''s native logging via RAISE NOTICE/WARNING instead of a custom logs table.';

-- Add a note about viewing logs
DO $$
BEGIN
  RAISE NOTICE 'IMPORTANT: To view logs from this function, check the Supabase SQL Editor logs or your database logs. No separate log table is needed.';
END $$; 