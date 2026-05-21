import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PinKeypad } from '@/components/auth/PinKeypad';
import { isValidEmail, isValidNgPhone, isValidFullName, normalizeNgPhone } from '@/lib/validation';
import logo from '@/assets/danjasub-logo.jpg';

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
  const [referral, setReferral] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [otp, setOtp] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);


  // Pre-fill remembered email on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('danjasub_email');
    if (saved) setEmail(saved);
  }, []);

  const validateIdentity = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address';
    if (mode === 'register') {
      if (!isValidFullName(name)) errs.name = 'Enter your full name (first and last)';
      if (!isValidNgPhone(phone)) errs.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
      if (!acceptedTerms) errs.terms = 'Please accept the Terms to continue';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Step 1: send OTP -----------------------------------------------------
  const sendOtpRequest = async (isResend = false) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: mode === 'register',
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: mode === 'register'
          ? { full_name: name.trim(), phone: phone ? normalizeNgPhone(phone) : undefined }
          : undefined,
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      console.error('[OTP send]', error);
      if (mode === 'login' && (msg.includes('signups not allowed') || msg.includes('not found'))) {
        toast.error('No account found. Switch to Sign Up to create one.');
      } else if (msg.includes('rate') || msg.includes('too many') || msg.includes('seconds')) {
        toast.error('Please wait a moment before requesting another code.');
      } else {
        toast.error(error.message);
      }
      return false;
    }

    if (rememberEmail) localStorage.setItem('danjasub_email', email.trim().toLowerCase());
    setOtp('');
    setResendIn(30);
    toast.success(isResend ? 'New code sent to your email' : 'We sent a 6-digit code to your email');
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIdentity()) return;
    const ok = await sendOtpRequest(false);
    if (ok) setStep('otp');
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    await sendOtpRequest(true);
  };

  // ---- Step 2: verify OTP ---------------------------------------------------
  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    const { error } = await verifyEmailOtp(email.trim().toLowerCase(), code);
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase();
      console.error('[OTP verify]', error);
      if (msg.includes('expired')) setError('Code expired. Tap Resend to get a new one.');
      else if (msg.includes('invalid')) setError('Incorrect code. Please check and try again.');
      else setError(error.message);
      setOtp('');
      return;
    }


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
    if (val !== passcode) {
      setError('Passcodes do not match. Try again.');
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
    if (error) { setError(error.message); return; }
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
    if (step === 'identity') return mode === 'login' ? 'Sign in to your Danjasub wallet' : 'Join thousands on Danjasub';
    if (step === 'otp') return `Code sent to ${email}`;
    if (step === 'set-passcode') return stage === 'enter'
      ? 'Choose a 6-digit passcode for fast login'
      : 'Re-enter to confirm';
    return `Signing in as ${email}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <header className="gradient-hero px-6 pt-12 pb-20 text-primary-foreground safe-area-top rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-8 -right-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          {step !== 'identity' ? (
            <button onClick={goBack} className="mb-4 inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
          ) : (
            <div className="flex items-center gap-3 mb-5 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground p-1.5 shadow-elevated overflow-hidden">
                <img src={logo} alt="Danjasub" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <p className="text-sm font-display font-bold tracking-wider">DANJASUB</p>
                <p className="text-[11px] text-primary-foreground/70">Fast. Reliable. Affordable.</p>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-display font-bold mb-2">{headerTitle()}</h1>
          <p className="text-primary-foreground/80 text-sm">{headerSubtitle()}</p>
        </div>
      </header>

      <main className="flex-1 px-5 -mt-10 pb-8">
        <div className="bg-card rounded-3xl shadow-elevated p-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {step === 'identity' && (
            <>
              <div className="flex bg-muted rounded-2xl p-1 mb-6">
                <button
                  onClick={() => { setMode('login'); setFieldErrors({}); }}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all', mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
                >Sign In</button>
                <button
                  onClick={() => { setMode('register'); setFieldErrors({}); }}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all', mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
                >Sign Up</button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                {mode === 'register' && (
                  <>
                    <Field label="Full Name" error={fieldErrors.name}>
                      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="h-12 rounded-xl" />
                    </Field>
                    <Field label="Phone Number" error={fieldErrors.phone} hint="Nigerian mobile e.g. 08012345678">
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 14))}
                        placeholder="08012345678"
                        className="h-12 rounded-xl"
                      />
                    </Field>
                  </>
                )}

                <Field label="Email Address" error={fieldErrors.email}>
                  <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl" />
                </Field>

                {mode === 'register' && (
                  <Field label="Referral Code (optional)">
                    <Input type="text" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase().slice(0, 12))} placeholder="DANJA123" className="h-12 rounded-xl" />
                  </Field>
                )}

                {mode === 'login' ? (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    Remember my email
                  </label>
                ) : (
                  <div className="space-y-1">
                    <label className="flex items-start gap-2 text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded accent-primary"
                      />
                      <span>
                        I agree to the{' '}
                        <span className="text-primary font-medium">Terms</span> &{' '}
                        <span className="text-primary font-medium">Privacy Policy</span>
                      </span>
                    </label>
                    {fieldErrors.terms && <p className="text-xs text-destructive font-medium pl-6">{fieldErrors.terms}</p>}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full" size="xl" variant="gradient">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'login' ? 'Continue' : 'Create Account'} <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Secured with email OTP & 6-digit passcode
                </div>
              </form>
            </>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(v);
                    setError(null);
                    if (v.length === 6) handleVerifyOtp(v);
                  }}
                  placeholder="••••••"
                  className="h-14 rounded-xl text-center text-2xl font-display tracking-[0.5em]"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive font-medium text-center mt-2">{error}</p>}
              </div>

              <Button
                type="button"
                onClick={() => otp.length === 6 && handleVerifyOtp(otp)}
                disabled={loading || otp.length !== 6}
                className="w-full"
                size="xl"
                variant="gradient"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Verify</>}
              </Button>

              <button
                type="button"
                onClick={(e) => handleSendOtp(e as unknown as React.FormEvent)}
                disabled={loading}
                className="w-full text-sm text-primary font-semibold hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          )}

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
                className="w-full text-sm text-primary font-semibold hover:underline pt-2"
              >
                Forgot passcode? Verify by email
              </button>
            </div>
          )}
        </div>

        {step === 'identity' && (
          <p className="text-center text-xs text-muted-foreground mt-5 px-4">
            By continuing you confirm you are 18+ and a Nigerian resident.
          </p>
        )}
      </main>
    </div>
  );
};

/** Inline labelled field with error/hint slot. */
const Field: React.FC<{
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, error, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground/80">{label}</label>
    {children}
    {error ? (
      <p className="text-xs text-destructive font-medium">{error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

export default Login;
