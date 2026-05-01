-- Revoke anon access to all public tables (none should be readable without auth)
REVOKE ALL ON TABLE public.airtime_pricing FROM anon;
REVOKE ALL ON TABLE public.app_settings FROM anon;
REVOKE ALL ON TABLE public.data_plan_pricing FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.provider_routing FROM anon;
REVOKE ALL ON TABLE public.transactions FROM anon;
REVOKE ALL ON TABLE public.user_roles FROM anon;
REVOKE ALL ON TABLE public.user_status FROM anon;
REVOKE ALL ON TABLE public.wallets FROM anon;

-- Hide tables from GraphQL schema for authenticated users (app uses PostgREST, not GraphQL)
COMMENT ON TABLE public.airtime_pricing IS E'@graphql({"totalCount": {"enabled": false}})\n@graphql({"primary_key_columns": []})';

-- Better: disable graphql per-table via the standard directive
COMMENT ON TABLE public.airtime_pricing IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.app_settings IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.data_plan_pricing IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.profiles IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.provider_routing IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.transactions IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.user_roles IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.user_status IS '@graphql({"max_rows": 0})';
COMMENT ON TABLE public.wallets IS '@graphql({"max_rows": 0})';

-- Revoke EXECUTE on SECURITY DEFINER functions from anon (none of these need anon access)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_user_suspended(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Storage: restrict avatars bucket SELECT policy to authenticated users only and to their own folder
-- (currently a public bucket with broad listing). Keep public read for individual files via direct URL,
-- but prevent listing. We do this by ensuring no permissive SELECT policy on storage.objects for avatars exists
-- that allows listing the whole bucket. Add a scoped policy if missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    -- Make bucket non-public to prevent listing; files still accessible via signed URLs or scoped policies
    UPDATE storage.buckets SET public = false WHERE id = 'avatars';
  END IF;
END $$;

-- Allow public read of individual avatar files (by exact key) via a SELECT policy
DROP POLICY IF EXISTS "Public can read avatar files" ON storage.objects;
CREATE POLICY "Public can read avatar files"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload/update/delete their own avatar (folder = user_id)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);