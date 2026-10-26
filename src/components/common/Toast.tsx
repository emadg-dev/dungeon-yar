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
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const isRoll = toast.type === 'roll' || typeof toast.rollValue === 'number';

  return (
    <div
      className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 inset-x-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
      dir="rtl"
    >
      <div
        className={`p-3 rounded-[14px] border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          toast.isCrit
            ? 'bg-[#171513]/95 border-[#E0A030] shadow-[0_0_20px_rgba(224,160,48,0.4)] text-[#F2C265]'
            : toast.isFumble
            ? 'bg-[#171513]/95 border-[#C2512B] shadow-[0_0_20px_rgba(194,81,43,0.4)] text-[#C2512B]'
            : 'bg-[#171513]/95 border-[#2F2A23] text-[#EDE6D8]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {toast.isCrit ? (
            <Sparkles className="w-5 h-5 text-[#E0A030] shrink-0 animate-bounce" />
          ) : toast.isFumble ? (
            <AlertTriangle className="w-5 h-5 text-[#C2512B] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#6F9E78] shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-snug truncate">{toast.message}</p>
          </div>

          {isRoll && typeof toast.rollValue === 'number' && (
            <span
              className={`font-mono text-xl font-extrabold px-2 py-0.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] dice-ltr ${
                toast.isCrit ? 'text-[#E0A030]' : toast.isFumble ? 'text-[#C2512B]' : 'text-[#EDE6D8]'
              }`}
            >
              {toast.rollValue}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-[8px] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
          title="بستن پیام"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
