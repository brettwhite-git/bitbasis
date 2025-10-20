-- Migration: 20251021000000_secure_functions_batch_1.sql
-- Purpose: Add search_path protection to critical auth and subscription functions
-- Risk Level: Low - Function logic unchanged, only adding security hardening
-- Rollback: Revert to prior migration - function definitions will revert automatically

-- ============================================================================
-- 1. ensure_user_id_matches_auth - Auth validation trigger
-- ============================================================================
-- BEFORE: Inherited session search_path (security risk)
-- AFTER: Explicit search_path protection
CREATE OR REPLACE FUNCTION public.ensure_user_id_matches_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
    IF NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'user_id must match the authenticated user';
    END IF;
    RETURN NEW;
END;
$function$;

-- ============================================================================
-- 2. can_user_add_transactions - Transaction limit checking
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified table references
CREATE OR REPLACE FUNCTION public.can_user_add_transactions(user_uuid uuid, transaction_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  current_count INTEGER;
  sub_record RECORD;
  has_active_subscription BOOLEAN := FALSE;
BEGIN
  -- Get current transaction count
  current_count := public.get_user_transaction_count(user_uuid);
  
  -- Check if user has active subscription
  SELECT * INTO sub_record
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
  AND s.status IN ('active', 'trialing')
  ORDER BY s.created DESC
  LIMIT 1;
  
  IF sub_record.id IS NOT NULL THEN
    has_active_subscription := TRUE;
  END IF;
  
  -- If user has active subscription, they can add unlimited transactions
  IF has_active_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- For free users, check if they would exceed the 50 transaction limit
  RETURN (current_count + transaction_count) <= 50;
END;
$function$;

-- ============================================================================
-- 3. get_user_transaction_count - Count user transactions (v1)
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema reference
-- AFTER: Explicit search_path, fully qualified table reference
CREATE OR REPLACE FUNCTION public.get_user_transaction_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.transactions
    WHERE user_id = user_uuid
  );
END;
$function$;

-- ============================================================================
-- 4. get_user_transaction_count_v2 - Count user transactions (v2, wrapper)
-- ============================================================================
-- BEFORE: Inherited session search_path
-- AFTER: Explicit search_path, fully qualified function reference
CREATE OR REPLACE FUNCTION public.get_user_transaction_count_v2(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
BEGIN
  RETURN public.get_user_transaction_count(user_uuid);
END;
$function$;

-- ============================================================================
-- 5. get_user_subscription_info - Get subscription and access info
-- ============================================================================
-- BEFORE: Inherited session search_path, unqualified schema references
-- AFTER: Explicit search_path, fully qualified table references
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(user_uuid uuid)
RETURNS TABLE(subscription_status text, transaction_count integer, can_add_transaction boolean, should_show_warning boolean, subscription_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,pg_catalog'
AS $function$
DECLARE
  sub_record RECORD;
  tx_count INTEGER;
BEGIN
  -- Get transaction count
  tx_count := public.get_user_transaction_count(user_uuid);
  
  -- Get the most recent subscription for this user, prioritizing active ones
  SELECT * INTO sub_record
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
  ORDER BY 
    CASE WHEN s.status IN ('active', 'trialing') THEN 0 ELSE 1 END,  -- Active subscriptions first
    s.created DESC  -- Then by most recent
  LIMIT 1;
  
  -- Rest of the function logic remains the same...
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
        effective_status := sub_record.status::TEXT;
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
$function$;

