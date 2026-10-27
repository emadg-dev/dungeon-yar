import { describe, it, expect } from 'vitest';
import {
  abilityModifier,
  proficiencyBonus,
  computeSaves,
  computeSkills,
  computeAC,
  computeInitiative,
  computeMaxHp,
  computeSpellDcAndAttack,
  computeSlots,
  divineSmiteDice,
  martialArtsDie,
  computeCompanion,
  computeClassResources,
  featuresUnlockedAtLevel,
  pointBuyCost,
  validatePointBuy,
  validateStandardArray,
  rollAbilityScores,
  deriveSheet,
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  FIXED_HP_TABLE
} from './engine';

describe('Rules Engine - Acceptance Tests & Canon Fixtures', () => {
  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 1: Fixed HP at level 1 and level 20 for all 6 canon classes
  // فرهدار 12/164, موبد آذرین 9/123, دیوانزاد 11/163, پیمانبان 11/144, سایهخوان 7/102, مهآشنا 9/123
  // -------------------------------------------------------------------------
  describe('Required Fixture 1: Canon Fixed HP', () => {
    const expectations = [
      { className: 'فرهدار', lvl1: 12, lvl20: 164 },
      { className: 'موبد آذرین', lvl1: 9, lvl20: 123 },
      { className: 'دیوانزاد', lvl1: 11, lvl20: 163 },
      { className: 'پیمانبان', lvl1: 11, lvl20: 144 },
      { className: 'سایهخوان', lvl1: 7, lvl20: 102 },
      { className: 'مهآشنا', lvl1: 9, lvl20: 123 },
    ];

    for (const { className, lvl1, lvl20 } of expectations) {
      it(`computes correct fixed HP for ${className} at L1 (${lvl1}) and L20 (${lvl20})`, () => {
        expect(computeMaxHp({ className, level: 1, hpMode: 'fixed_table' })).toBe(lvl1);
        expect(computeMaxHp({ className, level: 20, hpMode: 'fixed_table' })).toBe(lvl20);
      });
    }

    it('supports conAdjustFixedTable when enabled in settings', () => {
      // فرهدار base CON mod is +2. If character has CON mod +3 (score 16), adds (+3 - +2)*level = +1*level
      const hpLvl1 = computeMaxHp({
        className: 'فرهدار',
        level: 1,
        conModifier: 3,
        hpMode: 'fixed_table',
        settings: { conAdjustFixedTable: true }
      });
      expect(hpLvl1).toBe(12 + (3 - 2) * 1); // 13

      const hpLvl20 = computeMaxHp({
        className: 'فرهدار',
        level: 20,
        conModifier: 3,
        hpMode: 'fixed_table',
        settings: { conAdjustFixedTable: true }
      });
      expect(hpLvl20).toBe(164 + (3 - 2) * 20); // 184
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 2: Full-caster slots level 5 = [4,3,2] and level 20 = [4,3,3,3,3,2,2,1,1]
  // -------------------------------------------------------------------------
  describe('Required Fixture 2: Full-Caster Slots', () => {
    it('computes full-caster slots at level 5: [4, 3, 2]', () => {
      const slotsL5 = computeSlots('full_caster', 5);
      expect(slotsL5).toEqual([4, 3, 2]);

      const hamounL5 = computeSlots('موبد آذرین', 5);
      expect(hamounL5).toEqual([4, 3, 2]);
    });

    it('computes full-caster slots at level 20: [4, 3, 3, 3, 3, 2, 2, 1, 1]', () => {
      const slotsL20 = computeSlots('full_caster', 20);
      expect(slotsL20).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);

      const shidehL20 = computeSlots('سایهخوان', 20);
      expect(shidehL20).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 3: Half-caster slots level 5 = [4,2] and level 17 = [4,4]
  // -------------------------------------------------------------------------
  describe('Required Fixture 3: Half-Caster Slots', () => {
    it('computes half-caster slots at level 5: [4, 2]', () => {
      const slotsL5 = computeSlots('half_caster', 5);
      expect(slotsL5).toEqual([4, 2]);

      const manaL5 = computeSlots('پیمانبان', 5);
      expect(manaL5).toEqual([4, 2]);
    });

    it('computes half-caster slots at level 17: [4, 4]', () => {
      const slotsL17 = computeSlots('half_caster', 17);
      expect(slotsL17).toEqual([4, 4]);

      const pardisL17 = computeSlots('فرهدار', 17);
      expect(pardisL17).toEqual([4, 4]);
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 4: Divine Smite dice level 2 = 2d8, level 11 = 5d8, level 15 = 6d8
  // -------------------------------------------------------------------------
  describe('Required Fixture 4: Divine Smite Dice', () => {
    it('computes Divine Smite dice correctly', () => {
      expect(divineSmiteDice(2)).toBe('2d8');
      expect(divineSmiteDice(11)).toBe('5d8');
      expect(divineSmiteDice(15)).toBe('6d8');
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 5: Martial Arts Die level 5 = 1d6 and level 17 = 1d10
  // -------------------------------------------------------------------------
  describe('Required Fixture 5: Martial Arts Die', () => {
    it('computes Martial Arts Die correctly', () => {
      expect(martialArtsDie(5)).toBe('1d6');
      expect(martialArtsDie(17)).toBe('1d10');
      expect(martialArtsDie(1)).toBe('1d4');
      expect(martialArtsDie(11)).toBe('1d8');
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 6: دیوانزاد companion at level 3 with CON mod +3 → HP 12 and AC 15
  // -------------------------------------------------------------------------
  describe('Required Fixture 6: دیوانزاد Companion', () => {
    it('calculates companion HP 12 and AC 15 for دیوانزاد at L3 with CON mod +3', () => {
      const companion = computeCompanion('دیوانزاد', 3, { conMod: 3 });
      expect(companion.ac).toBe(15);
      expect(companion.maxHp).toBe(12); // 2 * 3 + 2 * 3 = 12
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 7: موبد آذرین unarmored AC with DEX 10 and WIS 16 = 13
  // -------------------------------------------------------------------------
  describe('Required Fixture 7: موبد آذرین Unarmored AC', () => {
    it('evaluates AC = 13 for موبد آذرین with DEX 10 and WIS 16', () => {
      const ac = computeAC({
        className: 'موبد آذرین',
        abilities: { dex: 10, wis: 16 }
      });
      // 10 + 0 (DEX) + 3 (WIS) = 13
      expect(ac).toBe(13);
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED FIXTURE 8: فرهدار in heavy armor + shield = 18 regardless of DEX
  // -------------------------------------------------------------------------
  describe('Required Fixture 8: فرهدار in Heavy Armor + Shield', () => {
    it('computes AC = 18 for فرهدار regardless of DEX (DEX 8)', () => {
      const acLowDex = computeAC({
        className: 'فرهدار',
        armorType: 'heavy',
        hasShield: true,
        abilities: { dex: 8 }
      });
      expect(acLowDex).toBe(18);
    });

    it('computes AC = 18 for فرهدار regardless of DEX (DEX 18)', () => {
      const acHighDex = computeAC({
        className: 'فرهدار',
        armorType: 'heavy',
        hasShield: true,
        abilities: { dex: 18 }
      });
      expect(acHighDex).toBe(18);
    });
  });

  // -------------------------------------------------------------------------
  // General Unit Tests: abilityModifier, saves, skills, pointBuy, rollAbilityScores, deriveSheet
  // -------------------------------------------------------------------------
  describe('Core Ability & Skill Functions', () => {
    it('computes ability modifiers correctly', () => {
      expect(abilityModifier(10)).toBe(0);
      expect(abilityModifier(11)).toBe(0);
      expect(abilityModifier(12)).toBe(1);
      expect(abilityModifier(13)).toBe(1);
      expect(abilityModifier(8)).toBe(-1);
      expect(abilityModifier(18)).toBe(4);
      expect(abilityModifier(20)).toBe(5);
    });

    it('computes proficiency bonus with world book comment check', () => {
      expect(proficiencyBonus(1)).toBe(2);
      expect(proficiencyBonus(4)).toBe(2);
      expect(proficiencyBonus(5)).toBe(3);
      expect(proficiencyBonus(9)).toBe(4);
      expect(proficiencyBonus(13)).toBe(5);
      expect(proficiencyBonus(17)).toBe(6);
    });

    it('computes saving throws', () => {
      const saves = computeSaves(
        { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        { str: true, con: true },
        2
      );
      expect(saves.str).toEqual({ modifier: 5, proficient: true }); // +3 mod + 2 prof
      expect(saves.dex).toEqual({ modifier: 1, proficient: false });
      expect(saves.con).toEqual({ modifier: 4, proficient: true }); // +2 mod + 2 prof
      expect(saves.cha).toEqual({ modifier: -1, proficient: false });
    });

    it('computes skills with proficiency and expertise', () => {
      const skills = computeSkills(
        { str: 16, dex: 14 },
        [
          { key: 'athletics', ability: 'str', proficient: true },
          { key: 'stealth', ability: 'dex', proficient: true, expertise: true }
        ],
        2
      );
      expect(skills.athletics.modifier).toBe(5); // 3 (str) + 2 (prof)
      expect(skills.stealth.modifier).toBe(6);   // 2 (dex) + 4 (expertise)
    });

    it('computes initiative bonus', () => {
      expect(computeInitiative(2, 0)).toBe(2);
      expect(computeInitiative(3, 2)).toBe(5);
    });

    it('computes spell DC and attack bonus', () => {
      const res = computeSpellDcAndAttack('int', 16, 2);
      expect(res.dc).toBe(13); // 8 + 2 + 3
      expect(res.attackBonus).toBe(5); // 2 + 3
    });
  });

  describe('Point Buy & Standard Array', () => {
    it('validates Standard Array [15, 14, 13, 12, 10, 8]', () => {
      expect(validateStandardArray([15, 14, 13, 12, 10, 8])).toBe(true);
      expect(validateStandardArray([8, 10, 12, 13, 14, 15])).toBe(true);
      expect(validateStandardArray({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })).toBe(true);
      expect(validateStandardArray([15, 15, 15, 8, 8, 8])).toBe(false);
    });

    it('calculates point buy cost and validates budget', () => {
      const standardCost = pointBuyCost([15, 14, 13, 12, 10, 8]);
      // 9 + 7 + 5 + 4 + 2 + 0 = 27
      expect(standardCost).toBe(27);

      const validRes = validatePointBuy([15, 14, 13, 12, 10, 8], 27);
      expect(validRes.valid).toBe(true);
      expect(validRes.cost).toBe(27);

      const invalidCost = pointBuyCost([16, 14, 13, 12, 10, 8]); // 16 is invalid
      expect(invalidCost).toBe(Infinity);
      const invalidRes = validatePointBuy([16, 14, 13, 12, 10, 8], 27);
      expect(invalidRes.valid).toBe(false);
    });
  });

  describe('rollAbilityScores', () => {
    it('rolls 6 scores with 4d6 drop lowest using custom random function', () => {
      // Deterministic random generator giving constant 0.5 (roll = floor(0.5 * 6) + 1 = 4)
      const mockRandom = () => 0.5;
      const result = rollAbilityScores(mockRandom);
      expect(result.scores.length).toBe(6);
      expect(result.rolls.length).toBe(6);
      // All 4 dice are 4. Dropping 4 leaves 3x4 = 12
      expect(result.scores).toEqual([12, 12, 12, 12, 12, 12]);
    });
  });

  describe('deriveSheet', () => {
    it('returns all derived stats together in one clean object', () => {
      const sheet = deriveSheet({
        character: {
          name: 'پردیس',
          level: 2,
          className: 'فرهدار',
          abilities: { str: 15, dex: 10, con: 14, int: 9, wis: 13, cha: 16 },
          savingThrows: { wis: true, cha: true },
          skills: [{ key: 'athletics', ability: 'str', proficient: true }]
        }
      });

      expect(sheet.proficiencyBonus).toBe(2);
      expect(sheet.abilityModifiers.str).toBe(2);
      expect(sheet.abilityModifiers.cha).toBe(3);
      expect(sheet.savingThrows.wis.modifier).toBe(3); // +1 (wis) + 2 (prof)
      expect(sheet.savingThrows.cha.modifier).toBe(5); // +3 (cha) + 2 (prof)
      expect(sheet.maxHp).toBe(20); // فرهدار at L2 fixed table
      expect(sheet.classResources.divine_smite).toBeDefined();
      expect(sheet.classResources.divine_smite.currentDice).toBe('2d8');
    });
  });
});
