import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PinKeypad } from '@/components/auth/PinKeypad';
import { isValidEmail, isValidNgPhone, isValidFullName, normalizeNgPhone } from '@/lib/validation';
import logo from '@/assets/danjasub-logo.jpg';

/**
 * TEMPORARY: OTP email verification is disabled for development.
 * Auth uses email + password directly. The 6-digit passcode is kept
 * as an in-app lock (set on first login, required on subsequent logins).
 *
 * To re-enable OTP later: restore the `otp` step from git history and
 * swap signUp/signInWithPassword back to signInWithOtp/verifyOtp.
 */

type AuthMode = 'login' | 'register';
type Step = 'identity' | 'set-passcode' | 'enter-passcode';

const PASSCODE_LEN = 6;

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<Step>('identity');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referral, setReferral] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);

  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('danjasub_email');
    if (saved) setEmail(saved);
  }, []);

  const validateIdentity = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (mode === 'register') {
      if (!isValidFullName(name)) errs.name = 'Enter your full name (first and last)';
      if (!isValidNgPhone(phone)) errs.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
      if (!acceptedTerms) errs.terms = 'Please accept the Terms to continue';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const afterAuthSuccess = async () => {
    if (rememberEmail) localStorage.setItem('danjasub_email', email.trim().toLowerCase());
    const { data: hasPc } = await supabase.rpc('has_passcode');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIdentity()) return;
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: name.trim(),
            phone: normalizeNgPhone(phone),
            referral: referral || null,
          },
        },
      });
      if (error) {
        setLoading(false);
        const msg = error.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          toast.error('Email already registered. Switch to Sign In.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      // If email confirmation is disabled, session is returned immediately.
      if (!data.session) {
        // Fallback: sign in directly to establish session.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInErr) {
          setLoading(false);
          toast.error(signInErr.message);
          return;
        }
      }
      toast.success('Account created!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        setLoading(false);
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
          toast.error('Wrong email or password.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Welcome back!');
    }

    await afterAuthSuccess();
    setLoading(false);
  };

  // ---- passcode (in-app lock) ----------------------------------------------
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
    toast.success('Passcode set');
    navigate('/dashboard');
  };

  const handlePasscodeVerified = async (code: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('verify_user_passcode', { _passcode: code });
    setLoading(false);
    if (error) { setError(error.message); setPasscode(''); return; }
    const result = data as { ok: boolean; reason?: string; attempts_left?: number };
    if (result.ok) {
      sessionStorage.setItem('passcode_unlocked', '1');
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
    if (step === 'set-passcode' && stage === 'confirm') { setStage('enter'); setPasscode(''); return; }
    supabase.auth.signOut();
    setStep('identity');
  };

  const headerTitle = () => {
    if (step === 'identity') return mode === 'login' ? 'Welcome Back' : 'Create Account';
    if (step === 'set-passcode') return stage === 'enter' ? 'Create Passcode' : 'Confirm Passcode';
    return 'Enter Passcode';
  };

  const headerSubtitle = () => {
    if (step === 'identity') return mode === 'login' ? 'Sign in to your Danjasub wallet' : 'Join thousands on Danjasub';
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

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

                <Field label="Password" error={fieldErrors.password} hint={mode === 'register' ? 'At least 6 characters' : undefined}>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-xl pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Secured with password & 6-digit passcode
                </div>
              </form>
            </>
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
            <PinKeypad
              value={passcode}
              onChange={(v) => { setError(null); setPasscode(v); }}
              onComplete={handlePasscodeVerified}
              length={PASSCODE_LEN}
              label="Enter your 6-digit passcode"
              error={error}
              disabled={loading}
            />
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
