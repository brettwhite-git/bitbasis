-- Update the check_and_update_btc_ath function to use real Coinpaprika API in production
CREATE OR REPLACE FUNCTION public.check_and_update_btc_ath()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
  ath_date TIMESTAMP WITH TIME ZONE;
  current_ath NUMERIC(20, 2);
  api_url TEXT := 'https://api.coinpaprika.com/v1/coins/btc-bitcoin';
BEGIN
  -- Direct API call to Coinpaprika for BTC data
  -- Use pg_net to make real HTTP requests
  
  -- Make API call to Coinpaprika
  SELECT
    content::jsonb INTO api_response
  FROM
    http((
      'GET',
      api_url,
      NULL,
      NULL,
      NULL
    ));
    
  -- Parse the response to get ATH data
  -- The API returns data like {"id":"btc-bitcoin",...,"all_time_high":{"price":69000,"timestamp":"2021-11-10T00:00:00Z"}}
  
  -- Extract ATH price and date from response
  current_price := (api_response->'all_time_high'->>'price')::NUMERIC(20, 2);
  ath_date := (api_response->'all_time_high'->>'timestamp')::TIMESTAMP WITH TIME ZONE;
  
  -- Get the current ATH if it exists
  SELECT price_usd INTO current_ath FROM public.ath
  ORDER BY price_usd DESC LIMIT 1;
  
  -- If no ATH exists or the new price is higher, update
  IF current_ath IS NULL OR current_price > current_ath THEN
    INSERT INTO public.ath (price_usd, ath_date, source, updated_at)
    VALUES (current_price, ath_date, 'coinpaprika', timezone('utc'::text, now()));
    
    -- Log to standard output for Supabase logs
    RAISE NOTICE 'New BTC ATH recorded: % USD on %', current_price, ath_date;
  ELSE
    -- Log that no update was needed
    RAISE NOTICE 'No new ATH. Current ATH remains: %', current_ath;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error to standard output for Supabase logs
  RAISE WARNING 'Error checking BTC ATH: %', SQLERRM;
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Ensure the schedule exists for daily checks at midnight UTC
SELECT cron.schedule(
  'daily-btc-ath-check',
  '0 0 * * *',
  'SELECT public.check_and_update_btc_ath()'
); 