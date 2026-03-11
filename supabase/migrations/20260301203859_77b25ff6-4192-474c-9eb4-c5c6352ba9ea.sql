-- Storage buckets setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-covers', 'entry-covers', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', false)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = false WHERE id IN ('entry-covers', 'journal-images');

-- consent_logs table
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    user_agent TEXT,
    ip_country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'consent_logs' AND policyname = 'Users can view their own consent logs'
  ) THEN
    CREATE POLICY "Users can view their own consent logs"
      ON public.consent_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Storage security hardening
DROP POLICY IF EXISTS "Anyone can view entry covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view journal images" ON storage.objects;
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own entry covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own journal images" ON storage.objects;

CREATE POLICY "Users can view own entry covers" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'entry-covers' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own journal images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'journal-images' AND (auth.uid())::text = (storage.foldername(name))[1]);