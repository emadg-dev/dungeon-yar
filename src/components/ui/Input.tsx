import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
  containerClassName?: string;
  noWrapper?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
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
      containerClassName = '',
      noWrapper = false,
      inputSize = 'md',
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

    const sizeClass = inputSize === 'sm' ? 'min-h-[36px] py-1.5 px-3 text-xs' : 'min-h-[44px] px-3.5 py-2.5 text-sm';

    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        className={`w-full ${sizeClass} rounded-xl bg-surface-2 border text-text-primary placeholder:text-text-disabled transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:opacity-40 disabled:pointer-events-none ${
          error ? 'border-danger/80 ring-1 ring-danger/50' : 'border-border focus:border-accent'
        } ${leftIcon ? 'ps-10' : ''} ${rightIcon ? 'pe-10' : ''} ${className}`}
        {...rest}
      />
    );

    if (noWrapper && !label && !error && !helperText && !leftIcon && !rightIcon) {
      return inputElement;
    }

    return (
      <div className={`space-y-1.5 ${isFullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-muted">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute start-3 pointer-events-none text-text-disabled shrink-0">
              {leftIcon}
            </span>
          )}

          {inputElement}

          {rightIcon && (
            <span className="absolute end-3 text-text-disabled shrink-0">
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
