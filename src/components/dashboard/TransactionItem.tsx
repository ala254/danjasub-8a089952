import React from 'react';
import { Smartphone, Wifi, Zap, Tv, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Transaction {
  id: string;
  type: 'airtime' | 'data' | 'electricity' | 'tv' | 'fund' | 'withdraw';
  title: string;
  description: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
}

const typeIcons: Record<string, React.ElementType> = {
  airtime: Smartphone,
  data: Wifi,
  electricity: Zap,
  tv: Tv,
  fund: ArrowDownLeft,
  withdraw: ArrowUpRight,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  airtime: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  data: { bg: 'bg-blue-100', text: 'text-blue-600' },
  electricity: { bg: 'bg-amber-100', text: 'text-amber-600' },
  tv: { bg: 'bg-purple-100', text: 'text-purple-600' },
  fund: { bg: 'bg-green-100', text: 'text-green-600' },
  withdraw: { bg: 'bg-red-100', text: 'text-red-600' },
};

const statusColors: Record<string, string> = {
  success: 'text-success',
  pending: 'text-warning',
  failed: 'text-destructive',
};

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onClick 
}) => {
  const Icon = typeIcons[transaction.type] || Smartphone;
  const colors = typeColors[transaction.type] || typeColors.airtime;
  const isCredit = transaction.type === 'fund';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
        colors.bg
      )}>
        <Icon className={cn("w-5 h-5", colors.text)} />
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-foreground truncate">
          {transaction.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {transaction.description}
        </p>
      </div>
      
      <div className="text-right shrink-0">
        <p className={cn(
          "font-semibold",
          isCredit ? "text-success" : "text-foreground"
        )}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
        <p className={cn(
          "text-xs capitalize",
          statusColors[transaction.status]
        )}>
          {transaction.status}
        </p>
      </div>
    </button>
  );
};
