-- Update the Fear & Greed Index cron job to run twice daily
DO $$
BEGIN
  -- Unschedule the existing job
  PERFORM cron.unschedule('update-fear-greed-index');
  
  -- Schedule the new job to run twice daily (1 AM and 1 PM UTC)
  PERFORM cron.schedule(
    'update-fear-greed-index',
    '0 1,13 * * *',
    'SELECT public.update_fear_greed_index()'
  );
END
$$; 