import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'در حال بارگذاری...',
}) => {
  return (
    <div role="status" className="inline-flex items-center gap-2 text-primary">
      <Loader2 className={`animate-spin ${sizeStyles[size]} ${className}`} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};
