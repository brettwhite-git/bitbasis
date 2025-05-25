-- BitBasis Stripe Extensions
-- Adds transaction counting and subscription limit logic to the Supabase Stripe template

-- Function to count user transactions from orders table
CREATE OR REPLACE FUNCTION get_user_transaction_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM orders 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for subscription status + limits
-- Returns subscription status, transaction count, and whether user can add more transactions
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  subscription_status TEXT,
  transaction_count INTEGER,
  can_add_transaction BOOLEAN,
  should_show_warning BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status IS NOT NULL THEN s.status::TEXT
      ELSE 'free'
    END as subscription_status,
    get_user_transaction_count(user_uuid) as transaction_count,
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN TRUE
      WHEN get_user_transaction_count(user_uuid) < 50 THEN TRUE
      ELSE FALSE
    END as can_add_transaction,
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN FALSE
      WHEN get_user_transaction_count(user_uuid) >= 25 THEN TRUE
      ELSE FALSE
    END as should_show_warning
  FROM auth.users u
  LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can add N transactions (for CSV import preview)
CREATE OR REPLACE FUNCTION can_user_add_transactions(user_uuid UUID, transaction_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  has_active_subscription BOOLEAN;
BEGIN
  SELECT 
    get_user_transaction_count(user_uuid),
    EXISTS(
      SELECT 1 FROM subscriptions s 
      WHERE s.user_id = user_uuid 
      AND s.status IN ('active', 'trialing')
    )
  INTO current_count, has_active_subscription;
  
  -- Pro/Lifetime users can add unlimited transactions
  IF has_active_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- Free users are limited to 50 total transactions
  RETURN (current_count + transaction_count) <= 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new Stripe tables if they don't already exist
DO $$
BEGIN
  -- Check if policy exists for customers table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Users can only see own customers data'
  ) THEN
    CREATE POLICY "Users can only see own customers data" ON customers
    FOR SELECT USING (auth.uid() = id);
  END IF;
  
  -- The subscriptions table should already have RLS from the template, but let's ensure it's correct
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Users can only see own subscriptions data'
  ) THEN
    CREATE POLICY "Users can only see own subscriptions data" ON subscriptions  
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance on subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status 
ON subscriptions(user_id, status) 
WHERE status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id 
ON customers(stripe_customer_id);

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_transaction_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_add_transactions(UUID, INTEGER) TO authenticated;
