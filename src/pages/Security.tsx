import React, { useState } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PinKeypad } from '@/components/auth/PinKeypad';

type Tab = 'passcode' | 'pin';
type PcStage = 'verify' | 'new' | 'confirm';

const Security: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('passcode');

  // Login passcode state
  const [pcStage, setPcStage] = useState<PcStage>('verify');
  const [currentPc, setCurrentPc] = useState('');
  const [newPc, setNewPc] = useState('');
  const [confirmPc, setConfirmPc] = useState('');
  const [pcError, setPcError] = useState<string | null>(null);
  const [pcSaving, setPcSaving] = useState(false);

  // Wallet/transaction PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // ---- Passcode change ----
  const handleVerifyCurrent = async (code: string) => {
    setPcSaving(true);
    setPcError(null);
    const { data, error } = await supabase.rpc('verify_user_passcode', { _passcode: code });
    setPcSaving(false);
    if (error) { setPcError(error.message); setCurrentPc(''); return; }
    const r = data as { ok: boolean; reason?: string; attempts_left?: number };
    if (r.ok) { setPcStage('new'); setCurrentPc(''); return; }
    if (r.reason === 'locked') { setPcError('Too many attempts. Locked 15 min.'); setCurrentPc(''); return; }
    setPcError(`Wrong passcode. ${r.attempts_left ?? 0} tries left`);
    setCurrentPc('');
  };

  const handleNewEntered = (val: string) => {
    setNewPc(val);
    setPcStage('confirm');
    setConfirmPc('');
    setPcError(null);
  };

  const handleConfirmEntered = async (val: string) => {
    if (val !== newPc) {
      setPcError('Passcodes do not match');
      setConfirmPc('');
      return;
    }
    setPcSaving(true);
    const { error } = await supabase.rpc('set_user_passcode', { _passcode: val });
    setPcSaving(false);
    if (error) { setPcError(error.message); return; }
    toast.success('Passcode updated');
    setPcStage('verify');
    setNewPc(''); setConfirmPc('');
  };

  // ---- Wallet PIN ----
  const handleSetPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { toast.error('PIN must be exactly 4 digits'); return; }
    if (pin !== confirmPin) { toast.error('PINs do not match'); return; }
    if (!user) return;
    setSavingPin(true);
    try {
      const { error } = await supabase.from('wallets').update({ pin_hash: pin }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Transaction PIN updated');
      setPin(''); setConfirmPin('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update PIN');
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-6 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-primary-foreground">Security</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('passcode')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'passcode' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <ShieldCheck className="w-4 h-4 inline mr-1.5" />Login Passcode
          </button>
          <button onClick={() => setTab('pin')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'pin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <KeyRound className="w-4 h-4 inline mr-1.5" />Transaction PIN
          </button>
        </div>

        {tab === 'passcode' && (
          <div className="bg-card rounded-2xl p-5 shadow-card">
            {pcStage === 'verify' && (
              <PinKeypad
                value={currentPc}
                onChange={(v) => { setPcError(null); setCurrentPc(v); }}
                onComplete={handleVerifyCurrent}
                label="Enter current passcode"
                error={pcError}
                disabled={pcSaving}
              />
            )}
            {pcStage === 'new' && (
              <PinKeypad
                value={newPc}
                onChange={(v) => { setPcError(null); setNewPc(v); }}
                onComplete={handleNewEntered}
                label="Enter new 6-digit passcode"
                error={pcError}
                disabled={pcSaving}
              />
            )}
            {pcStage === 'confirm' && (
              <PinKeypad
                value={confirmPc}
                onChange={(v) => { setPcError(null); setConfirmPc(v); }}
                onComplete={handleConfirmEntered}
                label="Confirm new passcode"
                error={pcError}
                disabled={pcSaving}
              />
            )}
          </div>
        )}

        {tab === 'pin' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New 4-Digit PIN</label>
              <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm PIN</label>
              <Input type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
            </div>
            <Button onClick={handleSetPin} disabled={savingPin} className="w-full">
              {savingPin ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Set Transaction PIN
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Security;
