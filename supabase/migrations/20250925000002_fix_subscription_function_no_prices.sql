-- Fix subscription function to work without prices table
-- Remove dependency on prices table for local development

DROP FUNCTION IF EXISTS get_user_subscription_info(UUID);

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
  
  -- Get the most relevant subscription for this user
  -- Priority: active > trialing > past_due > others
  -- Within same status, get most recent by creation date
  SELECT s.* INTO sub_record
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  ORDER BY 
    CASE s.status 
      WHEN 'active' THEN 1
      WHEN 'trialing' THEN 2  
      WHEN 'past_due' THEN 3
      ELSE 4
    END,
    s.created DESC  -- If same priority status, get newest
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
      is_lifetime BOOLEAN := FALSE;
    BEGIN
      period_end_date := sub_record.current_period_end::TIMESTAMP;
      -- Check if it's a lifetime subscription based on metadata or special price IDs
      is_lifetime := (
        sub_record.metadata IS NOT NULL AND 
        sub_record.metadata::jsonb ? 'type' AND 
        sub_record.metadata::jsonb->>'type' = 'lifetime'
      ) OR (
        sub_record.price_id LIKE '%lifetime%' OR 
        sub_record.price_id = 'price_1RS3KBPMa0k9vRKSk7vG0GKO'
      );
      
      -- Determine if user currently has access
      -- Note: trialing users are treated as free tier (no unlimited access)
      IF sub_record.status = 'active' THEN
        has_access := TRUE;
        effective_status := CASE 
          WHEN is_lifetime THEN 'lifetime'
          ELSE sub_record.status::TEXT
        END;
      ELSIF sub_record.status = 'trialing' THEN
        -- Trialing users are treated as free tier but keep trialing status for UI differentiation
        has_access := FALSE;
        effective_status := 'trialing';
      ELSIF sub_record.status = 'past_due' THEN
        -- Past due users get a grace period until period end (not applicable to lifetime)
        IF NOT is_lifetime AND period_end_date > NOW() THEN
          has_access := TRUE;
          effective_status := 'past_due';
        ELSE
          has_access := FALSE;
          effective_status := 'expired';
        END IF;
      ELSIF sub_record.cancel_at_period_end = TRUE AND sub_record.status != 'canceled' THEN
        -- Cancelled but still in period (not applicable to lifetime)
        IF NOT is_lifetime AND period_end_date > NOW() THEN
          has_access := TRUE;
          effective_status := 'canceling';
        ELSE
          has_access := FALSE;
          effective_status := 'free';
        END IF;
      ELSE
        -- Canceled, incomplete, etc.
        has_access := FALSE;
        effective_status := CASE 
          WHEN sub_record.status = 'canceled' THEN 'free'
          ELSE sub_record.status::TEXT
        END;
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
          -- Users with access (including lifetime) should never see warnings
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
              'period_end_date', period_end_date,
              'is_lifetime', is_lifetime,
              'priority_rank', CASE sub_record.status 
                WHEN 'active' THEN 1
                WHEN 'trialing' THEN 2  
                WHEN 'past_due' THEN 3
                ELSE 4
              END
            )::JSONB
          ELSE NULL
        END as subscription_data;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;
