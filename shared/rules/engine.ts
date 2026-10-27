/**
 * /shared/rules/engine.ts
 *
 * Core Rules Engine for DungeonYar multi-campaign D&D 5e / Zorvania platform.
 * Pure TypeScript — used by BOTH the React client and Cloudflare Pages Functions.
 */

// ---------------------------------------------------------------------------
// 1. Shared Types
// ---------------------------------------------------------------------------

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface ACFormula {
  base: number;
  abilityMods?: AbilityName[] | string[];
  unarmored?: boolean;
  maxDexMod?: number | null;
  note?: string;
}

export interface ACParams {
  acFormula?: ACFormula | string | null;
  className?: string;
  classTemplateId?: string;
  abilities: Record<string, number>;
  inventory?: Array<{
    category?: string;
    equipped?: boolean;
    acBonus?: number;
    baseAc?: number;
    armorType?: 'light' | 'medium' | 'heavy' | 'shield' | 'other' | string;
    name?: string;
  }>;
  manualOverride?: number | null;
  hasShield?: boolean;
  hasArmor?: boolean;
  armorType?: 'light' | 'medium' | 'heavy' | 'none';
}

export interface ComputeHpParams {
  className?: string;
  level: number;
  abilities?: Record<string, number>;
  conModifier?: number;
  hpMode?: 'fixed_table' | 'average' | 'roll';
  settings?: {
    conAdjustFixedTable?: boolean;
  } | null;
  classTemplate?: any;
  rolls?: number[];
  hitDie?: number;
}

export interface DeriveSheetInput {
  character: {
    name?: string;
    level: number;
    className?: string;
    classTemplateId?: string;
    subclassName?: string;
    abilities: Record<string, number>;
    savingThrows?: Record<string, boolean>;
    skills?: Array<{
      id?: string;
      key?: string;
      ability: string;
      proficient?: boolean;
      expertise?: boolean;
      bonus?: number;
      nameFa?: string;
    }>;
    ac?: number;
    acManualOverride?: number | null;
    initiativeBonus?: number;
    hp?: {
      max: number;
      current: number;
      temp: number;
    };
    inventory?: any[];
    spells?: any[];
    companions?: any[];
    customResources?: any[];
  };
  classTemplate?: any;
  ruleSet?: {
    proficiencyBonusTable?: Record<number, number>;
  } | null;
  settings?: {
    conAdjustFixedTable?: boolean;
    hpMode?: 'fixed_table' | 'average' | 'roll';
  } | null;
}

export interface DerivedSheet {
  proficiencyBonus: number;
  abilityModifiers: Record<AbilityName, number>;
  savingThrows: Record<AbilityName, { modifier: number; proficient: boolean }>;
  skills: Record<string, { modifier: number; proficient: boolean; expertise: boolean; labelFa?: string }>;
  ac: number;
  initiative: number;
  maxHp: number;
  spellcasting: {
    ability: string;
    abilityModifier: number;
    dc: number;
    attackBonus: number;
    slots: number[];
  } | null;
  classResources: Record<string, {
    name: string;
    max: number;
    current?: number;
    currentDice?: string;
    resetType?: string;
    formula?: string;
  }>;
  companion: {
    name: string;
    ac: number;
    maxHp: number;
    type?: string;
  } | null;
  martialArtsDie: string | null;
  unlockedFeatures: any[];
}

// ---------------------------------------------------------------------------
// 2. Canon Tables & Constants (Zorvania World Book)
// ---------------------------------------------------------------------------

export const FULL_CASTER_SLOTS: Record<number, number[]> = { // [1st..9th]
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export const HALF_CASTER_SLOTS: Record<number, number[]> = { // book columns "اسلات۱ / اسلات۲"
  1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3], 10: [4, 3],
  11: [4, 3], 12: [4, 3], 13: [4, 3], 14: [4, 3], 15: [4, 3], 16: [4, 3], 17: [4, 4], 18: [4, 4], 19: [4, 4], 20: [4, 4],
};

