import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className,
  hideNav = false 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-background flex flex-col max-w-md mx-auto relative",
      className
    )}>
      <main className={cn(
        "flex-1 overflow-y-auto",
        !hideNav && "pb-20"
      )}>
        {children}
      </main>

      {/* App Footer */}
      <footer className="py-3 px-4 text-center border-t border-border/30">
        <p className="text-[10px] text-muted-foreground/50">
          Developed by <span className="font-semibold text-primary/70">Alamin Kabir</span>
        </p>
      </footer>
    </div>
  );
};
