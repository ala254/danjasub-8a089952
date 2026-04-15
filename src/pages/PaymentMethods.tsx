import React from 'react';
import { ArrowLeft, CreditCard, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { toast } from 'sonner';

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-6 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-primary-foreground">Payment Methods</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        <button
          onClick={() => toast.info('Card management coming soon')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card hover:bg-muted/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm text-foreground">Add Debit Card</p>
            <p className="text-xs text-muted-foreground">Visa, Mastercard, Verve</p>
          </div>
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => toast.info('Bank account linking coming soon')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card hover:bg-muted/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm text-foreground">Add Bank Account</p>
            <p className="text-xs text-muted-foreground">Link your bank for transfers</p>
          </div>
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="pt-8 text-center">
          <p className="text-sm text-muted-foreground">No saved payment methods yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your cards and bank accounts will appear here</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PaymentMethods;
