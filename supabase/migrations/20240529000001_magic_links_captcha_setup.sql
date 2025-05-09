-- Migration for Magic Links and Turnstile CAPTCHA Implementation (Passwordless Only)

-- We are implementing email-only passwordless authentication
-- This migration sets up the necessary database objects

-- Enable Email Sign In Method if not already enabled
-- This is commented out because it typically requires Supabase UI interaction
-- or direct database modification which varies by Supabase version
-- COMMENT ON TABLE auth.identities IS 'Email sign-in method: enabled';

-- Create a table to track terms and conditions acceptance
CREATE TABLE IF NOT EXISTS public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terms_version VARCHAR(50) NOT NULL,
  privacy_version VARCHAR(50) NOT NULL,
  acceptance_type VARCHAR(20) NOT NULL DEFAULT 'signup', -- Possible values: 'signup', 'login', 'update'
  acceptance_method VARCHAR(20) NOT NULL, -- Possible values: 'checkbox', 'button', etc.
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Admin can read all records
CREATE POLICY "Admins can read all terms acceptances"
  ON public.terms_acceptance
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'app_metadata'::text) ? 'admin');

-- Users can read their own records
CREATE POLICY "Users can read their own terms acceptances"
  ON public.terms_acceptance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins and server can insert
CREATE POLICY "Admins and server can insert terms acceptances"
  ON public.terms_acceptance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'app_metadata'::text) ? 'admin'
  );

-- Nobody can update
CREATE POLICY "Nobody can update terms acceptances"
  ON public.terms_acceptance
  FOR UPDATE
  TO authenticated
  USING (false);

-- Nobody can delete
CREATE POLICY "Nobody can delete terms acceptances"
  ON public.terms_acceptance
  FOR DELETE
  TO authenticated
  USING (false);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user_id ON public.terms_acceptance(user_id);

-- Create a function to get the latest terms acceptance for a user
CREATE OR REPLACE FUNCTION public.get_latest_terms_acceptance(p_user_id UUID)
RETURNS TABLE (
  terms_version VARCHAR(50),
  privacy_version VARCHAR(50),
  accepted_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT ta.terms_version, ta.privacy_version, ta.accepted_at
  FROM public.terms_acceptance ta
  WHERE ta.user_id = p_user_id
  ORDER BY ta.accepted_at DESC
  LIMIT 1;
END;
$$; 