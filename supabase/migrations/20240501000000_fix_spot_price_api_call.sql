-- Fix the fetch_and_update_btc_spot_price function to use the real API
CREATE OR REPLACE FUNCTION public.fetch_and_update_btc_spot_price()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
BEGIN
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
  
  -- Log the update attempt
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('spot_price_update', 'success', 'Updated BTC spot price to ' || current_price);
  
  -- Update the spot price using our function
  PERFORM public.update_spot_price(current_price, 'coinpaprika');
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('spot_price_update', 'error', 'Error updating BTC spot price: ' || SQLERRM);
  
  -- Re-raise the exception
  RAISE;
END;
$$; 