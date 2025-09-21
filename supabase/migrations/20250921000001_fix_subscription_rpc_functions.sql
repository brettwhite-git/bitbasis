-- Fix subscription RPC functions to use unified transactions table
-- This fixes the issue where client-side subscription status doesn't update after Stripe webhooks

-- Update get_user_transaction_count to use unified transactions table
CREATE OR REPLACE FUNCTION public.get_user_transaction_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM transactions 
    WHERE user_id = user_uuid
  );
END;
$function$;

-- Also add a function to check if user can add transactions (used by other RPC functions)
CREATE OR REPLACE FUNCTION public.can_user_add_transactions(user_uuid uuid, transaction_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_count INTEGER;
  sub_record RECORD;
  has_active_subscription BOOLEAN := FALSE;
BEGIN
  -- Get current transaction count
  current_count := get_user_transaction_count(user_uuid);
  
  -- Check if user has active subscription
  SELECT * INTO sub_record
  FROM subscriptions s
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

-- Test the functions work correctly
DO $test$
DECLARE
  test_user_id UUID := 'cab57140-1579-4d96-b5c5-cfae4d4acbe3';
  count_result INTEGER;
  subscription_info RECORD;
BEGIN
  -- Test transaction count function
  SELECT get_user_transaction_count(test_user_id) INTO count_result;
  RAISE NOTICE 'Transaction count for test user: %', count_result;
  
  -- Test subscription info function
  SELECT * INTO subscription_info FROM get_user_subscription_info(test_user_id);
  RAISE NOTICE 'Subscription status: %, Can add: %, Count: %', 
    subscription_info.subscription_status, 
    subscription_info.can_add_transaction,
    subscription_info.transaction_count;
END;
$test$;
