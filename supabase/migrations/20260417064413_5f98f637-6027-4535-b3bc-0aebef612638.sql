
-- ============ DATA PLAN PRICING ============
CREATE TABLE public.data_plan_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(network, plan_id)
);

ALTER TABLE public.data_plan_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view data pricing"
  ON public.data_plan_pricing FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage data pricing"
  ON public.data_plan_pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_data_plan_pricing_updated_at
  BEFORE UPDATE ON public.data_plan_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AIRTIME PRICING ============
CREATE TABLE public.airtime_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL UNIQUE,
  markup_percent NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.airtime_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view airtime pricing"
  ON public.airtime_pricing FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage airtime pricing"
  ON public.airtime_pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_airtime_pricing_updated_at
  BEFORE UPDATE ON public.airtime_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default 0% markup per network
INSERT INTO public.airtime_pricing (network, markup_percent) VALUES
  ('mtn', 0), ('airtel', 0), ('glo', 0), ('9mobile', 0)
ON CONFLICT (network) DO NOTHING;

-- ============ APP SETTINGS (single row) ============
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airtime_enabled BOOLEAN NOT NULL DEFAULT true,
  data_enabled BOOLEAN NOT NULL DEFAULT true,
  bills_enabled BOOLEAN NOT NULL DEFAULT true,
  min_funding_amount NUMERIC NOT NULL DEFAULT 100,
  transaction_charge NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed single settings row
INSERT INTO public.app_settings DEFAULT VALUES;

-- ============ USER STATUS (suspensions) ============
CREATE TABLE public.user_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  suspended_by UUID,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own status"
  ON public.user_status FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user status"
  ON public.user_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_status_updated_at
  BEFORE UPDATE ON public.user_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to check suspension from edge functions
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_suspended FROM public.user_status WHERE user_id = _user_id),
    false
  );
$$;
