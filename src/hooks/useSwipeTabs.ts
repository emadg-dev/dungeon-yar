/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface UseSwipeTabsOptions {
  onSwipeNext?: () => void;
  onSwipePrev?: () => void;
  enabled?: boolean;
}

/**
 * Swipe between sibling tabs with RTL support.
 * In RTL:
 * - Swiping right-to-left (finger drags left, deltaX < 0) advances to NEXT section.
 * - Swiping left-to-right (finger drags right, deltaX > 0) goes to PREVIOUS section.
 * Does NOT hijack swipes inside horizontally scrollable areas (tab bars, tables, maps, sliders, code).
 */
export function useSwipeTabs<T extends HTMLElement = HTMLDivElement>({
  onSwipeNext,
  onSwipePrev,
  enabled = true,
}: UseSwipeTabsOptions) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isTracking = false;
    let isHorizontal = false;

    const shouldIgnore = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          '[data-no-swipe], .no-swipe, .overflow-x-auto, .overflow-x-scroll, [role="tablist"], table, .leaflet-container, canvas, input, textarea, select, pre, code, .scrollable-row, .virtual-list, .dice-roller'
        )
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        isTracking = false;
        return;
      }
      if (shouldIgnore(e.target)) {
        isTracking = false;
        return;
      }
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isTracking = true;
      isHorizontal = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // If user is mostly scrolling vertically, abort swipe tracking
      if (!isHorizontal && Math.abs(deltaY) > 14 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isTracking = false;
        return;
      }
      if (Math.abs(deltaX) > 16 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontal = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking || !isHorizontal) {
        isTracking = false;
        return;
      }
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;

      isTracking = false;
      isHorizontal = false;

      // Must be a definitive horizontal swipe within 500ms
      if (deltaTime < 500 && Math.abs(deltaX) >= 42 && Math.abs(deltaX) > 1.6 * Math.abs(deltaY)) {
        if (deltaX < 0) {
          // Right-to-left in RTL -> NEXT
          onSwipeNext?.();
        } else {
          // Left-to-right in RTL -> PREV
          onSwipePrev?.();
        }
      }
    };

    const handleTouchCancel = () => {
      isTracking = false;
      isHorizontal = false;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, onSwipeNext, onSwipePrev]);

  return containerRef;
}
