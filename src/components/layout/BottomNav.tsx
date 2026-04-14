import React from 'react';
import { Home, Receipt, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Receipt, label: 'History', path: '/history' },
  { icon: Wallet, label: 'Wallet', path: '/fund-wallet' },
  { icon: User, label: 'Profile', path: '/profile' },
];

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-all duration-200", isActive && "bg-primary/10")}>
                <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
              </div>
              <span className={cn("text-[10px] font-medium mt-0.5", isActive && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
