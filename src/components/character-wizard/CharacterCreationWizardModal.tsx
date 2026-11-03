import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Campaign,
  MasterCharacter,
  CharacterParticipation,
  ClassTemplate,
  LineageTemplate,
  BackgroundTemplate,
  CharacterBuild,
  AbilityMethod,
  AbilityScoreMap,
  AbilityName
} from '../../types';
import {
  validateIdentityStep,
  validateClassStep,
  validateAbilitiesStep,
  calculateFinalAbilities,
  validateBackgroundAndSkillsStep,
  validateEquipmentStep,
  validateSpellsStep,
  computeAuthoritativeParticipation,
  CANON_STARTER_WEAPONS,
  StarterWeaponChoice,
  TaggedProficiency
} from '../../../shared/rules/wizardEngine';
import {
  abilityModifier,
  computeAC,
  computeMaxHp,
  computeSlots,
  STANDARD_ARRAY,
  POINT_BUY_COST_TABLE,
  pointBuyCost
} from '../../../shared/rules/engine';
import { 
  X, ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, 
  Shield, Heart, Swords, Wand2, BookOpen, User, Flame, 
  Scale, Dice5, Save, RefreshCw, Upload, Info, Award
} from 'lucide-react';
import { APP_NAME_FA } from '../../config/app';
import { ScrollableRow } from '../ui/ScrollableRow';
import { BottomSheet } from '../mobile/BottomSheet';

interface CharacterCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  existingDraft?: CharacterParticipation | null;
  allowedClasses: ClassTemplate[];
  availableLineages: LineageTemplate[];
  availableBackgrounds: BackgroundTemplate[];
  onSaveDraft: (draftData: {
    id?: string;
    characterId?: string;
    masterData: Partial<MasterCharacter>;
    build: CharacterBuild;
    level: number;
    className: string;
  }) => Promise<void>;
  onSubmitCharacter: (payload: {
    participationId?: string;
    characterId?: string;
    masterData: Partial<MasterCharacter>;
    build: CharacterBuild;
  }) => Promise<void>;
  onServerRollAbilities: () => Promise<{ rolls: number[][]; scores: number[] }>;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
];

const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS_FA: Record<AbilityName, string> = {
  str: 'قدرت (STR)',
  dex: 'چابکی (DEX)',
  con: 'استقامت (CON)',
  int: 'هوش (INT)',
  wis: 'خرد (WIS)',
  cha: 'فرهمندی (CHA)'
};

