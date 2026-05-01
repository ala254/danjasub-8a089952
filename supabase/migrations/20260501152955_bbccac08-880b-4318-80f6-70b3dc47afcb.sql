-- Provider routing table
CREATE TABLE IF NOT EXISTS public.provider_routing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL,
  network TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'smeplug',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (service_type, network)
);

ALTER TABLE public.provider_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view provider routing"
  ON public.provider_routing FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage provider routing"
  ON public.provider_routing FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_provider_routing_updated_at
  BEFORE UPDATE ON public.provider_routing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-provider pricing columns
ALTER TABLE public.data_plan_pricing
  ADD COLUMN IF NOT EXISTS cost_price_smeplug NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price_inkotasub NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inkotasub_plan_id TEXT;

-- Backfill smeplug cost from existing cost_price
UPDATE public.data_plan_pricing
SET cost_price_smeplug = cost_price
WHERE cost_price_smeplug = 0 AND cost_price > 0;

ALTER TABLE public.airtime_pricing
  ADD COLUMN IF NOT EXISTS markup_percent_smeplug NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_percent_inkotasub NUMERIC NOT NULL DEFAULT 0;

UPDATE public.airtime_pricing
SET markup_percent_smeplug = markup_percent
WHERE markup_percent_smeplug = 0 AND markup_percent > 0;

-- Seed default routes (smeplug)
INSERT INTO public.provider_routing (service_type, network, provider) VALUES
  ('airtime','mtn','smeplug'),
  ('airtime','airtel','smeplug'),
  ('airtime','glo','smeplug'),
  ('airtime','9mobile','smeplug'),
  ('data','mtn','smeplug'),
  ('data','airtel','smeplug'),
  ('data','glo','smeplug'),
  ('data','9mobile','smeplug')
ON CONFLICT (service_type, network) DO NOTHING;