-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop and recreate table
DROP TABLE IF EXISTS historical_prices CASCADE;

-- Create new simplified table matching mempool.space API structure
CREATE TABLE IF NOT EXISTS historical_prices (
    id BIGSERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    price_usd NUMERIC(20, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_timestamp UNIQUE (timestamp)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_historical_prices_timestamp ON historical_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_historical_prices_price ON historical_prices(price_usd);

-- Add RLS
ALTER TABLE historical_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for all authenticated users"
ON historical_prices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role to manage prices"
ON historical_prices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE historical_prices IS 'Bitcoin historical price data from mempool.space API';

-- Grant necessary permissions
GRANT SELECT ON historical_prices TO authenticated;
GRANT ALL ON historical_prices TO service_role; 