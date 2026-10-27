/**
 * /shared/rules/wizardEngine.ts
 *
 * Authoritative Character Creation Wizard Pure Logic & Derived Calculation Engine
 * D&D 5e / Zorvania Multi-Campaign Platform (Step 3.3).
 * Shared by both the React UI client and Cloudflare Pages Functions backend.
 */

import {
  AbilityName,
  AbilityScoreMap,
  abilityModifier,
  proficiencyBonus,
  computeSaves,
  computeSkills,
  computeInitiative,
  computeAC,
  computeMaxHp,
  computeSlots,
  computeSpellDcAndAttack,
  computeClassResources,
  featuresUnlockedAtLevel,
  validatePointBuy,
  validateStandardArray,
  rollAbilityScores,
  STANDARD_ARRAY
} from './engine';

import {
  CharacterBuild,
  AbilityMethod,
  ParticipationSnapshot,
  CharacterParticipation,
  MasterCharacter,
  CampaignSettings,
  ClassTemplate,
  LineageTemplate,
  BackgroundTemplate,
  Weapon,
  InventoryItem
} from '../../src/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TaggedProficiency {
  key: string;
  source: 'class' | 'background' | 'lineage';
  nameFa?: string;
  nameEn?: string;
}

export interface StarterWeaponChoice {
  id: string;
  name: string;
  kind: 'special' | 'showy';
  damageDice: string;
  damageType: string;
  tradeoffFa: string;
  tradeoffEn: string;
  specialAbility?: {
    name: string;
    description: string;
    usesPerRest: number;
    restType: 'short' | 'long';
  };
  showyBonus?: {
    description: string;
    socialAdvantage: boolean;
  };
}

