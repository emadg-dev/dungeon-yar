import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxHeight = '90dvh',
  showCloseButton = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);

  // Close on Escape or Back button
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

    // Body scroll lock
    document.body.classList.add('sheet-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('sheet-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Touch drag-down handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY !== null) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - dragStartY;
      if (diff > 0) {
        setDragCurrentY(diff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragCurrentY !== null && dragCurrentY > 100) {
      onClose();
    }
    setDragStartY(null);
    setDragCurrentY(null);
  };

  const dragOffsetStyle = dragCurrentY ? { transform: `translateY(${dragCurrentY}px)` } : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      className="fixed inset-0 z-40 flex items-end justify-center"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        style={{
          maxHeight,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          ...dragOffsetStyle,
        }}
        className="relative z-41 w-full max-w-xl bg-surface border-t border-border rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-200 ease-out overflow-hidden"
      >
        {/* Drag down pill handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-10 h-1.5 rounded-full bg-surface-3 hover:bg-border-strong transition-colors" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-5 py-2.5 flex items-start justify-between gap-3 border-b border-border shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 id="bottom-sheet-title" className="text-base sm:text-lg font-bold text-text-primary truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <IconButton
                icon={<X className="w-5 h-5" />}
                aria-label="بستن پنجره"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0 -me-1 text-text-muted hover:text-text-primary"
              />
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-border bg-surface-2/90 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
