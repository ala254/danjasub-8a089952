import React from 'react';
import { Smartphone, Wifi, Zap, Tv, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const actions: QuickAction[] = [
  { id: 'airtime', icon: Smartphone, label: 'Airtime', color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'data', icon: Wifi, label: 'Data', color: 'text-info', bgColor: 'bg-info/10' },
  { id: 'electricity', icon: Zap, label: 'Electricity', color: 'text-accent', bgColor: 'bg-accent/10' },
  { id: 'tv', icon: Tv, label: 'TV Sub', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  { id: 'more', icon: MoreHorizontal, label: 'More', color: 'text-muted-foreground', bgColor: 'bg-muted' },
];

interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1 uppercase tracking-wider">
        Quick Actions
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 active:scale-95"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                <Icon className={cn("w-5 h-5", action.color)} />
              </div>
              <span className="text-[11px] font-medium text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
