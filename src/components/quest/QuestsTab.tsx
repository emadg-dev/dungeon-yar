import React, { useState } from 'react';
import { Quest, QuestStatus, NPC, LocationEntry, Character } from '../../types';
import { 
  calculateQuestProgress, 
  partitionQuestsByStatus, 
  searchQuests, 
  canUserToggleObjective 
} from '../../../shared/rules/questEngine';
import { 
  Scroll, Search, CheckCircle2, Circle, Eye, EyeOff, 
  Sparkles, Award, MapPin, Users, Plus, Edit3, Trash2, 
  Check, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert,
  Flame, HelpCircle
} from 'lucide-react';
import { DmQuestEditorModal } from './DmQuestEditorModal';

interface QuestsTabProps {
  quests: Quest[];
  campaignId: string;
  isDm?: boolean;
  allowPlayerTickObjectives?: boolean;
  character?: Character | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  partyCharacters?: { id: string; name: string }[];
  onToggleObjective: (questId: string, objectiveId: string, done: boolean) => Promise<void>;
  onCreateQuest?: (questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onUpdateQuest?: (questId: string, questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onDeleteQuest?: (questId: string) => Promise<void>;
  onCompleteQuest?: (questId: string, options?: { grantRewards?: boolean }) => Promise<void>;
}

export const QuestsTab: React.FC<QuestsTabProps> = ({
  quests,
  campaignId,
  isDm = false,
  allowPlayerTickObjectives = false,
  character,
  npcs = [],
  locations = [],
  partyCharacters = [],
  onToggleObjective,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
  onCompleteQuest,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'completed' | 'other' | 'hidden'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  // DM modal states
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
  const [grantRewardsOnComplete, setGrantRewardsOnComplete] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canToggle = canUserToggleObjective(isDm, allowPlayerTickObjectives);

  // Search and partition
  const searchedQuests = searchQuests(quests, searchQuery);
  const partitions = partitionQuestsByStatus(searchedQuests);

  const activeCount = partitions.active.length;
  const completedCount = partitions.completed.length;
  const otherCount = partitions.failed.length + partitions.abandoned.length;
  const hiddenCount = partitions.hidden.length;

  // Current display list based on active subtab
  let displayedQuests: Quest[] = [];
  if (filterTab === 'active') displayedQuests = partitions.active;
  else if (filterTab === 'completed') displayedQuests = partitions.completed;
  else if (filterTab === 'hidden') displayedQuests = partitions.hidden;
  else displayedQuests = [...partitions.failed, ...partitions.abandoned];

  const handleOpenCreateModal = () => {
    setEditingQuest(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditModal = (q: Quest) => {
    setEditingQuest(q);
    setEditorModalOpen(true);
  };

  const handleSaveQuest = async (payload: Partial<Quest> & { participantIds?: string[] }) => {
    if (editingQuest && onUpdateQuest) {
      await onUpdateQuest(editingQuest.id, payload);
    } else if (onCreateQuest) {
      await onCreateQuest(payload);
    }
    setEditorModalOpen(false);
  };

  const handleDeleteQuest = async (qId: string) => {
    if (!onDeleteQuest) return;
    if (window.confirm('آیا از حذف این مأموریت اطمینان دارید؟ این عملیات قابل بازگشت نیست.')) {
      setActionLoading(true);
      try {
        await onDeleteQuest(qId);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleConfirmComplete = async () => {
    if (!completingQuest || !onCompleteQuest) return;
    setActionLoading(true);
    try {
      await onCompleteQuest(completingQuest.id, { grantRewards: grantRewardsOnComplete });
      setCompletingQuest(null);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedQuestId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header bar with Search and DM action */}
      <div className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] bg-[#14120E] space-y-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[10px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center shrink-0">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#EDE6D8]">طومار مأموریت‌ها</h2>
              <p className="text-[11px] text-[#A39A89]">اهداف، قراردادها و ماجراجویی‌های جهان زروانیا</p>
            </div>
          </div>

          {isDm && onCreateQuest && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="py-2 px-3 rounded-[10px] bg-gradient-to-l from-[#C97B4A] to-[#E0A030] text-[#0E0D0C] font-black text-xs shadow-md hover:brightness-110 transition flex items-center gap-1.5 touch-target min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>مأموریت تازه</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#A39A89]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، شرح یا اهداف مأموریت..."
            className="w-full py-2.5 pr-9 pl-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#A39A89]/60 focus:outline-none focus:border-[#E0A030] min-h-[44px]"
          />
        </div>

        {/* Filter Subtabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 touch-target whitespace-nowrap ${
              filterTab === 'active'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-black shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <span>در جریان</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 touch-target whitespace-nowrap ${
              filterTab === 'completed'
                ? 'bg-[#6F9E78] text-[#0E0D0C] font-black shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <span>تکمیل شده</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('other')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 touch-target whitespace-nowrap ${
              filterTab === 'other'
                ? 'bg-[#C97B4A] text-[#0E0D0C] font-black shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <span>شکست / رهاشده</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
              {otherCount}
            </span>
          </button>

          {isDm && (
            <button
              type="button"
              onClick={() => setFilterTab('hidden')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 touch-target whitespace-nowrap ${
                filterTab === 'hidden'
                  ? 'bg-purple-600 text-white font-black shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>پنهان</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
                {hiddenCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quest Cards List */}
      <div className="space-y-3">
        {displayedQuests.length === 0 ? (
          <div className="surface-card rounded-[14px] p-8 text-center border border-[#2F2A23] bg-[#14120E] space-y-3">
            <div className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] flex items-center justify-center mx-auto">
              <Scroll className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black text-[#EDE6D8]">مأموریتی در این بخش یافت نشد</h3>
            <p className="text-[11px] text-[#A39A89] max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'هیچ مأموریتی با عبارت جستجوشده مطابقت ندارد.'
                : filterTab === 'active'
                ? 'در حال حاضر مأموریت فعالی در جریان نیست. با مردم جهان گفتگو کنید و سرنخ‌ها را دنبال نمایید!'
                : 'هیچ سابقه‌ای در این وضعیت ثبت نشده است.'}
            </p>
            {isDm && onCreateQuest && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 py-2 px-4 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#E0A030] transition touch-target"
              >
                ایجاد اولین مأموریت
              </button>
            )}
          </div>
        ) : (
          displayedQuests.map((quest) => {
            const progress = calculateQuestProgress(quest);
            const isExpanded = expandedQuestId === quest.id;
            const visibleObjectives = quest.objectives.filter(o => isDm || o.visible !== false);
            const isPersonal = quest.participantIds && quest.participantIds.length > 0;

            return (
              <div
                key={quest.id}
                className={`surface-card rounded-[14px] border transition overflow-hidden shadow-md ${
                  quest.status === 'completed'
                    ? 'border-[#6F9E78]/40 bg-[#121612]'
                    : quest.status === 'failed' || quest.status === 'abandoned'
                    ? 'border-rose-900/40 bg-[#161111]'
                    : quest.status === 'hidden'
                    ? 'border-purple-900/50 bg-[#141018]'
                    : 'border-[#2F2A23] hover:border-[#E0A030]/50 bg-[#14120E]'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Status Chip */}
                        {quest.status === 'active' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 font-bold">
                            در جریان
                          </span>
                        )}
                        {quest.status === 'completed' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30 font-bold">
                            تکمیل شده
                          </span>
                        )}
                        {quest.status === 'failed' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                            شکست‌خورده
                          </span>
                        )}
                        {quest.status === 'abandoned' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-500/15 text-stone-300 border border-stone-500/30 font-bold">
                            رها شده
                          </span>
                        )}
                        {quest.status === 'hidden' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>پیش‌نویس DM</span>
                          </span>
                        )}

                        {/* Scope Chip */}
                        {isPersonal ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7FB4D6]/15 text-[#7FB4D6] border border-[#7FB4D6]/30 font-bold">
                            ویژه کاراکتر شما
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89] border border-[#2F2A23] font-bold">
                            سراسری گروه
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-[#EDE6D8] leading-tight pt-0.5">
                        {quest.title}
                      </h3>
                    </div>

                    {/* Progress fraction */}
                    <div className="text-left shrink-0">
                      <div className="text-xs font-mono font-black text-[#E0A030]">
                        {progress.completed} / {progress.total}
                      </div>
                      <span className="text-[10px] text-[#A39A89]">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#201D19] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.status === 'completed'
                          ? 'bg-[#6F9E78]'
                          : quest.status === 'failed' || quest.status === 'abandoned'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-l from-[#C97B4A] to-[#E0A030]'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* Meta badges: Giver, Location, XP */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {quest.giverNpcName && (
                      <div className="text-[11px] text-[#A39A89] flex items-center gap-1.5 bg-[#1A1713] px-2 py-1 rounded-[6px] border border-[#2F2A23]">
                        <Users className="w-3 h-3 text-[#E0A030]" />
                        <span>اعطاکننده: <strong className="text-[#EDE6D8]">{quest.giverNpcName}</strong></span>
                      </div>
                    )}
                    {quest.locationName && (
                      <div className="text-[11px] text-[#A39A89] flex items-center gap-1.5 bg-[#1A1713] px-2 py-1 rounded-[6px] border border-[#2F2A23]">
                        <MapPin className="w-3 h-3 text-[#7FB4D6]" />
                        <span>مکان: <strong className="text-[#EDE6D8]">{quest.locationName}</strong></span>
                      </div>
                    )}
                    {quest.rewardRef?.xp ? (
                      <div className="text-[11px] text-[#6F9E78] font-bold flex items-center gap-1 bg-[#6F9E78]/10 px-2 py-1 rounded-[6px] border border-[#6F9E78]/30">
                        <Sparkles className="w-3 h-3" />
                        <span>+{quest.rewardRef.xp} XP</span>
                      </div>
                    ) : null}
                    {quest.rewardRef?.packageId && (
                      <div className="text-[11px] text-[#E0A030] font-bold flex items-center gap-1 bg-[#E0A030]/10 px-2 py-1 rounded-[6px] border border-[#E0A030]/30">
                        <Award className="w-3 h-3" />
                        <span>{quest.rewardRef.packageId}</span>
                      </div>
                    )}
                  </div>

                  {/* Description (collapsible / readable) */}
                  {quest.description && (
                    <p className={`text-xs text-[#A39A89] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {quest.description}
                    </p>
                  )}

                  {/* Objectives Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#2F2A23]/80">
                    <h4 className="text-[11px] font-black text-[#EDE6D8] flex items-center justify-between">
                      <span>فهرست اهداف مأموریت:</span>
                      {!canToggle && !isDm && (
                        <span className="text-[10px] text-[#A39A89] font-normal">
                          (فقط دانجن مستر وضعیت اهداف را علامت می‌زند)
                        </span>
                      )}
                    </h4>

                    <div className="space-y-1.5">
                      {visibleObjectives.map((obj) => (
                        <div
                          key={obj.id}
                          className={`p-2 rounded-[8px] flex items-center justify-between gap-2 text-xs transition ${
                            obj.done ? 'bg-[#181C18]/60 border border-[#6F9E78]/20' : 'bg-[#1A1713] border border-[#2F2A23]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {canToggle ? (
                              <button
                                type="button"
                                onClick={() => onToggleObjective(quest.id, obj.id, !obj.done)}
                                className="touch-target p-1 -m-1 text-[#E0A030] hover:text-[#F2C265] shrink-0"
                                title={obj.done ? 'علامت‌زدن به عنوان ناتمام' : 'علامت‌زدن به عنوان تمام‌شده'}
                              >
                                {obj.done ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#6F9E78]" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[#A39A89]" />
                                )}
                              </button>
                            ) : (
                              <span className="shrink-0">
                                {obj.done ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#6F9E78]" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[#A39A89]" />
                                )}
                              </span>
                            )}

                            <span className={`leading-snug break-words ${obj.done ? 'line-through text-[#6F675A]' : 'text-[#EDE6D8]'}`}>
                              {obj.text}
                            </span>
                          </div>

                          {/* DM Indicator for objective visibility */}
                          {isDm && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                              obj.visible !== false ? 'text-[#7FB4D6] bg-[#7FB4D6]/10' : 'text-purple-400 bg-purple-900/30'
                            }`}>
                              {obj.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{obj.visible !== false ? 'نمایان' : 'پنهان'}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DM Notes Section (only if DM) */}
                  {isDm && quest.dmNotes && (
                    <div className="p-2.5 rounded-[10px] bg-[#E0A030]/10 border border-[#E0A030]/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#E0A030]">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>یادداشت محرمانه دانجن مستر:</span>
                      </div>
                      <p className="text-xs text-[#EDE6D8] leading-relaxed whitespace-pre-wrap">
                        {quest.dmNotes}
                      </p>
                    </div>
                  )}

                  {/* DM Action Buttons */}
                  {isDm && (
                    <div className="pt-2 border-t border-[#2F2A23] flex flex-wrap items-center justify-end gap-2">
                      {quest.status === 'active' && onCompleteQuest && (
                        <button
                          type="button"
                          onClick={() => setCompletingQuest(quest)}
                          className="py-1.5 px-3 rounded-[8px] bg-[#6F9E78] text-[#0E0D0C] font-black text-xs shadow-sm hover:brightness-110 transition flex items-center gap-1.5 touch-target min-h-[40px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تکمیل مأموریت و اعطای پاداش</span>
                        </button>
                      )}

                      {onUpdateQuest && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(quest)}
                          className="py-1.5 px-3 rounded-[8px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-[#EDE6D8] text-xs font-bold transition flex items-center gap-1.5 touch-target min-h-[40px]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#E0A030]" />
                          <span>ویرایش</span>
                        </button>
                      )}

                      {onDeleteQuest && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuest(quest.id)}
                          disabled={actionLoading}
                          className="py-1.5 px-3 rounded-[8px] bg-[#201D19] border border-rose-900/40 hover:bg-rose-900/20 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 touch-target min-h-[40px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DM Quest Editor Modal */}
      {editorModalOpen && (
        <DmQuestEditorModal
          isOpen={editorModalOpen}
          onClose={() => setEditorModalOpen(false)}
          quest={editingQuest}
          npcs={npcs}
          locations={locations}
          partyCharacters={partyCharacters}
          onSave={handleSaveQuest}
        />
      )}

      {/* Completion & Rewards Confirmation Modal */}
      {completingQuest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full sm:max-w-md bg-[#14120E] border border-[#2F2A23] rounded-t-[20px] sm:rounded-[18px] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6F9E78]/20 border border-[#6F9E78]/40 text-[#6F9E78] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#EDE6D8]">تکمیل مأموریت: {completingQuest.title}</h3>
                <p className="text-[11px] text-[#A39A89]">علامت‌زدن به عنوان پیروزی و پایان موفقیت‌آمیز</p>
              </div>
            </div>

            <p className="text-xs text-[#EDE6D8] leading-relaxed">
              با تکمیل این مأموریت، تمامی اهداف آن محقق شده علامت می‌خورند و وضعیت مأموریت به «تکمیل شده» تغییر می‌یابد.
            </p>

            {completingQuest.rewardRef?.xp ? (
              <label className="p-3 rounded-[10px] bg-[#1A1713] border border-[#6F9E78]/30 flex items-center gap-3 cursor-pointer touch-target">
                <input
                  type="checkbox"
                  checked={grantRewardsOnComplete}
                  onChange={(e) => setGrantRewardsOnComplete(e.target.checked)}
                  className="accent-[#6F9E78] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-black text-[#EDE6D8] block">
                    اعطای خودکار پاداش (+{completingQuest.rewardRef.xp} XP)
                  </span>
                  <span className="text-[10px] text-[#A39A89] block">
                    امتیاز تجربه به شخصیت‌های مشارکت‌کننده اختصاص یافته و در وقایع ثبت می‌شود.
                  </span>
                </div>
              </label>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2F2A23]">
              <button
                type="button"
                onClick={() => setCompletingQuest(null)}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] transition touch-target min-h-[44px]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={actionLoading}
                className="py-2.5 px-6 rounded-[12px] bg-[#6F9E78] text-[#0E0D0C] text-xs font-black shadow-lg hover:brightness-110 transition flex items-center gap-1.5 touch-target min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>{actionLoading ? 'در حال ثبت...' : 'تأیید و پایان مأموریت'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
