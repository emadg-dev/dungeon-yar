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
                ? 'bg-primary/10 border-primary/50 text-text-primary'
                : 'bg-surface-2/50 border-border text-text-muted hover:border-border-strong'
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
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{opt.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
