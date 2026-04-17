import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  id: string;
  airtime_enabled: boolean;
  data_enabled: boolean;
  bills_enabled: boolean;
  min_funding_amount: number;
  transaction_charge: number;
}

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from('app_settings').select('*').limit(1).maybeSingle();
    if (data) {
      setSettings({
        id: data.id,
        airtime_enabled: data.airtime_enabled,
        data_enabled: data.data_enabled,
        bills_enabled: data.bills_enabled,
        min_funding_amount: Number(data.min_funding_amount),
        transaction_charge: Number(data.transaction_charge),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('app-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { settings, loading, refetch: fetch };
};

export const useSuspensionStatus = () => {
  const [suspended, setSuspended] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_status')
        .select('is_suspended, suspension_reason')
        .eq('user_id', user.id)
        .maybeSingle();
      if (mounted && data) {
        setSuspended(!!data.is_suspended);
        setReason(data.suspension_reason);
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  return { suspended, reason };
};
