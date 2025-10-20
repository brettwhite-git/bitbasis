-- Migration: 20251021000003_secure_functions_batch_4.sql
-- Purpose: Add search_path protection to market data SECURITY DEFINER functions
-- Risk Level: Low - Function logic unchanged, only adding security hardening
-- Note: Functions using http() extension include 'extensions' in search_path
-- Rollback: Revert to prior migration

-- ============================================================================
-- 1. check_and_update_btc_ath - Check and update Bitcoin all-time high
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path including extensions, fully qualified references
CREATE OR REPLACE FUNCTION public.check_and_update_btc_ath()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog,extensions'
AS $function$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
  ath_date TIMESTAMP WITH TIME ZONE;
  current_ath NUMERIC(20, 2);
  api_url TEXT := 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin';
BEGIN
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
    
  -- Extract ATH price and date from response (using quotes.USD structure)
  current_price := (api_response->'quotes'->'USD'->>'ath_price')::NUMERIC(20, 2);
  ath_date := (api_response->'quotes'->'USD'->>'ath_date')::TIMESTAMP WITH TIME ZONE;
  
  -- Add error handling for missing data
  IF current_price IS NULL OR ath_date IS NULL THEN
    RAISE EXCEPTION 'Missing ATH data in API response: price=%, date=%', current_price, ath_date;
  END IF;
  
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
  RAISE WARNING 'API response: %', api_response;
  
  -- Re-raise the exception
  RAISE;
END;
$function$;

-- ============================================================================
-- 2. update_ath - Wrapper function to update all-time high
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified table references
CREATE OR REPLACE FUNCTION public.update_ath(new_price_usd numeric, new_ath_date timestamp with time zone, source_name character varying DEFAULT 'coinpaprika'::character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  current_ath NUMERIC(20, 2);
BEGIN
  -- Get the current ATH if it exists
  SELECT price_usd INTO current_ath FROM public.ath
  ORDER BY price_usd DESC LIMIT 1;
  
  -- Log what we're checking
  INSERT INTO public.price_update_logs (service, status, message)
  VALUES ('ath_update', 'info', 'Checking if ' || new_price_usd || ' > ' || COALESCE(current_ath::text, 'NULL'));

  -- If no ATH exists or the new price is higher, update
  IF current_ath IS NULL OR new_price_usd > current_ath THEN
    INSERT INTO public.ath (price_usd, ath_date, source, updated_at)
    VALUES (new_price_usd, new_ath_date, source_name, timezone('utc'::text, now()));
    
    -- Log the new ATH
    INSERT INTO public.price_update_logs (service, status, message)
    VALUES ('ath_update', 'success', 'New ATH recorded: ' || new_price_usd || ' USD on ' || new_ath_date);
  ELSE
    -- Log that no update was needed
    INSERT INTO public.price_update_logs (service, status, message)
    VALUES ('ath_update', 'info', 'No new ATH. Current ATH remains: ' || current_ath);
  END IF;
END;
$function$;

-- ============================================================================
-- 3. update_fear_greed_index - Update Fear & Greed Index from API
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path including extensions, fully qualified references
CREATE OR REPLACE FUNCTION public.update_fear_greed_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog,extensions'
AS $function$
DECLARE
  api_response JSONB;
  index_value INTEGER;
  index_classification VARCHAR(50);
  today_date DATE := CURRENT_DATE;
BEGIN
  RAISE NOTICE 'Starting Fear & Greed Index update using Alternative.me API';
  
  SELECT content::jsonb INTO api_response
  FROM http(('GET', 'https://api.alternative.me/fng/', NULL, NULL, NULL)::http_request);
  
  index_value := (api_response->'data'->0->>'value')::INTEGER;
  
  IF index_value IS NULL OR index_value < 0 OR index_value > 100 THEN
    RAISE EXCEPTION 'Invalid Fear & Greed index value received from Alternative.me API: %', index_value;
  END IF;
  
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
  
  RAISE NOTICE 'Fetched Fear & Greed Index: % (%) for date %', index_value, index_classification, today_date;
  
  IF EXISTS (SELECT 1 FROM public.fear_greed_index WHERE date = today_date) THEN
    UPDATE public.fear_greed_index
    SET value = index_value,
        classification = index_classification,
        last_updated = timezone('utc'::text, now())
    WHERE date = today_date;
    
    RAISE NOTICE 'Updated existing Fear & Greed Index entry for date %', today_date;
  ELSE
    INSERT INTO public.fear_greed_index (value, classification, date, last_updated)
    VALUES (index_value, index_classification, today_date, timezone('utc'::text, now()));
    
    RAISE NOTICE 'Inserted new Fear & Greed Index entry for date %', today_date;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error updating Fear & Greed Index: %', SQLERRM;
  RAISE;
END;
$function$;

-- ============================================================================
-- 4. update_btc_monthly_close_updated_at - Trigger to update timestamp
-- ============================================================================
-- BEFORE: Inherited session search_path
-- AFTER: Explicit search_path protection for consistency
CREATE OR REPLACE FUNCTION public.update_btc_monthly_close_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

