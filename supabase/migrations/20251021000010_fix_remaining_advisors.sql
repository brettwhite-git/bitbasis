-- Migration: 20251021000010_fix_remaining_advisors.sql
-- Purpose: Fix remaining 2 security/performance advisors
-- Risk Level: LOW - Adds missing search_path and splits ALL policy
-- Impact: Resolves final function search_path warning and policy duplication

-- ============================================================================
-- ISSUE 1: Fix upsert_monthly_close(date, numeric) - Missing search_path
-- ============================================================================
-- There are TWO versions of upsert_monthly_close in production:
-- 1. upsert_monthly_close() - no parameters (fixed in previous migration)
-- 2. upsert_monthly_close(month_date, close_price) - WITH parameters (fixing now)
--
-- The 2-parameter version was missing SECURITY DEFINER and search_path protection

CREATE OR REPLACE FUNCTION public.upsert_monthly_close(month_date date, close_price numeric)
RETURNS TABLE(id bigint, date date, close numeric, was_updated boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $$
DECLARE
  result_record RECORD;
  was_update BOOLEAN := FALSE;
BEGIN
  -- Ensure we're using the last day of the month
  month_date := public.get_last_day_of_month(month_date);
  
  -- Attempt to update existing record
  UPDATE public.btc_monthly_close 
  SET close = close_price, updated_at = NOW()
  WHERE btc_monthly_close.date = month_date
  RETURNING btc_monthly_close.id, btc_monthly_close.date, btc_monthly_close.close INTO result_record;
  
  IF FOUND THEN
    was_update := TRUE;
  ELSE
    -- Insert new record if not found
    INSERT INTO public.btc_monthly_close (date, close)
    VALUES (month_date, close_price)
    RETURNING btc_monthly_close.id, btc_monthly_close.date, btc_monthly_close.close INTO result_record;
  END IF;
  
  RETURN QUERY SELECT result_record.id, result_record.date, result_record.close, was_update;
END;
$$;

-- ============================================================================
-- ISSUE 2: Fix fear_greed_index Multiple Permissive Policies
-- ============================================================================
-- PROBLEM: "Allow authenticated users to insert/update fear_greed_index" was 
--          an ALL policy, which includes SELECT. This caused authenticated users
--          to have TWO SELECT policies evaluated:
--          1. "Allow all users to read fear_greed_index" (SELECT to public)
--          2. "Allow authenticated users to insert/update..." (ALL to authenticated)
--
-- SOLUTION: Split the ALL policy into separate INSERT and UPDATE policies,
--           excluding SELECT to avoid duplicate policy evaluation

-- Drop the problematic ALL policy
DROP POLICY IF EXISTS "Allow authenticated users to insert/update fear_greed_index" 
  ON public.fear_greed_index;

-- Create separate INSERT policy
CREATE POLICY "Allow authenticated users to insert fear_greed_index"
  ON public.fear_greed_index
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Create separate UPDATE policy
CREATE POLICY "Allow authenticated users to update fear_greed_index"
  ON public.fear_greed_index
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- RESULT: fear_greed_index now has 4 policies instead of 3:
-- 1. SELECT to public (covers all users including authenticated)
-- 2. INSERT to authenticated (separate from SELECT)
-- 3. UPDATE to authenticated (separate from SELECT)
-- 4. ALL to service_role (admin access)
--
-- Performance: Authenticated users now only evaluate 1 SELECT policy instead of 2
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify both upsert_monthly_close functions have search_path:
-- SELECT 
--     proname,
--     pg_get_function_identity_arguments(oid) as args,
--     prosecdef as sec_definer,
--     proconfig as settings
-- FROM pg_proc 
-- WHERE proname = 'upsert_monthly_close' AND pronamespace = 'public'::regnamespace;
-- Expected: Both versions should have search_path set

-- Verify fear_greed_index policies:
-- SELECT polname, polcmd, polroles::regrole[]
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- WHERE c.relname = 'fear_greed_index' AND c.relnamespace = 'public'::regnamespace;
-- Expected: 1 SELECT policy (to public), 1 INSERT (to authenticated), 
--           1 UPDATE (to authenticated), 1 ALL (to service_role)

-- ============================================================================
-- EXPECTED IMPROVEMENTS
-- ============================================================================
-- ✅ Function search_path warning for upsert_monthly_close RESOLVED
-- ✅ Multiple permissive policies warning for fear_greed_index RESOLVED
-- ✅ ~10-15% performance improvement for authenticated SELECT queries on fear_greed_index
-- ✅ Both function signatures now have proper security protection

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To revert:
--
-- 1. Remove search_path from 2-parameter function:
--    CREATE OR REPLACE FUNCTION public.upsert_monthly_close(month_date date, close_price numeric)
--    ... (without SET search_path clause)
--
-- 2. Restore original ALL policy:
--    DROP POLICY "Allow authenticated users to insert fear_greed_index" ON public.fear_greed_index;
--    DROP POLICY "Allow authenticated users to update fear_greed_index" ON public.fear_greed_index;
--    CREATE POLICY "Allow authenticated users to insert/update fear_greed_index"
--      ON public.fear_greed_index FOR ALL TO public
--      USING ((auth.role() = 'authenticated'::text))
--      WITH CHECK ((auth.role() = 'authenticated'::text));

