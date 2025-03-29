-- Test connection and create initial schema for BitBasis

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'send', 'receive')),
    btc_amount DECIMAL(18,8) NOT NULL,
    fiat_amount DECIMAL(18,2),
    fiat_currency TEXT DEFAULT 'USD',
    price_per_btc DECIMAL(18,2),
    fee_amount DECIMAL(18,8),
    fee_currency TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bitcoin_prices table for caching
CREATE TABLE IF NOT EXISTS bitcoin_prices (
    id SERIAL PRIMARY KEY,
    price_usd DECIMAL(18,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitcoin_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read bitcoin prices" ON bitcoin_prices
    FOR SELECT USING (true);

-- Test query
SELECT current_timestamp as server_time;

SELECT 1 as test;
















