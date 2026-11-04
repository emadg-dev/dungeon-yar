/**
 * DungeonYar Unified Calendar Engine (shared/rules/calendar.ts)
 *
 * Design principles:
 * 1. Single source of truth for time: `epochDay` (integer) at campaign level.
 * 2. Fantasy calendar with fixed year/month lengths (no leap years, no timezones).
 * 3. End-of-year off-days (epagomenal) are counted in weekday cycles.
 * 4. Dates before anchor (negative epochDays) work smoothly and symmetrically.
 * 5. Full backward compatibility with legacy WorldCalendar and GenericCalendarData.
 */

import type { MonthDef, OffDayDef, WorldCalendar, GenericCalendarData, CalendarMonth, CalendarFestival, CalendarOffDay } from '../../src/types';

// ======================================================================
// 1. Unified Types
// ======================================================================

export interface CalendarMonthDef {
  id: string;
  name: string;
  days: number; // >= 1
  season?: string;
}

export interface CalendarOffDayDef {
  id: string;
  name: string;
  note?: string;
  folkBelief?: string;
}

export type FestivalTargetType = 'month' | 'off_day';

export interface CalendarFestivalDef {
  id: string;
  name: string;
  description?: string;
  targetType: FestivalTargetType;
  monthId?: string; // required if targetType === 'month'
  offDayId?: string; // required if targetType === 'off_day'
  day?: number; // 1-based day in month (required if targetType === 'month')
  durationDays: number; // >= 1, default 1
}

export interface CalendarAnchorDate {
  year: number;
  monthId?: string;
  day: number; // 1-based
  isOffDay?: boolean;
  offDayId?: string;
  weekdayIndex?: number; // 0-based index into weekdays for epochDay 0 (default 0)
}

export interface UnifiedCalendar {
  id: string;
  name: string;
  eraLabel: string; // e.g. "پ.ر.ن." or "ق.ن"
  months: CalendarMonthDef[];
  offDays: CalendarOffDayDef[];
  weekdays: string[]; // >= 1 weekday names in order
  anchor: CalendarAnchorDate;
  festivals: CalendarFestivalDef[];
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  sourceId?: string | null;
  tags?: string[];
  description?: string;
  updatedAt?: number | string;
}

export interface CalendarDate {
  year: number;
  monthIndex: number; // 0-based index in months array (-1 if isOffDay)
  monthId?: string;
  monthName?: string;
  day: number; // 1-based day of month OR 1-based index in offDays
  isOffDay: boolean;
  offDayIndex?: number; // 1-based index in offDays (1..offDays.length)
  offDayId?: string;
  offDayName?: string;
  offDayNote?: string;
  weekdayIndex: number; // 0-based index in weekdays
  weekdayName: string;
  epochDay: number;
}

export interface CalendarValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FormatDateOptions {
  includeWeekday?: boolean;
}

// ======================================================================
// 2. Pure Calculation Functions
// ======================================================================

/**
 * Total number of days in a year for this calendar (months sum + off-days).
 */
export function daysInYear(calendar: Pick<UnifiedCalendar, 'months' | 'offDays'>): number {
  const monthsTotal = (calendar.months || []).reduce((sum, m) => sum + (Number(m.days) || 0), 0);
  const offDaysTotal = calendar.offDays ? calendar.offDays.length : 0;
  return monthsTotal + offDaysTotal;
}

/**
 * 0-indexed day of the year (0 .. daysInYear - 1) for the calendar's anchor date.
 */
export function anchorDayOfYear(calendar: UnifiedCalendar): number {
  return dateDayOfYear(calendar, {
    year: calendar.anchor.year,
    monthId: calendar.anchor.monthId,
    day: calendar.anchor.day,
    isOffDay: calendar.anchor.isOffDay,
    offDayId: calendar.anchor.offDayId
  });
}

/**
 * Computes 0-indexed day of year (0 .. daysInYear - 1) for any date.
 */
