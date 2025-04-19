-- Add RLS policy to allow users to delete their own orders
CREATE POLICY "Allow users to delete their own orders" ON public.orders
FOR DELETE
USING (auth.uid() = user_id);

-- Add RLS policy to allow users to delete their own transfers
CREATE POLICY "Allow users to delete their own transfers" ON public.transfers
FOR DELETE
USING (auth.uid() = user_id); 