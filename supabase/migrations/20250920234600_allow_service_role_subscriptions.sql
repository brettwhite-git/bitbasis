-- Allow service role to manage subscriptions for webhook processing
-- This enables Stripe webhooks to create/update subscription records

CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- This policy allows the service role to:
-- 1. INSERT new subscriptions (when webhooks create them)
-- 2. UPDATE existing subscriptions (when webhooks modify them) 
-- 3. SELECT subscriptions (for webhook processing logic)
-- 4. DELETE subscriptions (if needed for cleanup)

-- The service role is highly privileged and used only for:
-- - Stripe webhook processing
-- - Administrative functions
-- - Server-side operations that need to bypass user-level RLS