export function dateDayOfYear(
  calendar: UnifiedCalendar,
  date: {
    year?: number;
    monthId?: string;
    monthIndex?: number;
    month?: number;
    day?: number;
    isOffDay?: boolean;
    offDayId?: string;
    offDayIndex?: number;
  }
): number {
  const months = calendar.months || [];
  const offDays = calendar.offDays || [];
  const totalMonthDays = months.reduce((acc, m) => acc + (Number(m.days) || 0), 0);

  if (date.isOffDay) {
    let offIdx = 0;
    if (date.offDayId) {
      const found = offDays.findIndex(o => o.id === date.offDayId);
      if (found !== -1) offIdx = found;
    } else if (typeof date.offDayIndex === 'number') {
      offIdx = Math.max(0, Math.min(offDays.length - 1, date.offDayIndex - 1));
    } else if (typeof date.day === 'number') {
      offIdx = Math.max(0, Math.min(offDays.length - 1, date.day - 1));
    }
    return totalMonthDays + offIdx;
  }

  // Regular month
  let mIdx = 0;
  if (date.monthId) {
    const found = months.findIndex(m => m.id === date.monthId);
    if (found !== -1) mIdx = found;
  } else if (typeof date.monthIndex === 'number') {
    mIdx = Math.max(0, Math.min(months.length - 1, date.monthIndex));
  } else if (typeof date.month === 'number') {
    // 1-based month number
    if (date.month === 13 && offDays.length > 0) {
      // Legacy 13th month representation for off-days
      const offIdx = Math.max(0, Math.min(offDays.length - 1, (date.day || 1) - 1));
      return totalMonthDays + offIdx;
    }
    mIdx = Math.max(0, Math.min(months.length - 1, date.month - 1));
  }

  let priorDays = 0;
  for (let i = 0; i < mIdx; i++) {
    priorDays += Number(months[i].days) || 0;
  }
  const maxDay = months[mIdx] ? Number(months[mIdx].days) || 1 : 1;
  const d = Math.max(1, Math.min(maxDay, date.day || 1));
  return priorDays + (d - 1);
}

/**
 * Converts epochDay (integer) to full CalendarDate.
 * Correctly handles negative epochDays using Euclidean floor division.
 */
export function epochToDate(calendar: UnifiedCalendar, epochDay: number): CalendarDate {
  const Y = daysInYear(calendar);
  if (Y <= 0) {
    throw new Error('تقویم نامعتبر است: طول سال صفر یا منفی است.');
  }

  const anchorDoy = anchorDayOfYear(calendar);
  const totalOffset = epochDay + anchorDoy;

  // Euclidean division (Math.floor guarantees correct quotient and non-negative remainder for negatives)
  const yearDelta = Math.floor(totalOffset / Y);
  const dayOfYear = totalOffset - yearDelta * Y;
  const year = calendar.anchor.year + yearDelta;

  const months = calendar.months || [];
  const offDays = calendar.offDays || [];

  let r = dayOfYear;
  let isOffDay = false;
  let monthIndex = -1;
  let monthDef: CalendarMonthDef | undefined;
  let day = 1;
  let offDayIndex: number | undefined;
  let offDayDef: CalendarOffDayDef | undefined;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const mDays = Number(m.days) || 0;
    if (r < mDays) {
      monthIndex = i;
      monthDef = m;
      day = r + 1;
      break;
    }
    r -= mDays;
  }

  if (!monthDef) {
    isOffDay = true;
    offDayIndex = r + 1;
    offDayDef = offDays[r];
    day = offDayIndex;
  }

  // Weekday calculation
  const weekdayInfo = weekdayOf(calendar, epochDay);

  return {
    year,
    monthIndex,
    monthId: monthDef?.id,
    monthName: monthDef?.name,
    day,
    isOffDay,
    offDayIndex,
    offDayId: offDayDef?.id,
    offDayName: offDayDef?.name,
    offDayNote: offDayDef?.folkBelief || offDayDef?.note,
    weekdayIndex: weekdayInfo.index,
    weekdayName: weekdayInfo.name,
    epochDay
  };
}