// Fixed HP total per level (book table). Increment per level after L1:
// فرهدار 8, موبد آذرین 6, دیوانزاد 8, پیمانبان 7, سایهخوان 5, مهآشنا 6
export const FIXED_HP_TABLE: Record<string, number[]> = {
  "فرهدار": [12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124, 132, 140, 148, 156, 164],
  "موبد آذرین": [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123],
  "دیوانزاد": [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163],
  "پیمانبان": [11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 95, 102, 109, 116, 123, 130, 137, 144],
  "سایهخوان": [7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87, 92, 97, 102],
  "مهآشنا": [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123],
};

// Canon Divine Smite dice per level (Zorvania book / seed.ts)
export const DIVINE_SMITE_DICE: Record<number, string> = {
  1: '0',
  2: '2d8', 3: '2d8', 4: '3d8', 5: '3d8', 6: '3d8',
  7: '4d8', 8: '4d8', 9: '4d8', 10: '4d8',
  11: '5d8', 12: '5d8', 13: '5d8', 14: '5d8',
  15: '6d8', 16: '6d8', 17: '6d8', 18: '6d8', 19: '6d8', 20: '6d8'
};

// Canon Martial Arts die per level
export const MARTIAL_ARTS_DIE_TABLE: Record<number, string> = {
  1: '1d4', 2: '1d4', 3: '1d4', 4: '1d4',
  5: '1d6', 6: '1d6', 7: '1d6', 8: '1d6', 9: '1d6', 10: '1d6',
  11: '1d8', 12: '1d8', 13: '1d8', 14: '1d8', 15: '1d8', 16: '1d8',
  17: '1d10', 18: '1d10', 19: '1d10', 20: '1d10'
};

// Canon Base CON modifiers from the world book
export const CLASS_BASE_CON_MOD: Record<string, number> = {
  "فرهدار": 2,      // CON 15 (+2) / 14 (+2)
  "موبد آذرین": 1,  // CON 13 (+1)
  "دیوانزاد": 3,    // CON 16 (+3)
  "پیمانبان": 2,    // CON 14 (+2)
  "سایهخوان": 1,    // CON 12 (+1)
  "مهآشنا": 1,      // CON 12 (+1)
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

// ---------------------------------------------------------------------------
// 3. Helper Normalizers
// ---------------------------------------------------------------------------

export function normalizeClassName(rawName?: string): string {
  if (!rawName) return '';
  // Remove parentheses and English text if present
  let clean = rawName.split('(')[0].trim();
  // Strip ZWNJ and spaces
  clean = clean.replace(/[\u200C\s]/g, '');

  if (clean.includes('فرهدار')) return 'فرهدار';
  if (clean.includes('موبد') || clean.includes('آذرین')) return 'موبد آذرین';
  if (clean.includes('دیوانزاد')) return 'دیوانزاد';
  if (clean.includes('پیمانبان')) return 'پیمانبان';
  if (clean.includes('سایهخوان')) return 'سایهخوان';
  if (clean.includes('مهآشنا')) return 'مهآشنا';

  return clean;
}

// ---------------------------------------------------------------------------
// 4. Core Math Functions
// ---------------------------------------------------------------------------

/**
 * Calculates standard D&D 5e ability modifier: floor((score - 10) / 2)
 */
export function abilityModifier(score: number): number {
  const safeScore = Number.isFinite(score) ? score : 10;
  return Math.floor((safeScore - 10) / 2);
}

/**
 * Computes proficiency bonus for a given level.
 * Falls back to standard 5e progression: Math.ceil(1 + level / 4).
 *
 * unverified against the world book
 */
export function proficiencyBonus(
  level: number,
  ruleSet?: { proficiencyBonusTable?: Record<number, number> } | null
): number {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));

  // unverified against the world book
  if (ruleSet?.proficiencyBonusTable && ruleSet.proficiencyBonusTable[safeLevel] !== undefined) {
    return ruleSet.proficiencyBonusTable[safeLevel];
  }

  // Standard 5e default
  return Math.ceil(1 + safeLevel / 4);
}

