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
        className={`p-3 rounded-[14px] border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          activeToast.isCrit
            ? 'bg-[#171513]/95 border-[#E0A030] shadow-[0_0_20px_rgba(224,160,48,0.4)] text-[#F2C265]'
            : activeToast.isFumble
            ? 'bg-[#171513]/95 border-[#C2512B] shadow-[0_0_20px_rgba(194,81,43,0.4)] text-[#C2512B]'
            : 'bg-[#171513]/95 border-[#2F2A23] text-[#EDE6D8]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeToast.isCrit ? (
            <Sparkles className="w-5 h-5 text-[#E0A030] shrink-0 animate-bounce" />
          ) : activeToast.isFumble ? (
            <AlertTriangle className="w-5 h-5 text-[#C2512B] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#6F9E78] shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug truncate">{activeToast.message}</p>
          </div>

          {isRoll && typeof activeToast.rollValue === 'number' && (
            <span
              className={`font-mono text-xl font-extrabold px-2 py-0.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] dice-ltr ${
                activeToast.isCrit ? 'text-[#E0A030]' : activeToast.isFumble ? 'text-[#C2512B]' : 'text-[#EDE6D8]'
              }`}
            >
              {activeToast.rollValue}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-[8px] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
          title="بستن پیام"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
