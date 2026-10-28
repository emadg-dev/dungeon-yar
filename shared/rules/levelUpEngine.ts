/**
 * Level-Up, XP Progression, Approvals, and Sheet Lock Engine (Step 3.4)
 * Pure, authoritative rules logic for multi-campaign D&D 5e platform.
 */

import {
  CharacterParticipation,
  ClassTemplate,
  LevelUpPayload,
  LevelUpDiff,
  AbilityName,
  AbilityScoreMap,
  Companion,
  Feature
} from '../../src/types';
import { abilityModifier, proficiencyBonus } from './engine';

// Standard 5e XP Progression Thresholds
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
};

export const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

/**
 * Checks if a character participation is ready to level up
 */
export function isLevelUpReady(
  currentLevel: number,
  xp: number,
  levelingMode: 'milestone' | 'xp' = 'milestone',
  levelUpAvailable: boolean = false
): boolean {
  if (currentLevel >= 20) return false;
  if (levelUpAvailable) return true;
  if (levelingMode === 'xp') {
    const nextXp = XP_THRESHOLDS[currentLevel + 1];
    return typeof nextXp === 'number' && xp >= nextXp;
  }
  return false;
}

/**
 * Parses hit die size as an integer (e.g. "d10" -> 10, 8 -> 8)
 */
