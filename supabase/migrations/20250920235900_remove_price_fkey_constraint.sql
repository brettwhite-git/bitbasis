-- Remove foreign key constraint on subscriptions.price_id
-- This constraint prevents webhook from creating subscriptions with Stripe price IDs
-- that don't exist in our local prices table

ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_price_id_fkey;

-- The price_id field will still store the Stripe price ID for reference,
-- but won't require it to exist in our prices table
-- This allows webhooks to create subscriptions with any valid Stripe price ID
