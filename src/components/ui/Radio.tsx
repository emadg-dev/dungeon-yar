import React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  value: string;
  onChange: (val: string) => void;
  options: RadioOption[];
  name?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  name,
  className = '',
}) => {
  const groupName = name || React.useId();

  return (
    <div role="radiogroup" className={`space-y-2 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isDisabled = opt.disabled;

        return (
          <div
            key={opt.value}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all select-none ${
              isSelected
                ? 'bg-amber-500/10 border-amber-500/50 text-stone-100'
                : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-stone-700'
            } ${isDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}
          >
            <div className="pt-0.5">
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{opt.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
