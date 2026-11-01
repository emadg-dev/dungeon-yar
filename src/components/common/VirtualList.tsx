/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number | string;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
  emptyState?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  keyExtractor,
  className = '',
  overscan = 4,
  emptyState,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    typeof height === 'number' ? height : 400
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      setScrollTop(el.scrollTop);
    };

    el.addEventListener('scroll', onScroll, { passive: true });

    // Measure dynamic container height if string or flex
    if (typeof height === 'string' && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height || 400);
        }
      });
      ro.observe(el);
      return () => {
        el.removeEventListener('scroll', onScroll);
        ro.disconnect();
      };
    }

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [height]);

  const totalCount = items.length;
  const totalHeight = totalCount * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    if (totalCount === 0) return { startIndex: 0, endIndex: 0 };
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const end = Math.min(totalCount, start + visibleCount);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, totalCount, overscan]);

  if (totalCount === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto relative ${className}`}
      style={{ height, willChange: 'transform' }}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
