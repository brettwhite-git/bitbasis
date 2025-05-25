-- Fix subscription status handling to properly handle all subscription states
-- This ensures users who cancel or have payment issues are properly handled

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_subscription_info(UUID);

-- Create updated function that handles all subscription statuses
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  subscription_status TEXT,
  transaction_count INTEGER,
  can_add_transaction BOOLEAN,
  should_show_warning BOOLEAN,
  subscription_data JSONB
) AS $$
DECLARE
  user_exists BOOLEAN;
  active_subscription RECORD;
  tx_count INTEGER;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) INTO user_exists;
  
  -- If user doesn't exist, return default free user data
  IF NOT user_exists THEN
    RETURN QUERY SELECT 
      'free'::TEXT as subscription_status,
      0 as transaction_count,
      TRUE as can_add_transaction,
      FALSE as should_show_warning,
      NULL::JSONB as subscription_data;
    RETURN;
  END IF;

  -- Get transaction count
  SELECT get_user_transaction_count(user_uuid) INTO tx_count;

  -- Get the most recent subscription (prioritizing active ones)
  SELECT * INTO active_subscription
  FROM subscriptions s 
  WHERE s.user_id = user_uuid 
  ORDER BY 
    CASE 
      WHEN s.status = 'active' THEN 1
      WHEN s.status = 'trialing' THEN 2
      WHEN s.status = 'past_due' THEN 3
      WHEN s.status = 'canceled' THEN 4
      ELSE 5
    END,
    s.created DESC
  LIMIT 1;

  -- Return query based on subscription status
  RETURN QUERY
  SELECT 
    CASE 
      WHEN active_subscription.id IS NULL THEN 'free'
      WHEN active_subscription.status IN ('active', 'trialing') THEN active_subscription.status::TEXT
      WHEN active_subscription.status = 'canceled' AND active_subscription.cancel_at_period_end = TRUE 
           AND active_subscription.current_period_end > NOW() THEN 'active'  -- Still active until period end
      ELSE 'free'  -- All other statuses (canceled, past_due, incomplete, etc.) are treated as free
    END as subscription_status,
    
    tx_count as transaction_count,
    
    CASE 
      -- Active or trialing subscriptions have unlimited transactions
      WHEN active_subscription.status IN ('active', 'trialing') THEN TRUE
      -- Canceled but still in period
      WHEN active_subscription.status = 'canceled' AND active_subscription.cancel_at_period_end = TRUE 
           AND active_subscription.current_period_end > NOW() THEN TRUE
      -- Free users can add transactions if under limit
      WHEN tx_count < 50 THEN TRUE
      ELSE FALSE
    END as can_add_transaction,
    
    CASE 
      -- Paid users never see warnings
      WHEN active_subscription.status IN ('active', 'trialing') THEN FALSE
      -- Canceled but still in period
      WHEN active_subscription.status = 'canceled' AND active_subscription.cancel_at_period_end = TRUE 
           AND active_subscription.current_period_end > NOW() THEN FALSE
      -- Free users see warning when approaching limit
      WHEN tx_count >= 45 THEN TRUE
      ELSE FALSE
    END as should_show_warning,
    
    CASE 
      WHEN active_subscription.id IS NOT NULL THEN
        json_build_object(
          'price_id', active_subscription.price_id,
          'metadata', active_subscription.metadata,
          'current_period_end', active_subscription.current_period_end,
          'cancel_at_period_end', active_subscription.cancel_at_period_end,
          'status', active_subscription.status
        )::JSONB
      ELSE NULL
    END as subscription_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO anon; 