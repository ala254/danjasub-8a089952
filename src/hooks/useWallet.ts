import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setBalance(Number(data.balance));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel('wallet-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
          () => fetchBalance()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
};
