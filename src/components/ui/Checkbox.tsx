import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}) => {
  const checkboxId = id || React.useId();

  const handleToggle = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <div
      onClick={handleToggle}
      className={`flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="pt-0.5">
        <button
          type="button"
          role="checkbox"
          id={checkboxId}
          aria-checked={checked}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleToggle();
            }
          }}
          style={{ touchAction: 'manipulation' }}
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${
            checked
              ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-[0_0_8px_rgba(224,160,48,0.3)]'
              : 'bg-stone-900 border-stone-700 text-transparent hover:border-stone-500'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${checked ? 'scale-100' : 'scale-0'}`} />
        </button>
      </div>

      {(label || description) && (
        <div className="min-w-0 flex-1 leading-snug">
          {label && (
            <label htmlFor={checkboxId} className="block text-sm font-medium text-stone-200 cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
