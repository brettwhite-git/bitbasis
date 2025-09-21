-- Create essential Stripe tables for BitBasis
-- Based on Supabase Stripe wrapper schema

-- Create subscription_status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trialing',
    'active', 
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  stripe_customer_id text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create prices table (minimal for foreign key)
CREATE TABLE IF NOT EXISTS public.prices (
  id text NOT NULL PRIMARY KEY,
  product_id text,
  active boolean DEFAULT true,
  currency text DEFAULT 'usd',
  unit_amount bigint,
  type text DEFAULT 'one_time',
  interval text,
  interval_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status subscription_status,
  metadata jsonb,
  price_id text REFERENCES public.prices(id),
  quantity integer,
  cancel_at_period_end boolean DEFAULT false,
  created text NOT NULL,
  current_period_start text NOT NULL, 
  current_period_end text NOT NULL,
  ended_at text,
  cancel_at text,
  canceled_at text,
  trial_start text,
  trial_end text
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can only see own customer data" ON public.customers
  FOR ALL USING (auth.uid() = id);

-- RLS Policies for subscriptions  
CREATE POLICY "Users can only see own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prices (public read access)
CREATE POLICY "Prices are publicly readable" ON public.prices
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON public.customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Insert BitBasis price IDs (you'll need to update these with your actual Stripe price IDs)
INSERT INTO public.prices (id, product_id, active, currency, unit_amount, type, interval, interval_count)
VALUES 
  ('price_pro_monthly', 'prod_bitbasis_pro', true, 'usd', 999, 'recurring', 'month', 1),
  ('price_lifetime', 'prod_bitbasis_lifetime', true, 'usd', 9999, 'one_time', null, null)
ON CONFLICT (id) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.customers IS 'Customer data linked to Stripe';
COMMENT ON TABLE public.subscriptions IS 'Subscription data from Stripe';
COMMENT ON TABLE public.prices IS 'Product pricing information from Stripe';
