import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { IconButton } from './IconButton';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirmLoading?: boolean;
  isDestructive?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'انصراف',
  onConfirm,
  isConfirmLoading = false,
  isDestructive = false,
  maxWidth = 'md',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('sheet-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('sheet-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative z-41 w-full ${maxWidthStyles[maxWidth]} bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 id="dialog-title" className="text-base sm:text-lg font-bold text-stone-100">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <IconButton
            icon={<X className="w-5 h-5" />}
            aria-label="بستن پنجره"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="-me-1 text-stone-400 hover:text-stone-100"
          />
        </div>

        {/* Body */}
        {children && <div className="p-5">{children}</div>}

        {/* Footer Actions */}
        {(onConfirm || confirmLabel) && (
          <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-900/60 flex items-center justify-end gap-2.5">
            <Button variant="ghost" onClick={onClose} disabled={isConfirmLoading}>
              {cancelLabel}
            </Button>
            {onConfirm && confirmLabel && (
              <Button
                variant={isDestructive ? 'danger' : 'primary'}
                onClick={onConfirm}
                isLoading={isConfirmLoading}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
