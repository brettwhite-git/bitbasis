-- Add ATH columns to bitcoin_prices table
ALTER TABLE bitcoin_prices
ADD COLUMN ath_price DECIMAL(20, 8),
ADD COLUMN ath_date TIMESTAMP WITH TIME ZONE; 