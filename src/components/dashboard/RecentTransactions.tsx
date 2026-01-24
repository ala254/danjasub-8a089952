import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TransactionItem, Transaction } from './TransactionItem';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onTransactionClick: (transaction: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onTransactionClick,
}) => {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Recent Transactions
        </h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        {transactions.length > 0 ? (
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
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your transactions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
