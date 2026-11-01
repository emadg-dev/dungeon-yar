import React from 'react';

export type CardVariant = 'surface' | 'surface-2' | 'glass' | 'outlined';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hasGoldTop?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  surface: 'bg-stone-900/85 backdrop-blur-md border border-stone-800/80 shadow-md',
  'surface-2': 'bg-stone-900/50 backdrop-blur-sm border border-stone-800/60',
  glass: 'bg-stone-900/70 backdrop-blur-xl border border-white/5 shadow-xl',
  outlined: 'bg-transparent border border-stone-800',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  hasGoldTop = false,
  interactive = false,
  padding = 'md',
  className = '',
  children,
  onClick,
  ...rest
}) => {
  const isClickable = interactive || Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as any);
              }
            }
          : undefined
      }
      style={{ touchAction: isClickable ? 'manipulation' : undefined }}
      className={`rounded-2xl relative overflow-hidden transition-all duration-150 ${
        variantStyles[variant]
      } ${paddingStyles[padding]} ${
        hasGoldTop ? 'card-gold-top' : ''
      } ${
        isClickable
          ? 'cursor-pointer hover:border-amber-500/40 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
