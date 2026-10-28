import { MasterBackstory, LineageTemplate, BackgroundTemplate, CharacterRevision, BackstorySection } from '../../src/types';

export interface BackstoryPromptGuide {
  summary: string[];
  origin: string[];
  goals: string[];
  relationships: string[];
  timeline: string[];
  secrets: string[];
  hooks: string[];
}

export const DEFAULT_BACKSTORY_PROMPTS: BackstoryPromptGuide = {
  summary: [
    'شخصیت شما در یک بند چگونه توصیف می‌شود؟ چه چیز او را از دیگران متمایز می‌کند؟',
    'چه خصلت یا باوری در نگاه اول نظر دیگران را به او جلب می‌کند؟'
  ],
  origin: [
    'زادگاه شما کجاست؟ در چه خاندانی یا تحت چه شرایطی بزرگ شدید؟',
    'چه حادثه یا نقطه عطفی سبب شد خانه و کاشانه را ترک کنید و به ماجراجویی روی آورید؟',
    'چه کسی در دوران رشد بیشترین تاثیر را بر منش و تصمیمات شما گذاشت؟'
  ],
  goals: [
    'هدف کوتاه‌مدت و ملموس شما در این سفر چیست؟',
    'آرزوی نهایی یا پاداش غایی که در پایان راه می‌جویید چیست؟'
  ],
  relationships: [
    'آیا دوستی وفادار، خاندانی چشم‌به‌راه، یا رقیبی دیرینه در جهان بازی دارید؟',
    'چه پیوندی شما را به مردم یا گروه‌های محلی متصل می‌سازد؟'
  ],
  timeline: [
    'سه رویداد برجسته زندگی خود پیش از ورود به این ماجرا را با تاریخ یا مقطع زمانی بنویسید.'
  ],
  secrets: [
    'رازی از گذشته شما که نباید به گوش هم‌گروهی‌ها برسد چیست؟',
    'چه عهدی بسته‌اید یا چه اشتباهی مرتکب شده‌اید که از برملا شدنش هراس دارید؟'
  ],
  hooks: [
    'چه بدهی، عهد، شیء گمشده یا خصومتی دارید که دانجن مستر می‌تواند در داستان ماجراجویی به کار گیرد؟'
  ]
};

/**
 * Returns merged prompts for a character based on their lineage and default prompts.
 */
export function getBackstoryPrompts(lineage?: LineageTemplate | null): {
  prompts: BackstoryPromptGuide;
  lineageSpecific: string[];
} {
  const lineageSpecific = lineage?.backstoryPrompts || [];
  return {
    prompts: DEFAULT_BACKSTORY_PROMPTS,
    lineageSpecific
  };
}

/**
 * Rolls or selects a random entry from a background's personality table.
 */
export function rollPersonalityFromBackground(
  bg: BackgroundTemplate | null | undefined,
  type: 'traits' | 'ideals' | 'bonds' | 'flaws'
): string | null {
  if (!bg?.personalityTables) return null;
  const list = bg.personalityTables[type];
  if (!list || list.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Enforces server-side privacy & visibility rules for backstories.
 * Non-owners and non-DMs never receive dmOnly fields or unshared sections.
 */
export function filterBackstoryForViewer(params: {
  backstory: MasterBackstory;
  isOwner: boolean;
  isDm: boolean;
  campaignBackstoryVisibility?: 'dm_only' | 'party';
}): MasterBackstory {
  const { backstory, isOwner, isDm, campaignBackstoryVisibility = 'party' } = params;

  // Owners and DMs have full visibility
  if (isOwner || isDm) {
    return { ...backstory };
  }

  // If campaign policy restricts backstory to DM-only, party members see sanitized stub
  if (campaignBackstoryVisibility === 'dm_only') {
    return {
      summary: backstory.summary || '',
      origin: '',
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      goals: '',
      relationships: [],
      timeline: [],
      sections: [],
      dmOnly: { secrets: '', hooks: '' }
    };
  }

  // Party members see only sections marked shareWithParty
  const filteredSections: BackstorySection[] = (backstory.sections || []).filter(s => s.shareWithParty);
  const filteredRelationships = (backstory.relationships || []).filter(r => (r as any).shareWithParty !== false);
  const filteredTimeline = (backstory.timeline || []).filter(t => (t as any).shareWithParty !== false);

  return {
    ...backstory,
    sections: filteredSections,
    relationships: filteredRelationships,
    timeline: filteredTimeline,
    dmOnly: {
      secrets: '',
      hooks: ''
    }
  };
}

/**
 * Keeps the most recent N revisions of a character's backstory (default 10).
 */
export function pruneCharacterRevisions(
  revisions: CharacterRevision[],
  max: number = 10
): CharacterRevision[] {
  const sorted = [...revisions].sort((a, b) => b.createdAt - a.createdAt);
  return sorted.slice(0, max);
}

/**
 * Evaluates completion percentage and missing parts for the backstory.
 */
export function computeBackstoryCompleteness(backstory?: MasterBackstory | null): {
  percentage: number;
  totalChecks: number;
  passedChecks: number;
  checklist: { label: string; passed: boolean; optional?: boolean }[];
} {
  if (!backstory) {
    return {
      percentage: 0,
      totalChecks: 6,
      passedChecks: 0,
      checklist: [
        { label: 'خلاصه هویت', passed: false },
        { label: 'خاستگاه و زادگاه', passed: false },
        { label: 'ارکان شخصیتی (ویژگی، آرمان، پیوند، نقص)', passed: false },
        { label: 'اهداف ماجراجو', passed: false },
        { label: 'ارتباطات و همراهان', passed: false },
        { label: 'رازها یا قلاب‌های DM', passed: false, optional: true }
      ]
    };
  }

  const p = backstory.personality || {};
  const personalityComplete = Boolean(
    p.traits?.trim() && p.ideals?.trim() && p.bonds?.trim() && p.flaws?.trim()
  );

  const checklist = [
    { label: 'خلاصه هویت', passed: Boolean(backstory.summary?.trim()) },
    { label: 'خاستگاه و زادگاه', passed: Boolean(backstory.origin?.trim()) },
    { label: 'ارکان شخصیتی (ویژگی، آرمان، پیوند، نقص)', passed: personalityComplete },
    { label: 'اهداف ماجراجو', passed: Boolean(backstory.goals?.trim()) },
    { label: 'ارتباطات و همراهان', passed: (backstory.relationships?.length || 0) > 0 },
    { label: 'رازها یا قلاب‌های DM', passed: Boolean(backstory.dmOnly?.secrets?.trim() || backstory.dmOnly?.hooks?.trim()), optional: true }
  ];

  const coreChecks = checklist.filter(c => !c.optional);
  const passedCore = coreChecks.filter(c => c.passed).length;
  const percentage = Math.round((passedCore / coreChecks.length) * 100);

  return {
    percentage,
    totalChecks: coreChecks.length,
    passedChecks: passedCore,
    checklist
  };
}
