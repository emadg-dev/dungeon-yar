import React, { useState } from 'react';
import { DiceRollResult } from '../types';
import { rollDice, formatModifier } from '../utils/dice';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './mobile/BottomSheet';
import { Dices, Flame, Skull } from 'lucide-react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetRoll?: { sides: number; count: number; modifier: number; label: string } | null;
  history: DiceRollResult[];
  onAddRoll: (result: DiceRollResult) => void;
  onNotifyResult?: (msg: string) => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  presetRoll,
  history,
  onAddRoll,
  onNotifyResult
}) => {
  const [selectedSides, setSelectedSides] = useState<number>(presetRoll?.sides || 20);
  const [diceCount, setDiceCount] = useState<number>(presetRoll?.count || 1);
  const [modifier, setModifier] = useState<number>(presetRoll?.modifier || 0);
  const [advantage, setAdvantage] = useState<'none' | 'adv' | 'dis'>('none');
  const [customLabel, setCustomLabel] = useState<string>(presetRoll?.label || 'پرتاب آزاد');
  const [latestRoll, setLatestRoll] = useState<DiceRollResult | null>(null);

  // Sync if preset changes
  React.useEffect(() => {
    if (presetRoll) {
      setSelectedSides(presetRoll.sides);
      setDiceCount(presetRoll.count);
      setModifier(presetRoll.modifier);
      setCustomLabel(presetRoll.label);
      const res = rollDice(
        presetRoll.count,
        presetRoll.sides,
        presetRoll.modifier,
        undefined,
        presetRoll.label
      );
      setLatestRoll(res);
      onAddRoll(res);
      if (res.isCritical) triggerHaptic('crit');
      else if (res.isFumble) triggerHaptic('fumble');
      else triggerHaptic('roll');

      onNotifyResult?.(`نتیجه ${res.label}: ${res.total}`);
    }
  }, [presetRoll]);

  if (!isOpen) return null;

  const handleRoll = (adv: 'none' | 'adv' | 'dis' = advantage) => {
    const res = rollDice(
      diceCount,
      selectedSides,
      modifier,
      adv === 'none' ? undefined : adv,
      customLabel || `پرتاب d${selectedSides}`
    );
    setLatestRoll(res);
    onAddRoll(res);
    if (res.isCritical) triggerHaptic('crit');
    else if (res.isFumble) triggerHaptic('fumble');
    else triggerHaptic('roll');

    onNotifyResult?.(`نتیجه ${res.label}: ${res.total}`);
  };

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="کیسه تاس‌های زروانیا"
      subtitle="پرتاب تاس، محاسبه صدمه و وقایع بحرانی"
    >
      <div className="space-y-4 text-xs text-[#EDE6D8]" dir="rtl">
        {/* Huge Result Display with Nat 20 Gold / Nat 1 Ember Glow */}
        {latestRoll && (
          <div
            className={`p-4 rounded-[14px] border transition-all text-center ${
              latestRoll.isCritical
                ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-[0_0_25px_rgba(224,160,48,0.5)]'
                : latestRoll.isFumble
                ? 'bg-[#C2512B]/20 border-[#C2512B] shadow-[0_0_25px_rgba(194,81,43,0.5)]'
                : 'surface-2-card border-[#2F2A23]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#A39A89] mb-1">
              <span>{latestRoll.label}</span>
              <span className="font-mono dice-ltr">{latestRoll.timestamp}</span>
            </div>

            <div className="flex items-baseline justify-center gap-3 my-2">
              <span
                className={`text-5xl font-extrabold font-mono dice-ltr ${
                  latestRoll.isCritical
                    ? 'text-[#F2C265]'
                    : latestRoll.isFumble
                    ? 'text-[#C2512B]'
                    : 'text-[#EDE6D8]'
                }`}
              >
                {latestRoll.total}
              </span>

              {latestRoll.isCritical && (
                <span className="px-2.5 py-1 text-xs font-black bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030] rounded-full flex items-center gap-1 animate-pulse">
                  <Flame className="w-3.5 h-3.5" /> بحرانی طبیعی! (۲۰)
                </span>
              )}
              {latestRoll.isFumble && (
                <span className="px-2.5 py-1 text-xs font-black bg-[#C2512B]/25 text-[#C2512B] border border-[#C2512B] rounded-full flex items-center gap-1">
                  <Skull className="w-3.5 h-3.5" /> شکست فاجعه‌بار! (۱)
                </span>
              )}
            </div>

            <div className="text-center text-[11px] text-[#A39A89] flex items-center justify-center gap-2">
              <span>تاس‌ها: [{latestRoll.rolls.join(' ، ')}]</span>
              <span>•</span>
              <span>مادیفایر: {formatModifier(latestRoll.modifier)}</span>
              {latestRoll.advantage && (
                <>
                  <span>•</span>
                  <span className="text-[#E0A030] font-bold">
                    {latestRoll.advantage === 'adv' ? 'با مزیت' : 'با ضعف'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* d4–d100 Row (Buttons >= 48px) */}
        <div>
          <label className="block text-xs font-bold text-[#A39A89] mb-1.5">نوع تاس:</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {diceTypes.map(sides => (
              <button
                key={sides}
                type="button"
                onClick={() => setSelectedSides(sides)}
                className={`min-h-[48px] min-w-[48px] py-2 px-1 rounded-[12px] font-mono font-extrabold text-sm transition border touch-target-lg active:scale-95 flex items-center justify-center dice-ltr ${
                  selectedSides === sides
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030] shadow-[0_0_12px_rgba(224,160,48,0.4)]'
                    : 'bg-[#201D19] text-[#EDE6D8] border-[#2F2A23] hover:border-[#E0A030]/50'
                }`}
              >
                d{sides}
              </button>
            ))}
          </div>
        </div>

        {/* Count & Modifier Steppers (48px targets) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">تعداد تاس:</label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center touch-target-lg active:scale-95"
              >
                -
              </button>
              <span className="flex-1 text-center font-extrabold font-mono text-base bg-[#0E0D0C] py-2 rounded-[12px] border border-[#2F2A23] min-h-[48px] flex items-center justify-center dice-ltr">
                {diceCount}
              </span>
              <button
                type="button"
                onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center touch-target-lg active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">مادیفایر:</label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setModifier(modifier - 1)}
                className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center touch-target-lg active:scale-95"
              >
                -
              </button>
              <span className="flex-1 text-center font-extrabold font-mono text-base bg-[#0E0D0C] py-2 rounded-[12px] border border-[#2F2A23] min-h-[48px] flex items-center justify-center dice-ltr">
                {formatModifier(modifier)}
              </span>
              <button
                type="button"
                onClick={() => setModifier(modifier + 1)}
                className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center touch-target-lg active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Advantage Toggle */}
        <div>
          <label className="block text-xs font-bold text-[#A39A89] mb-1">حالت پرتاب (مزیت / ضعف):</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'عادی' },
              { id: 'adv', label: 'با مزیت (Adv)' },
              { id: 'dis', label: 'با ضعف (Dis)' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAdvantage(item.id as any)}
                className={`py-2 px-1 rounded-[10px] text-xs font-bold transition border touch-target ${
                  advantage === item.id
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Big Roll Button */}
        <button
          type="button"
          onClick={() => handleRoll()}
          className="w-full py-3.5 rounded-[12px] btn-primary-amber font-black text-sm flex items-center justify-center gap-2 shadow-lg touch-target-lg active:scale-98"
        >
          <Dices className="w-5 h-5" />
          <span>پرتاب {diceCount}d{selectedSides} {modifier !== 0 ? formatModifier(modifier) : ''}</span>
        </button>

        {/* History List */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-[#2F2A23]">
            <span className="text-[11px] font-bold text-[#A39A89] block mb-2">تاریخچه پرتاب‌های اخیر:</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {history.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  className="surface-2-card rounded-[8px] p-2 flex items-center justify-between text-[11px] border border-[#2F2A23]"
                >
                  <span className="text-[#A39A89] truncate">{h.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A39A89] font-mono">[{h.rolls.join(',')}]</span>
                    <span className="font-mono font-black text-xs text-[#E0A030] dice-ltr">{h.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
