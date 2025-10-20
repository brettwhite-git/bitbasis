-- Migration: 20251021000001_secure_functions_batch_2.sql
-- Purpose: Add search_path protection to data access control functions
-- Risk Level: Low - Function logic unchanged, only adding security hardening
-- Rollback: Revert to prior migration

-- ============================================================================
-- 1. get_last_day_of_month - Calculate last day of month utility
-- ============================================================================
-- BEFORE: Inherited session search_path
-- AFTER: Explicit search_path protection
CREATE OR REPLACE FUNCTION public.get_last_day_of_month(input_date date)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  RETURN (DATE_TRUNC('month', input_date) + INTERVAL '1 month - 1 day')::DATE;
END;
$function$;

-- ============================================================================
-- 2. get_latest_terms_acceptance - Get user's latest terms acceptance
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified table references
CREATE OR REPLACE FUNCTION public.get_latest_terms_acceptance(p_user_id uuid)
RETURNS TABLE(terms_version character varying, privacy_version character varying, accepted_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ta.terms_version, ta.privacy_version, ta.accepted_at
  FROM public.terms_acceptance ta
  WHERE ta.user_id = p_user_id
  ORDER BY ta.accepted_at DESC
  LIMIT 1;
END;
$function$;

-- ============================================================================
-- 3. is_last_day_of_month - Check if today is last day of month
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified function reference
-- AFTER: Explicit search_path, fully qualified function reference
CREATE OR REPLACE FUNCTION public.is_last_day_of_month()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  RETURN CURRENT_DATE = public.get_last_day_of_month(CURRENT_DATE);
END;
$function$;

-- ============================================================================
-- 4. update_updated_at_column - Trigger function to update timestamp
-- ============================================================================
-- BEFORE: Inherited session search_path
-- AFTER: Explicit search_path protection (trigger functions need this too)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- ============================================================================
-- 5. validate_monthly_close_completeness - Check for missing monthly close data
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified function/table references
-- AFTER: Explicit search_path, fully qualified schema references
CREATE OR REPLACE FUNCTION public.validate_monthly_close_completeness(start_date date DEFAULT '2010-07-31'::date, end_date date DEFAULT NULL::date)
RETURNS TABLE(missing_month date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  check_end_date DATE;
BEGIN
  -- Default to last month if end_date not provided
  IF end_date IS NULL THEN
    check_end_date := public.get_last_day_of_month((CURRENT_DATE - INTERVAL '1 month')::DATE);
  ELSE
    check_end_date := end_date;
  END IF;
  
  RETURN QUERY
  WITH RECURSIVE month_series AS (
    SELECT start_date as month_end
    UNION ALL
    SELECT public.get_last_day_of_month((month_end + INTERVAL '1 month')::DATE)
    FROM month_series
    WHERE month_end < check_end_date
  )
  SELECT ms.month_end
  FROM month_series ms
  LEFT JOIN public.btc_monthly_close bmc ON ms.month_end = bmc.date
  WHERE bmc.date IS NULL
  ORDER BY ms.month_end;
END;
$function$;

