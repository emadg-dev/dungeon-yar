import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-bold shadow-[0_2px_10px_rgba(224,160,48,0.28)] hover:shadow-[0_0_16px_rgba(242,194,101,0.4)] active:scale-[0.98] border border-amber-400/50',
  secondary:
    'bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/60 hover:border-amber-500/40 active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-stone-800/60 text-stone-300 hover:text-stone-100 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-red-700 to-red-600 text-white font-bold shadow-[0_2px_10px_rgba(194,81,43,0.28)] hover:shadow-[0_0_16px_rgba(214,97,56,0.4)] active:scale-[0.98] border border-red-500/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'min-h-[44px] px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'min-h-[48px] px-5 py-2.5 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      isFullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:opacity-50 disabled:pointer-events-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${isFullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