/**
 * Computes saving throw values and proficiencies.
 */
export function computeSaves(
  abilities: Record<string, number>,
  saveProficiencies: Record<string, boolean> | string[] = {},
  profBonus: number = 2
): Record<AbilityName, { modifier: number; proficient: boolean }> {
  const keys: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const result: any = {};

  const isProf = (key: string): boolean => {
    if (Array.isArray(saveProficiencies)) {
      const lowerArr = saveProficiencies.map(k => String(k).toLowerCase());
      return lowerArr.includes(key.toLowerCase());
    }
    return Boolean(saveProficiencies[key] || saveProficiencies[key.toUpperCase()]);
  };

  for (const k of keys) {
    const score = abilities[k] ?? abilities[k.toUpperCase()] ?? 10;
    const baseMod = abilityModifier(score);
    const proficient = isProf(k);
    result[k] = {
      modifier: baseMod + (proficient ? profBonus : 0),
      proficient
    };
  }

  return result;
}

/**
 * Computes skill modifiers handling normal proficiency, expertise, and custom bonuses.
 */
export function computeSkills(
  abilities: Record<string, number>,
  skills: Array<{
    id?: string;
    key?: string;
    ability: string;
    proficient?: boolean;
    expertise?: boolean;
    bonus?: number;
    nameFa?: string;
  }> = [],
  profBonus: number = 2
): Record<string, { modifier: number; proficient: boolean; expertise: boolean; labelFa?: string }> {
  const result: Record<string, { modifier: number; proficient: boolean; expertise: boolean; labelFa?: string }> = {};

  for (const s of skills) {
    const key = (s.key || s.id || '').toLowerCase();
    if (!key) continue;

    const abilityKey = (s.ability || 'str').toLowerCase();
    const score = abilities[abilityKey] ?? abilities[abilityKey.toUpperCase()] ?? 10;
    const baseMod = abilityModifier(score);

    const proficient = Boolean(s.proficient);
    const expertise = Boolean(s.expertise);
    const customBonus = s.bonus || 0;

    const profMultiplier = expertise ? 2 : proficient ? 1 : 0;
    const modifier = baseMod + (profMultiplier * profBonus) + customBonus;

    result[key] = {
      modifier,
      proficient,
      expertise,
      labelFa: s.nameFa
    };
  }

  return result;
}

/**
 * Computes Initiative.
 */
export function computeInitiative(dexModifier: number, bonus: number = 0): number {
  return dexModifier + (bonus || 0);
}

/**
 * Evaluates Armor Class (AC) based on structured acFormula, equipped gear, or unarmored defense.
 */
