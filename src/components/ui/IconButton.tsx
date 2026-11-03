import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'unstyled';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'none';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  shape?: 'square' | 'circle';
  icon: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn-outline',
  unstyled: '',
};

const sizeStyles: Record<IconButtonSize, string> = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-11 h-11 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
  none: '',
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
        className={`btn inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:pointer-events-none ${
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
