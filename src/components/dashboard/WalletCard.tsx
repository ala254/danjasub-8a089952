import React, { useState } from 'react';
import { Eye, EyeOff, Plus, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletCardProps {
  balance: number;
  onFundWallet: () => void;
  onWithdraw: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ balance, onFundWallet, onWithdraw }) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);

  return (
    <div className="gradient-hero rounded-2xl p-5 text-primary-foreground shadow-elevated animate-scale-in relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-8 translate-x-8 blur-xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-6 -translate-x-6 blur-xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs opacity-70 mb-1 font-medium uppercase tracking-wider">Available Balance</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-display font-bold tracking-tight">
                {showBalance ? formatCurrency(balance) : '₦••••••'}
              </h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              >
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-display">Danjasub</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onFundWallet}
            className="flex-1 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-0 backdrop-blur-sm h-10"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Fund
          </Button>
          <Button
            onClick={onWithdraw}
            variant="ghost"
            className="flex-1 bg-primary-foreground/5 hover:bg-primary-foreground/15 text-primary-foreground h-10"
            size="sm"
          >
            <ArrowDownLeft className="w-4 h-4 mr-1.5" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};
