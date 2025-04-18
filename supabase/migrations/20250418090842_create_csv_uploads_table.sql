-- Create the csv_uploads table
CREATE TABLE public.csv_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE, -- e.g., user_id/uuid_filename.csv
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
    total_row_count INTEGER,
    imported_row_count INTEGER,
    error_message TEXT,

    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'error'))
);

-- Add indexes
CREATE INDEX idx_csv_uploads_user_id ON public.csv_uploads(user_id);
CREATE INDEX idx_csv_uploads_status ON public.csv_uploads(status);

-- Enable Row Level Security
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for csv_uploads
CREATE POLICY "Allow authenticated users to insert their own uploads"
ON public.csv_uploads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to select their own uploads"
ON public.csv_uploads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own uploads"
ON public.csv_uploads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); -- Redundant check, but explicit

CREATE POLICY "Allow users to delete their own uploads"
ON public.csv_uploads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comments for clarity
COMMENT ON COLUMN public.csv_uploads.storage_path IS 'Unique path to the file in Supabase Storage.';
COMMENT ON COLUMN public.csv_uploads.status IS 'Tracking status of the CSV import process.'; 