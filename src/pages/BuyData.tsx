import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { NetworkSelector } from '@/components/dashboard/NetworkSelector';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { purchaseVTU, fetchPlans } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDataPricing } from '@/hooks/usePricing';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card } from '@/components/ui/card';

interface DataPlan {
  id: string;
  name: string;
  amount: number;
  validity: string;
  size?: string;
  plan_type?: string;
}

// Fallback plans if API is unavailable
const fallbackPlans: Record<string, DataPlan[]> = {
  mtn: [
    { id: 'mtn-500mb', name: '500MB SME', amount: 150, validity: '30 days' },
    { id: 'mtn-1gb', name: '1GB SME', amount: 260, validity: '30 days' },
    { id: 'mtn-2gb', name: '2GB SME', amount: 500, validity: '30 days' },
    { id: 'mtn-3gb', name: '3GB SME', amount: 750, validity: '30 days' },
    { id: 'mtn-5gb', name: '5GB SME', amount: 1250, validity: '30 days' },
    { id: 'mtn-10gb', name: '10GB SME', amount: 2500, validity: '30 days' },
  ],
  airtel: [
    { id: 'air-500mb', name: '500MB', amount: 150, validity: '30 days' },
    { id: 'air-1gb', name: '1GB', amount: 260, validity: '30 days' },
    { id: 'air-2gb', name: '2GB', amount: 500, validity: '30 days' },
    { id: 'air-5gb', name: '5GB', amount: 1250, validity: '30 days' },
  ],
  glo: [
    { id: 'glo-500mb', name: '500MB', amount: 130, validity: '30 days' },
    { id: 'glo-1gb', name: '1GB', amount: 240, validity: '30 days' },
    { id: 'glo-2gb', name: '2GB', amount: 480, validity: '30 days' },
    { id: 'glo-5gb', name: '5GB', amount: 1200, validity: '30 days' },
  ],
  '9mobile': [
    { id: '9m-500mb', name: '500MB', amount: 150, validity: '30 days' },
    { id: '9m-1gb', name: '1GB', amount: 260, validity: '30 days' },
    { id: '9m-2gb', name: '2GB', amount: 500, validity: '30 days' },
  ],
};

const BuyData: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { pricing: dataPricing } = useDataPricing(selectedNetwork || undefined);
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!selectedNetwork) {
      setPlans([]);
      return;
    }

    const loadPlans = async () => {
      setLoadingPlans(true);
      setSelectedPlan(null);
      try {
        const data = await fetchPlans('data', selectedNetwork);
        if (data?.data && Array.isArray(data.data)) {
          const networkMap: Record<string, number> = { mtn: 1, airtel: 2, glo: 3, '9mobile': 4 };
          const networkId = networkMap[selectedNetwork];
          const filtered = data.data
            .filter((p: Record<string, unknown>) => p.network_id === networkId || !p.network_id)
            .map((p: Record<string, unknown>) => ({
              id: String(p.id || p.plan_id),
              name: String(p.name || p.plan_name || ''),
              amount: Number(p.amount || p.price || 0),
              validity: String(p.validity || p.duration || '30 days'),
              plan_type: String(p.plan_type || 'SME'),
            }));
          setPlans(filtered.length > 0 ? filtered : fallbackPlans[selectedNetwork] || []);
        } else {
          setPlans(fallbackPlans[selectedNetwork] || []);
        }
      } catch {
        setPlans(fallbackPlans[selectedNetwork] || []);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [selectedNetwork]);

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

        {settings && !settings.data_enabled && (
          <Card className="p-4 border-destructive/40 bg-destructive/5">
            <p className="text-sm font-semibold text-destructive">Data service is currently unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">Please check back later.</p>
          </Card>
        )}

        {selectedNetwork && (
          <div className="space-y-2 animate-slide-up">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Plan</label>
            {loadingPlans ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => {
                  const override = dataPricing.get(`${selectedNetwork}:${plan.id}`);
                  const displayAmount = override?.selling_price ?? plan.amount;
                  const displayed: DataPlan = { ...plan, amount: displayAmount };
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(displayed)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all duration-200",
                        selectedPlan?.id === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <p className="font-display font-bold text-foreground text-sm">{plan.name}</p>
                      <p className="text-sm font-semibold text-primary">₦{displayAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{plan.validity}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button onClick={handleSubmit} disabled={!isFormValid || isProcessing} className="w-full" size="xl" variant="gradient">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
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
