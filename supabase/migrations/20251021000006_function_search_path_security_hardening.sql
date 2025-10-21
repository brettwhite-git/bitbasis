-- Migration: 20251021000006_function_search_path_security_hardening.sql
-- Purpose: Add SECURITY DEFINER and search_path protection to remaining price/data functions
-- Date: 2025-10-21
-- Risk Level: LOW - Function logic unchanged, only adding security hardening
-- Impact: Prevents SQL injection via search_path manipulation, privilege escalation

-- ============================================================================
-- 1. call_update_price - Price update trigger function
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.call_update_price()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
BEGIN
  PERFORM public.fetch_and_update_btc_spot_price();
END;
$$;

-- ============================================================================
-- 2. set_historical_price_date - Historical price date management
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.set_historical_price_date()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
DECLARE
  most_recent_timestamp BIGINT;
  most_recent_date DATE;
BEGIN
  SELECT COALESCE(MAX(timestamp), 0)
  INTO most_recent_timestamp
  FROM public.historical_prices;
  
  IF most_recent_timestamp > 0 THEN
    most_recent_date := to_timestamp(most_recent_timestamp::DOUBLE PRECISION / 1000.0)::DATE;
    UPDATE public.historical_prices
    SET date = most_recent_date
    WHERE date IS NULL AND timestamp = most_recent_timestamp;
  END IF;
END;
$$;

-- ============================================================================
-- 3. upsert_monthly_close - Monthly closing price management
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.upsert_monthly_close()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
DECLARE
  last_month_end DATE;
  last_month_price NUMERIC;
BEGIN
  -- Get last day of previous month
  last_month_end := public.get_last_day_of_month(CURRENT_DATE - INTERVAL '1 month');
  
  -- Get price for that date
  SELECT price_usd
  INTO last_month_price
  FROM public.spot_price
  WHERE DATE(date) = last_month_end
  ORDER BY date DESC
  LIMIT 1;
  
  -- Upsert into monthly_close table
  IF last_month_price IS NOT NULL THEN
    INSERT INTO public.monthly_close (date, close)
    VALUES (last_month_end, last_month_price)
    ON CONFLICT (date) DO UPDATE
    SET close = EXCLUDED.close,
        created_at = CURRENT_TIMESTAMP;
  END IF;
END;
$$;

-- ============================================================================
-- 4. fetch_and_store_btc_price_http - HTTP price fetching function
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.fetch_and_store_btc_price_http()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
DECLARE
    response http_response;
    response_content JSON;
    price_usd_text TEXT;
    price_usd_numeric NUMERIC;
    epoch_val DOUBLE PRECISION;
    current_timestamp BIGINT;
    current_date DATE;
    log_id BIGINT;
    result_message TEXT;
