-- Bitcoin Monthly Close Price Table
-- Stores month-end close prices for Bitcoin from July 2010 onwards
-- All dates and times use UTC timezone

CREATE TABLE IF NOT EXISTS public.btc_monthly_close (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,           -- Last day of month (YYYY-MM-DD) in UTC
  close DECIMAL(15,4) NOT NULL,        -- Month-end close price in USD (4 decimal precision)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT btc_monthly_close_price_positive CHECK (close > 0),
  CONSTRAINT btc_monthly_close_price_reasonable CHECK (close < 10000000) -- Max $10M per BTC
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_btc_monthly_close_date ON public.btc_monthly_close(date DESC);
CREATE INDEX IF NOT EXISTS idx_btc_monthly_close_created_at ON public.btc_monthly_close(created_at);

-- Enable Row Level Security
ALTER TABLE public.btc_monthly_close ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow read access to monthly close data" ON public.btc_monthly_close;
CREATE POLICY "Allow read access to monthly close data" 
ON public.btc_monthly_close FOR SELECT 
TO authenticated 
USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_btc_monthly_close_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_btc_monthly_close_updated_at ON public.btc_monthly_close;
CREATE TRIGGER update_btc_monthly_close_updated_at
  BEFORE UPDATE ON public.btc_monthly_close
  FOR EACH ROW
  EXECUTE FUNCTION public.update_btc_monthly_close_updated_at();

-- Helper function to get the last day of a given month
CREATE OR REPLACE FUNCTION public.get_last_day_of_month(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN (DATE_TRUNC('month', input_date) + INTERVAL '1 month - 1 day')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if today is the last day of the month (UTC)
CREATE OR REPLACE FUNCTION public.is_last_day_of_month()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN CURRENT_DATE = public.get_last_day_of_month(CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to upsert monthly close price
CREATE OR REPLACE FUNCTION public.upsert_monthly_close(
  month_date DATE,
  close_price DECIMAL
)
RETURNS TABLE(id BIGINT, date DATE, close DECIMAL, was_updated BOOLEAN) AS $$
DECLARE
  result_record RECORD;
  was_update BOOLEAN := FALSE;
BEGIN
  -- Ensure we're using the last day of the month
  month_date := public.get_last_day_of_month(month_date);
  
  -- Attempt to update existing record
  UPDATE public.btc_monthly_close 
  SET close = close_price, updated_at = NOW()
  WHERE btc_monthly_close.date = month_date
  RETURNING btc_monthly_close.id, btc_monthly_close.date, btc_monthly_close.close INTO result_record;
  
  IF FOUND THEN
    was_update := TRUE;
  ELSE
    -- Insert new record if not found
    INSERT INTO public.btc_monthly_close (date, close)
    VALUES (month_date, close_price)
    RETURNING btc_monthly_close.id, btc_monthly_close.date, btc_monthly_close.close INTO result_record;
  END IF;
  
  RETURN QUERY SELECT result_record.id, result_record.date, result_record.close, was_update;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly close data with optional date range
CREATE OR REPLACE FUNCTION public.get_monthly_close_data(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(date DATE, close DECIMAL, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    btc_monthly_close.date,
    btc_monthly_close.close,
    btc_monthly_close.created_at
  FROM public.btc_monthly_close
  WHERE 
    (start_date IS NULL OR btc_monthly_close.date >= start_date) AND
    (end_date IS NULL OR btc_monthly_close.date <= end_date)
  ORDER BY btc_monthly_close.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to validate data completeness (check for gaps)
CREATE OR REPLACE FUNCTION public.validate_monthly_close_completeness(
  start_date DATE DEFAULT '2010-07-31',
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(missing_month DATE) AS $$
DECLARE
  check_end_date DATE;
BEGIN
  -- Default to last month if end_date not provided
  IF end_date IS NULL THEN
    check_end_date := public.get_last_day_of_month((CURRENT_DATE - INTERVAL '1 month')::DATE);
  ELSE
    check_end_date := end_date;
  END IF;
  
  RETURN QUERY
  WITH RECURSIVE month_series AS (
    SELECT start_date as month_end
    UNION ALL
    SELECT public.get_last_day_of_month((month_end + INTERVAL '1 month')::DATE)
    FROM month_series
    WHERE month_end < check_end_date
  )
  SELECT ms.month_end
  FROM month_series ms
  LEFT JOIN public.btc_monthly_close bmc ON ms.month_end = bmc.date
  WHERE bmc.date IS NULL
  ORDER BY ms.month_end;
END;
$$ LANGUAGE plpgsql;

-- Add comment to table
COMMENT ON TABLE public.btc_monthly_close IS 'Bitcoin monthly close prices from July 2010 onwards. All dates use UTC timezone and represent the last day of each month.'; 