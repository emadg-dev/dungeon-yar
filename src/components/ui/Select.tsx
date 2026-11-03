import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  helperText?: string;
  error?: string;
  isFullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      isFullWidth = true,
      id,
      className = '',
      disabled,
      children,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={`space-y-1.5 ${isFullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-stone-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={`w-full min-h-[44px] ps-3.5 pe-10 py-2.5 rounded-xl bg-surface-2 border text-text-primary transition-colors outline-none appearance-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
              error ? 'border-danger/80 ring-1 ring-danger/50' : 'border-border focus:border-accent'
            } ${className}`}
            {...rest}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-surface-2 text-text-primary">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown
            className="w-4 h-4 text-stone-400 absolute end-3 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
