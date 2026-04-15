import React, { useState } from 'react';
import { ArrowLeft, Lock, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Security: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<'password' | 'pin'>('password');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { toast.error('PIN must be exactly 4 digits'); return; }
    if (pin !== confirmPin) { toast.error('PINs do not match'); return; }
    if (!user) return;
    setSavingPin(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ pin_hash: pin })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Transaction PIN updated');
      setPin('');
      setConfirmPin('');
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
          <button onClick={() => setTab('password')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'password' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Lock className="w-4 h-4 inline mr-1.5" />Password
          </button>
          <button onClick={() => setTab('pin')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'pin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <KeyRound className="w-4 h-4 inline mr-1.5" />Transaction PIN
          </button>
        </div>

        {tab === 'password' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword} className="w-full">
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
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
