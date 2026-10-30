import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Image as ImageIcon, Map as MapIcon, Search, 
  MapPin, Sparkles, Eye, Tag, ChevronLeft, AlertCircle 
} from 'lucide-react';
import { Handout, HandoutKind, Character } from '../../types';
import { api } from '../../services/api';
import { HandoutViewerModal } from '../handout/HandoutViewerModal';
import { isNewHandout } from '../../../shared/rules/handoutEngine';

interface HandoutsTabProps {
  campaignId: string;
  character?: Character | null;
}

export const HandoutsTab: React.FC<HandoutsTabProps> = ({
  campaignId,
  character,
}) => {
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | HandoutKind>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeHandout, setActiveHandout] = useState<Handout | null>(null);

  // Viewed handouts tracked in localStorage
  const storageKey = `dy_viewed_handouts_${character?.id || 'guest'}`;
  const [viewedIds, setViewedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load revealed handouts for this player
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // api.listHandouts automatically filters for current character participation or revealed
        const list = await api.listHandouts(campaignId, {
          participationId: character?.id,
          includeHidden: false,
        });
        if (isMounted) {
          list.sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
          setHandouts(list);
        }
      } catch (err) {
        console.error('Failed to load revealed handouts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [campaignId, character?.id]);

  const handleOpenHandout = (handout: Handout) => {
    setActiveHandout(handout);
    if (!viewedIds.includes(handout.id)) {
      const nextViewed = [...viewedIds, handout.id];
      setViewedIds(nextViewed);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextViewed));
      } catch {
        // ignore
      }
    }
  };

  // Filtered handouts
  const allTags = useMemo(() => {
    return Array.from(new Set(handouts.flatMap(h => h.tags || [])));
  }, [handouts]);

  const filteredHandouts = useMemo(() => {
    return handouts.filter(h => {
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
  }, [handouts, kindFilter, selectedTag, searchQuery]);

  return (
    <div className="space-y-4 pb-12" dir="rtl">
      {/* Search & Filter Header */}
      <div className="surface-card p-3 rounded-[16px] border border-[#2F2A23] space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A39A89] absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو در اسناد و نقشه‌ها..."
              className="w-full ps-9 pe-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[10px] text-xs text-white placeholder-[#787063] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#14120E] p-1 rounded-[10px] border border-[#2F2A23] shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition touch-target ${
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
              <span>نامه‌ها و متون</span>
            </button>
          </div>
        </div>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#A39A89]">دسته‌بندی:</span>
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

      {/* Handouts Grid / List */}
      {loading ? (
        <div className="p-10 text-center text-xs text-[#A39A89] animate-pulse">
          در حال بارگذاری اسناد و نقشه‌ها...
        </div>
      ) : filteredHandouts.length === 0 ? (
        <div className="surface-card p-8 rounded-[16px] border border-[#2F2A23] text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#1C1813] border border-[#2F2A23] flex items-center justify-center mx-auto text-[#A39A89]">
            <MapIcon className="w-7 h-7 opacity-30 text-[#E0A030]" />
          </div>
          <h3 className="text-sm font-bold text-[#EDE6D8]">سند یا نقشه‌ای یافت نشد</h3>
          <p className="text-xs text-[#A39A89] max-w-sm mx-auto">
            هر سندی که دانجن‌مستر در طول ماجراجویی برای شما یا کل گروه آشکار کند، در این بخش نمایش داده خواهد شد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredHandouts.map(handout => {
            const isUnread = !viewedIds.includes(handout.id) || isNewHandout(handout.revealedAt);

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

            return (
              <div
                key={handout.id}
                onClick={() => handleOpenHandout(handout)}
                className="surface-card p-3.5 rounded-[16px] border border-[#2F2A23] hover:border-[#E0A030]/60 active:scale-[0.99] transition cursor-pointer flex flex-col justify-between group shadow-md"
              >
                <div className="space-y-2.5">
                  {/* Top Thumbnail (if image or map) */}
                  {(handout.mediaUrl || handout.mediaId) && (
                    <div className="relative w-full h-32 rounded-[10px] overflow-hidden bg-[#14120E] border border-[#2F2A23]">
                      <img
                        src={handout.mediaUrl || `/api/media/${handout.mediaId}`}
                        alt={handout.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {isUnread && (
                        <div className="absolute top-2 start-2 bg-[#E0A030] text-[#14120E] text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>جدید</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-[8px] bg-[#14120E] border border-[#2F2A23] flex items-center justify-center shrink-0">
                        {kindIcon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#EDE6D8] group-hover:text-[#E0A030] transition truncate">
                          {handout.title}
                        </h4>
                        <span className="text-[10px] text-[#A39A89]">{kindLabel}</span>
                      </div>
                    </div>

                    {isUnread && !(handout.mediaUrl || handout.mediaId) && (
                      <span className="bg-[#E0A030] text-[#14120E] text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>جدید</span>
                      </span>
                    )}
                  </div>

                  {/* Text snippet */}
                  {handout.kind === 'text' && handout.body && (
                    <p className="text-xs text-[#A39A89] line-clamp-2 leading-relaxed font-serif">
                      {handout.body}
                    </p>
                  )}

                  {/* Map Pins Info */}
                  {handout.kind === 'map' && handout.pins && (
                    <div className="flex items-center gap-1 text-[11px] text-[#4ADE80]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{handout.pins.length} نشانگر ثبت‌شده روی نقشه</span>
                    </div>
                  )}
                </div>

                {/* Footer Tags & Action */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#2F2A23]/60 text-[11px]">
                  <div className="flex items-center gap-1 overflow-hidden truncate">
                    {handout.tags && handout.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[#A39A89] text-[10px]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-[#E0A030] group-hover:translate-x-[-2px] transition flex items-center gap-1 text-xs font-semibold shrink-0">
                    <span>مشاهده</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handout Viewer Modal */}
      {activeHandout && (
        <HandoutViewerModal
          isOpen={Boolean(activeHandout)}
          onClose={() => setActiveHandout(null)}
          handout={activeHandout}
          isDm={false}
        />
      )}
    </div>
  );
};
