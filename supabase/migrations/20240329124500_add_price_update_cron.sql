-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Create table to log price updates
CREATE TABLE IF NOT EXISTS public.price_update_logs (
    id BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    success BOOLEAN,
    error_message TEXT,
    response_status INTEGER,
    response_content TEXT
);

-- Create the function to update Bitcoin price
CREATE OR REPLACE FUNCTION public.call_update_price()
RETURNS void AS $$
DECLARE
    response http_response;
    status_code INT;
    request_data JSONB;
    auth_header TEXT;
BEGIN
    -- Log the start of the process
    INSERT INTO public.price_update_logs (success, error_message)
    VALUES (NULL, 'Beginning price update process');

    -- Setup the request
    request_data := '{"source":"cron"}'::JSONB;
    auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3ZieHJzaHVmbHVqY25pa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTgxNTQsImV4cCI6MjA1NzU3NDE1NH0.Hya3qaRopTxcWIhLV_tEgWZonGWay2xgltJE7h4SVmA';

    -- Make the HTTP request using http_post with correct signature
    SELECT * INTO response FROM http((
        'POST',
        'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-price',
        ARRAY[http_header('Authorization', auth_header)],
        request_data::text,
        ''
    )::http_request);
    
    -- Get status code
    status_code := response.status;
    
    -- Update completed_at timestamp and other fields
    UPDATE public.price_update_logs 
    SET 
        completed_at = NOW(),
        success = CASE WHEN status_code >= 200 AND status_code < 300 THEN TRUE ELSE FALSE END,
        error_message = CASE 
            WHEN status_code >= 200 AND status_code < 300 
            THEN format('Price update successful with status code %s', status_code)
            ELSE format('Price update failed with status code %s', status_code)
        END,
        response_status = status_code,
        response_content = response.content
    WHERE id = currval('price_update_logs_id_seq');

EXCEPTION WHEN OTHERS THEN
    -- Log any errors that occur
    UPDATE public.price_update_logs
    SET 
        success = FALSE, 
        error_message = 'Exception occurred: ' || SQLERRM,
        completed_at = NOW()
    WHERE id = currval('price_update_logs_id_seq');
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Clear any existing schedules with this name to avoid duplicates
DO $$
BEGIN
  PERFORM cron.unschedule('update-bitcoin-price');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore any errors if schedule doesn't exist
END $$;

-- Schedule the cron job to run every 2 hours
SELECT cron.schedule(
    'update-bitcoin-price',   -- job name
    '0 */2 * * *',           -- every 2 hours
    'SELECT public.call_update_price()'  -- SQL command to execute
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.call_update_price() TO service_role; 