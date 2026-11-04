import React from 'react';
import { BottomSheet } from './BottomSheet';
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

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

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
  if (!isOpen) return null;

  const displayMessage = description || message || '';
  const isDanger = destructive ?? isDestructive ?? true;
  // The default label matches what the button does: "Delete" only when it deletes.
  const finalConfirmLabel = confirmText || confirmLabel || (isDanger ? 'حذف' : 'تأیید');
  const finalCancelLabel = cancelText || cancelLabel || 'انصراف';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5 text-text-primary">
        {displayMessage && (
          <p className="text-sm leading-relaxed selectable-text">{displayMessage}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={onClose}
            className={`h-12 px-4 rounded-lg bg-surface-2 border border-border text-sm font-medium text-text-primary hover:border-accent transition ${focusRing}`}
          >
            {finalCancelLabel}
          </Button>

          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-12 px-4 rounded-lg text-sm font-bold transition ${focusRing} ${
              isDanger
                ? 'bg-danger text-on-danger hover:opacity-90'
                : 'bg-accent text-on-accent hover:bg-accent-hover'
            }`}
          >
            {finalConfirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};