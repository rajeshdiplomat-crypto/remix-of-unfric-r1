
-- 1. Fix entry-covers INSERT policy: remove weak auth-only check
DROP POLICY IF EXISTS "Authenticated users can upload entry covers" ON storage.objects;

-- 2. Remove duplicate consent_logs INSERT/SELECT policies
DROP POLICY IF EXISTS "Users can insert consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Users can view their own consent logs" ON public.consent_logs;

-- 3. Remove public listing on avatars bucket; public URLs still serve objects via /object/public
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 4. Lock down SECURITY DEFINER trigger functions from direct API execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
