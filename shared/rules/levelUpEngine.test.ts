import { describe, it, expect } from 'vitest';
import {
  XP_THRESHOLDS,
  isLevelUpReady,
  computeLevelUpDiff,
  isFieldLockedForPlayer,
  parseHitDieValue
} from './levelUpEngine';
import { SEED_CLASS_TEMPLATES } from '../../src/data/seed';
import { CharacterParticipation, ClassTemplate, LevelUpPayload } from '../../src/types';

describe('Level-Up & Progression Engine (Step 3.4)', () => {
  const farhadar = SEED_CLASS_TEMPLATES.find(c => c.name === 'فرهدار')!;
  const mobad = SEED_CLASS_TEMPLATES.find(c => c.name === 'موبد آذرین')!;

  const basePart: CharacterParticipation = {
    id: 'part-1',
    characterId: 'char-1',
    campaignId: 'camp-1',
    status: 'active',
    className: 'فرهدار',
    level: 1,
    xp: 0,
    abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 8 },
    currentHp: 12,
    maxHp: 12,
    tempHp: 0,
    hitDice: { current: 1, max: 1, die: 'd10' },
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    inventory: [],
    weapons: [],
    currency: { gold: 10, silver: 0, copper: 0 },
    customResources: [],
    features: [],
    notes: '',
    sheetLocked: true,
    levelUpAvailable: false,
    joinedAt: Date.now(),
    updatedAt: Date.now()
  };

  // -----------------------------------------------------------------------
  // 1. XP Thresholds & Level-Up Readiness
  // -----------------------------------------------------------------------
  describe('XP Progression & Readiness Checks', () => {
    it('provides standard 5e XP thresholds', () => {
      expect(XP_THRESHOLDS[2]).toBe(300);
      expect(XP_THRESHOLDS[3]).toBe(900);
      expect(XP_THRESHOLDS[4]).toBe(2700);
      expect(XP_THRESHOLDS[5]).toBe(6500);
      expect(XP_THRESHOLDS[20]).toBe(355000);
    });

    it('identifies readiness in XP mode when crossing threshold', () => {
      // Level 1 character needs 300 XP for level 2
      expect(isLevelUpReady(1, 200, 'xp', false)).toBe(false);
      expect(isLevelUpReady(1, 300, 'xp', false)).toBe(true);
      expect(isLevelUpReady(1, 450, 'xp', false)).toBe(true);
    });

    it('identifies readiness in milestone mode only when levelUpAvailable is true', () => {
      expect(isLevelUpReady(1, 5000, 'milestone', false)).toBe(false);
      expect(isLevelUpReady(1, 0, 'milestone', true)).toBe(true);
    });

    it('caps readiness at level 20', () => {
      expect(isLevelUpReady(20, 999999, 'xp', true)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Hit Points Progression & CON Line Breakdown
  // -----------------------------------------------------------------------
  describe('Hit Points Progression', () => {
    it('computes fixed HP with CON adjustment line shown', () => {
      // Farhadar hitDie is d10 (base fixed = 6). con 14 -> mod +2. Total gain = 8.
      const payload: LevelUpPayload = {
        hpMode: 'fixed'
      };

      const res = computeLevelUpDiff({
        participation: basePart,
        classTemplate: farhadar,
        payload
      });

      expect(res.validation.valid).toBe(true);
      expect(res.diff.hpGain).toBe(8);
      expect(res.diff.newMaxHp).toBe(20);
      expect(res.diff.hpBreakdown).toContain('پایه ثابت کلاسی (6)');
      expect(res.diff.hpBreakdown).toContain('+2');
      expect(res.diff.hpBreakdown).toContain('+8 جان');
    });

    it('computes rolled HP with roll and CON modifier', () => {
      const payload: LevelUpPayload = {
        hpMode: 'roll',
        hpRoll: 7
      };

      const res = computeLevelUpDiff({
        participation: basePart,
        classTemplate: farhadar,
        payload
      });

      expect(res.validation.valid).toBe(true);
      // roll 7 + con mod 2 = 9
      expect(res.diff.hpGain).toBe(9);
      expect(res.diff.newMaxHp).toBe(21);
      expect(res.diff.hpBreakdown).toContain('پرتاب تاس 1d10 (7)');
    });

    it('validates hit die rolls within bounds', () => {
      const payload: LevelUpPayload = {
        hpMode: 'roll',
        hpRoll: 15 // d10 cannot roll 15
      };

      const res = computeLevelUpDiff({
        participation: basePart,
        classTemplate: farhadar,
        payload
      });

      expect(res.validation.valid).toBe(false);
      expect(res.validation.errors[0]).toContain(`باید بین ۱ و 10 باشد`);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Ability Score Improvement (ASI) at asiLevels
  // -----------------------------------------------------------------------
  describe('Ability Score Improvement (ASI)', () => {
    it('applies +2 to single stat capped at 20', () => {
      // Level 3 to 4 is an ASI level
      const lvl3Part: CharacterParticipation = {
        ...basePart,
        level: 3,
        abilityScores: { ...basePart.abilityScores, str: 19 }
      };

      const payload: LevelUpPayload = {
        hpMode: 'fixed',
        asiMode: 'plus2',
        asiChoices: { stat1: 'str' }
      };

      const res = computeLevelUpDiff({
        participation: lvl3Part,
        classTemplate: farhadar,
        payload
      });

      expect(res.validation.valid).toBe(true);
      // Capped at 20 (19 + 2 -> 20)
      expect(res.nextParticipation.abilityScores.str).toBe(20);
      expect(res.diff.abilityChanges?.str?.after).toBe(20);
    });

    it('applies +1 to two different stats', () => {
      const lvl3Part: CharacterParticipation = {
        ...basePart,
        level: 3
      };

      const payload: LevelUpPayload = {
        hpMode: 'fixed',
        asiMode: 'plus1plus1',
        asiChoices: { stat1: 'str', stat2: 'con' }
      };

      const res = computeLevelUpDiff({
        participation: lvl3Part,
        classTemplate: farhadar,
        payload
      });

      expect(res.validation.valid).toBe(true);
      expect(res.nextParticipation.abilityScores.str).toBe(17);
      expect(res.nextParticipation.abilityScores.con).toBe(15);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Subclass Unlock Check at Level 3
  // -----------------------------------------------------------------------
  describe('Subclass Unlock', () => {
    it('enforces subclass selection at level 3 when class has subclasses', () => {
      const lvl2Part: CharacterParticipation = {
        ...basePart,
        level: 2,
        subclassName: undefined
      };

      const payloadWithoutSubclass: LevelUpPayload = {
        hpMode: 'fixed'
      };

      const resFail = computeLevelUpDiff({
        participation: lvl2Part,
        classTemplate: farhadar,
        payload: payloadWithoutSubclass
      });

      expect(resFail.validation.valid).toBe(false);
      expect(resFail.validation.errors[0]).toContain('انتخاب زیرکلاس الزامی است');

      const payloadWithSubclass: LevelUpPayload = {
        hpMode: 'fixed',
        chosenSubclass: farhadar.subclasses[0].name
      };

      const resSuccess = computeLevelUpDiff({
        participation: lvl2Part,
        classTemplate: farhadar,
        payload: payloadWithSubclass
      });

      expect(resSuccess.validation.valid).toBe(true);
      expect(resSuccess.nextParticipation.subclassName).toBe(farhadar.subclasses[0].name);
      expect(resSuccess.diff.unlockedSubclass).toBe(farhadar.subclasses[0].name);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Sheet Lock Field Enforcement
  // -----------------------------------------------------------------------
  describe('Sheet Lock Rules', () => {
    it('locks core stats for player modification', () => {
      expect(isFieldLockedForPlayer('level')).toBe(true);
      expect(isFieldLockedForPlayer('className')).toBe(true);
      expect(isFieldLockedForPlayer('abilityScores')).toBe(true);
      expect(isFieldLockedForPlayer('maxHp')).toBe(true);
      expect(isFieldLockedForPlayer('hitDice')).toBe(true);
      expect(isFieldLockedForPlayer('features')).toBe(true);
      expect(isFieldLockedForPlayer('sheetLocked')).toBe(true);
    });

    it('keeps gameplay fields editable for players', () => {
      expect(isFieldLockedForPlayer('currentHp')).toBe(false);
      expect(isFieldLockedForPlayer('tempHp')).toBe(false);
      expect(isFieldLockedForPlayer('deathSaves')).toBe(false);
      expect(isFieldLockedForPlayer('conditions')).toBe(false);
      expect(isFieldLockedForPlayer('inventory')).toBe(false);
      expect(isFieldLockedForPlayer('weapons')).toBe(false);
      expect(isFieldLockedForPlayer('currency')).toBe(false);
      expect(isFieldLockedForPlayer('notes')).toBe(false);
    });
  });
});
