import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, CheckCircle2, User as UserIcon, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PinKeypad } from '@/components/auth/PinKeypad';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'form' | 'pin' | 'success';

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

const Transfer: React.FC = () => {
  const navigate = useNavigate();
  const { balance, refetch } = useWallet();

  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [lookup, setLookup] = useState<{ loading: boolean; name?: string; error?: string }>({
    loading: false,
  });
  const lookupTimer = useRef<number | null>(null);

  // Debounced recipient lookup
  useEffect(() => {
    if (lookupTimer.current) window.clearTimeout(lookupTimer.current);
    setLookup({ loading: false });
    const q = recipient.trim();
    if (q.length < 3) return;
    lookupTimer.current = window.setTimeout(async () => {
      setLookup({ loading: true });
      const { data, error } = await supabase.rpc('lookup_recipient', { _query: q });
      if (error) {
        setLookup({ loading: false, error: 'Lookup failed' });
        return;
      }
      const res = data as { found: boolean; name?: string; reason?: string };
      if (res?.found) setLookup({ loading: false, name: res.name });
      else setLookup({ loading: false, error: res?.reason === 'self' ? 'You cannot transfer to yourself' : 'No Danjasub user found' });
    }, 450);
    return () => {
      if (lookupTimer.current) window.clearTimeout(lookupTimer.current);
    };
  }, [recipient]);

  const amountNum = Number(amount) || 0;
  const canProceed =
    recipient.trim().length >= 3 &&
    lookup.name &&
    amountNum >= 50 &&
    amountNum <= balance;

  const handleProceed = () => {
    if (!recipient.trim()) return toast.error('Enter recipient');
    if (!lookup.name) return toast.error('Recipient not verified');
    if (amountNum < 50) return toast.error('Minimum transfer is ₦50');
    if (amountNum > balance) return toast.error('Insufficient balance');
    setStep('pin');
  };

  const handleConfirm = async (passcode: string) => {
    if (submitting) return;
    setSubmitting(true);
    setPinError(null);
    try {
      const { data, error } = await supabase.rpc('transfer_wallet', {
        _recipient: recipient.trim(),
        _amount: amountNum,
        _passcode: passcode,
        _narration: narration.trim() || null,
      });
      if (error) {
        const msg = error.message.replace(/^.*: /, '');
        setPinError(msg);
        setPin('');
        toast.error(msg);
        return;
      }
      const res = data as { ok: boolean };
      if (!res?.ok) {
        setPinError('Transfer failed');
        setPin('');
        return;
      }
      await refetch();
      setStep('success');
    } catch (e) {
      setPinError('Network error');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      <header className="px-4 pt-4 pb-3 safe-area-top flex items-center gap-3">
        <button
          onClick={() => (step === 'form' ? navigate(-1) : setStep('form'))}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Transfer</h1>
          <p className="text-xs text-muted-foreground">Send to another Danjasub user</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Balance pill */}
        <div className="gradient-hero rounded-2xl p-4 text-primary-foreground shadow-elevated animate-scale-in">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Available</p>
          <p className="text-2xl font-display font-bold">{formatNaira(balance)}</p>
        </div>

        {step === 'form' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Recipient
              </label>
              <div className="relative">
                <Input
                  placeholder="Phone, email or full name"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-12 pr-10 rounded-xl"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {lookup.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
              </div>
              {lookup.name && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{lookup.name}</p>
                    <p className="text-[11px] text-muted-foreground">Verified Danjasub user</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              )}
              {lookup.error && recipient.trim().length >= 3 && !lookup.loading && (
                <p className="mt-2 text-xs text-destructive font-medium">{lookup.error}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-display font-bold">₦</span>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  className="h-14 pl-9 rounded-xl text-xl font-display font-bold"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Minimum ₦50</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Narration <span className="text-muted-foreground/60 normal-case">(optional)</span>
              </label>
              <Input
                placeholder="What's it for?"
                value={narration}
                onChange={(e) => setNarration(e.target.value.slice(0, 80))}
                className="h-12 rounded-xl"
              />
            </div>

            <Button
              onClick={handleProceed}
              disabled={!canProceed}
              variant="gradient"
              size="lg"
              className="w-full mt-2"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Continue
            </Button>
          </div>
        )}

        {step === 'pin' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sending</p>
              <p className="text-3xl font-display font-bold text-foreground mt-1">{formatNaira(amountNum)}</p>
              <p className="text-sm text-muted-foreground mt-1">to <span className="font-semibold text-foreground">{lookup.name}</span></p>
            </div>
            <PinKeypad
              value={pin}
              onChange={(v) => { setPin(v); if (pinError) setPinError(null); }}
              onComplete={handleConfirm}
              label="Enter your 6-digit passcode"
              error={pinError}
              disabled={submitting}
            />
            {submitting && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing transfer…
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-10 animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5 animate-pulse">
              <CheckCircle2 className="w-14 h-14 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">Transfer Successful</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {formatNaira(amountNum)} sent to {lookup.name}
            </p>
            <div className="flex gap-3 mt-8 w-full">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setStep('form');
                  setRecipient('');
                  setAmount('');
                  setNarration('');
                  setPin('');
                  setLookup({ loading: false });
                }}
              >
                New Transfer
              </Button>
              <Button
                variant="gradient"
                size="lg"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Transfer;
