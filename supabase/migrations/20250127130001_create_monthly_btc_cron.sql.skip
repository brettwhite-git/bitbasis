-- Monthly Bitcoin Close Price Update Cron Job
-- Runs on the last day of each month at 23:59 UTC
-- The Edge Function itself validates if it's actually the last day

-- First, ensure we have the pg_cron extension enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing cron job if it exists
SELECT cron.unschedule('update-monthly-btc-close');

-- Create the cron job to run on potential last days of month
-- We run on days 28-31 at 23:59 UTC, but the Edge Function validates if it's actually the last day
SELECT cron.schedule(
  'update-monthly-btc-close',
  '59 23 28-31 * *',  -- Run at 23:59 on days 28, 29, 30, 31 of every month
  $$
  SELECT
    net.http_post(
      url := 'http://127.0.0.1:54321/functions/v1/update-monthly-btc-close',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
      body := '{"source": "cron"}'
    ) as request_id;
  $$
);

-- Create a function to manually trigger the monthly update (for testing)
CREATE OR REPLACE FUNCTION public.trigger_monthly_btc_update()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT
    net.http_post(
      url := 'http://127.0.0.1:54321/functions/v1/update-monthly-btc-close',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
      body := '{"source": "manual"}'
    ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION public.get_monthly_btc_cron_status()
RETURNS TABLE(
  jobname text,
  schedule text,
  active boolean,
  last_run timestamptz,
  next_run timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cron.jobname::text,
    cron.schedule::text,
    cron.active,
    cron.last_run,
    cron.next_run
  FROM cron.job cron
  WHERE cron.jobname = 'update-monthly-btc-close';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.trigger_monthly_btc_update() IS 'Manually trigger the monthly Bitcoin close price update Edge Function';
COMMENT ON FUNCTION public.get_monthly_btc_cron_status() IS 'Check the status of the monthly Bitcoin close price update cron job';

-- Log the cron job creation
DO $$
BEGIN
  RAISE NOTICE 'Monthly Bitcoin close price update cron job created successfully';
  RAISE NOTICE 'Schedule: 59 23 28-31 * * (runs at 23:59 UTC on days 28-31 of each month)';
  RAISE NOTICE 'The Edge Function validates if it is actually the last day of the month';
  RAISE NOTICE 'Use SELECT public.get_monthly_btc_cron_status(); to check job status';
  RAISE NOTICE 'Use SELECT public.trigger_monthly_btc_update(); to manually trigger';
END $$; 