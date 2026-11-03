import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Map as MapIcon, Eye, EyeOff, Users, AlertCircle, Check } from 'lucide-react';
import { Handout, HandoutKind, HandoutVisibility } from '../../types';
import { compressImageToWebp, formatBytes, base64ToFile } from '../../utils/imageCompress';
import { BottomSheet } from '../mobile/BottomSheet';

interface HandoutEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  initialHandout?: Handout | null;
  campaignCharacters?: { id: string; name: string; playerName?: string }[];
  onSave: (payload: {
    id?: string;
    title: string;
    kind: HandoutKind;
    body?: string;
    mediaId?: string | null;
    visibility: HandoutVisibility;
    tags?: string[];
    recipients?: string[];
  }) => Promise<void>;
  onUploadMedia: (file: File) => Promise<{ mediaId: string; mediaUrl?: string }>;
}

export const HandoutEditorSheet: React.FC<HandoutEditorSheetProps> = ({
  isOpen,
  onClose,
  campaignId,
  initialHandout,
  campaignCharacters = [],
  onSave,
  onUploadMedia
}) => {
  const [title, setTitle] = useState(initialHandout?.title || '');
  const [kind, setKind] = useState<HandoutKind>(initialHandout?.kind || 'text');
  const [body, setBody] = useState(initialHandout?.body || '');
  const [mediaId, setMediaId] = useState<string | null>(initialHandout?.mediaId || null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(
    initialHandout?.mediaUrl || (initialHandout?.mediaId ? `/api/media/${initialHandout.mediaId}` : null)
  );
  const createdObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (createdObjectUrlRef.current) {
        URL.revokeObjectURL(createdObjectUrlRef.current);
        createdObjectUrlRef.current = null;
      }
    };
  }, []);

  const [visibility, setVisibility] = useState<HandoutVisibility>(initialHandout?.visibility || 'hidden');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(initialHandout?.recipients || []);
  const [tagsInput, setTagsInput] = useState((initialHandout?.tags || []).join('، '));

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsCompressing(true);
    setCompressionInfo('در حال فشرده‌سازی WebP و بهینه‌سازی حجم...');

    try {
      // Client-side WebP compression enforcing 400 KB cap
      const compressed = await compressImageToWebp(file, file.name);
      const compressedFile = base64ToFile(compressed);

      setCompressionInfo(`بهینه‌سازی موفق: حجم ${formatBytes(compressedFile.size)} (زیر ۴۰۰ کیلوبایت)`);

      // Upload media
      const res = await onUploadMedia(compressedFile);
      setMediaId(res.mediaId);
      if (createdObjectUrlRef.current) {
        URL.revokeObjectURL(createdObjectUrlRef.current);
      }
      if (res.mediaUrl) {
        setMediaPreviewUrl(res.mediaUrl);
      } else {
        const objUrl = URL.createObjectURL(compressedFile);
        createdObjectUrlRef.current = objUrl;
        setMediaPreviewUrl(objUrl);
      }
    } catch (err: any) {
      setUploadError(err.message || 'خطا در فشرده‌سازی یا آپلود تصویر');
      setCompressionInfo(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleToggleRecipient = (charId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if ((kind === 'image' || kind === 'map') && !mediaId && !mediaPreviewUrl) {
      setUploadError('لطفاً یک تصویر یا فایل نقشه آپلود کنید.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    const parsedTags = tagsInput
      .split(/[,،]+/)
      .map(t => t.trim())
      .filter(Boolean);

    try {
      await onSave({
        id: initialHandout?.id,
        title: title.trim(),
        kind,
        body: kind === 'text' ? body.trim() : undefined,
        mediaId,
        visibility,
        tags: parsedTags,
        recipients: visibility === 'selected' ? selectedRecipients : [],
      });
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'خطا در ذخیره‌سازی سند');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialHandout ? 'ویرایش سند یا نقشه' : 'افزودن سند یا نقشه جدید'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-start">
          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[10px] text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Kind Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">نوع سند</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKind('text')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target min-w-[44px] ${
                  kind === 'text'
                    ? 'bg-accent/15 border-accent text-accent font-bold'
                    : 'bg-surface border-border text-text-muted hover:bg-surface-2'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">سند متنی</span>
              </button>

              <button
                type="button"
                onClick={() => setKind('image')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target min-w-[44px] ${
                  kind === 'image'
                    ? 'bg-info/15 border-info text-info font-bold'
                    : 'bg-surface border-border text-text-muted hover:bg-surface-2'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">تصویر</span>
              </button>

              <button
                type="button"
                onClick={() => setKind('map')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target min-w-[44px] ${
                  kind === 'map'
                    ? 'bg-success/15 border-success text-success font-bold'
                    : 'bg-surface border-border text-text-muted hover:bg-surface-2'
                }`}
              >
                <MapIcon className="w-5 h-5" />
                <span className="text-xs">نقشه با نشانگر</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              عنوان سند / نقشه <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: نقشه سپیدارون، نامه خونین، پرتره جادوگر..."
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-[10px] text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          {/* Body for Text Kind */}
          {kind === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">متن یا محتوای سند</label>
              <textarea
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="متن کامل نامه، دست‌نوشته، کتیبه باستانی..."
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-[10px] text-xs text-white focus:outline-none focus:border-accent leading-relaxed resize-y font-serif"
              />
            </div>
          )}

          {/* File Upload for Image or Map */}
          {(kind === 'image' || kind === 'map') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-muted">
                تصویر {kind === 'map' ? 'نقشه' : ''} (فشرده‌سازی خودکار WebP، حداکثر ۴۰۰ کیلوبایت)
              </label>

              <div className="border-2 border-dashed border-border rounded-[14px] p-4 text-center hover:border-accent/50 transition bg-surface">
                {mediaPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={mediaPreviewUrl}
                      alt="پیش‌نمایش"
                      loading="lazy"
                      decoding="async"
                      width={320}
                      height={176}
                      className="max-h-44 mx-auto rounded-[8px] object-contain border border-border"
                    />
                    <label className="inline-block px-3 py-1.5 rounded-[8px] bg-surface-2 hover:bg-surface-3 text-xs text-text-primary cursor-pointer touch-target min-w-[44px] transition">
                      تغییر تصویر
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4 touch-target min-w-[44px]">
                    <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center text-accent">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-text-primary">
                      انتخاب فایل تصویر یا نقشه
                    </span>
                    <span className="text-xs text-text-muted">
                      PNG, JPG, WebP - با فشرده‌سازی خودکار بهینه‌شده
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {isCompressing && (
                <div className="text-xs text-accent flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {compressionInfo}
                </div>
              )}
              {compressionInfo && !isCompressing && (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {compressionInfo}
                </div>
              )}
            </div>
          )}

          {/* Visibility Options */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">وضعیت انتشار و دسترسی</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('hidden')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target min-w-[44px] ${
                  visibility === 'hidden'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-bold'
                    : 'bg-surface border-border text-text-muted'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-xs">مخفی (DM)</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('revealed')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target min-w-[44px] ${
                  visibility === 'revealed'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-surface border-border text-text-muted'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs">آشکار (همه)</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('selected')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target min-w-[44px] ${
                  visibility === 'selected'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                    : 'bg-surface border-border text-text-muted'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">بازیکنان منتخب</span>
              </button>
            </div>
          </div>

          {/* If Selected: choose recipients */}
          {visibility === 'selected' && (
            <div className="p-3 bg-surface border border-sky-800/40 rounded-[12px] space-y-2">
              <span className="text-xs font-semibold text-sky-300 block">
                انتخاب شخصیت‌های مجاز به دیدن این سند:
              </span>
              {campaignCharacters.length === 0 ? (
                <p className="text-xs text-text-muted italic">هنوز شخصیتی در کمپین ثبت نشده است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {campaignCharacters.map(char => {
                    const isChecked = selectedRecipients.includes(char.id);
                    return (
                      <label
                        key={char.id}
                        className={`flex items-center gap-2 p-2 rounded-[8px] border cursor-pointer transition ${
                          isChecked
                            ? 'bg-sky-950/40 border-sky-600/50 text-white'
                            : 'bg-bg border-border text-text-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRecipient(char.id)}
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-bg border-border"
                        />
                        <span className="text-xs font-medium truncate">{char.name}</span>
                        {char.playerName && (
                          <span className="text-xs text-text-muted">({char.playerName})</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              برچسب‌ها (با ویرگول یا کاما جدا کنید)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="مثال: نقشه، مخفیگاه، سپیدارون، نامه"
              className="w-full px-3 py-2 bg-surface border border-border rounded-[10px] text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[10px] bg-surface-2 text-xs font-medium text-text-primary hover:bg-surface-3 transition touch-target min-w-[44px]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompressing || !title.trim()}
              className="px-5 py-2.5 rounded-[10px] bg-accent hover:bg-accent-hover text-xs font-bold text-on-accent transition touch-target min-w-[44px] disabled:opacity-40 shadow-lg"
            >
              {isSaving ? 'در حال ذخیره‌سازی...' : initialHandout ? 'ذخیره تغییرات' : 'ایجاد سند'}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
};
