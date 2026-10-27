import { describe, it, expect } from 'vitest';
import {
  validateIdentityStep,
  validateClassStep,
  validateAbilitiesStep,
  calculateFinalAbilities,
  validateBackgroundAndSkillsStep,
  validateEquipmentStep,
  validateSpellsStep,
  computeAuthoritativeParticipation,
  createSnapshot,
  pruneSnapshots,
  CANON_STARTER_WEAPONS
} from './wizardEngine';
import { SEED_CLASS_TEMPLATES } from '../../src/data/seed';
import {
  LineageTemplate,
  BackgroundTemplate,
  CharacterBuild,
  ParticipationSnapshot
} from '../../src/types';

describe('Character Creation Wizard Engine (Step 3.3)', () => {
  const farhadar = SEED_CLASS_TEMPLATES.find(c => c.name === 'فرهدار')!;
  const mobad = SEED_CLASS_TEMPLATES.find(c => c.name === 'موبد آذرین')!;

  const mockLineage: LineageTemplate = {
    id: 'lin_roshan_del',
    scopeType: 'campaign',
    scopeId: 'c1',
    name: 'روشن‌دل',
    description: 'نژاد آزمایشی',
    size: 'Medium',
    speed: 30,
    abilityBonuses: {
      mode: 'fixed',
      fixed: { str: 2, con: 1 }
    },
    traits: [{ name: 'چشم بصیرت', description: 'دید در تاریکی' }],
    languages: ['مشترک', 'باستانی'],
    proficiencies: {
      skills: ['athletics'],
      weapons: [],
      armor: [],
      tools: []
    },
    tags: ['test'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  } as any;

  const mockBackground: BackgroundTemplate = {
    id: 'bg_sepah_salar',
    scopeType: 'campaign',
    scopeId: 'c1',
    name: 'سپاه‌سالار کهن',
    description: 'پیشینه آزمایشی',
    skillProficiencies: ['intimidation', 'history'],
    toolProficiencies: [],
    languages: ['مشترک'],
    startingEquipment: ['نشان افتخار', 'زره چرمی'],
    featureName: 'فرماندهی میدانی',
    featureDescription: 'ایجاد انگیزه در یاران.',
    personalityTables: { traits: [], ideals: [], bonds: [], flaws: [] },
    tags: ['military'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // -------------------------------------------------------------------------
  // 1. Identity Validation & Portrait Size Limit (≤150 KB)
  // -------------------------------------------------------------------------
  describe('Step 1: Identity & Lineage', () => {
    it('validates character name and allows clean identity', () => {
      const valid = validateIdentityStep({ name: 'رستم دستان' }, mockLineage, true);
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it('rejects empty character name', () => {
      const invalid = validateIdentityStep({ name: '   ' }, mockLineage, true);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain('نام کاراکتر الزامی است');
    });

    it('rejects portrait exceeding 150 KB quota', () => {
      // 200 KB dummy base64 string
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(270000);
      const invalid = validateIdentityStep({ name: 'سهراب', portraitUrl: largeBase64 }, mockLineage, true);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some(e => e.includes('۱۵۰ کیلوبایت'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Class Validation
  // -------------------------------------------------------------------------
  describe('Step 2: Class Selection', () => {
    it('validates class from allowed campaign classes', () => {
      const res = validateClassStep('فرهدار', [farhadar, mobad]);
      expect(res.valid).toBe(true);
    });

    it('rejects classes not allowed in the campaign', () => {
      const res = validateClassStep('جادوگر ناشناخته', [farhadar, mobad]);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('مجاز نیست');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Abilities Step: Standard Array, Point Buy, Rolls, Class Base & Bonuses
  // -------------------------------------------------------------------------
  describe('Step 3: Abilities & Point Buy / Rolls', () => {
    it('validates valid Standard Array allocation (15, 14, 13, 12, 10, 8)', () => {
      const scores = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
      const build: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {},
        equipmentChoices: {}
      };
      const res = validateAbilitiesStep('standard_array', scores, build, farhadar);
      expect(res.valid).toBe(true);
    });

    it('rejects invalid Standard Array numbers', () => {
      const invalidScores = { str: 16, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
      const build: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {},
        equipmentChoices: {}
      };
      const res = validateAbilitiesStep('standard_array', invalidScores, build, farhadar);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('مطابق با آرایه استاندارد');
    });

    it('validates 27-point Point Buy and rejects overspending', () => {
      // 15 (9pts) + 15 (9pts) + 15 (9pts) = 27pts, others 8 (0pts)
      const validPb = { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 };
      const build: CharacterBuild = {
        abilityMethod: 'point_buy',
        pointBuy: { scores: validPb, cost: 27 },
        skillChoices: {},
        equipmentChoices: {}
      };
      const resValid = validateAbilitiesStep('point_buy', validPb, build, farhadar);
      expect(resValid.valid).toBe(true);

      // Overspending: 15 (9pts) x 4 = 36pts (> 27)
      const overPb = { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 };
      const resOver = validateAbilitiesStep('point_buy', overPb, build, farhadar);
      expect(resOver.valid).toBe(false);
      expect(resOver.errors.some(e => e.includes('سقف مجاز'))).toBe(true);
    });

    it('validates server-side 4d6 drop-lowest rolls', () => {
      const recordedRolls = {
        dice: [[6, 5, 4, 1], [6, 6, 3, 2], [5, 4, 3, 1], [4, 4, 4, 1], [4, 3, 3, 1], [3, 3, 2, 1]],
        scores: [15, 15, 12, 12, 10, 8] // top 3 sum
      };
      const assigned = { str: 15, dex: 15, con: 12, int: 12, wis: 10, cha: 8 };
      const build: CharacterBuild = {
        abilityMethod: 'roll',
        rolls: { ...recordedRolls, assigned },
        skillChoices: {},
        equipmentChoices: {}
      };
      const res = validateAbilitiesStep('roll', assigned, build, farhadar);
      expect(res.valid).toBe(true);
    });

    it('applies fixed lineage ability bonuses to base scores', () => {
      const baseScores = { str: 14, dex: 12, con: 13, int: 10, wis: 10, cha: 8 };
      // mockLineage adds str +2, con +1
      const finalScores = calculateFinalAbilities(baseScores, mockLineage);
      expect(finalScores.str).toBe(16);
      expect(finalScores.dex).toBe(12);
      expect(finalScores.con).toBe(14);
      expect(finalScores.int).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Background & Skills with Source Tagging
  // -------------------------------------------------------------------------
  describe('Step 4: Background & Skills Source Tagging', () => {
    it('enforces exact class skill choice count and tags sources', () => {
      const build: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {
          fromClass: ['athletics', 'insight']
        },
        equipmentChoices: {}
      };

      const { result, taggedProficiencies } = validateBackgroundAndSkillsStep(
        build,
        farhadar,
        mockBackground,
        mockLineage
      );

      expect(result.valid).toBe(true);
      // Sources: lineage (athletics), background (intimidation, history), class (insight)
      const sources = taggedProficiencies.map(tp => tp.source);
      expect(sources).toContain('lineage');
      expect(sources).toContain('background');
      expect(sources).toContain('class');
    });

    it('rejects if player picks fewer or more skills than allowed by class', () => {
      const build: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {
          fromClass: ['athletics'] // farhadar requires 2
        },
        equipmentChoices: {}
      };

      const { result } = validateBackgroundAndSkillsStep(
        build,
        farhadar,
        mockBackground,
        mockLineage
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('مهارت از کلاس انتخاب کنید');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Equipment & Starter Weapon Tradeoffs
  // -------------------------------------------------------------------------
  describe('Step 5: Equipment & Special-vs-Showy Starter Weapons', () => {
    it('provides special weapon with mechanical recharge ability and showy with prestige', () => {
      expect(CANON_STARTER_WEAPONS).toHaveLength(2);

      const special = CANON_STARTER_WEAPONS.find(w => w.kind === 'special')!;
      expect(special.specialAbility).toBeDefined();
      expect(special.specialAbility?.usesPerRest).toBe(1);

      const showy = CANON_STARTER_WEAPONS.find(w => w.kind === 'showy')!;
      expect(showy.showyBonus).toBeDefined();
      expect(showy.showyBonus?.socialAdvantage).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Spells Validation
  // -------------------------------------------------------------------------
  describe('Step 6: Spells Validation', () => {
    it('skips spell validation for non-caster classes', () => {
      const nonCasterBuild: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {},
        equipmentChoices: {}
      };
      // Farhadar at level 1 has 0 slots
      const check = validateSpellsStep(nonCasterBuild, null, 1);
      expect(check.isCaster).toBe(false);
      expect(check.result.valid).toBe(true);
    });

    it('identifies spellcaster and checks cantrip limits for Mobad Azarin', () => {
      const casterBuild: CharacterBuild = {
        abilityMethod: 'standard_array',
        skillChoices: {},
        equipmentChoices: {},
        spellChoices: {
          cantrips: ['c1', 'c2', 'c3', 'c4', 'c5'] // exceeds limit 3
        }
      };
      const check = validateSpellsStep(casterBuild, mobad, 1);
      expect(check.isCaster).toBe(true);
      expect(check.result.valid).toBe(false);
      expect(check.result.errors[0]).toContain('فراتر رفته است');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Authoritative Recomputation Engine
  // -------------------------------------------------------------------------
  describe('Step 7 & 8: Authoritative Recomputation & Review', () => {
    it('recomputes derived stats authoritatively and honors approval.onCreate', () => {
      const build: CharacterBuild = {
        abilityMethod: 'standard_array',
        pointBuy: {
          scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }
        },
        skillChoices: {
          fromClass: ['athletics', 'insight']
        },
        equipmentChoices: {
          starterWeaponChoice: 'special_showy',
          starterWeaponId: 'w_special_sun_blade'
        }
      };

      // Scenario A: Campaign requires approval on create
      const outA = computeAuthoritativeParticipation({
        masterData: { name: 'فریدون', race: 'روشن‌دل' },
        build,
        campaignId: 'camp-1',
        campaignSettings: {
          units: 'feet',
          startingLevel: 1,
          maxEntryLevel: 20,
          abilityScoreMethods: ['standard_array', 'point_buy', 'roll'],
          approval: { onCreate: true, onLevelUp: false },
          backstoryVisibility: 'party',
          diceVisibility: 'table',
          allowPlayerRollPrivate: true,
          allowPlayerCreateCharacter: true,
          encounterDefaults: {
            showExactHp: false,
            showAc: false,
            showConditions: true,
            showDefeated: true,
            playerInitiativeRolls: true
          }
        },
        classTemplate: farhadar,
        lineageTemplate: mockLineage,
        backgroundTemplate: mockBackground,
        entryLevel: 1
      });

      expect(outA.validation.valid).toBe(true);
      expect(outA.participation.status).toBe('pending_approval');
      // STR: 15 + 2 (lineage) = 17 (+3)
      expect(outA.participation.abilityScores.str).toBe(17);
      // CON: 13 + 1 (lineage) = 14 (+2)
      expect(outA.participation.abilityScores.con).toBe(14);
      // Farhadar HP at level 1 with CON 14 (+2) is 12 (book table)
      expect(outA.participation.maxHp).toBe(12);
      expect(outA.participation.currentHp).toBe(12);
      // AC for Farhadar: base 14 + DEX mod (+2) = 16
      expect(outA.participation.savingThrows).toBeDefined();

      // Scenario B: Campaign allows immediate entry (approval.onCreate = false)
      const outB = computeAuthoritativeParticipation({
        masterData: { name: 'کیقباد' },
        build,
        campaignId: 'camp-1',
        campaignSettings: {
          units: 'feet',
          startingLevel: 1,
          maxEntryLevel: 20,
          abilityScoreMethods: ['standard_array'],
          approval: { onCreate: false, onLevelUp: false },
          backstoryVisibility: 'party',
          diceVisibility: 'table',
          allowPlayerRollPrivate: true,
          allowPlayerCreateCharacter: true,
          encounterDefaults: {
            showExactHp: false,
            showAc: false,
            showConditions: true,
            showDefeated: true,
            playerInitiativeRolls: true
          }
        },
        classTemplate: farhadar,
        lineageTemplate: mockLineage,
        backgroundTemplate: mockBackground,
        entryLevel: 1
      });

      expect(outB.participation.status).toBe('active');
    });
  });

  // -------------------------------------------------------------------------
  // 8. Snapshots Creation & 10-Item Retention Pruning
  // -------------------------------------------------------------------------
  describe('Snapshots & Retention Pruning', () => {
    it('creates a participation snapshot with play state and build JSON', () => {
      const mockPart: any = {
        id: 'part-123',
        level: 1,
        xp: 0,
        abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
        currentHp: 12,
        maxHp: 12,
        tempHp: 0,
        hitDice: { current: 1, max: 1, die: 'd10' },
        inventory: [],
        weapons: [],
        currency: { gold: 15, silver: 0, copper: 0 },
        customResources: [],
        features: [],
        build: { abilityMethod: 'standard_array', skillChoices: {}, equipmentChoices: {} }
      };

      const snap = createSnapshot(mockPart, 'آفرینش شخصیت', 'user-1');
      expect(snap.participationId).toBe('part-123');
      expect(snap.label).toBe('آفرینش شخصیت');
      expect(snap.state.maxHp).toBe(12);
      expect(snap.build.abilityMethod).toBe('standard_array');
    });

    it('prunes older snapshots keeping strictly the last 10 snapshots', () => {
      const snapshots: ParticipationSnapshot[] = [];
      const now = Date.now();

      // Create 15 snapshots with different timestamps
      for (let i = 1; i <= 15; i++) {
        snapshots.push({
          id: `snap-${i}`,
          participationId: 'part-123',
          label: `نسخه ${i}`,
          state: {},
          build: { abilityMethod: 'standard_array', skillChoices: {}, equipmentChoices: {} },
          level: 1,
          createdBy: 'user-1',
          createdAt: now + i * 1000
        });
      }

      const { kept, prunedIds } = pruneSnapshots(snapshots, 10);
      expect(kept).toHaveLength(10);
      expect(prunedIds).toHaveLength(5);
      // The newest snapshot should be retained
      expect(kept[0].id).toBe('snap-15');
      // The oldest 5 snapshots (snap-1 .. snap-5) should be pruned
      expect(prunedIds).toContain('snap-1');
      expect(prunedIds).toContain('snap-5');
    });
  });
});
