-- Migrate data from send table to transfers
INSERT INTO public.transfers (
    user_id,
    date,
    type,
    asset,
    amount_btc,
    fee_amount_btc
)
SELECT 
    user_id,
    date,
    'withdrawal' as type,
    asset,
    sent_amount as amount_btc,
    network_fee as fee_amount_btc
FROM public.send;

-- Migrate data from receive table to transfers
INSERT INTO public.transfers (
    user_id,
    date,
    type,
    asset,
    amount_btc,
    price,
    amount_fiat
)
SELECT 
    user_id,
    date,
    'deposit' as type,
    asset,
    received_transfer_amount as amount_btc,
    price,
    CASE 
        WHEN price IS NOT NULL THEN received_transfer_amount * price
        ELSE NULL
    END as amount_fiat
FROM public.receive;

-- Drop old tables
DROP TABLE IF EXISTS public.send;
DROP TABLE IF EXISTS public.receive; 