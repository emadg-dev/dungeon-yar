import React, { useState } from 'react';
import { Character, ClassTemplate } from '../../types';
import { FIXED_HP, ASI_LEVELS } from '../../data/seed';
import { getProficiencyBonus } from '../../utils/dice';
import { BottomSheet } from '../mobile/BottomSheet';
import { ArrowUpCircle, Shield, Heart, Sparkles, Check, Plus } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  classTemplate?: ClassTemplate;
  onConfirmLevelUp: (updated: Character) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  character,
  classTemplate,
  onConfirmLevelUp,
}) => {
  const nextLevel = character.level + 1;
  const currentProf = getProficiencyBonus(character.level);
  const nextProf = getProficiencyBonus(nextLevel);

  // Fixed HP calculation from world book FIXED_HP table
  const classNameClean = character.className.split(' ')[0];
  const hpTable = (FIXED_HP as Record<string, number[]>)[classNameClean] || [character.hp.max];
  const nextFixedHpBase = hpTable[nextLevel - 1] ?? (character.hp.max + 6);
  const currentFixedHpBase = hpTable[character.level - 1] ?? character.hp.max;
  const hpGain = Math.max(1, nextFixedHpBase - currentFixedHpBase);

  // ASI detection
  const isAsiLevel = (classTemplate?.asiLevels || ASI_LEVELS).includes(nextLevel);
  const [selectedAsiMode, setSelectedAsiMode] = useState<'plus2' | 'plus1plus1'>('plus2');
  const [stat1, setStat1] = useState<keyof Character['abilities']>('str');
  const [stat2, setStat2] = useState<keyof Character['abilities']>('con');

  // Subclass selection at level 3
  const isSubclassLevel = nextLevel === 3 && !character.subclassName && (classTemplate?.subclasses?.length || 0) > 0;
  const [chosenSubclass, setChosenSubclass] = useState<string>(
    classTemplate?.subclasses?.[0]?.name || ''
  );

  // Features unlocked at next level
  const newFeatures = classTemplate?.features?.[nextLevel] 
    ? [classTemplate.features[nextLevel]]
    : [];

  const handleApply = () => {
    let abilities = { ...character.abilities };
    if (isAsiLevel) {
      if (selectedAsiMode === 'plus2') {
        abilities[stat1] = (abilities[stat1] || 10) + 2;
      } else {
        abilities[stat1] = (abilities[stat1] || 10) + 1;
        abilities[stat2] = (abilities[stat2] || 10) + 1;
      }
    }

    const newHpMax = character.hp.max + hpGain;
    const newHpCurrent = character.hp.current + hpGain;

    const updated: Character = {
      ...character,
      level: nextLevel,
      hp: {
        ...character.hp,
        max: newHpMax,
        current: newHpCurrent
      },
      abilities,
      subclassName: chosenSubclass || character.subclassName,
      updatedAt: new Date().toISOString()
    };

    onConfirmLevelUp(updated);
    onClose();
  };

  const abilityFa: Record<string, string> = {
    str: 'قدرت (STR)',
    dex: 'چابکی (DEX)',
    con: 'بنیه (CON)',
    int: 'هوش (INT)',
    wis: 'خرد (WIS)',
    cha: 'فرهمندی (CHA)'
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`ارتقای سطح به سطح ${nextLevel}`}
      subtitle={`${character.name} • ${character.className}`}
    >
      <div className="space-y-4 text-slate-100">
        {/* Level Up Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/20 via-[#181c26] to-[#12151e] border border-amber-500/40 text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-amber-200">
            صعود به سطح {nextLevel}
          </h3>
          <p className="text-xs text-slate-400">
            بونوس مهارت (Proficiency): <span className="font-mono text-amber-300 font-bold">+{nextProf}</span>
            {nextProf > currentProf && <span className="text-emerald-400 font-bold me-1"> (+۱ افزایش!)</span>}
          </p>
        </div>

        {/* Fixed HP Gain */}
        <div className="p-3.5 rounded-xl bg-[#141824] border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">افزایش حداکثر جان (HP)</span>
              <span className="text-[11px] text-slate-400">از جدول ثابت کتاب زروانیا</span>
            </div>
          </div>
          <div className="text-sm font-black font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            +{hpGain} جان
          </div>
        </div>

        {/* Subclass Selection at Level 3 */}
        {isSubclassLevel && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>انتخاب زیرکلاس اختصاصی (سطح ۳):</span>
            </div>
            <div className="space-y-1.5">
              {classTemplate?.subclasses?.map((sub: any) => (
                <button
                  type="button"
                  key={sub.name}
                  onClick={() => setChosenSubclass(sub.name)}
                  className={`w-full text-start p-2.5 rounded-xl border transition ${
                    chosenSubclass === sub.name
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                      : 'bg-[#161a26] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{sub.name}</div>
                  {sub.desc && <div className="text-[11px] text-slate-400 mt-0.5">{sub.desc}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ASI at levels 4, 8, 12, 16, 19 */}
        {isAsiLevel && (
          <div className="p-3.5 rounded-xl bg-[#151928] border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">بهبود ویژگی‌های بنیادین (ASI):</span>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedAsiMode('plus2')}
                  className={`px-2 py-0.5 rounded-lg border ${
                    selectedAsiMode === 'plus2'
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  +۲ به یک ویژگی
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAsiMode('plus1plus1')}
                  className={`px-2 py-0.5 rounded-lg border ${
                    selectedAsiMode === 'plus1plus1'
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  +۱ به دو ویژگی
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ویژگی اول:</label>
                <select
                  value={stat1}
                  onChange={(e) => setStat1(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-[#10131e] border border-slate-700 text-xs text-slate-200"
                >
                  {Object.entries(abilityFa).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              {selectedAsiMode === 'plus1plus1' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">ویژگی دوم:</label>
                  <select
                    value={stat2}
                    onChange={(e) => setStat2(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-[#10131e] border border-slate-700 text-xs text-slate-200"
                  >
                    {Object.entries(abilityFa).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Features unlocked */}
        {newFeatures.length > 0 && (
          <div className="p-3 rounded-xl bg-[#141822] border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-amber-300 block">قابلیت‌های جدید این سطح:</span>
            {newFeatures.map((f, i) => (
              <div key={i} className="text-xs text-slate-200 bg-[#161a28] p-2 rounded-lg border border-slate-800">
                ✨ {f}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleApply}
          className="w-full py-3 px-4 rounded-xl font-black bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-900/30 transition active:scale-[0.98] cursor-pointer touch-target flex items-center justify-center gap-2 mt-4"
        >
          <Check className="w-4 h-4" />
          <span>تأیید و ارتقا به سطح {nextLevel}</span>
        </button>
      </div>
    </BottomSheet>
  );
};
