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
    </div>
  );
};
