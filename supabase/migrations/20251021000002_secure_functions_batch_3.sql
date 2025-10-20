-- Migration: 20251021000002_secure_functions_batch_3.sql
-- Purpose: Add search_path protection to Bitcoin price management SECURITY DEFINER functions
-- Risk Level: Low - Function logic unchanged, only adding security hardening
-- Note: Only functions with SECURITY DEFINER need search_path protection
-- Rollback: Revert to prior migration

-- ============================================================================
-- 1. fetch_and_update_btc_spot_price - API integration for Coinpaprika
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified references and function calls
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

  -- Fetch from Coinpaprika API using pg_net
  SELECT content::jsonb INTO api_response 
  FROM http((
    'GET',
    'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
    NULL,
    NULL,
    NULL
  ));
  
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
-- 2. update_spot_price - Core price update function
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified table references
CREATE OR REPLACE FUNCTION public.update_spot_price(new_price_usd numeric, source_name character varying DEFAULT 'coinpaprika'::character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.spot_price (price_usd, source, updated_at)
  VALUES (new_price_usd, source_name, timezone('utc'::text, now()));
  
  -- Keep only the most recent 100 records to prevent unbounded growth
  DELETE FROM public.spot_price
  WHERE id NOT IN (
    SELECT id FROM public.spot_price
    ORDER BY updated_at DESC
    LIMIT 100
  );
END;
$function$;

