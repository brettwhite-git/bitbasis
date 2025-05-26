-- Increase hash column length to accommodate longer transaction hashes
-- Bitcoin transaction hashes can sometimes exceed 64 characters

ALTER TABLE public.transfers 
ALTER COLUMN hash TYPE character varying(70);
