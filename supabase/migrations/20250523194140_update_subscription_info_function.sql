-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS get_user_subscription_info(UUID);

-- Update the get_user_subscription_info function to include subscription data
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  subscription_status TEXT,
  transaction_count INTEGER,
  can_add_transaction BOOLEAN,
  should_show_warning BOOLEAN,
  subscription_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.status::TEXT, 'free') as subscription_status,
    get_user_transaction_count(user_uuid) as transaction_count,
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN TRUE
      WHEN get_user_transaction_count(user_uuid) < 50 THEN TRUE
      ELSE FALSE
    END as can_add_transaction,
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN FALSE
      WHEN get_user_transaction_count(user_uuid) >= 45 THEN TRUE
      ELSE FALSE
    END as should_show_warning,
    CASE 
      WHEN s.id IS NOT NULL THEN
        json_build_object(
          'price_id', s.price_id,
          'metadata', s.metadata,
          'current_period_end', s.current_period_end,
          'cancel_at_period_end', s.cancel_at_period_end
        )::JSONB
      ELSE NULL
    END as subscription_data
  FROM auth.users u
  LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 