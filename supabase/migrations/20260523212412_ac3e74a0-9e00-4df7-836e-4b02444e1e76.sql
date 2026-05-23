CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

CREATE OR REPLACE FUNCTION public.transfer_wallet(
  _recipient TEXT,
  _amount NUMERIC,
  _passcode TEXT,
  _narration TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sender_id UUID := auth.uid();
  recipient_id UUID;
  recipient_name TEXT;
  sender_name TEXT;
  sender_balance NUMERIC;
  pc RECORD;
  is_match BOOLEAN;
  ref TEXT;
BEGIN
  IF sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount < 50 THEN
    RAISE EXCEPTION 'Minimum transfer amount is 50';
  END IF;

  IF _passcode IS NULL OR _passcode !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'Invalid passcode';
  END IF;

  -- Verify passcode
  SELECT * INTO pc FROM public.user_passcodes WHERE user_id = sender_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Passcode not set';
  END IF;
  IF pc.locked_until IS NOT NULL AND pc.locked_until > now() THEN
    RAISE EXCEPTION 'Account temporarily locked';
  END IF;
  is_match := (pc.passcode_hash = crypt(_passcode, pc.passcode_hash));
  IF NOT is_match THEN
    UPDATE public.user_passcodes
       SET failed_attempts = pc.failed_attempts + 1,
           locked_until = CASE WHEN pc.failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
           updated_at = now()
     WHERE user_id = sender_id;
    RAISE EXCEPTION 'Incorrect passcode';
  END IF;

  -- Resolve recipient by phone or full_name (case-insensitive). Could also match auth email via profiles full_name.
  SELECT p.user_id, p.full_name
    INTO recipient_id, recipient_name
    FROM public.profiles p
   WHERE p.phone = _recipient
      OR lower(p.full_name) = lower(_recipient)
   LIMIT 1;

  IF recipient_id IS NULL THEN
    -- Try by email via auth.users
    SELECT u.id INTO recipient_id FROM auth.users u WHERE lower(u.email) = lower(_recipient) LIMIT 1;
    IF recipient_id IS NOT NULL THEN
      SELECT full_name INTO recipient_name FROM public.profiles WHERE user_id = recipient_id;
    END IF;
  END IF;

  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  IF recipient_id = sender_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  -- Lock sender wallet
  SELECT balance INTO sender_balance FROM public.wallets WHERE user_id = sender_id FOR UPDATE;
  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  IF sender_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Ensure recipient wallet exists, lock it
  INSERT INTO public.wallets(user_id, balance) VALUES (recipient_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.wallets WHERE user_id = recipient_id FOR UPDATE;

  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = sender_id;

  ref := 'TRF-' || replace(gen_random_uuid()::text, '-', '');

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE user_id = sender_id;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = recipient_id;

  INSERT INTO public.transactions(user_id, type, amount, status, reference, metadata)
  VALUES (
    sender_id, 'transfer_sent', _amount, 'success', ref,
    jsonb_build_object('recipient_id', recipient_id, 'recipient_name', recipient_name, 'narration', _narration)
  );

  INSERT INTO public.transactions(user_id, type, amount, status, reference, metadata)
  VALUES (
    recipient_id, 'transfer_received', _amount, 'success', ref,
    jsonb_build_object('sender_id', sender_id, 'sender_name', sender_name, 'narration', _narration)
  );

  RETURN jsonb_build_object('ok', true, 'reference', ref, 'recipient_name', recipient_name);
END;
$$;

-- Lookup helper for recipient preview (returns masked info, only existence + name).
CREATE OR REPLACE FUNCTION public.lookup_recipient(_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid UUID;
  rname TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.user_id, p.full_name INTO rid, rname
    FROM public.profiles p
   WHERE p.phone = _query OR lower(p.full_name) = lower(_query)
   LIMIT 1;

  IF rid IS NULL THEN
    SELECT u.id INTO rid FROM auth.users u WHERE lower(u.email) = lower(_query) LIMIT 1;
    IF rid IS NOT NULL THEN
      SELECT full_name INTO rname FROM public.profiles WHERE user_id = rid;
    END IF;
  END IF;

  IF rid IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  IF rid = auth.uid() THEN
    RETURN jsonb_build_object('found', false, 'reason', 'self');
  END IF;

  RETURN jsonb_build_object('found', true, 'name', COALESCE(rname, 'Danjasub User'));
END;
$$;

-- Add unique constraint on wallets.user_id if missing (for ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
END $$;