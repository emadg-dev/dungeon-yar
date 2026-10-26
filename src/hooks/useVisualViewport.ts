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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const currentHeight = window.visualViewport.height;
      setViewportHeight(currentHeight);

      // If visualViewport height is significantly smaller than window.innerHeight, keyboard is likely open
      const diff = window.innerHeight - currentHeight;
      const isOpen = diff > 150;
      setIsKeyboardOpen(isOpen);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { isKeyboardOpen, viewportHeight };
}
