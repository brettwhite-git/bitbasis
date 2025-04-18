-- Add csv_upload_id to orders table
ALTER TABLE public.orders
ADD COLUMN csv_upload_id UUID NULL REFERENCES public.csv_uploads(id) ON DELETE CASCADE;

CREATE INDEX idx_orders_csv_upload_id ON public.orders(csv_upload_id);

COMMENT ON COLUMN public.orders.csv_upload_id IS 'Link to the csv_uploads table if this order originated from a CSV import.';

-- Add csv_upload_id to transfers table
ALTER TABLE public.transfers
ADD COLUMN csv_upload_id UUID NULL REFERENCES public.csv_uploads(id) ON DELETE CASCADE;

CREATE INDEX idx_transfers_csv_upload_id ON public.transfers(csv_upload_id);

COMMENT ON COLUMN public.transfers.csv_upload_id IS 'Link to the csv_uploads table if this transfer originated from a CSV import.';

-- Ensure necessary RLS policies for DELETE exist on orders and transfers
-- (Assuming these policies are already in place or created elsewhere,
-- otherwise, they should be added here or in their respective table creation migrations)

-- Example placeholder for ensuring DELETE policy on orders (adjust if needed)
-- CREATE POLICY "Allow users to delete their own orders" 
-- ON public.orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Example placeholder for ensuring DELETE policy on transfers (adjust if needed)
-- CREATE POLICY "Allow users to delete their own transfers"
-- ON public.transfers FOR DELETE TO authenticated USING (auth.uid() = user_id); 