export function computeAC(params: ACParams): number {
  if (params.manualOverride !== undefined && params.manualOverride !== null && params.manualOverride > 0) {
    return params.manualOverride;
  }

  const abilities = params.abilities || {};
  const dexMod = abilityModifier(abilities.dex ?? 10);
  const wisMod = abilityModifier(abilities.wis ?? 10);
  const conMod = abilityModifier(abilities.con ?? 10);
  const intMod = abilityModifier(abilities.int ?? 10);

  // Check inventory for equipped armor / shield
  let equippedArmorBaseAc: number | null = null;
  let equippedArmorType: 'light' | 'medium' | 'heavy' | 'shield' | null = params.armorType || null;
  let hasShield = Boolean(params.hasShield);

  if (params.inventory && Array.isArray(params.inventory)) {
    for (const item of params.inventory) {
      if (!item.equipped) continue;
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const type = (item.armorType || '').toLowerCase();

      if (type === 'shield' || cat === 'shield' || name.includes('سپر') || name.includes('shield')) {
        hasShield = true;
      } else if (type === 'heavy' || type === 'medium' || type === 'light' || cat === 'armor' || name.includes('زره')) {
        equippedArmorType = (type as any) || (name.includes('سنگین') ? 'heavy' : name.includes('متوسط') ? 'medium' : 'light');
        if (item.baseAc) {
          equippedArmorBaseAc = item.baseAc;
        }
      }
    }
  }

  const shieldBonus = hasShield ? 2 : 0;
  const normalizedClass = normalizeClassName(params.className || params.classTemplateId);

  // 1. Structured acFormula object check
  if (params.acFormula && typeof params.acFormula === 'object') {
    const form = params.acFormula;
    if (form.unarmored) {
      // Unarmored Defense: base + selected ability mods
      let total = form.base || 10;
      if (form.abilityMods && Array.isArray(form.abilityMods)) {
        for (const ab of form.abilityMods) {
          const k = String(ab).toLowerCase();
          const score = abilities[k] ?? 10;
          total += abilityModifier(score);
        }
      }
      return total;
    } else {
      // Armored / shield formula
      let total = form.base || 10;
      if (equippedArmorType === 'heavy') {
        total = equippedArmorBaseAc || 16;
      } else if (equippedArmorType === 'medium') {
        const base = equippedArmorBaseAc || form.base || 14;
        total = base + Math.min(2, Math.max(0, dexMod));
      } else {
        const base = equippedArmorBaseAc || form.base || 10;
        total = base + dexMod;
      }
      return total + shieldBonus;
    }
  }

  // 2. String formula evaluation or class-specific canon rules
  const formulaStr = typeof params.acFormula === 'string' ? params.acFormula : '';

  // فرهدار in heavy armor + shield = 18 regardless of DEX
  if (
    normalizedClass === 'فرهدار' ||
    formulaStr.includes('18، مستقل از DEX') ||
    formulaStr.includes('16 (زره سنگین) + 2 (سپر)') ||
    (equippedArmorType === 'heavy' && (hasShield || params.hasShield))
  ) {
    return 18;
  }

  // موبد آذرین: Unarmored Defense 10 + DEX mod + WIS mod
  if (
    normalizedClass === 'موبد آذرین' ||
    formulaStr.includes('10 + DEX mod + WIS mod') ||
    (formulaStr.includes('Unarmored Defense') && formulaStr.includes('WIS'))
  ) {
    return 10 + dexMod + wisMod;
  }

  // مهآشنا: Unarmored Defense 10 + DEX mod + WIS mod
  if (normalizedClass === 'مهآشنا') {
    return 10 + dexMod + wisMod;
  }

  // دیوانزاد: 12 (Studded) + CON mod (+2 with shield) or 10 + DEX + shield
  if (normalizedClass === 'دیوانزاد') {
    if (formulaStr.includes('CON mod')) {
      return 12 + conMod + shieldBonus;
    }
    return 10 + dexMod + shieldBonus;
  }

  // General 5e armor calculation
  if (equippedArmorType === 'heavy') {
    return (equippedArmorBaseAc || 16) + shieldBonus;
  }
  if (equippedArmorType === 'medium') {
    return (equippedArmorBaseAc || 14) + Math.min(2, Math.max(0, dexMod)) + shieldBonus;
  }
  if (equippedArmorType === 'light') {
    return (equippedArmorBaseAc || 11) + dexMod + shieldBonus;
  }

  // Default unarmored
  return 10 + dexMod + shieldBonus;
}

/**
 * Computes Maximum HP.
 * Supports hpMode: 'fixed_table' | 'average' | 'roll'.
 * With fixed_table: adds (CON mod - class base CON mod) * level when settings.conAdjustFixedTable is true.
 */
