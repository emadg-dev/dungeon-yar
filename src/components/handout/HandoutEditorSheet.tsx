import React, { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Map as MapIcon, Eye, EyeOff, Users, AlertCircle, Check } from 'lucide-react';
import { Handout, HandoutKind, HandoutVisibility } from '../../types';
import { compressImageToWebp, formatBytes, base64ToFile } from '../../utils/imageCompress';

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
  onUploadMedia,
}) => {
  const [title, setTitle] = useState(initialHandout?.title || '');
  const [kind, setKind] = useState<HandoutKind>(initialHandout?.kind || 'text');
  const [body, setBody] = useState(initialHandout?.body || '');
  const [mediaId, setMediaId] = useState<string | null>(initialHandout?.mediaId || null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(
    initialHandout?.mediaUrl || (initialHandout?.mediaId ? `/api/media/${initialHandout.mediaId}` : null)
  );
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
      setMediaPreviewUrl(res.mediaUrl || URL.createObjectURL(compressedFile));
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#14120E] border border-[#2F2A23] rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2F2A23] bg-[#1A1612]">
          <h2 className="text-base font-bold text-[#EDE6D8]">
            {initialHandout ? 'ویرایش سند یا نقشه' : 'افزودن سند یا نقشه جدید'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-[#241F18] hover:bg-[#322A21] text-[#A39A89] hover:text-[#EDE6D8] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[10px] text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Kind Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#A39A89] mb-1.5">نوع سند</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKind('text')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target ${
                  kind === 'text'
                    ? 'bg-[#E0A030]/15 border-[#E0A030] text-[#E0A030] font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89] hover:bg-[#252019]'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">سند متنی</span>
              </button>

              <button
                type="button"
                onClick={() => setKind('image')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target ${
                  kind === 'image'
                    ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8] font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89] hover:bg-[#252019]'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">تصویر</span>
              </button>

              <button
                type="button"
                onClick={() => setKind('map')}
                className={`py-2.5 px-3 rounded-[10px] border flex flex-col items-center gap-1.5 transition touch-target ${
                  kind === 'map'
                    ? 'bg-[#4ADE80]/15 border-[#4ADE80] text-[#4ADE80] font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89] hover:bg-[#252019]'
                }`}
              >
                <MapIcon className="w-5 h-5" />
                <span className="text-xs">نقشه با نشانگر</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A39A89] mb-1">
              عنوان سند / نقشه <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: نقشه سپیدارون، نامه خونین، پرتره جادوگر..."
              className="w-full px-3 py-2.5 bg-[#1C1813] border border-[#2F2A23] rounded-[10px] text-xs text-white focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          {/* Body for Text Kind */}
          {kind === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-[#A39A89] mb-1">متن یا محتوای سند</label>
              <textarea
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="متن کامل نامه، دست‌نوشته، کتیبه باستانی..."
                className="w-full px-3 py-2.5 bg-[#1C1813] border border-[#2F2A23] rounded-[10px] text-xs text-white focus:outline-none focus:border-[#E0A030] leading-relaxed resize-y font-serif"
              />
            </div>
          )}

          {/* File Upload for Image or Map */}
          {(kind === 'image' || kind === 'map') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#A39A89]">
                تصویر {kind === 'map' ? 'نقشه' : ''} (فشرده‌سازی خودکار WebP، حداکثر ۴۰۰ کیلوبایت)
              </label>

              <div className="border-2 border-dashed border-[#2F2A23] rounded-[14px] p-4 text-center hover:border-[#E0A030]/50 transition bg-[#1C1813]">
                {mediaPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={mediaPreviewUrl}
                      alt="پیش‌نمایش"
                      className="max-h-44 mx-auto rounded-[8px] object-contain border border-[#2F2A23]"
                    />
                    <label className="inline-block px-3 py-1.5 rounded-[8px] bg-[#2A241C] hover:bg-[#383126] text-xs text-[#EDE6D8] cursor-pointer touch-target transition">
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
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4 touch-target">
                    <div className="w-12 h-12 rounded-full bg-[#241F18] border border-[#3A3327] flex items-center justify-center text-[#E0A030]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-[#EDE6D8]">
                      انتخاب فایل تصویر یا نقشه
                    </span>
                    <span className="text-[11px] text-[#A39A89]">
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
                <div className="text-xs text-[#E0A030] flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#E0A030]" />
                  {compressionInfo}
                </div>
              )}
              {compressionInfo && !isCompressing && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {compressionInfo}
                </div>
              )}
            </div>
          )}

          {/* Visibility Options */}
          <div>
            <label className="block text-xs font-semibold text-[#A39A89] mb-1.5">وضعیت انتشار و دسترسی</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('hidden')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target ${
                  visibility === 'hidden'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-xs">مخفی (DM)</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('revealed')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target ${
                  visibility === 'revealed'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs">آشکار (همه)</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('selected')}
                className={`p-2.5 rounded-[10px] border flex flex-col items-center gap-1 transition touch-target ${
                  visibility === 'selected'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold'
                    : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">بازیکنان منتخب</span>
              </button>
            </div>
          </div>

          {/* If Selected: choose recipients */}
          {visibility === 'selected' && (
            <div className="p-3 bg-[#1C1813] border border-sky-800/40 rounded-[12px] space-y-2">
              <span className="text-xs font-semibold text-sky-300 block">
                انتخاب شخصیت‌های مجاز به دیدن این سند:
              </span>
              {campaignCharacters.length === 0 ? (
                <p className="text-xs text-[#A39A89] italic">هنوز شخصیتی در کمپین ثبت نشده است.</p>
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
                            : 'bg-[#14120E] border-[#2F2A23] text-[#A39A89]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRecipient(char.id)}
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-[#14120E] border-[#2F2A23]"
                        />
                        <span className="text-xs font-medium truncate">{char.name}</span>
                        {char.playerName && (
                          <span className="text-[10px] text-[#A39A89]">({char.playerName})</span>
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
            <label className="block text-xs font-semibold text-[#A39A89] mb-1">
              برچسب‌ها (با ویرگول یا کاما جدا کنید)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="مثال: نقشه، مخفیگاه، سپیدارون، نامه"
              className="w-full px-3 py-2 bg-[#1C1813] border border-[#2F2A23] rounded-[10px] text-xs text-white focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2F2A23]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[10px] bg-[#241F18] text-xs font-medium text-[#EDE6D8] hover:bg-[#322A21] transition touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompressing || !title.trim()}
              className="px-5 py-2.5 rounded-[10px] bg-[#E0A030] hover:bg-[#F2C265] text-xs font-bold text-[#14120E] transition touch-target disabled:opacity-40 shadow-lg"
            >
              {isSaving ? 'در حال ذخیره‌سازی...' : initialHandout ? 'ذخیره تغییرات' : 'ایجاد سند'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
