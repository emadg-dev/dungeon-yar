import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Maximize2 } from 'lucide-react';

interface MobileImageViewerProps {
  imageUrl: string;
  alt?: string;
  onClose?: () => void;
  children?: React.ReactNode; // For overlay elements like map pins
  onMapClick?: (xPercent: number, yPercent: number) => void;
  interactiveChildren?: boolean;
}

/**
 * Mobile-first Image & Map Viewer with Pinch-Zoom, Pan, and Double-Tap-To-Fit.
 * Safe area aware, touch target >= 44px, smooth 60fps transform-based gestures.
 */
export const MobileImageViewer: React.FC<MobileImageViewerProps> = ({
  imageUrl,
  alt = 'نمای تصویر',
  onClose,
  children,
  onMapClick,
  interactiveChildren = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Gesture tracking refs
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastTapTimeRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  // Reset zoom & pan to fit
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, Number((prev + 0.5).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(2)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Double-tap-to-fit / zoom toggle (<300ms)
  const handleDoubleTap = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (scale > 1.2) {
      handleResetZoom();
    } else {
      // Zoom into tapped point (2.5x)
      const targetScale = 2.5;
      const offsetX = clientX - rect.left - rect.width / 2;
      const offsetY = clientY - rect.top - rect.height / 2;
      setScale(targetScale);
      setPosition({
        x: -offsetX * (targetScale - 1),
        y: -offsetY * (targetScale - 1)
      });
    }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    hasMovedRef.current = false;
    if (e.touches.length === 2) {
      // Pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialPinchDistRef.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialScaleRef.current = scale;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Single touch pan or tap
      const touch = e.touches[0];
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double tap detected!
        e.preventDefault();
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      initialPosRef.current = { ...position };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current) {
      // Pinch zooming
      hasMovedRef.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const ratio = dist / initialPinchDistRef.current;
      const nextScale = Math.min(5, Math.max(1, Number((initialScaleRef.current * ratio).toFixed(2))));
      setScale(nextScale);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Panning while zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }
      setPosition({
        x: initialPosRef.current.x + deltaX,
        y: initialPosRef.current.y + deltaY
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasMovedRef.current = true;
    }
    setPosition({
      x: initialPosRef.current.x + deltaX,
      y: initialPosRef.current.y + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on map to add pin (when not dragged)
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedRef.current) return;
    if (!onMapClick) return;

    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
      const xPercent = (clickX / rect.width) * 100;
      const yPercent = (clickY / rect.height) * 100;
      onMapClick(Number(xPercent.toFixed(2)), Number(yPercent.toFixed(2)));
    }
  };

  return (
    <div 
      className="relative w-full h-[65vh] sm:h-[75vh] max-h-[800px] bg-[#0E0C0A] rounded-[16px] overflow-hidden select-none border border-[#2F2A23] shadow-inner flex flex-col justify-center items-center"
      dir="ltr"
    >
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[#171410]/85 backdrop-blur-md p-1.5 rounded-[12px] border border-[#2F2A23] shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#EDE6D8] hover:bg-white/10 active:bg-white/20 transition touch-target"
          title="بزرگ‌نمایی (+)"
          aria-label="بزرگ‌نمایی"
        >
          <ZoomIn className="w-4 h-4 text-[#E0A030]" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#EDE6D8] hover:bg-white/10 active:bg-white/20 disabled:opacity-40 transition touch-target"
          title="کوچک‌نمایی (-)"
          aria-label="کوچک‌نمایی"
        >
          <ZoomOut className="w-4 h-4 text-[#E0A030]" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#EDE6D8] hover:bg-white/10 active:bg-white/20 transition touch-target"
          title="اندازه پیش‌فرض (دو لمس سریع)"
          aria-label="اندازه پیش‌فرض"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#A39A89] hover:text-white hover:bg-rose-500/20 active:bg-rose-500/30 transition touch-target"
            title="بستن"
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Zoom Indicator Pill */}
      {scale > 1 && (
        <div className="absolute bottom-3 start-3 z-30 bg-[#171410]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#2F2A23] text-[11px] font-bold text-[#F2C265] shadow-md pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Gesture Surface Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full flex items-center justify-center touch-none overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div
          onClick={handleImageClick}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative inline-block max-w-full max-h-full"
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={alt}
            draggable={false}
            className="max-w-full max-h-[62vh] sm:max-h-[72vh] object-contain rounded-[8px] pointer-events-none select-none shadow-2xl"
          />

          {/* Overlay Children (e.g. Map Pins) */}
          {children && (
            <div 
              className={`absolute inset-0 ${interactiveChildren ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