export const CharacterCreationWizardModal: React.FC<CharacterCreationWizardModalProps> = ({
  isOpen,
  onClose,
  campaign,
  existingDraft,
  allowedClasses,
  availableLineages,
  availableBackgrounds,
  onSaveDraft,
  onSubmitCharacter,
  onServerRollAbilities
}) => {
  // Wizard current step: 1..8
  const [currentStep, setCurrentStep] = useState<number>(existingDraft?.build?.wizardStep || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [showClassCompare, setShowClassCompare] = useState(false);

  // Step 1: Identity
  const [name, setName] = useState<string>(existingDraft?.characterName || '');
  const [portraitUrl, setPortraitUrl] = useState<string>(existingDraft?.characterPortraitUrl || PRESET_AVATARS[0]);
  const [selectedLineageId, setSelectedLineageId] = useState<string>(existingDraft?.build?.lineageId || availableLineages[0]?.id || '');
  const [appearance, setAppearance] = useState<string>(existingDraft?.characterAppearance || '');
  const [lineageAbilityChoice, setLineageAbilityChoice] = useState<Record<string, number>>(existingDraft?.build?.lineageAbilityChoices || {});

  // Step 2: Class
  const [selectedClassName, setSelectedClassName] = useState<string>(
    existingDraft?.className || allowedClasses[0]?.name || 'فرهدار'
  );

  // Step 3: Abilities
  const allowedAbilityMethods = campaign.settings?.abilityScoreMethods || [
    'standard_array', 'point_buy', 'roll', 'class_base', 'manual'
  ];
  const [abilityMethod, setAbilityMethod] = useState<AbilityMethod>(
    existingDraft?.build?.abilityMethod || allowedAbilityMethods[0] || 'standard_array'
  );
  const [baseScores, setBaseScores] = useState<AbilityScoreMap>(
    existingDraft?.abilityScores || { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
  );
  const [pointBuyScores, setPointBuyScores] = useState<AbilityScoreMap>(
    ((existingDraft?.build?.pointBuy?.scores as unknown) as AbilityScoreMap) || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
  );
  const [serverRolls, setServerRolls] = useState<{ dice: number[][]; scores: number[]; assigned?: Record<string, number> } | null>(
    existingDraft?.build?.rolls || null
  );
  const [isRolling, setIsRolling] = useState(false);

  // Step 4: Background & Skills
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(
    existingDraft?.build?.backgroundId || availableBackgrounds[0]?.id || ''
  );
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>(
    existingDraft?.build?.skillChoices?.fromClass || []
  );
  const [traits, setTraits] = useState<string>('');
  const [ideals, setIdeals] = useState<string>('');
  const [bonds, setBonds] = useState<string>('');
  const [flaws, setFlaws] = useState<string>('');

  // Step 5: Equipment
  const [equipmentGroups, setEquipmentGroups] = useState<Record<string, string>>(
    existingDraft?.build?.equipmentChoices?.groups || {}
  );
  const [starterWeaponChoice, setStarterWeaponChoice] = useState<'standard' | 'special_showy'>('special_showy');
  const [selectedStarterWeaponId, setSelectedStarterWeaponId] = useState<string>(
    existingDraft?.build?.equipmentChoices?.starterWeaponId || CANON_STARTER_WEAPONS[0].id
  );

  // Step 6: Spells
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>(
    existingDraft?.build?.spellChoices?.cantrips || []
  );
  const [selectedSpells, setSelectedSpells] = useState<string[]>(
    existingDraft?.build?.spellChoices?.spellsKnown || []
  );

  // Step 7: Backstory
  const [origin, setOrigin] = useState<string>('');
  const [goals, setGoals] = useState<string>('');
  const [backstorySummary, setBackstorySummary] = useState<string>('');

  // Active Lineage & Class objects
  const activeLineage = useMemo(() => {
    return availableLineages.find(l => l.id === selectedLineageId) || null;
  }, [availableLineages, selectedLineageId]);

  const activeClass = useMemo(() => {
    return allowedClasses.find(c => c.name === selectedClassName || c.id === selectedClassName) || allowedClasses[0] || null;
  }, [allowedClasses, selectedClassName]);

  const activeBackground = useMemo(() => {
    return availableBackgrounds.find(b => b.id === selectedBackgroundId) || null;
  }, [availableBackgrounds, selectedBackgroundId]);

  // Compute Active Base Abilities depending on method
  const currentBaseScores = useMemo(() => {
    if (abilityMethod === 'point_buy') return pointBuyScores;
    if (abilityMethod === 'roll' && serverRolls?.assigned) return serverRolls.assigned as any;
    if (abilityMethod === 'class_base' && activeClass?.baseAbilityScores) {
      return {
        str: activeClass.baseAbilityScores.str || 10,
        dex: activeClass.baseAbilityScores.dex || 10,
        con: activeClass.baseAbilityScores.con || 10,
        int: activeClass.baseAbilityScores.int || 10,
        wis: activeClass.baseAbilityScores.wis || 10,
        cha: activeClass.baseAbilityScores.cha || 10
      };
    }
    return baseScores;
  }, [abilityMethod, pointBuyScores, serverRolls, activeClass, baseScores]);

  // Final Abilities combining lineage bonuses
  const finalAbilities = useMemo(() => {
    return calculateFinalAbilities(currentBaseScores, activeLineage, lineageAbilityChoice);
  }, [currentBaseScores, activeLineage, lineageAbilityChoice]);

  // Dynamic Point Buy Cost
  const currentPointBuyCost = useMemo(() => {
    return pointBuyCost(pointBuyScores as any);
  }, [pointBuyScores]);

  // Dynamic AC Preview
  const liveAc = useMemo(() => {
    return computeAC({
      acFormula: activeClass?.acFormula,
      className: activeClass?.name,
      abilities: finalAbilities
    });
  }, [activeClass, finalAbilities]);

  // Dynamic HP Preview
  const liveHp = useMemo(() => {
    return computeMaxHp({
      className: activeClass?.name,
      level: 1,
      abilities: finalAbilities,
      settings: { conAdjustFixedTable: campaign.settings?.conAdjustFixedTable ?? true },
      classTemplate: activeClass
    });
  }, [activeClass, finalAbilities, campaign.settings]);

  // Skills source tagging
  const skillValidation = useMemo(() => {
    const dummyBuild: CharacterBuild = {
      abilityMethod,
      skillChoices: { fromClass: selectedClassSkills },
      equipmentChoices: {}
    };
    return validateBackgroundAndSkillsStep(dummyBuild, activeClass, activeBackground, activeLineage);
  }, [abilityMethod, selectedClassSkills, activeClass, activeBackground, activeLineage]);

  // Check if active class is spellcaster
  const isCaster = Boolean(activeClass?.spellcasting?.ability || (activeClass as any)?.spellcastingStruct);

  // Initialize background personality tables when background changes
  useEffect(() => {
    if (activeBackground?.personalityTables) {
      if (activeBackground.personalityTables.traits?.length && !traits) {
        setTraits(activeBackground.personalityTables.traits[0]);
      }
      if (activeBackground.personalityTables.ideals?.length && !ideals) {
        setIdeals(activeBackground.personalityTables.ideals[0]);
      }
      if (activeBackground.personalityTables.bonds?.length && !bonds) {
        setBonds(activeBackground.personalityTables.bonds[0]);
      }
      if (activeBackground.personalityTables.flaws?.length && !flaws) {
        setFlaws(activeBackground.personalityTables.flaws[0]);
      }
    }
  }, [activeBackground]);

  // Handle server roll button
  const handleRollAbilities = async () => {
    setIsRolling(true);
    setErrorMsg(null);
    try {
      const res = await onServerRollAbilities();
      const assigned: Record<string, number> = {
        str: res.scores[0],
        dex: res.scores[1],
        con: res.scores[2],
        int: res.scores[3],
        wis: res.scores[4],
        cha: res.scores[5]
      };
      setServerRolls({ dice: res.rolls, scores: res.scores, assigned });
      setToastNotice('پرتاب 4d6 با موفقیت در سرور انجام شد.');
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ریختن تاس‌های ویژگی.');
    } finally {
      setIsRolling(false);
    }
  };

  // Build Object Constructor
  const currentBuildObject: CharacterBuild = useMemo(() => {
    return {
      abilityMethod,
      rolls: serverRolls || undefined,
      pointBuy: abilityMethod === 'point_buy' ? { scores: pointBuyScores as any, cost: currentPointBuyCost } : undefined,
      lineageId: activeLineage?.id || null,
      lineageAbilityChoices: lineageAbilityChoice,
      backgroundId: activeBackground?.id || null,
      skillChoices: {
        fromClass: selectedClassSkills,
        fromBackground: activeBackground?.skillProficiencies || [],
        fromLineage: activeLineage?.proficiencies?.skills || []
      },
      equipmentChoices: {
        groups: equipmentGroups,
        starterWeaponId: selectedStarterWeaponId,
        starterWeaponChoice
      },
      spellChoices: isCaster ? {
        cantrips: selectedCantrips,
        spellsKnown: selectedSpells
      } : undefined,
      wizardStep: currentStep
    };
  }, [
    abilityMethod, serverRolls, pointBuyScores, currentPointBuyCost,
    activeLineage, lineageAbilityChoice, activeBackground,
    selectedClassSkills, equipmentGroups, selectedStarterWeaponId,
    starterWeaponChoice, isCaster, selectedCantrips, selectedSpells, currentStep
  ]);

  // Master Character Data Object
  const masterDataObject: Partial<MasterCharacter> = useMemo(() => {
    return {
      name: name.trim(),
      race: activeLineage?.name || 'آدمی',
      appearance,
      portraitUrl,
      backstory: {
        summary: backstorySummary,
        origin,
        personality: { traits, ideals, bonds, flaws },
        goals,
        relationships: [],
        timeline: [],
        sections: [],
        dmOnly: { secrets: '', hooks: '' }
      }
    };
  }, [name, activeLineage, appearance, portraitUrl, backstorySummary, origin, traits, ideals, bonds, flaws, goals]);

  // Handle Save Draft & Continue Later
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setErrorMsg(null);
    try {
      await onSaveDraft({
        id: existingDraft?.id,
        characterId: existingDraft?.characterId,
        masterData: masterDataObject,
        build: currentBuildObject,
        level: 1,
        className: activeClass?.name || 'ماجراجو'
      });
      setToastNotice('پیش‌نویس کاراکتر با موفقیت ذخیره شد. می‌توانید بعداً آن را از صفحه اصلی ادامه دهید.');
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره‌سازی پیش‌نویس.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step Next with Validation
  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      const v = validateIdentityStep({ name, portraitUrl }, activeLineage, availableLineages.length > 0);
      if (!v.valid) {
        setErrorMsg(v.errors.join(' | '));
        return;
      }
    } else if (currentStep === 2) {
      const v = validateClassStep(selectedClassName, allowedClasses);
      if (!v.valid) {
        setErrorMsg(v.errors.join(' | '));
        return;
      }
    } else if (currentStep === 3) {
      const v = validateAbilitiesStep(abilityMethod, currentBaseScores, currentBuildObject, activeClass, allowedAbilityMethods);
      if (!v.valid) {
        setErrorMsg(v.errors.join(' | '));
        return;
      }
    } else if (currentStep === 4) {
      if (!skillValidation.result.valid) {
        setErrorMsg(skillValidation.result.errors.join(' | '));
        return;
      }
    } else if (currentStep === 5 && !isCaster) {
      // If not caster, jump directly from 5 to 7 (backstory)
      setCurrentStep(7);
      return;
    }

    if (currentStep < 8) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (currentStep === 7 && !isCaster) {
      setCurrentStep(5);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit Final Character
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitCharacter({
        participationId: existingDraft?.id,
        characterId: existingDraft?.characterId,
        masterData: masterDataObject,
        build: currentBuildObject
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در نهایی‌سازی و ثبت کاراکتر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 text-accent-hover flex items-center justify-center font-bold text-xs shrink-0">
            {currentStep}
          </div>
          <span className="font-bold text-sm text-accent-hover truncate">ویزارد آفرینش کاراکتر {APP_NAME_FA}</span>
        </div>
      }
      subtitle={`کمپین: ${campaign.name} (سطح ${campaign.settings?.startingLevel || 1})`}
      fullHeight
      maxWidth="max-w-3xl"
      headerExtra={
        <Button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting}
          className="px-2.5 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent/50 text-xs font-bold text-text-primary hover:text-accent-hover transition-all flex items-center gap-1.5 min-h-[44px]"
          title="ذخیره موقت جهت ادامه در آینده"
        >
          <Save className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">ذخیره موقت</span>
        </Button>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Back button */}
          <Button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`px-4 py-2.5 rounded-xl border border-border text-xs font-bold transition-all flex items-center gap-1 min-h-[44px] ${
              currentStep === 1
                ? 'opacity-40 bg-surface text-text-muted cursor-not-allowed'
                : 'bg-surface-2 text-text-primary hover:border-accent'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>قبلی</span>
          </Button>

          {/* Save Draft */}
          <Button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border hover:border-accent/50 text-xs font-bold text-accent transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره و ادامه بعداً</span>
          </Button>

          {/* Next / Submit button */}
          {currentStep < 8 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-all flex items-center gap-1 min-h-[44px] shadow-lg shadow-accent/20"
            >
              <span>گام بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-success text-on-accent text-xs font-bold hover:bg-success transition-all flex items-center gap-1.5 min-h-[44px] shadow-lg shadow-success/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'تایید نهایی و آفرینش'}</span>
            </Button>
          )}
        </div>
      }
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Stepper Bar                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="shrink-0 pb-1 border-b border-border">
        <ScrollableRow
          activeKey={currentStep}
          wrapperClassName="w-full"
          className="pb-1 text-xs font-medium text-text-muted gap-1.5"
        >
          {[
            { step: 1, title: 'هویت' },
            { step: 2, title: 'کلاس' },
            { step: 3, title: 'ویژگی‌ها' },
            { step: 4, title: 'مهارت‌ها' },
            { step: 5, title: 'تجهیزات' },
            { step: 6, title: 'وردها', hidden: !isCaster },
            { step: 7, title: 'پیش‌داستان' },
            { step: 8, title: 'بازبینی' }
          ].filter(s => !s.hidden).map(s => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <Button
                key={s.step}
                data-key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 snap-start whitespace-nowrap min-h-[44px] ${
                  isActive
                    ? 'bg-accent/20 text-accent-hover font-bold border border-accent/40'
                    : isDone
                    ? 'text-success'
                    : 'hover:text-text-primary'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <span className="shrink-0">{s.step}.</span>}
                <span className="whitespace-nowrap shrink-0">{s.title}</span>
              </Button>
            );
          })}
        </ScrollableRow>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Feedback Toasts & Errors                                   */}
      {/* ------------------------------------------------------------- */}
      {errorMsg && (
        <div className="rounded-xl bg-danger/20 border border-danger/40 px-4 py-2.5 flex items-center gap-2 text-xs text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {toastNotice && (
        <div className="rounded-xl bg-success/20 border border-success/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-success">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastNotice}</span>
          </div>
          <Button onClick={() => setToastNotice(null)} className="text-xs text-text-muted">بستن</Button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Main Wizard Content                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* STEP 1: IDENTITY & LINEAGE                                   */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                گام 1: هویت، نام و تبار کاراکتر
              </h3>
              <p className="text-xs text-text-muted mt-1">
                نام قهرمان و تصویر چهره او را مشخص کنید. تبار و نژاد، توانایی‌های سرشتی شخصیت را معین می‌کنند.
              </p>
            </div>

            {/* Character Name */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">نام کاراکتر *</label>
              <Input noWrapper
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: ارسباران، سودابه، زروان‌داد..."
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* Portrait Selection / Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-primary">پرتره و چهره کاراکتر (سقف 150 کیلوبایت)</label>
              <div className="flex items-center gap-4">
                <img
                  src={portraitUrl}
                  alt={name || 'پیش‌نمایش پرتره'}
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/40 shadow-md shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <Button
                        key={i}
                        type="button"
                        onClick={() => setPortraitUrl(url)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                          portraitUrl === url ? 'border-accent scale-105' : 'border-border opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Avatar ${i}`}
                          loading="lazy"
                          decoding="async"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </Button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border hover:border-accent/40 text-xs text-text-primary cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-accent" />
                    <span>بارگذاری تصویر دلخواه (خودکار فشرده‌سازی)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const res = ev.target?.result as string;
                            if (res) setPortraitUrl(res);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Lineage Selection */}
            {availableLineages.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-text-primary">
                    انتخاب تبار و نژاد (Lineage)
                  </label>
                  <span className="text-xs text-text-muted">
                    {availableLineages.length} تبار در دسترس در کمپین
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableLineages.map(lin => {
                    const isSelected = selectedLineageId === lin.id;
                    return (
                      <div
                        key={lin.id}
                        onClick={() => setSelectedLineageId(lin.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-accent/15 border-accent shadow-md shadow-accent/10'
                            : 'bg-surface border-border hover:border-border-strong'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-text-primary">{lin.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
                            سرعت: {lin.speed} فوت
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-1.5 line-clamp-2">
                          {lin.description || 'تبار کهن فلات و مرزهای زروانیا.'}
                        </p>
                        {lin.abilityBonuses && (
                          <div className="mt-2 text-xs text-accent-hover font-semibold">
                            {lin.abilityBonuses.mode === 'fixed' && lin.abilityBonuses.fixed && (
                              <span>
                                پاداش: {Object.entries(lin.abilityBonuses.fixed).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join('، ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-3 bg-surface border border-border text-xs text-text-muted flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span>این کمپین نژاد ویژه‌ای تعریف نکرده است؛ نژاد استاندارد «آدمی (Human)» اعمال خواهد شد.</span>
              </div>
            )}

            {/* Appearance notes */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">ویژگی‌های ظاهری و پوشش</label>
              <Textarea noWrapper
                value={appearance}
                onChange={e => setAppearance(e.target.value)}
                placeholder="قد، رنگ مو و چشمان، زخم‌های کهنه، نوع جامه یا زره..."
                rows={2}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 2: CLASS SELECTION & COMPARE SHEET                      */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                  <Swords className="w-5 h-5 text-accent" />
                  گام 2: کلاس بازی (Class)
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  کلاس، نقش رزمی، نحوه بقا و ویژگی‌های جادویی شما را تعیین می‌کند.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowClassCompare(true)}
                className="px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/40 text-accent-hover text-xs font-bold hover:bg-accent/25 transition-all flex items-center gap-1.5 min-h-[44px]"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>مقایسه کلاس‌ها</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {allowedClasses.map(cls => {
                const isSelected = selectedClassName === cls.name || selectedClassName === cls.id;
                return (
                  <div
                    key={cls.id || cls.name}
                    onClick={() => setSelectedClassName(cls.name)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-accent/15 border-accent shadow-lg shadow-accent/10 scale-[1.01]'
                        : 'bg-surface border-border hover:border-border-strong'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-text-primary">{cls.name}</h4>
                          <span className="text-xs text-accent-hover">{cls.title || ''}</span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-2 text-text-primary font-mono">
                          Hit Die: {cls.hitDie || 'd8'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-2 line-clamp-3 leading-relaxed">
                        {cls.description || cls.notes || 'کلاس اختصاصی در دنیای زروانیا.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                      <span>پرتاب نجات: {(cls.saves || []).join('، ')}</span>
                      <span className="text-accent font-semibold">
                        {cls.spellcasting ? 'جادوگر' : 'رزمی/تکنیکی'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 3: ABILITIES (STANDARD ARRAY, POINT BUY, ROLLS)         */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <Dice5 className="w-5 h-5 text-accent" />
                گام 3: ویژگی‌های پایه (Ability Scores)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                روش تعیین امتیازات خود را انتخاب کرده و امتیازات را تخصیص دهید.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allowedAbilityMethods.map(m => {
                const labels: Record<AbilityMethod, string> = {
                  standard_array: 'آرایه استاندارد',
                  point_buy: 'خرید امتیاز (Point Buy)',
                  roll: 'پرتاب تاس (4d6 سرور)',
                  class_base: 'پایه کلاس',
                  manual: 'دستی'
                };
                const isSelected = abilityMethod === m;
                return (
                  <Button
                    key={m}
                    type="button"
                    onClick={() => setAbilityMethod(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[44px] ${
                      isSelected
                        ? 'bg-accent text-on-accent shadow-md'
                        : 'bg-surface text-text-muted border border-border hover:text-text-primary'
                    }`}
                  >
                    {labels[m] || m}
                  </Button>
                );
              })}
            </div>

            {/* Point Buy Budget Live Display */}
            {abilityMethod === 'point_buy' && (
              <div className="p-3.5 rounded-2xl bg-surface border border-accent/30 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-text-muted">بودجه مصرف‌شده:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-lg font-bold ${currentPointBuyCost > 27 ? 'text-danger-hover' : 'text-accent-hover'}`}>
                      {currentPointBuyCost}
                    </span>
                    <span className="text-xs text-text-muted">/ 27 امتیاز</span>
                  </div>
                </div>
                <div className="text-xs text-text-muted text-end">
                  امتیاز 8 تا 15 مجاز است.
                </div>
              </div>
            )}

            {/* Roll Server-Side 4d6 Drop Lowest */}
            {abilityMethod === 'roll' && (
              <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary">تاس‌های ریخته‌شده سرور:</span>
                  <Button
                    type="button"
                    onClick={handleRollAbilities}
                    disabled={isRolling}
                    className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>ریختن تاس جدید (4d6)</span>
                  </Button>
                </div>

                {serverRolls ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                    {serverRolls.scores.map((score, i) => (
                      <div key={i} className="p-2 rounded-xl bg-surface-2 border border-border text-center">
                        <span className="text-base font-bold text-accent-hover">{score}</span>
                        <span className="block text-xs text-text-muted">
                          {serverRolls.dice[i]?.join('+')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">هنوز تاسی ریخته نشده است. دکمه بالا را بزنید.</p>
                )}
              </div>
            )}

            {/* Ability Grid Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ABILITY_KEYS.map(key => {
                const baseVal = currentBaseScores[key] || 10;
                const finalVal = finalAbilities[key] || 10;
                const mod = abilityModifier(finalVal);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{ABILITY_LABELS_FA[key]}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-accent-hover font-mono">{finalVal}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-success font-bold font-mono">
                          {modStr}
                        </span>
                        {finalVal > baseVal && (
                          <span className="text-xs text-accent font-medium">
                            (+{finalVal - baseVal} تبار)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Editor controls */}
                    {abilityMethod === 'point_buy' && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          onClick={() => {
                            if (baseVal > 8) {
                              setPointBuyScores(prev => ({ ...prev, [key]: baseVal - 1 }));
                            }
                          }}
                          disabled={baseVal <= 8}
                          className="w-7 h-7 rounded-lg bg-surface-2 text-text-primary disabled:opacity-30 flex items-center justify-center font-bold"
                        >
                          -
                        </Button>
                        <span className="w-6 text-center text-xs font-bold font-mono">{baseVal}</span>
                        <Button
                          type="button"
                          onClick={() => {
                            if (baseVal < 15) {
                              setPointBuyScores(prev => ({ ...prev, [key]: baseVal + 1 }));
                            }
                          }}
                          disabled={baseVal >= 15}
                          className="w-7 h-7 rounded-lg bg-surface-2 text-text-primary disabled:opacity-30 flex items-center justify-center font-bold"
                        >
                          +
                        </Button>
                      </div>
                    )}

                    {abilityMethod === 'standard_array' && (
                      <Select noWrapper
                        value={baseVal}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setBaseScores(prev => ({ ...prev, [key]: val }));
                        }}
                        className="bg-surface-2 border border-border text-xs font-mono text-accent-hover rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {STANDARD_ARRAY.map(score => (
                          <option key={score} value={score}>{score}</option>
                        ))}
                      </Select>
                    )}

                    {abilityMethod === 'manual' && (
                      <Input noWrapper
                        type="number"
                        min={3}
                        max={18}
                        value={baseVal}
                        onChange={e => {
                          const val = Math.max(3, Math.min(18, parseInt(e.target.value, 10) || 10));
                          setBaseScores(prev => ({ ...prev, [key]: val }));
                        }}
                        className="w-14 bg-surface-2 border border-border text-xs font-mono text-accent-hover rounded-lg px-2 py-1 text-center"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 4: BACKGROUND & SKILLS (COUNTS & SOURCE TAGGING)        */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                گام 4: پیشینه و مهارت‌ها (Background & Skills)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                پیشینه، زندگی قبل از ماجراجویی شماست. مهارت‌ها با برچسب منبع مشخص می‌شوند.
              </p>
            </div>

            {/* Background selection */}
            {availableBackgrounds.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-primary">انتخاب پیشینه (Background)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableBackgrounds.map(bg => {
                    const isSelected = selectedBackgroundId === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setSelectedBackgroundId(bg.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-accent/15 border-accent shadow-md shadow-accent/10'
                            : 'bg-surface border-border hover:border-border-strong'
                        }`}
                      >
                        <h4 className="text-sm font-bold text-text-primary">{bg.name}</h4>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{bg.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(bg.skillProficiencies || []).map(sk => (
                            <span key={sk} className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-accent-hover">
                              {sk} [پیشینه]
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Class Skill Choices */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-text-primary">
                  انتخاب مهارت‌های کلاس ({selectedClassSkills.length} از {activeClass?.skillChoices?.count || 2} مورد)
                </label>
                <span className="text-xs text-text-muted">
                  مجاز: {(activeClass?.skillChoices?.options || []).join('، ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(activeClass?.skillChoices?.options || []).map(opt => {
                  const lower = opt.toLowerCase();
                  const isChecked = selectedClassSkills.includes(lower);
                  return (
                    <Button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedClassSkills(prev => prev.filter(s => s !== lower));
                        } else {
                          if (selectedClassSkills.length < (activeClass?.skillChoices?.count || 2)) {
                            setSelectedClassSkills(prev => [...prev, lower]);
                          }
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-start transition-all flex flex-wrap items-center justify-between gap-2 ${
                        isChecked
                          ? 'bg-accent/20 border-accent text-accent-hover'
                          : 'bg-surface border-border text-text-primary hover:border-border-strong'
                      }`}
                    >
                      <span>{opt}</span>
                      <span className="text-xs opacity-70">[کلاس]</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* All Active Proficiencies with Tags */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
              <h4 className="text-xs font-bold text-text-primary">مهارت‌های فعال کاراکتر و منابع آن‌ها:</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {skillValidation.taggedProficiencies.map(tp => {
                  const badgeColors: Record<TaggedProficiency['source'], string> = {
                    class: 'bg-accent/20 text-accent-hover border-accent/40',
                    background: 'bg-role-codm/20 text-role-codm border-role-codm/40',
                    lineage: 'bg-success/20 text-success border-success/40'
                  };
                  const sourceLabels: Record<TaggedProficiency['source'], string> = {
                    class: 'کلاس',
                    background: 'پیشینه',
                    lineage: 'تبار'
                  };
                  return (
                    <span
                      key={tp.key}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${badgeColors[tp.source]}`}
                    >
                      <span>{tp.key}</span>
                      <span className="text-xs opacity-80 font-bold">[{sourceLabels[tp.source]}]</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 5: EQUIPMENT & SPECIAL-VS-SHOWY WEAPONS                 */}
        {/* ============================================================ */}
        {currentStep === 5 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                گام 5: تجهیزات و اسلحه آغازین (Equipment)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                سلاح آغازین و تجهیزات رزمی خود را تعیین کنید. پیش‌نمایش زنده‌ی زره (AC) و جان در پایین مشخص است.
              </p>
            </div>

            {/* Live Stats Preview Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="text-xs text-text-muted">درجه زره (AC پیش‌نمایش):</span>
                </div>
                <span className="text-lg font-bold text-accent-hover font-mono">{liveAc}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-danger-hover" />
                  <span className="text-xs text-text-muted">جان اولیه (Max HP):</span>
                </div>
                <span className="text-lg font-bold text-text-primary font-mono">{liveHp}</span>
              </div>
            </div>

            {/* Special-vs-Showy Starter Weapon Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-primary">
                انتخاب اسلحه ویژه یا نمایشی (Tradeoff Trade)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CANON_STARTER_WEAPONS.map(w => {
                  const isSelected = selectedStarterWeaponId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedStarterWeaponId(w.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-accent/15 border-accent shadow-md shadow-accent/10'
                          : 'bg-surface border-border hover:border-border-strong'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-text-primary">{w.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            w.kind === 'special' ? 'bg-role-codm/20 text-role-codm' : 'bg-accent/20 text-accent-hover'
                          }`}>
                            {w.kind === 'special' ? 'سلاح ویژه (جادویی)' : 'سلاح نمایشی (باوقار)'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-text-muted font-mono">
                          آسیب: {w.damageDice} ({w.damageType})
                        </div>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">
                          {w.tradeoffFa}
                        </p>
                      </div>

                      {w.specialAbility && (
                        <div className="mt-3 pt-2 border-t border-border text-xs text-role-codm">
                          ⚡ {w.specialAbility.name}: {w.specialAbility.description}
                        </div>
                      )}
                      {w.showyBonus && (
                        <div className="mt-3 pt-2 border-t border-border text-xs text-accent-hover">
                          👑 {w.showyBonus.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 6: SPELLS (ONLY FOR CASTERS)                            */}
        {/* ============================================================ */}
        {currentStep === 6 && isCaster && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-accent" />
                گام 6: وردها و جادوها (Spellcasting)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                ترفندهای جادویی آغازین (Cantrips) و اسپل‌های آماده شده را تعیین کنید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary">اسلات‌های جادویی سطح 1:</span>
              <div className="flex items-center gap-2 pt-1 font-mono text-sm text-accent-hover">
                {computeSlots(activeClass?.name || '', 1).map((cnt, lvl) => (
                  <span key={lvl} className="px-3 py-1 rounded-xl bg-surface-2 border border-border">
                    اسلات سطح {lvl + 1}: {cnt} بار
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-primary">
                ترفندهای جادویی پیشنهادی کلاس {activeClass?.name}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {((activeClass?.spellcasting as any)?.spells?.cantrips || ['شراره فره', 'لمس درمان', 'نور']).map((can: string) => (
                  <div key={can} className="p-3 rounded-xl bg-surface border border-border text-xs text-text-primary">
                    {can}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 7: BACKSTORY & MOTIVATION                               */}
        {/* ============================================================ */}
        {currentStep === 7 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  گام 7: پیش‌داستان و انگیزه‌ها (اختیاری)
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  می‌توانید این گام را رد کرده و بعداً در بخش پرونده شخصیت تکمیل نمایید.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">خاستگاه و زادگاه</label>
              <Input noWrapper
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="روستای جنگلی ورنا، بارگاه پادشاهی، بیابان‌های هامون..."
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">اهداف و آرمان‌ها</label>
              <Input noWrapper
                type="text"
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="یافتن برادر گم‌شده، کشف کتابچه باستانی زروان..."
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">خلاصه پیش‌داستان</label>
              <Textarea noWrapper
                value={backstorySummary}
                onChange={e => setBackstorySummary(e.target.value)}
                rows={3}
                placeholder="داستان سفر قهرمان به آستانه کمپین..."
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 8: REVIEW & SUBMIT                                      */}
        {/* ============================================================ */}
        {currentStep === 8 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-bold text-accent-hover flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                گام 8: بازبینی نهایی و تایید (Review & Submit)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                اطلاعات شناسنامه و مقادیر بازتولید شده توسط موتور قوانین را بررسی کنید.
              </p>
            </div>

            {/* Character Summary Card */}
            <div className="p-4 rounded-2xl bg-surface border border-accent/30 shadow-lg space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={portraitUrl}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/40 shrink-0"
                />
                <div>
                  <h4 className="text-lg font-bold text-text-primary">{name || 'بی‌نام'}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-accent-hover">
                    <span>کلاس: {activeClass?.name}</span>
                    <span>•</span>
                    <span>تبار: {activeLineage?.name || 'آدمی'}</span>
                    <span>•</span>
                    <span>پیشینه: {activeBackground?.name || 'ساده'}</span>
                  </div>
                </div>
              </div>

              {/* Combat preview strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div className="text-center p-2 rounded-xl bg-surface-2">
                  <span className="block text-xs text-text-muted">درجه زره (AC)</span>
                  <span className="text-base font-bold text-accent-hover font-mono">{liveAc}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-surface-2">
                  <span className="block text-xs text-text-muted">بیشینه جان (HP)</span>
                  <span className="text-base font-bold text-text-primary font-mono">{liveHp}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-surface-2">
                  <span className="block text-xs text-text-muted">ابتکار عمل</span>
                  <span className="text-base font-bold text-success font-mono">
                    {abilityModifier(finalAbilities.dex || 10) >= 0 ? `+${abilityModifier(finalAbilities.dex || 10)}` : abilityModifier(finalAbilities.dex || 10)}
                  </span>
                </div>
              </div>

              {/* Ability Scores Review */}
              <div className="grid grid-cols-6 gap-1.5 pt-2 text-center">
                {ABILITY_KEYS.map(k => (
                  <div key={k} className="p-1.5 rounded-lg bg-surface-2 border border-border">
                    <span className="block text-[9px] text-text-muted uppercase">{k}</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{finalAbilities[k]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status notice */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-border text-xs text-text-muted space-y-1">
              <span className="font-bold text-text-primary">وضعیت پس از ثبت:</span>
              <p>
                {campaign.settings?.approval?.onCreate
                  ? 'کمپین نیازمند تأیید دانجن مستر است. کاراکتر در صف تأیید قرار خواهد گرفت.'
                  : 'کمپین ورود مستقیم دارد. کاراکتر بلافاصله در کمپین فعال می‌شود.'}
              </p>
            </div>
          </section>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Class Compare Sheet Modal                                     */}
      {/* ------------------------------------------------------------- */}
      <BottomSheet
        isOpen={showClassCompare}
        onClose={() => setShowClassCompare(false)}
        title={
          <span className="flex items-center gap-2 text-accent-hover">
            <Scale className="w-4 h-4 text-accent-hover" />
            <span>مقایسه کلاس‌های مجاز کمپین</span>
          </span>
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {allowedClasses.map(cls => (
            <div key={cls.id || cls.name} className="p-3.5 rounded-2xl bg-bg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-text-primary">{cls.name}</h4>
                <span className="text-xs text-accent-hover font-mono">تاس جان: {cls.hitDie}</span>
              </div>
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{cls.description || cls.notes}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                <span>سیوها: {(cls.saves || []).join('، ')}</span>
                <span>•</span>
                <span>زره: {cls.armorProf || 'متنوع'}</span>
                <span>•</span>
                <span>نوع جادو: {cls.spellcasting ? cls.spellcasting.ability : 'بدون جادو'}</span>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    </BottomSheet>
  );
};
