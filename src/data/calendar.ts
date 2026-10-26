import { MonthDef, OffDayDef, WorldCalendar } from '../types';

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

export function formatWorldDate(cal: WorldCalendar): string {
  if (cal.isOffDay && cal.offDayIndex) {
    const offDay = CALENDAR_OFF_DAYS.find(o => o.id === cal.offDayIndex);
    return `${offDay ? offDay.name : 'روز برون‌گاه'} (خارج از سال‌شمار) - سال ${cal.year} پ.ر.ن.`;
  }
  const month = CALENDAR_MONTHS.find(m => m.id === cal.month);
  const monthName = month ? month.name : `${cal.month}`;
  return `${cal.day} ${monthName}، سال ${cal.year} پ.ر.ن.`;
}

export function advanceCalendarDays(current: WorldCalendar, days: number): WorldCalendar {
  let { year, month, day, isOffDay, offDayIndex = 0 } = current;

  for (let i = 0; i < days; i++) {
    if (!isOffDay) {
      if (day < 30) {
        day++;
      } else {
        // End of month
        if (month < 12) {
          month++;
          day = 1;
        } else {
          // Month 12 day 30 passed -> Enter 5 Off-Days!
          isOffDay = true;
          offDayIndex = 1;
          day = 1;
          month = 13;
        }
      }
    } else {
      // In 5 off-days
      if (offDayIndex < 5) {
        offDayIndex++;
        day = offDayIndex;
      } else {
        // 5 off-days passed -> New Year!
        year++;
        month = 1;
        day = 1;
        isOffDay = false;
        offDayIndex = 0;
      }
    }
  }

  let currentFestival: string | undefined = undefined;
  if (isOffDay) {
    const off = CALENDAR_OFF_DAYS.find(o => o.id === offDayIndex);
    currentFestival = off ? off.name : undefined;
  } else if (day === 1) {
    const m = CALENDAR_MONTHS.find(mo => mo.id === month);
    currentFestival = m ? `جشن ${m.festival}` : undefined;
  }

  return {
    ...current,
    year,
    month,
    day,
    isOffDay,
    offDayIndex,
    currentFestival,
    updatedAt: new Date().toISOString()
  };
}