export function computeMaxHp(params: ComputeHpParams): number {
  const level = Math.max(1, Math.min(20, Math.floor(params.level || 1)));
  const normalizedClass = normalizeClassName(params.className || params.classTemplate?.name || params.classTemplate?.id);

  const conMod = params.conModifier !== undefined
    ? params.conModifier
    : abilityModifier(params.abilities?.con ?? 10);

  const mode = params.hpMode || 'fixed_table';

  // 1. FIXED_TABLE MODE (Zorvania canon table)
  if (mode === 'fixed_table') {
    let baseHp = 10;
    const table = FIXED_HP_TABLE[normalizedClass];

    if (table && table.length >= level) {
      baseHp = table[level - 1];
    } else if (params.classTemplate?.fixedHpByLevel) {
      const fixedMap = params.classTemplate.fixedHpByLevel;
      if (Array.isArray(fixedMap) && fixedMap.length >= level) {
        baseHp = fixedMap[level - 1];
      } else if (typeof fixedMap === 'object' && fixedMap[level] !== undefined) {
        baseHp = fixedMap[level];
      }
    } else {
      // Standard 5e fallback
      const hitDie = params.hitDie || params.classTemplate?.hitDie || 8;
      const perLevel = Math.floor(hitDie / 2) + 1;
      baseHp = hitDie + (level - 1) * perLevel;
    }

    if (params.settings?.conAdjustFixedTable) {
      let classBaseConMod = CLASS_BASE_CON_MOD[normalizedClass];
      if (classBaseConMod === undefined && params.classTemplate?.baseAbilityScores?.con !== undefined) {
        classBaseConMod = abilityModifier(params.classTemplate.baseAbilityScores.con);
      }
      if (classBaseConMod === undefined) {
        classBaseConMod = 2; // general default
      }

      baseHp += (conMod - classBaseConMod) * level;
    }

    return Math.max(1, baseHp);
  }

  // 2. AVERAGE MODE
  const hitDie = params.hitDie || params.classTemplate?.hitDie || 8;
  const avgIncrease = Math.floor(hitDie / 2) + 1;

  if (mode === 'average') {
    const hpAtLvl1 = hitDie + conMod;
    const hpLater = (level - 1) * (avgIncrease + conMod);
    return Math.max(1, hpAtLvl1 + hpLater);
  }

  // 3. ROLL MODE
  if (mode === 'roll') {
    const hpAtLvl1 = hitDie + conMod;
    let rollSum = 0;
    if (params.rolls && Array.isArray(params.rolls)) {
      for (let i = 0; i < level - 1; i++) {
        rollSum += (params.rolls[i] || avgIncrease) + conMod;
      }
    } else {
      rollSum = (level - 1) * (avgIncrease + conMod);
    }
    return Math.max(1, hpAtLvl1 + rollSum);
  }

  return Math.max(1, 10);
}

/**
 * Computes Spell Save DC and Spell Attack Bonus.
 */
export function computeSpellDcAndAttack(
  abilityKey: string,
  abilityScoreOrMod: number,
  profBonus: number,
  bonus: number = 0
): { dc: number; attackBonus: number } {
  // If passed score (> 5), calculate modifier; otherwise treat as mod
  const mod = (abilityScoreOrMod > 5 || abilityScoreOrMod < -5)
    ? abilityModifier(abilityScoreOrMod)
    : abilityScoreOrMod;

  return {
    dc: 8 + profBonus + mod + bonus,
    attackBonus: profBonus + mod + bonus
  };
}

/**
 * Computes spell slots for full-caster and half-caster shared tables.
 */
export function computeSlots(casterTypeOrClass: string, level: number): number[] {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const normalized = normalizeClassName(casterTypeOrClass).toLowerCase();

  // Full-caster: موبد آذرین, سایهخوان, full_caster
  if (
    normalized === 'موبد آذرین' ||
    normalized === 'سایهخوان' ||
    normalized.includes('full') ||
    normalized === 'hamoun' ||
    normalized === 'shideh'
  ) {
    return [...(FULL_CASTER_SLOTS[safeLevel] || [])];
  }

  // Half-caster: فرهدار, پیمانبان, دیوانزاد, half_caster
  if (
    normalized === 'فرهدار' ||
    normalized === 'پیمانبان' ||
    normalized === 'دیوانزاد' ||
    normalized.includes('half') ||
    normalized === 'pardis' ||
    normalized === 'mana' ||
    normalized === 'saman'
  ) {
    return [...(HALF_CASTER_SLOTS[safeLevel] || [])];
  }

  return [];
}

/**
 * Returns Divine Smite damage dice progression for a given level.
 */
