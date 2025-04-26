-- Remove duplicate cron job for BTC ATH checking
-- We'll keep daily-btc-ath-check and remove check-btc-ath

DO $$
BEGIN
  -- Delete the duplicated cron job
  DELETE FROM cron.job WHERE jobname = 'check-btc-ath';

  -- Log the cleanup
  RAISE NOTICE 'Removed duplicate BTC ATH cron job';
END $$; 