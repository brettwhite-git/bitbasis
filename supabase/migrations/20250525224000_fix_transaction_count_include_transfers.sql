-- Fix transaction count to include both orders and transfers for subscription limits
DROP FUNCTION IF EXISTS get_user_transaction_count(UUID);

CREATE OR REPLACE FUNCTION get_user_transaction_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT 
      COALESCE(orders_count, 0) + COALESCE(transfers_count, 0) as total_count
    FROM (
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE user_id = user_uuid) as orders_count,
        (SELECT COUNT(*) FROM transfers WHERE user_id = user_uuid) as transfers_count
    ) counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_transaction_count(UUID) TO authenticated; 