export function divineSmiteDice(level: number): string {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return DIVINE_SMITE_DICE[safeLevel] || '2d8';
}

/**
 * Returns Martial Arts die progression for a given level.
 */
export function martialArtsDie(level: number): string {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return MARTIAL_ARTS_DIE_TABLE[safeLevel] || '1d4';
}

/**
 * Computes companion AC and HP formulas.
 * e.g. دیوانزاد companion at level 3 with CON mod +3 -> HP 12 and AC 15.
 */
export function computeCompanion(
  companionDefOrClass: any,
  level: number,
  abilities: Record<string, number> | { con?: number; conMod?: number } = {}
): { name: string; ac: number; maxHp: number; type?: string } {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));

  let conMod = 0;
  if ('conMod' in abilities && typeof abilities.conMod === 'number') {
    conMod = abilities.conMod;
  } else if ('con' in abilities && typeof abilities.con === 'number') {
    conMod = abilities.con > 5 ? abilityModifier(abilities.con) : abilities.con;
  }

  const rawName = typeof companionDefOrClass === 'string'
    ? companionDefOrClass
    : companionDefOrClass?.name || companionDefOrClass?.className || '';

  const normalized = normalizeClassName(rawName);

  // دیوانزاد Construct Companion
  if (normalized === 'دیوانزاد' || rawName.includes('سازه همراه') || rawName.includes('construct')) {
    const ac = 15;
    const maxHp = 2 * safeLevel + 2 * conMod;
    return {
      name: 'سازه همراه (Construct Companion)',
      ac,
      maxHp: Math.max(1, maxHp),
      type: 'construct'
    };
  }

  // پیمانبان Forest Companion
  if (normalized === 'پیمانبان' || rawName.includes('جنگل') || rawName.includes('forest')) {
    const ac = 13;
    const maxHp = Math.max(10, 3 * safeLevel + conMod);
    return {
      name: 'همراه جنگل ورنا (Forest Companion)',
      ac,
      maxHp,
      type: 'forest'
    };
  }

  return {
    name: 'همراه',
    ac: 13,
    maxHp: Math.max(10, 2 * safeLevel + conMod),
    type: 'beast'
  };
}

/**
 * Computes class-specific resources and formulas (dice by level, "INT mod + 1", "= level").
 */
export function computeClassResources(
  classTemplateOrName: any,
  level: number,
  abilities: Record<string, number> = {}
): Record<string, { name: string; max: number; currentDice?: string; resetType?: string; formula?: string }> {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const normalized = normalizeClassName(
    typeof classTemplateOrName === 'string' ? classTemplateOrName : classTemplateOrName?.name
  );

  const intMod = abilityModifier(abilities.int ?? 10);
  const conMod = abilityModifier(abilities.con ?? 10);

  const result: Record<string, any> = {};

  if (normalized === 'فرهدار') {
    result['divine_smite'] = {
      name: 'ضربت ایزدی (Divine Smite)',
      max: safeLevel >= 2 ? 1 : 0,
      currentDice: divineSmiteDice(safeLevel),
      resetType: 'short',
      formula: '1 per short rest'
    };
  }

  if (normalized === 'سایهخوان') {
    result['reality_fatigue'] = {
      name: 'خستگی واقعیت (Reality Fatigue)',
      max: Math.max(1, intMod + 1),
      resetType: 'long',
      formula: 'INT mod + 1'
    };
  }

  if (normalized === 'مهآشنا') {
    result['moment_points'] = {
      name: 'امتیاز لحظه (Moment Points)',
      max: safeLevel,
      currentDice: martialArtsDie(safeLevel),
      resetType: 'short',
      formula: '= level'
    };
  }

  if (normalized === 'دیوانزاد') {
    result['construct_companion'] = {
      name: 'انرژی سازه همراه',
      max: safeLevel >= 3 ? Math.max(1, 2 * safeLevel + 2 * conMod) : 0,
      resetType: 'long',
      formula: '2×level + 2×con'
    };
  }

  return result;
}

