import React, { useState } from 'react';
import { X, Eye, EyeOff, Users, Copy, Check, FileText, Image as ImageIcon, Map as MapIcon, Share2, Tag } from 'lucide-react';
import { Handout, MapPin } from '../../types';
import { MobileImageViewer } from './MobileImageViewer';
import { MapViewer } from './MapViewer';

interface HandoutViewerModalProps {
  handout: Handout;
  isOpen: boolean;
  onClose: () => void;
  isDm?: boolean;
  onToggleReveal?: (handoutId: string, visibility: 'revealed' | 'hidden') => Promise<void>;
  onAddPin?: (pin: { x: number; y: number; label: string; note?: string; revealed: boolean }) => Promise<void>;
  onUpdatePin?: (pinId: string, updates: Partial<MapPin>) => Promise<void>;
  onDeletePin?: (pinId: string) => Promise<void>;
  characterNamesById?: Record<string, string>;
}

export const HandoutViewerModal: React.FC<HandoutViewerModalProps> = ({
  handout,
  isOpen,
  onClose,
  isDm = false,
  onToggleReveal,
  onAddPin,
  onUpdatePin,
  onDeletePin,
  characterNamesById = {},
}) => {
  const [copied, setCopied] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    if (!handout.body) return;
    try {
      await navigator.clipboard.writeText(handout.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleToggleVisibility = async (targetVisibility: 'revealed' | 'hidden') => {
    if (!onToggleReveal) return;
    setIsUpdatingVisibility(true);
    try {
      await onToggleReveal(handout.id, targetVisibility);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const kindLabel = {
    text: 'سند متنی',
    image: 'تصویر',
    map: 'نقشه تعاملی',
  }[handout.kind];

  const kindIcon = {
    text: <FileText className="w-4 h-4 text-[#E0A030]" />,
    image: <ImageIcon className="w-4 h-4 text-[#38BDF8]" />,
    map: <MapIcon className="w-4 h-4 text-[#4ADE80]" />,
  }[handout.kind];

  // Resolve media image URL (supports mediaUrl or fallback)
  const imageUrl = handout.mediaUrl || (handout.mediaId ? `/api/media/${handout.mediaId}` : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#14120E] border border-[#2F2A23] rounded-[20px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#2F2A23] bg-[#1A1612]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#241F18] border border-[#3A3327] flex items-center justify-center shrink-0">
              {kindIcon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#EDE6D8] truncate">{handout.title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-[#A39A89]">
                <span>{kindLabel}</span>
                {isDm && (
                  <>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        handout.visibility === 'revealed'
                          ? 'text-emerald-400'
                          : handout.visibility === 'selected'
                          ? 'text-sky-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {handout.visibility === 'revealed' && <Eye className="w-3 h-3" />}
                      {handout.visibility === 'selected' && <Users className="w-3 h-3" />}
                      {handout.visibility === 'hidden' && <EyeOff className="w-3 h-3" />}
                      {handout.visibility === 'revealed'
                        ? 'آشکار برای همه'
                        : handout.visibility === 'selected'
                        ? 'بازیکنان منتخب'
                        : 'مخفی از بازیکنان'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* DM Quick Reveal / Hide Action */}
            {isDm && onToggleReveal && (
              <button
                type="button"
                onClick={() => handleToggleVisibility(handout.visibility === 'revealed' ? 'hidden' : 'revealed')}
                disabled={isUpdatingVisibility}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition touch-target ${
                  handout.visibility === 'revealed'
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {handout.visibility === 'revealed' ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>مخفی‌سازی</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>آشکارسازی</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] bg-[#241F18] hover:bg-[#322A21] text-[#A39A89] hover:text-[#EDE6D8] flex items-center justify-center transition touch-target"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
          {/* Selected Recipients Info (if DM and selected) */}
          {isDm && handout.visibility === 'selected' && handout.recipients && handout.recipients.length > 0 && (
            <div className="p-2.5 bg-sky-950/30 border border-sky-800/40 rounded-[10px] text-xs text-sky-200 flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0 text-sky-400" />
              <span>
                آشکار شده برای:{' '}
                {handout.recipients.map(rId => characterNamesById[rId] || 'شخصیت بازیکن').join('، ')}
              </span>
            </div>
          )}

          {/* KIND: TEXT */}
          {handout.kind === 'text' && (
            <div className="relative p-5 sm:p-6 rounded-[14px] bg-[#1B1712] border border-[#3E3426] shadow-inner text-[#EDE6D8] space-y-3 font-serif">
              <div className="flex justify-between items-center pb-2 border-b border-[#2F271D]">
                <span className="text-[11px] text-[#A39A89] font-sans flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#E0A030]" />
                  متن سند / نامه
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-[6px] bg-[#262018] hover:bg-[#342C21] text-xs text-[#D5CDBC] flex items-center gap-1.5 transition touch-target"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                </button>
              </div>

              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap selection:bg-[#E0A030]/30 selection:text-white">
                {handout.body || 'بدون محتوای متنی.'}
              </div>
            </div>
          )}

          {/* KIND: IMAGE */}
          {handout.kind === 'image' && (
            <div className="w-full">
              {imageUrl ? (
                <MobileImageViewer
                  imageUrl={imageUrl}
                  alt={handout.title}
                />
              ) : (
                <div className="w-full h-48 bg-[#1B1712] rounded-[14px] border border-[#2F2A23] flex flex-col items-center justify-center text-[#A39A89] text-xs gap-2">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span>تصویری برای این سند آپلود نشده است.</span>
                </div>
              )}
            </div>
          )}

          {/* KIND: MAP */}
          {handout.kind === 'map' && (
            <div className="w-full">
              {imageUrl ? (
                <MapViewer
                  imageUrl={imageUrl}
                  pins={handout.pins || []}
                  isDm={isDm}
                  onAddPin={onAddPin}
                  onUpdatePin={onUpdatePin}
                  onDeletePin={onDeletePin}
                  title={handout.title}
                />
              ) : (
                <div className="w-full h-48 bg-[#1B1712] rounded-[14px] border border-[#2F2A23] flex flex-col items-center justify-center text-[#A39A89] text-xs gap-2">
                  <MapIcon className="w-8 h-8 opacity-40" />
                  <span>نقشه‌ای برای این سند بارگذاری نشده است.</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {handout.tags && handout.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#A39A89] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#E0A030]" />
                برچسب‌ها:
              </span>
              {handout.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-[6px] bg-[#241F18] border border-[#3A3327] text-[11px] text-[#D5CDBC]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
