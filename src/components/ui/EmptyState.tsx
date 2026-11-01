import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      dir="rtl"
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 mb-1 shadow-inner">
          {icon}
        </div>
      )}

      <div className="max-w-sm space-y-1">
        <h3 className="font-bold text-sm sm:text-base text-stone-200">{title}</h3>
        {description && (
          <p className="text-xs text-stone-400 leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
