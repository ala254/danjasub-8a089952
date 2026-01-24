import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  quickAmounts?: number[];
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "Enter amount",
  className,
  error,
  quickAmounts = [100, 200, 500, 1000, 2000, 5000],
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    onChange(input);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-foreground">
          ₦
        </div>
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-12 h-16 text-2xl font-bold",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
      </div>
      
      {quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChange(amount.toString())}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                value === amount.toString()
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              ₦{amount.toLocaleString()}
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
