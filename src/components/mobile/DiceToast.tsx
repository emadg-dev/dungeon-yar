import React, { useEffect } from 'react';
import { DiceRollResult } from '../../types';
import { formatModifier } from '../../utils/dice';
import { Dices, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface DiceToastProps {
  latestRoll: DiceRollResult | null;
  onClose: () => void;
  onOpenRollerModal: () => void;
}

const iconBtn =
  'inline-flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

export const DiceToast: React.FC<DiceToastProps> = ({
  latestRoll,
  onClose,
  onOpenRollerModal
}) => {
  useEffect(() => {
    if (!latestRoll) return;

    // Feature-detect haptic feedback via navigator.vibrate
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (latestRoll.isCritical) {
          navigator.vibrate([40, 60, 40, 60, 80]); // Special nat 20 vibration pattern
        } else if (latestRoll.isFumble) {
          navigator.vibrate([100, 50, 100]); // Nat 1 rumble
        } else {
          navigator.vibrate(20); // Quick tap
        }
      } catch {}
    }

    // Auto-dismiss toast after 6 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [latestRoll, onClose]);

  if (!latestRoll) return null;

  // Only the two moments that matter change the look; a normal roll stays quiet.
  const tone = latestRoll.isCritical
    ? 'border-accent shadow-glow-amber'
    : latestRoll.isFumble
    ? 'border-danger'
    : 'border-border';

  const outcome = latestRoll.isCritical ? '۲۰ بحرانی' : latestRoll.isFumble ? '۱ طبیعی' : '';
  const outcomeTone = latestRoll.isCritical ? 'text-accent-hover' : 'text-danger';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 z-50 max-w-sm mx-auto animate-in slide-in-from-top-4 duration-200 top-[calc(var(--app-header-h,3.5rem)+0.5rem)]"
      dir="rtl"
    >
      <div className={`p-3 rounded-xl border bg-surface shadow-2xl flex items-center gap-3 ${tone}`}>
        {/* The total is the answer, so it is the biggest thing */}
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-bg border border-border shrink-0">
          <span className="text-2xl font-bold text-text-primary font-mono dice-ltr">{latestRoll.total}</span>
          <span className="text-xs text-text-muted font-mono dice-ltr">
            {latestRoll.diceCount}d{latestRoll.diceSides}{latestRoll.modifier ? formatModifier(latestRoll.modifier) : ''}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="text-sm font-bold text-text-primary truncate">{latestRoll.label}</h4>
            {outcome && <span className={`text-xs font-bold shrink-0 ${outcomeTone}`}>{outcome}</span>}
          </div>
          <p className="text-xs text-text-muted">
            <span className="font-mono dice-ltr text-text-primary">[{latestRoll.rolls.join(', ')}]</span>
            {latestRoll.modifier !== 0 && (
              <span className="ms-2">
                مادیفایر <span className="dice-ltr">{formatModifier(latestRoll.modifier)}</span>
              </span>
            )}
            {latestRoll.advantage && (
              <span className="ms-2 font-bold text-accent-hover">
                {latestRoll.advantage === 'adv' ? 'با مزیت' : 'با ضعف'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <Button onClick={onOpenRollerModal} className={iconBtn} title="باز کردن کیسه تاس" aria-label="باز کردن کیسه تاس">
            <Dices className="w-5 h-5" />
          </Button>
          <Button onClick={onClose} className={iconBtn} title="بستن" aria-label="بستن">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};