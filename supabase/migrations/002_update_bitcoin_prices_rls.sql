-- Enable RLS
ALTER TABLE bitcoin_prices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read prices (including anonymous users)
CREATE POLICY "Allow public read access to bitcoin prices" 
ON bitcoin_prices FOR SELECT 
TO public 
USING (true);

-- Only allow the service role to insert/update prices
CREATE POLICY "Allow service role to manage bitcoin prices" 
ON bitcoin_prices FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Revoke all other permissions
REVOKE ALL ON bitcoin_prices FROM public;
REVOKE ALL ON bitcoin_prices FROM anon;
REVOKE ALL ON bitcoin_prices FROM authenticated;

-- Grant specific permissions
GRANT SELECT ON bitcoin_prices TO public;
GRANT SELECT ON bitcoin_prices TO anon;
GRANT SELECT ON bitcoin_prices TO authenticated;
GRANT ALL ON bitcoin_prices TO service_role; 