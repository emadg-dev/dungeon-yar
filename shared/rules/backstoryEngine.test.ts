import { describe, it, expect } from 'vitest';
import {
  getBackstoryPrompts,
  rollPersonalityFromBackground,
  filterBackstoryForViewer,
  pruneCharacterRevisions,
  computeBackstoryCompleteness
} from './backstoryEngine';
import { MasterBackstory, CharacterRevision, BackgroundTemplate, LineageTemplate } from '../../src/types';

describe('Backstory Engine (Step 3.5)', () => {
  const sampleBackstory: MasterBackstory = {
    summary: 'ماجراجویی دلیر از ورنا',
    origin: 'متولد روستایی کوچک در نزدیکی جنگل سپیدار',
    personality: {
      traits: 'همیشه آرام و خونسرد',
      ideals: 'آزادی برای همه موجودات',
      bonds: 'شمشیر پدربزرگ',
      flaws: 'بیش از حد به غریبه‌ها اعتماد می‌کند'
    },
    goals: 'یافتن داروی درمان برادر',
    relationships: [
      { name: 'استاد بهرام', note: 'مربی شمشیرزنی', shareWithParty: true },
      { name: 'جاسوس دربار', note: 'رابط مخفی', shareWithParty: false }
    ],
    timeline: [
      { label: '۱۴۹۰', text: 'آغاز تمرینات رزمی', shareWithParty: true },
      { label: '۱۴۹۸', text: 'تبعید مخفیانه', shareWithParty: false }
    ],
    sections: [
      { id: 'sec-1', title: 'خاطره کودکی', text: 'روزی در جنگل...', shareWithParty: true },
      { id: 'sec-2', title: 'پیمان با سایه‌ها', text: 'سوگندی تاریک...', shareWithParty: false }
    ],
    dmOnly: {
      secrets: 'دارای خون دیوانزاد پنهان',
      hooks: 'یک گردنبند عتیقه با نشان خاندان شاهباز'
    }
  };

  it('provides default prompts and lineage specific prompts', () => {
    const mockLineage: LineageTemplate = {
      id: 'lin-1',
      name: 'پریان',
      size: 'متوسط',
      speed: 30,
      abilityBonuses: { mode: 'fixed' },
      traits: [],
      languages: ['فارسی'],
      proficiencies: { skills: [], weapons: [], armor: [], tools: [] },
      backstoryPrompts: ['چرا جنگل باستانی را ترک گفتید؟'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const res = getBackstoryPrompts(mockLineage);
    expect(res.prompts.origin.length).toBeGreaterThan(0);
    expect(res.lineageSpecific).toContain('چرا جنگل باستانی را ترک گفتید؟');
  });

  it('rolls personality items from background tables', () => {
    const mockBg: BackgroundTemplate = {
      id: 'bg-1',
      name: 'کاتب',
      description: 'ثبت‌کننده تاریخ',
      skillProficiencies: [],
      toolProficiencies: [],
      languages: [],
      startingEquipment: [],
      featureName: 'پژوهشگر',
      featureDescription: 'دسترسی به کتابخانه‌ها',
      personalityTables: {
        traits: ['کتاب‌خوان', 'ساکت'],
        ideals: ['دانش', 'حقیقت'],
        bonds: ['کتابخانه ملی', 'استاد پیر'],
        flaws: ['ترسو', 'حواس‌پرت']
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const trait = rollPersonalityFromBackground(mockBg, 'traits');
    expect(['کتاب‌خوان', 'ساکت']).toContain(trait);

    const empty = rollPersonalityFromBackground(null, 'traits');
    expect(empty).toBeNull();
  });

  it('filters backstory for owner or DM correctly (full access)', () => {
    const forOwner = filterBackstoryForViewer({
      backstory: sampleBackstory,
      isOwner: true,
      isDm: false
    });
    expect(forOwner.dmOnly.secrets).toBe('دارای خون دیوانزاد پنهان');
    expect(forOwner.sections.length).toBe(2);

    const forDm = filterBackstoryForViewer({
      backstory: sampleBackstory,
      isOwner: false,
      isDm: true
    });
    expect(forDm.dmOnly.hooks).toBe('یک گردنبند عتیقه با نشان خاندان شاهباز');
    expect(forDm.sections.length).toBe(2);
  });

  it('filters backstory for party members (strips DM secrets and unshared sections)', () => {
    const forParty = filterBackstoryForViewer({
      backstory: sampleBackstory,
      isOwner: false,
      isDm: false,
      campaignBackstoryVisibility: 'party'
    });

    // DM secrets stripped
    expect(forParty.dmOnly.secrets).toBe('');
    expect(forParty.dmOnly.hooks).toBe('');

    // Only shared sections remain
    expect(forParty.sections.length).toBe(1);
    expect(forParty.sections[0].id).toBe('sec-1');

    // Only shared relationships remain
    expect(forParty.relationships.length).toBe(1);
    expect(forParty.relationships[0].name).toBe('استاد بهرام');

    // Only shared timeline entries remain
    expect(forParty.timeline.length).toBe(1);
    expect(forParty.timeline[0].label).toBe('۱۴۹۰');
  });

  it('respects campaign dm_only visibility setting for players', () => {
    const forPlayerDmOnly = filterBackstoryForViewer({
      backstory: sampleBackstory,
      isOwner: false,
      isDm: false,
      campaignBackstoryVisibility: 'dm_only'
    });

    expect(forPlayerDmOnly.summary).toBe('ماجراجویی دلیر از ورنا');
    expect(forPlayerDmOnly.origin).toBe('');
    expect(forPlayerDmOnly.sections).toEqual([]);
    expect(forPlayerDmOnly.dmOnly.secrets).toBe('');
  });

  it('prunes revisions keeping only the last N (default 10)', () => {
    const revisions: CharacterRevision[] = Array.from({ length: 15 }, (_, i) => ({
      id: `rev-${i}`,
      characterId: 'char-1',
      backstory: sampleBackstory,
      changedBy: 'user-1',
      createdAt: 1000 + i * 10
    }));

    const pruned = pruneCharacterRevisions(revisions, 10);
    expect(pruned.length).toBe(10);
    expect(pruned[0].id).toBe('rev-14'); // Most recent
    expect(pruned[9].id).toBe('rev-5');
  });

  it('computes backstory completeness accurately', () => {
    const complete = computeBackstoryCompleteness(sampleBackstory);
    expect(complete.percentage).toBe(100);
    expect(complete.passedChecks).toBe(5);

    const incomplete = computeBackstoryCompleteness({
      summary: 'تنها خلاصه دارد',
      origin: '',
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      goals: '',
      relationships: [],
      timeline: [],
      sections: [],
      dmOnly: { secrets: '', hooks: '' }
    });
    expect(incomplete.percentage).toBe(20);
    expect(incomplete.passedChecks).toBe(1);
  });
});
