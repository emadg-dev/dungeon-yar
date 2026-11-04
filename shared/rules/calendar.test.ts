import { describe, it, expect } from 'vitest';
import {
  daysInYear,
  epochToDate,
  dateToEpoch,
  weekdayOf,
  festivalsOn,
  advance,
  formatDate,
  validateCalendar,
  SHAHROOZAN_ZORVANIA_CALENDAR,
  GATHIC_ZORVANIA_CALENDAR_TEMPLATE,
  toWorldCalendar,
  fromWorldCalendar,
  UnifiedCalendar
} from './calendar';
import {
  advanceCalendarDays,
  formatWorldDate,
  INITIAL_CALENDAR,
  CALENDAR_MONTHS,
  CALENDAR_OFF_DAYS
} from '../../src/data/calendar';
import { WorldCalendar } from '../../src/types';

describe('DungeonYar Unified Calendar Engine', () => {
  // --------------------------------------------------------------------
  // Test 1: Roundtrip dateToEpoch(epochToDate(x)) == x across large range including negatives
  // --------------------------------------------------------------------
  describe('Bijective Roundtrip: dateToEpoch(epochToDate(x)) === x', () => {
    it('roundtrips for Shahroozan Zorvania across -20,000 to +20,000 days', () => {
      // Test continuous block around anchor
      for (let epoch = -500; epoch <= 500; epoch++) {
        const date = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, epoch);
        const back = dateToEpoch(SHAHROOZAN_ZORVANIA_CALENDAR, date);
        expect(back).toBe(epoch);
      }

      // Test year boundary leaps in positive and negative directions
      const testPoints = [
        -20000, -10000, -3650, -731, -730, -366, -365, -364,
        -60, -31, -30, -2, -1, 0, 1, 2, 29, 30, 31,
        359, 360, 364, 365, 366, 729, 730, 731, 3650, 10000, 20000
      ];

      for (const epoch of testPoints) {
        const date = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, epoch);
        const back = dateToEpoch(SHAHROOZAN_ZORVANIA_CALENDAR, date);
        expect(back).toBe(epoch);
      }
    });

    it('accurately resolves negative epoch days into previous years and days', () => {
      // Anchor is Year 1500, Month 1 (Farhan), Day 1
      const dayZero = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 0);
      expect(dayZero.year).toBe(1500);
      expect(dayZero.monthId).toBe('farhan');
      expect(dayZero.day).toBe(1);
      expect(dayZero.isOffDay).toBe(false);

      // Epoch -1 must be the last day of Year 1499 (Off-day 5: روز بند)
      const minusOne = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, -1);
      expect(minusOne.year).toBe(1499);
      expect(minusOne.isOffDay).toBe(true);
      expect(minusOne.offDayIndex).toBe(5);
      expect(minusOne.offDayId).toBe('off-5');
      expect(minusOne.offDayName).toBe('روز بند');

      // Epoch -365 must be Year 1499, Month 1, Day 1
      const minus365 = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, -365);
      expect(minus365.year).toBe(1499);
      expect(minus365.monthId).toBe('farhan');
      expect(minus365.day).toBe(1);
      expect(minus365.isOffDay).toBe(false);

      // Epoch -366 must be Year 1498, Off-day 5
      const minus366 = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, -366);
      expect(minus366.year).toBe(1498);
      expect(minus366.isOffDay).toBe(true);
      expect(minus366.offDayIndex).toBe(5);
    });
  });

  // --------------------------------------------------------------------
  // Test 2: Three distinct sample calendars advancing in sync with one epochDay counter
  // --------------------------------------------------------------------
  describe('Multi-calendar synchronization with single epochDay counter', () => {
    // 1. Calendar A: 12x30 + 5 off-days (365 days), 7-day week (Shahroozan)
    const calA = SHAHROOZAN_ZORVANIA_CALENDAR;

    // 2. Calendar B: 10 months of varying lengths (total 290 days), no off-days, 5-day week
    const calB: UnifiedCalendar = {
      id: 'cal-b-ten-months',
      name: 'تقویم قبایل بیابانی',
      eraLabel: 'ع.ش',
      months: [
        { id: 'b1', name: 'ماه یکم', days: 28 },
        { id: 'b2', name: 'ماه دوم', days: 35 },
        { id: 'b3', name: 'ماه سوم', days: 20 },
        { id: 'b4', name: 'ماه چهارم', days: 40 },
        { id: 'b5', name: 'ماه پنجم', days: 25 },
        { id: 'b6', name: 'ماه ششم', days: 30 },
        { id: 'b7', name: 'ماه هفتم', days: 15 },
        { id: 'b8', name: 'ماه هشتم', days: 45 },
        { id: 'b9', name: 'ماه نهم', days: 22 },
        { id: 'b10', name: 'ماه دهم', days: 30 }
      ],
      offDays: [],
      weekdays: ['روز باد', 'روز آتش', 'روز آب', 'روز خاک', 'روز اتر'],
      anchor: { year: 700, monthId: 'b1', day: 1, weekdayIndex: 0 },
      festivals: []
    };

    // 3. Calendar C: 1 single-day month (1 day per year!), 3-day week
    const calC: UnifiedCalendar = {
      id: 'cal-c-single-day',
      name: 'شمارش خورشیدهای ابدی',
      eraLabel: 'خ.ا',
      months: [{ id: 'sol', name: 'روز خورشید', days: 1 }],
      offDays: [],
      weekdays: ['طلوع', 'اوج', 'غروب'],
      anchor: { year: 1, monthId: 'sol', day: 1, weekdayIndex: 0 },
      festivals: []
    };

    it('calculates expected days in year for each calendar', () => {
      expect(daysInYear(calA)).toBe(365);
      expect(daysInYear(calB)).toBe(290);
      expect(daysInYear(calC)).toBe(1);
    });

    it('advances all three calendars in lockstep using the campaign epochDay', () => {
      // At epochDay 0
      const dateA0 = epochToDate(calA, 0);
      const dateB0 = epochToDate(calB, 0);
      const dateC0 = epochToDate(calC, 0);

      expect(dateA0.year).toBe(1500);
      expect(dateA0.monthName).toBe('فرهان');
      expect(dateA0.day).toBe(1);

      expect(dateB0.year).toBe(700);
      expect(dateB0.monthName).toBe('ماه یکم');
      expect(dateB0.day).toBe(1);

      expect(dateC0.year).toBe(1);
      expect(dateC0.day).toBe(1);

      // Advance by 365 days
      const dateA365 = epochToDate(calA, 365);
      const dateB365 = epochToDate(calB, 365);
      const dateC365 = epochToDate(calC, 365);

      // Cal A: Year 1501, Month 1, Day 1
      expect(dateA365.year).toBe(1501);
      expect(dateA365.monthName).toBe('فرهان');
      expect(dateA365.day).toBe(1);

      // Cal B: 365 - 290 = 75 days into year 701.
      // Month b1 = 28, Month b2 = 35 -> 63 days.
      // 75 - 63 = 12 -> Month b3, day 13!
      expect(dateB365.year).toBe(701);
      expect(dateB365.monthId).toBe('b3');
      expect(dateB365.day).toBe(13);

      // Cal C: exactly 365 years elapsed! Year 1 + 365 = 366.
      expect(dateC365.year).toBe(366);
      expect(dateC365.day).toBe(1);

      // Bijective roundtrips hold for all 3
      expect(dateToEpoch(calA, dateA365)).toBe(365);
      expect(dateToEpoch(calB, dateB365)).toBe(365);
      expect(dateToEpoch(calC, dateC365)).toBe(365);
    });
  });

  // --------------------------------------------------------------------
  // Test 3: Multi-day festivals (جشن چندروزه)
  // --------------------------------------------------------------------
  describe('Multi-day festivals', () => {
    const festCalendar: UnifiedCalendar = {
      ...SHAHROOZAN_ZORVANIA_CALENDAR,
      festivals: [
        // 3-day festival on Farhan 1..3
        {
          id: 'fest-spring',
          name: 'جشن سه‌روزه بهار',
          targetType: 'month',
          monthId: 'farhan',
          day: 1,
          durationDays: 3
        },
        // 4-day festival spanning month end (Day 29 of Vapasan to Off-day 2)
        // Vapasan has 30 days, so day 29, day 30, off-1, off-2
        {
          id: 'fest-threshold',
          name: 'جشن گذر زمان',
          targetType: 'month',
          monthId: 'vapasan',
          day: 29,
          durationDays: 4
        }
      ]
    };

    it('matches multi-day festival on all active days', () => {
      // Day 1, 2, 3 of Farhan (epochDay 0, 1, 2)
      expect(festivalsOn(festCalendar, 0).map(f => f.id)).toContain('fest-spring');
      expect(festivalsOn(festCalendar, 1).map(f => f.id)).toContain('fest-spring');
      expect(festivalsOn(festCalendar, 2).map(f => f.id)).toContain('fest-spring');

      // Day 4 of Farhan (epochDay 3): festival has ended
      expect(festivalsOn(festCalendar, 3).map(f => f.id)).not.toContain('fest-spring');
    });

    it('supports multi-day festivals spanning across regular months into off-days', () => {
      // Vapasan starts at day 330 of year (11 * 30).
      // Vapasan day 29 is day 358 (epochDay 358).
      // Vapasan day 30 is day 359 (epochDay 359).
      // Off-day 1 is day 360 (epochDay 360).
      // Off-day 2 is day 361 (epochDay 361).
      // Off-day 3 is day 362 (epochDay 362 - ended).
      expect(festivalsOn(festCalendar, 358).map(f => f.id)).toContain('fest-threshold');
      expect(festivalsOn(festCalendar, 359).map(f => f.id)).toContain('fest-threshold');
      expect(festivalsOn(festCalendar, 360).map(f => f.id)).toContain('fest-threshold');
      expect(festivalsOn(festCalendar, 361).map(f => f.id)).toContain('fest-threshold');
      expect(festivalsOn(festCalendar, 362).map(f => f.id)).not.toContain('fest-threshold');
    });
  });

  // --------------------------------------------------------------------
  // Test 4: Weekdays during off-days (روز هفته در روزهای برون‌گاه)
  // --------------------------------------------------------------------
  describe('Weekdays in off-days and continuous cycle', () => {
    it('seamlessly counts off-days in the weekday sequence without skipping or freezing', () => {
      // In Shahroozan calendar:
      // Year has 365 days: 360 regular month days + 5 off-days.
      // 360 % 7 = 3.
      // If Day 1 of Month 1 is Saturday (index 0):
      // Month 12, Day 30 is at epochDay 359.
      // 359 % 7 = 2 (Monday / دوشنبه).
      // Off-day 1 (epoch 360): (360 % 7) = 3 (Tuesday / سه‌شنبه).
      // Off-day 2 (epoch 361): 4 (Wednesday / چهارشنبه).
      // Off-day 3 (epoch 362): 5 (Thursday / پنج‌شنبه).
      // Off-day 4 (epoch 363): 6 (Friday / جمعه).
      // Off-day 5 (epoch 364): 0 (Saturday / شنبه).
      // Year 1501, Month 1, Day 1 (epoch 365): 1 (Sunday / یکشنبه).

      const offDay1 = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 360);
      expect(offDay1.isOffDay).toBe(true);
      expect(offDay1.offDayIndex).toBe(1);
      expect(offDay1.weekdayName).toBe('سه‌شنبه');

      const offDay5 = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 364);
      expect(offDay5.isOffDay).toBe(true);
      expect(offDay5.offDayIndex).toBe(5);
      expect(offDay5.weekdayName).toBe('شنبه');

      const nextYearDay1 = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 365);
      expect(nextYearDay1.year).toBe(1501);
      expect(nextYearDay1.isOffDay).toBe(false);
      expect(nextYearDay1.weekdayName).toBe('یکشنبه');
    });

    it('computes correct weekdays for negative epochDays', () => {
      // Epoch 0 is Saturday ('شنبه')
      expect(weekdayOf(SHAHROOZAN_ZORVANIA_CALENDAR, 0).name).toBe('شنبه');
      // Epoch -1 is Friday ('جمعه')
      expect(weekdayOf(SHAHROOZAN_ZORVANIA_CALENDAR, -1).name).toBe('جمعه');
      // Epoch -7 is Saturday ('شنبه')
      expect(weekdayOf(SHAHROOZAN_ZORVANIA_CALENDAR, -7).name).toBe('شنبه');
    });
  });

  // --------------------------------------------------------------------
  // Test 5: Calendar structure alteration while epochDay counter remains unchanged
  // --------------------------------------------------------------------
  describe('Structural change preserves constant campaign epochDay', () => {
    it('re-evaluates date representation dynamically when calendar structure is modified', () => {
      const campaignEpochDay = 65; // Day 65 of campaign

      // With original calendar (12 x 30):
      // Day 65 = Month 3 (Vernan), Day 6
      const beforeDate = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, campaignEpochDay);
      expect(beforeDate.monthName).toBe('ورنان');
      expect(beforeDate.day).toBe(6);

      // DM modifies calendar definition: each month is now 40 days
      const modifiedCalendar: UnifiedCalendar = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        months: SHAHROOZAN_ZORVANIA_CALENDAR.months.map(m => ({ ...m, days: 40 }))
      };

      // Campaign epochDay remains 65!
      // In 40-day month structure:
      // Month 1 = 40 days, so day 65 is Month 2, Day 26!
      const afterDate = epochToDate(modifiedCalendar, campaignEpochDay);
      expect(afterDate.monthName).toBe('زروان');
      expect(afterDate.day).toBe(26);

      // The time counter is untouched, only presentation adapted
      expect(afterDate.epochDay).toBe(campaignEpochDay);
    });
  });

  // --------------------------------------------------------------------
  // Test 6: Validation rules
  // --------------------------------------------------------------------
  describe('Calendar validation (validateCalendar)', () => {
    it('validates canonical Shahroozan and Gathic templates successfully', () => {
      expect(validateCalendar(SHAHROOZAN_ZORVANIA_CALENDAR).valid).toBe(true);
      expect(validateCalendar(GATHIC_ZORVANIA_CALENDAR_TEMPLATE).valid).toBe(true);
    });

    it('rejects month with 0 or negative days', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        months: [{ id: 'm0', name: 'ماه صفر', days: 0 }]
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('حداقل ۱'))).toBe(true);
    });

    it('rejects calendar with empty months list', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        months: []
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('حداقل یک ماه'))).toBe(true);
    });

    it('rejects calendar with empty weekdays', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        weekdays: []
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('روزهای هفته'))).toBe(true);
    });

    it('rejects duplicate month IDs', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        months: [
          { id: 'dup', name: 'ماه اول', days: 30 },
          { id: 'dup', name: 'ماه دوم', days: 30 }
        ]
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('تکراری'))).toBe(true);
    });

    it('rejects festivals referencing non-existent month', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        festivals: [
          {
            id: 'bad-fest',
            name: 'جشن خیالی',
            targetType: 'month' as const,
            monthId: 'non-existent-month',
            day: 1,
            durationDays: 1
          }
        ]
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('ماه مرتبط با جشن') && e.includes('یافت نشد'))).toBe(true);
    });

    it('rejects festival with durationDays < 1', () => {
      const invalid = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        festivals: [
          {
            id: 'bad-dur',
            name: 'جشن بی‌مدت',
            targetType: 'month' as const,
            monthId: 'farhan',
            day: 1,
            durationDays: 0
          }
        ]
      };
      const res = validateCalendar(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('حداقل ۱ روز'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------
  // Test 7: formatDate with configurable era
  // --------------------------------------------------------------------
  describe('formatDate', () => {
    it('uses the calendar eraLabel dynamically', () => {
      const date = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 0);
      expect(formatDate(SHAHROOZAN_ZORVANIA_CALENDAR, date)).toBe('1 فرهان، سال 1500 پ.ر.ن.');

      // Custom era
      const customEraCal: UnifiedCalendar = {
        ...SHAHROOZAN_ZORVANIA_CALENDAR,
        eraLabel: 'عصر اژدها'
      };
      expect(formatDate(customEraCal, date)).toBe('1 فرهان، سال 1500 عصر اژدها');
    });

    it('formats off-days according to canonical style', () => {
      const offDay = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 360);
      expect(formatDate(SHAHROOZAN_ZORVANIA_CALENDAR, offDay)).toBe(
        'روز لرزش (خارج از سال‌شمار) - سال 1500 پ.ر.ن.'
      );
    });

    it('optionally includes weekday in formatted output', () => {
      const date = epochToDate(SHAHROOZAN_ZORVANIA_CALENDAR, 0);
      expect(formatDate(SHAHROOZAN_ZORVANIA_CALENDAR, date, { includeWeekday: true })).toBe(
        'شنبه، 1 فرهان، سال 1500 پ.ر.ن.'
      );
    });
  });

  // --------------------------------------------------------------------
  // Test 8: Comparative parity test with legacy advanceCalendarDays over 10,000 days
  // --------------------------------------------------------------------
  describe('Comparative parity with legacy step-by-step logic over 10,000 days', () => {
    // Reference copy of the legacy iterative function as it originally existed
    function referenceLegacyAdvanceDays(current: WorldCalendar, days: number): WorldCalendar {
      let { year, month, day, isOffDay, offDayIndex = 0 } = current;

      for (let i = 0; i < days; i++) {
        if (!isOffDay) {
          if (day < 30) {
            day++;
          } else {
            if (month < 12) {
              month++;
              day = 1;
            } else {
              isOffDay = true;
              offDayIndex = 1;
              day = 1;
              month = 13;
            }
          }
        } else {
          if (offDayIndex < 5) {
            offDayIndex++;
            day = offDayIndex;
          } else {
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
        currentFestival
      };
    }

    it('produces 100% byte-for-byte identical output to legacy logic across 10,000 continuous days', () => {
      let legacyState: WorldCalendar = { ...INITIAL_CALENDAR };

      // Step day-by-day from 1 to 10,000 and compare against advanceCalendarDays(INITIAL_CALENDAR, d)
      for (let d = 1; d <= 10000; d++) {
        legacyState = referenceLegacyAdvanceDays(legacyState, 1);
        const adaptedState = advanceCalendarDays(INITIAL_CALENDAR, d);

        expect(adaptedState.year).toBe(legacyState.year);
        expect(adaptedState.month).toBe(legacyState.month);
        expect(adaptedState.day).toBe(legacyState.day);
        expect(adaptedState.isOffDay).toBe(legacyState.isOffDay);
        expect(adaptedState.offDayIndex).toBe(legacyState.offDayIndex);
        expect(adaptedState.currentFestival).toBe(legacyState.currentFestival);

        // Also check formatWorldDate produces identical strings
        expect(formatWorldDate(adaptedState)).toBe(formatWorldDate(legacyState));
      }
    });

    it('handles advance helper from shared/rules/calendar', () => {
      const advanced = advance(SHAHROOZAN_ZORVANIA_CALENDAR, 0, 30);
      expect(advanced.epochDay).toBe(30);
      expect(advanced.date.monthName).toBe('زروان');
      expect(advanced.date.day).toBe(1);
    });

    it('converts toWorldCalendar and fromWorldCalendar reversibly', () => {
      const worldCal = toWorldCalendar(SHAHROOZAN_ZORVANIA_CALENDAR, 360);
      expect(worldCal.isOffDay).toBe(true);
      expect(worldCal.month).toBe(13);
      expect(worldCal.offDayIndex).toBe(1);

      const recoveredEpoch = fromWorldCalendar(SHAHROOZAN_ZORVANIA_CALENDAR, worldCal);
      expect(recoveredEpoch).toBe(360);
    });
  });
});
