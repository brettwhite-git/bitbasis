-- Migration: 20251021000005_fix_http_function_search_paths.sql
-- Purpose: Add search_path protection to HTTP functions that currently lack it
-- Risk Level: LOW - Function logic unchanged, only adding security hardening
-- Addressed Issues: Supabase Security Advisor warnings for 3 functions

-- NOTE: These functions need TWO protections:
-- 1. SET search_path = 'public,pg_catalog' to restrict schema access
-- 2. Fully qualified extensions.http() calls (already in place on production)

-- The production versions have the http() calls fully qualified with extensions schema,
-- but are missing the SET search_path clause. Adding that now for complete protection.

-- ============================================================================
-- 1. check_and_update_btc_ath - Add search_path protection
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_and_update_btc_ath()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
  ath_date TIMESTAMP WITH TIME ZONE;
  current_ath NUMERIC(20, 2);
  api_url TEXT := 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin';
BEGIN
  SELECT content::jsonb INTO api_response
  FROM extensions.http((
    'GET'::text,
    api_url::text,
    NULL::text[],
    NULL::text,
    NULL::text
  )::extensions.http_request);

  current_price := (api_response->'quotes'->'USD'->>'ath_price')::NUMERIC(20, 2);
  ath_date := (api_response->'quotes'->'USD'->>'ath_date')::TIMESTAMP WITH TIME ZONE;

  IF current_price IS NULL OR ath_date IS NULL THEN
    RAISE EXCEPTION 'Missing ATH data in API response: price=%, date=%', current_price, ath_date;
  END IF;

  SELECT price_usd INTO current_ath FROM public.ath ORDER BY price_usd DESC LIMIT 1;

  IF current_ath IS NULL OR current_price > current_ath THEN
    INSERT INTO public.ath (price_usd, ath_date, source, updated_at)
    VALUES (current_price, ath_date, 'coinpaprika', timezone('utc'::text, now()));
    RAISE NOTICE 'New BTC ATH recorded: % USD on %', current_price, ath_date;
  ELSE
    RAISE NOTICE 'No new ATH. Current ATH remains: %', current_ath;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error checking BTC ATH: %', SQLERRM;
  RAISE;
END;
$function$;

-- ============================================================================
-- 2. fetch_and_update_btc_spot_price - Add search_path protection
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fetch_and_update_btc_spot_price()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  api_response JSONB;
  current_price NUMERIC(20, 2);
BEGIN
  -- Log the start of the function using Postgres's RAISE NOTICE
  RAISE NOTICE 'Starting Bitcoin price update from Coinpaprika API';

  -- Fetch from Coinpaprika API - use fully qualified function call
  SELECT content::jsonb INTO api_response
  FROM extensions.http((
    'GET'::text,
    'https://api.coinpaprika.com/v1/tickers/btc-bitcoin'::text,
    NULL::text[],
    NULL::text,
    NULL::text
  )::extensions.http_request);

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
$function$;

-- ============================================================================
-- 3. update_fear_greed_index - Add search_path protection
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_fear_greed_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  api_response JSONB;
  index_value INTEGER;
  index_classification VARCHAR(50);
  today_date DATE := CURRENT_DATE;
BEGIN
  RAISE NOTICE 'Starting Fear & Greed Index update using Alternative.me API';

  SELECT content::jsonb INTO api_response
  FROM extensions.http((
    'GET'::text,
    'https://api.alternative.me/fng/'::text,
    NULL::text[],
    NULL::text,
    NULL::text
  )::extensions.http_request);

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
    SET value = index_value, classification = index_classification, last_updated = timezone('utc'::text, now())
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
