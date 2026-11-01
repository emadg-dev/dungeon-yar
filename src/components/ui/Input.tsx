import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      isFullWidth = true,
      id,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={`space-y-1.5 ${isFullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-stone-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute start-3 pointer-events-none text-stone-400 shrink-0">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            style={{ fontSize: '16px' }} // Ensures iOS Safari does not auto-zoom
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-stone-900/80 border text-stone-100 placeholder-stone-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:border-amber-400 disabled:opacity-40 disabled:pointer-events-none ${
              error ? 'border-red-500/80 ring-1 ring-red-500/50' : 'border-stone-800 focus:border-amber-400'
            } ${leftIcon ? 'ps-10' : ''} ${rightIcon ? 'pe-10' : ''} ${className}`}
            {...rest}
          />

          {rightIcon && (
            <span className="absolute end-3 text-stone-400 shrink-0">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-stone-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
