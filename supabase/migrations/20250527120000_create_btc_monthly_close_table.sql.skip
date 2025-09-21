-- Create Bitcoin monthly close table
CREATE TABLE IF NOT EXISTS public.btc_monthly_close (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  open DECIMAL(15,2) NOT NULL,
  high DECIMAL(15,2) NOT NULL,
  low DECIMAL(15,2) NOT NULL,
  close DECIMAL(15,2) NOT NULL,
  volume DECIMAL(20,8),
  market_cap DECIMAL(20,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_btc_monthly_close_date ON public.btc_monthly_close(date);

-- Enable RLS
ALTER TABLE public.btc_monthly_close ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all authenticated users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'btc_monthly_close' 
    AND policyname = 'Allow read access to monthly close data'
  ) THEN
    CREATE POLICY "Allow read access to monthly close data" 
    ON public.btc_monthly_close FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.btc_monthly_close IS 'Bitcoin monthly OHLC data aggregated from daily prices';
COMMENT ON COLUMN public.btc_monthly_close.date IS 'Last day of the month (YYYY-MM-DD format)';
COMMENT ON COLUMN public.btc_monthly_close.open IS 'Opening price for the month in USD';
COMMENT ON COLUMN public.btc_monthly_close.high IS 'Highest price during the month in USD';
COMMENT ON COLUMN public.btc_monthly_close.low IS 'Lowest price during the month in USD';
COMMENT ON COLUMN public.btc_monthly_close.close IS 'Closing price for the month in USD';
COMMENT ON COLUMN public.btc_monthly_close.volume IS 'Total BTC volume traded during the month';
COMMENT ON COLUMN public.btc_monthly_close.market_cap IS 'Market capitalization at month end in USD'; 