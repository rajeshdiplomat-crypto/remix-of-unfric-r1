-- Add cover_image_url column to manifest_goals
ALTER TABLE public.manifest_goals ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add cover_image_url column to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add cover_image_url column to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create storage bucket for entry covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('entry-covers', 'entry-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for entry-covers bucket
CREATE POLICY "Anyone can view entry covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'entry-covers');

CREATE POLICY "Authenticated users can upload entry covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'entry-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own entry covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'entry-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own entry covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'entry-covers' AND auth.uid()::text = (storage.foldername(name))[1]);