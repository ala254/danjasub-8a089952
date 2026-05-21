import React from 'react';
import { ArrowLeft, Smartphone, Zap, Shield, CreditCard, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DeveloperInfo } from '@/components/developer/DeveloperInfo';

const features = [
  { icon: Zap, title: 'Fast Transactions', description: 'Instant airtime and data delivery across all networks' },
  { icon: Shield, title: 'Secure & Reliable', description: 'Bank-grade security for all your payments and data' },
  { icon: CreditCard, title: 'Easy Payments', description: 'Multiple funding options including cards and transfers' },
  { icon: Globe, title: 'All Networks', description: 'MTN, Airtel, Glo, and 9mobile supported nationwide' },
  { icon: Smartphone, title: 'Mobile First', description: 'Designed for the way Nigerians use their phones daily' },
];

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <header className="gradient-hero px-4 pt-4 pb-6 safe-area-top rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-primary-foreground">About Danjasub</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Brand Hero */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-3xl font-display font-bold text-white">D</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Danjasub</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Version 1.0.0</p>
          </div>
          <p className="text-xs font-medium text-primary tracking-wide uppercase">Fast. Reliable. Affordable.</p>
        </div>

        {/* About Text */}
        <div className="bg-card rounded-2xl shadow-card p-5">
          <p className="text-sm text-foreground leading-relaxed text-center">
            Danjasub is a fast, reliable and affordable VTU platform designed to make data subscriptions, airtime purchases, bill payments and digital services easy for everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="font-display font-bold text-sm text-foreground mb-3 px-1">Why Choose Danjasub</h3>
          <div className="grid grid-cols-1 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 bg-card rounded-2xl shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Developer Info */}
        <DeveloperInfo />

        {/* Footer credit */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Developed by <span className="font-semibold text-primary">Alamin Kabir</span>
        </p>
      </div>
    </MobileLayout>
  );
};

export default About;
