import { describe, it, expect } from 'vitest';
import { 
  LineageTemplate, BackgroundTemplate, ClassTemplate, 
  EquipmentChoiceGroup, CompanionDef 
} from '../../src/types';
import { 
  SEED_CLASS_TEMPLATES, 
  SEED_LINEAGE_TEMPLATES, 
  SEED_BACKGROUND_TEMPLATES 
} from '../../src/data/seed';
import { 
  computeMaxHp, computeSlots, computeClassResources, computeAC 
} from './engine';
import { 
  previewClone, executeClone, CloneEntityBundle 
} from '../../src/services/cloneEngine';

describe('Templates & Editors - Step 3.2 Unit Tests', () => {
  // -------------------------------------------------------------------------
  // 1. Lineage Templates Schema & Validation
  // -------------------------------------------------------------------------
  describe('Lineage Templates Structure', () => {
    it('creates a valid lineage template with traits, abilityBonuses, and sublineages', () => {
      const lineage: LineageTemplate = {
        id: 'lin_elf_test',
        scopeType: 'campaign',
        scopeId: 'c1',
        name: 'الف (Elf)',
        description: 'مردمانی بلندقامت با عمری طولانی و چشمان تیزبین.',
        size: 'Medium',
        speed: 30,
        abilityBonuses: {
          mode: 'choose',
          chooseCount: 2,
          chooseValue: 1
        },
        traits: [
          { name: 'دید در تاریکی (Darkvision)', description: 'دید تا ۶۰ فوت در تاریکی.', usage: 'passive' },
          { name: 'حواس بیدار', description: 'تسلط در مهارت ادراک.', usage: 'passive' }
        ],
        languages: ['مشترک', 'الفی'],
        proficiencies: {
          skills: ['perception'],
          weapons: ['کمان کوتاه', 'شمشیر بلند'],
          armor: [],
          tools: []
        },
        resistances: ['افسون (Charmed)'],
        senses: ['Darkvision 60ft'],
        sublineages: [
          {
            name: 'الف علیا (High Elf)',
            description: 'مسلط به یک ترفند جادویی کهن.',
            traits: [{ name: 'ترفند جادوگری', description: 'انتخاب یک ترفند از لیست جادوگر.' }]
          }
        ],
        nameSuggestions: ['آرون', 'الیندور', 'سلیستیا'],
        backstoryPrompts: ['خاطره‌ای از جنگ کهن جنگل سپیدار...'],
        tags: ['core', 'lineage'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(lineage.name).toBe('الف (Elf)');
      expect(lineage.abilityBonuses.mode).toBe('choose');
      expect(lineage.traits).toHaveLength(2);
      expect(lineage.sublineages?.[0].name).toBe('الف علیا (High Elf)');
      expect(lineage.proficiencies.skills).toContain('perception');
      expect(lineage.languages).toContain('الفی');
    });

    it('supports fixed ability score bonuses for standard lineages', () => {
      const fixedLineage: LineageTemplate = {
        id: 'lin_dwarf_test',
        scopeType: 'campaign',
        scopeId: 'c1',
        name: 'کوتوله (Dwarf)',
        size: 'Medium',
        speed: 25,
        abilityBonuses: {
          mode: 'fixed',
          fixed: { con: 2 }
        },
        traits: [{ name: 'سرسختی کوتوله‌ها', description: 'مقاومت در برابر سم.' }],
        languages: ['مشترک', 'کوتوله‌ای'],
        proficiencies: { skills: [], weapons: ['تبرجنگی'], armor: [], tools: ['ابزار آهنگری'] },
        tags: ['lineage'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(fixedLineage.abilityBonuses.mode).toBe('fixed');
      expect(fixedLineage.abilityBonuses.fixed?.con).toBe(2);
      expect(fixedLineage.speed).toBe(25);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Background Templates Schema & Validation
  // -------------------------------------------------------------------------
  describe('Background Templates Structure', () => {
    it('creates a valid background template with personality tables and features', () => {
      const bg: BackgroundTemplate = {
        id: 'bg_soldier_test',
        scopeType: 'campaign',
        scopeId: 'c1',
        name: 'سرباز (Soldier)',
        description: 'شما در خدمت ارتش یا دسته‌های نگهبانی خدمت کرده‌اید.',
        skillProficiencies: ['athletics', 'intimidation'],
        toolProficiencies: ['ابزار تاس‌بازی', 'وسایل نقلیه زمینی'],
        languages: ['مشترک'],
        startingEquipment: ['نشان درجه نظامی', 'دست لباس ساده', '۱۰ سکه طلا'],
        featureName: 'درجه نظامی (Military Rank)',
        featureDescription: 'سربازان هم‌رتبه یا رده‌پایین‌تر از دستورات معقول شما پیروی می‌کنند.',
        personalityTables: {
          traits: ['من همیشه برای محافظت از همرزمانم آماده‌ام.'],
          ideals: ['وفاداری به پرچم بالاتر از جان است.'],
          bonds: ['شمشیر فرمانده سابقم همواره همراه من است.'],
          flaws: ['در مواجهه با خیانت کنترلم را از دست می‌دهم.']
        },
        tags: ['background', 'military'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(bg.name).toBe('سرباز (Soldier)');
      expect(bg.skillProficiencies).toContain('athletics');
      expect(bg.skillProficiencies).toContain('intimidation');
      expect(bg.personalityTables.ideals).toHaveLength(1);
      expect(bg.featureName).toBe('درجه نظامی (Military Rank)');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Extended Class Templates & Seed Compliance
  // -------------------------------------------------------------------------
  describe('Extended Class Templates & Seed Compliance', () => {
    it('verifies seed packs lineages and backgrounds are empty (no invented lore)', () => {
      // Zorvania lore requirement: lineages and backgrounds must stay EMPTY
      expect(SEED_LINEAGE_TEMPLATES).toEqual([]);
      expect(SEED_BACKGROUND_TEMPLATES).toEqual([]);
    });

    it('verifies all 6 canon classes in SEED_CLASS_TEMPLATES have structured fields', () => {
      expect(SEED_CLASS_TEMPLATES).toHaveLength(6);

      const classNames = SEED_CLASS_TEMPLATES.map(c => c.name);
      expect(classNames).toContain('فرهدار');
      expect(classNames).toContain('موبد آذرین');
      expect(classNames).toContain('دیوانزاد');
      expect(classNames).toContain('پیمانبان');
      expect(classNames).toContain('سایهخوان');
      expect(classNames).toContain('مهآشنا');

      for (const cls of SEED_CLASS_TEMPLATES) {
        // Structured AC formula present
        expect(cls.acFormula).toBeDefined();
        expect(typeof cls.acFormula?.base).toBe('number');
        expect(Array.isArray(cls.acFormula?.abilityMods)).toBe(true);

        // Fixed HP table 1..20
        expect(cls.fixedHpByLevel).toBeDefined();
        expect(Array.isArray(cls.fixedHpByLevel)).toBe(true);
        expect(cls.fixedHpByLevel?.length).toBe(20);

        // Starting equipment choice groups
        expect(cls.startingEquipmentChoices).toBeDefined();
        expect(Array.isArray(cls.startingEquipmentChoices)).toBe(true);
        expect(cls.startingEquipmentChoices!.length).toBeGreaterThan(0);
      }
    });

    it('verifies specific structured AC formulas for canon classes', () => {
      const farhadar = SEED_CLASS_TEMPLATES.find(c => c.name === 'فرهدار');
      expect(farhadar?.acFormula).toEqual({
        base: 14,
        abilityMods: ['dex'],
        unarmored: false,
        note: 'زره متوسط ورنا (14 + DEX mod تا سقف ۲)'
      });

      const mobad = SEED_CLASS_TEMPLATES.find(c => c.name === 'موبد آذرین');
      expect(mobad?.acFormula).toEqual({
        base: 10,
        abilityMods: ['dex', 'wis'],
        unarmored: true,
        note: 'محافظ هامون (10 + DEX mod + WIS mod بدون زره)'
      });
    });

    it('verifies companions in دیوانزاد class template', () => {
      const divanzad = SEED_CLASS_TEMPLATES.find(c => c.name === 'دیوانزاد');
      expect(divanzad?.companions).toBeDefined();
      expect(divanzad?.companions?.length).toBeGreaterThan(0);
      const companion = divanzad?.companions?.[0];
      expect(companion?.name).toBe('سازه همراه');
      expect(companion?.type).toBe('حیوان و روح طبیعت');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Validation Panel Rules Engine Computations (Levels 1, 5, 11, 20)
  // -------------------------------------------------------------------------
  describe('Validation Panel Rules Engine Computations', () => {
    const farhadar = SEED_CLASS_TEMPLATES.find(c => c.name === 'فرهدار')!;
    const mobad = SEED_CLASS_TEMPLATES.find(c => c.name === 'موبد آذرین')!;

    const abilities = { str: 16, dex: 14, con: 14, int: 10, wis: 14, cha: 12 };

    it('evaluates AC, HP, spell slots, and resources for Farhadar at levels 1, 5, 11, 20', () => {
      const hp1 = computeMaxHp({ level: 1, className: farhadar.name, classTemplate: farhadar, abilities });
      const hp5 = computeMaxHp({ level: 5, className: farhadar.name, classTemplate: farhadar, abilities });
      const hp11 = computeMaxHp({ level: 11, className: farhadar.name, classTemplate: farhadar, abilities });
      const hp20 = computeMaxHp({ level: 20, className: farhadar.name, classTemplate: farhadar, abilities });

      expect(hp1).toBe(12);
      expect(hp5).toBe(44);
      expect(hp11).toBe(92);
      expect(hp20).toBe(164);

      // AC for Farhadar: base 14 + DEX mod (+2) = 16; with shield = 18
      const acUnshielded = computeAC({
        acFormula: farhadar.acFormula,
        className: farhadar.name,
        abilities
      });
      expect(acUnshielded).toBe(16);

      const acWithShield = computeAC({
        acFormula: farhadar.acFormula,
        className: farhadar.name,
        abilities,
        hasShield: true
      });
      expect(acWithShield).toBe(18);

      // Spell slots (Half-caster)
      const slotsLvl5 = computeSlots(farhadar.name, 5);
      expect(slotsLvl5).toEqual([4, 2]);

      // Class resources (Divine Smite unlocked at level 2+)
      const resLvl1 = computeClassResources(farhadar.name, 1, abilities);
      expect(resLvl1['divine_smite'].max).toBe(0);

      const resLvl5 = computeClassResources(farhadar.name, 5, abilities);
      expect(resLvl5['divine_smite'].max).toBe(1);
      expect(resLvl5['divine_smite'].currentDice).toBe('3d8');
    });

    it('evaluates unarmored AC and full spell slots for Mobad Azarin', () => {
      // Mobad: base 10 + DEX mod (+2) + WIS mod (+2) = 14
      const ac = computeAC({
        acFormula: mobad.acFormula,
        className: mobad.name,
        abilities
      });
      expect(ac).toBe(14);

      // Full-caster slots at level 5: 4 / 3 / 2
      const slotsLvl5 = computeSlots(mobad.name, 5);
      expect(slotsLvl5).toEqual([4, 3, 2]);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Clone Engine Support for Lineage and Background Templates
  // -------------------------------------------------------------------------
  describe('Clone Engine Support for Lineages and Backgrounds', () => {
    const testLineage: LineageTemplate = {
      id: 'lin_source_1',
      scopeType: 'pack',
      scopeId: 'pack_src',
      name: 'نژاد نمونه',
      size: 'Medium',
      speed: 30,
      abilityBonuses: { mode: 'choose', chooseCount: 1, chooseValue: 2 },
      traits: [{ name: 'دید در شب' }],
      languages: ['مشترک'],
      proficiencies: { skills: ['stealth'], weapons: [], armor: [], tools: [] },
      tags: ['test'],
      createdAt: 1000,
      updatedAt: 1000
    };

    const testBackground: BackgroundTemplate = {
      id: 'bg_source_1',
      scopeType: 'pack',
      scopeId: 'pack_src',
      name: 'پیشینه نمونه',
      skillProficiencies: ['insight'],
      toolProficiencies: [],
      languages: ['مشترک'],
      startingEquipment: ['کتاب'],
      featureName: 'آشنایی با متون',
      featureDescription: 'خواندن سریع کتب.',
      personalityTables: { traits: [], ideals: [], bonds: [], flaws: [] },
      tags: ['test'],
      createdAt: 1000,
      updatedAt: 1000
    };

    const sourceBundle: CloneEntityBundle = {
      locations: [],
      npcs: [],
      items: [],
      encounters: [],
      classTemplates: [],
      lineageTemplates: [testLineage],
      backgroundTemplates: [testBackground],
      featureTemplates: [],
      weaponTemplates: [],
      rewards: [],
      factions: [],
      campaignDocs: [],
      genericCalendars: [],
      ruleSets: []
    };

    const targetBundle: CloneEntityBundle = {
      locations: [],
      npcs: [],
      items: [],
      encounters: [],
      classTemplates: [],
      lineageTemplates: [],
      backgroundTemplates: [],
      featureTemplates: [],
      weaponTemplates: [],
      rewards: [],
      factions: [],
      campaignDocs: [],
      genericCalendars: [],
      ruleSets: []
    };

    const cloneReq = {
      source: {
        scopeType: 'pack' as const,
        scopeId: 'pack_src',
        entityRefs: [
          { type: 'lineage_template' as const, id: 'lin_source_1' },
          { type: 'background_template' as const, id: 'bg_source_1' }
        ]
      },
      target: {
        scopeType: 'campaign' as const,
        scopeId: 'camp_target'
      },
      options: {
        includeDependencies: 'none' as const,
        includeChildren: false,
        stripDmSecrets: false,
        resetState: true,
        visibility: 'revealed' as const,
        nameConflict: 'rename' as const,
        keepLink: 'copy' as const
      }
    };

    it('previews cloning of lineage and background templates', () => {
      const manifest = previewClone(cloneReq, sourceBundle, targetBundle);

      expect(manifest.totalCount).toBe(2);
      expect(manifest.items).toHaveLength(2);
      expect(manifest.items.map(i => i.type)).toContain('lineage_template');
      expect(manifest.items.map(i => i.type)).toContain('background_template');
    });

    it('executes clone creating new campaign-scoped entities with updated scopeId', () => {
      const result = executeClone(cloneReq, sourceBundle, targetBundle);

      expect(result.createdEntities.lineageTemplates).toHaveLength(1);
      const createdLineage = result.createdEntities.lineageTemplates[0];
      expect(createdLineage.name).toBe('نژاد نمونه');
      expect(createdLineage.scopeType).toBe('campaign');
      expect(createdLineage.scopeId).toBe('camp_target');
      expect(createdLineage.sourceMode).toBe('copy');

      expect(result.createdEntities.backgroundTemplates).toHaveLength(1);
      const createdBg = result.createdEntities.backgroundTemplates[0];
      expect(createdBg.name).toBe('پیشینه نمونه');
      expect(createdBg.scopeType).toBe('campaign');
      expect(createdBg.scopeId).toBe('camp_target');
      expect(createdBg.sourceMode).toBe('copy');
    });
  });
});
