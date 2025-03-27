-- Drop the unique constraint on date
ALTER TABLE bitcoin_prices DROP CONSTRAINT IF EXISTS unique_date;

-- Add a unique constraint on the timestamp to prevent duplicate entries in the same second
ALTER TABLE bitcoin_prices ADD CONSTRAINT unique_timestamp UNIQUE (last_updated);

-- Add an index on last_updated for faster queries
CREATE INDEX IF NOT EXISTS idx_bitcoin_prices_last_updated ON bitcoin_prices (last_updated DESC);

-- Add an index on date for faster daily queries
CREATE INDEX IF NOT EXISTS idx_bitcoin_prices_date ON bitcoin_prices (date); 