/**
 * Converts a date to epochDay (integer relative to anchor).
 */
export function dateToEpoch(
  calendar: UnifiedCalendar,
  date: {
    year: number;
    monthId?: string;
    monthIndex?: number;
    month?: number;
    day?: number;
    isOffDay?: boolean;
    offDayId?: string;
    offDayIndex?: number;
  }
): number {
  const Y = daysInYear(calendar);
  if (Y <= 0) {
    throw new Error('تقویم نامعتبر است: طول سال صفر یا منفی است.');
  }

  const anchorDoy = anchorDayOfYear(calendar);
  const targetDoy = dateDayOfYear(calendar, date);
  const yearDelta = date.year - calendar.anchor.year;

  return yearDelta * Y + targetDoy - anchorDoy;
}

/**
 * Computes weekday index and name for an epochDay.
 * Off-days are fully counted in the continuous weekday sequence.
 */
export function weekdayOf(
  calendar: UnifiedCalendar,
  epochDay: number
): { index: number; name: string } {
  const weekdays = calendar.weekdays && calendar.weekdays.length > 0
    ? calendar.weekdays
    : ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const W = weekdays.length;
  const anchorWk = calendar.anchor.weekdayIndex ?? 0;
  const offset = epochDay + anchorWk;
  const index = ((offset % W) + W) % W;
  return {
    index,
    name: weekdays[index]
  };
}

/**
 * Returns all festivals active on a given date or epochDay, including multi-day festivals.
 */
export function festivalsOn(
  calendar: UnifiedCalendar,
  epochDayOrDate: number | CalendarDate
): CalendarFestivalDef[] {
  const date: CalendarDate = typeof epochDayOrDate === 'number'
    ? epochToDate(calendar, epochDayOrDate)
    : epochDayOrDate;

  const Y = daysInYear(calendar);
  if (Y <= 0 || !calendar.festivals || calendar.festivals.length === 0) {
    return [];
  }

  const targetDoy = dateDayOfYear(calendar, date);
  const activeFestivals: CalendarFestivalDef[] = [];

  for (const fest of calendar.festivals) {
    let startDoy = -1;
    if (fest.targetType === 'off_day') {
      startDoy = dateDayOfYear(calendar, { isOffDay: true, offDayId: fest.offDayId });
    } else {
      startDoy = dateDayOfYear(calendar, {
        isOffDay: false,
        monthId: fest.monthId,
        day: fest.day || 1
      });
    }

    const duration = Math.max(1, fest.durationDays || 1);
    const diff = ((targetDoy - startDoy) % Y + Y) % Y;
    if (diff < duration) {
      activeFestivals.push(fest);
    }
  }

  return activeFestivals;
}

/**
 * Advances time by deltaDays, returning the new epochDay and corresponding date.
 */
export function advance(
  calendar: UnifiedCalendar,
  currentEpochDay: number,
  deltaDays: number
): { epochDay: number; date: CalendarDate } {
  const newEpochDay = currentEpochDay + deltaDays;
  return {
    epochDay: newEpochDay,
    date: epochToDate(calendar, newEpochDay)
  };
}

/**
 * Formats date into standard Persian string with configurable era label (not hardcoded).
 */
export function formatDate(
  calendar: UnifiedCalendar,
  epochDayOrDate: number | CalendarDate,
  options?: FormatDateOptions
): string {
  const date: CalendarDate = typeof epochDayOrDate === 'number'
    ? epochToDate(calendar, epochDayOrDate)
    : epochDayOrDate;

  const era = calendar.eraLabel ? ` ${calendar.eraLabel}` : '';
  let dateText = '';

  if (date.isOffDay) {
    const offName = date.offDayName || 'روز برون‌گاه';
    dateText = `${offName} (خارج از سال‌شمار) - سال ${date.year}${era}`;
  } else {
    const monthName = date.monthName || `${(date.monthIndex ?? 0) + 1}`;
    dateText = `${date.day} ${monthName}، سال ${date.year}${era}`;
  }

  if (options?.includeWeekday && date.weekdayName) {
    return `${date.weekdayName}، ${dateText}`;
  }

  return dateText;
}

