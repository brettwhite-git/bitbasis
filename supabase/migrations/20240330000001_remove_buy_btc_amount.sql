-- Remove redundant buy_btc_amount column from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS buy_btc_amount;

-- Update comment on table to reflect current schema
COMMENT ON TABLE public.orders IS 'Stores buy and sell orders with received_btc_amount for buys and sell_btc_amount for sells'; 