import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
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
      <div className="space-y-4 text-text-primary pb-4" dir="rtl">
        {/* Step Progress Stepper */}
        <div className="flex flex-wrap items-center justify-between gap-2 gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <Button
                key={st.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  isCurrent
                    ? 'bg-accent text-on-accent'
                    : isCompleted
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{st.label}</span>
              </Button>
            );
          })}
        </div>

        {/* STEP 1: FEATURES & SUMMARY */}
        {currentStep.id === 'features' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-warning/20 via-info to-surface border border-accent/40 text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-hover">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-accent-hover">
                صعود به سطح {nextLevel}
              </h3>
              <p className="text-xs text-text-muted">
                بونوس مهارت (Proficiency): <span className="font-mono text-accent-hover font-bold">+{nextProf}</span>
                {nextProf > currentProf && <span className="text-success font-bold me-1"> (+1 افزایش!)</span>}
              </p>
            </div>

            <div className="surface-card rounded min-h-[75vh]-xl p-3.5 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-hover">
                <Sparkles className="w-4 h-4 text-accent-hover" />
                <span>قابلیت‌های جدید سطح {nextLevel}:</span>
              </div>
              <div className="space-y-1.5">
                {newFeatures.map((f, i) => (
                  <div key={i} className="text-xs text-text-primary bg-surface p-2.5 rounded-lg border border-border flex items-start gap-2">
                    <span className="text-accent font-black">✦</span>
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
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-danger" />
                  <span className="text-xs font-bold text-text-primary">محاسبه افزایش جان (HP)</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    onClick={() => setHpMode('fixed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      hpMode === 'fixed'
                        ? 'bg-accent text-on-accent'
                        : 'bg-surface-2 text-text-muted border border-border-strong'
                    }`}
                  >
                    مقدار ثابت (Fixed)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setHpMode('roll')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      hpMode === 'roll'
                        ? 'bg-accent text-on-accent'
                        : 'bg-surface-2 text-text-muted border border-border-strong'
                    }`}
                  >
                    پرتاب تاس (Roll)
                  </Button>
                </div>
              </div>

              {/* CON Breakdown formula display */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <span className="text-xs text-text-muted block">فرمول استاندارد 5e: تاس جان (1d{hitDie}) + اصلاحگر بنیه</span>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-text-muted">اصلاحگر بنیه (CON {conScore}):</span>
                  <span className="font-mono font-bold text-accent-hover">
                    {conMod >= 0 ? `+${conMod}` : conMod}
                  </span>
                </div>

                {hpMode === 'fixed' ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/60">
                    <span className="text-text-muted">محاسبه مقدار ثابت:</span>
                    <span className="font-mono font-bold text-text-primary">
                      پایه ({fixedHpRoll}) + بنیه ({conMod >= 0 ? `+${conMod}` : conMod}) = <strong className="text-success">+{fixedHpTotal} جان</strong>
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-text-muted">نتیجه تاس 1d{hitDie}:</span>
                      <span className="font-mono text-base font-black text-accent-hover">{rolledHpValue}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-text-muted">جمع کل با بنیه:</span>
                      <span className="font-mono text-sm font-bold text-success">
                        +{Math.max(1, rolledHpValue + conMod)} جان
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleRollHp}
                      disabled={isRollingHp}
                      className="w-full py-2 rounded-xl bg-surface-2 border border-accent/40 text-accent-hover text-xs font-bold hover:bg-accent/15 transition"
                    >
                      {isRollingHp ? 'در حال پرتاب تاس...' : `پرتاب مجدد تاس 1d${hitDie}`}
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-success/10 border border-success/30 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-text-muted">حداکثر جان بعد از ارتقا:</span>
                <span className="font-mono text-sm font-black text-success">
                  {activeParticipation.maxHp} → {activeParticipation.maxHp + (hpMode === 'fixed' ? fixedHpTotal : Math.max(1, rolledHpValue + conMod))} HP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ASI SCREEN (CAPPED AT 20, FEATS HIDDEN) */}
        {currentStep.id === 'asi' && (
          <div className="space-y-4">
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-accent" />
                  <span className="text-xs font-bold text-text-primary">بهبود ویژگی‌ها (ASI)</span>
                </div>
                <div className="flex gap-1 text-xs">
                  <Button
                    type="button"
                    onClick={() => setAsiMode('plus2')}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                      asiMode === 'plus2'
                        ? 'bg-accent text-on-accent border-accent-hover'
                        : 'bg-surface-2 text-text-muted border-border-strong'
                    }`}
                  >
                    +2 به یک ویژگی
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAsiMode('plus1plus1')}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                      asiMode === 'plus1plus1'
                        ? 'bg-accent text-on-accent border-accent-hover'
                        : 'bg-surface-2 text-text-muted border-border-strong'
                    }`}
                  >
                    +1 به دو ویژگی
                  </Button>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                طبق قوانین رسمی 5e، سقف طبیعی هر ویژگی برابر 20 است. در این کمپین فیت‌ها (Feats) غیرفعال بوده و تنها ارتقای مستقیم امتیازات ویژگی مجاز است.
              </p>

              {asiMode === 'plus2' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-primary">انتخاب ویژگی (+2):</label>
                  <Select noWrapper
                    value={asiStat1}
                    onChange={(e) => setAsiStat1(e.target.value as AbilityName)}
                    className="w-full p-2.5 rounded-xl bg-info border border-border-strong text-xs text-text-primary"
                  >
                    {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                      const cur = currentAbilityScore(stat);
                      const isMaxed = cur >= 20;
                      return (
                        <option key={stat} value={stat} disabled={isMaxed}>
                          {abilityFa[stat]} — فعلی: {cur} {cur + 2 <= 20 ? `(می‌شود ${cur + 2})` : '(سقف 20 پر است!)'}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-primary">ویژگی اول (+1):</label>
                    <Select noWrapper
                      value={asiStat1}
                      onChange={(e) => setAsiStat1(e.target.value as AbilityName)}
                      className="w-full p-2.5 rounded-xl bg-info border border-border-strong text-xs text-text-primary"
                    >
                      {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                        const cur = currentAbilityScore(stat);
                        return (
                          <option key={stat} value={stat} disabled={cur >= 20}>
                            {abilityFa[stat]} — فعلی: {cur} (می‌شود {Math.min(20, cur + 1)})
                          </option>
                        );
                      })}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-primary">ویژگی دوم (+1):</label>
                    <Select noWrapper
                      value={asiStat2}
                      onChange={(e) => setAsiStat2(e.target.value as AbilityName)}
                      className="w-full p-2.5 rounded-xl bg-info border border-border-strong text-xs text-text-primary"
                    >
                      {(Object.keys(abilityFa) as AbilityName[]).map(stat => {
                        const cur = currentAbilityScore(stat);
                        return (
                          <option key={stat} value={stat} disabled={cur >= 20 || stat === asiStat1}>
                            {abilityFa[stat]} — فعلی: {cur} {stat === asiStat1 ? '(انتخاب شده در اول)' : `(می‌شود ${Math.min(20, cur + 1)})`}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: SUBCLASS UNLOCK */}
        {currentStep.id === 'subclass' && (
          <div className="space-y-4">
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                <span className="text-xs font-bold text-text-primary">انتخاب زیرکلاس اختصاصی (سطح 3)</span>
              </div>
              <p className="text-xs text-text-muted">
                با رسیدن به سطح 3، مسیر تخصصی خود را برای کلاس {character.className} برگزینید.
              </p>

              <div className="space-y-2">
                {classTemplate?.subclasses?.map((sub: any) => {
                  const isSelected = chosenSubclass === sub.name;
                  return (
                    <Button
                      type="button"
                      key={sub.name}
                      onClick={() => setChosenSubclass(sub.name)}
                      className={`w-full text-start p-3 rounded-xl border transition ${
                        isSelected
                          ? 'bg-accent/20 border-accent-hover text-accent-hover'
                          : 'bg-surface border-border text-text-primary'
                      }`}
                    >
                      <div className="text-xs font-black">{sub.name}</div>
                      {sub.desc && <p className="text-xs text-text-muted mt-1 leading-relaxed">{sub.desc}</p>}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SPELLS (FOR CASTERS) */}
        {currentStep.id === 'spells' && (
          <div className="space-y-4">
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-info" />
                <span className="text-xs font-bold text-text-primary">طلسم‌های آموخته‌شده یا آماده جدید</span>
              </div>
              <p className="text-xs text-text-muted">
                طلسم‌های جدید مجاز در این سطح را وارد کنید یا ذخیره نمایید.
              </p>

              <div className="flex gap-2">
                <Input noWrapper
                  type="text"
                  value={newSpellInput}
                  onChange={e => setNewSpellInput(e.target.value)}
                  placeholder="نام طلسم جدید (مثال: Fireball یا پرتو جادویی)..."
                  className="flex-1 p-2 rounded-xl bg-info border border-border text-xs text-text-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSpellInput.trim()) {
                      e.preventDefault();
                      setLearnedSpells(prev => [...prev, newSpellInput.trim()]);
                      setNewSpellInput('');
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newSpellInput.trim()) {
                      setLearnedSpells(prev => [...prev, newSpellInput.trim()]);
                      setNewSpellInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-info/20 border border-info/40 text-info text-xs font-bold"
                >
                  افزودن
                </Button>
              </div>

              {learnedSpells.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {learnedSpells.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-info/15 border border-info/30 text-xs text-info flex items-center gap-1.5"
                    >
                      <span>{sp}</span>
                      <Button
                        type="button"
                        onClick={() => setLearnedSpells(prev => prev.filter((_, i) => i !== idx))}
                        className="text-danger hover:text-danger"
                      >
                        ×
                      </Button>
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
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-xs font-bold text-text-primary">محاسبه خودکار همراهان و مخازن منابع</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                تاس‌های جان و ظرفیت منابع متناسب با سطح {nextLevel} به‌طور خودکار افزایش می‌یابند:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-info border border-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-text-muted">تاس‌های جان (Hit Dice):</span>
                  <span className="font-mono font-bold text-text-primary">
                    {currentLevel}d{hitDie} → <strong className="text-success">{nextLevel}d{hitDie}</strong>
                  </span>
                </div>

                {character.companions && character.companions.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-info border border-border space-y-1.5">
                    <span className="text-xs font-bold text-accent-hover block">همراهان ارتقایافته:</span>
                    {character.companions.map((comp, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-primary">
                        <span>{comp.name} ({comp.type})</span>
                        <span className="text-success font-bold">همگام با سطح کاراکتر</span>
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
            <div className="surface-card rounded min-h-[75vh]-xl p-4 border border-accent/40 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <span className="text-xs font-bold text-text-primary">بازبینی و مقایسه تغییرات (قبل و بعد)</span>
              </div>

              {diffResult ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-info border border-border">
                    <div>
                      <span className="text-xs text-text-muted block">سطح کاراکتر:</span>
                      <span className="font-mono font-bold text-text-primary">{diffResult.diff.fromLevel} → <strong className="text-accent-hover">{diffResult.diff.toLevel}</strong></span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">بونوس مهارت:</span>
                      <span className="font-mono font-bold text-text-primary">+{diffResult.diff.oldProfBonus} → <strong className="text-success">+{diffResult.diff.newProfBonus}</strong></span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">حداکثر جان (HP):</span>
                      <span className="font-mono font-bold text-text-primary">{diffResult.diff.oldMaxHp} → <strong className="text-success">+{diffResult.diff.hpGain} ({diffResult.diff.newMaxHp})</strong></span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">تاس جان:</span>
                      <span className="font-mono font-bold text-text-primary">{diffResult.diff.fromLevel}d{hitDie} → <strong className="text-accent-hover">{diffResult.diff.toLevel}d{hitDie}</strong></span>
                    </div>
                  </div>

                  {diffResult.diff.abilityChanges && Object.keys(diffResult.diff.abilityChanges).length > 0 && (
                    <div className="p-2.5 rounded-lg bg-info border border-border space-y-1">
                      <span className="text-xs text-text-muted block font-bold">تغییرات ویژگی‌های بنیادین (ASI):</span>
                      {Object.entries(diffResult.diff.abilityChanges).map(([stat, val]) => (
                        <div key={stat} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-text-primary">{abilityFa[stat as AbilityName]}:</span>
                          <span className="font-mono text-accent-hover font-bold">{val?.before} → {val?.after}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {diffResult.diff.unlockedSubclass && (
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/30 text-xs text-accent-hover">
                      زیرکلاس جدید: <strong>{diffResult.diff.unlockedSubclass}</strong>
                    </div>
                  )}

                  {campaign?.settings?.approval?.onLevelUp && (
                    <div className="p-2.5 rounded-lg bg-info/10 border border-info/30 text-xs text-info flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>این کمپین نیازمند تأیید رسمی راوی (DM) است. پس از ارسال، درخواست در صف بررسی قرار خواهد گرفت.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-danger p-2 rounded-lg bg-danger/10 border border-danger/30">
                  خطا در محاسبه تفاوت‌های ارتقا. لطفاً مقادیر ورودی را بررسی نمایید.
                </div>
              )}

              {submitError && (
                <div className="p-2.5 rounded-lg bg-danger/20 border border-danger text-xs text-danger flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 gap-3 pt-3 border-t border-border">
          {currentStepIndex > 0 ? (
            <Button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-xs font-bold text-text-primary hover:border-accent transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[44px]"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStepIndex < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-extrabold hover:bg-accent-hover transition flex items-center gap-1.5 touch-target min-w-[44px] min-h-[44px] shadow-lg shadow-accent/20"
            >
              <span>مرحله بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent text-xs font-black transition flex items-center gap-2 touch-target min-w-[44px] min-h-[44px] shadow-lg shadow-accent/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت ارتقا...' : `تأیید و صعود به سطح ${nextLevel}`}</span>
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
