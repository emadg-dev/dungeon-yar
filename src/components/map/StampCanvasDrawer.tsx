import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Palette, RotateCcw, Check, X, Paintbrush, Eraser } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';

export interface StampCanvasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { blob: Blob; name: string; width: number; height: number }) => Promise<void>;
  isSaving?: boolean;
}

interface PaletteItem {
  id: string;
  label: string;
  bgClass: string;
  tokenVar: string;
}

const PALETTE_COLORS: PaletteItem[] = [
  { id: 'primary', label: 'روشن / متن', bgClass: 'bg-text-primary', tokenVar: '--color-text-primary' },
  { id: 'accent', label: 'کهربایی / نشان', bgClass: 'bg-accent', tokenVar: '--color-accent' },
  { id: 'danger', label: 'زرشکی / دشمن', bgClass: 'bg-danger', tokenVar: '--color-danger' },
  { id: 'forest', label: 'سبز / بیشه', bgClass: 'bg-terrain-forest', tokenVar: '--color-terrain-forest' },
  { id: 'water', label: 'آبی / دریا', bgClass: 'bg-terrain-water', tokenVar: '--color-terrain-water' },
  { id: 'mountain', label: 'خاکستری / دژ', bgClass: 'bg-terrain-mountain', tokenVar: '--color-terrain-mountain' }
];

function getResolvedTokenColor(tokenVar: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'currentColor';
  const val = getComputedStyle(document.documentElement).getPropertyValue(tokenVar).trim();
  return val || 'currentColor';
}

export const StampCanvasDrawer: React.FC<StampCanvasDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeColor, setActiveColor] = useState<PaletteItem>(PALETTE_COLORS[1]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [stampName, setStampName] = useState('المان دست‌کشیده');
  const [error, setError] = useState<string | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas with transparent background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 50);
      setError(null);
    }
  }, [isOpen, initCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
    const color = isEraser ? 'rgba(0,0,0,1)' : getResolvedTokenColor(activeColor.tokenVar);
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    const color = isEraser ? 'rgba(0,0,0,1)' : getResolvedTokenColor(activeColor.tokenVar);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && e.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleClear = () => {
    initCanvas();
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(null);

    const name = stampName.trim();
    if (!name) {
      setError('لطفاً نامی برای این المان وارد کنید.');
      return;
    }

    canvas.toBlob(
      async blob => {
        if (!blob) {
          setError('خطا در تبدیل نقاشی به فایل تصویری.');
          return;
        }

        if (blob.size > 150 * 1024) {
          setError('حجم نقاشی بیش از ۱۵۰ کیلوبایت است. لطفاً بخش‌هایی را پاک کنید.');
          return;
        }

        try {
          await onSave({
            blob,
            name,
            width: canvas.width,
            height: canvas.height
          });
          onClose();
        } catch (err: any) {
          setError(err?.message || 'خطا در ذخیره‌سازی المان در کتابخانه.');
        }
      },
      'image/png'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 bg-overlay backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-md bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-accent" />
            <h3 className="text-base font-bold text-text-primary">بوم نقاشی المان شخصی</h3>
          </div>
          <IconButton
            icon={<X className="w-5 h-5" />}
            aria-label="بستن بوم"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <Input
            label="نام المان"
            value={stampName}
            onChange={e => setStampName(e.target.value)}
            placeholder="مثال: دژ کلاغ، پل سنگی..."
            required
            maxLength={60}
          />

          {/* Canvas Wrapper */}
          <div className="flex flex-col items-center">
            <div className="relative border-2 border-dashed border-border rounded-2xl overflow-hidden bg-surface-sunken p-1 shadow-inner">
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="w-[256px] h-[256px] bg-transparent cursor-crosshair touch-none select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
              <span className="absolute bottom-2 end-2 text-[10px] text-text-muted/60 pointer-events-none select-none">
                پس‌زمینه شفاف (PNG)
              </span>
            </div>
          </div>

          {/* Color & Tool Options */}
          <div className="space-y-3 bg-surface-2 p-3 rounded-xl border border-border">
            {/* Color swatches */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-accent" />
                رنگ قلم:
              </span>
              <div className="flex items-center gap-1.5">
                {PALETTE_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      setActiveColor(c);
                      setIsEraser(false);
                    }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${c.bgClass} ${
                      activeColor.id === c.id && !isEraser
                        ? 'scale-110 border-accent shadow-md'
                        : 'border-border/60 hover:scale-105'
                    }`}
                  />
                ))}
                <IconButton
                  icon={<Eraser className="w-4 h-4" />}
                  aria-label="پاک‌کن"
                  title="حالت پاک‌کن"
                  variant={isEraser ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setIsEraser(!isEraser)}
                  className="ms-1"
                />
              </div>
            </div>

            {/* Stroke Width Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted whitespace-nowrap">ضخامت:</span>
              <input
                type="range"
                min={2}
                max={16}
                step={1}
                value={strokeWidth}
                onChange={e => setStrokeWidth(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <span className="text-xs font-mono text-text-primary w-6 text-center">{strokeWidth}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 p-2.5 rounded-lg border border-danger/30">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface-2 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            پاک‌سازی بوم
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              ذخیره در کتابخانه
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
