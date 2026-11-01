import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  shape?: 'square' | 'circle';
  icon: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-[0_2px_8px_rgba(224,160,48,0.28)] hover:shadow-[0_0_12px_rgba(242,194,101,0.4)] active:scale-95 border border-amber-400/50',
  secondary:
    'bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700/60 hover:border-amber-500/40 active:scale-95',
  ghost:
    'bg-transparent hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 active:scale-95',
  danger:
    'bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50 active:scale-95',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-11 h-11 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      shape = 'square',
      icon,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={isDisabled}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex items-center justify-center transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:opacity-40 disabled:pointer-events-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${roundedClass} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
