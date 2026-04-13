import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, name, phone);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! Please check your email to verify your account.');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="gradient-primary px-6 pt-12 pb-16 text-primary-foreground safe-area-top rounded-b-[2rem]">
        <h1 className="text-3xl font-bold mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-primary-foreground/80">
          {mode === 'login'
            ? 'Sign in to continue to QuickPay'
            : 'Join thousands of Nigerians on QuickPay'
          }
        </p>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 -mt-6">
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          {/* Mode Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'login'
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'register'
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div className="space-y-2 animate-slide-up">
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-14"
                  />
                </div>
                <div className="space-y-2 animate-slide-up">
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="h-14"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-14"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-14 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </button>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="xl"
              variant="gradient"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Please wait...
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-muted-foreground mt-6 px-4">
          By continuing, you agree to our{' '}
          <button className="text-primary font-medium">Terms of Service</button>
          {' '}and{' '}
          <button className="text-primary font-medium">Privacy Policy</button>
        </p>
      </main>
    </div>
  );
};

export default Login;
