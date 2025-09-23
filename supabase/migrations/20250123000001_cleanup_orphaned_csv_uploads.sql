-- Clean up orphaned CSV upload records that are stuck in 'processing' status
-- These are records created during the old flow where CSV records were created
-- before import completion, and users exited the wizard early

-- Delete CSV upload records that are in 'processing' status and have no associated transactions
DELETE FROM public.csv_uploads 
WHERE status = 'processing' 
  AND id NOT IN (
    SELECT DISTINCT csv_upload_id 
    FROM public.transactions 
    WHERE csv_upload_id IS NOT NULL
  );

-- Update any remaining 'processing' records that do have associated transactions to 'completed'
-- This handles edge cases where the status wasn't properly updated
UPDATE public.csv_uploads 
SET 
  status = 'completed',
  imported_row_count = COALESCE(imported_row_count, row_count)
WHERE status = 'processing' 
  AND id IN (
    SELECT DISTINCT csv_upload_id 
    FROM public.transactions 
    WHERE csv_upload_id IS NOT NULL
  );

-- Add a comment documenting the cleanup
COMMENT ON TABLE public.csv_uploads IS 'Tracks CSV file uploads for transaction imports. As of 2025-01-23, records are only created after successful imports to prevent orphaned processing records.';
