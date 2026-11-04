import { Button } from '../ui/Button';
import React, { useState } from 'react';
import {
  Campaign, Character, CharacterNote, CharacterParticipation,
  Session, SessionRsvpChoice, User, SessionRecap, NPC, LocationEntry, CampaignNote
} from '../../types';
import {
  Moon, Sun, Calendar, Award, Plus, Eye, Dices, ChevronLeft, ChevronDown,
  ArrowUpCircle, RotateCcw, Edit3, Lock, Unlock, Clock, KeyRound, Sparkles
} from 'lucide-react';
import { HPBar } from '../common/HPBar';
import { XpAwardModal } from './XpAwardModal';
import { SnapshotRestoreModal } from './SnapshotRestoreModal';
import { DmOverrideModal } from './DmOverrideModal';
import { EditGrantModal } from './EditGrantModal';
import { NextSessionCard } from '../session/NextSessionCard';
import { PreviouslyOnCard } from '../session/PreviouslyOnCard';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { partitionSessions } from '../../../shared/rules/sessionEngine';
import { toPersianDigits } from '../../../shared/rules/historyEngine';
import { api } from '../../services/api';

interface DmDashboardProps {
  characters: Character[];
  participations?: CharacterParticipation[];
  sharedNotes?: CharacterNote[];
  activeCampaign?: Campaign | null;
  onOpenSetupChecklist?: () => void;
  onUpdateCharacter: (char: Character) => void;
  onApplyGroupRest: (type: 'short' | 'long' | 'special') => void;
  onUpdateGroupResources: (delta: { rations?: number; lanternOil?: number }) => void;
  onInspectCharacter: (charId: string) => void;
  onRollDice?: (sides: number, count: number, modifier: number, label: string) => void;
  onCreateForPlayer?: () => void;
  onAwardXp?: (data: {
    participationId?: string;
    characterId?: string;
    amount: number;
    reason: string;
    isPartyWide: boolean;
  }) => Promise<void>;
  onToggleMilestoneLevelUp?: (participationId: string, available: boolean) => Promise<void>;
  onUndoLevelUp?: (participationId: string) => Promise<void>;
  onToggleRespecWindow?: (participationId: string, open: boolean) => Promise<void>;
  onDmOverride?: (participationId: string, updates: any, reason: string) => Promise<void>;
  onRefreshCampaign?: () => void;
  // Step 4.1: Sessions & Scheduling
  sessions?: Session[];
  currentUser?: User | null;
  onRsvpSession?: (sessionId: string, status: SessionRsvpChoice, note?: string) => Promise<void>;
  onVoteSessionPoll?: (sessionId: string, optionId: string, choice: SessionRsvpChoice) => Promise<void>;
  onConfirmPollOption?: (sessionId: string, optionId: string) => Promise<void>;
  onOpenSessionList?: () => void;
  onOpenCreateSession?: () => void;
  onOpenAttendance?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  onOpenClosingSheet?: (session: Session) => void;
  latestRecap?: SessionRecap | null;
  onOpenRecapArchive?: () => void;
  onOpenCreateRecap?: () => void;
  onEditRecap?: (recap: SessionRecap) => void;
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
}

/* ------------------------------------------------------------------
   Layout rules for this screen
   - Top: what the DM does every few minutes (XP, secret roll, group rest).
   - Middle: the next session and the recap.
   - Party: each player gets HP + two everyday buttons. Rare tools
     (level-up, respec, snapshots, direct edit, grants) live inside a
     collapsed "ابزارهای مستر" section so a card is calm by default.
   - Nothing pulses; state is shown in words.
   ------------------------------------------------------------------ */
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
const secondaryBtn = `inline-flex items-center justify-center gap-1.5 h-11 px-3 rounded-lg border border-border bg-surface-2 text-text-primary text-sm font-medium hover:border-accent transition ${focusRing}`;
const primaryBtn = `inline-flex items-center justify-center gap-1.5 h-11 px-3 rounded-lg bg-accent text-on-accent text-sm font-bold hover:bg-accent-hover transition ${focusRing}`;

