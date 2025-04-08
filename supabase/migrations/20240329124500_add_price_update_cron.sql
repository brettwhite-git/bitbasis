-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the function to call our edge function
CREATE OR REPLACE FUNCTION public.call_update_price()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-price',
    '{}'::jsonb,
    ARRAY['Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3ZieHJzaHVmbHVqY25pa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTgxNTQsImV4cCI6MjA1NzU3NDE1NH0.Hya3qaRopTxcWIhLV_tEgWZonGWay2xgltJE7h4SVmA']::text[]
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule the cron job
SELECT cron.schedule(
  'update-bitcoin-price',   -- job name
  '0 * * * *',             -- every hour
  'SELECT public.call_update_price()'
); 