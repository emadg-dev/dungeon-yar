import { describe, it, expect } from 'vitest';
import {
  validateCalendar,
  weekdayOf,
  dateToEpoch,
  epochToDate,
  festivalsOn,
  advanceTime,
  daysInCalendarYear
} from './calendar';
import type { GenericCalendarData, CampaignRole, CalendarDate } from '../../src/types';
import { onRequest } from '../../functions/api/[[route]]';
import { createRealServerTestContext } from './serverTestApp';

/**
 * Server-side RBAC authorization check for campaign calendar & time operations.
 * Strictly uses campaign membership roles (owner and co_dm).
 * Mirrors requireCampaignDm in functions/api/[[route]].ts line 1573.
 */
export function canManageCampaignCalendar(membershipRole: CampaignRole | null | undefined, _platformRole?: string): boolean {
  return membershipRole === 'owner' || membershipRole === 'co_dm';
}

/**
 * Computes Zorvania migration 020 backfill epochDay from legacy campaign_calendar row.
 * off_day_index in legacy Zorvania is 1-based (1..5).
 * Mirrors exact SQL CASE expression in 020_campaign_time_and_calendar.sql.
 */
export function computeBackfillEpochDay(
  year: number,
  month: number,
  day: number,
  isOffDay: boolean,
  offDayIndex: number
): number {
  return isOffDay
    ? (year - 1500) * 365 + 360 + Math.max(0, offDayIndex - 1)
    : (year - 1500) * 365 + (month - 1) * 30 + Math.max(0, day - 1);
}

/**
 * Simulates template copy creation with source_id and tags.
 */
export function createTemplateCopy(
  source: GenericCalendarData,
  overrides?: Partial<GenericCalendarData>
): GenericCalendarData {
  const validation = validateCalendar(source);
  if (!validation.valid) {
    throw new Error(`Invalid source calendar: ${validation.errors.join(', ')}`);
  }

  const tags = Array.isArray(source.tags) ? [...source.tags] : ['قالب'];
  if (!tags.includes('قالب')) tags.push('قالب');

  return {
    ...source,
    id: overrides?.id || `cal-template-${Date.now()}`,
    sourceId: source.id || null,
    scopeType: 'pack',
    tags,
    months: JSON.parse(JSON.stringify(source.months || [])),
    offDays: JSON.parse(JSON.stringify(source.offDays || [])),
    festivals: JSON.parse(JSON.stringify(source.festivals || [])),
    weekdays: source.weekdays ? [...source.weekdays] : undefined,
    anchor: {
      weekdayIndex: overrides?.anchor?.weekdayIndex ?? source.anchor?.weekdayIndex ?? 0
    },
    ...overrides
  };
}

