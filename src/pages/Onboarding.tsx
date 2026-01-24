import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Smartphone, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: Smartphone,
    title: 'Buy Airtime & Data',
    description: 'Top up your phone or buy data bundles for all Nigerian networks instantly.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Pay Bills Easily',
    description: 'Pay for electricity, TV subscriptions, and more with just a few taps.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your transactions are protected with bank-grade security and PIN verification.',
    color: 'bg-blue-100 text-blue-600',
  },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Skip Button */}
      <header className="p-4 flex justify-end safe-area-top">
        <button
          onClick={handleSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className={cn(
          "w-32 h-32 rounded-3xl flex items-center justify-center mb-8 animate-scale-in",
          slide.color
        )}>
          <Icon className="w-16 h-16" />
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-foreground mb-4 animate-slide-up">
          {slide.title}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {slide.description}
        </p>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </main>

      {/* Bottom Button */}
      <footer className="p-6 safe-area-bottom">
        <Button
          onClick={handleNext}
          className="w-full"
          size="xl"
          variant="gradient"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </footer>
    </div>
  );
};

export default Onboarding;
