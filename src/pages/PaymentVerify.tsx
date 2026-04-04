import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyPayment } from '@/lib/api';

const PaymentVerify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    verifyPayment(reference)
      .then((result) => {
        if (result.status === 'success') {
          setStatus('success');
          setAmount(result.amount || 0);
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
  }, [reference]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-md mx-auto px-6">
      {status === 'loading' && (
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-lg font-semibold">Verifying payment...</p>
          <p className="text-muted-foreground">Please wait while we confirm your payment</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-4 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            ₦{amount.toLocaleString()} has been added to your wallet
          </p>
          <Button onClick={() => navigate('/dashboard')} size="xl" variant="gradient" className="w-full mt-8">
            Go to Dashboard
          </Button>
        </div>
      )}

      {status === 'failed' && (
        <div className="text-center space-y-4 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground">
            Your payment could not be verified. Please try again.
          </p>
          <div className="space-y-3 mt-8 w-full">
            <Button onClick={() => navigate('/fund-wallet')} size="xl" variant="gradient" className="w-full">
              Try Again
            </Button>
            <Button onClick={() => navigate('/dashboard')} size="xl" variant="ghost" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerify;
