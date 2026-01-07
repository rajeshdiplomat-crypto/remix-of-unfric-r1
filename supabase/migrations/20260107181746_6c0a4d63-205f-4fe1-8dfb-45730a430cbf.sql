-- Create storage bucket for journal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload journal images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to journal images
CREATE POLICY "Public can view journal images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'journal-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own journal images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);