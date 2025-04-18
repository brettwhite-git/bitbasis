-- Fix column names and add missing columns to csv_uploads table
ALTER TABLE public.csv_uploads DROP COLUMN storage_path;

ALTER TABLE public.csv_uploads ADD COLUMN original_filename TEXT NOT NULL DEFAULT '';
ALTER TABLE public.csv_uploads ADD COLUMN file_size BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.csv_uploads RENAME COLUMN total_row_count TO row_count;

-- Add comment for new columns
COMMENT ON COLUMN public.csv_uploads.original_filename IS 'Original name of the uploaded file';
COMMENT ON COLUMN public.csv_uploads.file_size IS 'Size of the uploaded file in bytes';
COMMENT ON COLUMN public.csv_uploads.filename IS 'Path to the file in storage bucket (e.g. user_id/uuid.csv)';

-- Remove default constraints after initial migration
ALTER TABLE public.csv_uploads ALTER COLUMN original_filename DROP DEFAULT;
ALTER TABLE public.csv_uploads ALTER COLUMN file_size DROP DEFAULT; 