import { useState, useEffect } from 'react';

/**
 * Hook to monitor window.visualViewport height changes to detect virtual keyboard opening.
 */
export function useVisualViewport() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.visualViewport 
      ? window.visualViewport.height 
      : (typeof window !== 'undefined' ? window.innerHeight : 800);
  });

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewportHeight(currentHeight);

      // If visualViewport height is significantly smaller than window.innerHeight, keyboard is open
      const diff = Math.max(0, window.innerHeight - currentHeight);
      const isOpen = diff > 150;
      setIsKeyboardOpen(isOpen);
      setKeyboardHeight(isOpen ? diff : 0);

      // Set CSS custom property for sticky save bars and components that anchor above keyboard
      document.documentElement.style.setProperty('--keyboard-height', `${isOpen ? diff : 0}px`);
      if (isOpen) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
      window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
    } else {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isKeyboardOpen, viewportHeight, keyboardHeight };
}
