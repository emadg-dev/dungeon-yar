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
    (existingDraft?.build?.pointBuy?.scores as AbilityScoreMap) || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
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
      setToastNotice('پرتاب ۴d۶ با موفقیت در سرور انجام شد.');
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0F0E0C] text-[#EDE6D8] overflow-hidden" dir="rtl">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Stepper Bar                                       */}
      {/* ------------------------------------------------------------- */}
      <header className="shrink-0 bg-[#171513] border-b border-[#2F2A23] px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E0A030]/20 text-[#F2C265] flex items-center justify-center font-bold">
              {currentStep}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2C265]">
                ویزارد آفرینش کاراکتر {APP_NAME_FA}
              </h2>
              <p className="text-[11px] text-[#A39A89]">
                کمپین: {campaign.name} (سطح {campaign.settings?.startingLevel || 1})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-3 py-1.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030]/50 text-xs font-bold text-[#C9C0AE] hover:text-[#F2C265] transition-all flex items-center gap-1.5 min-h-[36px]"
              title="ذخیره و خروج جهت ادامه در آینده"
            >
              <Save className="w-3.5 h-3.5 text-[#E0A030]" />
              <span className="hidden sm:inline">ذخیره موقت</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Dots / Labels */}
        <div className="mt-3 flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px] font-medium text-[#8A8374]">
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
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#E0A030]/20 text-[#F2C265] font-bold border border-[#E0A030]/40'
                    : isDone
                    ? 'text-[#6F9E78]'
                    : 'hover:text-[#EDE6D8]'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 text-[#6F9E78]" /> : <span>{s.step}.</span>}
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Feedback Toasts & Errors                                   */}
      {/* ------------------------------------------------------------- */}
      {errorMsg && (
        <div className="shrink-0 bg-[#C2512B]/20 border-b border-[#C2512B]/40 px-4 py-2.5 flex items-center gap-2 text-xs text-[#E8836B]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {toastNotice && (
        <div className="shrink-0 bg-[#6F9E78]/20 border-b border-[#6F9E78]/40 px-4 py-2 flex items-center justify-between text-xs text-[#95C29E]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="text-[10px] text-[#A39A89]">بستن</button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Main Wizard Content Viewport                               */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">
        {/* ============================================================ */}
        {/* STEP 1: IDENTITY & LINEAGE                                   */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <User className="w-5 h-5 text-[#E0A030]" />
                گام ۱: هویت، نام و تبار کاراکتر
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                نام قهرمان و تصویر چهره او را مشخص کنید. تبار و نژاد، توانایی‌های سرشتی شخصیت را معین می‌کنند.
              </p>
            </div>

            {/* Character Name */}
            <div>
              <label className="block text-xs font-bold text-[#C9C0AE] mb-1.5">نام کاراکتر *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: ارسباران، سودابه، زروان‌داد..."
                className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3.5 py-2.5 text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>

            {/* Portrait Selection / Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#C9C0AE]">پرتره و چهره کاراکتر (سقف ۱۵۰ کیلوبایت)</label>
              <div className="flex items-center gap-4">
                <img
                  src={portraitUrl}
                  alt={name || 'پیش‌نمایش پرتره'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E0A030]/40 shadow-md shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPortraitUrl(url)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                          portraitUrl === url ? 'border-[#E0A030] scale-105' : 'border-[#2F2A23] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030]/40 text-xs text-[#C9C0AE] cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#E0A030]" />
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#C9C0AE]">
                    انتخاب تبار و نژاد (Lineage)
                  </label>
                  <span className="text-[11px] text-[#A39A89]">
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
                            ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-md shadow-[#E0A030]/10'
                            : 'bg-[#171513] border-[#2F2A23] hover:border-[#3A342B]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#EDE6D8]">{lin.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89]">
                            سرعت: {lin.speed} فوت
                          </span>
                        </div>
                        <p className="text-xs text-[#A39A89] mt-1.5 line-clamp-2">
                          {lin.description || 'تبار کهن فلات و مرزهای زروانیا.'}
                        </p>
                        {lin.abilityBonuses && (
                          <div className="mt-2 text-[11px] text-[#F2C265] font-semibold">
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
              <div className="rounded-xl p-3 bg-[#171513] border border-[#2F2A23] text-xs text-[#A39A89] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#E0A030]" />
                <span>این کمپین نژاد ویژه‌ای تعریف نکرده است؛ نژاد استاندارد «آدمی (Human)» اعمال خواهد شد.</span>
              </div>
            )}

            {/* Appearance notes */}
            <div>
              <label className="block text-xs font-bold text-[#C9C0AE] mb-1.5">ویژگی‌های ظاهری و پوشش</label>
              <textarea
                value={appearance}
                onChange={e => setAppearance(e.target.value)}
                placeholder="قد، رنگ مو و چشمان، زخم‌های کهنه، نوع جامه یا زره..."
                rows={2}
                className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3.5 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 2: CLASS SELECTION & COMPARE SHEET                      */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#2F2A23] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                  <Swords className="w-5 h-5 text-[#E0A030]" />
                  گام ۲: کلاس بازی (Class)
                </h3>
                <p className="text-xs text-[#A39A89] mt-1">
                  کلاس، نقش رزمی، نحوه بقا و ویژگی‌های جادویی شما را تعیین می‌کند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClassCompare(true)}
                className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-all flex items-center gap-1.5 min-h-[36px]"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>مقایسه کلاس‌ها</span>
              </button>
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
                        ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-lg shadow-[#E0A030]/10 scale-[1.01]'
                        : 'bg-[#171513] border-[#2F2A23] hover:border-[#3A342B]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-[#EDE6D8]">{cls.name}</h4>
                          <span className="text-[11px] text-[#F2C265]">{cls.title || ''}</span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE] font-mono">
                          Hit Die: {cls.hitDie || 'd8'}
                        </span>
                      </div>
                      <p className="text-xs text-[#A39A89] mt-2 line-clamp-3 leading-relaxed">
                        {cls.description || cls.notes || 'کلاس اختصاصی در دنیای زروانیا.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#2F2A23] flex items-center justify-between text-[11px] text-[#8A8374]">
                      <span>پرتاب نجات: {(cls.saves || []).join('، ')}</span>
                      <span className="text-[#E0A030] font-semibold">
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
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <Dice5 className="w-5 h-5 text-[#E0A030]" />
                گام ۳: ویژگی‌های پایه (Ability Scores)
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                روش تعیین امتیازات خود را انتخاب کرده و امتیازات را تخصیص دهید.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allowedAbilityMethods.map(m => {
                const labels: Record<AbilityMethod, string> = {
                  standard_array: 'آرایه استاندارد',
                  point_buy: 'خرید امتیاز (Point Buy)',
                  roll: 'پرتاب تاس (۴d۶ سرور)',
                  class_base: 'پایه کلاس',
                  manual: 'دستی'
                };
                const isSelected = abilityMethod === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAbilityMethod(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[36px] ${
                      isSelected
                        ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                        : 'bg-[#171513] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
                    }`}
                  >
                    {labels[m] || m}
                  </button>
                );
              })}
            </div>

            {/* Point Buy Budget Live Display */}
            {abilityMethod === 'point_buy' && (
              <div className="p-3.5 rounded-2xl bg-[#171513] border border-[#E0A030]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#A39A89]">بودجه مصرف‌شده:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-lg font-bold ${currentPointBuyCost > 27 ? 'text-[#D66138]' : 'text-[#F2C265]'}`}>
                      {currentPointBuyCost}
                    </span>
                    <span className="text-xs text-[#8A8374]">/ ۲۷ امتیاز</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#A39A89] text-left">
                  امتیاز ۸ تا ۱۵ مجاز است.
                </div>
              </div>
            )}

            {/* Roll Server-Side 4d6 Drop Lowest */}
            {abilityMethod === 'roll' && (
              <div className="p-4 rounded-2xl bg-[#171513] border border-[#2F2A23] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#EDE6D8]">تاس‌های ریخته‌شده سرور:</span>
                  <button
                    type="button"
                    onClick={handleRollAbilities}
                    disabled={isRolling}
                    className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>ریختن تاس جدید (۴d۶)</span>
                  </button>
                </div>

                {serverRolls ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                    {serverRolls.scores.map((score, i) => (
                      <div key={i} className="p-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                        <span className="text-base font-bold text-[#F2C265]">{score}</span>
                        <span className="block text-[10px] text-[#8A8374]">
                          {serverRolls.dice[i]?.join('+')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#A39A89]">هنوز تاسی ریخته نشده است. دکمه بالا را بزنید.</p>
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
                    className="p-3.5 rounded-2xl bg-[#171513] border border-[#2F2A23] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#EDE6D8]">{ABILITY_LABELS_FA[key]}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-[#F2C265] font-mono">{finalVal}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#201D19] text-[#6F9E78] font-bold font-mono">
                          {modStr}
                        </span>
                        {finalVal > baseVal && (
                          <span className="text-[10px] text-[#E0A030] font-medium">
                            (+{finalVal - baseVal} تبار)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Editor controls */}
                    {abilityMethod === 'point_buy' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (baseVal > 8) {
                              setPointBuyScores(prev => ({ ...prev, [key]: baseVal - 1 }));
                            }
                          }}
                          disabled={baseVal <= 8}
                          className="w-7 h-7 rounded-lg bg-[#201D19] text-[#EDE6D8] disabled:opacity-30 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">{baseVal}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (baseVal < 15) {
                              setPointBuyScores(prev => ({ ...prev, [key]: baseVal + 1 }));
                            }
                          }}
                          disabled={baseVal >= 15}
                          className="w-7 h-7 rounded-lg bg-[#201D19] text-[#EDE6D8] disabled:opacity-30 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {abilityMethod === 'standard_array' && (
                      <select
                        value={baseVal}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setBaseScores(prev => ({ ...prev, [key]: val }));
                        }}
                        className="bg-[#201D19] border border-[#2F2A23] text-xs font-mono text-[#F2C265] rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {STANDARD_ARRAY.map(score => (
                          <option key={score} value={score}>{score}</option>
                        ))}
                      </select>
                    )}

                    {abilityMethod === 'manual' && (
                      <input
                        type="number"
                        min={3}
                        max={18}
                        value={baseVal}
                        onChange={e => {
                          const val = Math.max(3, Math.min(18, parseInt(e.target.value, 10) || 10));
                          setBaseScores(prev => ({ ...prev, [key]: val }));
                        }}
                        className="w-14 bg-[#201D19] border border-[#2F2A23] text-xs font-mono text-[#F2C265] rounded-lg px-2 py-1 text-center"
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
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#E0A030]" />
                گام ۴: پیشینه و مهارت‌ها (Background & Skills)
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                پیشینه، زندگی قبل از ماجراجویی شماست. مهارت‌ها با برچسب منبع مشخص می‌شوند.
              </p>
            </div>

            {/* Background selection */}
            {availableBackgrounds.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#C9C0AE]">انتخاب پیشینه (Background)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableBackgrounds.map(bg => {
                    const isSelected = selectedBackgroundId === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setSelectedBackgroundId(bg.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-md shadow-[#E0A030]/10'
                            : 'bg-[#171513] border-[#2F2A23] hover:border-[#3A342B]'
                        }`}
                      >
                        <h4 className="text-sm font-bold text-[#EDE6D8]">{bg.name}</h4>
                        <p className="text-xs text-[#A39A89] mt-1 line-clamp-2">{bg.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(bg.skillProficiencies || []).map(sk => (
                            <span key={sk} className="text-[10px] px-2 py-0.5 rounded-md bg-[#201D19] text-[#F2C265]">
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#C9C0AE]">
                  انتخاب مهارت‌های کلاس ({selectedClassSkills.length} از {activeClass?.skillChoices?.count || 2} مورد)
                </label>
                <span className="text-[11px] text-[#A39A89]">
                  مجاز: {(activeClass?.skillChoices?.options || []).join('، ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(activeClass?.skillChoices?.options || []).map(opt => {
                  const lower = opt.toLowerCase();
                  const isChecked = selectedClassSkills.includes(lower);
                  return (
                    <button
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
                      className={`p-2.5 rounded-xl border text-xs font-medium text-right transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#E0A030]/20 border-[#E0A030] text-[#F2C265]'
                          : 'bg-[#171513] border-[#2F2A23] text-[#C9C0AE] hover:border-[#3A342B]'
                      }`}
                    >
                      <span>{opt}</span>
                      <span className="text-[10px] opacity-70">[کلاس]</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* All Active Proficiencies with Tags */}
            <div className="p-4 rounded-2xl bg-[#171513] border border-[#2F2A23] space-y-2">
              <h4 className="text-xs font-bold text-[#EDE6D8]">مهارت‌های فعال کاراکتر و منابع آن‌ها:</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {skillValidation.taggedProficiencies.map(tp => {
                  const badgeColors: Record<TaggedProficiency['source'], string> = {
                    class: 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]/40',
                    background: 'bg-[#9B72CF]/20 text-[#9B72CF] border-[#9B72CF]/40',
                    lineage: 'bg-[#6F9E78]/20 text-[#6F9E78] border-[#6F9E78]/40'
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
                      <span className="text-[10px] opacity-80 font-bold">[{sourceLabels[tp.source]}]</span>
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
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E0A030]" />
                گام ۵: تجهیزات و اسلحه آغازین (Equipment)
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                سلاح آغازین و تجهیزات رزمی خود را تعیین کنید. پیش‌نمایش زنده‌ی زره (AC) و جان در پایین مشخص است.
              </p>
            </div>

            {/* Live Stats Preview Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#171513] border border-[#2F2A23] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#E0A030]" />
                  <span className="text-xs text-[#A39A89]">درجه زره (AC پیش‌نمایش):</span>
                </div>
                <span className="text-lg font-bold text-[#F2C265] font-mono">{liveAc}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#171513] border border-[#2F2A23] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#D66138]" />
                  <span className="text-xs text-[#A39A89]">جان اولیه (Max HP):</span>
                </div>
                <span className="text-lg font-bold text-[#EDE6D8] font-mono">{liveHp}</span>
              </div>
            </div>

            {/* Special-vs-Showy Starter Weapon Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#C9C0AE]">
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
                          ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-md shadow-[#E0A030]/10'
                          : 'bg-[#171513] border-[#2F2A23] hover:border-[#3A342B]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#EDE6D8]">{w.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            w.kind === 'special' ? 'bg-[#9B72CF]/20 text-[#9B72CF]' : 'bg-[#E0A030]/20 text-[#F2C265]'
                          }`}>
                            {w.kind === 'special' ? 'سلاح ویژه (جادویی)' : 'سلاح نمایشی (باوقار)'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[#8A8374] font-mono">
                          آسیب: {w.damageDice} ({w.damageType})
                        </div>
                        <p className="text-xs text-[#A39A89] mt-2 leading-relaxed">
                          {w.tradeoffFa}
                        </p>
                      </div>

                      {w.specialAbility && (
                        <div className="mt-3 pt-2 border-t border-[#2F2A23] text-[11px] text-[#9B72CF]">
                          ⚡ {w.specialAbility.name}: {w.specialAbility.description}
                        </div>
                      )}
                      {w.showyBonus && (
                        <div className="mt-3 pt-2 border-t border-[#2F2A23] text-[11px] text-[#F2C265]">
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
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#E0A030]" />
                گام ۶: وردها و جادوها (Spellcasting)
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                ترفندهای جادویی آغازین (Cantrips) و اسپل‌های آماده شده را تعیین کنید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#171513] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8]">اسلات‌های جادویی سطح ۱:</span>
              <div className="flex items-center gap-2 pt-1 font-mono text-sm text-[#F2C265]">
                {computeSlots(activeClass?.name || '', 1).map((cnt, lvl) => (
                  <span key={lvl} className="px-3 py-1 rounded-xl bg-[#201D19] border border-[#2F2A23]">
                    اسلات سطح {lvl + 1}: {cnt} بار
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#C9C0AE]">
                ترفندهای جادویی پیشنهادی کلاس {activeClass?.name}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {((activeClass?.spellcasting as any)?.spells?.cantrips || ['شراره فره', 'لمس درمان', 'نور']).map((can: string) => (
                  <div key={can} className="p-3 rounded-xl bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8]">
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
            <div className="border-b border-[#2F2A23] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#E0A030]" />
                  گام ۷: پیش‌داستان و انگیزه‌ها (اختیاری)
                </h3>
                <p className="text-xs text-[#A39A89] mt-1">
                  می‌توانید این گام را رد کرده و بعداً در بخش پرونده شخصیت تکمیل نمایید.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C9C0AE] mb-1.5">خاستگاه و زادگاه</label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="روستای جنگلی ورنا، بارگاه پادشاهی، بیابان‌های هامون..."
                className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3.5 py-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C9C0AE] mb-1.5">اهداف و آرمان‌ها</label>
              <input
                type="text"
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="یافتن برادر گم‌شده، کشف کتابچه باستانی زروان..."
                className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3.5 py-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C9C0AE] mb-1.5">خلاصه پیش‌داستان</label>
              <textarea
                value={backstorySummary}
                onChange={e => setBackstorySummary(e.target.value)}
                rows={3}
                placeholder="داستان سفر قهرمان به آستانه کمپین..."
                className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3.5 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 8: REVIEW & SUBMIT                                      */}
        {/* ============================================================ */}
        {currentStep === 8 && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-[#2F2A23] pb-3">
              <h3 className="text-lg font-bold text-[#F2C265] flex items-center gap-2">
                <Check className="w-5 h-5 text-[#6F9E78]" />
                گام ۸: بازبینی نهایی و تایید (Review & Submit)
              </h3>
              <p className="text-xs text-[#A39A89] mt-1">
                اطلاعات شناسنامه و مقادیر بازتولید شده توسط موتور قوانین را بررسی کنید.
              </p>
            </div>

            {/* Character Summary Card */}
            <div className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/30 shadow-lg space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={portraitUrl}
                  alt={name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E0A030]/40 shrink-0"
                />
                <div>
                  <h4 className="text-lg font-bold text-[#EDE6D8]">{name || 'بی‌نام'}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#F2C265]">
                    <span>کلاس: {activeClass?.name}</span>
                    <span>•</span>
                    <span>تبار: {activeLineage?.name || 'آدمی'}</span>
                    <span>•</span>
                    <span>پیشینه: {activeBackground?.name || 'ساده'}</span>
                  </div>
                </div>
              </div>

              {/* Combat preview strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2F2A23]">
                <div className="text-center p-2 rounded-xl bg-[#201D19]">
                  <span className="block text-[10px] text-[#A39A89]">درجه زره (AC)</span>
                  <span className="text-base font-bold text-[#F2C265] font-mono">{liveAc}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-[#201D19]">
                  <span className="block text-[10px] text-[#A39A89]">بیشینه جان (HP)</span>
                  <span className="text-base font-bold text-[#EDE6D8] font-mono">{liveHp}</span>
                </div>
                <div className="text-center p-2 rounded-xl bg-[#201D19]">
                  <span className="block text-[10px] text-[#A39A89]">ابتکار عمل</span>
                  <span className="text-base font-bold text-[#6F9E78] font-mono">
                    {abilityModifier(finalAbilities.dex || 10) >= 0 ? `+${abilityModifier(finalAbilities.dex || 10)}` : abilityModifier(finalAbilities.dex || 10)}
                  </span>
                </div>
              </div>

              {/* Ability Scores Review */}
              <div className="grid grid-cols-6 gap-1.5 pt-2 text-center">
                {ABILITY_KEYS.map(k => (
                  <div key={k} className="p-1.5 rounded-lg bg-[#201D19] border border-[#2F2A23]">
                    <span className="block text-[9px] text-[#8A8374] uppercase">{k}</span>
                    <span className="text-xs font-bold text-[#EDE6D8] font-mono">{finalAbilities[k]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status notice */}
            <div className="p-3.5 rounded-2xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] space-y-1">
              <span className="font-bold text-[#C9C0AE]">وضعیت پس از ثبت:</span>
              <p>
                {campaign.settings?.approval?.onCreate
                  ? 'کمپین نیازمند تأیید دانجن مستر است. کاراکتر در صف تأیید قرار خواهد گرفت.'
                  : 'کمپین ورود مستقیم دارد. کاراکتر بلافاصله در کمپین فعال می‌شود.'}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. Sticky Bottom Action Bar                                   */}
      {/* ------------------------------------------------------------- */}
      <footer className="shrink-0 bg-[#171513] border-t border-[#2F2A23] px-4 py-3 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#C9C0AE] hover:text-[#EDE6D8] disabled:opacity-40 transition-all flex items-center gap-1 min-h-[44px]"
          >
            <ChevronRight className="w-4 h-4" />
            <span>قبلی</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-3.5 py-2.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030]/50 text-xs font-bold text-[#E0A030] transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره و ادامه بعداً</span>
          </button>

          {/* Next / Submit button */}
          {currentStep < 8 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-all flex items-center gap-1 min-h-[44px] shadow-lg shadow-[#E0A030]/20"
            >
              <span>گام بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#6F9E78] text-[#0E0D0C] text-xs font-bold hover:bg-[#85B88E] transition-all flex items-center gap-1.5 min-h-[44px] shadow-lg shadow-[#6F9E78]/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'تایید نهایی و آفرینش'}</span>
            </button>
          )}
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* Class Compare Sheet Modal                                     */}
      {/* ------------------------------------------------------------- */}
      {showClassCompare && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171513] border border-[#2F2A23] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-right shadow-2xl" dir="rtl">
            <div className="p-4 border-b border-[#2F2A23] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>مقایسه کلاس‌های مجاز کمپین</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClassCompare(false)}
                className="w-8 h-8 rounded-xl bg-[#201D19] text-[#A39A89] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {allowedClasses.map(cls => (
                <div key={cls.id || cls.name} className="p-3.5 rounded-2xl bg-[#141210] border border-[#2F2A23]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#EDE6D8]">{cls.name}</h4>
                    <span className="text-xs text-[#F2C265] font-mono">تاس جان: {cls.hitDie}</span>
                  </div>
                  <p className="text-xs text-[#A39A89] mt-1 line-clamp-2">{cls.description || cls.notes}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8A8374]">
                    <span>سیوها: {(cls.saves || []).join('، ')}</span>
                    <span>•</span>
                    <span>زره: {cls.armorProf || 'متنوع'}</span>
                    <span>•</span>
                    <span>نوع جادو: {cls.spellcasting ? cls.spellcasting.ability : 'بدون جادو'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
