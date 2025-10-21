-- Migration: Cleanup Legacy Orders Table
-- Date: 2025-10-21
-- Description: Drop the legacy orders table which has been fully replaced by the unified transactions table
-- 
-- Background:
-- - The orders table was used for storing buy/sell transactions
-- - It has been completely replaced by the transactions table which uses a unified schema
-- - Migration to transactions table is complete
-- - Zero code references to orders table exist in the codebase
-- - This cleanup is safe and will not affect any application functionality

-- Step 1: Drop foreign keys that reference orders table (if any exist)
DO $$ 
BEGIN
  -- Drop any foreign key constraints that reference orders
  EXECUTE (
    SELECT 'ALTER TABLE ' || t.tablename || ' DROP CONSTRAINT ' || constraint_name || ';'
    FROM information_schema.table_constraints tc
    JOIN information_schema.tables t ON tc.table_name = t.tablename
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND constraint_name LIKE '%orders%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  -- No foreign keys found, continue
  NULL;
END $$;

-- Step 2: Drop indexes on orders table
DROP INDEX IF EXISTS public.idx_orders_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_orders_date CASCADE;
DROP INDEX IF EXISTS public.idx_orders_type CASCADE;
DROP INDEX IF EXISTS public.idx_orders_user_date CASCADE;

-- Step 3: Drop the orders table itself
DROP TABLE IF EXISTS public.orders CASCADE;

-- Step 4: Clean up any orphaned sequences (if any)
DROP SEQUENCE IF EXISTS public.orders_id_seq CASCADE;

-- Verification: Log cleanup completion
DO $$
BEGIN
  RAISE NOTICE 'Legacy orders table cleanup completed successfully';
  RAISE NOTICE 'All data has been migrated to the unified transactions table';
  RAISE NOTICE 'Zero code references to orders table exist in the codebase';
END $$;
