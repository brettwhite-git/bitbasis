-- Enhanced subscription status handling for failed payments and cancellations
-- Drop the existing function first to change logic
DROP FUNCTION IF EXISTS get_user_subscription_info(UUID);

-- Update the get_user_subscription_info function to handle more subscription states
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  subscription_status TEXT,
  transaction_count INTEGER,
  can_add_transaction BOOLEAN,
  should_show_warning BOOLEAN,
  subscription_data JSONB
) AS $$
DECLARE
  sub_record RECORD;
  tx_count INTEGER;
BEGIN
  -- Get transaction count
  tx_count := get_user_transaction_count(user_uuid);
  
  -- Get the most recent subscription for this user
  SELECT * INTO sub_record
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  ORDER BY s.created DESC
  LIMIT 1;
  
  -- Determine effective subscription status
  IF sub_record.id IS NULL THEN
    -- No subscription = free user
    RETURN QUERY SELECT 
      'free'::TEXT as subscription_status,
      tx_count as transaction_count,
      CASE WHEN tx_count < 50 THEN TRUE ELSE FALSE END as can_add_transaction,
      CASE WHEN tx_count >= 45 THEN TRUE ELSE FALSE END as should_show_warning,
      NULL::JSONB as subscription_data;
  ELSE
    -- Has subscription - check status and period end
    DECLARE
      effective_status TEXT;
      has_access BOOLEAN := FALSE;
      period_end_date TIMESTAMP;
    BEGIN
      period_end_date := sub_record.current_period_end::TIMESTAMP;
      
      -- Determine if user currently has access
      IF sub_record.status IN ('active', 'trialing') THEN
        has_access := TRUE;
        effective_status := sub_record.status;
      ELSIF sub_record.status = 'past_due' THEN
        -- Past due users get a grace period until period end
        IF period_end_date > NOW() THEN
          has_access := TRUE;
          effective_status := 'past_due';
        ELSE
          has_access := FALSE;
          effective_status := 'expired';
        END IF;
      ELSIF sub_record.cancel_at_period_end = TRUE AND sub_record.status != 'canceled' THEN
        -- Cancelled but still in period
        IF period_end_date > NOW() THEN
          has_access := TRUE;
          effective_status := 'canceling';
        ELSE
          has_access := FALSE;
          effective_status := 'free';
        END IF;
      ELSE
        -- Canceled, incomplete, etc.
        has_access := FALSE;
        effective_status := COALESCE(sub_record.status, 'free');
      END IF;
      
      RETURN QUERY SELECT 
        effective_status as subscription_status,
        tx_count as transaction_count,
        CASE 
          WHEN has_access THEN TRUE
          WHEN tx_count < 50 THEN TRUE
          ELSE FALSE
        END as can_add_transaction,
        CASE 
          WHEN has_access THEN FALSE
          WHEN tx_count >= 45 THEN TRUE
          ELSE FALSE
        END as should_show_warning,
        CASE 
          WHEN sub_record.id IS NOT NULL THEN
            json_build_object(
              'id', sub_record.id,
              'price_id', sub_record.price_id,
              'metadata', sub_record.metadata,
              'status', sub_record.status,
              'current_period_end', sub_record.current_period_end,
              'cancel_at_period_end', sub_record.cancel_at_period_end,
              'past_due', sub_record.status = 'past_due',
              'has_access', has_access,
              'period_end_date', period_end_date
            )::JSONB
          ELSE NULL
        END as subscription_data;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated; 