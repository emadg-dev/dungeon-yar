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
  activeGrants?: any[];
  isDmEditMode?: boolean;
  onToggleDmEditMode?: () => void;
  onOpenEditGrantModal?: () => void;
  onOpenLockedField?: (fieldName: string) => void;
  dmHistoryEvents?: any[];
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
  activeGrants = [],
  isDmEditMode = false,
  onToggleDmEditMode,
  onOpenEditGrantModal,
  onOpenLockedField,
  dmHistoryEvents = [],
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
    'سطح 1: ضعف (Disadvantage) در چک‌های توانایی',
    'سطح 2: سرعت نصف می‌شود',
    'سطح 3: ضعف در پرتاب‌های حمله و تست‌های نجات',
    'سطح 4: حداکثر جان نصف می‌شود',
    'سطح 5: سرعت به 0 کاهش می‌یابد',
    'سطح 6: مرگ ناگهانی از فرسودگی!'
  ];

  const now = Date.now();
  const validGrants = (activeGrants || []).filter(g =>
    g && g.status === 'active' &&
    (!g.expires_at || g.expires_at > now) &&
    (!g.expiresAt || g.expiresAt > now) &&
    (g.uses_left === null || g.uses_left === undefined || g.uses_left > 0) &&
    (g.usesLeft === null || g.usesLeft === undefined || g.usesLeft > 0)
  );
  const activeGrant = validGrants[0];

  const presetLabels: Record<string, string> = {
    respec: 'بازطراحی شخصیت (Respec)',
    level_up: 'ارتقای سطح',
    ability_scores: 'امتیازهای توانایی',
    spell_swap: 'تعویض جادوها',
    inventory_add: 'افزودن تجهیزات و سکه',
    full: 'دسترسی کامل ویرایش'
  };

  const formatExpiryTime = (timestamp?: number) => {
    if (!timestamp) return 'همین جلسه';
    const diffMs = timestamp - now;
    if (diffMs <= 0) return 'منقضی شده';
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours} ساعت و ${mins} دقیقه دیگر`;
    return `${mins} دقیقه دیگر`;
  };

  const isBasicsLocked = Boolean(sheetLocked) && !isDmEditMode && !validGrants.some(g =>
    g.preset === 'full' || g.preset === 'respec' ||
    (Array.isArray(g.fields) && (g.fields.includes('*') || g.fields.includes('className')))
  );

  const isCombatStatsLocked = Boolean(sheetLocked) && !isDmEditMode && !validGrants.some(g =>
    g.preset === 'full' || g.preset === 'respec'
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Active Edit Grant Banner */}
      {activeGrant && (
        <div className="surface-card rounded-[14px] p-3.5 bg-gradient-to-r from-accent/25 via-surface to-success/25 border-2 border-accent shadow-lg shadow-accent/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 font-black" />
            </div>
            <div>
              <h4 className="text-xs font-black text-accent-hover">
                اجازه‌ی ویرایش دارید تا {formatExpiryTime(activeGrant.expires_at || activeGrant.expiresAt)}
              </h4>
              <p className="text-xs text-text-primary/90">
                مجوز فعال: {presetLabels[activeGrant.preset] || activeGrant.reason || 'مجوز موقت راوی'}
                {activeGrant.uses_left != null ? ` (${activeGrant.uses_left} بار ویرایش باقی‌مانده)` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent-hover border border-accent/40 font-bold shrink-0">
            ویرایش مجاز
          </span>
        </div>
      )}

      {/* DM Direct Edit Mode Active Banner */}
      {isDmEditMode && (
        <div className="surface-card rounded-[14px] p-3 bg-accent/15 border border-accent/50 flex flex-wrap items-center justify-between gap-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs text-accent-hover font-bold">
              حالت ویرایش مستقیم دانجن مستر فعال است. تمام فیلدها مستقیماً قابل تغییر هستند و در تاریخچه ثبت می‌شوند.
            </span>
          </div>
          {onToggleDmEditMode && (
            <button
              type="button"
              onClick={onToggleDmEditMode}
              className="text-xs px-2.5 py-1 rounded-lg bg-accent text-on-accent font-black shrink-0 hover:bg-accent-hover"
            >
              خروج از حالت DM
            </button>
          )}
        </div>
      )}
      {/* Level-Up Ready Banner */}
      {levelUpAvailable && (
        <div className="surface-card rounded-[14px] p-3.5 bg-gradient-to-r from-accent/20 via-info to-success/20 border-2 border-accent shadow-lg shadow-accent/15 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0 shadow-md">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-black text-accent-hover">ارتقای سطح آماده است!</h3>
              <p className="text-xs text-text-primary/90">
                شما به شرایط لازم برای صعود به سطح {character.level + 1} دست یافته‌اید.
              </p>
            </div>
          </div>
          {onOpenLevelUp && (
            <button
              type="button"
              onClick={onOpenLevelUp}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent font-black text-xs transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] min-h-[40px] shadow-md shadow-accent/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>صعود به سطح {character.level + 1}</span>
            </button>
          )}
        </div>
      )}

      {/* Pending Change Warning */}
      {pendingChange && (
        <div className="surface-card rounded-[14px] p-3 bg-info/10 border border-info/40 flex flex-wrap items-center justify-between gap-2 gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-info shrink-0" />
            <span className="text-xs text-info font-bold">
              یک درخواست {pendingChange.type === 'level_up' ? 'ارتقای سطح' : 'تغییر برگه'} در انتظار بررسی دانجن مستر است.
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-info/20 text-info font-bold">
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
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[12px] object-cover border border-border shadow-md"
            />
            <button
              onClick={() => setIsEditingBasics(!isEditingBasics)}
              className="absolute -bottom-1.5 -end-1.5 p-2 rounded-[10px] bg-accent text-on-accent shadow-md hover:bg-accent-hover transition touch-target min-w-[44px]"
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
                  <label className="text-xs text-text-muted block mb-1">نام کاراکتر:</label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdate({ ...character, name: e.target.value })}
                    className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="text-xs text-text-muted block">کلاس:</label>
                    {isBasicsLocked && <Lock className="w-3 h-3 text-accent" />}
                  </div>
                  {isBasicsLocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenLockedField?.('className')}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface border border-border text-sm text-text-muted text-start flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>{character.className}</span>
                      <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">قفل DM</span>
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={character.className}
                      onChange={(e) => onUpdate({ ...character, className: e.target.value })}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="text-xs text-text-muted block">نژاد / تبار:</label>
                    {isBasicsLocked && <Lock className="w-3 h-3 text-accent" />}
                  </div>
                  {isBasicsLocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenLockedField?.('race')}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface border border-border text-sm text-text-muted text-start flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>{character.race}</span>
                      <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">قفل DM</span>
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={character.race}
                      onChange={(e) => onUpdate({ ...character, race: e.target.value })}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="text-xs text-text-muted block">سطح (Level):</label>
                    {isBasicsLocked && <Lock className="w-3 h-3 text-accent" />}
                  </div>
                  {isBasicsLocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenLockedField?.('level')}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface border border-border text-sm text-text-muted text-start flex flex-wrap items-center justify-between gap-2 font-mono dice-ltr touch-target min-w-[44px]"
                    >
                      <span>{character.level}</span>
                      <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded font-sans">قفل DM</span>
                    </button>
                  ) : (
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="20"
                      value={character.level}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => onUpdate({ ...character, level: parseInt(e.target.value) || 1 })}
                      className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-black text-text-primary">{character.name}</h2>
                  <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-accent/15 text-accent border border-accent/30">
                    سطح {character.level}
                  </span>
                </div>
                <p className="text-xs text-text-muted font-medium">
                  {character.className} • {character.race}
                </p>
                {character.background && (
                  <p className="text-xs text-text-muted mt-0.5">
                    پس‌زمینه: <span className="text-text-primary">{character.background}</span>
                  </p>
                )}
              </div>
            )}

            {/* Rest Buttons Side-by-Side (Mobile-First Thumb-Zone) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => onOpenRestModal('short')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-surface-2 hover:bg-surface-2/80 text-text-primary text-xs font-bold border border-border transition touch-target min-w-[44px]"
              >
                <Moon className="w-4 h-4 text-accent" />
                استراحت کوتاه
              </button>

              <button
                type="button"
                onClick={() => onOpenRestModal('long')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-surface-2 hover:bg-surface-2/80 text-text-primary text-xs font-bold border border-border transition touch-target min-w-[44px]"
              >
                <Sun className="w-4 h-4 text-accent" />
                استراحت بلند
              </button>

              <button
                type="button"
                onClick={() => onOpenRestModal('special')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold border border-accent/30 transition touch-target min-w-[44px]"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                شهد بهار
              </button>

              <div className="flex items-center gap-1.5 ms-auto">
                <button
                  type="button"
                  onClick={handleExportJson}
                  title="خروجی JSON"
                  className="p-2.5 rounded-[12px] bg-surface-2 text-text-muted hover:text-text-primary border border-border text-xs transition touch-target min-w-[44px]"
                >
                  <Download className="w-4 h-4" />
                </button>
                <label
                  title="درون‌ریزی JSON"
                  className="p-2.5 rounded-[12px] bg-surface-2 text-text-muted hover:text-text-primary border border-border text-xs transition cursor-pointer touch-target min-w-[44px]"
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
      <div className="surface-card rounded-[14px] p-3 border border-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-start w-full sm:w-auto">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            Boolean(sheetLocked)
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'bg-success/15 text-success border border-success/30'
          }`}>
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary">
                {Boolean(sheetLocked) ? 'برگه کاراکتر قفل است' : 'ویرایش آزاد فعال است'}
              </span>
              <span className={`text-xs px-1.5 py-0.2 rounded font-mono ${
                Boolean(sheetLocked) ? 'bg-accent/15 text-accent' : 'bg-success/15 text-success'
              }`}>
                {Boolean(sheetLocked) ? 'Locked Core' : 'Respec Window'}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {Boolean(sheetLocked)
                ? 'مشخصات بنیادین جهت یکپارچگی قوانین قفل هستند؛ تغییرات اساسی نیازمند تأیید راوی است.'
                : 'پنجره ویرایش آزاد فعال است؛ می‌توانید مشخصات بنیادین را تغییر دهید.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Boolean(sheetLocked) && onOpenSheetChangeRequest && (
            <button
              type="button"
              onClick={onOpenSheetChangeRequest}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent text-xs font-bold text-accent transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] min-h-[44px] shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>درخواست تغییر به DM</span>
            </button>
          )}

          {(userRole === 'dm' || currentUser?.role === 'dm') && (
            <div className="flex items-center gap-1.5">
              {onToggleDmEditMode && (
                <button
                  type="button"
                  onClick={onToggleDmEditMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 min-h-[44px] ${
                    isDmEditMode
                      ? 'bg-accent text-on-accent'
                      : 'bg-surface-2 border border-border text-text-primary hover:border-accent'
                  }`}
                  title="حالت ویرایش مستقیم DM"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isDmEditMode ? 'حالت DM (روشن)' : 'حالت ویرایش DM'}</span>
                </button>
              )}
              {onOpenEditGrantModal && (
                <button
                  type="button"
                  onClick={onOpenEditGrantModal}
                  className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent text-accent-hover text-xs font-bold transition flex items-center gap-1 min-h-[44px]"
                  title="صدور مجوز ویرایش موقت به بازیکن"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>اجازه‌ی ویرایش</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DM Recent Changes Feed */}
      {dmHistoryEvents && dmHistoryEvents.length > 0 && (
        <div className="surface-card rounded-[14px] p-3.5 border border-border space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>تغییرات اخیر راوی (DM)</span>
            </h3>
            <span className="text-xs text-text-muted">آخرین اصلاحات و مجوزها</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {dmHistoryEvents.slice(0, 5).map((ev: any, idx: number) => (
              <div
                key={ev.id || idx}
                className="p-2.5 rounded-xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2 text-xs gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-accent-hover truncate">{ev.title || 'ویرایش DM'}</div>
                  {ev.description && (
                    <div className="text-xs text-text-muted truncate">{ev.description}</div>
                  )}
                </div>
                <span className="text-xs text-text-muted shrink-0 font-mono">
                  {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('fa-IR-u-nu-latn') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2×2 Stat Grid on Mobile (AC, Speed, Initiative, Hit Dice) + Skill Points */}
      <div>
        <h3 className="text-xs font-bold text-text-muted mb-2 px-1">شاخص‌های بنیادین مبارزه</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. AC */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Shield className="w-4 h-4 text-accent mb-1" />
            <span className="text-xs font-bold text-text-muted">درجه زره (AC)</span>
            {isCombatStatsLocked ? (
              <button
                type="button"
                onClick={() => onOpenLockedField?.('ac')}
                className="w-full flex items-center justify-center gap-1 my-0.5 touch-target min-w-[44px] cursor-pointer"
                title="برای درخواست تغییر لمس کنید"
              >
                <span className="text-2xl font-extrabold text-text-primary font-mono dice-ltr">{character.ac}</span>
                <Lock className="w-3 h-3 text-accent/70" />
              </button>
            ) : (
              <input
                type="number"
                inputMode="numeric"
                value={character.ac}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdate({ ...character, ac: parseInt(e.target.value) || 10 })}
                className="w-16 text-2xl font-extrabold text-text-primary bg-transparent text-center font-mono my-0.5 focus:outline-none dice-ltr"
              />
            )}
            <span className="text-xs text-text-muted">پوشش دفاعی</span>
          </div>

          {/* 2. Speed */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Footprints className="w-4 h-4 text-info mb-1" />
            <span className="text-xs font-bold text-text-muted">سرعت حرکت</span>
            {isCombatStatsLocked ? (
              <button
                type="button"
                onClick={() => onOpenLockedField?.('speed')}
                className="w-full flex items-center justify-center gap-1 my-0.5 touch-target min-w-[44px] cursor-pointer"
                title="برای درخواست تغییر لمس کنید"
              >
                <span className="text-2xl font-extrabold text-text-primary font-mono dice-ltr">{character.speed}</span>
                <span className="text-xs text-text-muted">متر</span>
                <Lock className="w-3 h-3 text-accent/70" />
              </button>
            ) : (
              <div className="flex items-baseline gap-1 my-0.5">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={character.speed}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onUpdate({ ...character, speed: parseFloat(e.target.value) || 9 })}
                  className="w-12 text-2xl font-extrabold text-text-primary bg-transparent text-center font-mono focus:outline-none dice-ltr"
                />
                <span className="text-xs text-text-muted">متر</span>
              </div>
            )}
            <span className="text-xs text-text-muted">30 فوت</span>
          </div>

          {/* 3. Initiative */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Zap className="w-4 h-4 text-accent mb-1" />
            <span className="text-xs font-bold text-text-muted">ابتکار عمل</span>
            <button
              type="button"
              onClick={() => onRollCheck(20, 1, totalInitiative, 'ابتکار عمل (Initiative)')}
              className="text-2xl font-extrabold text-accent font-mono my-0.5 hover:scale-105 active:scale-95 transition cursor-pointer touch-target min-w-[44px] dice-ltr"
              title="لمس برای پرتاب ابتکار عمل"
            >
              {totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative}
            </button>
            <span className="text-xs text-text-muted">چابکی + پاداش</span>
          </div>

          {/* 4. Hit Dice */}
          <div className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-center text-center">
            <Heart className="w-4 h-4 text-success mb-1" />
            <span className="text-xs font-bold text-text-muted">تاس‌های جان</span>
            <div className="flex items-center gap-1.5 my-0.5">
              <button
                type="button"
                onClick={() => adjustHitDice(-1)}
                className="w-7 h-7 rounded-[8px] bg-surface-2 border border-border text-xs font-bold text-text-muted hover:text-text-primary touch-target min-w-[44px] flex items-center justify-center"
                title="مصرف 1 تاس جان"
              >
                -
              </button>
              <span className="font-mono text-base font-extrabold text-text-primary dice-ltr px-1">
                {character.hitDice?.current ?? character.level}/{character.level}
              </span>
              <button
                type="button"
                onClick={() => adjustHitDice(1)}
                className="w-7 h-7 rounded-[8px] bg-surface-2 border border-border text-xs font-bold text-text-muted hover:text-text-primary touch-target min-w-[44px] flex items-center justify-center"
                title="بازیابی 1 تاس جان"
              >
                +
              </button>
            </div>
            <span className="text-xs text-text-muted">{character.hitDice?.die || 'd8'}</span>
          </div>
        </div>
      </div>

      {/* Skill Points & Exhaustion Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Skill Points (امتیاز مهارت زروانیا) */}
        <div className="surface-card rounded-[14px] p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-text-primary">امتیاز مهارت (Skill Points)</h4>
              <p className="text-xs text-text-muted">برای حرکات ویژه و تقویت ضربات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustSkillPoints(-1)}
              className="w-9 h-9 rounded-[10px] bg-surface-2 border border-border text-text-primary font-bold text-sm touch-target min-w-[44px] flex items-center justify-center"
              title="کاهش امتیاز مهارت"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-accent min-w-[28px] text-center dice-ltr">
              {character.skillPoints}
            </span>
            <button
              type="button"
              onClick={() => adjustSkillPoints(1)}
              className="w-9 h-9 rounded-[10px] bg-surface-2 border border-border text-text-primary font-bold text-sm touch-target min-w-[44px] flex items-center justify-center"
              title="افزایش امتیاز مهارت"
            >
              +
            </button>
          </div>
        </div>

        {/* Exhaustion Stepper */}
        <div className="surface-card rounded-[14px] p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
              character.exhaustion > 0
                ? 'bg-danger/20 text-danger border-danger/40'
                : 'bg-surface-2 text-text-muted border-border'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-text-primary">خستگی و فرسودگی</h4>
              <p className="text-xs text-text-muted">
                {exhaustionEffects[character.exhaustion]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustExhaustion(-1)}
              className="w-9 h-9 rounded-[10px] bg-surface-2 border border-border text-text-primary font-bold text-sm touch-target min-w-[44px] flex items-center justify-center"
              title="کاهش سطح خستگی"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-text-primary min-w-[28px] text-center dice-ltr">
              {character.exhaustion}
            </span>
            <button
              type="button"
              onClick={() => adjustExhaustion(1)}
              className="w-9 h-9 rounded-[10px] bg-surface-2 border border-border text-danger font-bold text-sm touch-target min-w-[44px] flex items-center justify-center"
              title="افزایش سطح خستگی"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Class Resources as Rows of Pips (Divine Smite, Reality Fatigue, Moment Points) */}
      <div className="surface-card rounded-[14px] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            منابع کلاسی و پیپ‌های جادویی
          </h3>
          <span className="text-xs text-text-muted">بازیابی خودکار هنگام استراحت</span>
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
