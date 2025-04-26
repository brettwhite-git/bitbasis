-- Drop the price_update_logs table since we're now using PostgreSQL's native logging
DROP TABLE IF EXISTS public.price_update_logs;

-- Add a comment to explain the change
COMMENT ON SCHEMA public IS 'Standard public schema with BTC price data. Note: price_update_logs table was removed in favor of PostgreSQL native logging via RAISE NOTICE/WARNING.'; 