import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { NetworkSelector } from '@/components/dashboard/NetworkSelector';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { AmountInput } from '@/components/forms/AmountInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BuyAirtime: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }
    if (phoneNumber.length !== 11) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!amount || parseInt(amount) < 50) {
      toast.error('Minimum amount is ₦50');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    toast.success('Airtime purchased successfully!', {
      icon: <CheckCircle2 className="w-5 h-5 text-success" />,
    });
    navigate('/');
  };

  const isFormValid = selectedNetwork && phoneNumber.length === 11 && parseInt(amount) >= 50;

  return (
    <MobileLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Buy Airtime</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Network Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">
            Select Network
          </label>
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onSelect={setSelectedNetwork}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">
            Phone Number
          </label>
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="08012345678"
          />
        </div>

        {/* Amount */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">
            Amount
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            placeholder="0"
            quickAmounts={[50, 100, 200, 500, 1000, 2000]}
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isProcessing}
            className="w-full"
            size="xl"
            variant="gradient"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Buy ₦${amount || '0'} Airtime`
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default BuyAirtime;
