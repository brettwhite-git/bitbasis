-- Create helper function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create helper function for ensuring user_id matches auth.uid()
CREATE OR REPLACE FUNCTION public.ensure_user_id_matches_auth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'user_id must match the authenticated user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 