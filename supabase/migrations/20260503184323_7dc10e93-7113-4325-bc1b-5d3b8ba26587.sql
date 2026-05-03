-- Enable bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Passcode table
CREATE TABLE IF NOT EXISTS public.user_passcodes (
  user_id UUID PRIMARY KEY,
  passcode_hash TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_passcodes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own row; never write directly (RPCs handle writes via SECURITY DEFINER)
CREATE POLICY "Users view own passcode meta"
  ON public.user_passcodes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.user_passcodes FROM anon, authenticated;
GRANT SELECT ON public.user_passcodes TO authenticated;

-- Set or change the passcode for the current user
CREATE OR REPLACE FUNCTION public.set_user_passcode(_passcode TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _passcode !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 6 digits';
  END IF;

  INSERT INTO public.user_passcodes(user_id, passcode_hash, failed_attempts, locked_until)
  VALUES (uid, crypt(_passcode, gen_salt('bf', 10)), 0, NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET passcode_hash = EXCLUDED.passcode_hash,
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_passcode(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_user_passcode(TEXT) TO authenticated;

-- Verify passcode for current user, with lockout (5 failures => 15min lock)
CREATE OR REPLACE FUNCTION public.verify_user_passcode(_passcode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid UUID := auth.uid();
  rec RECORD;
  is_match BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO rec FROM public.user_passcodes WHERE user_id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_passcode');
  END IF;

  IF rec.locked_until IS NOT NULL AND rec.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'until', rec.locked_until);
  END IF;

  is_match := (rec.passcode_hash = crypt(_passcode, rec.passcode_hash));

  IF is_match THEN
    UPDATE public.user_passcodes
      SET failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE user_id = uid;
    RETURN jsonb_build_object('ok', true);
  ELSE
    UPDATE public.user_passcodes
      SET failed_attempts = rec.failed_attempts + 1,
          locked_until = CASE WHEN rec.failed_attempts + 1 >= 5
                              THEN now() + interval '15 minutes'
                              ELSE NULL END,
          updated_at = now()
      WHERE user_id = uid;
    RETURN jsonb_build_object(
      'ok', false,
      'reason', CASE WHEN rec.failed_attempts + 1 >= 5 THEN 'locked' ELSE 'wrong' END,
      'attempts_left', GREATEST(0, 5 - (rec.failed_attempts + 1))
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_user_passcode(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.verify_user_passcode(TEXT) TO authenticated;

-- Helper: does the current user have a passcode set?
CREATE OR REPLACE FUNCTION public.has_passcode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_passcodes WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.has_passcode() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_passcode() TO authenticated;