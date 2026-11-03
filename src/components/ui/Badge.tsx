import React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'owner' | 'codm' | 'player' | 'spectator';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-2 text-text-muted border-border',
  accent: 'bg-accent/15 text-accent-hover border-accent/30',
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-info/15 text-info border-info/30',
  owner: 'bg-accent/15 text-role-owner border-accent/40',
  codm: 'bg-purple-500/15 text-role-codm border-purple-500/40',
  player: 'bg-success/15 text-role-player border-success/40',
  spectator: 'bg-surface-2 text-role-spectator border-border',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-text-disabled',
  accent: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  owner: 'bg-role-owner',
  codm: 'bg-role-codm',
  player: 'bg-role-player',
  spectator: 'bg-role-spectator',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5 rounded-md gap-1',
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
