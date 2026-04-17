import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbTransaction {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  status: string;
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
      .select('id, type, amount, status, reference, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data) {
      const mapped: DbTransaction[] = data.map((row) => {
        const meta = (row.metadata as Record<string, unknown>) || {};
        const type = row.type || 'fund';
        let title = type.charAt(0).toUpperCase() + type.slice(1);
        let description = '';

        if (meta.network) {
          title = `${(meta.network as string).toUpperCase()} ${type === 'airtime' ? 'Airtime' : 'Data'}`;
        }
        if (meta.phone) {
          description = meta.phone as string;
        }
        if (type === 'fund') {
          title = 'Wallet Funded';
          description = 'Via Paystack';
        }

        // Normalize statuses: "completed" → "success"
        const status = row.status === 'completed' ? 'success' : row.status;

        return {
          id: row.id,
          type,
          title,
          description,
          amount: row.amount,
          status,
          reference: row.reference,
          created_at: row.created_at,
        };
      });
      setTransactions(mapped);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchTransactions();

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
