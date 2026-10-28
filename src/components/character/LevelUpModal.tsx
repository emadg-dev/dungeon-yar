import React, { useState, useMemo } from 'react';
import { 
  Character, 
  CharacterParticipation, 
  ClassTemplate, 
  Campaign, 
  LevelUpPayload, 
  AbilityName, 
  AbilityScoreMap 
} from '../../types';
import { 
  XP_THRESHOLDS, 
  computeLevelUpDiff, 
  parseHitDieValue,
  DEFAULT_ASI_LEVELS
} from '../../../shared/rules/levelUpEngine';
import { abilityModifier, proficiencyBonus } from '../../../shared/rules/engine';
import { BottomSheet } from '../mobile/BottomSheet';
import { 
  ArrowUpCircle, Shield, Heart, Sparkles, Check, ChevronRight, 
  ChevronLeft, AlertCircle, Wand2, Users, BookOpen, Dumbbell, Star
} from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  participation?: CharacterParticipation | null;
  campaign?: Campaign | null;
  classTemplate?: ClassTemplate | null;
  onConfirmLevelUp: (payload: LevelUpPayload) => Promise<void>;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  character,
  participation,
  campaign,
  classTemplate,
  onConfirmLevelUp
}) => {
  const currentLevel = participation?.level ?? character.level ?? 1;
  const nextLevel = Math.min(20, currentLevel + 1);

  const currentProf = proficiencyBonus(currentLevel);
  const nextProf = proficiencyBonus(nextLevel);

  // Hit die and CON calculation
  const hitDie = parseHitDieValue(classTemplate?.hitDie || character.hitDice?.die || 8);
  const fixedHpRoll = Math.floor(hitDie / 2) + 1;
  const conScore = (participation?.abilityScores?.con ?? character.abilities?.con ?? 10);
  const conMod = abilityModifier(conScore);
  const fixedHpTotal = Math.max(1, fixedHpRoll + conMod);

  // Stepper state
  const asiLevels = classTemplate?.asiLevels || DEFAULT_ASI_LEVELS;
  const isAsiLevel = asiLevels.includes(nextLevel);
  const firstSubclassUnlock = classTemplate?.subclasses?.[0]?.unlockLevel || 3;
  const isSubclassLevel = (nextLevel === firstSubclassUnlock) && 
    !(participation?.subclassName || character.subclassName) && 
    (classTemplate?.subclasses?.length || 0) > 0;
  const isCaster = Boolean(classTemplate?.spellcasting);

  // Active step navigation:
  // 0: Features
  // 1: HP Gain
  // 2: ASI (if asiLevel)
  // 3: Subclass (if subclassLevel)
  // 4: Spells (if caster)
  // 5: Companions & Resources
  // 6: Review & Confirm
  const steps: { id: string; label: string }[] = useMemo(() => {
    const s = [
      { id: 'features', label: 'قابلیت‌ها' },
      { id: 'hp', label: 'افزایش جان (HP)' }
    ];
    if (isAsiLevel) {
      s.push({ id: 'asi', label: 'ارتقای ویژگی (ASI)' });
    }
    if (isSubclassLevel) {
      s.push({ id: 'subclass', label: 'زیرکلاس' });
    }
    if (isCaster) {
      s.push({ id: 'spells', label: 'طلسم‌ها' });
    }
    s.push({ id: 'resources', label: 'منابع و همراهان' });
    s.push({ id: 'review', label: 'بازبینی نهایی' });
    return s;
  }, [isAsiLevel, isSubclassLevel, isCaster]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form selections
  const [hpMode, setHpMode] = useState<'fixed' | 'roll'>('fixed');
  const [rolledHpValue, setRolledHpValue] = useState<number>(fixedHpRoll);
  const [isRollingHp, setIsRollingHp] = useState(false);

  // ASI Choices
  const [asiMode, setAsiMode] = useState<'plus2' | 'plus1plus1'>('plus2');
  const [asiStat1, setAsiStat1] = useState<AbilityName>('str');
  const [asiStat2, setAsiStat2] = useState<AbilityName>('con');

  // Subclass
  const [chosenSubclass, setChosenSubclass] = useState<string>(
    classTemplate?.subclasses?.[0]?.name || ''
  );

  // Spells
  const [newSpellInput, setNewSpellInput] = useState<string>('');
  const [learnedSpells, setLearnedSpells] = useState<string[]>([]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper for rolling HP
  const handleRollHp = () => {
    setIsRollingHp(true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * hitDie) + 1;
      setRolledHpValue(roll);
      setIsRollingHp(false);
    }, 250);
  };

  // Features unlocked at nextLevel
  const newFeatures = useMemo(() => {
    const list: string[] = [];
    if (classTemplate?.featuresByLevel?.[nextLevel]) {
      list.push(...classTemplate.featuresByLevel[nextLevel].map(f => typeof f === 'string' ? f : f.name));
    } else if (classTemplate?.features?.[nextLevel]) {
      list.push(classTemplate.features[nextLevel]);
    }
    if (list.length === 0) {
      list.push(`پیشرفت کلاس ${character.className} در سطح ${nextLevel}`);
    }
    return list;
  }, [classTemplate, nextLevel, character.className]);

  // Construct payload for diff computation
  const payload: LevelUpPayload = useMemo(() => {
    return {
      hpMode,
      hpRoll: hpMode === 'roll' ? rolledHpValue : undefined,
      asiMode: isAsiLevel ? asiMode : undefined,
      asiChoices: isAsiLevel
        ? asiMode === 'plus2'
          ? { stat1: asiStat1 }
          : { stat1: asiStat1, stat2: asiStat2 }
        : undefined,
      chosenSubclass: isSubclassLevel ? chosenSubclass : undefined,
      subclassName: isSubclassLevel ? chosenSubclass : undefined,
      newSpells: learnedSpells.length > 0 ? { spells: learnedSpells } : undefined
    };
  }, [hpMode, rolledHpValue, isAsiLevel, asiMode, asiStat1, asiStat2, isSubclassLevel, chosenSubclass, learnedSpells]);

  // Mock participation fallback if character is used directly
  const activeParticipation: CharacterParticipation = useMemo(() => {
    if (participation) return participation;
    return {
      id: `part-${character.id}`,
      campaignId: campaign?.id || 'camp-default',
      characterId: character.id,
      className: character.className,
      subclassName: character.subclassName,
      status: 'active',
      level: character.level || 1,
      xp: 0,
      levelUpAvailable: true,
      currentHp: character.hp.current,
      maxHp: character.hp.max,
      tempHp: character.hp.temp || 0,
      abilityScores: {
        str: character.abilities?.str || 10,
        dex: character.abilities?.dex || 10,
        con: character.abilities?.con || 10,
        int: character.abilities?.int || 10,
        wis: character.abilities?.wis || 10,
        cha: character.abilities?.cha || 10
      },
      hitDice: {
        current: character.hitDice?.current ?? (character.level || 1),
        max: character.hitDice?.max ?? (character.level || 1),
        die: character.hitDice?.die ?? (typeof classTemplate?.hitDie === 'string' ? classTemplate.hitDie : `d${classTemplate?.hitDie || 8}`)
      },
      deathSaves: { successes: 0, failures: 0 },
      conditions: [],
      inventory: character.inventory || [],
      weapons: character.weapons || [],
      currency: character.currencies || { gold: 0, silver: 0, copper: 0 },
      customResources: character.customResources || [],
      features: character.features || [],
      notes: '',
      sheetLocked: true,
      joinedAt: Date.now(),
      updatedAt: Date.now()
    };
  }, [participation, character, campaign, classTemplate]);

  // Authoritative Diff computation using shared engine
  const diffResult = useMemo(() => {
    try {
      return computeLevelUpDiff({
        participation: activeParticipation,
        classTemplate: classTemplate || null,
        payload,
        nextLevel
      });
    } catch (e: any) {
      return null;
    }
  }, [activeParticipation, classTemplate, payload, nextLevel]);

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirmLevelUp(payload);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در اعمال ارتقای سطح.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const abilityFa: Record<AbilityName, string> = {
    str: 'قدرت (STR)',
    dex: 'چابکی (DEX)',
    con: 'بنیه (CON)',
    int: 'هوش (INT)',
    wis: 'خرد (WIS)',
    cha: 'فرهمندی (CHA)'
  };

  const currentAbilityScore = (stat: AbilityName) => {
    return activeParticipation.abilityScores[stat] || 10;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`ارتقای سطح به سطح ${nextLevel}`}
      subtitle={`${character.name} • ${character.className}`}
    >
      <div className="space-y-4 text-[#EDE6D8] pb-4" dir="rtl">
        {/* Step Progress Stepper */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 border-b border-[#2F2A23] no-scrollbar">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  isCurrent
                    ? 'bg-[#E0A030] text-[#0E0D0C]'
                    : isCompleted
                    ? 'bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30'
                    : 'text-[#A39A89] hover:text-[#EDE6D8]'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: FEATURES & SUMMARY */}
        {currentStep.id === 'features' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#C97B4A]/20 via-[#181c26] to-[#171513] border border-[#E0A030]/40 text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E0A030]/20 border border-[#E0A030]/40 flex items-center justify-center text-[#F2C265]">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#F2C265]">
                صعود به سطح {nextLevel}
              </h3>
              <p className="text-xs text-[#A39A89]">
                بونوس مهارت (Proficiency): <span className="font-mono text-[#F2C265] font-bold">+{nextProf}</span>
                {nextProf > currentProf && <span className="text-[#6F9E78] font-bold me-1"> (+۱ افزایش!)</span>}
              </p>
            </div>

            <div className="surface-card rounded-xl p-3.5 border border-[#2F2A23] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F2C265]">
                <Sparkles className="w-4 h-4 text-[#F2C265]" />
                <span>قابلیت‌های جدید سطح {nextLevel}:</span>
              </div>
              <div className="space-y-1.5">
                {newFeatures.map((f, i) => (
                  <div key={i} className="text-xs text-[#EDE6D8] bg-[#1a1714] p-2.5 rounded-lg border border-[#2F2A23] flex items-start gap-2">
                    <span className="text-[#E0A030] font-black">✦</span>
                    <span className="leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: HP GAIN WITH CON LINE BREAKDOWN */}
        {currentStep.id === 'hp' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#2F2A23] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#E8836B]" />
                  <span className="text-xs font-bold text-[#EDE6D8]">محاسبه افزایش جان (HP)</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setHpMode('fixed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      hpMode === 'fixed'
                        ? 'bg-[#E0A030] text-[#0E0D0C]'
                        : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                    }`}
                  >
                    مقدار ثابت (Fixed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHpMode('roll')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      hpMode === 'roll'
                        ? 'bg-[#E0A030] text-[#0E0D0C]'
                        : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                    }`}
                  >
                    پرتاب تاس (Roll)
                  </button>
                </div>
              </div>

              {/* CON Breakdown formula display */}
              <div className="p-3 rounded-xl bg-[#131110] border border-[#2F2A23] space-y-2">
                <span className="text-[11px] text-[#A39A89] block">فرمول استاندارد ۵e: تاس جان (1d{hitDie}) + اصلاحگر بنیه</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A39A89]">اصلاحگر بنیه (CON {conScore}):</span>
                  <span className="font-mono font-bold text-[#F2C265]">
                    {conMod >= 0 ? `+${conMod}` : conMod}
                  </span>
                </div>

                {hpMode === 'fixed' ? (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2F2A23]/60">
                    <span className="text-[#A39A89]">محاسبه مقدار ثابت:</span>
                    <span className="font-mono font-bold text-[#EDE6D8]">
                      پایه ({fixedHpRoll}) + بنیه ({conMod >= 0 ? `+${conMod}` : conMod}) = <strong className="text-[#6F9E78]">+{fixedHpTotal} جان</strong>
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-[#2F2A23]/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#A39A89]">نتیجه تاس 1d{hitDie}:</span>
                      <span className="font-mono text-base font-black text-[#F2C265]">{rolledHpValue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#A39A89]">جمع کل با بنیه:</span>
                      <span className="font-mono text-sm font-bold text-[#6F9E78]">
                        +{Math.max(1, rolledHpValue + conMod)} جان
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRollHp}
                      disabled={isRollingHp}
                      className="w-full py-2 rounded-xl bg-[#201D19] border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/15 transition"
                    >
                      {isRollingHp ? 'در حال پرتاب تاس...' : `پرتاب مجدد تاس 1d${hitDie}`}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-[#6F9E78]/10 border border-[#6F9E78]/30 flex items-center justify-between">
                <span className="text-xs text-[#A39A89]">حداکثر جان بعد از ارتقا:</span>
                <span className="font-mono text-sm font-black text-[#6F9E78]">
                  {activeParticipation.maxHp} → {activeParticipation.maxHp + (hpMode === 'fixed' ? fixedHpTotal : Math.max(1, rolledHpValue + conMod))} HP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ASI SCREEN (CAPPED AT 20, FEATS HIDDEN) */}
        {currentStep.id === 'asi' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#2F2A23] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#E0A030]" />
                  <span className="text-xs font-bold text-[#EDE6D8]">بهبود ویژگی‌ها (ASI)</span>
                </div>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAsiMode('plus2')}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                      asiMode === 'plus2'
                        ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                        : 'bg-[#201D19] text-[#A39A89] border-[#3A342B]'
                    }`}
                  >
                    +۲ به یک ویژگی
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsiMode('plus1plus1')}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                      asiMode === 'plus1plus1'
                        ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                        : 'bg-[#201D19] text-[#A39A89] border-[#3A342B]'
                    }`}
                  >
                    +۱ به دو ویژگی
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#A39A89] leading-relaxed">
                طبق قوانین رسمی ۵e، سقف طبیعی هر ویژگی برابر ۲۰ است. در این کمپین فیت‌ها (Feats) غیرفعال بوده و تنها ارتقای مستقیم امتیازات ویژگی مجاز است.
              </p>

              {asiMode === 'plus2' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#EDE6D8]">انتخاب ویژگی (+۲):</label>
                  <select
                    value={asiStat1}
                    onChange={(e) => setAsiStat1(e.target.value as AbilityName)}
                    className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#3A342B] text-xs text-[#EDE6D8]"
                  >
                    {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                      const cur = currentAbilityScore(stat);
                      const isMaxed = cur >= 20;
                      return (
                        <option key={stat} value={stat} disabled={isMaxed}>
                          {abilityFa[stat]} — فعلی: {cur} {cur + 2 <= 20 ? `(می‌شود ${cur + 2})` : '(سقف ۲۰ پر است!)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#EDE6D8]">ویژگی اول (+۱):</label>
                    <select
                      value={asiStat1}
                      onChange={(e) => setAsiStat1(e.target.value as AbilityName)}
                      className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#3A342B] text-xs text-[#EDE6D8]"
                    >
                      {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                        const cur = currentAbilityScore(stat);
                        return (
                          <option key={stat} value={stat} disabled={cur >= 20}>
                            {abilityFa[stat]} — فعلی: {cur} (می‌شود {Math.min(20, cur + 1)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#EDE6D8]">ویژگی دوم (+۱):</label>
                    <select
                      value={asiStat2}
                      onChange={(e) => setAsiStat2(e.target.value as AbilityName)}
                      className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#3A342B] text-xs text-[#EDE6D8]"
                    >
                      {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                        const cur = currentAbilityScore(stat);
                        return (
                          <option key={stat} value={stat} disabled={cur >= 20 || stat === asiStat1}>
                            {abilityFa[stat]} — فعلی: {cur} {stat === asiStat1 ? '(انتخاب شده در اول)' : `(می‌شود ${Math.min(20, cur + 1)})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: SUBCLASS UNLOCK */}
        {currentStep.id === 'subclass' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#2F2A23] space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#E0A030]" />
                <span className="text-xs font-bold text-[#EDE6D8]">انتخاب زیرکلاس اختصاصی (سطح ۳)</span>
              </div>
              <p className="text-[11px] text-[#A39A89]">
                با رسیدن به سطح ۳، مسیر تخصصی خود را برای کلاس {character.className} برگزینید.
              </p>

              <div className="space-y-2">
                {classTemplate?.subclasses?.map((sub: any) => {
                  const isSelected = chosenSubclass === sub.name;
                  return (
                    <button
                      type="button"
                      key={sub.name}
                      onClick={() => setChosenSubclass(sub.name)}
                      className={`w-full text-start p-3 rounded-xl border transition ${
                        isSelected
                          ? 'bg-[#E0A030]/20 border-[#F2C265] text-[#F2C265]'
                          : 'bg-[#171513] border-[#2F2A23] text-[#EDE6D8]'
                      }`}
                    >
                      <div className="text-xs font-black">{sub.name}</div>
                      {sub.desc && <p className="text-[11px] text-[#A39A89] mt-1 leading-relaxed">{sub.desc}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SPELLS (FOR CASTERS) */}
        {currentStep.id === 'spells' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#2F2A23] space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#7FB4D6]" />
                <span className="text-xs font-bold text-[#EDE6D8]">طلسم‌های آموخته‌شده یا آماده جدید</span>
              </div>
              <p className="text-[11px] text-[#A39A89]">
                طلسم‌های جدید مجاز در این سطح را وارد کنید یا ذخیره نمایید.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpellInput}
                  onChange={e => setNewSpellInput(e.target.value)}
                  placeholder="نام طلسم جدید (مثال: Fireball یا پرتو جادویی)..."
                  className="flex-1 p-2 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs text-[#EDE6D8]"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSpellInput.trim()) {
                      e.preventDefault();
                      setLearnedSpells(prev => [...prev, newSpellInput.trim()]);
                      setNewSpellInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSpellInput.trim()) {
                      setLearnedSpells(prev => [...prev, newSpellInput.trim()]);
                      setNewSpellInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#7FB4D6]/20 border border-[#7FB4D6]/40 text-[#7FB4D6] text-xs font-bold"
                >
                  افزودن
                </button>
              </div>

              {learnedSpells.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {learnedSpells.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#7FB4D6]/15 border border-[#7FB4D6]/30 text-xs text-[#7FB4D6] flex items-center gap-1.5"
                    >
                      <span>{sp}</span>
                      <button
                        type="button"
                        onClick={() => setLearnedSpells(prev => prev.filter((_, i) => i !== idx))}
                        className="text-[#E8836B] hover:text-[#C2512B]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: COMPANIONS & RESOURCES AUTO-RECALC */}
        {currentStep.id === 'resources' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#2F2A23] space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E0A030]" />
                <span className="text-xs font-bold text-[#EDE6D8]">محاسبه خودکار همراهان و مخازن منابع</span>
              </div>
              <p className="text-[11px] text-[#A39A89] leading-relaxed">
                تاس‌های جان و ظرفیت منابع متناسب با سطح {nextLevel} به‌طور خودکار افزایش می‌یابند:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#141822] border border-[#2F2A23] flex items-center justify-between">
                  <span className="text-[#A39A89]">تاس‌های جان (Hit Dice):</span>
                  <span className="font-mono font-bold text-[#EDE6D8]">
                    {currentLevel}d{hitDie} → <strong className="text-[#6F9E78]">{nextLevel}d{hitDie}</strong>
                  </span>
                </div>

                {character.companions && character.companions.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#141822] border border-[#2F2A23] space-y-1.5">
                    <span className="text-xs font-bold text-[#F2C265] block">همراهان ارتقایافته:</span>
                    {character.companions.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-[#C9C0AE]">
                        <span>{comp.name} ({comp.type})</span>
                        <span className="text-[#6F9E78] font-bold">همگام با سطح کاراکتر</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & CONFIRM */}
        {currentStep.id === 'review' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-4 border border-[#E0A030]/40 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#6F9E78]" />
                <span className="text-xs font-bold text-[#EDE6D8]">بازبینی و مقایسه تغییرات (قبل و بعد)</span>
              </div>

              {diffResult ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#141822] border border-[#2F2A23]">
                    <div>
                      <span className="text-[10px] text-[#A39A89] block">سطح کاراکتر:</span>
                      <span className="font-mono font-bold text-[#EDE6D8]">{diffResult.diff.fromLevel} → <strong className="text-[#F2C265]">{diffResult.diff.toLevel}</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A39A89] block">بونوس مهارت:</span>
                      <span className="font-mono font-bold text-[#EDE6D8]">+{diffResult.diff.oldProfBonus} → <strong className="text-[#6F9E78]">+{diffResult.diff.newProfBonus}</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A39A89] block">حداکثر جان (HP):</span>
                      <span className="font-mono font-bold text-[#EDE6D8]">{diffResult.diff.oldMaxHp} → <strong className="text-[#6F9E78]">+{diffResult.diff.hpGain} ({diffResult.diff.newMaxHp})</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A39A89] block">تاس جان:</span>
                      <span className="font-mono font-bold text-[#EDE6D8]">{diffResult.diff.fromLevel}d{hitDie} → <strong className="text-[#F2C265]">{diffResult.diff.toLevel}d{hitDie}</strong></span>
                    </div>
                  </div>

                  {diffResult.diff.abilityChanges && Object.keys(diffResult.diff.abilityChanges).length > 0 && (
                    <div className="p-2.5 rounded-lg bg-[#141822] border border-[#2F2A23] space-y-1">
                      <span className="text-[10px] text-[#A39A89] block font-bold">تغییرات ویژگی‌های بنیادین (ASI):</span>
                      {Object.entries(diffResult.diff.abilityChanges).map(([stat, val]) => (
                        <div key={stat} className="flex items-center justify-between text-xs">
                          <span className="text-[#EDE6D8]">{abilityFa[stat as AbilityName]}:</span>
                          <span className="font-mono text-[#F2C265] font-bold">{val?.before} → {val?.after}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {diffResult.diff.unlockedSubclass && (
                    <div className="p-2 rounded-lg bg-[#E0A030]/10 border border-[#E0A030]/30 text-xs text-[#F2C265]">
                      زیرکلاس جدید: <strong>{diffResult.diff.unlockedSubclass}</strong>
                    </div>
                  )}

                  {campaign?.settings?.approval?.onLevelUp && (
                    <div className="p-2.5 rounded-lg bg-[#7FB4D6]/10 border border-[#7FB4D6]/30 text-[11px] text-[#7FB4D6] flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>این کمپین نیازمند تأیید رسمی راوی (DM) است. پس از ارسال، درخواست در صف بررسی قرار خواهد گرفت.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#E8836B] p-2 rounded-lg bg-[#C2512B]/10 border border-[#C2512B]/30">
                  خطا در محاسبه تفاوت‌های ارتقا. لطفاً مقادیر ورودی را بررسی نمایید.
                </div>
              )}

              {submitError && (
                <div className="p-2.5 rounded-lg bg-[#C2512B]/20 border border-[#C2512B] text-xs text-[#E8836B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2F2A23]">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#EDE6D8] hover:border-[#E0A030] transition flex items-center gap-1.5 touch-target min-h-[44px]"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>
          ) : (
            <div />
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-extrabold hover:bg-[#F2C265] transition flex items-center gap-1.5 touch-target min-h-[44px] shadow-lg shadow-[#E0A030]/20"
            >
              <span>مرحله بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] text-xs font-black transition flex items-center gap-2 touch-target min-h-[44px] shadow-lg shadow-[#E0A030]/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت ارتقا...' : `تأیید و صعود به سطح ${nextLevel}`}</span>
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
