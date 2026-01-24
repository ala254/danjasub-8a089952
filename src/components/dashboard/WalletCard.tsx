import React, { useState } from 'react';
import { Eye, EyeOff, Plus, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WalletCardProps {
  balance: number;
  onFundWallet: () => void;
  onWithdraw: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ 
  balance, 
  onFundWallet, 
  onWithdraw 
}) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elevated animate-scale-in">
      {/* Balance Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm opacity-90 mb-1">Available Balance</p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {showBalance ? formatCurrency(balance) : '₦••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onFundWallet}
          className="flex-1 bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Fund Wallet
        </Button>
        <Button
          onClick={onWithdraw}
          variant="ghost"
          className="flex-1 bg-white/10 hover:bg-white/20 text-primary-foreground"
          size="sm"
        >
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          Withdraw
        </Button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-xl" />
    </div>
  );
};