/**
 * Returns features unlocked up to a given level from a class template and active subclass.
 */
export function featuresUnlockedAtLevel(
  classTemplate: any,
  level: number,
  subclassId?: string
): any[] {
  if (!classTemplate) return [];
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const features: any[] = [];

  // Starting features
  if (classTemplate.startingFeatures && Array.isArray(classTemplate.startingFeatures)) {
    features.push(...classTemplate.startingFeatures);
  }

  // Class features by level
  if (classTemplate.featuresByLevel) {
    for (let lvl = 1; lvl <= safeLevel; lvl++) {
      const list = classTemplate.featuresByLevel[lvl];
      if (Array.isArray(list)) {
        features.push(...list.map(f => ({ ...f, levelUnlocked: lvl })));
      }
    }
  }

  // Subclass features
  if (classTemplate.subclasses && Array.isArray(classTemplate.subclasses)) {
    const sub = classTemplate.subclasses.find((s: any) => s.id === subclassId || s.name === subclassId)
      || classTemplate.subclasses[0];
    if (sub && sub.featuresByLevel && safeLevel >= (sub.unlockLevel || 3)) {
      for (let lvl = (sub.unlockLevel || 3); lvl <= safeLevel; lvl++) {
        const subList = sub.featuresByLevel[lvl];
        if (Array.isArray(subList)) {
          features.push(...subList.map((f: any) => ({ ...f, levelUnlocked: lvl, isSubclass: true })));
        }
      }
    }
  }

  return features;
}

/**
 * Point buy total cost calculator.
 */
export function pointBuyCost(scores: Record<string, number> | number[]): number {
  const scoreList: number[] = Array.isArray(scores)
    ? scores
    : Object.values(scores);

  let total = 0;
  for (const s of scoreList) {
    if (s < 8) return Infinity;
    if (s > 15) return Infinity;
    total += POINT_BUY_COST_TABLE[s] ?? 0;
  }
  return total;
}

/**
 * Validates a point buy allocation against the standard 27-point budget.
 */
export function validatePointBuy(
  scores: Record<string, number> | number[],
  budget: number = 27
): { valid: boolean; cost: number; errors: string[] } {
  const scoreList: number[] = Array.isArray(scores)
    ? scores
    : Object.values(scores);

  const errors: string[] = [];

  if (scoreList.length !== 6) {
    errors.push(`تعداد امتیازات باید ۶ عدد باشد، اما ${scoreList.length} وارد شده است.`);
  }

  for (const s of scoreList) {
    if (s < 8 || s > 15) {
      errors.push(`امتیاز ${s} خارج از محدوده مجاز Point Buy (۸ تا ۱۵) است.`);
    }
  }

  const cost = pointBuyCost(scoreList);
  if (cost > budget) {
    errors.push(`مجموع امتیاز هزینه (${cost}) از سقف مجاز (${budget}) بیشتر است.`);
  }

  return {
    valid: errors.length === 0,
    cost,
    errors
  };
}

/**
 * Validates Standard Array (15, 14, 13, 12, 10, 8).
 */
export function validateStandardArray(scores: number[] | Record<string, number>): boolean {
  const list: number[] = Array.isArray(scores)
    ? [...scores]
    : Object.values(scores);

  if (list.length !== 6) return false;

  const sortedActual = [...list].sort((a, b) => b - a);
  const sortedExpected = [...STANDARD_ARRAY].sort((a, b) => b - a);

  for (let i = 0; i < 6; i++) {
    if (sortedActual[i] !== sortedExpected[i]) return false;
  }

  return true;
}

/**
 * Rolls ability scores using standard 4d6-drop-lowest method.
 * Accepts a random function (0 to 1) so the server can inject crypto randomness.
 */
