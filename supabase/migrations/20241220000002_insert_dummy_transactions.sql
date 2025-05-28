-- Insert dummy transaction data for testing
-- Note: Replace 'test-user-id' with an actual user ID from auth.users when testing

-- First, let's create a dummy user for testing (you can replace this with actual user ID)
-- This is commented out since you might want to use an existing test user
-- INSERT INTO auth.users (id, email) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@bitbasis.com');

-- Buy transactions (last 30 days)
INSERT INTO public.transactions (
    user_id, date, type, asset, price,
    sent_amount, sent_currency, received_amount, received_currency,
    fee_amount, fee_currency, from_address_name, to_address_name, comment
) VALUES 
-- Recent buy transactions
('550e8400-e29b-41d4-a716-446655440000', '2024-12-19 10:30:00+00', 'buy', 'BTC', 97450.00,
 1000.00, 'USD', 0.01026316, 'BTC',
 2.50, 'USD', 'River', 'Personal Wallet', 'Weekly DCA purchase'),

('550e8400-e29b-41d4-a716-446655440000', '2024-12-17 14:15:00+00', 'buy', 'BTC', 106890.00,
 2500.00, 'USD', 0.02338771, 'BTC',
 5.00, 'USD', 'Coinbase', 'Cold Storage', 'Monthly investment'),

('550e8400-e29b-41d4-a716-446655440000', '2024-12-15 09:45:00+00', 'buy', 'BTC', 103200.00,
 500.00, 'USD', 0.00484496, 'BTC',
 1.25, 'USD', 'Strike', 'Personal Wallet', 'Small purchase during dip'),

('550e8400-e29b-41d4-a716-446655440000', '2024-12-12 16:20:00+00', 'buy', 'BTC', 99800.00,
 1500.00, 'USD', 0.01503006, 'BTC',
 3.75, 'USD', 'River', 'Hardware Wallet', 'Dollar cost averaging'),

('550e8400-e29b-41d4-a716-446655440000', '2024-12-10 11:30:00+00', 'buy', 'BTC', 95600.00,
 750.00, 'USD', 0.00784414, 'BTC',
 2.00, 'USD', 'Swan', 'Personal Wallet', 'Weekly buy'),

-- Sell transaction
('550e8400-e29b-41d4-a716-446655440000', '2024-12-08 13:45:00+00', 'sell', 'BTC', 101500.00,
 0.005, 'BTC', 507.50, 'USD',
 2.50, 'USD', 'Hardware Wallet', 'Coinbase', 'Partial profit taking'),

-- Deposit transactions (receiving BTC)
('550e8400-e29b-41d4-a716-446655440000', '2024-12-05 08:15:00+00', 'deposit', 'BTC', 93200.00,
 NULL, NULL, 0.01075269, 'BTC',
 0.0001, 'BTC', 'Mining Pool', 'Personal Wallet', 'Mining payout'),

('550e8400-e29b-41d4-a716-446655440000', '2024-12-03 19:30:00+00', 'deposit', 'BTC', 91800.00,
 NULL, NULL, 0.025, 'BTC',
 0.00015, 'BTC', 'Friend Transfer', 'Cold Storage', 'P2P transfer'),

-- Withdrawal transactions (sending BTC)
('550e8400-e29b-41d4-a716-446655440000', '2024-12-01 15:00:00+00', 'withdrawal', 'BTC', 96800.00,
 0.02, 'BTC', NULL, NULL,
 0.0002, 'BTC', 'Personal Wallet', 'Hardware Wallet', 'Moving to cold storage'),

-- Interest transaction
('550e8400-e29b-41d4-a716-446655440000', '2024-11-29 12:00:00+00', 'interest', 'BTC', 94500.00,
 NULL, NULL, 0.00021, 'BTC',
 NULL, NULL, 'BlockFi', 'Interest Account', 'Monthly interest payment'),

-- Additional buy transactions for more history
('550e8400-e29b-41d4-a716-446655440000', '2024-11-27 10:15:00+00', 'buy', 'BTC', 92300.00,
 800.00, 'USD', 0.00866855, 'BTC',
 2.00, 'USD', 'River', 'Personal Wallet', 'Pre-holiday purchase'),

('550e8400-e29b-41d4-a716-446655440000', '2024-11-25 14:30:00+00', 'buy', 'BTC', 89750.00,
 1200.00, 'USD', 0.01337014, 'BTC',
 3.00, 'USD', 'Coinbase', 'Cold Storage', 'Thanksgiving buy'),

('550e8400-e29b-41d4-a716-446655440000', '2024-11-22 16:45:00+00', 'buy', 'BTC', 87900.00,
 600.00, 'USD', 0.00682502, 'BTC',
 1.50, 'USD', 'Strike', 'Personal Wallet', 'Weekly DCA'),

('550e8400-e29b-41d4-a716-446655440000', '2024-11-20 09:20:00+00', 'buy', 'BTC', 91200.00,
 2000.00, 'USD', 0.02192982, 'BTC',
 5.00, 'USD', 'Swan', 'Hardware Wallet', 'Large purchase');

-- Update the transactions with cost basis calculations (simplified for now)
UPDATE public.transactions 
SET 
    sent_cost_basis = CASE 
        WHEN type = 'buy' THEN sent_amount 
        WHEN type = 'sell' THEN (sent_amount * price)
        ELSE NULL 
    END,
    received_cost_basis = CASE 
        WHEN type = 'buy' THEN sent_amount 
        WHEN type = 'sell' THEN NULL
        WHEN type = 'deposit' THEN (received_amount * price)
        WHEN type = 'withdrawal' THEN NULL
        WHEN type = 'interest' THEN (received_amount * price)
        ELSE NULL 
    END,
    fee_cost_basis = CASE 
        WHEN fee_currency = 'USD' THEN fee_amount
        WHEN fee_currency = 'BTC' THEN (fee_amount * price)
        ELSE NULL 
    END
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Add some addresses for deposit/withdrawal transactions
UPDATE public.transactions 
SET 
    from_address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    to_address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
WHERE type = 'deposit' AND user_id = '550e8400-e29b-41d4-a716-446655440000';

UPDATE public.transactions 
SET 
    from_address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    to_address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
WHERE type = 'withdrawal' AND user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Add transaction hashes for blockchain transactions
UPDATE public.transactions 
SET transaction_hash = CASE 
    WHEN type = 'deposit' THEN '1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890'
    WHEN type = 'withdrawal' THEN '0fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
    ELSE NULL
END
WHERE type IN ('deposit', 'withdrawal') AND user_id = '550e8400-e29b-41d4-a716-446655440000'; 