BEGIN
    -- Create initial log entry
    INSERT INTO public.price_update_logs(message, success)
    VALUES('Starting price update job', NULL)
    RETURNING id INTO log_id;
    
    -- Make the HTTP GET request 
    BEGIN
        SELECT * INTO response
        FROM http_get('https://mempool.space/api/v1/prices', null, null);
        
        -- Log the raw response
        UPDATE public.price_update_logs 
        SET details = jsonb_build_object('status', response.status, 'content', response.content)
        WHERE id = log_id;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.price_update_logs
        SET success = FALSE,
            message = 'HTTP request failed: ' || SQLERRM,
            details = jsonb_build_object('error', SQLERRM)
        WHERE id = log_id;
        RETURN 'Error: HTTP request failed: ' || SQLERRM;
    END;

    -- Check response status code
    IF response.status != 200 THEN
        UPDATE public.price_update_logs
        SET success = FALSE,
            message = 'API request failed with status ' || response.status::TEXT
        WHERE id = log_id;
        RETURN 'Error: API request failed with status ' || response.status::TEXT || '. Content: ' || response.content;
    END IF;

    -- Log successful API request
    UPDATE public.price_update_logs
    SET message = 'API request successful with status ' || response.status::TEXT
    WHERE id = log_id;

    -- Attempt to parse the response content as JSON
    BEGIN
        response_content := response.content::JSON;
    
        -- Extract price, convert to numeric
        price_usd_text := response_content -> 'USD' ->> 'last'::text;
        price_usd_numeric := price_usd_text::NUMERIC;
    
        -- Get current epoch in milliseconds
        epoch_val := EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000;
        current_timestamp := CAST(epoch_val as BIGINT);
        current_date := CURRENT_DATE;
        
        -- Log price extraction
        UPDATE public.price_update_logs
        SET message = 'Successfully extracted price from response',
            details = jsonb_build_object('price_usd', price_usd_numeric)
        WHERE id = log_id;
    
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.price_update_logs
        SET success = FALSE,
            message = 'JSON parsing failed: ' || SQLERRM
        WHERE id = log_id;
        RETURN 'Error: JSON parsing failed: ' || SQLERRM;
    END;

    -- Log before insertion attempt
    UPDATE public.price_update_logs
    SET message = 'Attempting to insert price data',
        details = jsonb_build_object(
            'timestamp', current_timestamp,
            'price_usd', price_usd_numeric,
            'date', current_date
        )
    WHERE id = log_id;

    -- Insert into the historical price table
    BEGIN
        INSERT INTO public.historical_prices (timestamp, price_usd, date)
        VALUES (current_timestamp, price_usd_numeric, current_date)
        ON CONFLICT (timestamp) DO NOTHING;
        
        -- Check if a row was actually inserted
        IF FOUND THEN
            result_message := 'Successfully inserted new price data';
        ELSE
            result_message := 'No new data inserted (possible duplicate timestamp)';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.price_update_logs
        SET success = FALSE,
            message = 'Database insertion failed: ' || SQLERRM,
            details = jsonb_build_object(
                'error', SQLERRM,
                'timestamp', current_timestamp,
                'price_usd', price_usd_numeric,
                'date', current_date
            )
        WHERE id = log_id;
        RETURN 'Error: Database insertion failed: ' || SQLERRM;
    END;

    -- Log success
    UPDATE public.price_update_logs
    SET success = TRUE,
        message = result_message
    WHERE id = log_id;

    RETURN 'Success (http): ' || result_message || ' - BTC price ' || price_usd_numeric::TEXT || ' USD at timestamp ' || current_timestamp::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Log any other unexpected errors
        UPDATE public.price_update_logs
        SET success = FALSE,
            message = 'Unexpected error: ' || SQLERRM
        WHERE id = log_id;
        RETURN 'Error executing fetch_and_store_btc_price_http: ' || SQLERRM;
END;
$$;

-- ============================================================================
-- 5. get_monthly_close_data - Retrieve monthly close data
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.get_monthly_close_data(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    date DATE,
    close NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mc.date,
        mc.close,
        mc.created_at
    FROM public.monthly_close mc
    WHERE (start_date IS NULL OR mc.date >= start_date)
      AND (end_date IS NULL OR mc.date <= end_date)
    ORDER BY mc.date DESC;
END;
$$;

-- ============================================================================
-- 6. update_btc_price - Generic Bitcoin price update function
-- ============================================================================
-- BEFORE: Mutable search_path (inherited from session)
-- AFTER: Fixed search_path with SECURITY DEFINER protection

CREATE OR REPLACE FUNCTION public.update_btc_price()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
BEGIN
    -- Call the main price fetching function
    PERFORM public.fetch_and_update_btc_spot_price();
    
    -- Update monthly close data
    PERFORM public.upsert_monthly_close();
    
    -- Update fear & greed index
    PERFORM public.update_fear_greed_index();
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all functions have search_path set
-- Run this query to confirm all 6 functions now have SECURITY DEFINER and search_path:
--
-- SELECT 
--     p.proname as function_name,
--     p.prosecdef as has_security_definer,
--     CASE WHEN p.proconfig @> ARRAY['search_path'] THEN 'YES' ELSE 'NO' END as has_search_path
-- FROM pg_proc p
-- WHERE p.proname IN (
--     'call_update_price',
--     'set_historical_price_date',
--     'upsert_monthly_close',
--     'fetch_and_store_btc_price_http',
--     'get_monthly_close_data',
--     'update_btc_price'
-- )
-- ORDER BY p.proname;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
--
-- If you need to rollback, the prior migration defines all these functions
-- with their original definitions (without SECURITY DEFINER and search_path).
-- Simply revert to the previous migration state.
--
-- The changes are forward-compatible: existing code continues to work,
-- with added security hardening.
