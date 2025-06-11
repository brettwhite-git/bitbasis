-- Update transaction count function to use unified transactions table
DROP FUNCTION IF EXISTS get_user_transaction_count(UUID);

CREATE OR REPLACE FUNCTION get_user_transaction_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.transactions 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_transaction_count(UUID) TO authenticated;

-- Also update the v2 function to match for consistency
DROP FUNCTION IF EXISTS get_user_transaction_count_v2(UUID);

-- Create alias for backwards compatibility
CREATE OR REPLACE FUNCTION get_user_transaction_count_v2(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN get_user_transaction_count(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_transaction_count_v2(UUID) TO authenticated; 