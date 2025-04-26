-- Enable the pg_cron extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to fetch the current Bitcoin price from Coinpaprika API and update the spot_price table
CREATE OR REPLACE FUNCTION public.fetch_and_update_btc_spot_price()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
BEGIN
  -- Fetch from external API using pg_net (or appropriate extension)
  -- Note: In production, this would use pg_net or similar to make HTTP requests
  -- For demonstration purposes, this is a placeholder
  
  -- Simulate API call response - in production, replace with actual HTTP request
  -- api_response = pg_net.http_get('https://api.coinpaprika.com/v1/tickers/btc-bitcoin')::jsonb;
  -- current_price = (api_response->>'price_usd')::NUMERIC(20, 2);
  
  -- For testing, we'll use a random price around 60000
  current_price = 60000 + (random() * 5000)::NUMERIC(20, 2);
  
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

-- Function to check for Bitcoin ATH and update the ath table if needed
CREATE OR REPLACE FUNCTION public.check_and_update_btc_ath()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
  ath_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- In production, this would make an API call to get ATH data
  -- For testing, we'll use the current spot price and check if it's an ATH
  
  -- Get the latest spot price
  SELECT price_usd INTO current_price FROM public.spot_price
  ORDER BY updated_at DESC LIMIT 1;
  
  -- If no spot price exists, exit
  IF current_price IS NULL THEN
    INSERT INTO public.price_update_logs (service, status, message)
    VALUES ('ath_update', 'warning', 'No spot price available to check for ATH');
    RETURN;
  END IF;
  
  -- Get the current ATH price
  DECLARE
    current_ath NUMERIC(20, 2);
  BEGIN
    SELECT price_usd INTO current_ath FROM public.ath
    ORDER BY price_usd DESC LIMIT 1;
    
    -- If no ATH exists or the current price is higher, update
    IF current_ath IS NULL OR current_price > current_ath THEN
      ath_date = timezone('utc'::text, now());
      
      -- Update the ATH using our function
      PERFORM public.update_ath(current_price, ath_date, 'calculated');
      
      INSERT INTO public.price_update_logs (service, status, message)
      VALUES ('ath_update', 'success', 'Updated BTC ATH to ' || current_price);
    ELSE
      INSERT INTO public.price_update_logs (service, status, message)
      VALUES ('ath_update', 'info', 'No new ATH detected. Current: ' || current_price || ', ATH: ' || current_ath);
    END IF;
  END;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('ath_update', 'error', 'Error checking BTC ATH: ' || SQLERRM);
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Function to update the fear and greed index
CREATE OR REPLACE FUNCTION public.update_fear_greed_index()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response JSONB;
  index_value INTEGER;
  index_classification VARCHAR(50);
  today_date DATE := CURRENT_DATE;
BEGIN
  -- In production, this would make an API call to get Fear & Greed data
  -- For testing purposes, we'll generate a random value
  
  index_value := 1 + floor(random() * 100)::INTEGER;
  
  -- Determine classification based on value
  IF index_value <= 25 THEN
    index_classification := 'Extreme Fear';
  ELSIF index_value <= 45 THEN
    index_classification := 'Fear';
  ELSIF index_value <= 55 THEN
    index_classification := 'Neutral';
  ELSIF index_value <= 75 THEN
    index_classification := 'Greed';
  ELSE
    index_classification := 'Extreme Greed';
  END IF;
  
  -- Check if we already have an entry for today
  IF EXISTS (SELECT 1 FROM public.fear_greed_index WHERE date = today_date) THEN
    -- Update existing entry
    UPDATE public.fear_greed_index
    SET value = index_value,
        classification = index_classification,
        last_updated = timezone('utc'::text, now())
    WHERE date = today_date;
  ELSE
    -- Insert new entry
    INSERT INTO public.fear_greed_index (value, classification, date)
    VALUES (index_value, index_classification, today_date);
  END IF;
  
  -- Log the update
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('fear_greed_update', 'success', 'Updated Fear & Greed Index to ' || index_value || ' (' || index_classification || ')');
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('fear_greed_update', 'error', 'Error updating Fear & Greed Index: ' || SQLERRM);
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Schedule cron jobs

-- BTC Spot Price - Every 10 minutes
SELECT cron.schedule(
  'update-btc-spot-price',
  '*/10 * * * *',
  'SELECT public.fetch_and_update_btc_spot_price()'
);

-- BTC ATH Check - Daily at midnight UTC
SELECT cron.schedule(
  'check-btc-ath',
  '0 0 * * *',
  'SELECT public.check_and_update_btc_ath()'
);

-- Fear & Greed Index - Daily at 1 AM UTC
SELECT cron.schedule(
  'update-fear-greed-index',
  '0 1 * * *',
  'SELECT public.update_fear_greed_index()'
);

-- Grant necessary permissions to the postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres; 