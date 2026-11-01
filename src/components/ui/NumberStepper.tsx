import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  disabled = false,
  className = '',
}) => {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const handleDecrement = () => {
    if (canDecrement) onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (canIncrement) onChange(Math.min(max, value + step));
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <span className="block text-xs font-semibold text-stone-300">{label}</span>}
      <div className="flex items-center gap-1.5 bg-stone-900/80 border border-stone-800 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          aria-label="کاهش مقدار"
          style={{ touchAction: 'manipulation' }}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span
          dir="ltr"
          className="min-w-[48px] px-2 text-center font-mono font-bold text-base text-stone-100 select-all tabular-nums"
          style={{ unicodeBidi: 'isolate' }}
        >
          {value}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          aria-label="افزایش مقدار"
          style={{ touchAction: 'manipulation' }}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
