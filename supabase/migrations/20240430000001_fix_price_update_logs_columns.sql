-- Drop and recreate the price_update_logs table with correct columns
DROP TABLE IF EXISTS public.price_update_logs;

CREATE TABLE IF NOT EXISTS public.price_update_logs (
    id BIGSERIAL PRIMARY KEY,
    service VARCHAR(50),
    status VARCHAR(50),
    message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN,
    error_message TEXT,
    response_status INTEGER,
    response_content TEXT
);

-- Grant necessary permissions
ALTER TABLE public.price_update_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Only service role can access logs' 
    AND polrelid = 'public.price_update_logs'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "Only service role can access logs" 
    ON public.price_update_logs
    TO service_role
    USING (true)
    WITH CHECK (true)';
  END IF;
END $$;

GRANT ALL ON public.price_update_logs TO service_role;
GRANT USAGE ON SEQUENCE price_update_logs_id_seq TO service_role; 