import { Button } from '../ui/Button';
import React, { useState } from 'react';
import { 
  Campaign, Character, CharacterNote, CharacterParticipation, 
  Session, SessionRsvpChoice, User, SessionRecap, NPC, LocationEntry, CampaignNote 
} from '../../types';
import { 
  Users, Heart, Shield, Zap, Sparkles, Moon, Sun, 
  Calendar, Award, Plus, Eye, Dices, ChevronRight, CheckCircle2,
  ArrowUpCircle, RotateCcw, Edit3, Lock, Unlock, Clock, BookOpen
} from 'lucide-react';
import { HPBar } from '../common/HPBar';
import { XpAwardModal } from './XpAwardModal';
import { SnapshotRestoreModal } from './SnapshotRestoreModal';
import { DmOverrideModal } from './DmOverrideModal';
import { EditGrantModal } from './EditGrantModal';
import { NextSessionCard } from '../session/NextSessionCard';
import { PreviouslyOnCard } from '../session/PreviouslyOnCard';
import { partitionSessions } from '../../../shared/rules/sessionEngine';
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

export const DmDashboard: React.FC<DmDashboardProps> = ({
  characters,
  participations = [],
  sharedNotes = [],
  activeCampaign,
  onOpenSetupChecklist,
  onUpdateCharacter,
  onApplyGroupRest,
  onUpdateGroupResources,
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
  const [worldMonth, setWorldMonth] = useState('آبان');
  const [worldYear, setWorldYear] = useState(412);
  const [secretCheckNotice, setSecretCheckNotice] = useState<string | null>(null);

  // Modals state
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [snapshotModalChar, setSnapshotModalChar] = useState<{
    participationId: string;
    characterName: string;
  } | null>(null);
  const [overrideModalChar, setOverrideModalChar] = useState<{
    character: Character;
    participation?: CharacterParticipation | null;
  } | null>(null);
  const [grantModalChar, setGrantModalChar] = useState<{
    participationId: string;
    characterName: string;
  } | null>(null);

  const nextDay = () => {
    setWorldDay(prev => prev + 1);
  };

  const adjustHp = (char: Character, delta: number) => {
    const nextCurrent = Math.max(0, Math.min(char.hp.max + (char.hp.temp || 0), char.hp.current + delta));
    onUpdateCharacter({
      ...char,
      hp: { ...char.hp, current: nextCurrent }
    });
  };

  const awardInspiration = (char: Character) => {
    onUpdateCharacter({
      ...char,
      skillPoints: char.skillPoints + 1
    });
  };

  const rollSecretCheck = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const msg = `پرتاب مخفی دانجن مستر: ${d20}`;
    setSecretCheckNotice(msg);
    if (onRollDice) {
      onRollDice(20, 1, 0, 'چک ادراک مخفی مستر (Secret DM Check)');
    }
    setTimeout(() => setSecretCheckNotice(null), 4000);
  };

  const getParticipationForChar = (charId: string): CharacterParticipation | undefined => {
    return participations.find(p => p.characterId === charId);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* World-Date Bar + "Next Day" Button */}
      <div className="surface-card rounded-[14px] p-3.5 flex flex-wrap items-center justify-between gap-3 card-gold-top">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[10px] bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-text-muted block">گاهشمار زمان زروانیا</span>
            <span className="font-extrabold text-sm text-text-primary">
              {worldDay} {worldMonth}، سال {worldYear} عصر شکاف
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={nextDay}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target min-w-[44px]"
        >
          <span>روز بعد</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Step 4.1: Next Session / Scheduling Card for DM */}
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

      {/* Step 4.2: Previously on... / Latest Recap Card for DM */}
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

      {/* Campaign Setup Checklist (Progress Ring / Shortcut) */}
      <div className="surface-card rounded-[14px] p-3.5 flex flex-wrap items-center justify-between gap-2 gap-3 border border-border hover:border-accent/40 transition">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent-hover border border-accent/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-text-primary">چک‌لیست راه‌اندازی و آمادگی کمپین</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-bold">
                {activeCampaign?.wizardState?.completed?.length || 8}/8 گام
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              مشخصات، قوانین 5e، تقویم، جناح‌ها، هیولاها، لوت و جلسه‌ی صفر
            </p>
          </div>
        </div>

        {onOpenSetupChecklist && (
          <Button
            type="button"
            onClick={onOpenSetupChecklist}
            className="px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold transition flex items-center gap-1 min-h-[44px]"
          >
            <span>بازبینی چک‌لیست</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Quick-Action Bar: Award XP, Award Inspiration, Roll Secret Check, Group Rest */}
      <div className="surface-card rounded-[14px] p-3 space-y-2">
        <span className="text-xs font-bold text-text-muted block px-0.5">عملیات سریع گروهی و پیشرفت</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* XP Award Quick Action */}
          <Button
            type="button"
            onClick={() => setXpModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-accent/15 border border-accent/40 text-accent-hover text-xs font-bold hover:bg-accent/25 transition touch-target min-w-[44px]"
          >
            <Award className="w-4 h-4 text-accent-hover" />
            <span>اعطای امتیاز تجربه (XP)</span>
          </Button>

          <Button
            type="button"
            onClick={rollSecretCheck}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-surface-2 border border-border text-text-primary text-xs font-bold hover:border-accent transition touch-target min-w-[44px]"
          >
            <Dices className="w-4 h-4 text-accent" />
            <span>چک ادراک مخفی</span>
          </Button>

          <Button
            type="button"
            onClick={() => onApplyGroupRest('short')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-surface-2 border border-border text-text-primary text-xs font-bold hover:border-accent transition touch-target min-w-[44px]"
          >
            <Moon className="w-4 h-4 text-accent" />
            <span>استراحت کوتاه گروه</span>
          </Button>

          <Button
            type="button"
            onClick={() => onApplyGroupRest('long')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-surface-2 border border-border text-text-primary text-xs font-bold hover:border-accent transition touch-target min-w-[44px]"
          >
            <Sun className="w-4 h-4 text-accent" />
            <span>استراحت بلند گروه</span>
          </Button>
        </div>

        {secretCheckNotice && (
          <div className="p-2 rounded-[8px] bg-accent/20 border border-accent text-text-primary text-xs font-bold text-center animate-pulse">
            {secretCheckNotice}
          </div>
        )}
      </div>

      {/* Player Cards in a Strip with Big HP Controls & Level Up / Sheet Lock tools */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-text-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" />
              یاران حاضر در کمپین ({characters.length})
            </h3>
            <span className="text-xs text-text-muted hidden sm:inline">• نظارت، کنترل ارتقا، اسنپ‌شات و قفل برگه</span>
          </div>
          {onCreateForPlayer && (
            <Button
              type="button"
              onClick={onCreateForPlayer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-accent/20 text-accent-hover border border-accent/40 hover:bg-accent/30 text-xs font-bold transition min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت برای بازیکن (ویزارد)</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characters.map(char => {
            const hasSharedNotes = sharedNotes.some(n => n.characterId === char.id);
            const part = getParticipationForChar(char.id);
            const isLevelUpAvailable = Boolean(part?.levelUpAvailable);
            const isSheetLocked = part?.sheetLocked !== false;

            return (
              <div
                key={char.id}
                className="surface-card rounded-[14px] p-3.5 border border-border transition hover:border-border/80 space-y-3 content-visibility-card"
              >
                {/* Header: Portrait, Name, Class & "Needs Attention" Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={char.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
                      alt={char.name}
                      loading="lazy"
                      decoding="async"
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-[10px] object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-text-primary truncate">{char.name}</span>
                        <span className="text-xs px-1.5 py-0.2 rounded-[6px] bg-accent/15 text-accent border border-accent/30 font-bold shrink-0">
                          سطح {char.level}
                        </span>
                        {isLevelUpAvailable && (
                          <span className="text-xs px-1.5 py-0.2 rounded-[6px] bg-success/20 text-success border border-success/30 font-bold shrink-0 animate-pulse">
                            آماده ارتقا
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {char.className} {char.subclassName ? `(${char.subclassName})` : ''} • AC {char.ac}
                      </p>
                    </div>
                  </div>

                  {/* "Needs Attention" Amber Badge for unread/shared notes */}
                  {hasSharedNotes && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-accent/20 text-accent border border-accent/40 flex items-center gap-1 shrink-0 animate-pulse">
                      <Eye className="w-3 h-3" />
                      نیاز به توجه
                    </span>
                  )}
                </div>

                {/* Big HP Bar with 48px Buttons */}
                <HPBar
                  current={char.hp.current}
                  max={char.hp.max}
                  temp={char.hp.temp}
                  onAdjust={(delta) => adjustHp(char, delta)}
                />

                {/* Step 3.4 Level-Up, Lock & Snapshot Controls for DM */}
                <div className="p-2.5 rounded-xl bg-info border border-border space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-text-muted font-bold">ابزارهای دانجن مستر:</span>
                    <span className="text-xs text-text-primary font-mono">
                      XP: {part?.xp ?? 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* Milestone Level-Up Toggle */}
                    {onToggleMilestoneLevelUp && part && (
                      <Button
                        type="button"
                        onClick={() => onToggleMilestoneLevelUp(part.id, !isLevelUpAvailable)}
                        className={`px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 font-bold transition ${
                          isLevelUpAvailable
                            ? 'bg-success/20 border-success text-success'
                            : 'bg-surface-2 border-border text-text-primary hover:border-accent'
                        }`}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>{isLevelUpAvailable ? 'لغو ارتقا' : 'ارتقای مایلیستون'}</span>
                      </Button>
                    )}

                    {/* Respec Window Toggle */}
                    {onToggleRespecWindow && part && (
                      <Button
                        type="button"
                        onClick={() => onToggleRespecWindow(part.id, isSheetLocked)}
                        className={`px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 font-bold transition ${
                          !isSheetLocked
                            ? 'bg-accent/20 border-accent text-accent-hover'
                            : 'bg-surface-2 border-border text-text-primary hover:border-accent'
                        }`}
                      >
                        {isSheetLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{isSheetLocked ? 'بازگشایی Respec' : 'قفل کردن برگه'}</span>
                      </Button>
                    )}

                    {/* Snapshot Restore Modal */}
                    {part && (
                      <Button
                        type="button"
                        onClick={() => setSnapshotModalChar({ participationId: part.id, characterName: char.name })}
                        className="px-2 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent text-text-primary flex items-center justify-center gap-1 font-bold transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <span>اسنپ‌شات‌ها (10)</span>
                      </Button>
                    )}

                    {/* Undo Last Level-Up */}
                    {onUndoLevelUp && part && char.level > 1 && (
                      <Button
                        type="button"
                        onClick={() => {
                          if (confirm(`آیا از واگرد آخرین ارتقای سطح برای ${char.name} اطمینان دارید؟`)) {
                            onUndoLevelUp(part.id);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-danger text-danger flex items-center justify-center gap-1 font-bold transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>واگرد ارتقا (-1)</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Award Inspiration / DM Override / Inspect */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs gap-2">
                  <Button
                    type="button"
                    onClick={() => awardInspiration(char)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-border text-accent hover:border-accent text-xs font-bold transition touch-target min-w-[44px]"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>اعطای الهام</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setOverrideModalChar({ character: char, participation: part })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-border text-text-primary hover:text-accent text-xs font-bold transition touch-target min-w-[44px]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-accent" />
                    <span>ویرایش مستقیم DM</span>
                  </Button>

                  {part && (
                    <Button
                      type="button"
                      onClick={() => setGrantModalChar({ participationId: part.id, characterName: char.name })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-border text-accent-hover hover:border-accent text-xs font-bold transition touch-target min-w-[44px]"
                      title="صدور مجوز ویرایش موقت"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>اجازه‌ی ویرایش</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={() => onInspectCharacter(char.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-border text-text-primary hover:text-accent text-xs font-bold transition touch-target min-w-[44px] ms-auto"
                  >
                    <span>برگه</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Award Modal */}
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

      {/* Snapshot Restore Modal */}
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

      {/* DM Override Modal */}
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

      {/* Edit Grant Modal */}
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
    </div>
  );
};
