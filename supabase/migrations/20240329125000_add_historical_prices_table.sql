-- Drop existing table and related objects
DROP TABLE IF EXISTS public.historical_prices CASCADE;

-- Create historical_prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
    id BIGSERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,  -- Unix timestamp from Mempool.space
    date DATE NOT NULL,         -- Date derived from timestamp
    price_usd NUMERIC(20,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for better query performance and uniqueness constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_historical_prices_timestamp ON public.historical_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_historical_prices_price ON public.historical_prices(price_usd);

-- Add RLS policies
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read historical prices (they're public data)
CREATE POLICY "Allow read access for all authenticated users"
    ON public.historical_prices
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role to manage prices
CREATE POLICY "Allow service role to manage prices"
    ON public.historical_prices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to the service role
GRANT ALL ON public.historical_prices TO service_role;
GRANT USAGE ON SEQUENCE historical_prices_id_seq TO service_role;

-- Add trigger to automatically set date from timestamp
CREATE OR REPLACE FUNCTION public.set_historical_price_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date := to_timestamp(NEW.timestamp)::date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_historical_price_date_trigger
    BEFORE INSERT OR UPDATE ON public.historical_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_historical_price_date(); 