import type { GenericCalendarData } from '../../src/types';

/**
 * 1. شاه‌روزان زروانیا (تقویم رسمی سرزمین زروانیا)
 * ۱۲ ماه ۳۰ روزه + ۵ روز گاه‌انبار (برون‌گاه) در انتهای سال = ۳۶۵ روز
 */
export const TEMPLATE_SHAHROOZAN_ZORVANIA: GenericCalendarData = {
  id: 'cal-template-zorvania',
  name: 'گاه‌شمار شاه‌روزان (زروانیا)',
  eraLabel: 'پ.ر.ن',
  startYear: 1500,
  scopeType: 'pack',
  tags: ['قالب', 'زروانیا', 'پیش‌فرض'],
  anchor: {
    weekdayIndex: 0 // شنبه
  },
  months: [
    { name: 'فرهان', days: 30, season: 'بهار' },
    { name: 'زروان', days: 30, season: 'بهار' },
    { name: 'ورنان', days: 30, season: 'بهار' },
    { name: 'آریامان', days: 30, season: 'تابستان' },
    { name: 'دیوگان', days: 30, season: 'تابستان' },
    { name: 'گدازان', days: 30, season: 'تابستان' },
    { name: 'پیمان', days: 30, season: 'پاییز' },
    { name: 'کندان', days: 30, season: 'پاییز' },
    { name: 'مهگان', days: 30, season: 'پاییز' },
    { name: 'یخبندان', days: 30, season: 'زمستان' },
    { name: 'آذران', days: 30, season: 'زمستان' },
    { name: 'واپسان', days: 30, season: 'زمستان' }
  ],
  offDays: [
    { id: 'off-1', name: 'روز لرزش', folkBelief: 'سکوت میان جهان‌ها؛ دیوان در کوه‌ها آرام می‌گیرند.' },
    { id: 'off-2', name: 'روز گمگشتگی آب', folkBelief: 'راکد شدن چشمه‌ها و پالایش آب پاک.' },
    { id: 'off-3', name: 'روز بینامی', folkBelief: 'پرهیز از بردن نام زندگان برای گریز از سایه‌ها.' },
    { id: 'off-4', name: 'روز خاموشی آتش', folkBelief: 'خاکستر نشستن آتشدان‌ها برای نوسازی اخگر.' },
    { id: 'off-5', name: 'روز بند', folkBelief: 'بستن روبان‌های کهربایی و عهد و پیمان بهار نو.' }
  ],
  festivals: [
    { name: 'جشن فرهگان', monthIndex: 1, day: 1, durationDays: 1, note: 'آغاز بهار و نوروز کهن زروانیا' },
    { name: 'جشن زروانگان', monthIndex: 2, day: 15, durationDays: 1, note: 'پیمان دارایی و دادگری' },
    { name: 'جشن ورناگان', monthIndex: 3, day: 30, durationDays: 1, note: 'پیشواز تابستان' },
    { name: 'جشن آریامانگان', monthIndex: 4, day: 10, durationDays: 1, note: 'پاسداشت پیوند و دوستی' },
    { name: 'جشن دیوانگان', monthIndex: 5, day: 20, durationDays: 1, note: 'آشتی با نیروهای باستانی کوهستان' },
    { name: 'جشن گدازگان', monthIndex: 6, day: 30, durationDays: 1, note: 'پایان تابستان و آغاز خنکای کویر' },
    { name: 'جشن پیمانگان', monthIndex: 7, day: 16, durationDays: 1, note: 'مهرگان و پیوند قبایل زروانیا' },
    { name: 'جشن کنداورگان', monthIndex: 8, day: 15, durationDays: 1, note: 'بزرگداشت پهلوانان و دلاوران' },
    { name: 'جشن مهگان', monthIndex: 9, day: 30, durationDays: 1, note: 'پیشواز زمستان و شب‌های دراز' },
    { name: 'جشن یخبندان', monthIndex: 10, day: 1, durationDays: 1, note: 'خواب زمستانی طبیعت' },
    { name: 'جشن آذرافروز', monthIndex: 11, day: 10, durationDays: 1, note: 'سده‌ی زروانیا و افروختن آتش‌های بلند' },
    { name: 'جشن واپسینگان', monthIndex: 12, day: 30, durationDays: 1, note: 'وداع با سال کهن' },
    { name: 'گاه پنج‌روزه برون‌گاه', offDayId: 'off-1', durationDays: 5, note: 'جشن پنج‌روزه پایان سال' }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
};

/**
 * 2. گاه‌شمار گاتایی (اوستایی کهن)
 * ۱۲ ماه ۳۰ روزه + ۵ روز پنج‌گاه گات‌ها (اهنود، اشتود، سپنتمد، وهوخشتر، وهیشتوآیشت)
 */
export const TEMPLATE_GATHIC: GenericCalendarData = {
  id: 'cal-template-gathic',
  name: 'گاه‌شمار گاتایی (اوستایی کهن)',
  eraLabel: 'گ.و',
  startYear: 1000,
  scopeType: 'pack',
  tags: ['قالب', 'گاتایی', 'اوستایی'],
  anchor: {
    weekdayIndex: 0 // شنبه
  },
  months: [
    { name: 'فروردین', days: 30, season: 'بهار' },
    { name: 'اردیبهشت', days: 30, season: 'بهار' },
    { name: 'خرداد', days: 30, season: 'بهار' },
    { name: 'تیر', days: 30, season: 'تابستان' },
    { name: 'امرداد', days: 30, season: 'تابستان' },
    { name: 'شهریور', days: 30, season: 'تابستان' },
    { name: 'مهر', days: 30, season: 'پاییز' },
    { name: 'آبان', days: 30, season: 'پاییز' },
    { name: 'آذر', days: 30, season: 'پاییز' },
    { name: 'دی', days: 30, season: 'زمستان' },
    { name: 'بهمن', days: 30, season: 'زمستان' },
    { name: 'اسفند', days: 30, season: 'زمستان' }
  ],
  offDays: [
    { id: 'gatha-1', name: 'گاه اول: اَهنَوَد', folkBelief: 'سرود راستی و اندیشه نیک' },
    { id: 'gatha-2', name: 'گاه دوم: اُشتَوَد', folkBelief: 'سرود روشنایی و آرزوی نیک‌بختی' },
    { id: 'gatha-3', name: 'گاه سوم: سپَنتَمَد', folkBelief: 'سرود فروتنی، فداکاری و پاکی زمین' },
    { id: 'gatha-4', name: 'گاه چهارم: وُهوخشتَر', folkBelief: 'سرود نیروی مینوی و شهریاری دادگرانه' },
    { id: 'gatha-5', name: 'گاه پنجم: وهیشتوآیشت', folkBelief: 'سرود برترین آرزو و روشنایی پایدار' }
  ],
  festivals: [
    { name: 'نوروز بزرگ', monthIndex: 1, day: 1, durationDays: 1, note: 'آغاز سال و رستاخیز طبیعت' },
    { name: 'جشن تیرگان', monthIndex: 4, day: 13, durationDays: 1, note: 'جشن آب‌پاشان و آرش کمانگیر' },
    { name: 'جشن مهرگان', monthIndex: 7, day: 16, durationDays: 1, note: 'پیروزی کاوه و فریدون بر ضحاک' },
    { name: 'جشن سده', monthIndex: 11, day: 10, durationDays: 1, note: 'پیدایش آتش و گرمای مهر' },
    { name: 'جشن پنج‌گاه گاسان', offDayId: 'gatha-1', durationDays: 5, note: 'روزهای پنج‌گانه پایانی سال' }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
};

/**
 * 3. تقویم ساده استارتر (۱۲ ماه ۳۰ روزه، هفته‌ی ۷ روزه) برای گزینه‌ی «از صفر»
 * بدون روزهای خارج از ماه و بدون جشن پیش‌فرض، ساختار آماده برای شخصی‌سازی
 */
export const TEMPLATE_SIMPLE_STARTER: GenericCalendarData = {
  id: 'cal-template-simple',
  name: 'تقویم ساده (۱۲ ماه ۳۰ روزه، هفته‌ی ۷ روزه)',
  eraLabel: 'س.ت',
  startYear: 1,
  scopeType: 'pack',
  tags: ['قالب', 'پایه‌ای', 'استارتر'],
  anchor: {
    weekdayIndex: 0 // شنبه
  },
  months: [
    { name: 'ماه ۱', days: 30, season: 'فصل اول' },
    { name: 'ماه ۲', days: 30, season: 'فصل اول' },
    { name: 'ماه ۳', days: 30, season: 'فصل اول' },
    { name: 'ماه ۴', days: 30, season: 'فصل دوم' },
    { name: 'ماه ۵', days: 30, season: 'فصل دوم' },
    { name: 'ماه ۶', days: 30, season: 'فصل دوم' },
    { name: 'ماه ۷', days: 30, season: 'فصل سوم' },
    { name: 'ماه ۸', days: 30, season: 'فصل سوم' },
    { name: 'ماه ۹', days: 30, season: 'فصل سوم' },
    { name: 'ماه ۱۰', days: 30, season: 'فصل چهارم' },
    { name: 'ماه ۱۱', days: 30, season: 'فصل چهارم' },
    { name: 'ماه ۱۲', days: 30, season: 'فصل چهارم' }
  ],
  offDays: [],
  festivals: [],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
};

/**
 * List of all standard calendar templates seeded in DungeonYar.
 */
export const CALENDAR_TEMPLATES: GenericCalendarData[] = [
  TEMPLATE_SHAHROOZAN_ZORVANIA,
  TEMPLATE_GATHIC,
  TEMPLATE_SIMPLE_STARTER
];

/**
 * Creates an independent campaign copy from a template with scopeType='campaign'.
 */
export function createCampaignCalendarFromTemplate(
  campaignId: string,
  template: GenericCalendarData,
  overrides?: Partial<GenericCalendarData>
): GenericCalendarData {
  const calId = overrides?.id || `cal-${campaignId}-${Date.now().toString(36)}`;
  return {
    ...template,
    id: calId,
    sourceId: template.id || null,
    scopeType: 'campaign',
    scopeId: campaignId,
    tags: Array.isArray(template.tags)
      ? template.tags.filter(t => t !== 'قالب')
      : [],
    months: JSON.parse(JSON.stringify(template.months || [])),
    offDays: JSON.parse(JSON.stringify(template.offDays || [])),
    festivals: JSON.parse(JSON.stringify(template.festivals || [])),
    weekdays: template.weekdays ? [...template.weekdays] : ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
    anchor: {
      weekdayIndex: overrides?.anchor?.weekdayIndex ?? template.anchor?.weekdayIndex ?? 0
    },
    ...overrides
  };
}
