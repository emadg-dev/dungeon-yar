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
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
            checked
              ? 'bg-primary border-primary text-on-accent shadow-[0_0_8px_rgb(var(--color-primary-rgb)/0.3)]'
              : 'bg-surface-2 border-border text-transparent hover:border-border-strong'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${checked ? 'scale-100' : 'scale-0'}`} />
        </button>
      </div>

      {(label || description) && (
        <div className="min-w-0 flex-1 leading-snug">
          {label && (
            <label htmlFor={checkboxId} className="block text-sm font-medium text-text-primary cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
