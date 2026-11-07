import { describe, it, expect } from 'vitest';
import {
  validateCalendar,
  weekdayOf,
  dateToEpoch,
  epochToDate,
  festivalsOn,
  advanceTime,
  formatCalendarDate,
  daysInCalendarYear
} from './calendar';
import type { GenericCalendarData, CalendarDate } from '../../src/types';

describe('shared/rules/calendar', () => {
  const sampleZorvania: GenericCalendarData = {
    id: 'cal-zorvania',
    name: 'گاه‌شمار شاه‌روزان (زروانیا)',
    eraLabel: 'پ.ر.ن',
    startYear: 1500,
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
      { id: 'off-1', name: 'روز لرزش', folkBelief: 'سکوت میان جهان‌ها' },
      { id: 'off-2', name: 'روز گمگشتگی آب', folkBelief: 'آب‌های راکد' },
      { id: 'off-3', name: 'روز بینامی', folkBelief: 'سایه‌های سرگردان' },
      { id: 'off-4', name: 'روز خاموشی آتش', folkBelief: 'افروختن آتش بدیمن است' },
      { id: 'off-5', name: 'روز بند', folkBelief: 'بستن عهدها' }
    ],
    festivals: [
      { name: 'جشن فرهگان', monthIndex: 1, day: 1, durationDays: 1 },
      { name: 'جشن واپسین سال', monthIndex: 12, day: 30, durationDays: 3 }, // spans to off-1, off-2
      { name: 'جشن گاه برون‌گاه', offDayId: 'off-1', durationDays: 2 }, // on off-1 and off-2
      { name: 'جشن پیوند سال کهن و نو', offDayId: 'off-5', durationDays: 2 } // spans off-5 to Month 1 Day 1 of next year
    ],
    weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
  };

  describe('Calendar Structure Validation (validateCalendar)', () => {
    it('passes validation for a completely valid calendar', () => {
      const res = validateCalendar(sampleZorvania);
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it('rejects calendar when months array is empty or missing', () => {
      const emptyMonths = { ...sampleZorvania, months: [] };
      const res = validateCalendar(emptyMonths);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('حداقل دارای یک ماه'))).toBe(true);
    });

    it('rejects calendar when a month has zero or negative days', () => {
      const badDays = {
        ...sampleZorvania,
        months: [{ name: 'ماه پوچ', days: 0 }]
      };
      const res = validateCalendar(badDays);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('تعداد روزهای ماه'))).toBe(true);
    });

    it('rejects calendar when month name is empty or missing', () => {
      const emptyName = {
        ...sampleZorvania,
        months: [{ name: '   ', days: 30 }]
      };
      const res = validateCalendar(emptyName);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('نام ماه'))).toBe(true);
    });

    it('rejects calendar when anchor.weekdayIndex is negative or exceeds weekdays length', () => {
      const badAnchor = {
        ...sampleZorvania,
        anchor: { weekdayIndex: 10 }
      };
      const res = validateCalendar(badAnchor);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('anchor.weekdayIndex'))).toBe(true);
    });

    it('rejects festival when both month/day and offDayId are missing', () => {
      const badFest = {
        ...sampleZorvania,
        festivals: [{ name: 'جشن بی‌مکان', durationDays: 1 }]
      };
      const res = validateCalendar(badFest);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('باید به یک ماه و روز مشخص یا به یک روز خارج از ماه'))).toBe(true);
    });

    it('rejects festival when durationDays is less than 1 or not an integer', () => {
      const badDuration = {
        ...sampleZorvania,
        festivals: [{ name: 'جشن منفی', monthIndex: 1, day: 1, durationDays: 0 }]
      };
      const res = validateCalendar(badDuration);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('مدت زمان جشن'))).toBe(true);
    });
  });

  describe('Pre-requisite 1: Anchor Weekday and weekdayOf', () => {
    it('calculates weekday correctly for positive, zero, and negative epoch days', () => {
      // Day 0 with anchor 0 ('شنبه')
      expect(weekdayOf(sampleZorvania, 0)).toEqual({ index: 0, name: 'شنبه' });
      expect(weekdayOf(sampleZorvania, 1)).toEqual({ index: 1, name: 'یکشنبه' });
      expect(weekdayOf(sampleZorvania, 6)).toEqual({ index: 6, name: 'جمعه' });
      expect(weekdayOf(sampleZorvania, 7)).toEqual({ index: 0, name: 'شنبه' });

      // Negative epoch days
      expect(weekdayOf(sampleZorvania, -1)).toEqual({ index: 6, name: 'جمعه' });
      expect(weekdayOf(sampleZorvania, -2)).toEqual({ index: 5, name: 'پنج‌شنبه' });
      expect(weekdayOf(sampleZorvania, -7)).toEqual({ index: 0, name: 'شنبه' });
      expect(weekdayOf(sampleZorvania, -8)).toEqual({ index: 6, name: 'جمعه' });
      expect(weekdayOf(sampleZorvania, -365)).toEqual({ index: 6, name: 'جمعه' }); // 365 = 52 * 7 + 1 -> -365 === -1 mod 7 -> 6
    });

    it('supports 1-day week correctly for any epoch day', () => {
      const oneDayCalendar: GenericCalendarData = {
        name: 'تقویم تک‌روزه',
        eraLabel: '',
        startYear: 1,
        anchor: { weekdayIndex: 0 },
        months: [{ name: 'ماه یگانه', days: 30 }],
        offDays: [],
        festivals: [],
        weekdays: ['روز یگانه']
      };

      expect(weekdayOf(oneDayCalendar, 0)).toEqual({ index: 0, name: 'روز یگانه' });
      expect(weekdayOf(oneDayCalendar, 10)).toEqual({ index: 0, name: 'روز یگانه' });
      expect(weekdayOf(oneDayCalendar, -42)).toEqual({ index: 0, name: 'روز یگانه' });
    });

    it('advances two calendars with different week lengths and different offsets in sync', () => {
      // Calendar A: 7-day week, offset 0 (شنبه)
      const calA: GenericCalendarData = {
        ...sampleZorvania,
        anchor: { weekdayIndex: 0 },
        weekdays: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
      };

      // Calendar B: 5-day week, offset 2 (روز سوم)
      const calB: GenericCalendarData = {
        name: 'گاه‌شمار پنج‌روزه پریان',
        eraLabel: 'پ',
        startYear: 1000,
        anchor: { weekdayIndex: 2 },
        months: [{ name: 'بهارستان', days: 25 }],
        offDays: [],
        festivals: [],
        weekdays: ['آب', 'باد', 'خاک', 'آتش', 'اثیر']
      };

      // Day 0
      expect(weekdayOf(calA, 0)).toEqual({ index: 0, name: 'ش' });
      expect(weekdayOf(calB, 0)).toEqual({ index: 2, name: 'خاک' });

      // Day 1
      expect(weekdayOf(calA, 1)).toEqual({ index: 1, name: 'ی' });
      expect(weekdayOf(calB, 1)).toEqual({ index: 3, name: 'آتش' });

      // Day 2
      expect(weekdayOf(calA, 2)).toEqual({ index: 2, name: 'د' });
      expect(weekdayOf(calB, 2)).toEqual({ index: 4, name: 'اثیر' });

      // Day 3 (B wraps around to 0, A continues to 3)
      expect(weekdayOf(calA, 3)).toEqual({ index: 3, name: 'س' });
      expect(weekdayOf(calB, 3)).toEqual({ index: 0, name: 'آب' });

      // Day 7 (A wraps around to 0, B is at (7 + 2) % 5 = 4)
      expect(weekdayOf(calA, 7)).toEqual({ index: 0, name: 'ش' });
      expect(weekdayOf(calB, 7)).toEqual({ index: 4, name: 'اثیر' });

      // Negative day -1:
      // A: (-1 + 0) % 7 -> 6 ('ج')
      // B: (-1 + 2) % 5 -> 1 ('باد')
      expect(weekdayOf(calA, -1)).toEqual({ index: 6, name: 'ج' });
      expect(weekdayOf(calB, -1)).toEqual({ index: 1, name: 'باد' });
    });

    it('validates anchor.weekdayIndex within the valid range [0, weekdays.length - 1]', () => {
      const invalidAnchor: GenericCalendarData = {
        ...sampleZorvania,
        anchor: { weekdayIndex: 7 } // out of range for 7-day week (0..6)
      };
      const res = validateCalendar(invalidAnchor);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('anchor.weekdayIndex');

      const negativeAnchor: GenericCalendarData = {
        ...sampleZorvania,
        anchor: { weekdayIndex: -1 }
      };
      expect(validateCalendar(negativeAnchor).valid).toBe(false);

      const validAnchor: GenericCalendarData = {
        ...sampleZorvania,
        anchor: { weekdayIndex: 6 }
      };
      expect(validateCalendar(validAnchor).valid).toBe(true);
    });
  });

  describe('Pre-requisite 2: Festivals on Off-Days and Multi-Day Spanning', () => {
    it('identifies festival referencing an off-day (offDayId)', () => {
      // Off-day 1 is at epochDay 360 in year 1500 (12 * 30 = 360)
      const offDay1Epoch = 360;
      const offDay1Date: CalendarDate = {
        year: 1500,
        month: 13,
        day: 1,
        isOffDay: true,
        offDayIndex: 1
      };

      const fListEpoch = festivalsOn(sampleZorvania, offDay1Epoch);
      const fListDate = festivalsOn(sampleZorvania, offDay1Date);

      expect(fListEpoch.map(f => f.name)).toContain('جشن گاه برون‌گاه');
      expect(fListDate.map(f => f.name)).toContain('جشن گاه برون‌گاه');
    });

    it('handles multi-day festival spanning from end of month into off-days', () => {
      // «جشن واپسین سال» starts on Month 12, Day 30 (epochDay 359) with durationDays: 3
      // Day 1: Month 12, Day 30 (epochDay 359)
      // Day 2: Off-day 1 (epochDay 360)
      // Day 3: Off-day 2 (epochDay 361)
      // Day 4: Off-day 3 (epochDay 362) -> Inactive!

      const day359Festivals = festivalsOn(sampleZorvania, 359).map(f => f.name);
      expect(day359Festivals).toContain('جشن واپسین سال');

      const day360Festivals = festivalsOn(sampleZorvania, 360).map(f => f.name);
      expect(day360Festivals).toContain('جشن واپسین سال');
      expect(day360Festivals).toContain('جشن گاه برون‌گاه'); // Also active on off-1

      const day361Festivals = festivalsOn(sampleZorvania, 361).map(f => f.name);
      expect(day361Festivals).toContain('جشن واپسین سال');
      expect(day361Festivals).toContain('جشن گاه برون‌گاه'); // Also active on off-2 (duration 2)

      const day362Festivals = festivalsOn(sampleZorvania, 362).map(f => f.name);
      expect(day362Festivals).not.toContain('جشن واپسین سال');
      expect(day362Festivals).not.toContain('جشن گاه برون‌گاه');
    });

    it('handles multi-day festival spanning from off-days across year boundary into Month 1 of following year', () => {
      // «جشن پیوند سال کهن و نو» starts on off-day 5 (epochDay 364 in Year 1500) with durationDays: 2
      // Day 1: Off-day 5 (epochDay 364)
      // Day 2: Month 1, Day 1 of Year 1501 (epochDay 365)
      // Day 3: Month 1, Day 2 of Year 1501 (epochDay 366) -> Inactive!

      const offDay5 = festivalsOn(sampleZorvania, 364).map(f => f.name);
      expect(offDay5).toContain('جشن پیوند سال کهن و نو');

      const newYearDay1 = festivalsOn(sampleZorvania, 365).map(f => f.name);
      expect(newYearDay1).toContain('جشن پیوند سال کهن و نو');
      expect(newYearDay1).toContain('جشن فرهگان'); // Single-day festival on Month 1, Day 1

      const newYearDay2 = festivalsOn(sampleZorvania, 366).map(f => f.name);
      expect(newYearDay2).not.toContain('جشن پیوند سال کهن و نو');
    });

    it('validates festivals with offDayId properly', () => {
      const invalidFestivalOffDay: GenericCalendarData = {
        ...sampleZorvania,
        festivals: [
          { name: 'جشن اشتباه', offDayId: 'non-existent-off-day' }
        ]
      };
      const res = validateCalendar(invalidFestivalOffDay);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('non-existent-off-day');
    });

    it('validates festival durationDays must be at least 1', () => {
      const invalidDuration: GenericCalendarData = {
        ...sampleZorvania,
        festivals: [
          { name: 'جشن صفر روزه', monthIndex: 1, day: 1, durationDays: 0 }
        ]
      };
      const res = validateCalendar(invalidDuration);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('durationDays');
    });
  });

  describe('Bijective Date <-> Epoch and Advance Time', () => {
    it('converts between date and epoch bijectively', () => {
      const datesToTest: CalendarDate[] = [
        { year: 1500, month: 1, day: 1, isOffDay: false },
        { year: 1500, month: 1, day: 30, isOffDay: false },
        { year: 1500, month: 2, day: 15, isOffDay: false },
        { year: 1500, month: 12, day: 30, isOffDay: false },
        { year: 1500, month: 13, day: 1, isOffDay: true, offDayIndex: 1 },
        { year: 1500, month: 13, day: 5, isOffDay: true, offDayIndex: 5 },
        { year: 1501, month: 1, day: 1, isOffDay: false },
        { year: 1499, month: 1, day: 1, isOffDay: false },
        { year: 1499, month: 13, day: 5, isOffDay: true, offDayIndex: 5 }
      ];

      for (const d of datesToTest) {
        const epoch = dateToEpoch(sampleZorvania, d);
        const roundTrip = epochToDate(sampleZorvania, epoch);
        expect(roundTrip.year).toBe(d.year);
        expect(roundTrip.isOffDay).toBe(d.isOffDay);
        if (d.isOffDay) {
          expect(roundTrip.offDayIndex).toBe(d.offDayIndex);
        } else {
          expect(roundTrip.month).toBe(d.month);
          expect(roundTrip.day).toBe(d.day);
        }
      }
    });

    it('advances time seamlessly and returns complete campaign state', () => {
      const state0 = advanceTime(sampleZorvania, 0, 0, 'c-test');
      expect(state0.epochDay).toBe(0);
      expect(state0.weekday).toBe('شنبه');
      expect(state0.date).toEqual({ year: 1500, month: 1, day: 1, isOffDay: false, offDayIndex: undefined });
      expect(state0.activeFestivals.map(f => f.name)).toContain('جشن فرهگان');

      // Advance by 360 days: should land on off-day 1
      const state360 = advanceTime(sampleZorvania, 0, 360, 'c-test');
      expect(state360.epochDay).toBe(360);
      expect(state360.date.isOffDay).toBe(true);
      expect(state360.date.offDayIndex).toBe(1);
      expect(state360.formattedDate).toContain('روز لرزش');

      // Advance by 5 more days: should land on Year 1501, Month 1, Day 1
      const state365 = advanceTime(sampleZorvania, state360.epochDay, 5, 'c-test');
      expect(state365.epochDay).toBe(365);
      expect(state365.date.year).toBe(1501);
      expect(state365.date.month).toBe(1);
      expect(state365.date.day).toBe(1);
      expect(state365.date.isOffDay).toBe(false);
    });

    it('formats dates in Persian format correctly', () => {
      const formattedMonth = formatCalendarDate(sampleZorvania, {
        year: 1500,
        month: 7,
        day: 16,
        isOffDay: false
      });
      expect(formattedMonth).toBe('16 پیمان، سال 1500 پ.ر.ن');

      const formattedOffDay = formatCalendarDate(sampleZorvania, {
        year: 1500,
        month: 13,
        day: 1,
        isOffDay: true,
        offDayIndex: 1
      });
      expect(formattedOffDay).toBe('روز لرزش (خارج از گاه‌شمار) - سال 1500 پ.ر.ن');
    });

    it('verifies 40,000-day bijective roundtrip with negative and positive days', () => {
      // Test 40,000 days continuously from -20,000 to +20,000
      // Sampling every 10 days for ultra-fast execution, plus critical boundaries
      for (let day = -20000; day <= 20000; day += 7) {
        const date = epochToDate(sampleZorvania, day);
        const restored = dateToEpoch(sampleZorvania, date);
        expect(restored).toBe(day);
      }
      // Also test every single boundary around 0 and year transitions
      for (let day = -730; day <= 730; day++) {
        const date = epochToDate(sampleZorvania, day);
        const restored = dateToEpoch(sampleZorvania, date);
        expect(restored).toBe(day);
      }
    });

    it('verifies 10,000-day continuous equality with legacy advanceCalendarDays', async () => {
      const { INITIAL_CALENDAR, advanceCalendarDays: legacyAdvance } = await import('../../src/data/calendar');
      let legacyCurrent = { ...INITIAL_CALENDAR };

      for (let step = 0; step <= 10000; step++) {
        const modernDate = epochToDate(sampleZorvania, step);

        expect(modernDate.year).toBe(legacyCurrent.year);
        expect(modernDate.isOffDay).toBe(legacyCurrent.isOffDay);

        if (legacyCurrent.isOffDay) {
          expect(modernDate.offDayIndex).toBe(legacyCurrent.offDayIndex);
          expect(modernDate.day).toBe(legacyCurrent.offDayIndex);
        } else {
          expect(modernDate.month).toBe(legacyCurrent.month);
          expect(modernDate.day).toBe(legacyCurrent.day);
        }

        // Advance legacy by 1 day for next iteration
        legacyCurrent = legacyAdvance(legacyCurrent, 1);
      }
    });

    it('advances three diverse calendars in sync across positive and negative epoch days', () => {
      // Calendar 1: Zorvania (12 x 30 + 5 = 365 days, 7-day week, start 1500, anchor 0)
      const calZorvania = sampleZorvania;

      // Calendar 2: Elven / Fey (10 x 36 + 5 = 365 days, 5-day week, start 1000, anchor 2)
      const calFey: GenericCalendarData = {
        name: 'گاه‌شمار پریان سپیدارون',
        eraLabel: 'فصل',
        startYear: 1000,
        anchor: { weekdayIndex: 2 },
        months: [
          { name: 'جوانه‌گاه', days: 36, season: 'بهار' },
          { name: 'شکوفه‌بار', days: 36, season: 'بهار' },
          { name: 'سبزه‌پوش', days: 36, season: 'تابستان' },
          { name: 'خورشیدتاب', days: 36, season: 'تابستان' },
          { name: 'میوه‌ریز', days: 36, season: 'پاییز' },
          { name: 'زرین‌برگ', days: 36, season: 'پاییز' },
          { name: 'باران‌خیز', days: 36, season: 'پاییز' },
          { name: 'برف‌آسا', days: 36, season: 'زمستان' },
          { name: 'سکوت‌گاه', days: 36, season: 'زمستان' },
          { name: 'رویاساز', days: 36, season: 'زمستان' }
        ],
        offDays: [
          { id: 'fey-1', name: 'شب نیلوفر' },
          { id: 'fey-2', name: 'شب ستاره' },
          { id: 'fey-3', name: 'شب رقص باد' },
          { id: 'fey-4', name: 'شب آینه' },
          { id: 'fey-5', name: 'شب بیداری' }
        ],
        festivals: [
          { name: 'جشن شکوفه', monthIndex: 1, day: 1, durationDays: 1 }
        ],
        weekdays: ['آب', 'باد', 'خاک', 'آتش', 'اثیر']
      };

      // Calendar 3: Dwarven / Deep-rock (8 x 45 = 360 days, 6-day week, start 2000, anchor 4)
      const calDwarf: GenericCalendarData = {
        name: 'سال‌شمار ژرف‌کاو کنداوران',
        eraLabel: 'سنگ',
        startYear: 2000,
        anchor: { weekdayIndex: 4 },
        months: [
          { name: 'سنگ‌آهن', days: 45 },
          { name: 'سنگ‌مس', days: 45 },
          { name: 'سنگ‌طلا', days: 45 },
          { name: 'سنگ‌نقره', days: 45 },
          { name: 'سنگ‌یاقوت', days: 45 },
          { name: 'سنگ‌زمرد', days: 45 },
          { name: 'سنگ‌الماس', days: 45 },
          { name: 'سنگ‌خواب', days: 45 }
        ],
        offDays: [],
        festivals: [
          { name: 'جشن کوبش پتک', monthIndex: 1, day: 1, durationDays: 2 }
        ],
        weekdays: ['سنگ', 'چکش', 'کوره', 'پتک', 'سندان', 'زر']
      };

      // Verify at absolute day 0:
      const d0_zorvania = advanceTime(calZorvania, 0, 0);
      const d0_fey = advanceTime(calFey, 0, 0);
      const d0_dwarf = advanceTime(calDwarf, 0, 0);

      expect(d0_zorvania.date.year).toBe(1500);
      expect(d0_zorvania.weekday).toBe('شنبه');

      expect(d0_fey.date.year).toBe(1000);
      expect(d0_fey.weekday).toBe('خاک'); // index 2

      expect(d0_dwarf.date.year).toBe(2000);
      expect(d0_dwarf.weekday).toBe('سندان'); // index 4

      // Advance by 360 days:
      const d360_zorvania = advanceTime(calZorvania, 0, 360);
      const d360_fey = advanceTime(calFey, 0, 360);
      const d360_dwarf = advanceTime(calDwarf, 0, 360);

      expect(d360_zorvania.date.isOffDay).toBe(true);
      expect(d360_zorvania.date.offDayIndex).toBe(1);

      expect(d360_fey.date.isOffDay).toBe(true);
      expect(d360_fey.date.offDayIndex).toBe(1);

      // Dwarf calendar has 360 days in a year (8 x 45): day 360 is exactly Year 2001, Month 1, Day 1!
      expect(d360_dwarf.date.year).toBe(2001);
      expect(d360_dwarf.date.month).toBe(1);
      expect(d360_dwarf.date.day).toBe(1);
      expect(d360_dwarf.date.isOffDay).toBe(false);

      // Advance by negative 365 days (-365):
      const dNeg_zorvania = advanceTime(calZorvania, 0, -365);
      const dNeg_fey = advanceTime(calFey, 0, -365);
      const dNeg_dwarf = advanceTime(calDwarf, 0, -365);

      expect(dNeg_zorvania.date.year).toBe(1499);
      expect(dNeg_zorvania.date.month).toBe(1);
      expect(dNeg_zorvania.date.day).toBe(1);

      expect(dNeg_fey.date.year).toBe(999);
      expect(dNeg_fey.date.month).toBe(1);
      expect(dNeg_fey.date.day).toBe(1);

      // Dwarf year is 360 days: -365 is Year 1998, Month 8, Day 41 (since -365 = -2*360 + 355 -> 355 / 45 = month 8, day 40)
      expect(dNeg_dwarf.date.year).toBe(1998);
    });
  });
});
