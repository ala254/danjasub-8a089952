-- Switch helper functions from SECURITY DEFINER to SECURITY INVOKER.
-- Both are only ever called with the caller's own user_id, and existing RLS policies on
-- user_roles and user_status already let users read their own rows.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_suspended FROM public.user_status WHERE user_id = _user_id),
    false
  );
$$;

-- Re-apply grants (CREATE OR REPLACE preserves them, but be explicit)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_user_suspended(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO authenticated, service_role;