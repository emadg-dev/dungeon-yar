import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Paintbrush,
  Plus,
  Trash2,
  Check,
  X,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import type { MapStamp } from '../../types';
import { api } from '../../services/api';
import { validateStampUploadFile, MAX_STAMP_BYTES } from '../../../shared/rules/mapEngine';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Dialog } from '../ui/Dialog';
import { Spinner } from '../ui/Spinner';
import { StampCanvasDrawer } from './StampCanvasDrawer';

export interface StampLibraryModalProps {
  isOpen: boolean;
  campaignId: string;
  onClose: () => void;
  onSelectStampForPlacement: (stamp: MapStamp, scale: number) => void;
}

export const StampLibraryModal: React.FC<StampLibraryModalProps> = ({
  isOpen,
  campaignId,
  onClose,
  onSelectStampForPlacement
}) => {
  const [stamps, setStamps] = useState<MapStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStamps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await api.getMapStamps(campaignId);
      setStamps(list);
      if (list.length > 0 && !selectedStampId) {
        setSelectedStampId(list[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری لیست المان‌ها.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, selectedStampId]);

  useEffect(() => {
    if (isOpen) {
      loadStamps();
    }
  }, [isOpen, loadStamps]);

  // Client-side compression & upload handler for PNG/JPEG/WebP
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      // 1. Read buffer to test magic bytes and validate
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const val = validateStampUploadFile(file.name, file.size, bytes);
      if (!val.valid) {
        throw new Error(val.error);
      }

      // 2. Client-side canvas compression/resizing if over 150KB or high-res
      let uploadFile: File = file;
      if (file.size > MAX_STAMP_BYTES) {
        uploadFile = await compressStampToSize(file, MAX_STAMP_BYTES);
      }

      // 3. Upload media
      const mediaResult = await api.uploadMedia(uploadFile);

      // 4. Register stamp in campaign library
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'المان جدید';
      const newStamp = await api.createMapStamp(campaignId, {
        name: cleanName,
        mediaId: mediaResult.mediaId,
        imageUrl: mediaResult.url || `/api/media/${mediaResult.mediaId}`,
        width: 128,
        height: 128
      });

      setStamps(prev => [newStamp, ...prev]);
      setSelectedStampId(newStamp.id);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری و ثبت المان.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Canvas Hand-drawn Save Handler
  const handleSaveCanvasStamp = async (data: { blob: Blob; name: string; width: number; height: number }) => {
    const file = new File([data.blob], `${data.name}.png`, { type: 'image/png' });
    const mediaResult = await api.uploadMedia(file);

    const newStamp = await api.createMapStamp(campaignId, {
      name: data.name,
      mediaId: mediaResult.mediaId,
      imageUrl: mediaResult.url || `/api/media/${mediaResult.mediaId}`,
      width: data.width,
      height: data.height
    });

    setStamps(prev => [newStamp, ...prev]);
    setSelectedStampId(newStamp.id);
  };

  const handleDeleteStamp = async (stampId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteMapStamp(campaignId, stampId);
      setStamps(prev => prev.filter(s => s.id !== stampId));
      if (selectedStampId === stampId) {
        setSelectedStampId(null);
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در حذف المان.');
    }
  };

  const handleConfirmPlacement = () => {
    const stamp = stamps.find(s => s.id === selectedStampId);
    if (!stamp) return;
    onSelectStampForPlacement(stamp, scale);
    onClose();
  };

  const selectedStamp = stamps.find(s => s.id === selectedStampId);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="کتابخانه‌ی المان‌های نقشه (Stamps)"
        description="المان‌های دلخواه (دژ، برج، پرچم) را آپلود کنید یا با دست بکشید و روی نقشه بچینید."
        maxWidth="lg"
      >
        <div className="space-y-4 py-2" dir="rtl">
          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4 text-accent" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              آپلود تصویر (PNG, WebP)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Paintbrush className="w-4 h-4 text-accent" />}
              onClick={() => setIsCanvasOpen(true)}
            >
              نقاشی دستی المان
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Stamps Grid */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Spinner size="md" />
              <span className="text-xs text-text-muted mt-2">در حال دریافت المان‌ها...</span>
            </div>
          ) : stamps.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl bg-surface-2 p-6">
              <ImageIcon className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-text-primary">هنوز هیچ المانی ثبت نشده است.</p>
              <p className="text-xs text-text-muted mt-1">
                یک تصویر PNG/WebP آپلود کنید یا با بوم نقاشی یک المان شخصی خلق نمایید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
              {stamps.map(stamp => {
                const isSelected = stamp.id === selectedStampId;
                const isCustom = stamp.campaignId === campaignId;

                return (
                  <div
                    key={stamp.id}
                    onClick={() => setSelectedStampId(stamp.id)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent/30'
                        : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3'
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center mb-2">
                      <img
                        src={stamp.imageUrl || '/stamps/fortress.svg'}
                        alt={stamp.name}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-xs font-semibold text-text-primary text-center truncate w-full">
                      {stamp.name}
                    </span>

                    {/* Delete action for custom stamps */}
                    {isCustom && (
                      <button
                        type="button"
                        aria-label="حذف المان"
                        onClick={e => handleDeleteStamp(stamp.id, e)}
                        className="absolute top-1.5 start-1.5 p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Scale Slider for selected stamp */}
          {selectedStamp && (
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-accent" />
                  اندازه / مقیاس پیش‌فرض المان روی نقشه:
                </span>
                <span className="font-mono text-accent font-bold dir-ltr">
                  {scale.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={3.0}
                step={0.1}
                value={scale}
                onChange={e => setScale(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button variant="secondary" size="md" onClick={onClose}>
              بستن
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!selectedStampId}
              onClick={handleConfirmPlacement}
              leftIcon={<Check className="w-4 h-4" />}
            >
              انتخاب و درج روی نقشه
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Hand-drawn Canvas Drawer */}
      <StampCanvasDrawer
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={handleSaveCanvasStamp}
      />
    </>
  );
};

/**
 * Resizes/compresses an image file with Canvas if larger than 150KB.
 */
async function compressStampToSize(file: File, maxBytes: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویری'));

    img.onload = () => {
      const maxDim = 256;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob || blob.size > maxBytes) {
            // Try PNG or WebP with reduced dimensions
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.round(width * 0.7);
            smallerCanvas.height = Math.round(height * 0.7);
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
              smallerCanvas.toBlob(sBlob => {
                if (sBlob && sBlob.size <= maxBytes) {
                  resolve(new File([sBlob], file.name.replace(/\.[^/.]+$/, '') + '.png', { type: 'image/png' }));
                } else {
                  reject(new Error('امکان فشرده‌سازی تصویر به زیر ۱۵۰ کیلوبایت میسر نشد. لطفاً تصویر کوچک‌تری انتخاب کنید.'));
                }
              }, 'image/png');
              return;
            }
          }
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.png', { type: 'image/png' }));
          } else {
            resolve(file);
          }
        },
        'image/png'
      );
    };

    reader.readAsDataURL(file);
  });
}
