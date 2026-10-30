import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Image as ImageIcon, Map as MapIcon, Plus, Search, 
  Eye, EyeOff, Users, ArrowUp, ArrowDown, Edit2, Trash2, MapPin, 
  ExternalLink, Filter, Check, ShieldAlert, Sparkles
} from 'lucide-react';
import { Handout, HandoutKind, HandoutVisibility, MapPin as MapPinType } from '../../types';
import { api } from '../../services/api';
import { HandoutEditorSheet } from '../handout/HandoutEditorSheet';
import { HandoutViewerModal } from '../handout/HandoutViewerModal';

interface DmHandoutManagerProps {
  campaignId: string;
  campaignCharacters?: { id: string; name: string; playerName?: string }[];
  isCompact?: boolean; // For encounter quick-reveal panel
  onCloseCompact?: () => void;
}

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

  // Modals & Sheets
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingHandout, setEditingHandout] = useState<Handout | null>(null);
  const [viewingHandout, setViewingHandout] = useState<Handout | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Recipient selection quick modal
  const [recipientModalHandout, setRecipientModalHandout] = useState<Handout | null>(null);
  const [tempRecipients, setTempRecipients] = useState<string[]>([]);

  // Load handouts
  const loadHandouts = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.listHandouts(campaignId, { includeHidden: true });
      // Sort by sortIndex asc
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

  // Character mapping for names
  const characterNamesById = campaignCharacters.reduce((acc, c) => {
    acc[c.id] = c.name + (c.playerName ? ` (${c.playerName})` : '');
    return acc;
  }, {} as Record<string, string>);

  // 1-Tap Quick Reveal to everyone
  const handleQuickReveal = async (handout: Handout) => {
    try {
      await api.revealHandout(campaignId, handout.id, 'revealed');
      await loadHandouts();
      if (viewingHandout?.id === handout.id) {
        setViewingHandout(prev => prev ? { ...prev, visibility: 'revealed' } : null);
      }
    } catch (err: any) {
      setActionError(err.message || 'خطا در آشکارسازی');
    }
  };

  // 1-Tap Quick Hide
  const handleQuickHide = async (handout: Handout) => {
    try {
      await api.revealHandout(campaignId, handout.id, 'hidden');
      await loadHandouts();
      if (viewingHandout?.id === handout.id) {
        setViewingHandout(prev => prev ? { ...prev, visibility: 'hidden' } : null);
      }
    } catch (err: any) {
      setActionError(err.message || 'خطا در مخفی‌سازی');
    }
  };

  // Open recipient picker
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

  // Reorder
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

  // Delete
  const handleDeleteHandout = async (id: string) => {
    if (!window.confirm('آیا از حذف این سند/نقشه اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) return;
    try {
      await api.deleteHandout(campaignId, id);
      if (viewingHandout?.id === id) setViewingHandout(null);
      await loadHandouts();
    } catch (err: any) {
      setActionError(err.message || 'خطا در حذف سند');
    }
  };

  // Pin operations for viewingHandout
  const handleAddPin = async (pinData: { x: number; y: number; label: string; note?: string; revealed: boolean }) => {
    if (!viewingHandout) return;
    const newPin = await api.createMapPin(campaignId, viewingHandout.id, pinData);
    setViewingHandout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pins: [...(prev.pins || []), newPin],
      };
    });
    // refresh list state as well
    setHandouts(prev =>
      prev.map(h => (h.id === viewingHandout.id ? { ...h, pins: [...(h.pins || []), newPin] } : h))
    );
  };

  const handleUpdatePin = async (pinId: string, updates: Partial<MapPinType>) => {
    if (!viewingHandout) return;
    const updated = await api.updateMapPin(campaignId, viewingHandout.id, pinId, updates);
    setViewingHandout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pins: (prev.pins || []).map(p => (p.id === pinId ? updated : p)),
      };
    });
    setHandouts(prev =>
      prev.map(h =>
        h.id === viewingHandout.id
          ? { ...h, pins: (h.pins || []).map(p => (p.id === pinId ? updated : p)) }
          : h
      )
    );
  };

  const handleDeletePin = async (pinId: string) => {
    if (!viewingHandout) return;
    await api.deleteMapPin(campaignId, viewingHandout.id, pinId);
    setViewingHandout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pins: (prev.pins || []).filter(p => p.id !== pinId),
      };
    });
    setHandouts(prev =>
      prev.map(h =>
        h.id === viewingHandout.id
          ? { ...h, pins: (h.pins || []).filter(p => p.id !== pinId) }
          : h
      )
    );
  };

  // Save from editor sheet
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

  // Upload handler for editor
  const handleUploadMedia = async (file: File) => {
    const res = await api.uploadMedia(file, campaignId);
    return {
      mediaId: res.mediaId || res.id,
      mediaUrl: res.mediaUrl || res.url,
    };
  };

  // Filtering
  const allTags = Array.from(new Set(handouts.flatMap(h => h.tags || [])));
  const filteredHandouts = handouts.filter(h => {
    if (kindFilter !== 'all' && h.kind !== kindFilter) return false;
    if (selectedTag && !(h.tags || []).includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = h.title.toLowerCase().includes(q);
      const matchBody = (h.body || '').toLowerCase().includes(q);
      const matchTag = (h.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchBody && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className={`space-y-4 ${isCompact ? 'p-2' : ''}`} dir="rtl">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`${isCompact ? 'text-sm' : 'text-base sm:text-lg'} font-black text-[#EDE6D8] flex items-center gap-2`}>
            <MapIcon className="w-5 h-5 text-[#E0A030]" />
            <span>اسناد و نقشه‌های کمپین</span>
          </h2>
          {!isCompact && (
            <p className="text-xs text-[#A39A89] mt-0.5">
              مدیریت اسناد، نامه‌ها، تصاویر و نقشه‌های تعاملی همراه با نشانگر و کنترل دسترسی زنده.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingHandout(null);
              setIsEditorOpen(true);
            }}
            className="px-3.5 py-2 rounded-[10px] bg-[#E0A030] hover:bg-[#F2C265] text-[#14120E] text-xs font-bold transition flex items-center gap-1.5 touch-target shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>سند یا نقشه جدید</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[10px] text-xs text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-300 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="surface-card p-3 rounded-[14px] border border-[#2F2A23] space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A39A89] absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، متن یا برچسب‌ها..."
              className="w-full ps-9 pe-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[10px] text-xs text-white placeholder-[#787063] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          {/* Kind Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#14120E] p-1 rounded-[10px] border border-[#2F2A23] shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold transition touch-target ${
                kindFilter === 'all' ? 'bg-[#E0A030] text-[#14120E]' : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              همه ({handouts.length})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('map')}
              className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold transition flex items-center gap-1 touch-target ${
                kindFilter === 'map' ? 'bg-[#4ADE80] text-[#14120E]' : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>نقشه‌ها</span>
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('image')}
              className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold transition flex items-center gap-1 touch-target ${
                kindFilter === 'image' ? 'bg-[#38BDF8] text-[#14120E]' : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>تصاویر</span>
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('text')}
              className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold transition flex items-center gap-1 touch-target ${
                kindFilter === 'text' ? 'bg-[#E0A030] text-[#14120E]' : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>متون</span>
            </button>
          </div>
        </div>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#A39A89]">برچسب:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition ${
                  selectedTag === tag
                    ? 'bg-[#E0A030] text-[#14120E] border-[#E0A030]'
                    : 'bg-[#14120E] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Handouts List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[#A39A89] animate-pulse">
          در حال بارگذاری اسناد و نقشه‌ها...
        </div>
      ) : filteredHandouts.length === 0 ? (
        <div className="surface-card p-8 rounded-[16px] border border-[#2F2A23] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1C1813] border border-[#2F2A23] flex items-center justify-center mx-auto text-[#A39A89]">
            <MapIcon className="w-6 h-6 opacity-40" />
          </div>
          <h3 className="text-sm font-bold text-[#EDE6D8]">سندی یافت نشد</h3>
          <p className="text-xs text-[#A39A89] max-w-sm mx-auto">
            هنوز سندی ایجاد نشده یا با فیلترهای جستجو همخوانی ندارد. می‌توانید با کلیک روی «سند یا نقشه جدید» اولین سند را اضافه کنید.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHandouts.map((handout, index) => {
            const kindIcon = {
              text: <FileText className="w-4 h-4 text-[#E0A030]" />,
              image: <ImageIcon className="w-4 h-4 text-[#38BDF8]" />,
              map: <MapIcon className="w-4 h-4 text-[#4ADE80]" />,
            }[handout.kind];

            const isRevealed = handout.visibility === 'revealed';
            const isSelected = handout.visibility === 'selected';
            const isHidden = handout.visibility === 'hidden';

            return (
              <div
                key={handout.id}
                className="surface-card p-3 sm:p-3.5 rounded-[14px] border border-[#2F2A23] hover:border-[#3E372E] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Info & Type */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Kind Icon */}
                  <div
                    onClick={() => setViewingHandout(handout)}
                    className="w-12 h-12 rounded-[10px] bg-[#14120E] border border-[#2F2A23] flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
                  >
                    {handout.mediaUrl || handout.mediaId ? (
                      <img
                        src={handout.mediaUrl || `/api/media/${handout.mediaId}`}
                        alt={handout.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                      />
                    ) : (
                      kindIcon
                    )}
                  </div>

                  {/* Title, Kind, Tags, Pins Count */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        onClick={() => setViewingHandout(handout)}
                        className="font-bold text-sm text-[#EDE6D8] hover:text-[#E0A030] cursor-pointer truncate"
                      >
                        {handout.title}
                      </h4>

                      {/* Visibility Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isRevealed
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isSelected
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isRevealed && <Eye className="w-2.5 h-2.5" />}
                        {isSelected && <Users className="w-2.5 h-2.5" />}
                        {isHidden && <EyeOff className="w-2.5 h-2.5" />}
                        {isRevealed ? 'آشکار برای همه' : isSelected ? 'بازیکنان منتخب' : 'مخفی'}
                      </span>

                      {/* Map Pins Count */}
                      {handout.kind === 'map' && (
                        <span className="text-[10px] text-[#A39A89] bg-[#14120E] px-2 py-0.5 rounded-[6px] border border-[#2F2A23] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#E0A030]" />
                          {(handout.pins || []).length} نشانگر
                        </span>
                      )}
                    </div>

                    {/* Excerpt or tags */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A39A89] flex-wrap">
                      {handout.tags && handout.tags.length > 0 && (
                        <span>{handout.tags.map(t => `#${t}`).join(' ')}</span>
                      )}
                      {isSelected && handout.recipients && (
                        <span className="text-sky-300">
                          ({handout.recipients.length} بازیکن مجاز)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: 1-Tap Quick Reveal Buttons & Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#2F2A23]/60 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Sort reordering */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSort(index, 'up')}
                      className="p-1.5 rounded-[6px] text-[#A39A89] hover:text-[#EDE6D8] disabled:opacity-20 touch-target"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === filteredHandouts.length - 1}
                      onClick={() => handleMoveSort(index, 'down')}
                      className="p-1.5 rounded-[6px] text-[#A39A89] hover:text-[#EDE6D8] disabled:opacity-20 touch-target"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1-Tap Reveal To Everyone */}
                  <button
                    type="button"
                    onClick={() => (isRevealed ? handleQuickHide(handout) : handleQuickReveal(handout))}
                    className={`px-2.5 py-1.5 rounded-[8px] text-xs font-bold transition flex items-center gap-1 touch-target ${
                      isRevealed
                        ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                    }`}
                    title={isRevealed ? 'مخفی‌سازی از بازیکنان' : 'آشکارسازی فوری برای همه بازیکنان'}
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isRevealed ? 'مخفی کردن' : 'آشکارسازی همه'}</span>
                  </button>

                  {/* 1-Tap Reveal to Selected */}
                  <button
                    type="button"
                    onClick={() => handleOpenRecipientModal(handout)}
                    className="p-1.5 rounded-[8px] bg-[#14120E] hover:bg-[#252019] text-sky-400 border border-sky-800/40 touch-target"
                    title="انتخاب بازیکنان مجاز"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>

                  {/* View / Pin Editor */}
                  <button
                    type="button"
                    onClick={() => setViewingHandout(handout)}
                    className="p-1.5 rounded-[8px] bg-[#14120E] hover:bg-[#252019] text-[#E0A030] border border-[#3A3327] touch-target"
                    title="مشاهده و ویرایش نشانگرها"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit details */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHandout(handout);
                      setIsEditorOpen(true);
                    }}
                    className="p-1.5 rounded-[8px] bg-[#14120E] hover:bg-[#252019] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] touch-target"
                    title="ویرایش مشخصات"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteHandout(handout.id)}
                    className="p-1.5 rounded-[8px] bg-[#14120E] hover:bg-rose-500/20 text-[#A39A89] hover:text-rose-400 border border-[#2F2A23] touch-target"
                    title="حذف سند"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Sheet Modal */}
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

      {/* Handout Viewer Modal (with Pinch-Zoom and Pin management for DM) */}
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

      {/* Quick Recipient Selection Modal */}
      {recipientModalHandout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md bg-[#14120E] border border-[#2F2A23] rounded-[18px] p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#2F2A23]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-[#EDE6D8]">انتخاب بازیکنان برای «{recipientModalHandout.title}»</h3>
              </div>
              <button
                type="button"
                onClick={() => setRecipientModalHandout(null)}
                className="text-[#A39A89] hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-[#A39A89]">
              شخصیت‌های انتخاب‌شده می‌توانند این سند را در بخش اسناد خود مشاهده کنند:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {campaignCharacters.length === 0 ? (
                <p className="text-xs text-[#A39A89] italic">شخصیتی در کمپین یافت نشد.</p>
              ) : (
                campaignCharacters.map(char => {
                  const isChecked = tempRecipients.includes(char.id);
                  return (
                    <label
                      key={char.id}
                      className={`flex items-center justify-between p-2.5 rounded-[10px] border cursor-pointer transition ${
                        isChecked
                          ? 'bg-sky-950/40 border-sky-600/50 text-white'
                          : 'bg-[#1C1813] border-[#2F2A23] text-[#A39A89]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setTempRecipients(prev =>
                              prev.includes(char.id) ? prev.filter(id => id !== char.id) : [...prev, char.id]
                            )
                          }
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-[#14120E] border-[#2F2A23]"
                        />
                        <span className="text-xs font-bold truncate">{char.name}</span>
                      </div>
                      {char.playerName && (
                        <span className="text-[10px] text-[#A39A89]">({char.playerName})</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2F2A23]">
              <button
                type="button"
                onClick={() => setRecipientModalHandout(null)}
                className="px-3.5 py-2 rounded-[8px] bg-[#241F18] text-xs text-[#EDE6D8]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveRecipients}
                className="px-4 py-2 rounded-[8px] bg-sky-500 hover:bg-sky-400 text-xs font-bold text-black shadow-md"
              >
                ثبت و اشتراک‌گذاری
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
