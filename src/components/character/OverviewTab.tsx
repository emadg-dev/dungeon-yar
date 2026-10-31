import React, { useState } from 'react';
import { 
  Character, ClassTemplate, Session, SessionRsvpChoice, Campaign, 
  User, CampaignRole, SessionRecap, NPC, LocationEntry, CampaignNote, Quest 
} from '../../types';
import { APP_NAME_LATIN } from '../../config/app';
import { deriveSheet } from '../../../shared/rules/engine';
import { 
  Shield, Footprints, Zap, Dices, Moon, Sun, Sparkles, 
  Download, Upload, Flame, AlertTriangle, Edit3, Check, Heart,
  Lock, ArrowUpCircle
} from 'lucide-react';
import { PipTracker } from '../common/PipTracker';
import { StatCard } from '../common/StatCard';
import { NextSessionCard } from '../session/NextSessionCard';
import { PreviouslyOnCard } from '../session/PreviouslyOnCard';
import { ActiveQuestsCard } from '../quest/ActiveQuestsCard';

interface OverviewTabProps {
  character: Character;
  classTemplates: ClassTemplate[];
  onUpdate: (updated: Character) => void;
  onOpenRestModal: (type: 'short' | 'long' | 'special') => void;
  onRollCheck: (sides: number, count: number, modifier: number, label: string) => void;
  levelUpAvailable?: boolean;
  sheetLocked?: boolean | number;
  pendingChange?: any;
  xp?: number;
  onOpenLevelUp?: () => void;
  onOpenSheetChangeRequest?: () => void;
  // Step 4.1: Sessions & Scheduling
  nextSession?: Session | null;
  campaign?: Campaign | null;
  currentUser?: User | null;
  userRole?: CampaignRole | 'dm' | null;
  onRsvpSession?: (sessionId: string, status: SessionRsvpChoice, note?: string) => Promise<void>;
  onVoteSessionPoll?: (sessionId: string, optionId: string, choice: SessionRsvpChoice) => Promise<void>;
  onConfirmPollOption?: (sessionId: string, optionId: string) => Promise<void>;
  onOpenSessionList?: () => void;
  onOpenCreateSession?: () => void;
  onOpenAttendance?: (session: Session) => void;
  onOpenClosingSheet?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  // Step 4.2: Recaps & Highlights
  latestRecap?: SessionRecap | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
  onOpenRecapArchive?: () => void;
  onOpenCreateRecap?: () => void;
  onEditRecap?: (recap: SessionRecap) => void;
  // Step 4.4: Quests
  quests?: Quest[];
  onOpenQuests?: () => void;
  onToggleQuestObjective?: (questId: string, objectiveId: string, done: boolean) => void;
  canToggleQuestObjective?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  character,
  classTemplates,
  onUpdate,
  onOpenRestModal,
  onRollCheck,
  levelUpAvailable = false,
  sheetLocked = true,
  pendingChange,
  xp,
  onOpenLevelUp,
  onOpenSheetChangeRequest,
  nextSession,
  campaign,
  currentUser,
  userRole,
  onRsvpSession,
  onVoteSessionPoll,
  onConfirmPollOption,
  onOpenSessionList,
  onOpenCreateSession,
  onOpenAttendance,
  onOpenClosingSheet,
  onEditSession,
  latestRecap,
  npcs,
  locations,
  campaignNotes,
  onOpenRecapArchive,
  onOpenCreateRecap,
  onEditRecap,
  quests = [],
  onOpenQuests,
  onToggleQuestObjective,
  canToggleQuestObjective = false,
}) => {
  const [isEditingBasics, setIsEditingBasics] = useState(false);

  const classTemplate = classTemplates?.find(t => t.id === character.classTemplateId || t.name === character.className);
  const derived = deriveSheet({ character, classTemplate });
  const totalInitiative = derived.initiative;

  const adjustSkillPoints = (delta: number) => {
    const next = Math.max(0, character.skillPoints + delta);
    onUpdate({ ...character, skillPoints: next });
  };

  const adjustExhaustion = (delta: number) => {
    const next = Math.max(0, Math.min(6, character.exhaustion + delta));
    onUpdate({ ...character, exhaustion: next });
  };

  const adjustHitDice = (delta: number) => {
    const maxHd = character.level;
    const currentHd = character.hitDice?.current ?? maxHd;
    const next = Math.max(0, Math.min(maxHd, currentHd + delta));
    onUpdate({
      ...character,
      hitDice: {
        current: next,
        max: maxHd,
        die: character.hitDice?.die || 'd8'
      }
    });
  };

  // Toggle class / custom resource pips
  const toggleCustomResource = (id: string, index: number) => {
    const updated = character.customResources.map(r => {
      if (r.id === id) {
        const next = index < r.current ? index : index + 1;
        return { ...r, current: Math.max(0, Math.min(r.max, next)) };
      }
      return r;
    });
    onUpdate({ ...character, customResources: updated });
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${character.name}_${APP_NAME_LATIN.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.name) {
          onUpdate({
            ...imported,
            id: character.id,
            ownerId: character.ownerId,
            revision: character.revision
          });
        }
      } catch {
        // invalid JSON handled safely
      }
    };
    reader.readAsText(file);
  };

  const exhaustionEffects = [
    'بدون اثر منفی',
    'سطح ۱: ضعف (Disadvantage) در چک‌های توانایی',
    'سطح ۲: سرعت نصف می‌شود',
    'سطح ۳: ضعف در پرتاب‌های حمله و تست‌های نجات',
    'سطح ۴: حداکثر جان نصف می‌شود',
    'سطح ۵: سرعت به ۰ کاهش می‌یابد',
    'سطح ۶: مرگ ناگهانی از فرسودگی!'
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Level-Up Ready Banner */}
      {levelUpAvailable && (
        <div className="surface-card rounded-[14px] p-3.5 bg-gradient-to-r from-[#E0A030]/20 via-[#181c26] to-[#6F9E78]/20 border-2 border-[#E0A030] shadow-lg shadow-[#E0A030]/15 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E0A030] text-[#0E0D0C] flex items-center justify-center shrink-0 shadow-md">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#F2C265]">ارتقای سطح آماده است!</h3>
              <p className="text-[11px] text-[#EDE6D8]/90">
                شما به شرایط لازم برای صعود به سطح {character.level + 1} دست یافته‌اید.
              </p>
            </div>
          </div>
          {onOpenLevelUp && (
            <button
              type="button"
              onClick={onOpenLevelUp}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] font-black text-xs transition flex items-center justify-center gap-1.5 touch-target min-h-[40px] shadow-md shadow-[#E0A030]/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>صعود به سطح {character.level + 1}</span>
            </button>
          )}
        </div>
      )}

      {/* Pending Change Warning */}
      {pendingChange && (
        <div className="surface-card rounded-[14px] p-3 bg-[#7FB4D6]/10 border border-[#7FB4D6]/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#7FB4D6] shrink-0" />
            <span className="text-xs text-[#7FB4D6] font-bold">
              یک درخواست {pendingChange.type === 'level_up' ? 'ارتقای سطح' : 'تغییر برگه'} در انتظار بررسی دانجن مستر است.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7FB4D6]/20 text-[#7FB4D6] font-bold">
            در صف بررسی
          </span>
        </div>
      )}

      {/* Step 4.1: Next Session / Scheduling Card */}
      {onRsvpSession && onVoteSessionPoll && onOpenSessionList && (
        <NextSessionCard
          session={nextSession || null}
          campaign={campaign || null}
          currentUser={currentUser || null}
          userRole={userRole}
          onRsvp={onRsvpSession}
          onVotePoll={onVoteSessionPoll}
          onConfirmPollOption={onConfirmPollOption}
          onOpenSessionList={onOpenSessionList}
          onOpenCreateSession={onOpenCreateSession}
          onOpenAttendance={onOpenAttendance}
          onOpenClosingSheet={onOpenClosingSheet}
          onEditSession={onEditSession}
        />
      )}

      {/* Step 4.2: Previously on... / Latest Recap Card */}
      {onOpenRecapArchive && (
        <PreviouslyOnCard
          recap={latestRecap || null}
          campaign={campaign || null}
          currentUser={currentUser || null}
          userRole={userRole}
          npcs={npcs}
          locations={locations}
          campaignNotes={campaignNotes}
          onOpenArchive={onOpenRecapArchive}
          onOpenCreateRecap={onOpenCreateRecap}
          onEditRecap={onEditRecap}
        />
      )}

      {/* Step 4.4: Active Quests Preview Card */}
      {quests && quests.length > 0 && onOpenQuests && (
        <ActiveQuestsCard
          quests={quests}
          onOpenQuests={onOpenQuests}
          onToggleObjective={onToggleQuestObjective}
          canToggleObjective={canToggleQuestObjective}
        />
      )}

      {/* Identity Card */}
      <div className="surface-card rounded-[14px] p-4 card-gold-top relative overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start relative z-10">
          <div className="relative group shrink-0">
            <img
              src={character.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'}
              alt={character.name}
              loading="lazy"
              decoding="async"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[12px] object-cover border border-[#2F2A23] shadow-md"
            />
            <button
              onClick={() => setIsEditingBasics(!isEditingBasics)}
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-[10px] bg-[#E0A030] text-[#0E0D0C] shadow-md hover:bg-[#F2C265] transition touch-target"
              title="ویرایش مشخصات"
              aria-label="ویرایش مشخصات"
            >
              {isEditingBasics ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex-1 text-center sm:text-start w-full min-w-0">
            {isEditingBasics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                <div>
                  <label className="text-xs text-[#A39A89] block mb-1">نام کاراکتر:</label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdate({ ...character, name: e.target.value })}
                    className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A39A89] block mb-1">کلاس:</label>
                  <input
                    type="text"
                    value={character.className}
                    onChange={(e) => onUpdate({ ...character, className: e.target.value })}
                    className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A39A89] block mb-1">نژاد / تبار:</label>
                  <input
                    type="text"
                    value={character.race}
                    onChange={(e) => onUpdate({ ...character, race: e.target.value })}
                    className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A39A89] block mb-1">سطح (Level):</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20"
                    value={character.level}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => onUpdate({ ...character, level: parseInt(e.target.value) || 1 })}
                    className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-black text-[#EDE6D8]">{character.name}</h2>
                  <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30">
                    سطح {character.level}
                  </span>
                </div>
                <p className="text-xs text-[#A39A89] font-medium">
                  {character.className} • {character.race}
                </p>
                {character.background && (
                  <p className="text-[11px] text-[#A39A89] mt-0.5">
                    پس‌زمینه: <span className="text-[#EDE6D8]">{character.background}</span>
                  </p>
                )}
              </div>
            )}

            {/* Rest Buttons Side-by-Side (Mobile-First Thumb-Zone) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3 pt-3 border-t border-[#2F2A23]">
              <button
                type="button"
                onClick={() => onOpenRestModal('short')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-[#201D19] hover:bg-[#201D19]/80 text-[#EDE6D8] text-xs font-bold border border-[#2F2A23] transition touch-target"
              >
                <Moon className="w-4 h-4 text-[#E0A030]" />
                استراحت کوتاه
              </button>

              <button
                type="button"
                onClick={() => onOpenRestModal('long')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-[#201D19] hover:bg-[#201D19]/80 text-[#EDE6D8] text-xs font-bold border border-[#2F2A23] transition touch-target"
              >
                <Sun className="w-4 h-4 text-[#E0A030]" />
                استراحت بلند
              </button>

              <button
                type="button"
                onClick={() => onOpenRestModal('special')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-[#E0A030]/10 hover:bg-[#E0A030]/20 text-[#E0A030] text-xs font-bold border border-[#E0A030]/30 transition touch-target"
              >
                <Sparkles className="w-4 h-4 text-[#E0A030]" />
                شهد بهار
              </button>

              <div className="flex items-center gap-1.5 ms-auto">
                <button
                  type="button"
                  onClick={handleExportJson}
                  title="خروجی JSON"
                  className="p-2.5 rounded-[12px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] text-xs transition touch-target"
                >
                  <Download className="w-4 h-4" />
                </button>
                <label
                  title="درون‌ریزی JSON"
                  className="p-2.5 rounded-[12px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] text-xs transition cursor-pointer touch-target"
                >
                  <Upload className="w-4 h-4" />
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Lock & Integrity Indicator */}
      <div className="surface-card rounded-[14px] p-3 border border-[#2F2A23] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-right w-full sm:w-auto">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            Boolean(sheetLocked)
              ? 'bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30'
              : 'bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30'
          }`}>
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#EDE6D8]">
                {Boolean(sheetLocked) ? 'برگه کاراکتر قفل است' : 'ویرایش آزاد فعال است'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                Boolean(sheetLocked) ? 'bg-[#E0A030]/15 text-[#E0A030]' : 'bg-[#6F9E78]/15 text-[#6F9E78]'
              }`}>
                {Boolean(sheetLocked) ? 'Locked Core' : 'Respec Window'}
              </span>
            </div>
            <p className="text-[11px] text-[#A39A89]">
              {Boolean(sheetLocked)
                ? 'مشخصات بنیادین جهت یکپارچگی قوانین قفل هستند؛ تغییرات اساسی نیازمند تأیید راوی است.'
                : 'پنجره ویرایش آزاد فعال است؛ می‌توانید مشخصات بنیادین را تغییر دهید.'}
            </p>
          </div>
        </div>

        {Boolean(sheetLocked) && onOpenSheetChangeRequest && (
          <button
            type="button"
            onClick={onOpenSheetChangeRequest}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#E0A030] transition flex items-center justify-center gap-1.5 touch-target min-h-[36px] shrink-0"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>درخواست تغییر به DM</span>
          </button>
        )}
      </div>

      {/* 2×2 Stat Grid on Mobile (AC, Speed, Initiative, Hit Dice) + Skill Points */}
      <div>
        <h3 className="text-xs font-bold text-[#A39A89] mb-2 px-1">شاخص‌های بنیادین مبارزه</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. AC */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Shield className="w-4 h-4 text-[#E0A030] mb-1" />
            <span className="text-[11px] font-bold text-[#A39A89]">درجه زره (AC)</span>
            <input
              type="number"
              inputMode="numeric"
              value={character.ac}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate({ ...character, ac: parseInt(e.target.value) || 10 })}
              className="w-16 text-2xl font-extrabold text-[#EDE6D8] bg-transparent text-center font-mono my-0.5 focus:outline-none dice-ltr"
            />
            <span className="text-[10px] text-[#A39A89]">پوشش دفاعی</span>
          </div>

          {/* 2. Speed */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Footprints className="w-4 h-4 text-[#7FB4D6] mb-1" />
            <span className="text-[11px] font-bold text-[#A39A89]">سرعت حرکت</span>
            <div className="flex items-baseline gap-1 my-0.5">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={character.speed}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdate({ ...character, speed: parseFloat(e.target.value) || 9 })}
                className="w-12 text-2xl font-extrabold text-[#EDE6D8] bg-transparent text-center font-mono focus:outline-none dice-ltr"
              />
              <span className="text-[11px] text-[#A39A89]">متر</span>
            </div>
            <span className="text-[10px] text-[#A39A89]">۳۰ فوت</span>
          </div>

          {/* 3. Initiative */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Zap className="w-4 h-4 text-[#E0A030] mb-1" />
            <span className="text-[11px] font-bold text-[#A39A89]">ابتکار عمل</span>
            <button
              type="button"
              onClick={() => onRollCheck(20, 1, totalInitiative, 'ابتکار عمل (Initiative)')}
              className="text-2xl font-extrabold text-[#E0A030] font-mono my-0.5 hover:scale-105 active:scale-95 transition cursor-pointer touch-target dice-ltr"
              title="لمس برای پرتاب ابتکار عمل"
            >
              {totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative}
            </button>
            <span className="text-[10px] text-[#A39A89]">چابکی + پاداش</span>
          </div>

          {/* 4. Hit Dice */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Heart className="w-4 h-4 text-[#6F9E78] mb-1" />
            <span className="text-[11px] font-bold text-[#A39A89]">تاس‌های جان</span>
            <div className="flex items-center gap-1.5 my-0.5">
              <button
                type="button"
                onClick={() => adjustHitDice(-1)}
                className="w-7 h-7 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] touch-target flex items-center justify-center"
                title="مصرف ۱ تاس جان"
              >
                -
              </button>
              <span className="font-mono text-base font-extrabold text-[#EDE6D8] dice-ltr px-1">
                {character.hitDice?.current ?? character.level}/{character.level}
              </span>
              <button
                type="button"
                onClick={() => adjustHitDice(1)}
                className="w-7 h-7 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] touch-target flex items-center justify-center"
                title="بازیابی ۱ تاس جان"
              >
                +
              </button>
            </div>
            <span className="text-[10px] text-[#A39A89]">{character.hitDice?.die || 'd8'}</span>
          </div>
        </div>
      </div>

      {/* Skill Points & Exhaustion Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Skill Points (امتیاز مهارت زروانیا) */}
        <div className="surface-card rounded-[14px] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">امتیاز مهارت (Skill Points)</h4>
              <p className="text-[10px] text-[#A39A89]">برای حرکات ویژه و تقویت ضربات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustSkillPoints(-1)}
              className="w-9 h-9 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-sm touch-target flex items-center justify-center"
              title="کاهش امتیاز مهارت"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-[#E0A030] min-w-[28px] text-center dice-ltr">
              {character.skillPoints}
            </span>
            <button
              type="button"
              onClick={() => adjustSkillPoints(1)}
              className="w-9 h-9 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-sm touch-target flex items-center justify-center"
              title="افزایش امتیاز مهارت"
            >
              +
            </button>
          </div>
        </div>

        {/* Exhaustion Stepper */}
        <div className="surface-card rounded-[14px] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
              character.exhaustion > 0
                ? 'bg-[#C2512B]/20 text-[#C2512B] border-[#C2512B]/40'
                : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">خستگی و فرسودگی</h4>
              <p className="text-[10px] text-[#A39A89]">
                {exhaustionEffects[character.exhaustion]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustExhaustion(-1)}
              className="w-9 h-9 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-sm touch-target flex items-center justify-center"
              title="کاهش سطح خستگی"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-[#EDE6D8] min-w-[28px] text-center dice-ltr">
              {character.exhaustion}
            </span>
            <button
              type="button"
              onClick={() => adjustExhaustion(1)}
              className="w-9 h-9 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#C2512B] font-bold text-sm touch-target flex items-center justify-center"
              title="افزایش سطح خستگی"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Class Resources as Rows of Pips (Divine Smite, Reality Fatigue, Moment Points) */}
      <div className="surface-card rounded-[14px] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#2F2A23] pb-2">
          <h3 className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E0A030]" />
            منابع کلاسی و پیپ‌های جادویی
          </h3>
          <span className="text-[10px] text-[#A39A89]">بازیابی خودکار هنگام استراحت</span>
        </div>

        {/* Built-in default resources based on class or customResources */}
        {character.customResources && character.customResources.length > 0 ? (
          <div className="space-y-3">
            {character.customResources.map(res => (
              <PipTracker
                key={res.id}
                label={res.name}
                current={res.current}
                max={res.max}
                resetType="long"
                onToggle={(idx) => toggleCustomResource(res.id, idx)}
              />
            ))}
          </div>
        ) : Object.keys(derived.classResources).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(derived.classResources).map(([k, res]) => (
              <PipTracker
                key={k}
                label={`${res.name}${res.currentDice ? ` (${res.currentDice})` : ''}`}
                current={res.max}
                max={Math.max(1, res.max)}
                resetType={(res.resetType as any) || 'short'}
                onToggle={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <PipTracker
              label="شکاف واقعیت / مومنت پوینت (Moment Points)"
              current={Math.min(3, character.level)}
              max={Math.max(3, character.level)}
              resetType="short"
              onToggle={() => {}}
            />
            <PipTracker
              label="فرسودگی جادو / تابش فره (Divine Smite)"
              current={2}
              max={4}
              resetType="long"
              onToggle={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};
