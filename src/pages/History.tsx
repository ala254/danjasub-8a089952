import React, { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { TransactionItem } from '@/components/dashboard/TransactionItem';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks/useTransactions';

type FilterType = 'all' | 'airtime' | 'data' | 'bills' | 'fund';

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'data', label: 'Data' },
  { id: 'bills', label: 'Bills' },
  { id: 'fund', label: 'Wallet' },
];

const History: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, loading } = useTransactions(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const mappedTransactions = transactions.map(tx => ({
    id: tx.id,
    type: tx.type as 'airtime' | 'data' | 'electricity' | 'tv' | 'fund' | 'withdraw',
    title: tx.title || tx.type,
    description: tx.description || '',
    amount: tx.amount,
    status: tx.status as 'success' | 'pending' | 'failed',
    date: new Date(tx.created_at).toLocaleDateString(),
  }));

  const filteredTransactions = mappedTransactions.filter((tx) => {
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'bills') return matchesSearch && (tx.type === 'electricity' || tx.type === 'tv');
    return matchesSearch && tx.type === activeFilter;
  });

  return (
    <MobileLayout>
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4 z-10 space-y-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Transaction History</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="pl-10 h-11"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
            {filteredTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onClick={() => navigate(`/transaction/${tx.id}`)} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No transactions found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default History;
