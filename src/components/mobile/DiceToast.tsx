import React, { useEffect } from 'react';
import { DiceRollResult } from '../../types';
import { formatModifier } from '../../utils/dice';
import { Dices, Flame, Sparkles, X } from 'lucide-react';

interface DiceToastProps {
  latestRoll: DiceRollResult | null;
  onClose: () => void;
  onOpenRollerModal: () => void;
}

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

  return (
    <div 
      className="fixed top-16 inset-x-3 z-50 max-w-sm mx-auto animate-in slide-in-from-top-4 duration-200"
      dir="rtl"
    >
      <div 
        className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          latestRoll.isCritical
            ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
            : latestRoll.isFumble
            ? 'bg-red-950/90 border-red-500/70 text-red-100'
            : 'bg-[#151926]/95 border-amber-500/30 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Big Total Badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0c0e12] border border-amber-500/40 shrink-0">
            <span className="text-2xl font-black text-amber-300 font-mono dice-ltr">
              {latestRoll.total}
            </span>
            <span className="text-[9px] text-slate-400 font-mono dice-ltr">
              {latestRoll.diceCount}d{latestRoll.diceSides}{latestRoll.modifier ? formatModifier(latestRoll.modifier) : ''}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs text-amber-200">{latestRoll.label}</h4>
              {latestRoll.isCritical && (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-slate-950 rounded-full flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" /> ۲۰ بحرانی!
                </span>
              )}
              {latestRoll.isFumble && (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-red-600 text-white rounded-full">
                  ۱ طبیعی
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-300 mt-0.5">
              <span>تاس‌ها: </span>
              <span className="font-mono text-amber-300 dice-ltr">[{latestRoll.rolls.join(', ')}]</span>
              {latestRoll.modifier !== 0 && (
                <span className="text-slate-400 mr-1">
                  (مادیفایر: <strong className="dice-ltr">{formatModifier(latestRoll.modifier)}</strong>)
                </span>
              )}
              {latestRoll.advantage && (
                <span className="text-amber-400 mr-1 font-semibold">
                  {latestRoll.advantage === 'adv' ? '• با مزیت' : '• با ضعف'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenRollerModal}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 touch-target"
            title="مشاهده کیسه تاس"
          >
            <Dices className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white touch-target"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
