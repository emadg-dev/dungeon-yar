import React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-stone-800 text-stone-300 border-stone-700/60',
  accent: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-stone-400',
  accent: 'bg-amber-400',
  success: 'bg-emerald-400',
  danger: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-sky-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
  md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium border select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
