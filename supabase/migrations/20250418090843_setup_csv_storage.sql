-- Create the storage bucket for CSV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv_uploads', 'csv_uploads', false);

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload CSVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'csv_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to read their own CSVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'csv_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own CSVs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'csv_uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
); 