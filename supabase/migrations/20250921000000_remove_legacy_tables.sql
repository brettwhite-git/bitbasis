-- Remove unused legacy tables: prices, orders, transfers
-- Analysis shows:
-- 1. prices: No application code queries this table, contains dummy data, was causing webhook failures
-- 2. orders: Legacy table replaced by unified transactions table, empty (0 rows)
-- 3. transfers: Legacy table replaced by unified transactions table, empty (0 rows)

-- Drop legacy tables and their associated objects
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.transfers CASCADE;
DROP TABLE IF EXISTS public.prices CASCADE;

-- Notes:
-- - orders and transfers were combined into the unified transactions table
-- - prices contained outdated dummy data and caused foreign key constraint failures
-- - subscriptions.price_id continues to store Stripe price IDs as reference strings
-- - All data has been migrated to the transactions table or is managed by Stripe
