import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AmountInput } from '@/components/forms/AmountInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { initializePayment } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const FundWallet: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFund = async () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 100) { toast.error('Minimum amount is ₦100'); return; }

    setIsProcessing(true);
    try {
      const result = await initializePayment(numAmount, user?.email || undefined);
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = parseInt(amount) >= 100;

  return (
    <MobileLayout hideNav>
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Fund Wallet</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 pb-28">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount to Fund</label>
          <AmountInput value={amount} onChange={setAmount} placeholder="0" quickAmounts={[500, 1000, 2000, 5000, 10000, 20000]} />
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Card / Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Via Paystack • Instant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border opacity-60">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button onClick={handleFund} disabled={!isValid || isProcessing} className="w-full" size="xl" variant="gradient">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Redirecting...
              </span>
            ) : (
              `Fund ₦${parseInt(amount || '0').toLocaleString()}`
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default FundWallet;
