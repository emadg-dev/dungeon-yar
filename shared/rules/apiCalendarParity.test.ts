import { describe, it, expect, vi } from 'vitest';
import type { Campaign, GenericCalendarData, CampaignRole, CampaignMember } from '../../src/types';
import { advanceTime } from './calendar';

// Ensure global localStorage exists before importing LocalApi
const mockStore = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.getItem) {
  globalThis.localStorage = {
    getItem: (key: string) => mockStore.get(key) ?? null,
    setItem: (key: string, val: string) => { mockStore.set(key, String(val)); },
    removeItem: (key: string) => { mockStore.delete(key); },
    clear: () => { mockStore.clear(); },
    key: (i: number) => Array.from(mockStore.keys())[i] ?? null,
    length: 0
  } as any;
}

import { LocalApi, HttpApi, type ApiClient } from '../../src/services/api';
import { SEED_CAMPAIGNS } from '../../src/data/seed';
import { createRealServerTestContext } from './serverTestApp';

const solarisCalendarInput: Omit<GenericCalendarData, 'id' | 'updatedAt'> = {
  name: 'گاه‌شمار خورشیدی سولاریس',
  eraLabel: 'خ.س',
  startYear: 2000,
  anchor: { weekdayIndex: 1 },
  months: [
    { name: 'آفتاب', days: 36, season: 'بهار' },
    { name: 'تابش', days: 36, season: 'بهار' },
    { name: 'پرتو', days: 36, season: 'تابستان' },
    { name: 'گرما', days: 36, season: 'تابستان' },
    { name: 'درخشش', days: 36, season: 'پاییز' },
    { name: 'سایه', days: 36, season: 'پاییز' },
    { name: 'خزان', days: 36, season: 'زمستان' },
    { name: 'شبنم', days: 36, season: 'زمستان' },
    { name: 'یخبندان', days: 36, season: 'زمستان' },
    { name: 'اخگر', days: 36, season: 'بهار' }
  ],
  offDays: [
    { name: 'روز اعتدالین', note: 'خارج از ماه‌ها' },
    { name: 'روز انقلابین', note: 'خارج از ماه‌ها' },
    { name: 'روز سکون', note: 'خارج از ماه‌ها' },
    { name: 'روز بیداری', note: 'خارج از ماه‌ها' },
    { name: 'روز پیوند', note: 'خارج از ماه‌ها' }
  ],
  festivals: [
    { name: 'جشن فروغ', monthIndex: 1, day: 1 },
    { name: 'جشن تیرگان خورشیدی', monthIndex: 4, day: 10 }
  ],
  weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
};

/**
 * Shared parity test scenario that verifies identical behaviors across LocalApi and HttpApi.
 */
