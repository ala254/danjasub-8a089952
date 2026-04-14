import React from 'react';
import { cn } from '@/lib/utils';

export interface Network {
  id: string;
  name: string;
  letter: string;
  color: string;
  textColor: string;
}

export const networks: Network[] = [
  { id: 'mtn', name: 'MTN', letter: 'M', color: 'bg-yellow-400', textColor: 'text-yellow-900' },
  { id: 'airtel', name: 'Airtel', letter: 'A', color: 'bg-red-500', textColor: 'text-white' },
  { id: 'glo', name: 'Glo', letter: 'G', color: 'bg-green-500', textColor: 'text-white' },
  { id: '9mobile', name: '9mobile', letter: '9', color: 'bg-emerald-600', textColor: 'text-white' },
];

interface NetworkSelectorProps {
  selectedNetwork: string | null;
  onSelect: (networkId: string) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ selectedNetwork, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {networks.map((network) => (
        <button
          key={network.id}
          onClick={() => onSelect(network.id)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
            selectedNetwork === network.id
              ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", network.color, network.textColor)}>
            {network.letter}
          </div>
          <span className={cn("text-xs font-semibold", selectedNetwork === network.id ? "text-primary" : "text-foreground")}>
            {network.name}
          </span>
        </button>
      ))}
    </div>
  );
};
