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
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
};

const typeBorders: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-stone-900/95 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
  error: 'border-red-500/40 bg-stone-900/95 shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
  warning: 'border-amber-500/40 bg-stone-900/95 shadow-[0_4px_20px_rgba(224,160,48,0.15)]',
  info: 'border-sky-500/40 bg-stone-900/95 shadow-[0_4px_20px_rgba(14,165,233,0.15)]',
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
      <p className="text-xs sm:text-sm font-medium text-stone-100 flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن اعلان"
        className="p-1 text-stone-400 hover:text-stone-100 transition-colors rounded-lg hover:bg-stone-800"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
