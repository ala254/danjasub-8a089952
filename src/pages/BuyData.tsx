import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { NetworkSelector } from '@/components/dashboard/NetworkSelector';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { purchaseVTU } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DataPlan {
  id: string;
  name: string;
  amount: number;
  validity: string;
}

const dataPlans: Record<string, DataPlan[]> = {
  mtn: [
    { id: 'mtn-500mb', name: '500MB', amount: 150, validity: '30 days' },
    { id: 'mtn-1gb', name: '1GB', amount: 260, validity: '30 days' },
    { id: 'mtn-2gb', name: '2GB', amount: 500, validity: '30 days' },
    { id: 'mtn-3gb', name: '3GB', amount: 750, validity: '30 days' },
    { id: 'mtn-5gb', name: '5GB', amount: 1250, validity: '30 days' },
    { id: 'mtn-10gb', name: '10GB', amount: 2500, validity: '30 days' },
  ],
  airtel: [
    { id: 'air-500mb', name: '500MB', amount: 150, validity: '30 days' },
    { id: 'air-1gb', name: '1GB', amount: 260, validity: '30 days' },
    { id: 'air-2gb', name: '2GB', amount: 500, validity: '30 days' },
    { id: 'air-5gb', name: '5GB', amount: 1250, validity: '30 days' },
    { id: 'air-10gb', name: '10GB', amount: 2500, validity: '30 days' },
  ],
  glo: [
    { id: 'glo-500mb', name: '500MB', amount: 130, validity: '30 days' },
    { id: 'glo-1gb', name: '1GB', amount: 240, validity: '30 days' },
    { id: 'glo-2gb', name: '2GB', amount: 480, validity: '30 days' },
    { id: 'glo-5gb', name: '5GB', amount: 1200, validity: '30 days' },
    { id: 'glo-10gb', name: '10GB', amount: 2400, validity: '30 days' },
  ],
  '9mobile': [
    { id: '9m-500mb', name: '500MB', amount: 150, validity: '30 days' },
    { id: '9m-1gb', name: '1GB', amount: 260, validity: '30 days' },
    { id: '9m-2gb', name: '2GB', amount: 500, validity: '30 days' },
    { id: '9m-5gb', name: '5GB', amount: 1250, validity: '30 days' },
  ],
};

const BuyData: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = selectedNetwork ? dataPlans[selectedNetwork] || [] : [];

  const handleSubmit = async () => {
    if (!selectedNetwork || !selectedPlan) {
      toast.error('Please select a network and plan');
      return;
    }
    if (phoneNumber.length !== 11) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await purchaseVTU({
        service_type: 'data',
        network: selectedNetwork,
        phone: phoneNumber,
        amount: selectedPlan.amount,
        plan_id: selectedPlan.id,
      });

      if (result.status === 'success') {
        toast.success('Data purchased successfully!', {
          icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
        });
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Purchase failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = selectedNetwork && phoneNumber.length === 11 && selectedPlan;

  return (
    <MobileLayout hideNav>
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Buy Data</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 pb-28">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Network</label>
          <NetworkSelector selectedNetwork={selectedNetwork} onSelect={(id) => { setSelectedNetwork(id); setSelectedPlan(null); }} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
          <PhoneInput value={phoneNumber} onChange={setPhoneNumber} placeholder="08012345678" />
        </div>

        {selectedNetwork && plans.length > 0 && (
          <div className="space-y-2 animate-slide-up">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all duration-200",
                    selectedPlan?.id === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <p className="font-display font-bold text-foreground">{plan.name}</p>
                  <p className="text-sm font-semibold text-primary">₦{plan.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{plan.validity}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button onClick={handleSubmit} disabled={!isFormValid || isProcessing} className="w-full" size="xl" variant="gradient">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Buy ${selectedPlan ? selectedPlan.name + ' — ₦' + selectedPlan.amount.toLocaleString() : 'Data'}`
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default BuyData;
