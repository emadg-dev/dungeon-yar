import React, { useState } from 'react';
import { Campaign, Character, CharacterNote, CharacterParticipation, Session, SessionRsvpChoice, User } from '../../types';
import { 
  Users, Heart, Shield, Zap, Sparkles, Moon, Sun, 
  Calendar, Award, Plus, Eye, Dices, ChevronRight, CheckCircle2,
  ArrowUpCircle, RotateCcw, Edit3, Lock, Unlock, Clock
} from 'lucide-react';
import { HPBar } from '../common/HPBar';
import { XpAwardModal } from './XpAwardModal';
import { SnapshotRestoreModal } from './SnapshotRestoreModal';
import { DmOverrideModal } from './DmOverrideModal';
import { NextSessionCard } from '../session/NextSessionCard';
import { partitionSessions } from '../../../shared/rules/sessionEngine';

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
  onRefreshCampaign
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
          <div className="w-10 h-10 rounded-[10px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#A39A89] block">گاهشمار زمان زروانیا</span>
            <span className="font-extrabold text-sm text-[#EDE6D8]">
              {worldDay} {worldMonth}، سال {worldYear} عصر شکاف
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={nextDay}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target"
        >
          <span>روز بعد</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Campaign Setup Checklist (Progress Ring / Shortcut) */}
      <div className="surface-card rounded-[14px] p-3.5 flex items-center justify-between gap-3 border border-[#2F2A23] hover:border-[#E0A030]/40 transition">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0A030]/15 text-[#F2C265] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#EDE6D8]">چک‌لیست راه‌اندازی و آمادگی کمپین</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6F9E78]/20 text-[#6F9E78] font-bold">
                {activeCampaign?.wizardState?.completed?.length || 8}/۸ گام
              </span>
            </div>
            <p className="text-[11px] text-[#A39A89] mt-0.5">
              مشخصات، قوانین ۵e، تقویم، جناح‌ها، هیولاها، لوت و جلسه‌ی صفر
            </p>
          </div>
        </div>

        {onOpenSetupChecklist && (
          <button
            type="button"
            onClick={onOpenSetupChecklist}
            className="px-3 py-1.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold transition flex items-center gap-1 min-h-[36px]"
          >
            <span>بازبینی چک‌لیست</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick-Action Bar: Award XP, Award Inspiration, Roll Secret Check, Group Rest */}
      <div className="surface-card rounded-[14px] p-3 space-y-2">
        <span className="text-[11px] font-bold text-[#A39A89] block px-0.5">عملیات سریع گروهی و پیشرفت</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* XP Award Quick Action */}
          <button
            type="button"
            onClick={() => setXpModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#E0A030]/15 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition touch-target"
          >
            <Award className="w-4 h-4 text-[#F2C265]" />
            <span>اعطای امتیاز تجربه (XP)</span>
          </button>

          <button
            type="button"
            onClick={rollSecretCheck}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Dices className="w-4 h-4 text-[#E0A030]" />
            <span>چک ادراک مخفی</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyGroupRest('short')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Moon className="w-4 h-4 text-[#E0A030]" />
            <span>استراحت کوتاه گروه</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyGroupRest('long')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-xs font-bold hover:border-[#E0A030] transition touch-target"
          >
            <Sun className="w-4 h-4 text-[#E0A030]" />
            <span>استراحت بلند گروه</span>
          </button>
        </div>

        {secretCheckNotice && (
          <div className="p-2 rounded-[8px] bg-[#E0A030]/20 border border-[#E0A030] text-[#EDE6D8] text-xs font-bold text-center animate-pulse">
            {secretCheckNotice}
          </div>
        )}
      </div>

      {/* Player Cards in a Strip with Big HP Controls & Level Up / Sheet Lock tools */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E0A030]" />
              یاران حاضر در کمپین ({characters.length})
            </h3>
            <span className="text-[10px] text-[#A39A89] hidden sm:inline">• نظارت، کنترل ارتقا، اسنپ‌شات و قفل برگه</span>
          </div>
          {onCreateForPlayer && (
            <button
              type="button"
              onClick={onCreateForPlayer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 hover:bg-[#E0A030]/30 text-xs font-bold transition min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت برای بازیکن (ویزارد)</span>
            </button>
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
                className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] transition hover:border-[#2F2A23]/80 space-y-3"
              >
                {/* Header: Portrait, Name, Class & "Needs Attention" Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={char.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
                      alt={char.name}
                      className="w-11 h-11 rounded-[10px] object-cover border border-[#2F2A23] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-[#EDE6D8] truncate">{char.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 font-bold shrink-0">
                          سطح {char.level}
                        </span>
                        {isLevelUpAvailable && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30 font-bold shrink-0 animate-pulse">
                            آماده ارتقا
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A39A89] truncate">
                        {char.className} {char.subclassName ? `(${char.subclassName})` : ''} • AC {char.ac}
                      </p>
                    </div>
                  </div>

                  {/* "Needs Attention" Amber Badge for unread/shared notes */}
                  {hasSharedNotes && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/40 flex items-center gap-1 shrink-0 animate-pulse">
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
                <div className="p-2.5 rounded-xl bg-[#141822] border border-[#2F2A23] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A39A89] font-bold">ابزارهای دانجن مستر:</span>
                    <span className="text-[10px] text-[#EDE6D8] font-mono">
                      XP: {part?.xp ?? 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {/* Milestone Level-Up Toggle */}
                    {onToggleMilestoneLevelUp && part && (
                      <button
                        type="button"
                        onClick={() => onToggleMilestoneLevelUp(part.id, !isLevelUpAvailable)}
                        className={`px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 font-bold transition ${
                          isLevelUpAvailable
                            ? 'bg-[#6F9E78]/20 border-[#6F9E78] text-[#6F9E78]'
                            : 'bg-[#201D19] border-[#2F2A23] text-[#EDE6D8] hover:border-[#E0A030]'
                        }`}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>{isLevelUpAvailable ? 'لغو ارتقا' : 'ارتقای مایلیستون'}</span>
                      </button>
                    )}

                    {/* Respec Window Toggle */}
                    {onToggleRespecWindow && part && (
                      <button
                        type="button"
                        onClick={() => onToggleRespecWindow(part.id, isSheetLocked)}
                        className={`px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1 font-bold transition ${
                          !isSheetLocked
                            ? 'bg-[#E0A030]/20 border-[#E0A030] text-[#F2C265]'
                            : 'bg-[#201D19] border-[#2F2A23] text-[#EDE6D8] hover:border-[#E0A030]'
                        }`}
                      >
                        {isSheetLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{isSheetLocked ? 'بازگشایی Respec' : 'قفل کردن برگه'}</span>
                      </button>
                    )}

                    {/* Snapshot Restore Modal */}
                    {part && (
                      <button
                        type="button"
                        onClick={() => setSnapshotModalChar({ participationId: part.id, characterName: char.name })}
                        className="px-2 py-1.5 rounded-lg bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-[#EDE6D8] flex items-center justify-center gap-1 font-bold transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#E0A030]" />
                        <span>اسنپ‌شات‌ها (۱۰)</span>
                      </button>
                    )}

                    {/* Undo Last Level-Up */}
                    {onUndoLevelUp && part && char.level > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`آیا از واگرد آخرین ارتقای سطح برای ${char.name} اطمینان دارید؟`)) {
                            onUndoLevelUp(part.id);
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#201D19] border border-[#2F2A23] hover:border-[#C2512B] text-[#E8836B] flex items-center justify-center gap-1 font-bold transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>واگرد ارتقا (-۱)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Award Inspiration / DM Override / Inspect */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2F2A23] text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => awardInspiration(char)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#E0A030] hover:border-[#E0A030] text-[11px] font-bold transition touch-target"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>اعطای الهام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideModalChar({ character: char, participation: part })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:text-[#E0A030] text-[11px] font-bold transition touch-target"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#E0A030]" />
                    <span>ویرایش مستقیم DM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectCharacter(char.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:text-[#E0A030] text-[11px] font-bold transition touch-target ms-auto"
                  >
                    <span>برگه</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
    </div>
  );
};
