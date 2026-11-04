import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Image as ImageIcon, Map as MapIcon, Plus, Search,
  Eye, EyeOff, Users, ArrowUp, ArrowDown, Edit2, Trash2, MapPin,
  ExternalLink, MoreVertical, X
} from 'lucide-react';
import { Handout, HandoutKind, HandoutVisibility, MapPin as MapPinType } from '../../types';
import { api } from '../../services/api';
import { HandoutEditorSheet } from '../handout/HandoutEditorSheet';
import { HandoutViewerModal } from '../handout/HandoutViewerModal';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { Badge, IconButton, StickyFooter, pillCls, inputCls, primaryBtnCls, secondaryBtnCls } from '../ui/FormLayout';

interface DmHandoutManagerProps {
  campaignId: string;
  campaignCharacters?: { id: string; name: string; playerName?: string }[];
  isCompact?: boolean; // For encounter quick-reveal panel
  onCloseCompact?: () => void;
}

/** Overflow menu for the less frequent row actions (native <details>, no extra dependency). */
const RowMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <details className="relative">
    <summary
      aria-label="عملیات بیشتر"
      title="عملیات بیشتر"
      className="list-none min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 cursor-pointer"
    >
      <MoreVertical className="w-4 h-4" />
    </summary>
    <div className="absolute end-0 mt-1 z-20 min-w-[12rem] rounded-xl border border-border bg-surface shadow-lg p-1">
      {children}
    </div>
  </details>
);

const MenuItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, onClick, danger, children }) => (
  <button
    type="button"
    onClick={e => {
      (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
      onClick();
    }}
    className={`w-full min-h-[44px] px-3 rounded-lg flex items-center gap-2 text-sm text-start hover:bg-surface-2 ${
      danger ? 'text-danger' : 'text-text-primary'
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span>{children}</span>
  </button>
);

export const DmHandoutManager: React.FC<DmHandoutManagerProps> = ({
  campaignId,
  campaignCharacters = [],
  isCompact = false,
  onCloseCompact,
}) => {
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | HandoutKind>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingHandout, setEditingHandout] = useState<Handout | null>(null);
  const [viewingHandout, setViewingHandout] = useState<Handout | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [recipientModalHandout, setRecipientModalHandout] = useState<Handout | null>(null);
  const [tempRecipients, setTempRecipients] = useState<string[]>([]);

  const loadHandouts = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.listHandouts(campaignId, { includeHidden: true });
      list.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
      setHandouts(list);
    } catch (err: any) {
      console.error('Failed to load handouts:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadHandouts();
  }, [loadHandouts]);

  const characterNamesById = campaignCharacters.reduce((acc, c) => {
    acc[c.id] = c.name + (c.playerName ? ` (${c.playerName})` : '');
    return acc;
  }, {} as Record<string, string>);

  const handleQuickReveal = async (handout: Handout) => {
    try {
      await api.revealHandout(campaignId, handout.id, 'revealed');
      await loadHandouts();
      if (viewingHandout?.id === handout.id) setViewingHandout(prev => (prev ? { ...prev, visibility: 'revealed' } : null));
    } catch (err: any) {
      setActionError(err.message || 'خطا در آشکارسازی');
    }
  };

  const handleQuickHide = async (handout: Handout) => {
    try {
      await api.revealHandout(campaignId, handout.id, 'hidden');
      await loadHandouts();
      if (viewingHandout?.id === handout.id) setViewingHandout(prev => (prev ? { ...prev, visibility: 'hidden' } : null));
    } catch (err: any) {
      setActionError(err.message || 'خطا در مخفی‌سازی');
    }
  };

  const handleOpenRecipientModal = (handout: Handout) => {
    setRecipientModalHandout(handout);
    setTempRecipients(handout.recipients || []);
  };

  const handleSaveRecipients = async () => {
    if (!recipientModalHandout) return;
    try {
      await api.revealHandout(campaignId, recipientModalHandout.id, 'selected', tempRecipients);
      setRecipientModalHandout(null);
      await loadHandouts();
    } catch (err: any) {
      setActionError(err.message || 'خطا در به‌روزرسانی گیرندگان');
    }
  };

  // index is the position in the FULL list (not the filtered one)
  const handleMoveSort = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= handouts.length) return;

    const current = handouts[index];
    const target = handouts[targetIndex];
    const currentSort = current.sortIndex ?? index;
    const targetSort = target.sortIndex ?? targetIndex;

    try {
      await api.updateHandout(campaignId, current.id, { sortIndex: targetSort });
      await api.updateHandout(campaignId, target.id, { sortIndex: currentSort });
      await loadHandouts();
    } catch (err: any) {
      console.error('Failed to swap sortIndex:', err);
    }
  };

  const handleDeleteHandout = async (id: string) => {
    if (!window.confirm('این سند یا نقشه حذف شود؟ این کار قابل بازگشت نیست.')) return;
    try {
      await api.deleteHandout(campaignId, id);
      if (viewingHandout?.id === id) setViewingHandout(null);
      await loadHandouts();
    } catch (err: any) {
      setActionError(err.message || 'خطا در حذف سند');
    }
  };

  const handleAddPin = async (pinData: { x: number; y: number; label: string; note?: string; revealed: boolean }) => {
    if (!viewingHandout) return;
    const newPin = await api.createMapPin(campaignId, viewingHandout.id, pinData);
    setViewingHandout(prev => (prev ? { ...prev, pins: [...(prev.pins || []), newPin] } : null));
    setHandouts(prev => prev.map(h => (h.id === viewingHandout.id ? { ...h, pins: [...(h.pins || []), newPin] } : h)));
  };

  const handleUpdatePin = async (pinId: string, updates: Partial<MapPinType>) => {
    if (!viewingHandout) return;
    const updated = await api.updateMapPin(campaignId, viewingHandout.id, pinId, updates);
    setViewingHandout(prev => (prev ? { ...prev, pins: (prev.pins || []).map(p => (p.id === pinId ? updated : p)) } : null));
    setHandouts(prev =>
      prev.map(h =>
        h.id === viewingHandout.id ? { ...h, pins: (h.pins || []).map(p => (p.id === pinId ? updated : p)) } : h
      )
    );
  };

  const handleDeletePin = async (pinId: string) => {
    if (!viewingHandout) return;
    await api.deleteMapPin(campaignId, viewingHandout.id, pinId);
    setViewingHandout(prev => (prev ? { ...prev, pins: (prev.pins || []).filter(p => p.id !== pinId) } : null));
    setHandouts(prev =>
      prev.map(h => (h.id === viewingHandout.id ? { ...h, pins: (h.pins || []).filter(p => p.id !== pinId) } : h))
    );
  };

  const handleSaveHandout = async (payload: {
    id?: string;
    title: string;
    kind: HandoutKind;
    body?: string;
    mediaId?: string | null;
    visibility: HandoutVisibility;
    tags?: string[];
    recipients?: string[];
  }) => {
    if (payload.id) {
      await api.updateHandout(campaignId, payload.id, {
        title: payload.title,
        body: payload.body,
        mediaId: payload.mediaId,
        visibility: payload.visibility,
        tags: payload.tags,
        recipients: payload.recipients,
      });
    } else {
      await api.createHandout(campaignId, {
        title: payload.title,
        kind: payload.kind,
        body: payload.body,
        mediaId: payload.mediaId,
        visibility: payload.visibility,
        tags: payload.tags,
        recipients: payload.recipients,
      });
    }
    await loadHandouts();
  };

  const handleUploadMedia = async (file: File) => {
    const res = await api.uploadMedia(file, campaignId);
    return { mediaId: res.mediaId || res.id, mediaUrl: res.mediaUrl || res.url };
  };

  const allTags = Array.from(new Set(handouts.flatMap(h => h.tags || [])));
  const filtersActive = kindFilter !== 'all' || !!selectedTag || !!searchQuery.trim();
  const filteredHandouts = handouts.filter(h => {
    if (kindFilter !== 'all' && h.kind !== kindFilter) return false;
    if (selectedTag && !(h.tags || []).includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hit =
        h.title.toLowerCase().includes(q) ||
        (h.body || '').toLowerCase().includes(q) ||
        (h.tags || []).some(t => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  const kindFilters: Array<{ id: 'all' | HandoutKind; label: string }> = [
    { id: 'all', label: `همه (${handouts.length})` },
    { id: 'map', label: 'نقشه‌ها' },
    { id: 'image', label: 'تصاویر' },
    { id: 'text', label: 'متون' },
  ];

  return (
    <div className={`space-y-4 ${isCompact ? 'p-2' : ''}`} dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-text-primary flex items-center gap-2`}>
            <MapIcon className="w-5 h-5 text-accent" aria-hidden />
            <span>اسناد و نقشه‌ها</span>
          </h2>
          {!isCompact && (
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              نامه‌ها، تصاویر و نقشه‌های تعاملی را مدیریت کنید و تعیین کنید چه کسی ببیند.
            </p>
          )}
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingHandout(null);
            setIsEditorOpen(true);
          }}
          className={`${primaryBtnCls} shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span>سند جدید</span>
        </Button>
      </div>

      {actionError && (
        <div role="alert" className="ps-3 pe-1 rounded-lg bg-danger/15 border border-danger/30 text-sm text-danger flex items-center justify-between gap-2">
          <span className="py-2.5">{actionError}</span>
          <IconButton label="بستن پیام" onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {/* Search + filters (no wrapper card) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
          <Input noWrapper
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، متن یا برچسب"
            aria-label="جستجو در اسناد"
            className={`${inputCls} ps-10`}
          />
        </div>

        <ScrollableRow activeKey={kindFilter} className="items-center gap-2 pb-1">
          {kindFilters.map(f => (
            <Button key={f.id} type="button" data-scroll-key={f.id} onClick={() => setKindFilter(f.id)} className={pillCls(kindFilter === f.id)}>
              {f.label}
            </Button>
          ))}
        </ScrollableRow>

        {allTags.length > 0 && (
          <ScrollableRow activeKey={selectedTag ?? ''} className="items-center gap-2 pb-1">
            {allTags.map(tag => (
              <Button
                key={tag}
                type="button"
                data-scroll-key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 min-h-[36px] rounded-full text-sm whitespace-nowrap shrink-0 border transition ${
                  selectedTag === tag
                    ? 'bg-accent/15 text-accent-hover border-accent'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
                }`}
              >
                #{tag}
              </Button>
            ))}
          </ScrollableRow>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-text-muted animate-pulse">در حال بارگذاری...</div>
      ) : filteredHandouts.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <MapIcon className="w-8 h-8 mx-auto text-text-muted opacity-50" aria-hidden />
          <h3 className="text-base font-bold text-text-primary">سندی پیدا نشد</h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            {handouts.length === 0
              ? 'هنوز سندی نساخته‌اید. با «سند جدید» شروع کنید.'
              : 'هیچ سندی با این فیلترها مطابقت ندارد.'}
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
          {filteredHandouts.map(handout => {
            const fullIndex = handouts.findIndex(h => h.id === handout.id);
            const kindIcon = {
              text: <FileText className="w-5 h-5 text-accent" />,
              image: <ImageIcon className="w-5 h-5 text-info" />,
              map: <MapIcon className="w-5 h-5 text-success" />,
            }[handout.kind];

            const isRevealed = handout.visibility === 'revealed';
            const isSelected = handout.visibility === 'selected';

            return (
              <li key={handout.id} className="p-2 sm:p-3 flex items-center gap-2">
                {/* Main area: opens the viewer */}
                <button
                  type="button"
                  onClick={() => setViewingHandout(handout)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-start rounded-lg p-1 hover:bg-surface-2 transition"
                >
                  <span className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {handout.mediaUrl || handout.mediaId ? (
                      <img
                        src={handout.mediaUrl || `/api/media/${handout.mediaId}`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      kindIcon
                    )}
                  </span>

                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-bold text-text-primary truncate">{handout.title}</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      <Badge tone={isRevealed ? 'success' : isSelected ? 'info' : 'neutral'}
                        icon={isRevealed ? Eye : isSelected ? Users : EyeOff}>
                        {isRevealed ? 'آشکار برای همه' : isSelected ? `${(handout.recipients || []).length} بازیکن` : 'مخفی'}
                      </Badge>
                      {handout.kind === 'map' && (
                        <Badge icon={MapPin}>{(handout.pins || []).length} نشانگر</Badge>
                      )}
                      {handout.tags && handout.tags.length > 0 && (
                        <span className="text-xs text-text-muted truncate">{handout.tags.map(t => `#${t}`).join(' ')}</span>
                      )}
                    </span>
                  </span>
                </button>

                {/* One primary action per row + overflow menu */}
                <Button
                  type="button"
                  onClick={() => (isRevealed ? handleQuickHide(handout) : handleQuickReveal(handout))}
                  title={isRevealed ? 'مخفی‌سازی از بازیکنان' : 'آشکارسازی فوری برای همه'}
                  className={`min-h-[44px] px-3 rounded-lg text-sm font-medium border inline-flex items-center gap-1.5 shrink-0 transition ${
                    isRevealed
                      ? 'bg-surface-2 text-text-primary border-border hover:border-border-strong'
                      : 'bg-success/15 text-success border-success/40 hover:bg-success/25'
                  }`}
                >
                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isRevealed ? 'مخفی کردن' : 'آشکارسازی'}</span>
                </Button>

                <RowMenu>
                  <MenuItem icon={Users} onClick={() => handleOpenRecipientModal(handout)}>انتخاب بازیکنان</MenuItem>
                  <MenuItem icon={ExternalLink} onClick={() => setViewingHandout(handout)}>مشاهده و نشانگرها</MenuItem>
                  <MenuItem icon={Edit2} onClick={() => { setEditingHandout(handout); setIsEditorOpen(true); }}>ویرایش مشخصات</MenuItem>
                  {!filtersActive && fullIndex > 0 && (
                    <MenuItem icon={ArrowUp} onClick={() => handleMoveSort(fullIndex, 'up')}>انتقال به بالا</MenuItem>
                  )}
                  {!filtersActive && fullIndex < handouts.length - 1 && (
                    <MenuItem icon={ArrowDown} onClick={() => handleMoveSort(fullIndex, 'down')}>انتقال به پایین</MenuItem>
                  )}
                  <MenuItem icon={Trash2} danger onClick={() => handleDeleteHandout(handout.id)}>حذف</MenuItem>
                </RowMenu>
              </li>
            );
          })}
        </ul>
      )}

      {isEditorOpen && (
        <HandoutEditorSheet
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          campaignId={campaignId}
          initialHandout={editingHandout}
          campaignCharacters={campaignCharacters}
          onSave={handleSaveHandout}
          onUploadMedia={handleUploadMedia}
        />
      )}

      {viewingHandout && (
        <HandoutViewerModal
          isOpen={Boolean(viewingHandout)}
          onClose={() => setViewingHandout(null)}
          handout={viewingHandout}
          isDm={true}
          onToggleReveal={async (hId, vis) => {
            await api.revealHandout(campaignId, hId, vis);
            setViewingHandout(prev => (prev ? { ...prev, visibility: vis } : null));
            await loadHandouts();
          }}
          onAddPin={handleAddPin}
          onUpdatePin={handleUpdatePin}
          onDeletePin={handleDeletePin}
          characterNamesById={characterNamesById}
        />
      )}

      {recipientModalHandout && (
        <BottomSheet
          isOpen={true}
          onClose={() => setRecipientModalHandout(null)}
          title={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              <span>گیرندگان «{recipientModalHandout.title}»</span>
            </div>
          }
          subtitle="شخصیت‌های انتخاب‌شده این سند را در بخش اسناد خود می‌بینند"
          maxWidth="max-w-md"
        >
          <div className="text-start space-y-2" dir="rtl">
            {campaignCharacters.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">شخصیتی در کمپین پیدا نشد.</p>
            ) : (
              campaignCharacters.map(char => {
                const isChecked = tempRecipients.includes(char.id);
                return (
                  <label
                    key={char.id}
                    className={`min-h-[48px] px-3 rounded-lg border flex items-center gap-3 cursor-pointer transition ${
                      isChecked ? 'bg-info/15 border-info/50' : 'bg-surface-2 border-border'
                    }`}
                  >
                    <Input noWrapper
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setTempRecipients(prev => (prev.includes(char.id) ? prev.filter(id => id !== char.id) : [...prev, char.id]))
                      }
                      className="w-5 h-5 rounded accent-accent shrink-0"
                    />
                    <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">{char.name}</span>
                    {char.playerName && <span className="text-xs text-text-muted">{char.playerName}</span>}
                  </label>
                );
              })
            )}

            <StickyFooter>
              <div className="flex gap-2">
                <Button type="button" onClick={handleSaveRecipients} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
                  ثبت و اشتراک‌گذاری
                </Button>
                <Button type="button" onClick={() => setRecipientModalHandout(null)} className={secondaryBtnCls}>انصراف</Button>
              </div>
            </StickyFooter>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};