import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TransactionItem, Transaction } from './TransactionItem';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onTransactionClick: (transaction: Transaction) => void;
  loading?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onTransactionClick,
  loading,
}) => {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Transactions
        </h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onClick={() => onTransactionClick(transaction)}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your transactions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
