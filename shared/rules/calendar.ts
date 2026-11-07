import type {
  CalendarMonth,
  CalendarFestival,
  CalendarOffDay,
  CalendarAnchor,
  GenericCalendarData,
  CalendarDate,
  CampaignTimeState
} from '../../src/types';

export const DEFAULT_WEEKDAYS: string[] = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
];

export interface CalendarValidationResult {
  valid: boolean;
  errors: string[];
}

interface TimelineDay {
  isOffDay: boolean;
  month: number;
  day: number;
  offDayIndex?: number;
  offDayDef?: CalendarOffDay;
  monthDef?: CalendarMonth;
}

/**
 * Validates a GenericCalendarData structure according to engine specifications.
 * Enforces anchor.weekdayIndex range, valid offDayId / month-day references,
 * non-empty names, positive month days, and positive durationDays.
 */
export function validateCalendar(calendar: GenericCalendarData): CalendarValidationResult {
  const errors: string[] = [];

  if (!calendar) {
    return { valid: false, errors: ['اطلاعات تقویم ارسال نشده است.'] };
  }

  if (!calendar.name || typeof calendar.name !== 'string' || !calendar.name.trim()) {
    errors.push('نام تقویم الزامی است.');
  }

  if (!Array.isArray(calendar.months) || calendar.months.length === 0) {
    errors.push('تقویم باید حداقل دارای یک ماه باشد.');
  } else {
    calendar.months.forEach((m, idx) => {
      if (!m.name || typeof m.name !== 'string' || !m.name.trim()) {
        errors.push(`نام ماه شماره ${idx + 1} الزامی است.`);
      }
      if (typeof m.days !== 'number' || !Number.isInteger(m.days) || m.days <= 0) {
        errors.push(`تعداد روزهای ماه «${m.name || idx + 1}» باید یک عدد صحیح مثبت باشد.`);
      }
    });
  }

  const offDays = Array.isArray(calendar.offDays) ? calendar.offDays : [];
  offDays.forEach((od, idx) => {
    if (!od.name || typeof od.name !== 'string' || !od.name.trim()) {
      errors.push(`نام روز خارج از ماه شماره ${idx + 1} الزامی است.`);
    }
    if (od.afterMonthIndex !== undefined) {
      if (
        typeof od.afterMonthIndex !== 'number' ||
        !Number.isInteger(od.afterMonthIndex) ||
        od.afterMonthIndex < 1 ||
        (Array.isArray(calendar.months) && od.afterMonthIndex > calendar.months.length)
      ) {
        errors.push(`موقعیت قرارگیری روز خارج از ماه «${od.name}» (afterMonthIndex) نامعتبر است.`);
      }
    }
  });

  const weekdays = (calendar.weekdays && calendar.weekdays.length > 0)
    ? calendar.weekdays
    : DEFAULT_WEEKDAYS;

  if (calendar.weekdays !== undefined) {
    if (!Array.isArray(calendar.weekdays) || calendar.weekdays.length === 0) {
      errors.push('روزهای هفته باید آرایه‌ای غیرخالی از نام روزها باشد.');
    } else {
      calendar.weekdays.forEach((w, idx) => {
        if (!w || typeof w !== 'string' || !w.trim()) {
          errors.push(`نام روز هفته شماره ${idx + 1} نامعتبر است.`);
        }
      });
    }
  }

  // Anchor weekday validation
  const anchorWeekdayIndex = calendar.anchor?.weekdayIndex;
  if (anchorWeekdayIndex !== undefined) {
    if (
      typeof anchorWeekdayIndex !== 'number' ||
      !Number.isInteger(anchorWeekdayIndex) ||
      anchorWeekdayIndex < 0 ||
      anchorWeekdayIndex >= weekdays.length
    ) {
      errors.push(
        `روز هفته لنگر (anchor.weekdayIndex) باید عددی صحیح بین ۰ تا ${weekdays.length - 1} باشد.`
      );
    }
  }

  // Festivals validation
  const festivals = Array.isArray(calendar.festivals) ? calendar.festivals : [];
  festivals.forEach((f, idx) => {
    const fLabel = f.name ? `«${f.name}»` : `شماره ${idx + 1}`;
    if (!f.name || typeof f.name !== 'string' || !f.name.trim()) {
      errors.push(`نام جشن ${fLabel} الزامی است.`);
    }

    const hasMonth = f.monthIndex !== undefined && f.day !== undefined;
    const hasOffDay = f.offDayId !== undefined && f.offDayId !== null && f.offDayId !== '';

    if (!hasMonth && !hasOffDay) {
      errors.push(`جشن ${fLabel} باید به یک ماه و روز مشخص یا به یک روز خارج از ماه (offDayId) اشاره کند.`);
    }

    if (hasMonth) {
      if (
        typeof f.monthIndex !== 'number' ||
        !Number.isInteger(f.monthIndex) ||
        f.monthIndex < 1 ||
        !calendar.months ||
        f.monthIndex > calendar.months.length
      ) {
        errors.push(`ماه مشخص‌شده برای جشن ${fLabel} خارج از محدوده ماه‌های تقویم است.`);
      } else {
        const targetMonth = calendar.months[f.monthIndex - 1];
        if (
          typeof f.day !== 'number' ||
          !Number.isInteger(f.day) ||
          f.day < 1 ||
          (targetMonth && f.day > targetMonth.days)
        ) {
          errors.push(`روز مشخص‌شده برای جشن ${fLabel} خارج از محدوده روزهای ماه «${targetMonth?.name}» است.`);
        }
      }
    }

    if (hasOffDay) {
      const match = findOffDay(offDays, f.offDayId!);
      if (!match) {
        errors.push(`روز خارج از ماه ارجاع‌شده در جشن ${fLabel} (offDayId: ${f.offDayId}) در تقویم یافت نشد.`);
      }
    }

    if (f.durationDays !== undefined) {
      if (typeof f.durationDays !== 'number' || !Number.isInteger(f.durationDays) || f.durationDays < 1) {
        errors.push(`مدت زمان جشن ${fLabel} (durationDays) باید عددی صحیح و حداقل ۱ روز باشد.`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Finds an off-day by its numeric index (1-based), string id, or name.
 */
export function findOffDay(
  offDays: CalendarOffDay[],
  offDayId: string | number
): { index: number; offDay: CalendarOffDay } | null {
  if (!Array.isArray(offDays) || offDays.length === 0) return null;

  if (typeof offDayId === 'number') {
    if (offDayId >= 1 && offDayId <= offDays.length) {
      return { index: offDayId, offDay: offDays[offDayId - 1] };
    }
    return null;
  }

  // Try exact id match first
  const byIdIdx = offDays.findIndex(o => o.id !== undefined && String(o.id) === String(offDayId));
  if (byIdIdx !== -1) {
    return { index: byIdIdx + 1, offDay: offDays[byIdIdx] };
  }

  // Try numeric string
  const num = parseInt(offDayId, 10);
  if (!isNaN(num) && String(num) === String(offDayId).trim()) {
    if (num >= 1 && num <= offDays.length) {
      return { index: num, offDay: offDays[num - 1] };
    }
  }

  // Try name match
  const byNameIdx = offDays.findIndex(o => o.name === offDayId);
  if (byNameIdx !== -1) {
    return { index: byNameIdx + 1, offDay: offDays[byNameIdx] };
  }

  return null;
}

/**
 * Total number of days in one calendar year.
 */
export function daysInCalendarYear(calendar: GenericCalendarData): number {
  const monthDays = (calendar.months || []).reduce((acc, m) => acc + (m.days || 0), 0);
  const offDaysCount = (calendar.offDays || []).length;
  const total = monthDays + offDaysCount;
  return total > 0 ? total : 365;
}

/**
 * Builds a 0-indexed lookup table of all days in a single calendar year.
 */
function buildYearTimeline(calendar: GenericCalendarData): TimelineDay[] {
  const timeline: TimelineDay[] = [];
  const months = calendar.months || [];
  const offDays = calendar.offDays || [];

  // Group off-days by afterMonthIndex
  const offDaysByMonth: Map<number, { offDay: CalendarOffDay; globalIndex: number }[]> = new Map();
  const endOfYearOffDays: { offDay: CalendarOffDay; globalIndex: number }[] = [];

  offDays.forEach((od, idx) => {
    const globalIndex = idx + 1;
    if (od.afterMonthIndex !== undefined && od.afterMonthIndex >= 1 && od.afterMonthIndex <= months.length) {
      const list = offDaysByMonth.get(od.afterMonthIndex) || [];
      list.push({ offDay: od, globalIndex });
      offDaysByMonth.set(od.afterMonthIndex, list);
    } else {
      endOfYearOffDays.push({ offDay: od, globalIndex });
    }
  });

  months.forEach((m, mIdx) => {
    const monthNum = mIdx + 1;
    for (let d = 1; d <= m.days; d++) {
      timeline.push({
        isOffDay: false,
        month: monthNum,
        day: d,
        monthDef: m
      });
    }

    const insertedOffDays = offDaysByMonth.get(monthNum);
    if (insertedOffDays) {
      insertedOffDays.forEach(({ offDay, globalIndex }) => {
        timeline.push({
          isOffDay: true,
          month: months.length + 1,
          day: globalIndex,
          offDayIndex: globalIndex,
          offDayDef: offDay
        });
      });
    }
  });

  // End of year off-days
  endOfYearOffDays.forEach(({ offDay, globalIndex }) => {
    timeline.push({
      isOffDay: true,
      month: months.length + 1,
      day: globalIndex,
      offDayIndex: globalIndex,
      offDayDef: offDay
    });
  });

  return timeline;
}

/**
 * Returns the weekday index and localized name for a given epochDay.
 * Uses anchor.weekdayIndex (default 0), accurately supports positive, zero,
 * and negative epoch days, and handles arbitrary week lengths (including 1-day weeks).
 */
export function weekdayOf(
  calendar: GenericCalendarData,
  epochDay: number
): { index: number; name: string } {
  const weekdays = (calendar.weekdays && calendar.weekdays.length > 0)
    ? calendar.weekdays
    : DEFAULT_WEEKDAYS;
  const W = weekdays.length;
  if (W === 0) {
    return { index: 0, name: 'روز' };
  }

  const offset = calendar.anchor?.weekdayIndex ?? 0;
  // Floor epochDay to handle integer days; robust modulo for negative numbers
  const dayInt = Math.floor(epochDay);
  const raw = ((dayInt + offset) % W + W) % W;
  return {
    index: raw,
    name: weekdays[raw]
  };
}

/**
 * Converts a CalendarDate to its absolute integer epochDay.
 */
export function dateToEpoch(calendar: GenericCalendarData, date: CalendarDate): number {
  const startYear = calendar.startYear ?? 1500;
  const daysInYear = daysInCalendarYear(calendar);
  const timeline = buildYearTimeline(calendar);

  let targetDayOfYear = 0;
  if (date.isOffDay) {
    const targetIdx = date.offDayIndex ?? date.day;
    const found = timeline.findIndex(t => t.isOffDay && t.offDayIndex === targetIdx);
    targetDayOfYear = found !== -1 ? found : Math.max(0, timeline.length - 1);
  } else {
    const found = timeline.findIndex(t => !t.isOffDay && t.month === date.month && t.day === date.day);
    targetDayOfYear = found !== -1 ? found : 0;
  }

  const yearDiff = date.year - startYear;
  return yearDiff * daysInYear + targetDayOfYear;
}

/**
 * Converts an absolute epochDay to a precise CalendarDate.
 * Reversible and bijective with dateToEpoch.
 */
export function epochToDate(calendar: GenericCalendarData, epochDay: number): CalendarDate {
  const startYear = calendar.startYear ?? 1500;
  const daysInYear = daysInCalendarYear(calendar);
  const timeline = buildYearTimeline(calendar);

  const dayInt = Math.floor(epochDay);
  const yearOffset = Math.floor(dayInt / daysInYear);
  const dayOfYear = ((dayInt % daysInYear) + daysInYear) % daysInYear;

  const year = startYear + yearOffset;
  const item = timeline[dayOfYear] || timeline[0] || { isOffDay: false, month: 1, day: 1 };

  return {
    year,
    month: item.month,
    day: item.day,
    isOffDay: item.isOffDay,
    offDayIndex: item.offDayIndex
  };
}

/**
 * Returns the day-of-year (0 to daysInYear - 1) on which a festival starts.
 */
export function festivalStartDayOfYear(
  calendar: GenericCalendarData,
  festival: CalendarFestival
): number {
  const timeline = buildYearTimeline(calendar);

  if (festival.offDayId !== undefined && festival.offDayId !== null && festival.offDayId !== '') {
    const match = findOffDay(calendar.offDays || [], festival.offDayId);
    if (match) {
      const idx = timeline.findIndex(t => t.isOffDay && t.offDayIndex === match.index);
      if (idx !== -1) return idx;
    }
  }

  if (festival.monthIndex !== undefined && festival.day !== undefined) {
    const idx = timeline.findIndex(t => !t.isOffDay && t.month === festival.monthIndex && t.day === festival.day);
    if (idx !== -1) return idx;
  }

  return 0;
}

/**
 * Returns all festivals active on a given epochDay or CalendarDate.
 * Correctly identifies festivals anchored to offDayId, as well as multi-day
 * festivals spanning from month-end into off-days, and spanning from off-days
 * across the year boundary into month 1 of the following year.
 */
export function festivalsOn(
  calendar: GenericCalendarData,
  epochDayOrDate: number | CalendarDate
): CalendarFestival[] {
  const epochDay = typeof epochDayOrDate === 'number'
    ? epochDayOrDate
    : dateToEpoch(calendar, epochDayOrDate);

  const daysInYear = daysInCalendarYear(calendar);
  if (daysInYear <= 0) return [];

  const dayInt = Math.floor(epochDay);
  const targetDayOfYear = ((dayInt % daysInYear) + daysInYear) % daysInYear;

  const festivals = Array.isArray(calendar.festivals) ? calendar.festivals : [];
  const active: CalendarFestival[] = [];

  for (const f of festivals) {
    const start = festivalStartDayOfYear(calendar, f);
    const duration = f.durationDays && f.durationDays > 0 ? f.durationDays : 1;

    let isActive = false;
    if (start + duration <= daysInYear) {
      // Normal range within a single calendar year
      isActive = targetDayOfYear >= start && targetDayOfYear < start + duration;
    } else {
      // Wraps around the year-end boundary into the beginning of the next year
      const wrapDays = (start + duration) - daysInYear;
      isActive = targetDayOfYear >= start || targetDayOfYear < wrapDays;
    }

    if (isActive) {
      active.push(f);
    }
  }

  return active;
}

/**
 * Formats a calendar date in Persian script with era label.
 */
export function formatCalendarDate(
  calendar: GenericCalendarData,
  dateOrEpoch: CalendarDate | number
): string {
  const date = typeof dateOrEpoch === 'number'
    ? epochToDate(calendar, dateOrEpoch)
    : dateOrEpoch;

  const era = calendar.eraLabel ? ` ${calendar.eraLabel}` : '';

  if (date.isOffDay && date.offDayIndex) {
    const offDayDef = (calendar.offDays || [])[date.offDayIndex - 1];
    const offName = offDayDef ? offDayDef.name : `روز برون‌گاه ${date.offDayIndex}`;
    return `${offName} (خارج از گاه‌شمار) - سال ${date.year}${era}`;
  }

  const monthDef = (calendar.months || [])[date.month - 1];
  const monthName = monthDef ? monthDef.name : `ماه ${date.month}`;
  return `${date.day} ${monthName}، سال ${date.year}${era}`;
}

/**
 * Advances campaign time by a specified number of days and returns full updated state.
 */
export function advanceTime(
  calendar: GenericCalendarData,
  currentEpochDay: number,
  days: number,
  campaignId: string = 'zorvania-c1'
): CampaignTimeState {
  const newEpochDay = Math.floor(currentEpochDay + days);
  const date = epochToDate(calendar, newEpochDay);
  const weekday = weekdayOf(calendar, newEpochDay);
  const activeFestivals = festivalsOn(calendar, newEpochDay);
  const formattedDate = formatCalendarDate(calendar, date);

  return {
    campaignId,
    calendarId: calendar.id || 'cal-zorvania',
    epochDay: newEpochDay,
    date,
    weekday: weekday.name,
    weekdayIndex: weekday.index,
    activeFestivals,
    formattedDate,
    updatedAt: Date.now()
  };
}

export const formatDate = formatCalendarDate;

export const SHAHROOZAN_ZORVANIA_CALENDAR: GenericCalendarData = {
  id: 'cal-zorvania',
  name: 'گاه‌شمار شاه‌روزان (زروانیا)',
  eraLabel: 'پ.ر.ن',
  startYear: 1500,
  anchor: { weekdayIndex: 0 },
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
    { id: 1, name: 'روز لرزش', folkBelief: 'لرزش تاروپود میان جهان‌ها' },
    { id: 2, name: 'روز گمگشتگی آب', folkBelief: 'آب فواره‌ها و چشمه‌ها برای یک روز راکد و بی‌طعم می‌شود' },
    { id: 3, name: 'روز بینامی', folkBelief: 'نباید نام هیچ فرد زنده‌ای با صدای بلند برده شود' },
    { id: 4, name: 'روز خاموشی آتش', folkBelief: 'آتشدان‌های معابد به خاکستر می‌نشینند تا پاکسازی شوند' },
    { id: 5, name: 'روز بند', folkBelief: 'روز بستن عهدها و گره زدن روبان‌های کهربایی' }
  ],
  festivals: [
    { monthIndex: 1, day: 1, name: 'جشن فرهگان (آغاز بهار و نوروز زروانیا)' },
    { monthIndex: 2, day: 1, name: 'جشن زروانگان' },
    { monthIndex: 3, day: 1, name: 'جشن ورناگان' },
    { monthIndex: 4, day: 1, name: 'جشن آریامانگان' },
    { monthIndex: 5, day: 1, name: 'جشن دیوانگان' },
    { monthIndex: 6, day: 1, name: 'جشن گدازگان' },
    { monthIndex: 7, day: 1, name: 'جشن پیمانگان' },
    { monthIndex: 8, day: 1, name: 'جشن کنداورگان' },
    { monthIndex: 9, day: 1, name: 'جشن مهگان' },
    { monthIndex: 10, day: 1, name: 'جشن یخبندان' },
    { monthIndex: 11, day: 1, name: 'جشن آذرافروز' },
    { monthIndex: 12, day: 1, name: 'جشن واپسینگان' }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
};

