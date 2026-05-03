import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PinKeypad } from '@/components/auth/PinKeypad';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const PUBLIC_PATHS = ['/', '/login'];

/**
 * Wraps the app and gates access behind:
 * 1. A signed-in Supabase session
 * 2. A valid passcode unlock for this browser session
 *
 * Existing legacy users with no passcode are sent to /login to set one
 * (after fresh OTP verification).
 */
export const PasscodeGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  const [unlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem('passcode_unlocked') === '1',
  );
  const [hasPasscode, setHasPasscode] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Check passcode existence whenever user changes
  useEffect(() => {
    if (!user) { setHasPasscode(null); return; }
    if (sessionStorage.getItem('passcode_unlocked') === '1') {
      setUnlocked(true);
      return;
    }
    supabase.rpc('has_passcode').then(({ data }) => {
      setHasPasscode(!!data);
    });
  }, [user]);

  // Redirect legacy users (no passcode) to login flow to set one via OTP
  useEffect(() => {
    if (!user || isPublic || loading || unlocked) return;
    if (hasPasscode === false) {
      navigate('/login', { replace: true });
    }
  }, [user, hasPasscode, loading, isPublic, unlocked, navigate]);

  const verify = async (val: string) => {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc('verify_user_passcode', { _passcode: val });
    setBusy(false);
    if (error) { setError(error.message); setCode(''); return; }
    const r = data as { ok: boolean; reason?: string; attempts_left?: number };
    if (r.ok) {
      sessionStorage.setItem('passcode_unlocked', '1');
      setUnlocked(true);
    } else if (r.reason === 'locked') {
      setError('Locked for 15 minutes due to wrong attempts');
      setCode('');
    } else {
      setError(`Wrong passcode. ${r.attempts_left ?? 0} tries left`);
      setCode('');
    }
  };

  const lockOut = async () => {
    sessionStorage.removeItem('passcode_unlocked');
    await supabase.auth.signOut();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Public routes always render
  if (isPublic) return <>{children}</>;

  // Not signed in -> let routes handle (or redirect)
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Signed in but no passcode yet -> redirect handled in effect, render loader
  if (hasPasscode === null || hasPasscode === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <header className="gradient-hero px-6 pt-12 pb-12 text-primary-foreground safe-area-top rounded-b-[2.5rem]">
        <p className="text-sm font-medium text-primary-foreground/60 mb-1 font-display tracking-wider uppercase">Danjasub</p>
        <h1 className="text-2xl font-display font-bold mb-1">Welcome back</h1>
        <p className="text-primary-foreground/70 text-sm truncate">{user.email}</p>
      </header>

      <main className="flex-1 px-6 -mt-6">
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          <PinKeypad
            value={code}
            onChange={(v) => { setError(null); setCode(v); }}
            onComplete={verify}
            label="Enter your 6-digit passcode"
            error={error}
            disabled={busy}
          />
          <Button variant="ghost" onClick={lockOut} className="w-full mt-4 text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </main>
    </div>
  );
};
