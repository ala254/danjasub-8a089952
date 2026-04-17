import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DataPlanPricing {
  id: string;
  network: string;
  plan_id: string;
  plan_name: string | null;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
}

export interface AirtimePricing {
  id: string;
  network: string;
  markup_percent: number;
  is_active: boolean;
}

export const useDataPricing = (network?: string) => {
  const [pricing, setPricing] = useState<Map<string, DataPlanPricing>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      let q = supabase.from('data_plan_pricing').select('*').eq('is_active', true);
      if (network) q = q.eq('network', network);
      const { data } = await q;
      if (mounted && data) {
        const map = new Map<string, DataPlanPricing>();
        for (const row of data) {
          map.set(`${row.network}:${row.plan_id}`, {
            ...row,
            cost_price: Number(row.cost_price),
            selling_price: Number(row.selling_price),
          });
        }
        setPricing(map);
      }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [network]);

  return { pricing, loading };
};

export const useAirtimePricing = () => {
  const [pricing, setPricing] = useState<Map<string, AirtimePricing>>(new Map());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from('airtime_pricing').select('*').eq('is_active', true);
      if (mounted && data) {
        const map = new Map<string, AirtimePricing>();
        for (const row of data) {
          map.set(row.network, { ...row, markup_percent: Number(row.markup_percent) });
        }
        setPricing(map);
      }
    };
    load();
  }, []);

  return { pricing };
};
