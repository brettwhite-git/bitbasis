-- Migration: 20251101151441_fix_monthly_btc_cron_http_post.sql
-- Purpose: Fix the monthly BTC update cron job to use correct net.http_post syntax
-- Risk Level: LOW - Fixes broken cron job command syntax
-- Impact: Monthly BTC close update cron job will function correctly

-- ============================================================================
-- ISSUE: Cron job using incorrect net.http_post syntax
-- ============================================================================
-- The cron job (jobid 18) is failing with:
-- ERROR: function net.http_post(url => unknown, headers => text, body => unknown) does not exist
--
-- Root Cause:
-- 1. Parameters are passed as TEXT strings instead of JSONB
-- 2. The headers parameter uses string concatenation which results in TEXT type
-- 3. The body parameter is TEXT instead of JSONB
--
-- Fix:
-- - Cast headers and body to JSONB using proper JSONB construction
-- - Use jsonb_build_object for dynamic header construction with service role key
-- - Ensure proper parameter types match net.http_post signature

-- ============================================================================
-- STEP 1: Create helper function to get service role key securely
-- ============================================================================
-- Since current_setting('app.settings.service_role_key') returns NULL,
-- we'll create a function that retrieves it from a database setting
-- that must be configured by the user.

-- IMPORTANT: After running this migration, you MUST configure the service role key:
-- 
-- Option 1 (Recommended): Set database setting
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- Option 2: Update the cron job command to hardcode the key (less secure but simpler)
--   SELECT cron.alter_job(
--     job_id := 18,
--     command := $$
--       SELECT net.http_post(
--         url := 'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-monthly-btc-close',
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer your-actual-service-role-key-here'
--         ),
--         body := '{"source": "cron"}'::jsonb,
--         timeout_milliseconds := 30000
--       ) as request_id;
--     $$
--   );
--
-- Get your service role key from: Supabase Dashboard > Settings > API > service_role key

-- ============================================================================
-- STEP 2: Update the cron job command with corrected syntax
-- ============================================================================
-- Fix: Use jsonb_build_object to properly construct JSONB headers
-- The key changes:
-- 1. headers must be JSONB, not TEXT
-- 2. body must be JSONB, not TEXT  
-- 3. Use jsonb_build_object to build headers dynamically with service role key

-- Use cron.schedule with same name to update existing job (upsert behavior)
-- This recreates the job with corrected syntax, avoiding ownership issues
SELECT cron.schedule(
  'update-monthly-btc-close',
  '59 23 28-31 * *',
  $$
    SELECT
      net.http_post(
        url := 'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-monthly-btc-close',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(
            current_setting('app.settings.service_role_key', true),
            'REPLACE_WITH_SERVICE_ROLE_KEY'
          )
        ),
        body := '{"source": "cron"}'::jsonb,
        timeout_milliseconds := 30000
      ) as request_id;
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the cron job command:
--
-- SELECT jobid, schedule, command, active
-- FROM cron.job
-- WHERE jobid = 18;
--
-- The command should now have:
-- - JSONB types for headers (using jsonb_build_object)
-- - JSONB type for body (using ::jsonb cast)
-- - Proper timeout_milliseconds parameter
--
-- Note: If current_setting('app.settings.service_role_key') returns NULL,
-- you may need to set it using:
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- Alternatively, you can hardcode the service role key (for production only):
-- 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

