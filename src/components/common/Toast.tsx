import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'roll' | 'success' | 'warn' | 'info';
  rollValue?: number;
  isCrit?: boolean;
  isFumble?: boolean;
}

interface ToastProps {
  toast?: ToastMessage | null;
  message?: string | null;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, message, onDismiss, onClose }) => {
  const dismiss = onDismiss || onClose || (() => {});
  const activeToast: ToastMessage | null = toast || (message ? { id: 'simple-toast', message } : null);
  if (!activeToast) return null;

  const isRoll = activeToast.type === 'roll' || typeof activeToast.rollValue === 'number';

  return (
    <div
      className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 inset-x-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
      dir="rtl"
    >
      <div
        className={`p-3 rounded-[14px] border shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 gap-3 ${
          activeToast.isCrit
            ? 'bg-surface/95 border-accent shadow-glow-amber-lg text-accent-hover'
            : activeToast.isFumble
            ? 'bg-surface/95 border-danger shadow-[0_0_20px_rgba(194,81,43,0.4)] text-danger'
            : 'bg-surface/95 border-border text-text-primary'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeToast.isCrit ? (
            <Sparkles className="w-5 h-5 text-accent shrink-0 animate-bounce" />
          ) : activeToast.isFumble ? (
            <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug truncate">{activeToast.message}</p>
          </div>

          {isRoll && typeof activeToast.rollValue === 'number' && (
            <span
              className={`font-mono text-xl font-extrabold px-2 py-0.5 rounded-[8px] bg-surface-2 border border-border dice-ltr ${
                activeToast.isCrit ? 'text-accent' : activeToast.isFumble ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {activeToast.rollValue}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-[8px] text-text-muted hover:text-text-primary touch-target min-w-[44px]"
          title="بستن پیام"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