interface ToolRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  trailing?: string;
  tone?: 'default' | 'danger';
}
const ToolRow: React.FC<ToolRowProps> = ({ icon, label, onClick, trailing, tone = 'default' }) => (
  <Button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[44px] flex items-center gap-3 px-3 text-sm text-start hover:bg-surface-2 transition ${
      tone === 'danger' ? 'text-danger' : 'text-text-primary'
    } ${focusRing}`}
  >
    <span className="shrink-0 text-text-muted">{icon}</span>
    <span className="flex-1 min-w-0 truncate">{label}</span>
    {trailing && <span className="text-xs text-text-muted shrink-0">{trailing}</span>}
  </Button>
);

export const DmDashboard: React.FC<DmDashboardProps> = ({
  characters,
  participations = [],
  sharedNotes = [],
  activeCampaign,
  onOpenSetupChecklist,
  onUpdateCharacter,
  onApplyGroupRest,
  onInspectCharacter,
  onRollDice,
  onCreateForPlayer,
  onAwardXp,
  onToggleMilestoneLevelUp,
  onUndoLevelUp,
  onToggleRespecWindow,
  onDmOverride,
  onRefreshCampaign,
  sessions = [],
  currentUser,
  onRsvpSession,
  onVoteSessionPoll,
  onConfirmPollOption,
  onOpenSessionList,
  onOpenCreateSession,
  onOpenAttendance,
  onEditSession,
  onOpenClosingSheet,
  latestRecap,
  onOpenRecapArchive,
  onOpenCreateRecap,
  onEditRecap,
  npcs = [],
  locations = [],
  campaignNotes = []
}) => {
  const [worldDay, setWorldDay] = useState(14);
  const [worldMonth] = useState('آبان');
  const [worldYear] = useState(412);
  const [secretCheckNotice, setSecretCheckNotice] = useState<string | null>(null);

  // Modals state
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [snapshotModalChar, setSnapshotModalChar] = useState<{ participationId: string; characterName: string } | null>(null);
  const [overrideModalChar, setOverrideModalChar] = useState<{ character: Character; participation?: CharacterParticipation | null } | null>(null);
  const [grantModalChar, setGrantModalChar] = useState<{ participationId: string; characterName: string } | null>(null);
  const [undoTarget, setUndoTarget] = useState<{ participationId: string; characterName: string } | null>(null);

  const adjustHp = (char: Character, delta: number) => {
    const nextCurrent = Math.max(0, Math.min(char.hp.max + (char.hp.temp || 0), char.hp.current + delta));
    onUpdateCharacter({ ...char, hp: { ...char.hp, current: nextCurrent } });
  };

  const awardInspiration = (char: Character) => {
    onUpdateCharacter({ ...char, skillPoints: char.skillPoints + 1 });
  };

  const rollSecretCheck = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setSecretCheckNotice(`پرتاب مخفی: ${toPersianDigits(d20)}`);
    if (onRollDice) onRollDice(20, 1, 0, 'چک ادراک مخفی مستر');
    setTimeout(() => setSecretCheckNotice(null), 4000);
  };

  const getParticipationForChar = (charId: string) => participations.find(p => p.characterId === charId);

  // Only claim a setup count when the campaign actually reports one.
  const completedSteps = activeCampaign?.wizardState?.completed?.length;
  const setupIncomplete = typeof completedSteps === 'number' && completedSteps < 8;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Setup is unfinished: the one thing worth interrupting for */}
      {setupIncomplete && onOpenSetupChecklist && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5">
          <span className="text-sm text-text-primary">
            راه‌اندازی کمپین کامل نیست: {toPersianDigits(completedSteps)} از ۸ گام
          </span>
          <Button type="button" onClick={onOpenSetupChecklist} className={`${primaryBtn} shrink-0`}>
            ادامه
          </Button>
        </div>
      )}

      {/* Everyday actions */}
      <section className="space-y-2" aria-label="اقدام‌های سریع">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {onAwardXp && (
            <Button type="button" onClick={() => setXpModalOpen(true)} className={primaryBtn}>
              <Award className="w-4 h-4" />
              <span>اعطای XP</span>
            </Button>
          )}
          <Button type="button" onClick={rollSecretCheck} className={secondaryBtn}>
            <Dices className="w-4 h-4 text-accent" />
            <span>پرتاب مخفی</span>
          </Button>
          <Button type="button" onClick={() => onApplyGroupRest('short')} className={secondaryBtn}>
            <Moon className="w-4 h-4 text-accent" />
            <span>استراحت کوتاه</span>
          </Button>
          <Button type="button" onClick={() => onApplyGroupRest('long')} className={secondaryBtn}>
            <Sun className="w-4 h-4 text-accent" />
            <span>استراحت بلند</span>
          </Button>
        </div>
        {secretCheckNotice && (
          <p role="status" className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm font-bold text-text-primary text-center">
            {secretCheckNotice}
          </p>
        )}
      </section>

      {/* Sessions */}
      {onOpenSessionList && (
        <NextSessionCard
          session={partitionSessions(sessions).nextSession || null}
          campaign={activeCampaign || null}
          currentUser={currentUser || null}
          userRole="owner"
          onRsvp={onRsvpSession || (async () => {})}
          onVotePoll={onVoteSessionPoll || (async () => {})}
          onConfirmPollOption={onConfirmPollOption}
          onOpenSessionList={onOpenSessionList}
          onOpenCreateSession={onOpenCreateSession}
          onOpenAttendance={onOpenAttendance}
          onEditSession={onEditSession}
          onOpenClosingSheet={onOpenClosingSheet}
        />
      )}

      {onOpenRecapArchive && (
        <PreviouslyOnCard
          recap={latestRecap || null}
          campaign={activeCampaign || null}
          currentUser={currentUser || null}
          userRole="owner"
          npcs={npcs}
          locations={locations}
          campaignNotes={campaignNotes}
          onOpenArchive={onOpenRecapArchive}
          onOpenCreateRecap={onOpenCreateRecap}
          onEditRecap={onEditRecap}
        />
      )}

      {/* Party */}
      <section className="space-y-3" aria-label="اعضای گروه">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-bold text-text-primary">شخصیت‌های گروه</h3>
            <span className="text-sm text-text-muted">{toPersianDigits(characters.length)}</span>
          </div>
          {onCreateForPlayer && (
            <Button type="button" onClick={onCreateForPlayer} className={secondaryBtn}>
              <Plus className="w-4 h-4" />
              <span>ساخت شخصیت برای بازیکن</span>
            </Button>
          )}
        </div>

        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
            <h4 className="text-base font-bold text-text-primary">هنوز شخصیتی در گروه نیست</h4>
            <p className="text-sm text-text-muted">با کد دعوت بازیکن اضافه کنید، یا برای یکی از آن‌ها شخصیت بسازید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map(char => {
              const hasSharedNotes = sharedNotes.some(n => n.characterId === char.id);
              const part = getParticipationForChar(char.id);
              const isLevelUpAvailable = Boolean(part?.levelUpAvailable);
              const isSheetLocked = part?.sheetLocked !== false;
              const hasTools = Boolean(
                (onToggleMilestoneLevelUp && part) ||
                (onToggleRespecWindow && part) ||
                part ||
                onDmOverride ||
                (onUndoLevelUp && part && char.level > 1)
              );

              return (
                <div key={char.id} className="rounded-xl bg-surface border border-border p-3 space-y-3 content-visibility-card">
                  {/* Who */}
                  <div className="flex items-center gap-3">
                    {char.portraitUrl ? (
                      <img
                        src={char.portraitUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <span className="w-11 h-11 rounded-lg bg-surface-2 border border-border text-lg font-bold text-accent flex items-center justify-center shrink-0" aria-hidden="true">
                        {char.name?.[0] || '؟'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-text-primary truncate">{char.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                        <span>
                          سطح {toPersianDigits(char.level)} {char.className}
                          {char.subclassName ? ` (${char.subclassName})` : ''}
                        </span>
                        <span>AC {toPersianDigits(char.ac)}</span>
                      </div>
                    </div>
                  </div>

                  {(isLevelUpAvailable || hasSharedNotes) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold">
                      {isLevelUpAvailable && <span className="text-success">آماده ارتقای سطح</span>}
                      {hasSharedNotes && (
                        <span className="flex items-center gap-1 text-accent-hover">
                          <Eye className="w-3.5 h-3.5" />
                          یادداشت اشتراکی دارد
                        </span>
                      )}
                    </div>
                  )}

                  <HPBar
                    current={char.hp.current}
                    max={char.hp.max}
                    temp={char.hp.temp}
                    onAdjust={(delta) => adjustHp(char, delta)}
                  />

                  {/* Everyday buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" onClick={() => awardInspiration(char)} className={secondaryBtn}>
                      <Award className="w-4 h-4 text-accent" />
                      <span>اعطای الهام</span>
                    </Button>
                    <Button type="button" onClick={() => onInspectCharacter(char.id)} className={secondaryBtn}>
                      <span>باز کردن برگه</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Rare tools, collapsed */}
                  {hasTools && (
                    <details className="group rounded-lg border border-border">
                      <summary className="min-h-[44px] flex items-center justify-between gap-2 px-3 text-sm text-text-muted cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span>ابزارهای مستر</span>
                        <span className="flex items-center gap-2">
                          {part && <span className="text-xs">XP {toPersianDigits(part.xp ?? 0)}</span>}
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <div className="border-t border-border divide-y divide-border">
                        {onToggleMilestoneLevelUp && part && (
                          <ToolRow
                            icon={<ArrowUpCircle className="w-4 h-4" />}
                            label={isLevelUpAvailable ? 'لغو ارتقای آماده' : 'آماده‌سازی ارتقا (مایلستون)'}
                            onClick={() => onToggleMilestoneLevelUp(part.id, !isLevelUpAvailable)}
                          />
                        )}
                        {onToggleRespecWindow && part && (
                          <ToolRow
                            icon={isSheetLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            label={isSheetLocked ? 'باز کردن قفل برگه' : 'قفل کردن برگه'}
                            trailing={isSheetLocked ? 'قفل است' : 'باز است'}
                            onClick={() => onToggleRespecWindow(part.id, isSheetLocked)}
                          />
                        )}
                        {part && (
                          <ToolRow
                            icon={<KeyRound className="w-4 h-4" />}
                            label="اجازه‌ی ویرایش موقت"
                            onClick={() => setGrantModalChar({ participationId: part.id, characterName: char.name })}
                          />
                        )}
                        {onDmOverride && (
                          <ToolRow
                            icon={<Edit3 className="w-4 h-4" />}
                            label="ویرایش مستقیم برگه"
                            onClick={() => setOverrideModalChar({ character: char, participation: part })}
                          />
                        )}
                        {part && (
                          <ToolRow
                            icon={<Clock className="w-4 h-4" />}
                            label="بازگرداندن از اسنپ‌شات"
                            onClick={() => setSnapshotModalChar({ participationId: part.id, characterName: char.name })}
                          />
                        )}
                        {onUndoLevelUp && part && char.level > 1 && (
                          <ToolRow
                            tone="danger"
                            icon={<RotateCcw className="w-4 h-4" />}
                            label="واگرد آخرین ارتقا"
                            onClick={() => setUndoTarget({ participationId: part.id, characterName: char.name })}
                          />
                        )}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiet footer: world date + checklist link */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm text-text-primary min-w-0">
          <Calendar className="w-4 h-4 text-text-muted shrink-0" />
          <span className="truncate">
            {toPersianDigits(worldDay)} {worldMonth}، سال {toPersianDigits(worldYear)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => setWorldDay(d => d + 1)} className={secondaryBtn}>
            <span>روز بعد</span>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {!setupIncomplete && onOpenSetupChecklist && (
            <Button type="button" onClick={onOpenSetupChecklist} className={secondaryBtn}>
              <Sparkles className="w-4 h-4 text-accent" />
              <span>چک‌لیست راه‌اندازی</span>
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      {xpModalOpen && onAwardXp && (
        <XpAwardModal
          isOpen={xpModalOpen}
          onClose={() => setXpModalOpen(false)}
          characters={characters}
          onAwardXp={async (data) => {
            await onAwardXp(data);
            if (onRefreshCampaign) onRefreshCampaign();
          }}
        />
      )}

      {snapshotModalChar && activeCampaign && (
        <SnapshotRestoreModal
          isOpen={Boolean(snapshotModalChar)}
          onClose={() => setSnapshotModalChar(null)}
          campaignId={activeCampaign.id}
          participationId={snapshotModalChar.participationId}
          characterName={snapshotModalChar.characterName}
          onSnapshotRestored={() => {
            if (onRefreshCampaign) onRefreshCampaign();
          }}
        />
      )}

      {overrideModalChar && onDmOverride && (
        <DmOverrideModal
          isOpen={Boolean(overrideModalChar)}
          onClose={() => setOverrideModalChar(null)}
          character={overrideModalChar.character}
          participation={overrideModalChar.participation}
          onOverride={async (updates, reason) => {
            const partId = overrideModalChar.participation?.id || `part-${overrideModalChar.character.id}`;
            await onDmOverride(partId, updates, reason);
            if (onRefreshCampaign) onRefreshCampaign();
          }}
        />
      )}

      {grantModalChar && activeCampaign && (
        <EditGrantModal
          isOpen={Boolean(grantModalChar)}
          onClose={() => setGrantModalChar(null)}
          characterName={grantModalChar.characterName}
          campaignId={activeCampaign.id}
          participationId={grantModalChar.participationId}
          onGrant={async (data) => {
            await api.createEditGrant(
              activeCampaign.id,
              grantModalChar.participationId,
              data.scope,
              data.preset,
              data.fields,
              data.expiresAt,
              data.usesLeft,
              data.reason
            );
            setGrantModalChar(null);
            if (onRefreshCampaign) onRefreshCampaign();
          }}
        />
      )}

      <ConfirmSheet
        isOpen={Boolean(undoTarget)}
        onClose={() => setUndoTarget(null)}
        title="واگرد آخرین ارتقا"
        message={undoTarget ? `آخرین ارتقای سطح ${undoTarget.characterName} واگرد می‌شود. ادامه می‌دهید؟` : ''}
        confirmText="واگرد ارتقا"
        destructive
        onConfirm={() => {
          if (undoTarget && onUndoLevelUp) onUndoLevelUp(undoTarget.participationId);
        }}
      />
    </div>
  );
};