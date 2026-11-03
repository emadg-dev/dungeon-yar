import React from 'react';
import { LucideIcon, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon: Icon = Sparkles,
  actionLabel,
  onAction,
  isError = false,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 surface-card flex flex-col items-center justify-center max-w-md mx-auto space-y-3 ${className}`}
      dir="rtl"
    >
      <div
        className={`w-14 h-14 rounded-[14px] flex items-center justify-center border shadow-inner ${
          isError
            ? 'bg-danger/15 border-danger/35 text-danger'
            : 'bg-accent/10 border-accent/30 text-accent'
        }`}
      >
        {isError ? <AlertCircle className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
      </div>

      <h3 className="font-extrabold text-base text-text-primary">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed max-w-xs">{message}</p>

      {isError && onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          className="mt-2 py-2.5 px-5 rounded-[12px] bg-surface-2 hover:bg-surface-2 text-text-primary border border-border font-bold text-xs flex items-center gap-2 touch-target min-w-[44px] transition-all"
        >
          <RefreshCw className="w-4 h-4 text-accent" />
          <span>تلاش دوباره</span>
        </Button>
      )}

      {!isError && actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          className="mt-2 py-2.5 px-5 btn-primary-amber text-xs touch-target min-w-[44px]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
