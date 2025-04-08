-- Drop existing table and related objects
DROP TABLE IF EXISTS public.historical_prices CASCADE;

-- Create historical_prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
    id BIGSERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,  -- Unix timestamp from Mempool.space
    date DATE NOT NULL,         -- Date derived from timestamp
    price_usd NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better query performance and uniqueness constraints
CREATE UNIQUE INDEX IF NOT EXISTS historical_prices_timestamp_idx ON public.historical_prices(timestamp);
CREATE INDEX IF NOT EXISTS historical_prices_date_idx ON public.historical_prices(date);

-- Add RLS policies
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read historical prices (they're public data)
CREATE POLICY "Allow public read access to historical prices"
    ON public.historical_prices
    FOR SELECT
    TO public
    USING (true);

-- Only allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage historical prices"
    ON public.historical_prices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

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