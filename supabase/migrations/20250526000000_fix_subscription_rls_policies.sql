-- Fix RLS policies for subscriptions table
-- Users need to be able to update their own subscription records (for cancellation)
-- and insert new subscription records (for upgrades)

-- Add UPDATE policy for users to update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for users to create their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for users to delete their own subscriptions (if needed)
CREATE POLICY "Users can delete own subscriptions" 
ON public.subscriptions 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id); 