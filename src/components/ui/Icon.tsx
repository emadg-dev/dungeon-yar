import React from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: IconSize;
  className?: string;
  color?: string;
  'aria-label'?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const Icon: React.FC<IconProps> = ({
  icon: Component,
  size = 'md',
  className = '',
  color,
  'aria-label': ariaLabel,
}) => {
  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      className={`inline-flex items-center justify-center shrink-0 ${color || ''}`}
    >
      <Component className={`${sizeClasses[size]} ${className}`} />
    </span>
  );
};