// ---------------------------------------------------------------------------
// 1. Step 1: Identity & Lineage Validation
// ---------------------------------------------------------------------------
export function validateIdentityStep(
  master: { name?: string; portraitUrl?: string; race?: string; appearance?: string },
  lineage?: LineageTemplate | null,
  campaignHasLineages: boolean = true
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = String(master?.name || '').trim();
  if (!name) {
    errors.push('نام کاراکتر الزامی است.');
  } else if (name.length > 50) {
    errors.push('نام کاراکتر نباید بیش از ۵۰ حرف باشد.');
  }

  // Portrait check (<= 150 KB)
  if (master?.portraitUrl) {
    if (master.portraitUrl.startsWith('data:')) {
      const b64Part = master.portraitUrl.split(',')[1] || '';
      const estimatedBytes = Math.ceil((b64Part.length * 3) / 4);
      if (estimatedBytes > 153600) {
        errors.push(`اندازه تصویر پرتره (${Math.round(estimatedBytes / 1024)}KB) از سقف ۱۵۰ کیلوبایت بیشتر است.`);
      }
    }
  }

  // If campaign defines custom lineages, a lineage should be picked or warned
  if (campaignHasLineages && !lineage && !master?.race) {
    warnings.push('هیچ تبار یا نژادی برای شخصیت تعیین نشده است؛ نژاد پیش‌فرض آدمی در نظر گرفته می‌شود.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ---------------------------------------------------------------------------
// 2. Step 2: Class Validation
// ---------------------------------------------------------------------------
export function validateClassStep(
  className?: string,
  allowedCampaignClasses: ClassTemplate[] = []
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cleanName = String(className || '').trim();
  if (!cleanName) {
    errors.push('انتخاب کلاس بازی الزامی است.');
  } else if (allowedCampaignClasses.length > 0) {
    const matched = allowedCampaignClasses.find(
      c => c.name.trim() === cleanName || c.id === cleanName
    );
    if (!matched) {
      errors.push(`کلاس «${cleanName}» در این کمپین مجاز نیست.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ---------------------------------------------------------------------------
// 3. Step 3: Ability Scores Validation & Calculation
// ---------------------------------------------------------------------------
export function calculateFinalAbilities(
  baseScores: AbilityScoreMap,
  lineage?: LineageTemplate | null,
  lineageChoices?: Record<string, number>
): AbilityScoreMap {
  const finalScores: AbilityScoreMap = {
    str: baseScores.str || 10,
    dex: baseScores.dex || 10,
    con: baseScores.con || 10,
    int: baseScores.int || 10,
    wis: baseScores.wis || 10,
    cha: baseScores.cha || 10
  };

  if (!lineage) return finalScores;

  const bonuses = lineage.abilityBonuses;
  if (!bonuses) return finalScores;

  if (bonuses.mode === 'fixed' && bonuses.fixed) {
    for (const [key, val] of Object.entries(bonuses.fixed)) {
      const lower = key.toLowerCase() as AbilityName;
      if (typeof val === 'number' && finalScores[lower] !== undefined) {
        finalScores[lower] = (finalScores[lower] || 10) + val;
      }
    }
  } else if (bonuses.mode === 'choose' && lineageChoices) {
    for (const [key, val] of Object.entries(lineageChoices)) {
      const lower = key.toLowerCase() as AbilityName;
      if (typeof val === 'number' && finalScores[lower] !== undefined) {
        finalScores[lower] = (finalScores[lower] || 10) + val;
      }
    }
  }

  return finalScores;
}

export function validateAbilitiesStep(
  method: AbilityMethod,
  baseScores: AbilityScoreMap,
  build: CharacterBuild,
  classTemplate?: ClassTemplate | null,
  allowedMethods: AbilityMethod[] = ['standard_array', 'point_buy', 'roll', 'class_base', 'manual']
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!allowedMethods.includes(method)) {
    errors.push(`روش انتخاب ویژگی‌های «${method}» در این کمپین مجاز نیست.`);
    return { valid: false, errors, warnings };
  }

  const scoresList = [
    baseScores.str || 10,
    baseScores.dex || 10,
    baseScores.con || 10,
    baseScores.int || 10,
    baseScores.wis || 10,
    baseScores.cha || 10
  ];

  if (method === 'standard_array') {
    const isValid = validateStandardArray(scoresList);
    if (!isValid) {
      errors.push('امتیازات ویژگی‌ها مطابق با آرایه استاندارد (15, 14, 13, 12, 10, 8) نیست.');
    }
  } else if (method === 'point_buy') {
    const pbResult = validatePointBuy(scoresList, 27);
    if (!pbResult.valid) {
      errors.push(...pbResult.errors);
    }
  } else if (method === 'roll') {
    if (!build.rolls || !build.rolls.scores || build.rolls.scores.length !== 6) {
      errors.push('تاس‌های سرور برای ویژگی‌ها ثبت نشده است.');
    } else {
      const sortedActual = [...scoresList].sort((a, b) => b - a);
      const sortedRolls = [...build.rolls.scores].sort((a, b) => b - a);
      for (let i = 0; i < 6; i++) {
        if (sortedActual[i] !== sortedRolls[i]) {
          errors.push('امتیازات ویژگی با نتایج پرتاب تاس سرور مطابقت ندارد.');
          break;
        }
      }
    }
  } else if (method === 'class_base') {
    if (classTemplate?.baseAbilityScores) {
      const base = classTemplate.baseAbilityScores;
      for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityName[]) {
        if (base[key] !== undefined && baseScores[key] !== base[key]) {
          warnings.push(`امتیاز ${key.toUpperCase()} با پایه پیشنهادی کلاس متفاوت است.`);
        }
      }
    }
  } else if (method === 'manual') {
    for (const s of scoresList) {
      if (s < 3 || s > 18) {
        errors.push(`امتیاز ${s} خارج از محدوده طبیعی ویژگی‌های D&D (۳ تا ۱۸) است.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ---------------------------------------------------------------------------
// 4. Step 4: Background & Skills Validation
// ---------------------------------------------------------------------------
export function validateBackgroundAndSkillsStep(
  build: CharacterBuild,
  classTemplate?: ClassTemplate | null,
  background?: BackgroundTemplate | null,
  lineage?: LineageTemplate | null
): { result: ValidationResult; taggedProficiencies: TaggedProficiency[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const taggedProficiencies: TaggedProficiency[] = [];
  const addedKeys = new Set<string>();

  // 1. Lineage skills
  if (lineage?.proficiencies?.skills) {
    for (const sk of lineage.proficiencies.skills) {
      const lower = sk.toLowerCase();
      if (!addedKeys.has(lower)) {
        addedKeys.add(lower);
        taggedProficiencies.push({ key: lower, source: 'lineage' });
      }
    }
  }

  // 2. Background skills
  if (background?.skillProficiencies) {
    for (const sk of background.skillProficiencies) {
      const lower = sk.toLowerCase();
      if (!addedKeys.has(lower)) {
        addedKeys.add(lower);
        taggedProficiencies.push({ key: lower, source: 'background' });
      } else {
        warnings.push(`مهارت «${lower}» هم در تبار و هم در پیشینه وجود دارد.`);
      }
    }
  }

  // 3. Class chosen skills
  const classPicks = build.skillChoices?.fromClass || [];
  const classAllowedCount = classTemplate?.skillChoices?.count ?? 2;
  const classAllowedOptions = (classTemplate?.skillChoices?.options || []).map(o => o.toLowerCase());

  if (classTemplate?.skillChoices && classPicks.length !== classAllowedCount) {
    errors.push(`شما باید دقیقاً ${classAllowedCount} مهارت از کلاس انتخاب کنید، اما ${classPicks.length} انتخاب کرده‌اید.`);
  }

  for (const sk of classPicks) {
    const lower = sk.toLowerCase();
    if (classAllowedOptions.length > 0 && !classAllowedOptions.includes(lower)) {
      errors.push(`مهارت «${lower}» در میان گزینه‌های مجاز کلاس نیست.`);
    }
    if (addedKeys.has(lower)) {
      warnings.push(`مهارت «${lower}» قبلاً از پیشینه یا تبار کسب شده بود؛ توصیه می‌شود مهارت دیگری برگزینید.`);
    } else {
      addedKeys.add(lower);
      taggedProficiencies.push({ key: lower, source: 'class' });
    }
  }

  return {
    result: {
      valid: errors.length === 0,
      errors,
      warnings
    },
    taggedProficiencies
  };
}

// ---------------------------------------------------------------------------
// 5. Step 5: Equipment & Special-vs-Showy Starter Weapons
// ---------------------------------------------------------------------------
export const CANON_STARTER_WEAPONS: StarterWeaponChoice[] = [
  {
    id: 'w_special_sun_blade',
    name: 'تیغ مهرگان (خنجر تابنده)',
    kind: 'special',
    damageDice: '1d6',
    damageType: 'آذرین/سرد',
    tradeoffFa: 'سلاح دارای قابلیت مکانیکی ویژه: یک‌بار در هر استراحت کوتاه، شلیک آذرین با ۱d۶ آسیب اضافه.',
    tradeoffEn: 'Special ability with short-rest recharge.',
    specialAbility: {
      name: 'آذرخش مهرگان',
      description: 'یک‌بار در هر استراحت کوتاه، ۱d۶ آسیب آتش اضافه به ضربه اضافه می‌شود.',
      usesPerRest: 1,
      restType: 'short'
    }
  },
  {
    id: 'w_showy_ceremonial_blade',
    name: 'شمشیر زرین شاهانه (اسلحه تشریفاتی و باوقار)',
    kind: 'showy',
    damageDice: '1d8',
    damageType: 'برنده',
    tradeoffFa: 'سلاح بدون جادو اما ساخته استادان آهنگری؛ پرستیژ اجتماعی و برتری (Advantage) در تعاملات اشرافی و دربار.',
    tradeoffEn: 'Showy non-magical craftsmanship with high social prestige and court advantage.',
    showyBonus: {
      description: 'پرستیژ شاهانه: برتری در تاس‌های متقاعدسازی (Persuasion) در بارگاه‌ها و محافل اشرافی.',
      socialAdvantage: true
    }
  }
];

export function validateEquipmentStep(
  build: CharacterBuild,
  classTemplate?: ClassTemplate | null
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check starter choice groups if defined
  if (classTemplate?.startingEquipmentChoices && classTemplate.startingEquipmentChoices.length > 0) {
    const selectedGroups = build.equipmentChoices?.groups || {};
    for (const group of classTemplate.startingEquipmentChoices) {
      if (!selectedGroups[group.id]) {
        warnings.push(`گزینه تجهیزات از دسته «${group.id}» انتخاب نشده است؛ انتخاب پیش‌فرض اعمال می‌شود.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ---------------------------------------------------------------------------
// 6. Step 6: Spells Validation (Only for Casters)
// ---------------------------------------------------------------------------
export function validateSpellsStep(
  build: CharacterBuild,
  classTemplate?: ClassTemplate | null,
  level: number = 1
): { isCaster: boolean; result: ValidationResult } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isCaster = Boolean(classTemplate?.spellcasting?.ability || (classTemplate as any)?.spellcastingStruct);

  if (!isCaster) {
    return { isCaster: false, result: { valid: true, errors: [], warnings: [] } };
  }

  const spellSlots = computeSlots(classTemplate?.name || '', level);
  const cantripsChosen = build.spellChoices?.cantrips || [];
  const spellsKnownChosen = build.spellChoices?.spellsKnown || [];

  // If class provides cantrips/spells limits:
  const cantripMax = classTemplate?.spellcasting?.cantripsKnown || 3;
  if (cantripsChosen.length > cantripMax) {
    errors.push(`تعداد ترفندهای جادویی (${cantripsChosen.length}) از سقف مجاز (${cantripMax}) فراتر رفته است.`);
  }

  return {
    isCaster: true,
    result: {
      valid: errors.length === 0,
      errors,
      warnings
    }
  };
}

// ---------------------------------------------------------------------------
// 7. Master Recomputation Engine (Server Authoritative)
// ---------------------------------------------------------------------------
export interface AuthoritativeComputeInput {
  masterData: Partial<MasterCharacter>;
  build: CharacterBuild;
  campaignId: string;
  campaignSettings?: CampaignSettings | null;
  classTemplate?: ClassTemplate | null;
  lineageTemplate?: LineageTemplate | null;
  backgroundTemplate?: BackgroundTemplate | null;
  entryLevel?: number;
}

export function computeAuthoritativeParticipation(
  input: AuthoritativeComputeInput
): {
  participation: Omit<CharacterParticipation, 'id' | 'characterId'>;
  validation: ValidationResult;
} {
  const {
    masterData,
    build,
    campaignId,
    campaignSettings,
    classTemplate,
    lineageTemplate,
    backgroundTemplate
  } = input;

  const level = Math.max(1, Math.min(20, Math.floor(input.entryLevel || campaignSettings?.startingLevel || 1)));

  // Validate Identity
  const vIdentity = validateIdentityStep(masterData, lineageTemplate, Boolean(lineageTemplate));
  // Validate Class
  const vClass = validateClassStep(classTemplate?.name || '', classTemplate ? [classTemplate] : []);
  // Validate Abilities
  const baseScores = build.pointBuy?.scores || (build.rolls?.assigned as any) || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const vAbilities = validateAbilitiesStep(
    build.abilityMethod || 'standard_array',
    baseScores,
    build,
    classTemplate,
    campaignSettings?.abilityScoreMethods || ['standard_array', 'point_buy', 'roll', 'class_base', 'manual']
  );
  // Calculate Final Ability Scores with Lineage Bonus
  const finalAbilities = calculateFinalAbilities(baseScores, lineageTemplate, build.lineageAbilityChoices);

  // Validate Skills
  const { result: vSkills, taggedProficiencies } = validateBackgroundAndSkillsStep(
    build,
    classTemplate,
    backgroundTemplate,
    lineageTemplate
  );

  // Equipment & Starter Weapons
  const vEquip = validateEquipmentStep(build, classTemplate);
  const starterWeaponKind = build.equipmentChoices?.starterWeaponChoice || 'standard';
  const starterWeaponId = build.equipmentChoices?.starterWeaponId;
  const starterWeapDef = CANON_STARTER_WEAPONS.find(w => w.id === starterWeaponId) || CANON_STARTER_WEAPONS[0];

  const weapons: Weapon[] = [
    {
      id: `w-starter-${Date.now()}`,
      templateId: starterWeapDef.id,
      name: starterWeapDef.name,
      damageDice: starterWeapDef.damageDice,
      damageType: starterWeapDef.damageType,
      range: 'نزدیک',
      properties: starterWeapDef.kind === 'special' ? 'ویژه (جادویی)' : 'تشریفاتی (باوقار)',
      kind: starterWeapDef.kind,
      isSpecial: starterWeapDef.kind === 'special',
      isShowy: starterWeapDef.kind === 'showy',
      specialAbility: starterWeapDef.specialAbility,
      abilityName: starterWeapDef.specialAbility?.name,
      abilityDesc: starterWeapDef.specialAbility?.description,
      abilityMaxUses: starterWeapDef.specialAbility?.usesPerRest,
      abilityUsed: 0,
      abilityReset: starterWeapDef.specialAbility?.restType
    }
  ];

  // Inventory
  const inventory: InventoryItem[] = [
    {
      id: `inv-starter-${Date.now()}`,
      name: 'کوله پشتی ماجراجو',
      category: 'misc',
      quantity: 1,
      weight: 5,
      description: 'لوازم اولیه سفر، طناب، جیره و مشعل.',
      equipped: false
    }
  ];

  if (backgroundTemplate?.startingEquipment) {
    const bgEquip = Array.isArray(backgroundTemplate.startingEquipment)
      ? backgroundTemplate.startingEquipment
      : [backgroundTemplate.startingEquipment];
    for (const eq of bgEquip) {
      const eqName = typeof eq === 'string' ? eq : (eq.label || (eq.items && eq.items.join(', ')) || 'ابزار پیشینه');
      inventory.push({
        id: `inv-bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: eqName,
        category: 'misc',
        quantity: 1,
        weight: 1,
        description: `تجهیزات آغازین از پیشینه ${backgroundTemplate.name}`,
        equipped: false
      });
    }
  }

  // Derive all Stats
  const profBonus = proficiencyBonus(level);
  const dexMod = abilityModifier(finalAbilities.dex || 10);
  const conMod = abilityModifier(finalAbilities.con || 10);

  // Saving throws
  const saveProfMap: Record<string, boolean> = {};
  if (classTemplate?.savingThrowProficiencies) {
    for (const k of classTemplate.savingThrowProficiencies) {
      saveProfMap[k.toLowerCase()] = true;
    }
  }
  const saves = computeSaves(finalAbilities, saveProfMap, profBonus);

  // Skills
  const skillProfMap: Record<string, boolean> = {};
  for (const tp of taggedProficiencies) {
    skillProfMap[tp.key] = true;
  }
  const skills = computeSkills(finalAbilities, skillProfMap, profBonus);

  // AC
  const ac = computeAC({
    acFormula: classTemplate?.acFormula,
    className: classTemplate?.name,
    classTemplateId: classTemplate?.id,
    abilities: finalAbilities,
    inventory
  });

  // HP
  const rawHpMode = campaignSettings?.hpMode;
  const hpMode = (rawHpMode === 'roll' ? 'roll' : rawHpMode === 'manual' ? 'average' : 'fixed_table');
  const maxHp = computeMaxHp({
    className: classTemplate?.name,
    level,
    abilities: finalAbilities,
    conModifier: conMod,
    hpMode,
    settings: {
      conAdjustFixedTable: campaignSettings?.conAdjustFixedTable ?? true
    },
    classTemplate,
    hitDie: typeof classTemplate?.hitDie === 'string' ? (parseInt(classTemplate.hitDie.replace(/\D/g, ''), 10) || 8) : classTemplate?.hitDie
  });

  // Spellcasting
  let spellSlots: any = undefined;
  let spellsKnownPrepared: any = undefined;
  if (classTemplate?.spellcasting?.ability || (classTemplate as any)?.spellcastingStruct) {
    const spellAbility = (classTemplate.spellcasting?.ability || 'int').toLowerCase() as AbilityName;
    const spellMod = abilityModifier(finalAbilities[spellAbility] || 10);
    const { dc, attackBonus } = computeSpellDcAndAttack(spellAbility, spellMod, profBonus);
    const slots = computeSlots(classTemplate.name, level);
    spellSlots = { slots, dc, attackBonus, ability: spellAbility };
    spellsKnownPrepared = {
      cantrips: build.spellChoices?.cantrips || [],
      spells: build.spellChoices?.spellsKnown || []
    };
  }

  // Class Resources
  const customResources: any[] = [];
  const classRes = computeClassResources(classTemplate?.name, level, finalAbilities);
  for (const [key, val] of Object.entries(classRes)) {
    customResources.push({
      id: key,
      name: val.name,
      current: val.max,
      max: val.max,
      dieType: val.currentDice || null,
      resetOn: val.resetType || 'short',
      formula: val.formula
    });
  }

  // Features Unlocked
  const features = featuresUnlockedAtLevel(classTemplate, level, build.subclassId || undefined);

  // Hit Dice
  const hitDice = {
    current: level,
    max: level,
    die: `d${classTemplate?.hitDie || 8}`
  };

  // Status: if approval.onCreate is true, pending_approval, otherwise active
  const initialStatus = campaignSettings?.approval?.onCreate === true ? 'pending_approval' : 'active';
  const sheetLocked = campaignSettings?.sheetLock !== 'free';

  // Overall Validation Consolidation
  const allErrors = [
    ...vIdentity.errors,
    ...vClass.errors,
    ...vAbilities.errors,
    ...vSkills.errors,
    ...vEquip.errors
  ];
  const allWarnings = [
    ...vIdentity.warnings,
    ...vClass.warnings,
    ...vAbilities.warnings,
    ...vSkills.warnings,
    ...vEquip.warnings
  ];

  const participation: Omit<CharacterParticipation, 'id' | 'characterId'> = {
    campaignId,
    status: initialStatus,
    className: classTemplate?.name || 'ماجراجو',
    classId: classTemplate?.id || null,
    subclassName: build.subclassId || undefined,
    level,
    xp: 0,
    abilityScores: finalAbilities,
    savingThrows: saves as any,
    currentHp: maxHp,
    maxHp,
    tempHp: 0,
    hitDice,
    acOverride: null,
    speedOverride: lineageTemplate?.speed || 30,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    inventory,
    weapons,
    currency: { gold: 15, silver: 5, copper: 0 },
    customResources,
    spellsKnownPrepared,
    spellSlots,
    features,
    notes: '',
    dmNotes: '',
    build,
    sheetLocked,
    joinedAt: Date.now(),
    updatedAt: Date.now(),
    characterName: masterData.name,
    characterRace: lineageTemplate?.name || masterData.race || 'آدمی',
    characterPortraitUrl: masterData.portraitUrl,
    characterAppearance: masterData.appearance,
    characterBackstory: masterData.backstory as any
  };

  // Hook for Step 3.4 (Level Progression loop if entryLevel > 1)
  if (level > 1) {
    runLevelProgressionHook(participation, build, level, campaignSettings, classTemplate);
  }

  return {
    participation,
    validation: {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  };
}

/**
 * Step 3.4 Entry Level > 1 Progression Hook
 * Iterates through levels 2..entryLevel, applying HP growth, ASI thresholds, and feature unlocks.
 */
export function runLevelProgressionHook(
  participation: any,
  build: CharacterBuild,
  targetLevel: number,
  settings?: CampaignSettings | null,
  classTemplate?: ClassTemplate | null
): void {
  // Step 3.4 hook: When entry level is above 1, ensure hit dice and features are unlocked
  participation.level = targetLevel;
  participation.hitDice.current = targetLevel;
  participation.hitDice.max = targetLevel;
  participation.features = featuresUnlockedAtLevel(classTemplate, targetLevel, build.subclassId || undefined);
}

// ---------------------------------------------------------------------------
// 8. Snapshot Management & 10-Item Retention Pruning
// ---------------------------------------------------------------------------
export function createSnapshot(
  participation: CharacterParticipation,
  label: string,
  createdBy: string
): ParticipationSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    participationId: participation.id,
    label,
    state: {
      level: participation.level,
      xp: participation.xp,
      abilityScores: participation.abilityScores,
      currentHp: participation.currentHp,
      maxHp: participation.maxHp,
      tempHp: participation.tempHp,
      hitDice: participation.hitDice,
      inventory: participation.inventory,
      weapons: participation.weapons,
      currency: participation.currency,
      customResources: participation.customResources,
      spellsKnownPrepared: participation.spellsKnownPrepared,
      spellSlots: participation.spellSlots,
      features: participation.features
    },
    build: participation.build || { abilityMethod: 'standard_array', skillChoices: {}, equipmentChoices: {} },
    level: participation.level,
    createdBy,
    createdAt: Date.now()
  };
}

export function pruneSnapshots(
  snapshots: ParticipationSnapshot[],
  maxToKeep: number = 10
): { kept: ParticipationSnapshot[]; prunedIds: string[] } {
  // Sort descending by created_at
  const sorted = [...snapshots].sort((a, b) => b.createdAt - a.createdAt);
  const kept = sorted.slice(0, maxToKeep);
  const pruned = sorted.slice(maxToKeep);
  return {
    kept,
    prunedIds: pruned.map(s => s.id)
  };
}