// ======================================================================
// 3. Validation
// ======================================================================

/**
 * Validates calendar configuration integrity.
 * Checks for:
 * - Empty months or month with 0 days
 * - Empty weekdays
 * - Duplicate IDs across months, off-days, and festivals
 * - Anchor pointing to non-existent month or off-day
 * - Festival referencing non-existent month or off-day
 */
export function validateCalendar(calendar: unknown): CalendarValidationResult {
  const errors: string[] = [];

  if (!calendar || typeof calendar !== 'object') {
    return { valid: false, errors: ['شیء تقویم نامعتبر است.'] };
  }

  const cal = calendar as Partial<UnifiedCalendar>;

  if (!cal.name || typeof cal.name !== 'string' || !cal.name.trim()) {
    errors.push('نام تقویم الزامی است.');
  }

  if (!cal.eraLabel || typeof cal.eraLabel !== 'string' || !cal.eraLabel.trim()) {
    errors.push('برچسب دوره (eraLabel) الزامی است.');
  }

  // Months validation
  if (!Array.isArray(cal.months) || cal.months.length === 0) {
    errors.push('تقویم باید حداقل یک ماه داشته باشد.');
  } else {
    const monthIds = new Set<string>();
    cal.months.forEach((m, idx) => {
      if (!m || typeof m !== 'object') {
        errors.push(`ماه در ردیف ${idx + 1} نامعتبر است.`);
        return;
      }
      if (!m.id || typeof m.id !== 'string' || !m.id.trim()) {
        errors.push(`شناسه ماه در ردیف ${idx + 1} الزامی است.`);
      } else if (monthIds.has(m.id)) {
        errors.push(`شناسه ماه تکراری است: ${m.id}`);
      } else {
        monthIds.add(m.id);
      }

      if (!m.name || typeof m.name !== 'string' || !m.name.trim()) {
        errors.push(`نام ماه در ردیف ${idx + 1} الزامی است.`);
      }

      const days = Number(m.days);
      if (!Number.isInteger(days) || days < 1) {
        errors.push(`تعداد روزهای ماه «${m.name || m.id || idx + 1}» باید حداقل ۱ باشد.`);
      }
    });
  }

  // Off-days validation
  const offDayIds = new Set<string>();
  if (Array.isArray(cal.offDays)) {
    cal.offDays.forEach((o, idx) => {
      if (!o || typeof o !== 'object') {
        errors.push(`روز خارج از ماه در ردیف ${idx + 1} نامعتبر است.`);
        return;
      }
      if (!o.id || typeof o.id !== 'string' || !o.id.trim()) {
        errors.push(`شناسه روز خارج از ماه در ردیف ${idx + 1} الزامی است.`);
      } else if (offDayIds.has(o.id)) {
        errors.push(`شناسه روز خارج از ماه تکراری است: ${o.id}`);
      } else {
        offDayIds.add(o.id);
      }

      if (!o.name || typeof o.name !== 'string' || !o.name.trim()) {
        errors.push(`نام روز خارج از ماه در ردیف ${idx + 1} الزامی است.`);
      }
    });
  }

  // Weekdays validation
  if (!Array.isArray(cal.weekdays) || cal.weekdays.length === 0) {
    errors.push('روزهای هفته باید حداقل شامل یک روز باشد.');
  } else {
    cal.weekdays.forEach((w, idx) => {
      if (typeof w !== 'string' || !w.trim()) {
        errors.push(`نام روز هفته در جایگاه ${idx + 1} نامعتبر است.`);
      }
    });
  }

  // Anchor validation
  if (!cal.anchor || typeof cal.anchor !== 'object') {
    errors.push('لنگر تقویم (anchor) الزامی است.');
  } else {
    if (typeof cal.anchor.year !== 'number' || !Number.isInteger(cal.anchor.year)) {
      errors.push('سال لنگر باید عدد صحیح باشد.');
    }
    if (cal.anchor.isOffDay) {
      if (!cal.anchor.offDayId || !offDayIds.has(cal.anchor.offDayId)) {
        errors.push(`روز خارج از ماه لنگر یافت نشد: ${cal.anchor.offDayId}`);
      }
    } else {
      const month = (cal.months || []).find(m => m.id === cal.anchor?.monthId);
      if (!month) {
        errors.push(`ماه لنگر یافت نشد: ${cal.anchor.monthId}`);
      } else {
        const d = Number(cal.anchor.day);
        if (!Number.isInteger(d) || d < 1 || d > month.days) {
          errors.push(`روز لنگر باید بین ۱ و ${month.days} باشد.`);
        }
      }
    }
  }

  // Festivals validation
  if (Array.isArray(cal.festivals)) {
    const festIds = new Set<string>();
    const monthIds = new Set((cal.months || []).map(m => m.id));

    cal.festivals.forEach((f, idx) => {
      if (!f || typeof f !== 'object') {
        errors.push(`جشن در ردیف ${idx + 1} نامعتبر است.`);
        return;
      }
      if (!f.id || typeof f.id !== 'string' || !f.id.trim()) {
        errors.push(`شناسه جشن در ردیف ${idx + 1} الزامی است.`);
      } else if (festIds.has(f.id)) {
        errors.push(`شناسه جشن تکراری است: ${f.id}`);
      } else {
        festIds.add(f.id);
      }

      if (!f.name || typeof f.name !== 'string' || !f.name.trim()) {
        errors.push(`نام جشن در ردیف ${idx + 1} الزامی است.`);
      }

      const dur = Number(f.durationDays);
      if (!Number.isInteger(dur) || dur < 1) {
        errors.push(`مدت جشن «${f.name || f.id}» باید حداقل ۱ روز باشد.`);
      }

      if (f.targetType === 'off_day') {
        if (!f.offDayId || !offDayIds.has(f.offDayId)) {
          errors.push(`روز خارج از ماه مرتبط با جشن «${f.name}» یافت نشد: ${f.offDayId}`);
        }
      } else {
        if (!f.monthId || !monthIds.has(f.monthId)) {
          errors.push(`ماه مرتبط با جشن «${f.name}» یافت نشد: ${f.monthId}`);
        } else {
          const m = (cal.months || []).find(month => month.id === f.monthId);
          if (m) {
            const dayNum = Number(f.day);
            if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > m.days) {
              errors.push(`روز شروع جشن «${f.name}» باید بین ۱ و ${m.days} باشد.`);
            }
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ======================================================================
// 4. Canonical Templates
// ======================================================================

/**
 * Template 1: گاه‌شمار شاه‌روزان زروانیا (گزینه ۱ - اصلی و کانون)
 * ۱۲ ماه ۳۰ روزه با نام‌های فرهان، زروان، ... + ۵ روز برون‌گاه
 */
export const SHAHROOZAN_ZORVANIA_CALENDAR: UnifiedCalendar = {
  id: 'cal-zorvania-shahroozan',
  name: 'گاه‌شمار شاه‌روزان زروانیا',
  eraLabel: 'پ.ر.ن.',
  months: [
    { id: 'farhan', name: 'فرهان', days: 30, season: 'بهار' },
    { id: 'zarvan', name: 'زروان', days: 30, season: 'بهار' },
    { id: 'vernan', name: 'ورنان', days: 30, season: 'بهار' },
    { id: 'aryaman', name: 'آریامان', days: 30, season: 'تابستان' },
    { id: 'divgan', name: 'دیوگان', days: 30, season: 'تابستان' },
    { id: 'godazan', name: 'گدازان', days: 30, season: 'تابستان' },
    { id: 'peyman', name: 'پیمان', days: 30, season: 'پاییز' },
    { id: 'kandan', name: 'کندان', days: 30, season: 'پاییز' },
    { id: 'mehgan', name: 'مهگان', days: 30, season: 'پاییز' },
    { id: 'yakhbandan', name: 'یخبندان', days: 30, season: 'زمستان' },
    { id: 'azaran', name: 'آذران', days: 30, season: 'زمستان' },
    { id: 'vapasan', name: 'واپسان', days: 30, season: 'زمستان' }
  ],
  offDays: [
    {
      id: 'off-1',
      name: 'روز لرزش',
      folkBelief: 'باور عامیانه: لرزش تاروپود میان جهان‌ها؛ دیوان در این روز از کوه‌ها پایین نمی‌آیند و سنگ‌ها در سکوت عمیق فرو می‌روند.'
    },
    {
      id: 'off-2',
      name: 'روز گمگشتگی آب',
      folkBelief: 'باور عامیانه: آب فواره‌ها و چشمه‌ها برای یک روز راکد و بی‌طعم می‌شود؛ پریان آب پاک ذخیره می‌کنند.'
    },
    {
      id: 'off-3',
      name: 'روز بینامی',
      folkBelief: 'باور عامیانه: نباید نام هیچ فرد زنده‌ای با صدای بلند برده شود، مبادا سایه‌های سرگردان جای هویت او را بگیرند.'
    },
    {
      id: 'off-4',
      name: 'روز خاموشی آتش',
      folkBelief: 'باور عامیانه: آتشدان‌های معابد به خاکستر می‌نشینند تا پاکسازی شوند؛ افروختن آتش جدید در این ۲۴ ساعت بدیمن است.'
    },
    {
      id: 'off-5',
      name: 'روز بند',
      folkBelief: 'باور عامیانه: روز بستن عهدها و گره زدن روبان‌های کهربایی به شاخه‌های درخت کهنسال ورنا پیش از آغاز بهار سال نو.'
    }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
  anchor: {
    year: 1500,
    monthId: 'farhan',
    day: 1,
    isOffDay: false,
    weekdayIndex: 0
  },
  festivals: [
    { id: 'fest-farhan', name: 'جشن فرهگان (آغاز بهار و نوروز زروانیا)', targetType: 'month', monthId: 'farhan', day: 1, durationDays: 1 },
    { id: 'fest-zarvan', name: 'جشن زروانگان', targetType: 'month', monthId: 'zarvan', day: 1, durationDays: 1 },
    { id: 'fest-vernan', name: 'جشن ورناگان', targetType: 'month', monthId: 'vernan', day: 1, durationDays: 1 },
    { id: 'fest-aryaman', name: 'جشن آریامانگان', targetType: 'month', monthId: 'aryaman', day: 1, durationDays: 1 },
    { id: 'fest-divgan', name: 'جشن دیوانگان', targetType: 'month', monthId: 'divgan', day: 1, durationDays: 1 },
    { id: 'fest-godazan', name: 'جشن گدازگان', targetType: 'month', monthId: 'godazan', day: 1, durationDays: 1 },
    { id: 'fest-peyman', name: 'جشن پیمانگان', targetType: 'month', monthId: 'peyman', day: 1, durationDays: 1 },
    { id: 'fest-kandan', name: 'جشن کنداورگان', targetType: 'month', monthId: 'kandan', day: 1, durationDays: 1 },
    { id: 'fest-mehgan', name: 'جشن مهگان', targetType: 'month', monthId: 'mehgan', day: 1, durationDays: 1 },
    { id: 'fest-yakhbandan', name: 'جشن یخبندان', targetType: 'month', monthId: 'yakhbandan', day: 1, durationDays: 1 },
    { id: 'fest-azaran', name: 'جشن آذرافروز', targetType: 'month', monthId: 'azaran', day: 1, durationDays: 1 },
    { id: 'fest-vapasan', name: 'جشن واپسینگان', targetType: 'month', monthId: 'vapasan', day: 1, durationDays: 1 }
  ],
  tags: ['شاهروزان', 'زروانیا', 'قالب_رسمی']
};

/**
 * Template 2: زروانیا (نامگذاری گاتایی) — موقت (گزینه ۲ - حفظ‌شده بر اساس تصمیم ۷)
 */
export const GATHIC_ZORVANIA_CALENDAR_TEMPLATE: UnifiedCalendar = {
  id: 'cal-zorvania-gathic-temp',
  name: 'زروانیا (نامگذاری گاتایی) — موقت',
  eraLabel: 'پ.ر.ن (پس از روز نخست)',
  months: [
    { id: 'farvardad', name: 'فرورداد', days: 30, season: 'بهار' },
    { id: 'ordimehr', name: 'اردی‌مهر', days: 30, season: 'بهار' },
    { id: 'khordad', name: 'خورداد', days: 30, season: 'بهار' },
    { id: 'tirazar', name: 'تیرآذر', days: 30, season: 'تابستان' },
    { id: 'amordad', name: 'امرداد', days: 30, season: 'تابستان' },
    { id: 'shahrivar', name: 'شهریور', days: 30, season: 'تابستان' },
    { id: 'mehraeen', name: 'مهرآیین', days: 30, season: 'پاییز' },
    { id: 'abandad', name: 'آبان‌داد', days: 30, season: 'پاییز' },
    { id: 'azarpajvak', name: 'آذرپژواک', days: 30, season: 'پاییز' },
    { id: 'deymehr', name: 'دی‌مهر', days: 30, season: 'زمستان' },
    { id: 'bahmanyar', name: 'بهمن‌یار', days: 30, season: 'زمستان' },
    { id: 'esfandarmadh', name: 'اسفندارمذ', days: 30, season: 'زمستان' }
  ],
  offDays: [
    { id: 'gah-1', name: 'گاه اول: اهنود', note: 'روز اول بیرون از تقویم - سکوت میان زمان‌ها' },
    { id: 'gah-2', name: 'گاه دوم: اشتود', note: 'روز دوم بیرون از تقویم - یادبود دیوان نیک‌نهاد' },
    { id: 'gah-3', name: 'گاه سوم: سپنتمد', note: 'روز سوم بیرون از تقویم - نذر آب و ریشه' },
    { id: 'gah-4', name: 'گاه چهارم: وهوخشتر', note: 'روز چهارم بیرون از تقویم - درخشش آسمان سرخ' },
    { id: 'gah-5', name: 'گاه پنجم: وهیشتوآیشت', note: 'روز پنجم بیرون از تقویم - باززایی زمان' }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
  anchor: {
    year: 1500,
    monthId: 'farvardad',
    day: 1,
    isOffDay: false,
    weekdayIndex: 0
  },
  festivals: [
    { id: 'fest-nowruz', name: 'جشن روز نخست (نوروز کهن)', description: 'آغاز تقویم و برافروختن اخگر', targetType: 'month', monthId: 'farvardad', day: 1, durationDays: 1 },
    { id: 'fest-mehregan', name: 'مهرگان زروانیا', description: 'پیمان میان قبایل', targetType: 'month', monthId: 'mehraeen', day: 16, durationDays: 1 },
    { id: 'fest-azarakhsh', name: 'جشن آذرخش', description: 'پالایش آتشکده‌ها', targetType: 'month', monthId: 'azarpajvak', day: 9, durationDays: 1 }
  ],
  tags: ['گاتایی', 'موقت']
};

// ======================================================================
// 5. Legacy Adapters
// ======================================================================

/**
 * Converts a UnifiedCalendar state (or epochDay) to the legacy WorldCalendar shape.
 */
export function toWorldCalendar(
  calendar: UnifiedCalendar,
  epochDay: number,
  base?: Partial<WorldCalendar>
): WorldCalendar {
  const date = epochToDate(calendar, epochDay);
  const activeFests = festivalsOn(calendar, date);

  let currentFestival: string | undefined = undefined;
  if (date.isOffDay) {
    currentFestival = date.offDayName;
  } else if (date.day === 1) {
    // For legacy parity: if month day is 1, check festival
    if (activeFests.length > 0) {
      currentFestival = activeFests[0].name;
    }
  }

  return {
    id: base?.id || calendar.id || 'zorvania-calendar',
    year: date.year,
    month: date.isOffDay ? 13 : date.monthIndex + 1,
    day: date.day,
    isOffDay: date.isOffDay,
    offDayIndex: date.offDayIndex || 0,
    currentFestival: currentFestival ?? base?.currentFestival,
    updatedAt: base?.updatedAt || new Date().toISOString()
  };
}

/**
 * Converts legacy WorldCalendar to epochDay.
 */
export function fromWorldCalendar(
  calendar: UnifiedCalendar,
  worldCal: Pick<WorldCalendar, 'year' | 'month' | 'day' | 'isOffDay' | 'offDayIndex'>
): number {
  return dateToEpoch(calendar, {
    year: worldCal.year,
    month: worldCal.month,
    day: worldCal.day,
    isOffDay: Boolean(worldCal.isOffDay || worldCal.month === 13),
    offDayIndex: worldCal.offDayIndex
  });
}

/**
 * Converts GenericCalendarData (Phase 2 legacy) to UnifiedCalendar.
 */
export function genericToUnifiedCalendar(generic: GenericCalendarData): UnifiedCalendar {
  const months: CalendarMonthDef[] = (generic.months || []).map((m, idx) => ({
    id: `m-${idx + 1}`,
    name: m.name,
    days: m.days,
    season: m.season
  }));

  const offDays: CalendarOffDayDef[] = (generic.offDays || []).map((o, idx) => ({
    id: `off-${idx + 1}`,
    name: o.name,
    note: o.note,
    folkBelief: o.note
  }));

  const festivals: CalendarFestivalDef[] = (generic.festivals || []).map((f, idx) => {
    // monthIndex in generic is 1-based (or 1..12)
    const mIdx = Math.max(1, f.monthIndex || 1);
    const targetMonth = months[mIdx - 1];
    return {
      id: `fest-${idx + 1}`,
      name: f.name,
      description: f.note,
      targetType: 'month',
      monthId: targetMonth ? targetMonth.id : months[0]?.id,
      day: f.day || 1,
      durationDays: 1
    };
  });

  return {
    id: generic.id || 'cal-imported',
    name: generic.name,
    eraLabel: generic.eraLabel || 'پ.ر.ن',
    months,
    offDays,
    weekdays: generic.weekdays && generic.weekdays.length > 0
      ? generic.weekdays
      : ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
    anchor: {
      year: generic.startYear ?? 1500,
      monthId: months[0]?.id,
      day: 1,
      isOffDay: false,
      weekdayIndex: 0
    },
    festivals,
    tags: generic.tags || []
  };
}

/**
 * Converts UnifiedCalendar to GenericCalendarData (Phase 2 legacy).
 */
export function unifiedToGenericCalendar(unified: UnifiedCalendar): GenericCalendarData {
  const months: CalendarMonth[] = unified.months.map(m => ({
    name: m.name,
    days: m.days,
    season: m.season
  }));

  const offDays: CalendarOffDay[] = unified.offDays.map(o => ({
    name: o.name,
    note: o.folkBelief || o.note
  }));

  const festivals: CalendarFestival[] = unified.festivals
    .filter(f => f.targetType === 'month')
    .map(f => {
      const mIdx = unified.months.findIndex(m => m.id === f.monthId);
      return {
        monthIndex: mIdx !== -1 ? mIdx + 1 : 1,
        day: f.day || 1,
        name: f.name,
        note: f.description
      };
    });

  return {
    id: unified.id,
    name: unified.name,
    eraLabel: unified.eraLabel,
    startYear: unified.anchor.year,
    months,
    offDays,
    festivals,
    weekdays: unified.weekdays,
    tags: unified.tags
  };
}
