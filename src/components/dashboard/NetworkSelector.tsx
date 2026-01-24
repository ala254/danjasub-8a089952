import React from 'react';
import { cn } from '@/lib/utils';

export interface Network {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export const networks: Network[] = [
  { id: 'mtn', name: 'MTN', logo: '🟡', color: 'bg-yellow-400' },
  { id: 'airtel', name: 'Airtel', logo: '🔴', color: 'bg-red-500' },
  { id: 'glo', name: 'Glo', logo: '🟢', color: 'bg-green-500' },
  { id: '9mobile', name: '9mobile', logo: '🟢', color: 'bg-green-600' },
];

interface NetworkSelectorProps {
  selectedNetwork: string | null;
  onSelect: (networkId: string) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {networks.map((network) => (
        <button
          key={network.id}
          onClick={() => onSelect(network.id)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
            selectedNetwork === network.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xl",
            network.color
          )}>
            {network.id === 'mtn' && 'M'}
            {network.id === 'airtel' && 'A'}
            {network.id === 'glo' && 'G'}
            {network.id === '9mobile' && '9'}
          </div>
          <span className={cn(
            "text-xs font-semibold",
            selectedNetwork === network.id ? "text-primary" : "text-foreground"
          )}>
            {network.name}
          </span>
        </button>
      ))}
    </div>
  );
};
