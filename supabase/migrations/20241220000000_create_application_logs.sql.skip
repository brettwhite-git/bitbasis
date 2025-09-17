-- Create application_logs table for production logging
CREATE TABLE IF NOT EXISTS public.application_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
    message TEXT NOT NULL,
    context JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    error_stack TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON public.application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON public.application_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON public.application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_level_created_at ON public.application_logs(level, created_at DESC);

-- Enable RLS
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only service role can insert logs (for server-side logging)
CREATE POLICY "Service role can insert logs" ON public.application_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only service role can read logs (for admin purposes)
CREATE POLICY "Service role can read logs" ON public.application_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Users can only read their own error logs (for support purposes)
CREATE POLICY "Users can read own error logs" ON public.application_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND level = 'error');

-- Add comment for documentation
COMMENT ON TABLE public.application_logs IS 'Application logging table for production error tracking and debugging';
COMMENT ON COLUMN public.application_logs.level IS 'Log level: error, warn, info, debug';
COMMENT ON COLUMN public.application_logs.context IS 'Additional context data as JSON';
COMMENT ON COLUMN public.application_logs.error_stack IS 'Error stack trace for debugging'; 