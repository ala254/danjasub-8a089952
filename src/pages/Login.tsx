import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PinKeypad } from '@/components/auth/PinKeypad';

type AuthMode = 'login' | 'register';
type Step = 'identity' | 'otp' | 'set-passcode' | 'enter-passcode';

const PASSCODE_LEN = 6;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { sendEmailOtp, verifyEmailOtp } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<Step>('identity');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // ---- Step 1: send OTP -----------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) { toast.error('Please enter a valid email'); return; }
    if (mode === 'register' && !name.trim()) { toast.error('Please enter your name'); return; }

    setLoading(true);
    const { error } = await sendEmailOtp(email.trim().toLowerCase(), {
      fullName: name.trim() || undefined,
      phone: phone.trim() || undefined,
      shouldCreateUser: mode === 'register',
    });
    setLoading(false);

    if (error) {
      if (mode === 'login' && error.message.toLowerCase().includes('signups not allowed')) {
        toast.error('No account found for this email. Sign up first.');
      } else {
        toast.error(error.message);
      }
      return;
    }
    setStep('otp');
    setOtp('');
    toast.success('We sent a 6-digit code to your email');
  };

  // ---- Step 2: verify OTP ---------------------------------------------------
  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setError(null);
    const { error } = await verifyEmailOtp(email.trim().toLowerCase(), code);
    if (error) {
      setLoading(false);
      setError('Invalid or expired code');
      setOtp('');
      return;
    }

    // Has the user already set a passcode?
    const { data: hasPc } = await supabase.rpc('has_passcode');
    setLoading(false);

    if (hasPc) {
      setStep('enter-passcode');
      setPasscode('');
    } else {
      setStep('set-passcode');
      setStage('enter');
      setPasscode('');
      setConfirmPasscode('');
    }
  };

  // ---- Step 3a: create new passcode ----------------------------------------
  const handlePasscodeEntered = (val: string) => {
    if (stage === 'enter') {
      setStage('confirm');
      setConfirmPasscode('');
      return;
    }
    // confirm stage
    if (val !== passcode) {
      setError('Passcodes do not match');
      setConfirmPasscode('');
      return;
    }
    savePasscode(val);
  };

  const savePasscode = async (code: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc('set_user_passcode', { _passcode: code });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    sessionStorage.setItem('passcode_unlocked', '1');
    toast.success(mode === 'register' ? 'Account created!' : 'Passcode set');
    navigate('/dashboard');
  };

  // ---- Step 3b: enter existing passcode ------------------------------------
  const handlePasscodeVerified = async (code: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('verify_user_passcode', { _passcode: code });
    setLoading(false);
    if (error) { setError(error.message); setPasscode(''); return; }
    const result = data as { ok: boolean; reason?: string; attempts_left?: number };
    if (result.ok) {
      sessionStorage.setItem('passcode_unlocked', '1');
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else if (result.reason === 'locked') {
      setError('Too many attempts. Locked for 15 minutes.');
      setPasscode('');
    } else if (result.reason === 'no_passcode') {
      setStep('set-passcode');
      setStage('enter');
      setPasscode('');
    } else {
      setError(`Wrong passcode. ${result.attempts_left ?? 0} tries left`);
      setPasscode('');
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'otp') { setStep('identity'); return; }
    if (step === 'set-passcode' && stage === 'confirm') { setStage('enter'); setPasscode(''); return; }
    if (step === 'enter-passcode' || step === 'set-passcode') { setStep('identity'); return; }
  };

  const headerTitle = () => {
    if (step === 'identity') return mode === 'login' ? 'Welcome Back' : 'Create Account';
    if (step === 'otp') return 'Verify Email';
    if (step === 'set-passcode') return stage === 'enter' ? 'Create Passcode' : 'Confirm Passcode';
    return 'Enter Passcode';
  };

  const headerSubtitle = () => {
    if (step === 'identity') return mode === 'login' ? 'Sign in with email + passcode' : 'Join thousands on Danjasub';
    if (step === 'otp') return `We sent a 6-digit code to ${email}`;
    if (step === 'set-passcode') return stage === 'enter'
      ? 'Choose a 6-digit passcode for fast login'
      : 'Re-enter to confirm';
    return `Sign in as ${email}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <header className="gradient-hero px-6 pt-12 pb-16 text-primary-foreground safe-area-top rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-8 -right-8 w-32 h-32 bg-primary-foreground/5 rounded-full blur-xl" />
        <div className="absolute bottom-4 -left-6 w-24 h-24 bg-primary-foreground/5 rounded-full blur-xl" />
        <div className="relative z-10">
          {step !== 'identity' && (
            <button onClick={goBack} className="mb-3 inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
          )}
          <p className="text-sm font-medium text-primary-foreground/60 mb-1 font-display tracking-wider uppercase">Danjasub</p>
          <h1 className="text-3xl font-display font-bold mb-2">{headerTitle()}</h1>
          <p className="text-primary-foreground/70 text-sm">{headerSubtitle()}</p>
        </div>
      </header>

      <main className="flex-1 px-6 -mt-6">
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          {/* IDENTITY */}
          {step === 'identity' && (
            <>
              <div className="flex bg-muted rounded-xl p-1 mb-6">
                <button onClick={() => setMode('login')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all', mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>Sign In</button>
                <button onClick={() => setMode('register')} className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all', mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>Sign Up</button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="h-13" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="h-13" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-13" />
                </div>

                <Button type="submit" disabled={loading} className="w-full" size="xl" variant="gradient">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </form>
            </>
          )}

          {/* OTP */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
              </div>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(v);
                  setError(null);
                  if (v.length === 6) handleVerifyOtp(v);
                }}
                placeholder="••••••"
                className="h-14 text-center text-2xl font-display tracking-[0.5em]"
                autoFocus
              />
              {error && <p className="text-xs text-destructive font-medium text-center">{error}</p>}

              <Button
                type="button"
                onClick={() => otp.length === 6 && handleVerifyOtp(otp)}
                disabled={loading || otp.length !== 6}
                className="w-full"
                size="xl"
                variant="gradient"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
              </Button>

              <button
                type="button"
                onClick={(e) => handleSendOtp(e as unknown as React.FormEvent)}
                disabled={loading}
                className="w-full text-sm text-primary font-medium"
              >
                Resend code
              </button>
            </div>
          )}

          {/* SET PASSCODE */}
          {step === 'set-passcode' && (
            <PinKeypad
              value={stage === 'enter' ? passcode : confirmPasscode}
              onChange={(v) => {
                setError(null);
                if (stage === 'enter') setPasscode(v);
                else setConfirmPasscode(v);
              }}
              onComplete={handlePasscodeEntered}
              length={PASSCODE_LEN}
              label={stage === 'enter' ? 'Choose your 6-digit passcode' : 'Confirm passcode'}
              error={error}
              disabled={loading}
            />
          )}

          {/* ENTER PASSCODE */}
          {step === 'enter-passcode' && (
            <div className="space-y-4">
              <PinKeypad
                value={passcode}
                onChange={(v) => { setError(null); setPasscode(v); }}
                onComplete={handlePasscodeVerified}
                length={PASSCODE_LEN}
                label="Enter your 6-digit passcode"
                error={error}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => { setStep('otp'); setOtp(''); sendEmailOtp(email.trim().toLowerCase()); toast.success('New code sent'); }}
                className="w-full text-sm text-primary font-medium pt-2"
              >
                Forgot passcode? Verify by email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          By continuing, you agree to our{' '}
          <button className="text-primary font-medium">Terms</button> and{' '}
          <button className="text-primary font-medium">Privacy Policy</button>
        </p>
      </main>
    </div>
  );
};

export default Login;
