import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbTransaction {
  id: string;
  type: 'airtime' | 'data' | 'electricity' | 'tv' | 'fund' | 'withdraw';
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  reference: string | null;
  created_at: string;
}

export const useTransactions = (limit = 10) => {
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('transactions')
      .select('id, type, title, description, amount, status, reference, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data) {
      setTransactions(data as DbTransaction[]);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('user-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return { transactions, loading, refetch: fetchTransactions };
};
