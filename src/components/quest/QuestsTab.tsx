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
import { ScrollableRow } from '../ui/ScrollableRow';
import { BottomSheet } from '../mobile/BottomSheet';

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
      <div className="surface-card rounded-[14px] p-3.5 border border-border bg-bg space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[10px] bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary">طومار مأموریت‌ها</h2>
              <p className="text-xs text-text-muted">اهداف، قراردادها و ماجراجویی‌های جهان زروانیا</p>
            </div>
          </div>

          {isDm && onCreateQuest && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="py-2 px-3 rounded-[10px] bg-gradient-to-l from-warning to-accent text-on-accent font-black text-xs shadow-md hover:brightness-110 transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>مأموریت تازه</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، شرح یا اهداف مأموریت..."
            className="w-full py-2.5 pe-9 ps-3 rounded-[10px] bg-surface border border-border text-xs text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-accent min-h-[44px]"
          />
        </div>

        {/* Filter Subtabs */}
        <ScrollableRow activeKey={filterTab} className="items-center gap-1.5 pt-1">
          <button
            type="button"
            data-scroll-key="active"
            onClick={() => setFilterTab('active')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
              filterTab === 'active'
                ? 'bg-accent text-on-accent font-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="whitespace-nowrap shrink-0">در جریان</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold shrink-0">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            data-scroll-key="completed"
            onClick={() => setFilterTab('completed')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
              filterTab === 'completed'
                ? 'bg-success text-on-accent font-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="whitespace-nowrap shrink-0">تکمیل شده</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold shrink-0">
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            data-scroll-key="other"
            onClick={() => setFilterTab('other')}
            className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
              filterTab === 'other'
                ? 'bg-warning text-on-accent font-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="whitespace-nowrap shrink-0">شکست / رهاشده</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold shrink-0">
              {otherCount}
            </span>
          </button>

          {isDm && (
            <button
              type="button"
              data-scroll-key="hidden"
              onClick={() => setFilterTab('hidden')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
                filterTab === 'hidden'
                  ? 'bg-purple-600 text-white font-black shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">پنهان</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold shrink-0">
                {hiddenCount}
              </span>
            </button>
          )}
        </ScrollableRow>
      </div>

      {/* Quest Cards List */}
      <div className="space-y-3">
        {displayedQuests.length === 0 ? (
          <div className="surface-card rounded-[14px] p-8 text-center border border-border bg-bg space-y-3">
            <div className="w-12 h-12 rounded-[12px] bg-surface-2 border border-border text-text-muted flex items-center justify-center mx-auto">
              <Scroll className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black text-text-primary">مأموریتی در این بخش یافت نشد</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
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
                className="mt-2 py-2 px-4 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-accent transition touch-target min-w-[44px]"
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
                    ? 'border-success/40 bg-success'
                    : quest.status === 'failed' || quest.status === 'abandoned'
                    ? 'border-rose-900/40 bg-surface'
                    : quest.status === 'hidden'
                    ? 'border-purple-900/50 bg-role-codm'
                    : 'border-border hover:border-accent/50 bg-bg'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Status Chip */}
                        {quest.status === 'active' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-bold">
                            در جریان
                          </span>
                        )}
                        {quest.status === 'completed' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-bold">
                            تکمیل شده
                          </span>
                        )}
                        {quest.status === 'failed' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                            شکست‌خورده
                          </span>
                        )}
                        {quest.status === 'abandoned' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/15 text-stone-300 border border-stone-500/30 font-bold">
                            رها شده
                          </span>
                        )}
                        {quest.status === 'hidden' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>پیش‌نویس DM</span>
                          </span>
                        )}

                        {/* Scope Chip */}
                        {isPersonal ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-info/15 text-info border border-info/30 font-bold">
                            ویژه کاراکتر شما
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border font-bold">
                            سراسری گروه
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-text-primary leading-tight pt-0.5">
                        {quest.title}
                      </h3>
                    </div>

                    {/* Progress fraction */}
                    <div className="text-end shrink-0">
                      <div className="text-xs font-mono font-black text-accent">
                        {progress.completed} / {progress.total}
                      </div>
                      <span className="text-xs text-text-muted">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.status === 'completed'
                          ? 'bg-success'
                          : quest.status === 'failed' || quest.status === 'abandoned'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-l from-warning to-accent'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* Meta badges: Giver, Location, XP */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {quest.giverNpcName && (
                      <div className="text-xs text-text-muted flex items-center gap-1.5 bg-surface px-2 py-1 rounded-[6px] border border-border">
                        <Users className="w-3 h-3 text-accent" />
                        <span>اعطاکننده: <strong className="text-text-primary">{quest.giverNpcName}</strong></span>
                      </div>
                    )}
                    {quest.locationName && (
                      <div className="text-xs text-text-muted flex items-center gap-1.5 bg-surface px-2 py-1 rounded-[6px] border border-border">
                        <MapPin className="w-3 h-3 text-info" />
                        <span>مکان: <strong className="text-text-primary">{quest.locationName}</strong></span>
                      </div>
                    )}
                    {quest.rewardRef?.xp ? (
                      <div className="text-xs text-success font-bold flex items-center gap-1 bg-success/10 px-2 py-1 rounded-[6px] border border-success/30">
                        <Sparkles className="w-3 h-3" />
                        <span>+{quest.rewardRef.xp} XP</span>
                      </div>
                    ) : null}
                    {quest.rewardRef?.packageId && (
                      <div className="text-xs text-accent font-bold flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-[6px] border border-accent/30">
                        <Award className="w-3 h-3" />
                        <span>{quest.rewardRef.packageId}</span>
                      </div>
                    )}
                  </div>

                  {/* Description (collapsible / readable) */}
                  {quest.description && (
                    <p className={`text-xs text-text-muted leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {quest.description}
                    </p>
                  )}

                  {/* Objectives Checklist */}
                  <div className="space-y-2 pt-2 border-t border-border/80">
                    <h4 className="text-xs font-black text-text-primary flex flex-wrap items-center justify-between gap-2">
                      <span>فهرست اهداف مأموریت:</span>
                      {!canToggle && !isDm && (
                        <span className="text-xs text-text-muted font-normal">
                          (فقط دانجن مستر وضعیت اهداف را علامت می‌زند)
                        </span>
                      )}
                    </h4>

                    <div className="space-y-1.5">
                      {visibleObjectives.map((obj) => (
                        <div
                          key={obj.id}
                          className={`p-2 rounded-[8px] flex flex-wrap items-center justify-between gap-2 gap-2 text-xs transition ${
                            obj.done ? 'bg-success/60 border border-success/20' : 'bg-surface border border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {canToggle ? (
                              <button
                                type="button"
                                onClick={() => onToggleObjective(quest.id, obj.id, !obj.done)}
                                className="touch-target min-w-[44px] p-1 -m-1 text-accent hover:text-accent-hover shrink-0"
                                title={obj.done ? 'علامت‌زدن به عنوان ناتمام' : 'علامت‌زدن به عنوان تمام‌شده'}
                              >
                                {obj.done ? (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                ) : (
                                  <Circle className="w-4 h-4 text-text-muted" />
                                )}
                              </button>
                            ) : (
                              <span className="shrink-0">
                                {obj.done ? (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                ) : (
                                  <Circle className="w-4 h-4 text-text-muted" />
                                )}
                              </span>
                            )}

                            <span className={`leading-snug break-words ${obj.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                              {obj.text}
                            </span>
                          </div>

                          {/* DM Indicator for objective visibility */}
                          {isDm && (
                            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                              obj.visible !== false ? 'text-info bg-info/10' : 'text-purple-400 bg-purple-900/30'
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
                    <div className="p-2.5 rounded-[10px] bg-accent/10 border border-accent/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-accent">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>یادداشت محرمانه دانجن مستر:</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                        {quest.dmNotes}
                      </p>
                    </div>
                  )}

                  {/* DM Action Buttons */}
                  {isDm && (
                    <div className="pt-2 border-t border-border flex flex-wrap items-center justify-end gap-2">
                      {quest.status === 'active' && onCompleteQuest && (
                        <button
                          type="button"
                          onClick={() => setCompletingQuest(quest)}
                          className="py-1.5 px-3 rounded-[8px] bg-success text-on-accent font-black text-xs shadow-sm hover:brightness-110 transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[40px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تکمیل مأموریت و اعطای پاداش</span>
                        </button>
                      )}

                      {onUpdateQuest && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(quest)}
                          className="py-1.5 px-3 rounded-[8px] bg-surface-2 border border-border hover:border-accent text-text-primary text-xs font-bold transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[40px]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-accent" />
                          <span>ویرایش</span>
                        </button>
                      )}

                      {onDeleteQuest && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuest(quest.id)}
                          disabled={actionLoading}
                          className="py-1.5 px-3 rounded-[8px] bg-surface-2 border border-rose-900/40 hover:bg-rose-900/20 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[40px]"
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
        <BottomSheet
          isOpen={true}
          onClose={() => setCompletingQuest(null)}
          title={`تکمیل مأموریت: ${completingQuest.title}`}
          subtitle="علامت‌زدن به عنوان پیروزی و پایان موفقیت‌آمیز"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-start">
            <p className="text-xs text-text-primary leading-relaxed">
              با تکمیل این مأموریت، تمامی اهداف آن محقق شده علامت می‌خورند و وضعیت مأموریت به «تکمیل شده» تغییر می‌یابد.
            </p>

            {completingQuest.rewardRef?.xp ? (
              <label className="p-3 rounded-xl bg-surface border border-success/30 flex items-center gap-3 cursor-pointer touch-target min-w-[44px]">
                <input
                  type="checkbox"
                  checked={grantRewardsOnComplete}
                  onChange={(e) => setGrantRewardsOnComplete(e.target.checked)}
                  className="accent-success w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-black text-text-primary block">
                    اعطای خودکار پاداش (+{completingQuest.rewardRef.xp} XP)
                  </span>
                  <span className="text-xs text-text-muted block">
                    امتیاز تجربه به شخصیت‌های مشارکت‌کننده اختصاص یافته و در وقایع ثبت می‌شود.
                  </span>
                </div>
              </label>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setCompletingQuest(null)}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl bg-surface-2 border border-border text-xs font-bold text-text-muted hover:text-text-primary transition touch-target min-w-[44px] min-h-[44px]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={actionLoading}
                className="py-2.5 px-6 rounded-xl bg-success text-on-accent text-xs font-black shadow-lg hover:brightness-110 transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>{actionLoading ? 'در حال ثبت...' : 'تأیید و پایان مأموریت'}</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
