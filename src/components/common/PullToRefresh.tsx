/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  pullThreshold?: number;
  maxPullDistance?: number;
}

/**
 * Mobile-first Pull-to-Refresh container for Home & Campaign screens.
 * Features:
 * - Natural elastic resistance curve
 * - Subtle haptic feedback on threshold
 * - Framer-motion smooth spring transitions
 * - Persian status labels & amber-on-charcoal styling
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  className = '',
  pullThreshold = 65,
  maxPullDistance = 110,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return true;
    // Check both container scroll and closest scrollable parent
    const scrollParent = containerRef.current.closest('main, [data-scrollable="true"], .overflow-y-auto') as HTMLElement | null;
    const parentScroll = scrollParent ? scrollParent.scrollTop : 0;
    const windowScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    return parentScroll <= 2 && windowScroll <= 2;
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (e.touches.length !== 1) return;

    if (isAtTop()) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hasTriggeredHapticRef.current = false;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const rawDelta = currentY - startYRef.current;

    if (rawDelta > 0) {
      if (!isAtTop()) {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }

      // Elastic resistance curve: pulls smoothly with logarithmic damping
      const damping = 0.42;
      const calculated = Math.min(maxPullDistance, rawDelta * damping);
      setPullDistance(calculated);

      // Trigger light haptic bump when threshold is crossed
      if (calculated >= pullThreshold && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(20);
          } catch {}
        }
      } else if (calculated < pullThreshold) {
        hasTriggeredHapticRef.current = false;
      }
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || disabled || isRefreshing) {
      setPullDistance(0);
      isPullingRef.current = false;
      return;
    }

    isPullingRef.current = false;

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(52); // Keep indicator visible during refresh

      try {
        await Promise.all([
          Promise.resolve(onRefresh()),
          // Minimum pleasant visual duration
          new Promise(res => setTimeout(res, 600))
        ]);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      } catch (err) {
        console.error('Pull-to-refresh failed:', err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back if released before threshold
      setPullDistance(0);
    }
  };

  const isPastThreshold = pullDistance >= pullThreshold;
  const rotationDeg = Math.min(360, (pullDistance / pullThreshold) * 360);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${className}`}
      dir="rtl"
    >
      {/* Pull Indicator Bar */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              height: pullDistance > 0 ? pullDistance : (isRefreshing ? 52 : 0)
            }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden flex items-center justify-center select-none pointer-events-none"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#171513]/90 border border-[#E0A030]/30 shadow-lg backdrop-blur-md">
              {isSuccess ? (
                <Check className="w-4 h-4 text-[#6F9E78] stroke-[2.5]" />
              ) : isRefreshing ? (
                <RefreshCw className="w-4 h-4 text-[#E0A030] animate-spin stroke-[2.5]" />
              ) : isPastThreshold ? (
                <RefreshCw 
                  className="w-4 h-4 text-[#F2C265] stroke-[2.5] transition-transform" 
                  style={{ transform: `rotate(${rotationDeg}deg)` }}
                />
              ) : (
                <ArrowDown 
                  className="w-4 h-4 text-[#A39A89] transition-transform"
                  style={{ transform: `translateY(${Math.min(4, pullDistance * 0.1)}px)` }}
                />
              )}

              <span className="text-[11px] font-bold text-[#EDE6D8]">
                {isSuccess
                  ? 'اطلاعات به‌روز شد'
                  : isRefreshing
                  ? 'در حال دریافت تازه‌ترین اطلاعات...'
                  : isPastThreshold
                  ? 'رها کنید تا به‌روزرسانی شود'
                  : 'برای تازه‌سازی به پایین بکشید'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with subtle vertical translation during pull */}
      <motion.div
        animate={{ 
          y: isRefreshing ? 0 : pullDistance * 0.25 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
