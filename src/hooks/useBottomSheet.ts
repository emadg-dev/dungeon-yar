import { useEffect, useCallback } from 'react';

export interface UseBottomSheetOptions {
  isOpen: boolean;
  onClose: () => void;
  lockScroll?: boolean;
}

export function useBottomSheet({ isOpen, onClose, lockScroll = true }: UseBottomSheetOptions) {
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

    if (lockScroll) {
      document.body.classList.add('sheet-open');
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lockScroll) {
        document.body.classList.remove('sheet-open');
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lockScroll, handleKeyDown]);
}
