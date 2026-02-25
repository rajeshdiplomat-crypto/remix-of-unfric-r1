
-- consent_logs table for tracking all consent actions
CREATE TABLE public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  ip_country text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own consent logs
CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own consent logs
CREATE POLICY "Users can insert consent logs"
  ON public.consent_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for cookie consent before login
CREATE POLICY "Anon can insert consent logs"
  ON public.consent_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Add DELETE policy on profiles table (missing per security audit)
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
