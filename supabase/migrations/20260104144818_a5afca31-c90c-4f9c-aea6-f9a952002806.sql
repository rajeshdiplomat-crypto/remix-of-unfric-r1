-- Create storage bucket for entry cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-covers', 'entry-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own cover images
CREATE POLICY "Users can upload their own cover images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'entry-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to cover images
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'entry-covers');

-- Allow users to update their own cover images
CREATE POLICY "Users can update their own cover images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'entry-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own cover images
CREATE POLICY "Users can delete their own cover images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'entry-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);