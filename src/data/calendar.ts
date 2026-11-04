import { MonthDef, OffDayDef, WorldCalendar } from '../types';
import {
  SHAHROOZAN_ZORVANIA_CALENDAR,
  formatDate,
  epochToDate,
  dateToEpoch
} from '../../shared/rules/calendar';

export const CALENDAR_MONTHS: MonthDef[] = [
  // بهار
  { id: 1, name: 'فرهان', season: 'بهار', festival: 'فرهگان' },
  { id: 2, name: 'زروان', season: 'بهار', festival: 'زروانگان' },
  { id: 3, name: 'ورنان', season: 'بهار', festival: 'ورناگان' },
  // تابستان
  { id: 4, name: 'آریامان', season: 'تابستان', festival: 'آریامانگان' },
  { id: 5, name: 'دیوگان', season: 'تابستان', festival: 'دیوانگان' },
  { id: 6, name: 'گدازان', season: 'تابستان', festival: 'گدازگان' },
  // پاییز
  { id: 7, name: 'پیمان', season: 'پاییز', festival: 'پیمانگان' },
  { id: 8, name: 'کندان', season: 'پاییز', festival: 'کنداورگان' },
  { id: 9, name: 'مهگان', season: 'پاییز', festival: 'مهگان' },
  // زمستان
  { id: 10, name: 'یخبندان', season: 'زمستان', festival: 'یخبندان' },
  { id: 11, name: 'آذران', season: 'زمستان', festival: 'آذرافروز' },
  { id: 12, name: 'واپسان', season: 'زمستان', festival: 'واپسینگان' }
];

export const CALENDAR_OFF_DAYS: OffDayDef[] = [
  {
    id: 1,
    name: 'روز لرزش',
    folkBelief: 'باور عامیانه: لرزش تاروپود میان جهان‌ها؛ دیوان در این روز از کوه‌ها پایین نمی‌آیند و سنگ‌ها در سکوت عمیق فرو می‌روند.'
  },
  {
    id: 2,
    name: 'روز گمگشتگی آب',
    folkBelief: 'باور عامیانه: آب فواره‌ها و چشمه‌ها برای یک روز راکد و بی‌طعم می‌شود؛ پریان آب پاک ذخیره می‌کنند.'
  },
  {
    id: 3,
    name: 'روز بینامی',
    folkBelief: 'باور عامیانه: نباید نام هیچ فرد زنده‌ای با صدای بلند برده شود، مبادا سایه‌های سرگردان جای هویت او را بگیرند.'
  },
  {
    id: 4,
    name: 'روز خاموشی آتش',
    folkBelief: 'باور عامیانه: آتشدان‌های معابد به خاکستر می‌نشینند تا پاکسازی شوند؛ افروختن آتش جدید در این ۲۴ ساعت بدیمن است.'
  },
  {
    id: 5,
    name: 'روز بند',
    folkBelief: 'باور عامیانه: روز بستن عهدها و گره زدن روبان‌های کهربایی به شاخه‌های درخت کهنسال ورنا پیش از آغاز بهار سال نو.'
  }
];

export const INITIAL_CALENDAR: WorldCalendar = {
  id: 'zorvania-calendar',
  year: 1500,
  month: 1,
  day: 1,
  isOffDay: false,
  currentFestival: 'جشن فرهگان (آغاز بهار و نوروز زروانیا)',
  updatedAt: new Date().toISOString()
};

/**
 * Formats WorldCalendar date via unified calendar engine.
 * Retains exact string output for backward compatibility.
 */
export function formatWorldDate(cal: WorldCalendar): string {
  const epoch = dateToEpoch(SHAHROOZAN_ZORVANIA_CALENDAR, {
    year: cal.year,
    month: cal.month,
    day: cal.day,
    isOffDay: Boolean(cal.isOffDay || cal.month === 13),
    offDayIndex: cal.offDayIndex
  });
  return formatDate(SHAHROOZAN_ZORVANIA_CALENDAR, epoch);
}

/**
 * Advances WorldCalendar days via unified calendar epoch math.
 * Completely maintains behavioral parity with the legacy step-by-step logic.
 */
export function advanceCalendarDays(current: WorldCalendar, days: number): WorldCalendar {
  const currentEpoch = dateToEpoch(SHAHROOZAN_ZORVANIA_CALENDAR, {
    year: current.year,
    month: current.month,
    day: current.day,
    isOffDay: Boolean(current.isOffDay || current.month === 13),
    offDayIndex: current.offDayIndex
  });

  const nextEpoch = currentEpoch + days;
  const date = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, nextEpoch);

  let currentFestival: string | undefined = undefined;
  if (date.isOffDay) {
    const off = CALENDAR_OFF_DAYS.find(o => o.id === date.offDayIndex);
    currentFestival = off ? off.name : undefined;
  } else if (date.day === 1) {
    const m = CALENDAR_MONTHS.find(mo => mo.id === (date.monthIndex + 1));
    currentFestival = m ? `جشن ${m.festival}` : undefined;
  }

  return {
    ...current,
    year: date.year,
    month: date.isOffDay ? 13 : date.monthIndex + 1,
    day: date.day,
    isOffDay: date.isOffDay,
    offDayIndex: date.offDayIndex || 0,
    currentFestival,
    updatedAt: new Date().toISOString()
  };
}
