-- Fix Fear & Greed Index function to explicitly include last_updated in INSERT statements

-- Update the function to explicitly set the last_updated column
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
  cmc_api_key CONSTANT TEXT := '8ea69edc-8803-46fa-bd20-9699b6e37452'; -- Replace with your actual CMC API key if needed
BEGIN
  -- Log start of function using PostgreSQL's RAISE NOTICE
  RAISE NOTICE 'Starting Fear & Greed Index update from CoinMarketCap V3 API';

  -- Fetch from CoinMarketCap Fear & Greed Historical API (v3)
  SELECT content::jsonb INTO api_response 
  FROM http((
    'GET',
    'https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?time_start=' || 
      (extract(epoch from (now() - interval '1 day'))::bigint) || 
      '&time_end=' || extract(epoch from now())::bigint,
    ARRAY[
      http_header('X-CMC_PRO_API_KEY', cmc_api_key),
      http_header('Accept', 'application/json')
    ],
    NULL,
    NULL
  )::http_request);
  
  -- Extract the value from the API response using the v3 endpoint structure
  -- Get the most recent data point
  index_value := (api_response->'data'->-1->>'score')::INTEGER;
  
  -- Validate the value
  IF index_value IS NULL OR index_value < 0 OR index_value > 100 THEN
    RAISE EXCEPTION 'Invalid Fear & Greed index value received from CMC v3 API: %', index_value;
  END IF;
  
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
  
  -- Log the extracted value using RAISE NOTICE
  RAISE NOTICE 'Fetched CMC Fear & Greed Index: % (%) for date %', 
               index_value, index_classification, today_date;
  
  -- Check if we already have an entry for today
  IF EXISTS (SELECT 1 FROM public.fear_greed_index WHERE date = today_date) THEN
    -- Update existing entry
    UPDATE public.fear_greed_index
    SET value = index_value,
        classification = index_classification,
        last_updated = timezone('utc'::text, now())
    WHERE date = today_date;
    
    RAISE NOTICE 'Updated existing Fear & Greed Index entry for date %', today_date;
  ELSE
    -- Insert new entry with explicit last_updated value
    INSERT INTO public.fear_greed_index (value, classification, date, last_updated)
    VALUES (index_value, index_classification, today_date, timezone('utc'::text, now()));
    
    RAISE NOTICE 'Inserted new Fear & Greed Index entry for date %', today_date;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors using RAISE WARNING
  RAISE WARNING 'Error updating Fear & Greed Index from CMC v3 API: %', SQLERRM;
  
  -- Fallback to Alternative.me API if CMC API fails
  BEGIN
    RAISE NOTICE 'Falling back to Alternative.me API';
    
    SELECT content::jsonb INTO api_response 
    FROM http((
      'GET',
      'https://api.alternative.me/fng/',
      NULL,
      NULL,
      NULL
    )::http_request);
    
    -- Extract the value from the Alternative.me API response
    index_value := (api_response->'data'->0->>'value')::INTEGER;
    
    -- Validate the value
    IF index_value IS NULL OR index_value < 0 OR index_value > 100 THEN
      RAISE EXCEPTION 'Invalid Fear & Greed index value received from fallback API: %', index_value;
    END IF;
    
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
    
    -- Update or insert based on existing data
    IF EXISTS (SELECT 1 FROM public.fear_greed_index WHERE date = today_date) THEN
      UPDATE public.fear_greed_index
      SET value = index_value,
          classification = index_classification,
          last_updated = timezone('utc'::text, now())
      WHERE date = today_date;
      
      RAISE NOTICE 'Updated existing Fear & Greed Index entry using fallback API for date %', today_date;
    ELSE
      -- Insert new entry with explicit last_updated value
      INSERT INTO public.fear_greed_index (value, classification, date, last_updated)
      VALUES (index_value, index_classification, today_date, timezone('utc'::text, now()));
      
      RAISE NOTICE 'Inserted new Fear & Greed Index entry using fallback API for date %', today_date;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Fallback API also failed: %', SQLERRM;
    RAISE;
  END;
END;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.update_fear_greed_index() IS 'Fetches the current Fear & Greed Index from CoinMarketCap v3 API with fallback to Alternative.me API and updates the fear_greed_index table. Explicitly sets last_updated column.'; 