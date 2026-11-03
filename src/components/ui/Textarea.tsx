import React, { forwardRef, useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isFullWidth?: boolean;
  containerClassName?: string;
  noWrapper?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      isFullWidth = true,
      containerClassName = '',
      noWrapper = false,
      id,
      className = '',
      disabled,
      rows = 3,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const textareaElement = (
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        className={`w-full min-h-[80px] px-3.5 py-2.5 rounded-xl bg-surface-2 border text-text-primary placeholder:text-text-disabled transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:opacity-40 disabled:pointer-events-none resize-y ${
          error ? 'border-danger/80 ring-1 ring-danger/50' : 'border-border focus:border-accent'
        } ${className}`}
        {...rest}
      />
    );

    if (noWrapper && !label && !error && !helperText) {
      return textareaElement;
    }

    return (
      <div className={`space-y-1.5 ${isFullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-muted">
            {label}
          </label>
        )}

        {textareaElement}

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

Textarea.displayName = 'Textarea';
