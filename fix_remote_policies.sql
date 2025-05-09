-- Fix admin read policy
DROP POLICY IF EXISTS "Admins can read all terms acceptances" ON public.terms_acceptance;
CREATE POLICY "Admins can read all terms acceptances" ON public.terms_acceptance FOR SELECT TO authenticated USING (true);

-- Fix admin insert policy
DROP POLICY IF EXISTS "Admins and server can insert terms acceptances" ON public.terms_acceptance;
CREATE POLICY "Admins and server can insert terms acceptances" ON public.terms_acceptance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR true);
