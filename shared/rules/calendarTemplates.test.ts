import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEMPLATE_SHAHROOZAN_ZORVANIA,
  TEMPLATE_GATHIC,
  TEMPLATE_SIMPLE_STARTER,
  CALENDAR_TEMPLATES,
  createCampaignCalendarFromTemplate
} from './calendarTemplates';
import { validateCalendar, epochToDate } from './calendar';
import { executeClone, CloneEntityBundle } from '../../src/services/cloneEngine';
import { createServerTestApp } from './serverTestApp';
import { api } from '../../src/services/api';

describe('Stage 2B-2: Calendar Templates, Clone, Lazy Init & Wizard', () => {
  describe('الف: Seed Templates Structure & Validity', () => {
    it('1. TEMPLATE_SHAHROOZAN_ZORVANIA conforms to 12x30 + 5 off-days and passes validateCalendar', () => {
      const v = validateCalendar(TEMPLATE_SHAHROOZAN_ZORVANIA);
      expect(v.isValid).toBe(true);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.months).toHaveLength(12);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.months.every(m => m.days === 30)).toBe(true);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.offDays).toHaveLength(5);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.startYear).toBe(1500);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.eraLabel).toBe('پ.ر.ن');
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.weekdays).toHaveLength(7);
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.anchor?.weekdayIndex).toBe(0);
    });

    it('2. TEMPLATE_GATHIC conforms to 12x30 + 5 Gathic off-days and passes validateCalendar', () => {
      const v = validateCalendar(TEMPLATE_GATHIC);
      expect(v.isValid).toBe(true);
      expect(TEMPLATE_GATHIC.months).toHaveLength(12);
      expect(TEMPLATE_GATHIC.months.every(m => m.days === 30)).toBe(true);
      expect(TEMPLATE_GATHIC.offDays).toHaveLength(5);
      expect(TEMPLATE_GATHIC.offDays?.[0].name).toContain('اَهنَوَد');
      expect(TEMPLATE_GATHIC.startYear).toBe(1000);
      expect(TEMPLATE_GATHIC.eraLabel).toBe('گ.و');
      expect(TEMPLATE_GATHIC.weekdays).toHaveLength(7);
      expect(TEMPLATE_GATHIC.anchor?.weekdayIndex).toBe(0);
    });

    it('3. TEMPLATE_SIMPLE_STARTER provides clean 12x30 starter calendar for scratch creation', () => {
      const v = validateCalendar(TEMPLATE_SIMPLE_STARTER);
      expect(v.isValid).toBe(true);
      expect(TEMPLATE_SIMPLE_STARTER.months).toHaveLength(12);
      expect(TEMPLATE_SIMPLE_STARTER.months.every(m => m.days === 30)).toBe(true);
      expect(TEMPLATE_SIMPLE_STARTER.offDays).toHaveLength(0);
      expect(TEMPLATE_SIMPLE_STARTER.festivals).toHaveLength(0);
      expect(TEMPLATE_SIMPLE_STARTER.startYear).toBe(1);
      expect(TEMPLATE_SIMPLE_STARTER.eraLabel).toBe('س.ت');
      expect(TEMPLATE_SIMPLE_STARTER.anchor?.weekdayIndex).toBe(0);
    });

    it('4. CALENDAR_TEMPLATES exposes all 3 templates', () => {
      expect(CALENDAR_TEMPLATES).toHaveLength(3);
      expect(CALENDAR_TEMPLATES.map(t => t.id)).toEqual([
        TEMPLATE_SHAHROOZAN_ZORVANIA.id,
        TEMPLATE_GATHIC.id,
        TEMPLATE_SIMPLE_STARTER.id
      ]);
    });

    it('5. createCampaignCalendarFromTemplate creates an independent, deep-copied campaign calendar', () => {
      const campaignId = 'test-camp-1';
      const cloned = createCampaignCalendarFromTemplate(campaignId, TEMPLATE_SHAHROOZAN_ZORVANIA, {
        name: 'تقویم شخصی کمپین',
        startYear: 2000,
        eraLabel: 'د.ت'
      });

      expect(cloned.scopeType).toBe('campaign');
      expect(cloned.scopeId).toBe(campaignId);
      expect(cloned.sourceId).toBe(TEMPLATE_SHAHROOZAN_ZORVANIA.id);
      expect(cloned.name).toBe('تقویم شخصی کمپین');
      expect(cloned.startYear).toBe(2000);
      expect(cloned.eraLabel).toBe('د.ت');
      expect(cloned.id).not.toBe(TEMPLATE_SHAHROOZAN_ZORVANIA.id);

      // Verify deep copy immutability
      cloned.months[0].name = 'ماه دستکاری شده';
      expect(TEMPLATE_SHAHROOZAN_ZORVANIA.months[0].name).toBe('فرهان');
    });
  });

  describe('ب: Lazy Initialization of Calendar & Campaign Time', () => {
    it('1. Server lazily and idempotently initializes calendar and campaign_time for bare campaign', async () => {
      const app = createServerTestApp();
      const dm = app.createUser('dm-lazy', 'dm-lazy@zorvania.ir', 'DM Lazy', 'admin');
      const camp = app.createCampaign('camp-lazy-init', 'کمپین بدون تقویم', dm.id);
      app.addMember(camp.id, dm.id, 'owner');

      // Verify campaign initially has no calendar or time records
      expect(app.dbState.calendars.size).toBe(0);
      expect(app.dbState.campaignTime.size).toBe(0);

      // Access GET /c/:campaignId/time -> triggers lazy init
      const timeRes = await app.request(`/api/c/${camp.id}/time`, {
        headers: app.getAuthHeaders(dm.id)
      });
      expect(timeRes.status).toBe(200);
      const timeData = await timeRes.json() as any;
      expect(timeData.epochDay).toBe(0);
      expect(timeData.primaryCalendarId).toBeDefined();
      expect(timeData.date.year).toBe(1500);

      // DB should now have 1 calendar and 1 campaignTime record
      expect(app.dbState.calendars.size).toBe(1);
      expect(app.dbState.campaignTime.size).toBe(1);

      const createdCalId = timeData.primaryCalendarId;

      // Second access should be idempotent and not re-create or overwrite
      const timeRes2 = await app.request(`/api/c/${camp.id}/time`, {
        headers: app.getAuthHeaders(dm.id)
      });
      const timeData2 = await timeRes2.json() as any;
      expect(timeData2.primaryCalendarId).toBe(createdCalId);
      expect(app.dbState.calendars.size).toBe(1);

      // Verify list calendars also returns this initialized calendar
      const calsRes = await app.request(`/api/c/${camp.id}/calendars`, {
        headers: app.getAuthHeaders(dm.id)
      });
      const calsData = await calsRes.json() as any[];
      expect(calsData.some(c => c.id === createdCalId)).toBe(true);
    });

    it('2. LocalApi lazily initializes campaign time on bare campaign access', async () => {
      const bareCampId = 'local-bare-campaign-' + Date.now();
      const timeRes = await api.getCampaignTime(bareCampId);
      expect(timeRes.epochDay).toBe(0);
      expect(timeRes.primaryCalendarId).toBeDefined();

      const cals = await api.getCampaignCalendars(bareCampId);
      expect(cals.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ج: Clone Engine & Export/Import Roundtrip', () => {
    it('1. executeClone preserves calendars, maps target scope, remaps primaryCalendarId and epochDay', () => {
      const sourceBundle: CloneEntityBundle = {
        classTemplates: [],
        lineageTemplates: [],
        backgroundTemplates: [],
        featureTemplates: [],
        weaponTemplates: [],
        items: [],
        rewards: [],
        npcs: [],
        locations: [],
        encounters: [],
        factions: [],
        campaignDocs: [],
        calendars: [
          {
            ...TEMPLATE_SHAHROOZAN_ZORVANIA,
            id: 'cal-source-1',
            scopeType: 'campaign',
            scopeId: 'camp-source'
          }
        ],
        campaignTime: {
          epochDay: 145,
          primaryCalendarId: 'cal-source-1',
          calendarId: 'cal-source-1'
        },
        ruleSets: []
      };

      const targetBundle: CloneEntityBundle = {
        classTemplates: [],
        lineageTemplates: [],
        backgroundTemplates: [],
        featureTemplates: [],
        weaponTemplates: [],
        items: [],
        rewards: [],
        npcs: [],
        locations: [],
        encounters: [],
        factions: [],
        campaignDocs: [],
        calendars: [],
        ruleSets: []
      };

      const result = executeClone(
        {
          source: { scopeType: 'campaign', scopeId: 'camp-source' },
          target: { scopeType: 'campaign', scopeId: 'camp-target' },
          options: { includeDependencies: 'auto' }
        },
        sourceBundle,
        targetBundle
      );

      expect(result.createdEntities.calendars).toHaveLength(1);
      const clonedCal = result.createdEntities.calendars[0];
      expect(clonedCal.id).not.toBe('cal-source-1');
      expect(clonedCal.scopeType).toBe('campaign');
      expect(clonedCal.scopeId).toBe('camp-target');
      expect(clonedCal.sourceId).toBe('cal-source-1');

      // Verify campaignTime was cloned with remapped primaryCalendarId and preserved epochDay
      expect(result.createdEntities.campaignTime).toBeDefined();
      expect(result.createdEntities.campaignTime?.epochDay).toBe(145);
      expect(result.createdEntities.campaignTime?.primaryCalendarId).toBe(clonedCal.id);
    });

    it('2. Legacy import without calendars falls back gracefully to default Zorvania calendar', async () => {
      const legacyPackJson = {
        format: 'zorvania-pack/1',
        pack: {
          id: 'legacy-pack-1',
          name: 'بسته قدیمی بدون گاه‌شمار',
          version: '1.0.0'
        },
        entities: {
          items: [],
          npcs: []
          // Notice: No calendars or campaignTime defined
        }
      };

      // Preview should succeed without errors and include the fallback calendar
      const preview = await api.previewImportPack(legacyPackJson);
      expect(preview).toBeDefined();
      expect(preview.items.some(i => i.type === 'calendar')).toBe(true);

      // Import execution should succeed
      const targetCamp = { scopeType: 'campaign' as const, scopeId: 'camp-legacy-import-target' };
      const job = await api.runImportPack(legacyPackJson, targetCamp);
      expect(job.status).toBe('completed');
    });
  });
});
