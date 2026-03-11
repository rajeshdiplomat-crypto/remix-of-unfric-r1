-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-covers', 'entry-covers', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = false WHERE id IN ('entry-covers', 'journal-images', 'avatars');

-- Create consent_logs table
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent logs"
    ON public.consent_logs FOR SELECT
    USING (auth.uid() = user_id);
