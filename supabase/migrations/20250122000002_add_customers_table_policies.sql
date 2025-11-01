-- Migration: 20250122000002_add_customers_table_policies.sql
-- Purpose: Add missing INSERT/UPDATE policies for customers table
-- Security Fix: SEC-011 - Complete RLS policy coverage
-- Date: 2025-01-22
-- Risk Level: LOW - Adding security policies, no data changes

-- ============================================================================
-- SECURITY FIX: Add missing RLS policies for customers table
-- ============================================================================
-- The customers table currently only has a SELECT policy, but the application
-- performs UPSERT operations (INSERT/UPDATE). Without explicit policies, these
-- operations would be denied by RLS default deny behavior.
--
-- Since customers.id = user.id, we can use the same pattern as other tables.

-- Add INSERT policy: Users can insert their own customer record
CREATE POLICY "Users can insert their own customer data"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Add UPDATE policy: Users can update their own customer record
CREATE POLICY "Users can update their own customer data"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Note: DELETE policy not needed - customers are deleted via account deletion
-- using authenticated client which should work with current SELECT policy
-- If needed, can add explicit DELETE policy later

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After migration, verify policies exist:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'customers';
--
-- Expected: 3 policies (SELECT, INSERT, UPDATE)

