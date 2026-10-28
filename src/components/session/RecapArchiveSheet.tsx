import React, { useState, useMemo } from 'react';
import { SessionRecap, Session, Campaign, User, CampaignRole, NPC, LocationEntry, CampaignNote } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { formatSessionDateTime } from '../../../shared/rules/sessionEngine';
import { searchRecaps, canUserCreateRecap, canUserEditRecap } from '../../../shared/rules/recapEngine';
import { 
  Search, BookOpen, Feather, Edit3, Trash2, Calendar, 
  MapPin, User as UserIcon, Scroll, Eye, EyeOff, X, Sparkles 
} from 'lucide-react';

interface RecapArchiveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recaps: SessionRecap[];
  sessions?: Session[];
  campaign: Campaign | null;
  currentUser: User | null;
  userRole?: CampaignRole | 'dm' | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
  onOpenCreateRecap?: () => void;
  onEditRecap?: (recap: SessionRecap) => void;
  onDeleteRecap?: (recapId: string) => Promise<void>;
}

export const RecapArchiveSheet: React.FC<RecapArchiveSheetProps> = ({
  isOpen,
  onClose,
  recaps,
  campaign,
  currentUser,
  userRole,
  npcs = [],
  locations = [],
  campaignNotes = [],
  onOpenCreateRecap,
  onEditRecap,
  onDeleteRecap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecapId, setSelectedRecapId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isDm = userRole === 'owner' || userRole === 'co_dm' || userRole === 'dm' || currentUser?.role === 'dm';
  const canCreate = canUserCreateRecap(userRole, campaign?.settings?.allowPlayerRecaps);

  const filteredRecaps = useMemo(() => {
    return searchRecaps(recaps, searchQuery);
  }, [recaps, searchQuery]);

  const activeRecap = useMemo(() => {
    if (!selectedRecapId) return null;
    return recaps.find(r => r.id === selectedRecapId) || null;
  }, [recaps, selectedRecapId]);

  const handleDelete = async (recapId: string) => {
    if (!onDeleteRecap || deletingId) return;
    if (!window.confirm('آیا از حذف این خلاصه اطمینان دارید؟')) return;
    setDeletingId(recapId);
    try {
      await onDeleteRecap(recapId);
      if (selectedRecapId === recapId) setSelectedRecapId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="آرشیو وقایع و خلاصه‌های جلسات"
      subtitle={`ثبت سرگذشت ماجراجویان در کمپین «${campaign?.name || ''}»`}
    >
      <div className="space-y-4 py-2" dir="rtl">
        {/* Top Controls: Search Bar & Create Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#A39A89]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در متن، عنوان یا شماره جلسه..."
              className="w-full pl-9 pr-9 py-2.5 rounded-[12px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#736A5B] focus:outline-none focus:border-[#E0A030] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A39A89] hover:text-[#EDE6D8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {canCreate && onOpenCreateRecap && (
            <button
              type="button"
              onClick={onOpenCreateRecap}
              className="py-2.5 px-3.5 rounded-[12px] btn-primary-amber text-xs font-bold flex items-center gap-1.5 shrink-0 touch-target"
            >
              <Feather className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نگارش خلاصه</span>
              <span className="sm:hidden">ثبت</span>
            </button>
          )}
        </div>

        {/* Selected Recap Reading Modal View */}
        {activeRecap && (
          <div className="p-4 sm:p-5 rounded-[14px] bg-[#1E1914] border border-[#E0A030]/40 shadow-xl space-y-3 relative card-gold-top">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {activeRecap.sessionNumber !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-[10px] font-bold">
                      جلسه {activeRecap.sessionNumber}
                    </span>
                  )}
                  {activeRecap.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] font-bold">
                      پیش‌نویس
                    </span>
                  )}
                  {activeRecap.visibility === 'dm_only' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/40 text-[10px] font-bold">
                      فقط دانجن مستر
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-[#EDE6D8]">
                  {activeRecap.title}
                </h3>
                <div className="text-[11px] text-[#A39A89] mt-0.5">
                  نگارش توسط <strong>{activeRecap.authorName || 'کاربر'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {canUserEditRecap(activeRecap, userRole, currentUser?.id) && (
                  <>
                    {onEditRecap && (
                      <button
                        type="button"
                        onClick={() => onEditRecap(activeRecap)}
                        className="p-1.5 rounded-lg text-[#A39A89] hover:text-[#EDE6D8] hover:bg-white/5 transition touch-target"
                        title="ویرایش"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteRecap && (
                      <button
                        type="button"
                        onClick={() => handleDelete(activeRecap.id)}
                        disabled={deletingId === activeRecap.id}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition touch-target"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRecapId(null)}
                  className="p-1.5 rounded-lg text-[#A39A89] hover:text-[#EDE6D8] hover:bg-white/5 transition touch-target"
                  title="بستن پنجره مطالعه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-[#D8CFBF] leading-relaxed whitespace-pre-line space-y-2.5 pt-2 border-t border-[#2F2A23]">
              {activeRecap.body.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* List of Recaps */}
        <div className="space-y-3">
          {filteredRecaps.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-[14px] bg-[#171310] border border-[#2F2A23] space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-[#736A5B]" />
              <p className="text-xs text-[#A39A89]">
                {searchQuery ? 'هیچ خلاصه‌ای منطبق با جستجو یافت نشد.' : 'هنوز خلاصه‌ای ثبت نشده است.'}
              </p>
            </div>
          ) : (
            filteredRecaps.map((recap) => {
              const dt = recap.createdAt 
                ? formatSessionDateTime(new Date(recap.createdAt).toISOString(), campaign?.settings?.timezone) 
                : null;
              const isSelected = selectedRecapId === recap.id;

              return (
                <div
                  key={recap.id}
                  onClick={() => setSelectedRecapId(isSelected ? null : recap.id)}
                  className={`p-3.5 sm:p-4 rounded-[14px] border transition cursor-pointer ${
                    isSelected 
                      ? 'bg-[#221C16] border-[#E0A030] shadow-md' 
                      : 'bg-[#171310] border-[#2F2A23] hover:border-[#42392C] hover:bg-[#1D1813]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {recap.sessionNumber !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-[#201C16] border border-[#383125] text-[#F2C265] text-[10px] font-bold">
                            جلسه {recap.sessionNumber}
                          </span>
                        )}
                        {recap.status === 'draft' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[9px] font-bold">
                            پیش‌نویس
                          </span>
                        )}
                        {recap.visibility === 'dm_only' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 text-[9px] font-bold">
                            فقط DM
                          </span>
                        )}
                        {dt && (
                          <span className="text-[10px] text-[#736A5B]">
                            {dt.weekday}، {dt.date}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-[#EDE6D8]">
                        {recap.title}
                      </h4>

                      <p className="text-[11px] text-[#A39A89] line-clamp-2 leading-relaxed">
                        {recap.body}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-[10px] font-bold text-[#E0A030] hover:underline">
                        {isSelected ? 'بستن' : 'مطالعه'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
