-- Disable GraphQL API exposure entirely (app uses PostgREST)
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated, public;
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated, public;
REVOKE ALL ON ALL TABLES IN SCHEMA graphql FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql_public FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql FROM anon, authenticated, public;

-- Move SECURITY DEFINER helper functions out of the API-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO postgres, service_role;

-- Recreate is_user_suspended in private schema
CREATE OR REPLACE FUNCTION private.is_user_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_suspended FROM public.user_status WHERE user_id = _user_id),
    false
  );
$$;
REVOKE ALL ON FUNCTION private.is_user_suspended(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_user_suspended(uuid) TO postgres, service_role;

-- Update public.has_role to wrap the private one (kept because RLS policies and edge functions reference it)
-- We must keep public.has_role and public.is_user_suspended callable since RLS policies and edge functions
-- reference them. Instead of moving, we lock them down properly: revoke from public/anon/authenticated, and
-- grant ONLY to authenticated (RLS evaluates as the caller's role) for has_role / is_user_suspended.
-- The linter flags them as exposed; the trade-off is necessary because RLS depends on them.
-- However, since RLS function calls evaluate with the caller's privileges, authenticated needs EXECUTE.
-- We'll drop the recreated private versions since they're not needed; public versions stay but with
-- explicit grants only to authenticated and service_role.
DROP FUNCTION IF EXISTS private.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS private.is_user_suspended(uuid);

-- Lock down public SECURITY DEFINER funcs: revoke from PUBLIC, grant only what's needed
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_user_suspended(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;