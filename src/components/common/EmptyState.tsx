import React from 'react';
import { LucideIcon, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

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
            ? 'bg-[#C2512B]/15 border-[#C2512B]/35 text-[#C2512B]'
            : 'bg-[#E0A030]/10 border-[#E0A030]/30 text-[#E0A030]'
        }`}
      >
        {isError ? <AlertCircle className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
      </div>

      <h3 className="font-extrabold text-base text-[#EDE6D8]">{title}</h3>
      <p className="text-xs text-[#A39A89] leading-relaxed max-w-xs">{message}</p>

      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 py-2.5 px-5 rounded-[12px] bg-[#201D19] hover:bg-[#2A2621] text-[#EDE6D8] border border-[#2F2A23] font-bold text-xs flex items-center gap-2 touch-target transition-all"
        >
          <RefreshCw className="w-4 h-4 text-[#E0A030]" />
          <span>تلاش دوباره</span>
        </button>
      )}

      {!isError && actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 py-2.5 px-5 btn-primary-amber text-xs touch-target"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
