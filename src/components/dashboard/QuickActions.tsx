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
  { 
    id: 'airtime', 
    icon: Smartphone, 
    label: 'Airtime', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  { 
    id: 'data', 
    icon: Wifi, 
    label: 'Data', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  { 
    id: 'electricity', 
    icon: Zap, 
    label: 'Electricity', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  },
  { 
    id: 'tv', 
    icon: Tv, 
    label: 'TV Sub', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  { 
    id: 'more', 
    icon: MoreHorizontal, 
    label: 'More', 
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
];

interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">
        Quick Actions
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted transition-all duration-200 active:scale-95"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                action.bgColor
              )}>
                <Icon className={cn("w-5 h-5", action.color)} />
              </div>
              <span className="text-xs font-medium text-foreground">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
