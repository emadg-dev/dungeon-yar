import React, { useState } from 'react';
import { SessionRecap, Campaign, User, CampaignRole, NPC, LocationEntry, CampaignNote } from '../../types';
import { formatSessionDateTime } from '../../../shared/rules/sessionEngine';
import { formatRecapExcerpt, canUserCreateRecap, canUserEditRecap } from '../../../shared/rules/recapEngine';
import { 
  BookOpen, ChevronDown, ChevronUp, Feather, Sparkles, 
  MapPin, User as UserIcon, Scroll, Archive, Edit3 
} from 'lucide-react';

interface PreviouslyOnCardProps {
  recap: SessionRecap | null;
  campaign: Campaign | null;
  currentUser: User | null;
  userRole?: CampaignRole | 'dm' | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
  onOpenArchive: () => void;
  onOpenCreateRecap?: () => void;
  onEditRecap?: (recap: SessionRecap) => void;
}

export const PreviouslyOnCard: React.FC<PreviouslyOnCardProps> = ({
  recap,
  campaign,
  currentUser,
  userRole,
  npcs = [],
  locations = [],
  campaignNotes = [],
  onOpenArchive,
  onOpenCreateRecap,
  onEditRecap
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const canCreate = canUserCreateRecap(userRole, campaign?.settings?.allowPlayerRecaps);
  const canEdit = recap ? canUserEditRecap(recap, userRole, currentUser?.id) : false;

  if (!recap) {
    // If no recaps exist yet, show an inviting prompt for DMs / authorized authors
    return (
      <div 
        className="surface-card rounded-[16px] p-4 border border-[#2F2A23] bg-gradient-to-br from-[#1C1814] via-[#171410] to-[#120F0C] relative overflow-hidden shadow-lg transition"
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#E0A030]/10 border border-[#E0A030]/25 text-[#E0A030] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#E0A030] uppercase tracking-wider block">
                وقایع و سرگذشت
              </span>
              <h3 className="text-sm font-extrabold text-[#EDE6D8]">
                قبلاً در «{campaign?.name || 'این ماجراجویی'}»...
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenArchive}
            className="text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-white/5 touch-target"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>آرشیو</span>
          </button>
        </div>

        <p className="text-xs text-[#A39A89] mt-3 leading-relaxed">
          هنوز خلاصه‌ای برای جلسات پیشین ثبت نشده است. پس از پایان هر جلسه، رویدادهای مهم و دستاوردهای گروه در اینجا به نمایش درمی‌آید.
        </p>

        {canCreate && onOpenCreateRecap && (
          <div className="mt-3 pt-3 border-t border-[#2F2A23]/60 flex justify-end">
            <button
              type="button"
              onClick={onOpenCreateRecap}
              className="py-2 px-3.5 rounded-[10px] bg-[#2A2318] hover:bg-[#342C1E] border border-[#E0A030]/30 hover:border-[#E0A030] text-[#F2C265] text-xs font-bold flex items-center gap-1.5 transition touch-target"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>نگارش خلاصه رویدادها</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Format date
  const dt = recap.createdAt 
    ? formatSessionDateTime(new Date(recap.createdAt).toISOString(), campaign?.settings?.timezone) 
    : null;

  // Resolve linked items
  const linkedNpcs = (recap.linkedNpcIds || [])
    .map(id => npcs.find(n => n.id === id))
    .filter(Boolean) as NPC[];

  const linkedLocs = (recap.linkedLocationIds || [])
    .map(id => locations.find(l => l.id === id))
    .filter(Boolean) as LocationEntry[];

  const linkedQuests = (recap.linkedQuestIds || [])
    .map(id => campaignNotes.find(n => n.id === id))
    .filter(Boolean) as CampaignNote[];

  const hasLinked = linkedNpcs.length > 0 || linkedLocs.length > 0 || linkedQuests.length > 0;

  return (
    <div 
      className="surface-card rounded-[16px] p-4 sm:p-5 border border-[#2F2A23] bg-gradient-to-br from-[#1C1814] via-[#171410] to-[#120F0C] relative overflow-hidden shadow-lg transition card-gold-top"
      dir="rtl"
    >
      {/* Header Accent Pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center shadow-inner">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-black text-[#E0A030] tracking-wide">
                قبلاً در «{campaign?.name || 'زروانیا'}»...
              </span>
              {recap.sessionNumber !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-[#201C16] border border-[#383125] text-[#F2C265] text-[10px] font-bold">
                  جلسه {recap.sessionNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canEdit && onEditRecap && (
            <button
              type="button"
              onClick={() => onEditRecap(recap)}
              className="p-1.5 rounded-lg text-[#A39A89] hover:text-[#EDE6D8] hover:bg-white/5 transition touch-target"
              title="ویرایش خلاصه"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenArchive}
            className="py-1 px-2.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-[#C9C0AE] hover:text-[#EDE6D8] text-xs font-semibold flex items-center gap-1 transition touch-target"
          >
            <Archive className="w-3.5 h-3.5 text-[#E0A030]" />
            <span>آرشیو</span>
          </button>
        </div>
      </div>

      {/* Recap Title & Meta */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-black text-[#EDE6D8] leading-snug">
          {recap.title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-[#A39A89] flex-wrap">
          {recap.authorName && (
            <span>به قلم <strong>{recap.authorName}</strong></span>
          )}
          {dt && (
            <>
              <span>•</span>
              <span>{dt.weekday}، {dt.date}</span>
            </>
          )}
          {recap.visibility === 'dm_only' && (
            <span className="px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[9px] font-bold">
              فقط DM
            </span>
          )}
        </div>
      </div>

      {/* Recap Body: Excerpt or Full */}
      <div className="mt-3 text-xs sm:text-[13px] text-[#D8CFBF] leading-relaxed whitespace-pre-line">
        {isExpanded ? (
          <div className="space-y-2">
            {recap.body.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p>{formatRecapExcerpt(recap.body, 220)}</p>
        )}
      </div>

      {/* Expand / Collapse toggle */}
      {recap.body.length > 220 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-bold text-[#E0A030] hover:text-[#F2C265] flex items-center gap-1 transition touch-target"
        >
          <span>{isExpanded ? 'خلاصه کردن متن' : 'مطالعه کامل سرگذشت'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Linked Entities (NPCs, Locations, Quests) */}
      {hasLinked && (
        <div className="mt-3 pt-3 border-t border-[#2F2A23]/60 space-y-2">
          <span className="text-[10px] font-extrabold text-[#A39A89] uppercase tracking-wider block">
            پیوندهای ذکرشده در جلسه:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {linkedLocs.map(loc => (
              <span
                key={loc.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1F271E] border border-[#2D3F2B] text-[#93C48B] text-[10px] font-medium"
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>{loc.name}</span>
              </span>
            ))}
            {linkedNpcs.map(npc => (
              <span
                key={npc.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#271E2B] border border-[#3E2947] text-[#C48BC0] text-[10px] font-medium"
              >
                <UserIcon className="w-2.5 h-2.5" />
                <span>{npc.name}</span>
              </span>
            ))}
            {linkedQuests.map(q => (
              <span
                key={q.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2A2318] border border-[#3F331F] text-[#F2C265] text-[10px] font-medium"
              >
                <Scroll className="w-2.5 h-2.5" />
                <span>{q.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
