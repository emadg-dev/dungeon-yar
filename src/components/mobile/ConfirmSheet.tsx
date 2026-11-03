import React from 'react';
import { BottomSheet } from './BottomSheet';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

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
      <div className="space-y-4 text-text-primary">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/15 border border-accent/30">
          <div className="p-2 rounded-xl bg-accent/20 text-accent-hover shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-accent-hover" />
          </div>
          <p className="text-xs sm:text-sm text-text-primary leading-relaxed selectable-text">
            {displayMessage}
          </p>
        </div>

        {/* Large thumb-friendly action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Cancel button */}
          <Button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-surface-2 hover:bg-surface-2 text-text-primary text-xs font-bold transition touch-target min-w-[44px]"
          >
            {finalCancelLabel}
          </Button>

          {/* Confirm/Destructive button on thumb side (in RTL, left is outer thumb side for right-handed or right for one-handed) */}
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3 px-4 rounded-xl text-xs font-black shadow-lg transition touch-target min-w-[44px] ${
              isDanger
                ? 'bg-gradient-to-r from-danger to-accent hover:from-danger hover:to-warning text-white border border-danger/50 shadow-bg/50'
                : 'bg-accent hover:bg-accent-hover text-on-accent shadow-surface-2/40'
            }`}
          >
            {finalConfirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