function runCalendarParitySuite(
  name: string,
  createClient: () => { api: ApiClient; setRole: (role: CampaignRole) => void }
) {
  describe(`Client Calendar Parity: ${name}`, () => {
    const campaignId = 'c-parity-test';

    it('Scenario: full lifecycle parity (initial time, calendar creation, advance, legacy bridge, permissions)', async () => {
      const { api, setRole } = createClient();
      setRole('owner');

      // 1. Initial campaign time
      const initialTime = await api.getCampaignTime(campaignId);
      expect(initialTime.campaignId).toBe(campaignId);
      expect(initialTime.epochDay).toBe(0);
      expect(initialTime.date.year).toBe(1500);
      expect(initialTime.date.month).toBe(1);
      expect(initialTime.date.day).toBe(1);
      expect(initialTime.date.isOffDay).toBe(false);
      expect(initialTime.calendars).toBeDefined();

      // 2. Create second calendar in campaign
      const createdCal = await api.createCampaignCalendar(campaignId, solarisCalendarInput);
      expect(createdCal.id).toBeDefined();
      expect(createdCal.name).toBe('گاه‌شمار خورشیدی سولاریس');
      expect(createdCal.scopeType).toBe('campaign');
      expect(createdCal.scopeId).toBe(campaignId);

      // 3. List calendars: must include initial and newly created Solaris calendar
      const calendars = await api.getCampaignCalendars(campaignId);
      expect(calendars.length).toBeGreaterThanOrEqual(2);
      const foundSolaris = calendars.find((c: GenericCalendarData) => c.id === createdCal.id);
      expect(foundSolaris).toBeDefined();
      expect(foundSolaris!.startYear).toBe(2000);

      // 4. Advance time by 400 days
      const advancedTime = await api.advanceCampaignTime(campaignId, { days: 400 });
      expect(advancedTime.epochDay).toBe(400);
      expect(advancedTime.advancedBy).toBe(400);
      // Primary Zorvania: 400 days = 1 year (365 days) + 35 days elapsed -> month 2, day 6
      expect(advancedTime.date.year).toBe(1501);
      expect(advancedTime.date.month).toBe(2);
      expect(advancedTime.date.day).toBe(6);

      // Multi-calendar projection: Solaris calendar projected at identical epochDay 400
      expect(advancedTime.calendars![createdCal.id!]).toBeDefined();
      const solarisProj = advancedTime.calendars![createdCal.id!];
      expect(solarisProj.calendarName).toBe('گاه‌شمار خورشیدی سولاریس');
      expect(solarisProj.date.year).toBe(2001); // 400 days in 365-day solaris = year 2001

      // 5. Legacy bridge advanceCalendar(30): routes through /time/advance
      const legacyRes = await api.advanceCalendar(30);
      expect(legacyRes.year).toBe(1501);
      expect(legacyRes.month).toBe(3); // 35 + 30 = 65 days into year -> month 3, day 6
      expect(legacyRes.day).toBe(6);
      expect(typeof legacyRes.updatedAt).toBe('string');

      // Verify campaign time now reflects 430
      const timeAfterLegacy = await api.getCampaignTime(campaignId);
      expect(timeAfterLegacy.epochDay).toBe(430);

      // 6. Update calendar structure
      const updatedCal = await api.updateCampaignCalendar(campaignId, createdCal.id!, {
        name: 'گاه‌شمار خورشیدی سولاریس ویرایش‌شده'
      });
      expect(updatedCal.name).toBe('گاه‌شمار خورشیدی سولاریس ویرایش‌شده');

      // Verify epochDay remained 430 after structure update
      const timeAfterCalEdit = await api.getCampaignTime(campaignId);
      expect(timeAfterCalEdit.epochDay).toBe(430);

      // 7. Template endpoints
      const templates = await api.getCalendarTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThanOrEqual(1);

      const createdTemplate = await api.createCalendarTemplate({
        ...solarisCalendarInput,
        name: 'قالب گاه‌شمار سولاریس'
      });
      expect(createdTemplate.id).toBeDefined();
      expect(createdTemplate.tags).toContain('قالب');

      // 8. Permissions: player role must be rejected on DM operations
      setRole('player');

      await expect(api.advanceCampaignTime(campaignId, { days: 1 })).rejects.toThrow();
      await expect(api.setCampaignTime(campaignId, { epochDay: 500 })).rejects.toThrow();
      await expect(api.createCampaignCalendar(campaignId, solarisCalendarInput)).rejects.toThrow();
      await expect(api.deleteCampaignCalendar(campaignId, createdCal.id!)).rejects.toThrow();

      // 9. Revert role to owner: delete calendar
      setRole('owner');
      const delRes = await api.deleteCampaignCalendar(campaignId, createdCal.id!);
      expect(delRes.success).toBe(true);
      expect(delRes.deletedId).toBe(createdCal.id);

      // Deleting the last calendar must be rejected
      const remainingCals = await api.getCampaignCalendars(campaignId);
      const campSpecific = remainingCals.filter((c: GenericCalendarData) => c.scopeType === 'campaign' && c.scopeId === campaignId);
      if (campSpecific.length === 1) {
        await expect(api.deleteCampaignCalendar(campaignId, campSpecific[0].id!)).rejects.toThrow(
          'امکان حذف آخرین گاه‌شمار کمپین وجود ندارد'
        );
      }
    });
  });
}

