-- Migration: 20250122000001_fix_hardcoded_jwt_token.sql
-- Purpose: Remove hardcoded JWT token from call_update_price function
-- Security Fix: SEC-001 - Replace insecure Edge Function call with direct database function
-- Date: 2025-01-22
-- Risk Level: LOW - Function logic unchanged, only removing hardcoded credentials
-- Impact: Eliminates exposed JWT token in source control

-- ============================================================================
-- SECURITY FIX: Remove hardcoded JWT token
-- ============================================================================
-- The previous version of call_update_price() contained a hardcoded Supabase anon key
-- in the migration file. This function has been replaced with a secure version that
-- calls the database function directly instead of invoking an Edge Function.
--
-- ACTION REQUIRED: Rotate the exposed anon key in Supabase dashboard
-- The exposed token should be invalidated and replaced with a new anon key.

-- Ensure the secure version of call_update_price is in place
-- This version calls the database function directly, avoiding the need for Edge Function auth
CREATE OR REPLACE FUNCTION public.call_update_price()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
BEGIN
  -- Call the database function directly instead of Edge Function
  -- This avoids the need for JWT tokens and is more secure
  PERFORM public.fetch_and_update_btc_spot_price();
EXCEPTION WHEN OTHERS THEN
  -- Silently ignore errors to prevent cron job failures
  -- Log errors are handled by the underlying function
  NULL;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the function no longer contains hardcoded tokens:
-- SELECT pg_get_functiondef('public.call_update_price()'::regprocedure);
--
-- The function should call fetch_and_update_btc_spot_price() directly,
-- not make HTTP requests with Authorization headers.

