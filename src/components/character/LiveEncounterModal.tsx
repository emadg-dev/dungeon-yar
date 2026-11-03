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

  // Hide BottomNav dock while live encounter modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('in-encounter');
      return () => {
        document.body.classList.remove('in-encounter');
      };
    }
  }, [isOpen]);

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
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col justify-between overflow-hidden"
      dir="rtl"
    >
      {/* Sticky Header */}
      <div className="bg-surface border-b border-border px-3.5 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] shadow-md flex flex-wrap items-center justify-between gap-2 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-danger to-accent flex items-center justify-center text-on-accent shrink-0 shadow-sm">
            <Swords className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h2 id="encounter-title" className="font-extrabold text-sm text-text-primary truncate">
              {encounter.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              {encounter.location && (
                <Chip variant="region" region={encounter.location.region as any} label={encounter.location.name} />
              )}
              <span>•</span>
              <span className="text-accent font-black">دور {encounter.round || 1}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDice}
            className="p-2 rounded-[10px] bg-surface-2 text-accent hover:text-accent-hover border border-border transition touch-target min-w-[44px]"
            title="پرتاب تاس"
          >
            <Dices className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[10px] bg-surface-2 text-text-muted hover:text-text-primary border border-border transition touch-target min-w-[44px]"
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
          <div className="p-2.5 rounded-[12px] bg-danger/20 border border-danger/40 flex items-center gap-2 text-xs text-danger">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>آفلاین — آخرین وضعیت دریافت شده نمایش داده می‌شود.</span>
          </div>
        )}

        {/* Paused Banner (§3) */}
        {encounter.status === 'paused' && (
          <div className="p-3 rounded-[12px] bg-accent/15 border border-accent/40 flex items-center gap-2 text-xs text-accent font-bold">
            <Pause className="w-4 h-4 shrink-0 fill-current" />
            <span>مبارزه متوقف شد — دانجن مستر بازی را موقتاً متوقف کرده است.</span>
          </div>
        )}

        {/* Ended Banner (§3) */}
        {encounter.status === 'ended' && (
          <div className="p-3 rounded-[12px] bg-success/15 border border-success/40 flex flex-wrap items-center justify-between gap-2 text-xs text-success font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>پایان نبرد — مبارزه با موفقیت خاتمه یافت.</span>
            </div>
            <span>{encounter.round} دور نبرد</span>
          </div>
        )}

        {/* Strong "Your Turn" State (§3) */}
        {isMyTurn && (
          <div className="p-3.5 rounded-[14px] bg-gradient-to-r from-accent/25 via-accent/15 to-transparent border-2 border-accent shadow-glow-amber-lg animate-pulse flex flex-wrap items-center justify-between gap-2 gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-accent shrink-0" />
              <div>
                <span className="font-black text-sm text-accent block">نوبت شماست!</span>
                <span className="text-xs text-text-primary/90">اکشن‌ها و توانایی‌های شخصیت خود را اجرا نمایید.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDice}
              className="bg-accent text-on-accent font-black text-xs px-3.5 py-2 rounded-[10px] shadow-sm shrink-0 touch-target min-w-[44px]"
            >
              پرتاب تاس
            </button>
          </div>
        )}

        {/* Mini Player Character Vitals Bar (§3: Quick HP access without leaving) */}
        {activeCharacter && (
          <div className="surface-card rounded min-h-[75vh]-[14px] p-3 border border-border flex flex-wrap items-center justify-between gap-2 gap-3 bg-surface">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-text-primary block truncate">{activeCharacter.name}</span>
                <span className="text-xs text-text-muted">
                  سلامت: <b className="text-success">{activeCharacter.hp.current}</b> / {activeCharacter.hp.max}
                </span>
              </div>
            </div>

            {onUpdateCharacterHp && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateCharacterHp(Math.max(0, activeCharacter.hp.current - 1))}
                  className="w-8 h-8 rounded-[8px] bg-surface-2 hover:bg-danger/20 text-danger font-black text-sm transition touch-target min-w-[44px] border border-border flex items-center justify-center"
                  title="کاهش 1 سلامت"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCharacterHp(Math.min(activeCharacter.hp.max, activeCharacter.hp.current + 1))}
                  className="w-8 h-8 rounded-[8px] bg-surface-2 hover:bg-success/20 text-success font-black text-sm transition touch-target min-w-[44px] border border-border flex items-center justify-center"
                  title="افزایش 1 سلامت"
                >
                  +1
                </button>
              </div>
            )}
          </div>
        )}

        {/* Player Roll Initiative Button (§3) */}
        {needsInitiativeRoll && (
          <div className="surface-card rounded min-h-[75vh]-[14px] p-3.5 border border-accent/50 bg-accent/10 flex flex-wrap items-center justify-between gap-2 gap-3">
            <div>
              <span className="font-extrabold text-xs text-accent block">ابتکار عمل خود را بیندازید!</span>
              <span className="text-xs text-text-primary/80">برای قرارگیری در ترتیب نوبت مبارزه</span>
            </div>

            <button
              type="button"
              onClick={handleRollInitiative}
              disabled={isRollingInitiative}
              className="bg-accent text-on-accent font-black text-xs px-3.5 py-2.5 rounded-[10px] flex items-center gap-1.5 shadow-md hover:bg-accent-hover transition touch-target min-w-[44px] shrink-0"
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-text-muted px-1">
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
                  className={`surface-card rounded min-h-[75vh]-[14px] p-3 border transition-all duration-150 space-y-2 ${
                    isTurn
                      ? 'border-accent bg-surface-2 shadow-glow-amber'
                      : isMe
                      ? 'border-success/50 bg-surface'
                      : isDefeated
                      ? 'border-border opacity-50 bg-surface/40'
                      : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Initiative Badge */}
                      <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-xs font-black shrink-0 ${
                        isTurn
                          ? 'bg-accent text-on-accent'
                          : 'bg-surface-2 text-text-primary border border-border'
                      }`}>
                        {p.initiative ?? '-'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-text-primary truncate">
                            {p.displayNameForPlayers}
                          </h4>

                          {isMe && (
                            <span className="text-xs bg-success/25 text-success px-1.5 py-0.2 rounded-full font-bold">
                              شخصیت شما
                            </span>
                          )}

                          {isTurn && (
                            <span className="text-xs bg-accent text-on-accent font-black px-1.5 py-0.2 rounded-full">
                              نوبت جاری
                            </span>
                          )}

                          {isDefeated && (
                            <span className="text-xs bg-danger/20 text-danger-hover px-1.5 py-0.2 rounded-full">
                              شکست‌خورده
                            </span>
                          )}
                        </div>

                        {/* Qualitative Health & Stats (§3) */}
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          {/* Qualitative health status badge */}
                          <span className={`font-bold ${
                            p.healthStatus === 'سالم' ? 'text-success' :
                            p.healthStatus === 'زخمی' ? 'text-accent' :
                            p.healthStatus === 'نیمه‌جان' ? 'text-warning' : 'text-danger-hover'
                          }`}>
                            {p.healthStatus}
                          </span>

                          {/* Exact HP if enabled or ally (§3) */}
                          {p.exactHp && (
                            <span>
                              HP: <b className="text-text-primary">{p.exactHp.current}/{p.exactHp.max}</b>
                            </span>
                          )}

                          {/* Exact AC if enabled or ally (§3) */}
                          {p.exactAc && (
                            <span>
                              AC: <b className="text-text-primary">{p.exactAc}</b>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending Initiative Indicator */}
                    {p.initiativeStatus === 'pending' && (
                      <span className="text-xs text-accent-hover border border-accent/40 bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                        در انتظار تایید مستر
                      </span>
                    )}
                  </div>

                  {/* Conditions Chips if visible (§3) */}
                  {p.conditions && p.conditions.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border/50">
                      {p.conditions.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-danger/15 text-danger border border-danger/30 px-2 py-0.5 rounded-full"
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
          <div className="surface-card rounded min-h-[75vh]-[14px] p-3 border border-border space-y-2">
            <span className="text-xs font-bold text-accent block">گزارش وقایع نبرد</span>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {encounter.events.map(evt => (
                <div
                  key={evt.id}
                  className="text-xs text-text-primary/80 flex items-start gap-1.5 p-1.5 rounded-[6px] bg-bg"
                >
                  <span className="text-xs text-text-muted shrink-0 font-mono">دور {evt.round}:</span>
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
