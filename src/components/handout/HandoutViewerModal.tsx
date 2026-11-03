import { Button } from '../ui/Button';
import React, { useState } from 'react';
import { X, Eye, EyeOff, Users, Copy, Check, FileText, Image as ImageIcon, Map as MapIcon, Share2, Tag } from 'lucide-react';
import { Handout, MapPin } from '../../types';
import { MobileImageViewer } from './MobileImageViewer';
import { MapViewer } from './MapViewer';
import { BottomSheet } from '../mobile/BottomSheet';

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
    text: <FileText className="w-4 h-4 text-accent" />,
    image: <ImageIcon className="w-4 h-4 text-info" />,
    map: <MapIcon className="w-4 h-4 text-success" />,
  }[handout.kind];

  // Resolve media image URL (supports mediaUrl or fallback)
  const imageUrl = handout.mediaUrl || (handout.mediaId ? `/api/media/${handout.mediaId}` : '');

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
            {kindIcon}
          </div>
          <h2 className="text-sm font-bold text-text-primary truncate">{handout.title}</h2>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{kindLabel}</span>
          {isDm && (
            <>
              <span>•</span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  handout.visibility === 'revealed'
                    ? 'text-success'
                    : handout.visibility === 'selected'
                    ? 'text-info'
                    : 'text-danger'
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
      }
      headerExtra={
        isDm && onToggleReveal ? (
          <Button
            type="button"
            onClick={() => handleToggleVisibility(handout.visibility === 'revealed' ? 'hidden' : 'revealed')}
            disabled={isUpdatingVisibility}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition touch-target min-w-[44px] ${
              handout.visibility === 'revealed'
                ? 'bg-danger/20 text-danger hover:bg-danger/30'
                : 'bg-success/20 text-success hover:bg-success/30'
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
          </Button>
        ) : undefined
      }
      maxWidth="max-w-3xl"
      fullHeight={handout.kind === 'map' || handout.kind === 'image'}
    >
      <div className="space-y-4">
          {/* Selected Recipients Info (if DM and selected) */}
          {isDm && handout.visibility === 'selected' && handout.recipients && handout.recipients.length > 0 && (
            <div className="p-2.5 bg-info/10 border border-info/30 rounded-[10px] text-xs text-info flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0 text-info" />
              <span>
                آشکار شده برای:{' '}
                {handout.recipients.map(rId => characterNamesById[rId] || 'شخصیت بازیکن').join('، ')}
              </span>
            </div>
          )}

          {/* KIND: TEXT */}
          {handout.kind === 'text' && (
            <div className="relative p-5 sm:p-6 rounded-[14px] bg-surface border border-border-strong shadow-inner text-text-primary space-y-3 font-serif">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs text-text-muted font-sans flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  متن سند / نامه
                </span>
                <Button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-[6px] bg-surface-2 hover:bg-surface-3 text-xs text-text-muted flex items-center gap-1.5 transition touch-target min-w-[44px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                </Button>
              </div>

              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap selection:bg-accent/30 selection:text-white">
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
                <div className="w-full h-48 bg-surface rounded-[14px] border border-border flex flex-col items-center justify-center text-text-muted text-xs gap-2">
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
                <div className="w-full h-48 bg-surface rounded-[14px] border border-border flex flex-col items-center justify-center text-text-muted text-xs gap-2">
                  <MapIcon className="w-8 h-8 opacity-40" />
                  <span>نقشه‌ای برای این سند بارگذاری نشده است.</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {handout.tags && handout.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Tag className="w-3 h-3 text-accent" />
                برچسب‌ها:
              </span>
              {handout.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-[6px] bg-surface-2 border border-border text-xs text-text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
      </div>
    </BottomSheet>
  );
};