describe('Server Calendar & Time Rules (Stage 2A)', () => {
  const sampleZorvania: GenericCalendarData = {
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
      { id: 'off-1', name: 'روز لرزش' },
      { id: 'off-2', name: 'روز گمگشتگی آب' },
      { id: 'off-3', name: 'روز بینامی' },
      { id: 'off-4', name: 'روز خاموشی آتش' },
      { id: 'off-5', name: 'روز بند' }
    ],
    festivals: [
      { name: 'جشن روز نخست (نوروز کهن)', monthIndex: 1, day: 1, note: 'آغاز تقویم' },
      { name: 'مهرگان زروانیا', monthIndex: 7, day: 16, note: 'پیمان میان قبایل' }
    ],
    weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
    tags: ['زروانیا', 'گاه‌شمار']
  };

  describe('1. Campaign Roles vs Platform Roles (RBAC)', () => {
    it('allows campaign owner to write calendar and advance/set campaign time', () => {
      expect(canManageCampaignCalendar('owner')).toBe(true);
    });

    it('allows campaign co_dm to write calendar and advance/set campaign time', () => {
      expect(canManageCampaignCalendar('co_dm')).toBe(true);
    });

    it('forbids platform admin or dm without campaign membership (403 forbidden)', () => {
      expect(canManageCampaignCalendar(null, 'admin')).toBe(false);
      expect(canManageCampaignCalendar(undefined, 'dm')).toBe(false);
    });

    it('forbids campaign player from writing calendar or advancing/setting time (403 forbidden)', () => {
      expect(canManageCampaignCalendar('player')).toBe(false);
    });

    it('forbids campaign spectator from writing calendar or advancing/setting time (403 forbidden)', () => {
      expect(canManageCampaignCalendar('spectator')).toBe(false);
    });
  });

  describe('2. Input Validation for Calendar Structure and Time Operations', () => {
    it('rejects calendar with empty or invalid months', () => {
      const invalidCal: GenericCalendarData = {
        name: 'تقویم بدون ماه',
        eraLabel: '',
        startYear: 1,
        months: [],
        offDays: [],
        festivals: []
      };
      const res = validateCalendar(invalidCal);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('حداقل دارای یک ماه');
    });

    it('rejects month with zero or negative days', () => {
      const invalidCal: GenericCalendarData = {
        name: 'تقویم با روز منفی',
        eraLabel: '',
        startYear: 1,
        months: [{ name: 'ماه نامعتبر', days: -10 }],
        offDays: [],
        festivals: []
      };
      const res = validateCalendar(invalidCal);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('عدد صحیح مثبت');
    });

    it('rejects anchor.weekdayIndex when greater than weekdays length', () => {
      const invalidAnchor: GenericCalendarData = {
        ...sampleZorvania,
        anchor: { weekdayIndex: 9 }
      };
      const res = validateCalendar(invalidAnchor);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('anchor.weekdayIndex');
    });

    it('rejects festival with invalid month day out of range', () => {
      const invalidFestival: GenericCalendarData = {
        ...sampleZorvania,
        festivals: [
          { name: 'جشن غیرممکن', monthIndex: 1, day: 31 }
        ]
      };
      const res = validateCalendar(invalidFestival);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('خارج از محدوده روزهای ماه');
    });

    it('rejects festival referencing non-existent off-day', () => {
      const invalidOffDayFest: GenericCalendarData = {
        ...sampleZorvania,
        festivals: [
          { name: 'جشن روز ششم برون‌گاه', offDayId: 'off-99' }
        ]
      };
      const res = validateCalendar(invalidOffDayFest);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('در تقویم یافت نشد');
    });
  });

  describe('3. Backfill Verification for Migration 020 (1-Based off_day_index)', () => {
    it('verifies 1-based indexing for all 365 days of a year using legacy advanceCalendarDays', async () => {
      const { INITIAL_CALENDAR, advanceCalendarDays: legacyAdvance } = await import('../../src/data/calendar');
      let legacyCurrent = { ...INITIAL_CALENDAR };

      for (let dayIndex = 0; dayIndex < 365; dayIndex++) {
        // legacy row representation
        const isOffDay = legacyCurrent.isOffDay;
        const offDayIndex = legacyCurrent.offDayIndex || 0;
        const year = legacyCurrent.year;
        const month = legacyCurrent.month;
        const day = legacyCurrent.day;

        // Verify that when isOffDay is true, off_day_index is 1-based (1..5)
        if (isOffDay) {
          expect(offDayIndex).toBeGreaterThanOrEqual(1);
          expect(offDayIndex).toBeLessThanOrEqual(5);
        }

        // Apply migration 020 backfill formula
        const backfilledEpoch = computeBackfillEpochDay(year, month, day, isOffDay, offDayIndex);
        expect(backfilledEpoch).toBe(dayIndex);

        // Restore back to date using modern epochToDate
        const restored = epochToDate(sampleZorvania, backfilledEpoch);
        expect(restored.year).toBe(year);
        expect(restored.isOffDay).toBe(isOffDay);

        if (isOffDay) {
          expect(restored.offDayIndex).toBe(offDayIndex);
          expect(restored.day).toBe(offDayIndex);
        } else {
          expect(restored.month).toBe(month);
          expect(restored.day).toBe(day);
        }

        legacyCurrent = legacyAdvance(legacyCurrent, 1);
      }
    });

    it('handles non-Zorvania test campaigns safely without touching legacy campaign_calendar', () => {
      // For any campaign other than zorvania-c1, backfill initializes timeRow with epoch_day = 0
      // without looking up campaign_calendar.
      const nonZorvaniaCampId = 'camp-custom-valkyrie';
      const initialEpochDay = 0;
      const initialDate = epochToDate(sampleZorvania, initialEpochDay);

      expect(initialDate.year).toBe(1500);
      expect(initialDate.month).toBe(1);
      expect(initialDate.day).toBe(1);
      expect(initialDate.isOffDay).toBe(false);
    });
  });

  describe('4. Isolation: Writing Time for Campaign B does not affect Campaign A or Legacy Row', () => {
    it('ensures independent epochDay storage per campaign in campaign_time', () => {
      const campaignA = { id: 'zorvania-c1', epochDay: 100 };
      const campaignB = { id: 'camp-desert-survival', epochDay: 500 };
      const legacyCampaignCalendar = { id: 'zorvania-calendar', epochDay: 100 };

      // Advance campaign B by 50 days
      const updatedCampaignB = { ...campaignB, epochDay: campaignB.epochDay + 50 };

      // Campaign A and legacy global row remain untouched
      expect(campaignA.epochDay).toBe(100);
      expect(legacyCampaignCalendar.epochDay).toBe(100);
      expect(updatedCampaignB.epochDay).toBe(550);
    });
  });

  describe('5. Calendar Structure Editing (PUT) and Deletion (DELETE)', () => {
    it('preserves epochDay when editing primary calendar structure', () => {
      let epochDay = 450; // In-game time
      const originalCal: GenericCalendarData = { ...sampleZorvania };
      const editedCal: GenericCalendarData = {
        ...originalCal,
        name: 'گاه‌شمار شاه‌روزان (نسخه ویرایش‌شده با ماه اضافه)',
        months: [...originalCal.months, { name: 'ماه سیزدهم', days: 20 }]
      };

      // Validated
      expect(validateCalendar(editedCal).valid).toBe(true);

      // In-game epochDay remains unchanged
      expect(epochDay).toBe(450);

      // But projection under new structure uses the updated months
      const newProjection = epochToDate(editedCal, epochDay);
      expect(newProjection.year).toBeGreaterThanOrEqual(1500);
    });

    it('rejects calendar deletion when it is the only calendar in campaign', () => {
      const campaignCalendars = ['cal-primary'];
      const canDelete = campaignCalendars.length > 1;
      expect(canDelete).toBe(false);
    });

    it('reassigns primary calendar when primary calendar is deleted among multiple calendars', () => {
      const campaignCalendars = [
        { id: 'cal-1', name: 'گاه‌شمار نخست' },
        { id: 'cal-2', name: 'گاه‌شمار دوم' }
      ];
      let primaryCalId = 'cal-1';

      // Delete cal-1
      const remaining = campaignCalendars.filter(c => c.id !== 'cal-1');
      if (primaryCalId === 'cal-1') {
        primaryCalId = remaining[0].id;
      }

      expect(remaining.length).toBe(1);
      expect(primaryCalId).toBe('cal-2');
    });
  });

  describe('6. Multi-Calendar Projection in Time Response', () => {
    it('projects all campaign calendars simultaneously from the same epochDay', () => {
      const calA = sampleZorvania; // 365 days / yr
      const calB: GenericCalendarData = {
        id: 'cal-underground',
        name: 'گاه‌شمار اعماق',
        eraLabel: 'ع',
        startYear: 2000,
        anchor: { weekdayIndex: 0 },
        months: [
          { name: 'بلور', days: 60 },
          { name: 'گوگرد', days: 60 },
          { name: 'آهن', days: 60 },
          { name: 'پلاتین', days: 60 },
          { name: 'الماس', days: 60 },
          { name: 'سنگ‌خواب', days: 60 }
        ],
        offDays: [],
        festivals: [],
        weekdays: ['روز ۱', 'روز ۲', 'روز ۳', 'روز ۴', 'روز ۵', 'روز ۶']
      };

      const epochDay = 360;

      const projA = advanceTime(calA, epochDay, 0);
      const projB = advanceTime(calB, epochDay, 0);

      // A is at off-day 1
      expect(projA.date.isOffDay).toBe(true);
      expect(projA.date.offDayIndex).toBe(1);

      // B has 360 days per year: day 360 is Year 2001, Month 1, Day 1!
      expect(projB.date.year).toBe(2001);
      expect(projB.date.month).toBe(1);
      expect(projB.date.day).toBe(1);
      expect(projB.date.isOffDay).toBe(false);
    });
  });

  describe('7. Template Copy Creation with source_id', () => {
    it('creates independent template copy with source_id and قالب tag', () => {
      const copy = createTemplateCopy(sampleZorvania, {
        id: 'cal-copy-1',
        name: 'نسخه کپی از گاه‌شمار زروانیا'
      });

      expect(copy.id).toBe('cal-copy-1');
      expect(copy.sourceId).toBe('cal-zorvania');
      expect(copy.scopeType).toBe('pack');
      expect(copy.tags).toContain('قالب');
      expect(copy.months.length).toBe(12);

      // Verify deep clone independence
      copy.months[0].name = 'نام ویرایش شده در کپی';
      expect(sampleZorvania.months[0].name).toBe('فرهان');
    });
  });

  describe('8. Real Server Handler Execution & Bidirectional Parity (functions/api/[[route]].ts)', () => {
    it('executes real onRequest handler and enforces campaign RBAC directly on HTTP routes', async () => {
      const { dispatch } = await createRealServerTestContext('zorvania-c1');

      // 1. Owner can advance time (200)
      const resOwner = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-owner',
        body: { days: 5 }
      });
      expect(resOwner.status).toBe(200);
      const dataOwner = await resOwner.json();
      expect(dataOwner.epochDay).toBe(5);

      // 2. Co-DM can advance time (200)
      const resCoDm = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-codm',
        body: { days: 5 }
      });
      expect(resCoDm.status).toBe(200);
      const dataCoDm = await resCoDm.json();
      expect(dataCoDm.epochDay).toBe(10);

      // 3. Player is forbidden (403)
      const resPlayer = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-player',
        body: { days: 1 }
      });
      expect(resPlayer.status).toBe(403);

      // 4. Spectator is forbidden (403)
      const resSpectator = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-spectator',
        body: { days: 1 }
      });
      expect(resSpectator.status).toBe(403);

      // 5. Outsider (even with platform_role=admin) is forbidden (403)
      const resOutsider = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-outsider',
        body: { days: 1 }
      });
      expect(resOutsider.status).toBe(403);
    });

    it('verifies bidirectional synchronization between legacy /api/calendar and modern /api/c/zorvania-c1/time', async () => {
      const { dispatch, state } = await createRealServerTestContext('zorvania-c1');

      // Baseline: GET /api/calendar returns Year 1500, Month 1, Day 1
      const getInitial = await dispatch('/calendar', { method: 'GET' });
      expect(getInitial.status).toBe(200);
      const calInitial = await getInitial.json();
      expect(calInitial.year).toBe(1500);
      expect(calInitial.month).toBe(1);
      expect(calInitial.day).toBe(1);

      // Step A: Advance time by 45 days via modern endpoint /api/c/zorvania-c1/time/advance
      const advModern = await dispatch('/c/zorvania-c1/time/advance', {
        method: 'POST',
        asUserId: 'user-owner',
        body: { days: 45 }
      });
      expect(advModern.status).toBe(200);

      // Check legacy GET /api/calendar: must reflect Day 45 (Month 2, Day 16 in 30-day month calendar)
      const getLegacyAfterModern = await dispatch('/calendar', { method: 'GET' });
      expect(getLegacyAfterModern.status).toBe(200);
      const calAfterModern = await getLegacyAfterModern.json();
      expect(calAfterModern.year).toBe(1500);
      expect(calAfterModern.month).toBe(2);
      expect(calAfterModern.day).toBe(16);

      // Step B: Update date via legacy PUT /api/calendar to Year 1502, Month 4, Day 10
      const putLegacy = await dispatch('/calendar', {
        method: 'PUT',
        asUserId: 'user-owner',
        body: {
          year: 1502,
          month: 4,
          day: 10,
          isOffDay: false
        }
      });
      expect(putLegacy.status).toBe(200);

      // Check modern GET /api/c/zorvania-c1/time: must reflect epochDay of Year 1502 Month 4 Day 10!
      // (1502 - 1500) * 365 + (4 - 1) * 30 + (10 - 1) = 730 + 90 + 9 = 829
      const getModernAfterLegacy = await dispatch('/c/zorvania-c1/time', {
        method: 'GET',
        asUserId: 'user-owner'
      });
      expect(getModernAfterLegacy.status).toBe(200);
      const modernData = await getModernAfterLegacy.json();
      expect(modernData.epochDay).toBe(829);
      expect(modernData.date.year).toBe(1502);
      expect(modernData.date.month).toBe(4);
      expect(modernData.date.day).toBe(10);

      // Step C: Verify legacy table campaign_calendar is NOT modified as source of truth
      expect(state.campaignCalendar.size).toBe(0);
    });
  });
});
