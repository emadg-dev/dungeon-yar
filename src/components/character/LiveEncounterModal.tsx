import React, { useState, useEffect } from 'react';
import { PlayerEncounterView, Character } from '../../types';
import { api } from '../../services/api';
import { Chip } from '../common/Chip';
import { 
  Swords, Shield, Heart, Dices, X, AlertTriangle, 
  Sparkles, CheckCircle2, Pause, ArrowLeft, RefreshCw, WifiOff 
} from 'lucide-react';

interface LiveEncounterModalProps {
  encounter: PlayerEncounterView | null;
  activeCharacter: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDice: () => void;
  onUpdateCharacterHp?: (newHp: number) => void;
  isOffline?: boolean;
}

export const LiveEncounterModal: React.FC<LiveEncounterModalProps> = ({
  encounter,
  activeCharacter,
  isOpen,
  onClose,
  onOpenDice,
  onUpdateCharacterHp,
  isOffline = false
}) => {
  const [isRollingInitiative, setIsRollingInitiative] = useState(false);
  const [initiativeRollResult, setInitiativeRollResult] = useState<number | null>(null);

  // Check if it is the player's turn
  const isMyTurn = Boolean(
    encounter &&
    encounter.status === 'active' &&
    activeCharacter &&
    encounter.currentParticipantId &&
    encounter.participants.some(
      p => p.id === encounter.currentParticipantId && p.characterId === activeCharacter.id
    )
  );

  // Trigger haptic when it becomes the player's turn (§3)
  useEffect(() => {
    if (isMyTurn && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }
  }, [isMyTurn]);

  if (!isOpen || !encounter) return null;

  // Find player's participant entry
  const myParticipant = activeCharacter
    ? encounter.participants.find(p => p.characterId === activeCharacter.id)
    : null;

  const needsInitiativeRoll = Boolean(
    myParticipant &&
    (myParticipant.initiative === null || myParticipant.initiativeStatus === 'none') &&
    encounter.status !== 'ended'
  );

  // Roll initiative for own character (§3 & §5)
  const handleRollInitiative = async () => {
    if (!activeCharacter || isRollingInitiative) return;

    setIsRollingInitiative(true);
    // DEX modifier calculation: Math.floor((dex - 10) / 2)
    const dexScore = activeCharacter.abilities?.dex || 10;
    const dexMod = Math.floor((dexScore - 10) / 2);

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = Math.max(1, Math.min(40, d20 + dexMod));

    // Brief animation delay
    setTimeout(async () => {
      try {
        setInitiativeRollResult(total);
        await api.submitInitiative(encounter.id, activeCharacter.id, total);
      } catch (err: any) {
        alert(err.message || 'خطا در ثبت ابتکار عمل.');
      } finally {
        setIsRollingInitiative(false);
      }
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="encounter-title"
      className="fixed inset-0 z-50 bg-[#0E0D0C]/95 backdrop-blur-md flex flex-col justify-between overflow-hidden"
      dir="rtl"
    >
      {/* Sticky Header */}
      <div className="bg-[#171513] border-b border-[#2F2A23] px-3.5 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] shadow-md flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#C2512B] to-[#E0A030] flex items-center justify-center text-[#0E0D0C] shrink-0 shadow-sm">
            <Swords className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h2 id="encounter-title" className="font-extrabold text-sm text-[#EDE6D8] truncate">
              {encounter.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#A39A89]">
              {encounter.location && (
                <Chip variant="region" region={encounter.location.region as any} label={encounter.location.name} />
              )}
              <span>•</span>
              <span className="text-[#E0A030] font-black">دور {encounter.round || 1}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDice}
            className="p-2 rounded-[10px] bg-[#201D19] text-[#E0A030] hover:text-[#F2C265] border border-[#2F2A23] transition touch-target"
            title="پرتاب تاس"
          >
            <Dices className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[10px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] transition touch-target"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 pb-24">
        {/* Connection Offline Banner (§3) */}
        {isOffline && (
          <div className="p-2.5 rounded-[12px] bg-[#C2512B]/20 border border-[#C2512B]/40 flex items-center gap-2 text-xs text-[#E8836B]">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>آفلاین — آخرین وضعیت دریافت شده نمایش داده می‌شود.</span>
          </div>
        )}

        {/* Paused Banner (§3) */}
        {encounter.status === 'paused' && (
          <div className="p-3 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/40 flex items-center gap-2 text-xs text-[#E0A030] font-bold">
            <Pause className="w-4 h-4 shrink-0 fill-current" />
            <span>مبارزه متوقف شد — دانجن مستر بازی را موقتاً متوقف کرده است.</span>
          </div>
        )}

        {/* Ended Banner (§3) */}
        {encounter.status === 'ended' && (
          <div className="p-3 rounded-[12px] bg-[#6F9E78]/15 border border-[#6F9E78]/40 flex items-center justify-between text-xs text-[#6F9E78] font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>پایان نبرد — مبارزه با موفقیت خاتمه یافت.</span>
            </div>
            <span>{encounter.round} دور نبرد</span>
          </div>
        )}

        {/* Strong "Your Turn" State (§3) */}
        {isMyTurn && (
          <div className="p-3.5 rounded-[14px] bg-gradient-to-r from-[#E0A030]/25 via-[#E0A030]/15 to-transparent border-2 border-[#E0A030] shadow-[0_0_20px_rgba(224,160,48,0.35)] animate-pulse flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-[#E0A030] shrink-0" />
              <div>
                <span className="font-black text-sm text-[#E0A030] block">نوبت شماست!</span>
                <span className="text-xs text-[#EDE6D8]/90">اکشن‌ها و توانایی‌های شخصیت خود را اجرا نمایید.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDice}
              className="bg-[#E0A030] text-[#0E0D0C] font-black text-xs px-3.5 py-2 rounded-[10px] shadow-sm shrink-0 touch-target"
            >
              پرتاب تاس
            </button>
          </div>
        )}

        {/* Mini Player Character Vitals Bar (§3: Quick HP access without leaving) */}
        {activeCharacter && (
          <div className="surface-card rounded-[14px] p-3 border border-[#2F2A23] flex items-center justify-between gap-3 bg-[#171513]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#6F9E78]/20 flex items-center justify-center text-[#6F9E78] shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#EDE6D8] block truncate">{activeCharacter.name}</span>
                <span className="text-[11px] text-[#A39A89]">
                  سلامت: <b className="text-[#6F9E78]">{activeCharacter.hp.current}</b> / {activeCharacter.hp.max}
                </span>
              </div>
            </div>

            {onUpdateCharacterHp && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateCharacterHp(Math.max(0, activeCharacter.hp.current - 1))}
                  className="w-8 h-8 rounded-[8px] bg-[#201D19] hover:bg-[#C2512B]/20 text-[#E8836B] font-black text-sm transition touch-target border border-[#2F2A23] flex items-center justify-center"
                  title="کاهش ۱ سلامت"
                >
                  -۱
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCharacterHp(Math.min(activeCharacter.hp.max, activeCharacter.hp.current + 1))}
                  className="w-8 h-8 rounded-[8px] bg-[#201D19] hover:bg-[#6F9E78]/20 text-[#6F9E78] font-black text-sm transition touch-target border border-[#2F2A23] flex items-center justify-center"
                  title="افزایش ۱ سلامت"
                >
                  +۱
                </button>
              </div>
            )}
          </div>
        )}

        {/* Player Roll Initiative Button (§3) */}
        {needsInitiativeRoll && (
          <div className="surface-card rounded-[14px] p-3.5 border border-[#E0A030]/50 bg-[#E0A030]/10 flex items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-xs text-[#E0A030] block">ابتکار عمل خود را بیندازید!</span>
              <span className="text-[11px] text-[#EDE6D8]/80">برای قرارگیری در ترتیب نوبت مبارزه</span>
            </div>

            <button
              type="button"
              onClick={handleRollInitiative}
              disabled={isRollingInitiative}
              className="bg-[#E0A030] text-[#0E0D0C] font-black text-xs px-3.5 py-2.5 rounded-[10px] flex items-center gap-1.5 shadow-md hover:bg-[#F2C265] transition touch-target shrink-0"
            >
              {isRollingInitiative ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال پرتاب...</span>
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  <span>پرتاب ابتکار</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Initiative Turn Order List (§3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#A39A89] px-1">
            <span>ترتیب ابتکار عمل (دور {encounter.round})</span>
            <span>{encounter.participants.length} مبارز</span>
          </div>

          <div className="space-y-2">
            {encounter.participants.map((p) => {
              const isTurn = p.id === encounter.currentParticipantId;
              const isMe = activeCharacter && p.characterId === activeCharacter.id;
              const isAlly = p.isAlly || p.kind === 'character';
              const isDefeated = p.status === 'defeated';

              return (
                <div
                  key={p.id}
                  className={`surface-card rounded-[14px] p-3 border transition-all duration-150 space-y-2 ${
                    isTurn
                      ? 'border-[#E0A030] bg-[#201D19] shadow-[0_0_12px_rgba(224,160,48,0.2)]'
                      : isMe
                      ? 'border-[#6F9E78]/50 bg-[#171513]'
                      : isDefeated
                      ? 'border-[#2F2A23] opacity-50 bg-[#171513]/40'
                      : 'border-[#2F2A23] bg-[#171513]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Initiative Badge */}
                      <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-xs font-black shrink-0 ${
                        isTurn
                          ? 'bg-[#E0A030] text-[#0E0D0C]'
                          : 'bg-[#201D19] text-[#EDE6D8] border border-[#2F2A23]'
                      }`}>
                        {p.initiative ?? '-'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[#EDE6D8] truncate">
                            {p.displayNameForPlayers}
                          </h4>

                          {isMe && (
                            <span className="text-[10px] bg-[#6F9E78]/25 text-[#6F9E78] px-1.5 py-0.2 rounded-full font-bold">
                              شخصیت شما
                            </span>
                          )}

                          {isTurn && (
                            <span className="text-[10px] bg-[#E0A030] text-[#0E0D0C] font-black px-1.5 py-0.2 rounded-full">
                              نوبت جاری
                            </span>
                          )}

                          {isDefeated && (
                            <span className="text-[10px] bg-[#C2512B]/20 text-[#D66138] px-1.5 py-0.2 rounded-full">
                              شکست‌خورده
                            </span>
                          )}
                        </div>

                        {/* Qualitative Health & Stats (§3) */}
                        <div className="flex items-center gap-2 text-[11px] text-[#A39A89] mt-0.5">
                          {/* Qualitative health status badge */}
                          <span className={`font-bold ${
                            p.healthStatus === 'سالم' ? 'text-[#6F9E78]' :
                            p.healthStatus === 'زخمی' ? 'text-[#E0A030]' :
                            p.healthStatus === 'نیمه‌جان' ? 'text-[#C97B4A]' : 'text-[#D66138]'
                          }`}>
                            {p.healthStatus}
                          </span>

                          {/* Exact HP if enabled or ally (§3) */}
                          {p.exactHp && (
                            <span>
                              HP: <b className="text-[#EDE6D8]">{p.exactHp.current}/{p.exactHp.max}</b>
                            </span>
                          )}

                          {/* Exact AC if enabled or ally (§3) */}
                          {p.exactAc && (
                            <span>
                              AC: <b className="text-[#EDE6D8]">{p.exactAc}</b>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending Initiative Indicator */}
                    {p.initiativeStatus === 'pending' && (
                      <span className="text-[10px] text-[#F2C265] border border-[#E0A030]/40 bg-[#E0A030]/10 px-2 py-0.5 rounded-full shrink-0">
                        در انتظار تایید مستر
                      </span>
                    )}
                  </div>

                  {/* Conditions Chips if visible (§3) */}
                  {p.conditions && p.conditions.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#2F2A23]/50">
                      {p.conditions.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-[#C2512B]/15 text-[#E8836B] border border-[#C2512B]/30 px-2 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Event Log Feed (§3: visible to players only) */}
        {encounter.events && encounter.events.length > 0 && (
          <div className="surface-card rounded-[14px] p-3 border border-[#2F2A23] space-y-2">
            <span className="text-xs font-bold text-[#E0A030] block">گزارش وقایع نبرد</span>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {encounter.events.map(evt => (
                <div
                  key={evt.id}
                  className="text-xs text-[#EDE6D8]/80 flex items-start gap-1.5 p-1.5 rounded-[6px] bg-[#0E0D0C]"
                >
                  <span className="text-[10px] text-[#A39A89] shrink-0 font-mono">دور {evt.round}:</span>
                  <span className="leading-snug">{evt.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
