import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Smartphone, Shield, Zap, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: Smartphone,
    title: 'Instant Airtime\n& Data Top-up',
    description: 'Recharge all Nigerian networks — MTN, Airtel, Glo, 9mobile — in seconds.',
    gradient: 'from-primary to-primary/80',
    iconBg: 'bg-primary/15 text-primary',
  },
  {
    icon: Zap,
    title: 'Pay Bills\nSeamlessly',
    description: 'Electricity, DStv, GOtv, Startimes — all your bills in one place.',
    gradient: 'from-accent to-accent/80',
    iconBg: 'bg-accent/15 text-accent',
  },
  {
    icon: Wallet,
    title: 'Secure Digital\nWallet',
    description: 'Fund your wallet and transact with confidence. Every naira accounted for.',
    gradient: 'from-secondary to-secondary/80',
    iconBg: 'bg-secondary/15 text-secondary',
  },
  {
    icon: Shield,
    title: 'Bank-Grade\nSecurity',
    description: 'PIN verification, encrypted transactions, and instant confirmations.',
    gradient: 'from-success to-success/80',
    iconBg: 'bg-success/15 text-success',
  },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  if (showSplash) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center max-w-md mx-auto relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-10 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
        <div className="absolute bottom-32 -right-10 w-56 h-56 bg-primary-foreground/5 rounded-full blur-3xl" />
        
        <div className="animate-scale-in text-center z-10">
          <div className="w-24 h-24 rounded-3xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-4xl font-display font-bold text-primary-foreground">D</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-2">
            Danjasub
          </h1>
          <p className="text-primary-foreground/70 text-sm font-medium tracking-wider uppercase">
            Fast, Reliable VTU Services
          </p>
        </div>
        
        <div className="absolute bottom-12 flex gap-1">
          <div className="w-2 h-2 bg-primary-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-primary-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-primary-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Skip */}
      <header className="p-4 flex justify-between items-center safe-area-top">
        <span className="text-sm font-display font-semibold text-primary">Danjasub</span>
        <button
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
        >
          Skip
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center" key={currentSlide}>
        <div className={cn("w-28 h-28 rounded-3xl flex items-center justify-center mb-10 animate-scale-in", slide.iconBg)}>
          <Icon className="w-14 h-14" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight whitespace-pre-line animate-slide-up">
          {slide.title}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-[280px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {slide.description}
        </p>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
      </main>

      {/* Bottom */}
      <footer className="p-6 safe-area-bottom">
        <Button onClick={handleNext} className="w-full" size="xl" variant="gradient">
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </footer>
    </div>
  );
};

export default Onboarding;
