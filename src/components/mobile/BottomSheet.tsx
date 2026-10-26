import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullHeight?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  fullHeight = false,
}) => {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const pushedHistory = useRef<boolean>(false);

  // Lock body scroll & handle Android/browser back button
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sheet-open');

      // Push history state so Android Back button closes the sheet instead of leaving app
      try {
        window.history.pushState({ sheetOpen: true, title }, '');
        pushedHistory.current = true;
      } catch (e) {
        // ignore if iframe security blocks
      }

      const handlePopState = () => {
        pushedHistory.current = false;
        onClose();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.classList.remove('sheet-open');
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    if (pushedHistory.current) {
      pushedHistory.current = false;
      try {
        window.history.back();
      } catch (e) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Drag down to close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    // Only drag down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 75) {
      setDragOffset(0);
      handleClose();
    } else {
      setDragOffset(0);
    }
    isDragging.current = false;
    touchStartY.current = null;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[40] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`w-full max-w-lg z-[41] bg-[#12151e] border-t sm:border border-amber-500/30 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-bottom duration-200 overflow-hidden ${
          fullHeight ? 'h-[92dvh] sm:h-[88dvh]' : 'max-h-[92dvh] sm:max-h-[88dvh]'
        }`}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
        dir="rtl"
      >
        {/* Mobile Drag Indicator Bar (Touch Target for swipe down) */}
        <div 
          className="w-full flex justify-center pt-2.5 pb-2 sm:hidden shrink-0 bg-[#0e1118]/95 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-600/80" />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800 shrink-0 bg-[#0e1118]/95 touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="min-w-0 pr-1">
            <h3 className="text-sm sm:text-base font-bold text-amber-200 truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition touch-target shrink-0"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content with ample bottom padding so buttons never cut off */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 pb-14 sm:pb-6 focus:outline-none">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer ? (
          <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-[#0e1118]/95 backdrop-blur-sm pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        ) : (
          <div className="h-[env(safe-area-inset-bottom,0px)] shrink-0 sm:hidden" />
        )}
      </div>
    </div>
  );
};
