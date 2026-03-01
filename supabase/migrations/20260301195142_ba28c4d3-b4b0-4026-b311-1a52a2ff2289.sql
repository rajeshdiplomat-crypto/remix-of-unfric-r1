
-- Remove overly permissive public SELECT policies
DROP POLICY IF EXISTS "Anyone can view entry covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view journal images" ON storage.objects;
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('entry-covers', 'journal-images');

-- Users can view only their own files (by folder = user_id)
CREATE POLICY "Users can view own entry covers" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'entry-covers' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own journal images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'journal-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
