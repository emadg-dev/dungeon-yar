import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input noWrapper
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در متن، عنوان یا شماره جلسه..."
              className="w-full ps-9 pe-9 py-2.5 rounded-[12px] bg-surface border border-border text-xs text-text-primary placeholder-border-strong focus:outline-none focus:border-accent transition"
            />
            {searchQuery && (
              <Button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {canCreate && onOpenCreateRecap && (
            <Button
              type="button"
              onClick={onOpenCreateRecap}
              className="py-2.5 px-3.5 rounded-[12px] btn-primary text-xs font-bold flex items-center gap-1.5 shrink-0 touch-target min-w-[44px]"
            >
              <Feather className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نگارش خلاصه</span>
              <span className="sm:hidden">ثبت</span>
            </Button>
          )}
        </div>

        {/* Selected Recap Reading Modal View */}
        {activeRecap && (
          <div className="p-4 sm:p-5 rounded-[14px] bg-surface border border-accent/40 shadow-xl space-y-3 relative card-gold-top">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {activeRecap.sessionNumber !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-hover text-xs font-bold">
                      جلسه {activeRecap.sessionNumber}
                    </span>
                  )}
                  {activeRecap.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-bold">
                      پیش‌نویس
                    </span>
                  )}
                  {activeRecap.visibility === 'dm_only' && (
                    <span className="px-2 py-0.5 rounded-full bg-role-codm/15 text-role-codm border border-role-codm/30 text-xs font-bold">
                      فقط دانجن مستر
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-text-primary">
                  {activeRecap.title}
                </h3>
                <div className="text-xs text-text-muted mt-0.5">
                  نگارش توسط <strong>{activeRecap.authorName || 'کاربر'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {canUserEditRecap(activeRecap, userRole, currentUser?.id) && (
                  <>
                    {onEditRecap && (
                      <Button
                        type="button"
                        onClick={() => onEditRecap(activeRecap)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition touch-target min-w-[44px]"
                        title="ویرایش"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onDeleteRecap && (
                      <Button
                        type="button"
                        onClick={() => handleDelete(activeRecap.id)}
                        disabled={deletingId === activeRecap.id}
                        className="p-1.5 rounded-lg text-danger hover:text-danger-hover hover:bg-danger/15 transition touch-target min-w-[44px]"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </>
                )}
                <Button
                  type="button"
                  onClick={() => setSelectedRecapId(null)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition touch-target min-w-[44px]"
                  title="بستن پنجره مطالعه"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-text-muted leading-relaxed whitespace-pre-line space-y-2.5 pt-2 border-t border-border">
              {activeRecap.body.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* List of Recaps */}
        <div className="space-y-3">
          {filteredRecaps.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-[14px] bg-surface border border-border space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-text-muted" />
              <p className="text-xs text-text-muted">
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
                      ? 'bg-surface-2 border-accent shadow-md' 
                      : 'bg-surface border-border hover:border-border-strong hover:bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {recap.sessionNumber !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-accent-hover text-xs font-bold">
                            جلسه {recap.sessionNumber}
                          </span>
                        )}
                        {recap.status === 'draft' && (
                          <span className="px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/30 text-[9px] font-bold">
                            پیش‌نویس
                          </span>
                        )}
                        {recap.visibility === 'dm_only' && (
                          <span className="px-1.5 py-0.2 rounded bg-role-codm/15 text-role-codm border border-role-codm/30 text-[9px] font-bold">
                            فقط DM
                          </span>
                        )}
                        {dt && (
                          <span className="text-xs text-text-muted">
                            {dt.weekday}، {dt.date}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-text-primary">
                        {recap.title}
                      </h4>

                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {recap.body}
                      </p>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-xs font-bold text-accent hover:underline">
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
