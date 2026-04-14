import React, { useState } from 'react';
import { ArrowLeft, Zap, Tv, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmountInput } from '@/components/forms/AmountInput';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type BillCategory = 'electricity' | 'tv';

interface BillProvider {
  id: string;
  name: string;
  icon: string;
}

const electricityProviders: BillProvider[] = [
  { id: 'ekedc', name: 'EKEDC', icon: '⚡' },
  { id: 'ikedc', name: 'IKEDC', icon: '⚡' },
  { id: 'aedc', name: 'AEDC', icon: '⚡' },
  { id: 'phed', name: 'PHED', icon: '⚡' },
  { id: 'bedc', name: 'BEDC', icon: '⚡' },
  { id: 'kedco', name: 'KEDCO', icon: '⚡' },
];

const tvProviders: BillProvider[] = [
  { id: 'dstv', name: 'DStv', icon: '📺' },
  { id: 'gotv', name: 'GOtv', icon: '📺' },
  { id: 'startimes', name: 'StarTimes', icon: '📺' },
];

const PayBills: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<BillCategory>('electricity');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [meterOrCard, setMeterOrCard] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const providers = category === 'electricity' ? electricityProviders : tvProviders;

  const handleSubmit = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }
    if (!meterOrCard.trim()) {
      toast.error(`Please enter your ${category === 'electricity' ? 'meter' : 'smart card'} number`);
      return;
    }
    if (category === 'electricity' && (!amount || parseInt(amount) < 500)) {
      toast.error('Minimum amount is ₦500');
      return;
    }

    setIsProcessing(true);
    // Bill payment integration placeholder
    setTimeout(() => {
      toast.success('Bill payment submitted!', {
        icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      });
      setIsProcessing(false);
      navigate('/dashboard');
    }, 2000);
  };

  const isValid = selectedProvider && meterOrCard.trim() && (category === 'tv' || parseInt(amount) >= 500);

  return (
    <MobileLayout hideNav>
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Pay Bills</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 pb-28">
        {/* Category Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => { setCategory('electricity'); setSelectedProvider(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
              category === 'electricity' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Zap className="w-4 h-4" />
            Electricity
          </button>
          <button
            onClick={() => { setCategory('tv'); setSelectedProvider(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
              category === 'tv' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Tv className="w-4 h-4" />
            TV Sub
          </button>
        </div>

        {/* Providers */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  selectedProvider === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-xs font-semibold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meter/Card Number */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {category === 'electricity' ? 'Meter Number' : 'Smart Card Number'}
          </label>
          <Input
            value={meterOrCard}
            onChange={(e) => setMeterOrCard(e.target.value)}
            placeholder={category === 'electricity' ? 'Enter meter number' : 'Enter smart card number'}
            className="h-14 text-lg"
          />
        </div>

        {/* Amount (electricity only) */}
        {category === 'electricity' && (
          <div className="space-y-2 animate-slide-up">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
            <AmountInput value={amount} onChange={setAmount} placeholder="0" quickAmounts={[1000, 2000, 5000, 10000, 15000, 20000]} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button onClick={handleSubmit} disabled={!isValid || isProcessing} className="w-full" size="xl" variant="gradient">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              category === 'electricity' ? `Pay ₦${parseInt(amount || '0').toLocaleString()}` : 'Continue'
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PayBills;
