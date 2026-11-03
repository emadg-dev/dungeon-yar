import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface ListRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  badge,
  onClick,
  showChevron = true,
  disabled = false,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable && !disabled ? 0 : undefined}
      onClick={!disabled && onClick ? onClick : undefined}
      onKeyDown={
        isClickable && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{ touchAction: isClickable ? 'manipulation' : undefined }}
      className={`min-h-[52px] p-3 sm:p-3.5 rounded-xl border border-border bg-surface-2/50 flex items-center justify-between gap-3 transition-all duration-150 outline-none ${
        isClickable && !disabled
          ? 'cursor-pointer hover:bg-surface-3 hover:border-primary/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-focus-ring'
          : ''
      } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-text-primary truncate">{title}</h4>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-text-muted truncate mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {trailing}
        {isClickable && showChevron && (
          <ChevronLeft className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};