export function rollAbilityScores(
  randomFn: () => number = Math.random
): { rolls: number[][]; scores: number[] } {
  const rolls: number[][] = [];
  const scores: number[] = [];

  for (let i = 0; i < 6; i++) {
    const dice: number[] = [];
    for (let d = 0; d < 4; d++) {
      const val = Math.floor(randomFn() * 6) + 1;
      dice.push(Math.max(1, Math.min(6, val)));
    }
    const sorted = [...dice].sort((a, b) => a - b);
    // drop the lowest (sorted[0]) and sum top 3
    const sum = sorted[1] + sorted[2] + sorted[3];
    rolls.push(dice);
    scores.push(sum);
  }

  return { rolls, scores };
}

// ---------------------------------------------------------------------------
// 5. deriveSheet (Master Derived Stats Calculator)
// ---------------------------------------------------------------------------

/**
 * Returns all derived stats at once for any character sheet.
 */
export function deriveSheet(input: DeriveSheetInput): DerivedSheet {
  const { character, classTemplate, ruleSet, settings } = input;
  const level = Math.max(1, Math.min(20, Math.floor(character.level || 1)));
  const abilities = character.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  const profBonus = proficiencyBonus(level, ruleSet);

  const abilityModifiers: Record<AbilityName, number> = {
    str: abilityModifier(abilities.str ?? 10),
    dex: abilityModifier(abilities.dex ?? 10),
    con: abilityModifier(abilities.con ?? 10),
    int: abilityModifier(abilities.int ?? 10),
    wis: abilityModifier(abilities.wis ?? 10),
    cha: abilityModifier(abilities.cha ?? 10),
  };

  const savingThrows = computeSaves(
    abilities,
    character.savingThrows || classTemplate?.savingThrowProficiencies || {},
    profBonus
  );

  const skills = computeSkills(
    abilities,
    character.skills || [],
    profBonus
  );

  const initiative = computeInitiative(abilityModifiers.dex, character.initiativeBonus || 0);

  const ac = computeAC({
    acFormula: classTemplate?.acFormula,
    className: character.className || classTemplate?.name,
    classTemplateId: character.classTemplateId || classTemplate?.id,
    abilities,
    inventory: character.inventory,
    manualOverride: character.acManualOverride ?? (character.ac > 0 ? character.ac : null)
  });

  const maxHp = computeMaxHp({
    className: character.className || classTemplate?.name,
    level,
    abilities,
    conModifier: abilityModifiers.con,
    hpMode: settings?.hpMode || 'fixed_table',
    settings,
    classTemplate,
    hitDie: classTemplate?.hitDie
  });

  // Spellcasting
  let spellcasting: DerivedSheet['spellcasting'] = null;
  const spellAbilityKey = classTemplate?.spellcasting?.ability || null;

  if (spellAbilityKey) {
    const spellMod = abilityModifiers[spellAbilityKey.toLowerCase() as AbilityName] ?? 0;
    const { dc, attackBonus } = computeSpellDcAndAttack(spellAbilityKey, spellMod, profBonus);
    const slots = computeSlots(character.className || classTemplate?.name, level);
    spellcasting = {
      ability: spellAbilityKey,
      abilityModifier: spellMod,
      dc,
      attackBonus,
      slots
    };
  }

  // Class Resources
  const classResources = computeClassResources(
    character.className || classTemplate?.name,
    level,
    abilities
  );

  // Companion
  let companion: DerivedSheet['companion'] = null;
  const normalizedClass = normalizeClassName(character.className || classTemplate?.name);
  if (normalizedClass === 'دیوانزاد' || normalizedClass === 'پیمانبان') {
    companion = computeCompanion(normalizedClass, level, abilities);
  }

  // Martial Arts Die
  const martialArts = normalizedClass === 'مهآشنا' ? martialArtsDie(level) : null;

  // Unlocked Features
  const unlockedFeatures = featuresUnlockedAtLevel(
    classTemplate,
    level,
    character.subclassName
  );

  return {
    proficiencyBonus: profBonus,
    abilityModifiers,
    savingThrows,
    skills,
    ac,
    initiative,
    maxHp,
    spellcasting,
    classResources,
    companion,
    martialArtsDie: martialArts,
    unlockedFeatures
  };
}
