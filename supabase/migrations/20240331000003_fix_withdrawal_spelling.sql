-- Fix the spelling of 'withdrawal' in the transfers table type constraint
ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS transfers_type_check;
ALTER TABLE public.transfers ADD CONSTRAINT transfers_type_check CHECK (type IN ('withdrawal', 'deposit'));

-- Update any existing rows with the old spelling
UPDATE public.transfers SET type = 'withdrawal' WHERE type = 'withdrawl'; 