import { CampaignEndingState, AryamanDerivedState } from '../types';

export const INITIAL_ENDING_STATE: CampaignEndingState = {
  id: 'zorvania-endings',
  truthSources: {
    fairies: false,
    divs: false,
    kandavaran: false,
    mehzedegan: false,
    mobads: false,
    documents: false
  },
  aryamanTriggers: {
    shahbazFriendOrHigher: false,
    farrehMarkRevealed: false,
    divanzadPresent: true, // سامان در گروه حضور دارد
    emptyCrownOnFarrehDar: false,
    motherEmberMemory: false
  },
  embersPercentage: 15,
  motherEmberObtained: false,
  emberSources: [
    { name: 'اخگرهای تپنده درمانگاه باستانی ورنا', percentage: 15, collected: true },
    { name: 'اخگر چاه آذرین معبد گدازان', percentage: 25, collected: false },
    { name: 'اخگر برج خاکستر شن‌شین', percentage: 20, collected: false },
    { name: 'اخگر هسته سنگ‌خواب باغستان کهن', percentage: 20, collected: false },
    { name: 'اخگر مادر (سیاوش و شاهباز)', percentage: 20, collected: false }
  ],
  chaos: {
    brokenKeySeals: 0,
    mainAlliesDead: 0,
    ordersTurnedEnemy: 0,
    unrestrainedThreshold: false,
    reconciledOrdersOrSavedAllies: 0
  },
  secondHalfSealObtained: false,
  secondHalfSealMethod: 'none',
  notes: '',
  updatedAt: new Date().toISOString()
};

export function calculateTruthCount(sources: CampaignEndingState['truthSources']): number {
  return Object.values(sources).filter(Boolean).length;
}

export function calculateAryamanState(triggers: CampaignEndingState['aryamanTriggers']): {
  count: number;
  state: AryamanDerivedState;
  stateFa: string;
} {
  const count = Object.values(triggers).filter(Boolean).length;
  if (triggers.motherEmberMemory || count >= 4) {
    return { count, state: 'returned', stateFa: 'بازگشته (Redeemed)' };
  }
  if (count >= 2) {
    return { count, state: 'hesitant', stateFa: 'مردد (Hesitant)' };
  }
  return { count, state: 'locked', stateFa: 'قفل‌شده (Locked)' };
}

export function calculateChaosScore(chaos: CampaignEndingState['chaos']): number {
  const seals = Math.min(3, Math.max(0, chaos.brokenKeySeals));
  const alliesDead = Math.min(3, Math.max(0, chaos.mainAlliesDead));
  const ordersEnemy = Math.min(3, Math.max(0, chaos.ordersTurnedEnemy));
  const threshold = chaos.unrestrainedThreshold ? 1 : 0;
  const relief = Math.max(0, chaos.reconciledOrdersOrSavedAllies);

  const raw = seals + alliesDead + ordersEnemy + threshold - relief;
  return Math.max(0, Math.min(10, raw));
}

export interface EndingEvaluation {
  id: number;
  name: string;
  nameEn: string;
  requirements: string;
  available: boolean;
  notes: string;
  woundEffect?: string;
}

export function evaluateEndings(state: CampaignEndingState): EndingEvaluation[] {
  const truthCount = calculateTruthCount(state.truthSources);
  const chaosScore = calculateChaosScore(state.chaos);
  const aryaman = calculateAryamanState(state.aryamanTriggers);

  const completeSeal = state.secondHalfSealObtained; // Full seal when second half is obtained
  const hasWound = chaosScore >= 4 && chaosScore <= 6;
  const forcedFall = chaosScore >= 7;

  const woundText = hasWound
    ? 'دارای زخم سرنوشت (آشفتگی بین ۴ تا ۶ باعث بر جای ماندن شکافی دردناک در جهان می‌شود)'
    : undefined;

  const endings: EndingEvaluation[] = [
    {
      id: 1,
      name: 'پایان ۱: مهر (Mahr)',
      nameEn: 'Complete Seal',
      requirements: 'مهر کامل (دستیابی به نیمه دوم مهر آریامن)',
      available: completeSeal && !forcedFall,
      notes: 'تثبیت زمان و بازگشت نظم از طریق قفل شدن کامل درهای منشور.',
      woundEffect: woundText
    },
    {
      id: 2,
      name: 'پایان ۲: رهایی (Deliverance)',
      nameEn: 'Deliverance',
      requirements: 'مهر کامل (دستیابی به نیمه دوم مهر آریامن)',
      available: completeSeal && !forcedFall,
      notes: 'آزادسازی جریان‌های دربند و پایان بخشیدن به تسلط کهن.',
      woundEffect: woundText
    },
    {
      id: 3,
      name: 'پایان ۳: یک‌قطبی (Unipolar)',
      nameEn: 'Unipolar Order',
      requirements: 'مهر کامل و شکستن نشان یکی از دو نیروی حاکم',
      available: completeSeal && !forcedFall,
      notes: 'تک‌حاکمیتی یکی از فرایض؛ غلبه کامل یک قطب بر جهان.',
      woundEffect: woundText
    },
    {
      id: 4,
      name: 'پایان ۴: موازنه‌گاه (The Equilibrium)',
      nameEn: 'The Equilibrium',
      requirements: 'مهر کامل + حقیقت حداقل ۳ از ۶ + حداقل سه رکن بنیادین',
      available: completeSeal && truthCount >= 3 && !forcedFall,
      notes: 'برقراری تعادل ظریف میان زمان، جادو و ماده با اتکا بر حقایق کشف‌شده.',
      woundEffect: woundText
    },
    {
      id: 5,
      name: 'پایان ۵: سازگاری (Harmony)',
      nameEn: 'Compatibility & Harmony',
      requirements: 'مهر کامل و جلب اعتماد مهزادگان (Mehzedegan)',
      available: completeSeal && state.truthSources.mehzedegan && !forcedFall,
      notes: 'پیوند میان پریان، انسان‌ها و مهزادگان در یک نظم نو.',
      woundEffect: woundText
    },
    {
      id: 6,
      name: 'پایان ۶: بازگشت فره (Return of the Farreh)',
      nameEn: 'Return of the Farreh',
      requirements: 'حقیقت موبدان و اسناد + یاقوت آذر + چاه آذرین + اخگرها ≥ ۶۰٪',
      available:
        state.truthSources.mobads &&
        state.truthSources.documents &&
        state.embersPercentage >= 60 &&
        !forcedFall,
      notes: 'احیای کامل روشنایی کهن و نور مقدس فره در سراسر زروانیا.',
      woundEffect: woundText
    },
    {
      id: 7,
      name: 'پایان ۷: سقوط (The Fall)',
      nameEn: 'The Fall & Collapse',
      requirements: 'شکست در کامل‌سازی پایان‌ها یا رسیدن سطح آشفتگی به ۷ یا بالاتر',
      available: forcedFall || (!completeSeal && state.embersPercentage < 60),
      notes: forcedFall
        ? 'آشفتگی به سطح بحرانی (≥۷) رسیده و پایان سقوط را به جهان تحمیل کرده است!'
        : 'در صورت عدم تحقق شرایط پایان‌های ۱ تا ۶، جهان به ورطه فروپاشی زمانی می‌افتد.'
    }
  ];

  return endings;
}
