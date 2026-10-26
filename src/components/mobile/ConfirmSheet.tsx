import React from 'react';
import { BottomSheet } from './BottomSheet';
import { AlertTriangle } from 'lucide-react';

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  destructive?: boolean;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive,
  destructive,
}) => {
  const displayMessage = description || message || '';
  const finalConfirmLabel = confirmText || confirmLabel || 'تأیید و حذف';
  const finalCancelLabel = cancelText || cancelLabel || 'انصراف';
  const isDanger = destructive ?? isDestructive ?? true;
  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="تأیید اقدام"
    >
      <div className="space-y-4 text-slate-200">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed selectable-text">
            {displayMessage}
          </p>
        </div>

        {/* Large thumb-friendly action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition touch-target"
          >
            {finalCancelLabel}
          </button>

          {/* Confirm/Destructive button on thumb side (in RTL, left is outer thumb side for right-handed or right for one-handed) */}
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3 px-4 rounded-xl text-xs font-black shadow-lg transition touch-target ${
              isDanger
                ? 'bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white border border-red-500/50 shadow-red-950/50'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
            }`}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
