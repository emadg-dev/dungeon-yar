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
      <div className="space-y-4 text-[#EDE6D8]">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#E0A030]/15 border border-[#E0A030]/30">
          <div className="p-2 rounded-xl bg-[#E0A030]/20 text-[#F2C265] shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-[#F2C265]" />
          </div>
          <p className="text-xs sm:text-sm text-[#C9C0AE] leading-relaxed selectable-text">
            {displayMessage}
          </p>
        </div>

        {/* Large thumb-friendly action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#C9C0AE] text-xs font-bold transition touch-target"
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
                ? 'bg-gradient-to-r from-[#C2512B] to-[#E0A030] hover:from-[#C2512B] hover:to-[#C97B4A] text-white border border-[#C2512B]/50 shadow-[#0E0D0C]/50'
                : 'bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] shadow-[#2A1A0D]/40'
            }`}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
