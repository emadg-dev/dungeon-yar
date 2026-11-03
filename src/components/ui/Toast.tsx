import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  className?: string;
}

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
  info: <Info className="w-5 h-5 text-info shrink-0" />,
};

const typeBorders: Record<ToastType, string> = {
  success: 'border-success/40 bg-surface/95 shadow-lg',
  error: 'border-danger/40 bg-surface/95 shadow-lg',
  warning: 'border-warning/40 bg-surface/95 shadow-lg',
  info: 'border-info/40 bg-surface/95 shadow-lg',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'warning',
  duration = 4000,
  onClose,
  className = '',
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <aside
      role="alert"
      aria-live="polite"
      dir="rtl"
      className={`fixed top-4 start-1/2 -translate-x-1/2 z-50 w-auto max-w-[92vw] sm:max-w-md px-4 py-3 rounded-2xl border backdrop-blur-md flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 duration-200 select-none ${
        typeBorders[type]
      } ${className}`}
    >
      {typeIcons[type]}
      <p className="text-xs sm:text-sm font-medium text-text-primary flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن اعلان"
        className="p-1 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-3"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
