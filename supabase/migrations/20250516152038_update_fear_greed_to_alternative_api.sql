-- Update the Fear & Greed Index function to use Alternative.me API exclusively
-- This simplifies API dependencies and ensures consistent behavior across environments

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
  -- Log start of function using PostgreSQL's RAISE NOTICE
  RAISE NOTICE 'Starting Fear & Greed Index update using Alternative.me API';

  -- Fetch from Alternative.me Fear & Greed API (free, no API key required)
  SELECT content::jsonb INTO api_response 
  FROM http((
    'GET',
    'https://api.alternative.me/fng/',
    NULL,
    NULL,
    NULL
  )::http_request);
  
  -- Extract the value from the API response
  index_value := (api_response->'data'->0->>'value')::INTEGER;
  
  -- Validate the value
  IF index_value IS NULL OR index_value < 0 OR index_value > 100 THEN
    RAISE EXCEPTION 'Invalid Fear & Greed index value received from Alternative.me API: %', index_value;
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
  RAISE NOTICE 'Fetched Fear & Greed Index: % (%) for date %', 
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
    -- Insert new entry
    INSERT INTO public.fear_greed_index (value, classification, date)
    VALUES (index_value, index_classification, today_date);
    
    RAISE NOTICE 'Inserted new Fear & Greed Index entry for date %', today_date;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors using RAISE WARNING
  RAISE WARNING 'Error updating Fear & Greed Index: %', SQLERRM;
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Add comments for clarity
COMMENT ON FUNCTION public.update_fear_greed_index() IS 'Fetches the Fear & Greed Index from Alternative.me API and updates the fear_greed_index table. Simplified to use a single API source for consistency across environments.';

-- No changes to cron job schedule - we keep the existing schedule
-- Note: To modify the schedule, uncomment and adjust the following:
/*
SELECT cron.unschedule('update-fear-greed-index');
SELECT cron.schedule(
  'update-fear-greed-index',
  '0 1,13 * * *',  -- Twice daily at 1 AM and 1 PM UTC
  'SELECT public.update_fear_greed_index()'
);
*/ 