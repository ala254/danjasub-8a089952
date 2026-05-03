import React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinKeypadProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  /** Fires when value reaches `length` characters */
  onComplete?: (value: string) => void;
  label?: string;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Secure numeric keypad with masked dots.
 * Designed for mobile fintech apps (Kuda / Opay style).
 */
export const PinKeypad: React.FC<PinKeypadProps> = ({
  value,
  onChange,
  length = 6,
  onComplete,
  label,
  error,
  disabled,
}) => {
  const press = (digit: string) => {
    if (disabled) return;
    if (value.length >= length) return;
    const next = value + digit;
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const back = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="flex flex-col items-center w-full select-none">
      {label && (
        <p className="text-sm font-medium text-muted-foreground mb-4">{label}</p>
      )}

      {/* Dots */}
      <div className="flex gap-3 mb-2">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={cn(
                'w-3.5 h-3.5 rounded-full transition-all duration-150',
                filled
                  ? error
                    ? 'bg-destructive scale-110'
                    : 'bg-primary scale-110'
                  : 'bg-muted',
              )}
            />
          );
        })}
      </div>

      <div className="h-5 mb-4">
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {keys.map((k, idx) => {
          if (k === '') return <div key={idx} />;
          if (k === 'back') {
            return (
              <button
                key={idx}
                type="button"
                onClick={back}
                disabled={disabled}
                className="h-16 rounded-2xl flex items-center justify-center text-foreground active:bg-muted transition-colors disabled:opacity-40"
                aria-label="Backspace"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => press(k)}
              disabled={disabled}
              className="h-16 rounded-2xl bg-muted/60 hover:bg-muted active:bg-muted active:scale-95 text-2xl font-display font-semibold text-foreground transition-all disabled:opacity-40"
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
};
