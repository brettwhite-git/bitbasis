-- Add missing columns to the price_update_logs table
ALTER TABLE public.price_update_logs 
ADD COLUMN IF NOT EXISTS service VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50),
ADD COLUMN IF NOT EXISTS message TEXT; 