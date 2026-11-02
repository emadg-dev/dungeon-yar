import React, { forwardRef, useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';

export interface ScrollableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The identifier or key of the currently active child item.
   * When this value changes, the component automatically scrolls that item into center view.
   */
  activeKey?: string | number | null;
  /** Width in pixels of the subtle edge fade gradient (default: 24) */
  fadeWidth?: number;
  /** Outer wrapper className (for width, margin, background, etc.) */
  wrapperClassName?: string;
  /** Whether to show the edge fade affordance (default: true) */
  showFade?: boolean;
  /** Optional custom gap between items (default: 'gap-1.5') */
  gapClassName?: string;
  /** Alignment of items inside row (default: 'items-center') */
  alignClassName?: string;
}

export interface ScrollableRowHandle {
  scrollToActive: () => void;
  container: HTMLDivElement | null;
}

/**
 * ScrollableRow
 * Universal mobile-friendly single-row container for tab bars, filter pills, segmented controls,
 * and button groups. Enforces flex-nowrap, touch-optimized horizontal scrolling without scrollbars,
 * scroll snap, RTL-aware edge fade masks, and auto-centering for active items.
 */
export const ScrollableRow = forwardRef<HTMLDivElement, ScrollableRowProps>(
  (
    {
      activeKey,
      fadeWidth = 24,
      wrapperClassName = '',
      showFade = true,
      gapClassName = 'gap-1.5',
      alignClassName = 'items-center',
      className = '',
      children,
      dir = 'rtl',
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    const [canScrollStart, setCanScrollStart] = useState(false);
    const [canScrollEnd, setCanScrollEnd] = useState(false);

    // Update scroll position and overflow affordances
    const updateScrollEdges = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 3) {
        setCanScrollStart(false);
        setCanScrollEnd(false);
        return;
      }

      // Handle RTL scroll offsets across modern and legacy browsers
      const sl = el.scrollLeft;
      const absSl = Math.abs(sl);

      // In RTL:
      // Start is the right edge (where reading begins in Persian).
      // End is the left edge (where overflow content extends).
      // In modern browsers, scrollLeft is 0 at the right edge, negative or positive toward the left edge.
      const atStart = absSl <= 3;
      const atEnd = absSl >= maxScroll - 3;

      setCanScrollStart(!atStart);
      setCanScrollEnd(!atEnd);
    }, []);

    // Set up listeners for scroll and layout resize
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      updateScrollEdges();

      const onScroll = () => {
        updateScrollEdges();
      };

      el.addEventListener('scroll', onScroll, { passive: true });

      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          updateScrollEdges();
        });
        ro.observe(el);
        if (el.parentElement) {
          ro.observe(el.parentElement);
        }
      } else {
        window.addEventListener('resize', updateScrollEdges);
      }

      return () => {
        el.removeEventListener('scroll', onScroll);
        ro?.disconnect();
        window.removeEventListener('resize', updateScrollEdges);
      };
    }, [updateScrollEdges]);

    // Auto-scroll active item into view centered
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      let target: HTMLElement | null = null;

      if (activeKey !== undefined && activeKey !== null) {
        target =
          el.querySelector(`[data-key="${activeKey}"]`) ||
          el.querySelector(`[data-id="${activeKey}"]`) ||
          el.querySelector(`[data-tab="${activeKey}"]`);
      }

      if (!target) {
        target =
          el.querySelector('[aria-selected="true"]') ||
          el.querySelector('[data-active="true"]');
      }

      if (target) {
        target.scrollIntoView({
          inline: 'center',
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }, [activeKey]);

    // Build the dynamic CSS mask for RTL edge fade affordance
    // In CSS horizontal coordinates: Left is 0px, Right is 100%.
    // In RTL: Start is Right (100%), End is Left (0px).
    // - canScrollEnd means more content exists on the left (0px) -> fade left edge.
    // - canScrollStart means more content exists on the right (100%) -> fade right edge.
    const getMaskStyle = (): React.CSSProperties => {
      if (!showFade || (!canScrollStart && !canScrollEnd)) {
        return {};
      }

      const fw = fadeWidth;
      let mask = '';

      if (canScrollEnd && canScrollStart) {
        mask = `linear-gradient(to right, transparent 0px, black ${fw}px, black calc(100% - ${fw}px), transparent 100%)`;
      } else if (canScrollEnd) {
        mask = `linear-gradient(to right, transparent 0px, black ${fw}px, black 100%)`;
      } else if (canScrollStart) {
        mask = `linear-gradient(to left, transparent 0px, black ${fw}px, black 100%)`;
      }

      return mask
        ? {
            maskImage: mask,
            WebkitMaskImage: mask,
          }
        : {};
    };

    return (
      <div className={`relative w-full min-w-0 max-w-full overflow-hidden ${wrapperClassName}`}>
        <div
          ref={innerRef}
          dir={dir}
          style={{
            touchAction: 'pan-x pan-y pinch-zoom',
            ...getMaskStyle(),
          }}
          className={`scrollable-row flex flex-nowrap ${alignClassName} ${gapClassName} overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none snap-x snap-proximity scroll-smooth select-none ${className}`}
          {...rest}
        >
          {children}
        </div>
      </div>
    );
  }
);

ScrollableRow.displayName = 'ScrollableRow';