export function parseHitDieValue(hitDie: string | number | undefined): number {
  if (typeof hitDie === 'number') return hitDie;
  if (typeof hitDie === 'string') {
    const match = hitDie.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 8;
}

/**
 * Core locked fields that players cannot directly edit via PATCH when sheet is locked
 */
export const LOCKED_CORE_FIELDS = new Set([
  'level',
  'className',
  'classId',
  'subclassName',
  'abilityScores',
  'maxHp',
  'hitDice',
  'features',
  'sheetLocked',
  'speedOverride',
  'acOverride'
]);

/**
 * Checks whether a field on the character sheet is locked for regular players
 */
export function isFieldLockedForPlayer(fieldName: string): boolean {
  return LOCKED_CORE_FIELDS.has(fieldName);
}

export interface LevelUpComputeResult {
  validation: {
    valid: boolean;
    errors: string[];
  };
  diff: LevelUpDiff;
  nextParticipation: CharacterParticipation;
}

/**
 * Authoritative Server & Client Calculation of Level-Up Diff and Next State
 */
export function computeLevelUpDiff(params: {
  participation: CharacterParticipation;
  classTemplate?: ClassTemplate | null;
  payload: LevelUpPayload;
  nextLevel?: number;
}): LevelUpComputeResult {
  const { participation, classTemplate, payload } = params;
  const errors: string[] = [];
  const fromLevel = participation.level;
  const toLevel = params.nextLevel ?? fromLevel + 1;

  if (toLevel !== fromLevel + 1) {
    errors.push(`سطح هدف (${toLevel}) باید دقیقاً یک سطح بالاتر از سطح فعلی (${fromLevel}) باشد.`);
  }

  if (toLevel > 20) {
    errors.push('رسیدن به سطوح فراتر از سطح ۲۰ امکان‌پذیر نیست.');
  }

  const asiLevels = classTemplate?.asiLevels || DEFAULT_ASI_LEVELS;
  const isAsiLevel = asiLevels.includes(toLevel);

  // 1. Calculate Abilities (ASI)
  const newAbilities: AbilityScoreMap = { ...participation.abilityScores };
  const abilityChanges: Partial<Record<AbilityName, { before: number; after: number }>> = {};

  if (isAsiLevel) {
    const mode = payload.asiMode || 'plus2';
    if (mode === 'plus2') {
      const stat = payload.asiChoices?.stat1 || 'str';
      const before = newAbilities[stat] || 10;
      const after = Math.min(20, before + 2);
      newAbilities[stat] = after;
      abilityChanges[stat] = { before, after };
    } else if (mode === 'plus1plus1') {
      const s1 = payload.asiChoices?.stat1 || 'str';
      const s2 = payload.asiChoices?.stat2 || 'dex';
      if (s1 === s2) {
        errors.push('در حالت افزایش دوگانه (+۱ / +۱) باید دو ویژگی متفاوت انتخاب شوند.');
      }
      const b1 = newAbilities[s1] || 10;
      const b2 = newAbilities[s2] || 10;
      const a1 = Math.min(20, b1 + 1);
      const a2 = Math.min(20, b2 + 1);
      newAbilities[s1] = a1;
      newAbilities[s2] = a2;
      abilityChanges[s1] = { before: b1, after: a1 };
      abilityChanges[s2] = { before: b2, after: a2 };
    }
  }

  // 2. Hit Points Calculation
  const hitDie = parseHitDieValue(classTemplate?.hitDie);
  const conMod = abilityModifier(newAbilities.con ?? participation.abilityScores.con ?? 10);
  let hpGain = 1;
  let hpBreakdown = '';

  if (payload.hpMode === 'fixed') {
    // Standard 5e fixed: Math.floor(hitDie / 2) + 1 + conMod
    const baseFixed = Math.floor(hitDie / 2) + 1;
    hpGain = Math.max(1, baseFixed + conMod);
    hpBreakdown = `پایه ثابت کلاسی (${baseFixed}) + تعدیل بنیه (${conMod >= 0 ? `+${conMod}` : conMod}) = +${hpGain} جان`;
  } else if (payload.hpMode === 'roll') {
    const rawRoll = payload.hpRoll || Math.floor(hitDie / 2) + 1;
    if (rawRoll < 1 || rawRoll > hitDie) {
      errors.push(`تاس پرتاب شده برای جان (${rawRoll}) باید بین ۱ و ${hitDie} باشد.`);
    }
    hpGain = Math.max(1, rawRoll + conMod);
    hpBreakdown = `پرتاب تاس 1d${hitDie} (${rawRoll}) + تعدیل بنیه (${conMod >= 0 ? `+${conMod}` : conMod}) = +${hpGain} جان`;
  } else {
    // Manual
    hpGain = Math.max(1, payload.hpRoll || Math.floor(hitDie / 2) + 1);
    hpBreakdown = `میزان تعیین شده دستی: +${hpGain} جان`;
  }

  const oldMaxHp = participation.maxHp;
  const newMaxHp = oldMaxHp + hpGain;
  const newCurrentHp = participation.currentHp + hpGain;

  // 3. Subclass Unlock Check
  let unlockedSubclass: string | undefined = undefined;
  const subclassUnlockLevel = classTemplate?.subclasses?.[0]?.unlockLevel ?? 3;
  if (toLevel === subclassUnlockLevel && !participation.subclassName && (classTemplate?.subclasses?.length || 0) > 0) {
    if (!payload.chosenSubclass) {
      errors.push(`در سطح ${subclassUnlockLevel} انتخاب زیرکلاس الزامی است.`);
    } else {
      const found = classTemplate?.subclasses?.find(s => s.name === payload.chosenSubclass || s.id === payload.chosenSubclass);
      if (!found) {
        errors.push(`زیرکلاس انتخاب شده «${payload.chosenSubclass}» در این کلاس تعریف نشده است.`);
      } else {
        unlockedSubclass = found.name;
      }
    }
  }

  // 4. Features for Target Level
  const newFeatures: Array<{ name: string; description: string }> = [];
  if (classTemplate?.featuresByLevel?.[toLevel]) {
    for (const f of classTemplate.featuresByLevel[toLevel]) {
      newFeatures.push({ name: f.name, description: f.description });
    }
  } else if (classTemplate?.features?.[toLevel]) {
    newFeatures.push({ name: `قابلیت سطح ${toLevel}`, description: String(classTemplate.features[toLevel]) });
  }

  // If subclass was chosen, add subclass features for toLevel
  if (unlockedSubclass && classTemplate?.subclasses) {
    const sub = classTemplate.subclasses.find(s => s.name === unlockedSubclass);
    if (sub?.featuresByLevel?.[toLevel]) {
      for (const sf of sub.featuresByLevel[toLevel]) {
        newFeatures.push({ name: sf.name, description: sf.description });
      }
    }
  }

  // 5. Spells
  const isCaster = Boolean(classTemplate?.spellcasting);
  let newSpellsResult: { cantrips: string[]; spells: string[] } | undefined = undefined;
  let updatedSpellSlots = participation.spellSlots;
  let updatedSpells = participation.spellsKnownPrepared;

  if (isCaster) {
    const newSlots = classTemplate?.spellcasting?.slotsByLevel?.[toLevel] 
      || classTemplate?.spellcasting?.slotsTable?.[toLevel] 
      || null;

    if (newSlots) {
      updatedSpellSlots = {
        ...(participation.spellSlots || {}),
        slots: Array.isArray(newSlots) ? newSlots : participation.spellSlots?.slots
      };
    }

    if (payload.newSpells) {
      newSpellsResult = {
        cantrips: payload.newSpells.cantrips || [],
        spells: payload.newSpells.spells || []
      };
      const existingCantrips = participation.spellsKnownPrepared?.cantrips || [];
      const existingSpells = participation.spellsKnownPrepared?.spells || [];
      updatedSpells = {
        cantrips: Array.from(new Set([...existingCantrips, ...newSpellsResult.cantrips])),
        spells: Array.from(new Set([...existingSpells, ...newSpellsResult.spells]))
      };
    }
  }

  // 6. Companion & Resources auto-recalculation
  let newCompanion: { name: string; type?: string } | undefined = undefined;
  if (classTemplate?.companion && classTemplate.companion.fromLevel === toLevel) {
    newCompanion = {
      name: payload.newCompanionName || classTemplate.companion.name,
      type: 'companion'
    };
  }

  const oldProfBonus = proficiencyBonus(fromLevel);
  const newProfBonus = proficiencyBonus(toLevel);

  // Build diff object
  const diff: LevelUpDiff = {
    fromLevel,
    toLevel,
    hpGain,
    newMaxHp,
    oldMaxHp,
    hpBreakdown,
    abilityChanges: Object.keys(abilityChanges).length > 0 ? abilityChanges : undefined,
    newFeatures,
    unlockedSubclass,
    newSpells: newSpellsResult,
    newCompanion,
    oldProfBonus,
    newProfBonus
  };

  // Build updated participation object
  const mergedFeatures: Feature[] = [
    ...(participation.features || []),
    ...newFeatures.map(f => ({
      id: `feat-${toLevel}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      description: f.description,
      source: `کلاس سطح ${toLevel}`,
      usageType: 'passive' as const,
      usedCount: 0
    }))
  ];

  const nextParticipation: CharacterParticipation = {
    ...participation,
    level: toLevel,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
    abilityScores: newAbilities,
    subclassName: unlockedSubclass || participation.subclassName,
    hitDice: {
      ...participation.hitDice,
      max: toLevel,
      current: Math.min(toLevel, participation.hitDice.current + 1),
      die: `d${hitDie}`
    },
    features: mergedFeatures,
    spellSlots: updatedSpellSlots,
    spellsKnownPrepared: updatedSpells,
    levelUpAvailable: false,
    updatedAt: Date.now()
  };

  return {
    validation: {
      valid: errors.length === 0,
      errors
    },
    diff,
    nextParticipation
  };
}