describe('Calendar API Parity Suite', () => {
  // Test LocalApi
  runCalendarParitySuite('LocalApi', () => {
    mockStore.clear();
    const campaignId = 'c-parity-test';
    let currentRole: CampaignRole = 'owner';

    // Initialize LocalApi first so default seeds are populated
    const api = new LocalApi();

    // Now seed test campaign and membership
    const seedCampaign: Campaign = {
      id: campaignId,
      name: 'کمپین آزمایشی Parity',
      description: 'توضیحات آزمایشی',
      status: 'active',
      settings: SEED_CAMPAIGNS[0].settings,
      ownerId: 'user-dm',
      myRole: currentRole,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const currentCamps = JSON.parse(mockStore.get('dy_campaigns') || '[]');
    mockStore.set('dy_campaigns', JSON.stringify([...currentCamps.filter((c: any) => c.id !== campaignId), seedCampaign]));
    mockStore.set('dy_active_campaign_id', campaignId);
    mockStore.set('dy_active_user_id', 'user-dm');

    const seedMember: CampaignMember = {
      campaignId,
      userId: 'user-dm',
      role: currentRole,
      status: 'active',
      joinedAt: Date.now()
    };
    const currentMembers = JSON.parse(mockStore.get('dy_campaign_members') || '[]');
    mockStore.set('dy_campaign_members', JSON.stringify([...currentMembers.filter((m: any) => m.campaignId !== campaignId), seedMember]));

    // Seed 1 base campaign calendar for this campaign
    const baseCampCal: GenericCalendarData = {
      id: `cal-base-${campaignId}`,
      name: 'گاه‌شمار شاه‌روزان (زروانیا)',
      eraLabel: 'پ.ر.ن',
      startYear: 1500,
      scopeType: 'campaign',
      scopeId: campaignId,
      anchor: { weekdayIndex: 0 },
      months: [
        { name: 'فرورداد', days: 30, season: 'بهار' },
        { name: 'اردی‌مهر', days: 30, season: 'بهار' },
        { name: 'خورداد', days: 30, season: 'بهار' },
        { name: 'تیرآذر', days: 30, season: 'تابستان' },
        { name: 'امرداد', days: 30, season: 'تابستان' },
        { name: 'شهریور', days: 30, season: 'تابستان' },
        { name: 'مهرآیین', days: 30, season: 'پاییز' },
        { name: 'آبان‌داد', days: 30, season: 'پاییز' },
        { name: 'آذرپژواک', days: 30, season: 'پاییز' },
        { name: 'دی‌مهر', days: 30, season: 'زمستان' },
        { name: 'بهمن‌یار', days: 30, season: 'زمستان' },
        { name: 'اسفندارمذ', days: 30, season: 'زمستان' }
      ],
      offDays: [
        { name: 'گاه اول', note: 'برون‌گاه' },
        { name: 'گاه دوم', note: 'برون‌گاه' },
        { name: 'گاه سوم', note: 'برون‌گاه' },
        { name: 'گاه چهارم', note: 'برون‌گاه' },
        { name: 'گاه پنجم', note: 'برون‌گاه' }
      ],
      festivals: [{ name: 'جشن روز نخست (نوروز کهن)', monthIndex: 1, day: 1 }],
      weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
    };
    const currentCals = JSON.parse(mockStore.get('dy_calendars') || '[]');
    mockStore.set('dy_calendars', JSON.stringify([...currentCals, baseCampCal]));

    api.setActiveCampaignId(campaignId);

    return {
      api,
      setRole: (role: CampaignRole) => {
        currentRole = role;
        const cCamps = JSON.parse(mockStore.get('dy_campaigns') || '[]');
        const updatedC = cCamps.map((c: any) => c.id === campaignId ? { ...c, myRole: role } : c);
        mockStore.set('dy_campaigns', JSON.stringify(updatedC));

        const cMembers = JSON.parse(mockStore.get('dy_campaign_members') || '[]');
        const updatedM = cMembers.map((m: any) => m.campaignId === campaignId && m.userId === 'user-dm' ? { ...m, role } : m);
        mockStore.set('dy_campaign_members', JSON.stringify(updatedM));
      }
    };
  });

  // Test HttpApi with in-memory mock fetch
  runCalendarParitySuite('HttpApi', () => {
    const campaignId = 'c-parity-test';
    let currentRole: CampaignRole = 'owner';

    let epochDay = 0;
    const baseCampCalId = `cal-base-${campaignId}`;
    let primaryCalId = baseCampCalId;
    const calendars: GenericCalendarData[] = [
      {
        id: 'cal-zorvania',
        name: 'گاه‌شمار شاه‌روزان (قالب زروانیا)',
        eraLabel: 'پ.ر.ن',
        startYear: 1500,
        scopeType: 'pack',
        tags: ['قالب'],
        anchor: { weekdayIndex: 0 },
        months: [
          { name: 'فرورداد', days: 30, season: 'بهار' },
          { name: 'اردی‌مهر', days: 30, season: 'بهار' },
          { name: 'خورداد', days: 30, season: 'بهار' },
          { name: 'تیرآذر', days: 30, season: 'تابستان' },
          { name: 'امرداد', days: 30, season: 'تابستان' },
          { name: 'شهریور', days: 30, season: 'تابستان' },
          { name: 'مهرآیین', days: 30, season: 'پاییز' },
          { name: 'آبان‌داد', days: 30, season: 'پاییز' },
          { name: 'آذرپژواک', days: 30, season: 'پاییز' },
          { name: 'دی‌مهر', days: 30, season: 'زمستان' },
          { name: 'بهمن‌یار', days: 30, season: 'زمستان' },
          { name: 'اسفندارمذ', days: 30, season: 'زمستان' }
        ],
        offDays: [
          { name: 'گاه اول', note: 'برون‌گاه' },
          { name: 'گاه دوم', note: 'برون‌گاه' },
          { name: 'گاه سوم', note: 'برون‌گاه' },
          { name: 'گاه چهارم', note: 'برون‌گاه' },
          { name: 'گاه پنجم', note: 'برون‌گاه' }
        ],
        festivals: [
          { name: 'جشن روز نخست (نوروز کهن)', monthIndex: 1, day: 1 }
        ],
        weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
      },
      {
        id: baseCampCalId,
        name: 'گاه‌شمار شاه‌روزان (زروانیا)',
        eraLabel: 'پ.ر.ن',
        startYear: 1500,
        scopeType: 'campaign',
        scopeId: campaignId,
        anchor: { weekdayIndex: 0 },
        months: [
          { name: 'فرورداد', days: 30, season: 'بهار' },
          { name: 'اردی‌مهر', days: 30, season: 'بهار' },
          { name: 'خورداد', days: 30, season: 'بهار' },
          { name: 'تیرآذر', days: 30, season: 'تابستان' },
          { name: 'امرداد', days: 30, season: 'تابستان' },
          { name: 'شهریور', days: 30, season: 'تابستان' },
          { name: 'مهرآیین', days: 30, season: 'پاییز' },
          { name: 'آبان‌داد', days: 30, season: 'پاییز' },
          { name: 'آذرپژواک', days: 30, season: 'پاییز' },
          { name: 'دی‌مهر', days: 30, season: 'زمستان' },
          { name: 'بهمن‌یار', days: 30, season: 'زمستان' },
          { name: 'اسفندارمذ', days: 30, season: 'زمستان' }
        ],
        offDays: [
          { name: 'گاه اول', note: 'برون‌گاه' },
          { name: 'گاه دوم', note: 'برون‌گاه' },
          { name: 'گاه سوم', note: 'برون‌گاه' },
          { name: 'گاه چهارم', note: 'برون‌گاه' },
          { name: 'گاه پنجم', note: 'برون‌گاه' }
        ],
        festivals: [
          { name: 'جشن روز نخست (نوروز کهن)', monthIndex: 1, day: 1 }
        ],
        weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
      }
    ];

    const buildResponse = (advBy?: number) => {
      const projMap: Record<string, any> = {};
      for (const cal of calendars) {
        const state = advanceTime(cal, epochDay, 0, campaignId);
        projMap[cal.id!] = {
          calendarId: cal.id,
          calendarName: cal.name,
          date: state.date,
          weekday: state.weekday,
          weekdayIndex: state.weekdayIndex,
          activeFestivals: state.activeFestivals,
          formattedDate: state.formattedDate
        };
      }
      const primaryCal = calendars.find(c => c.id === primaryCalId) || calendars[0];
      const primaryState = projMap[primaryCal.id!] || advanceTime(primaryCal, epochDay, 0, campaignId);

      return {
        campaignId,
        primaryCalendarId: primaryCal.id,
        calendarId: primaryCal.id,
        epochDay,
        date: primaryState.date,
        weekday: primaryState.weekday,
        weekdayIndex: primaryState.weekdayIndex,
        activeFestivals: primaryState.activeFestivals,
        formattedDate: primaryState.formattedDate,
        calendars: projMap,
        ...(advBy !== undefined ? { advancedBy: advBy } : {}),
        updatedAt: Date.now()
      };
    };

    // Mock fetch for HttpApi
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const urlStr = String(url);
      const method = (init?.method || 'GET').toUpperCase();
      const body = init?.body ? JSON.parse(init.body) : null;

      // GET /api/c/:campaignId/time
      if (urlStr.endsWith(`/api/c/${campaignId}/time`) && method === 'GET') {
        return new Response(JSON.stringify(buildResponse()), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // POST /api/c/:campaignId/time/advance
      if (urlStr.endsWith(`/api/c/${campaignId}/time/advance`) && method === 'POST') {
        if (currentRole !== 'owner' && currentRole !== 'co_dm') {
          return new Response(JSON.stringify({ error: 'دسترسی مجاز نیست. فقط دانجن‌مستر مجاز به پیشروی زمان است.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        epochDay += body.days;
        return new Response(JSON.stringify(buildResponse(body.days)), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // PUT /api/c/:campaignId/time
      if (urlStr.endsWith(`/api/c/${campaignId}/time`) && method === 'PUT') {
        if (currentRole !== 'owner' && currentRole !== 'co_dm') {
          return new Response(JSON.stringify({ error: 'دسترسی مجاز نیست. فقط دانجن‌مستر مجاز به تغییر زمان است.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        if (body.epochDay !== undefined) epochDay = body.epochDay;
        return new Response(JSON.stringify(buildResponse()), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // GET /api/c/:campaignId/calendars
      if (urlStr.endsWith(`/api/c/${campaignId}/calendars`) && method === 'GET') {
        return new Response(JSON.stringify(calendars), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // POST /api/c/:campaignId/calendars
      if (urlStr.endsWith(`/api/c/${campaignId}/calendars`) && method === 'POST') {
        if (currentRole !== 'owner' && currentRole !== 'co_dm') {
          return new Response(JSON.stringify({ error: 'فقط دانجن مستر یا مالک کمپین مجاز است.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        const newCal: GenericCalendarData = {
          ...body,
          id: body.id || `cal-${Date.now()}`,
          scopeType: 'campaign',
          scopeId: campaignId,
          updatedAt: Date.now()
        };
        calendars.push(newCal);
        return new Response(JSON.stringify(newCal), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }

      // PUT /api/c/:campaignId/calendars/:calId
      if (urlStr.includes(`/api/c/${campaignId}/calendars/`) && method === 'PUT') {
        if (currentRole !== 'owner' && currentRole !== 'co_dm') {
          return new Response(JSON.stringify({ error: 'فقط دانجن مستر یا مالک کمپین مجاز به ویرایش گاه‌شمار است.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        const calId = urlStr.split('/').pop()!;
        const idx = calendars.findIndex(c => c.id === calId);
        if (idx === -1) {
          return new Response(JSON.stringify({ error: 'گاه‌شمار مورد نظر یافت نشد.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        calendars[idx] = { ...calendars[idx], ...body, id: calId };
        return new Response(JSON.stringify(calendars[idx]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // DELETE /api/c/:campaignId/calendars/:calId
      if (urlStr.includes(`/api/c/${campaignId}/calendars/`) && method === 'DELETE') {
        if (currentRole !== 'owner' && currentRole !== 'co_dm') {
          return new Response(JSON.stringify({ error: 'فقط دانجن مستر یا مالک کمپین مجاز به حذف گاه‌شمار است.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        const calId = urlStr.split('/').pop()!;
        const campCals = calendars.filter(c => c.scopeType === 'campaign' && c.scopeId === campaignId);
        if (campCals.length <= 1) {
          return new Response(JSON.stringify({ error: 'امکان حذف آخرین گاه‌شمار کمپین وجود ندارد. کمپین باید حداقل دارای یک گاه‌شمار باشد.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const delIdx = calendars.findIndex(c => c.id === calId);
        if (delIdx !== -1) calendars.splice(delIdx, 1);
        return new Response(JSON.stringify({ success: true, deletedId: calId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // GET /api/calendar-templates
      if (urlStr.endsWith('/api/calendar-templates') && method === 'GET') {
        return new Response(JSON.stringify(calendars.filter(c => c.scopeType === 'pack' || c.tags?.includes('قالب'))), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // POST /api/calendar-templates
      if (urlStr.endsWith('/api/calendar-templates') && method === 'POST') {
        const newT = { ...body, id: `cal-template-${Date.now()}`, tags: ['قالب'], scopeType: 'pack' };
        calendars.push(newT);
        return new Response(JSON.stringify(newT), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'Route not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }) as any;

    const api = new HttpApi();
    api.setActiveCampaignId(campaignId);

    return {
      api,
      setRole: (role: CampaignRole) => {
        currentRole = role;
      }
    };
  });

  // 3. Test HttpApi wired directly to real onRequest route handler (Cloudflare worker)
  runCalendarParitySuite('HttpApi with Real Server Route Handler (onRequest)', () => {
    const campaignId = 'c-parity-test';
    let currentUserId = 'user-owner';
    let serverContextPromise: ReturnType<typeof createRealServerTestContext> | null = null;

    const getServer = async () => {
      if (!serverContextPromise) {
        serverContextPromise = createRealServerTestContext(campaignId);
      }
      return await serverContextPromise;
    };

    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      const server = await getServer();
      const urlStr = String(url);
      const pathWithQuery = urlStr.replace(/^https?:\/\/[^/]+/, '');
      const method = (init?.method || 'GET').toUpperCase();
      const body = init?.body ? JSON.parse(init.body) : undefined;

      const res = await server.dispatch(pathWithQuery, {
        method,
        body,
        asUserId: currentUserId,
        headers: init?.headers as any
      });
      return res;
    }) as any;

    const api = new HttpApi();
    api.setActiveCampaignId(campaignId);

    return {
      api,
      setRole: (role: CampaignRole) => {
        currentUserId = role === 'player' ? 'user-player' : 'user-owner';
      }
    };
  });
});
