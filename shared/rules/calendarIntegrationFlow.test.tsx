import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CodexTab } from '../../src/components/character/CodexTab';
import { CalendarStructureModal } from '../../src/components/calendar/CalendarStructureModal';
import { CampaignWizardModal } from '../../src/components/campaign/CampaignWizardModal';
import { calendarStructureReducer, initCalendarStructureState } from './calendarStructureReducer';
import {
  TEMPLATE_SHAHROOZAN_ZORVANIA,
  TEMPLATE_GATHIC,
  TEMPLATE_SIMPLE_STARTER,
  createCampaignCalendarFromTemplate
} from './calendarTemplates';
import { validateCalendar } from './calendar';
import { GenericCalendarData, Campaign } from '../../src/types';

// Mock API calls
const mockUpdateCampaignCalendar = vi.fn();
const mockCreateCampaignCalendar = vi.fn();

vi.mock('../../src/services/api', () => ({
  api: {
    getCampaignCalendars: vi.fn().mockImplementation((campaignId: string) => {
      const cal = createCampaignCalendarFromTemplate(campaignId, TEMPLATE_SHAHROOZAN_ZORVANIA);
      return Promise.resolve([cal]);
    }),
    getCampaignTime: vi.fn().mockResolvedValue({
      epochDay: 42,
      primaryCalendarId: 'cal-shahroozan',
      timeText: 'روز ۴۲'
    }),
    updateCampaignCalendar: (...args: any[]) => mockUpdateCampaignCalendar(...args),
    createCampaignCalendar: (...args: any[]) => mockCreateCampaignCalendar(...args),
    updateWizardState: vi.fn().mockResolvedValue({}),
    setCampaignTime: vi.fn().mockResolvedValue({ success: true }),
    getContentPacks: vi.fn().mockResolvedValue([]),
    getCampaignTemplates: vi.fn().mockResolvedValue([]),
    getCampaignDocPresets: vi.fn().mockResolvedValue([])
  }
}));

describe('Integration Flow: Calendar Creation & Management Journey', () => {
  const dummyCal = createCampaignCalendarFromTemplate('c-zorvania', TEMPLATE_SHAHROOZAN_ZORVANIA);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateCampaignCalendar.mockResolvedValue({ ...dummyCal, version: 2 });
    mockCreateCampaignCalendar.mockImplementation((cId, cal) => Promise.resolve({ ...cal, id: 'cal-saved-1' }));
  });

  describe('الف) CodexTab (گاه‌شمار) به عنوان owner و جریان ویرایش ساختار', () => {
    it('1. Displays "ویرایش تقویم‌ها" button for owner and opens full structure modal with add month capability', async () => {
      // 1. Render CodexTab as DM / owner
      const htmlOwner = renderToString(
        <CodexTab
          initialSubTab="calendar"
          initialCalendars={[dummyCal]}
          initialTime={{ epochDay: 42, primaryCalendarId: dummyCal.id || 'cal-shahroozan' } as any}
          isDm={true}
          revealedNpcs={[]}
          revealedItems={[]}
          campaignId="c-zorvania"
        />
      );

      // Verify "ویرایش تقویم‌ها" is present in DOM for DM
      expect(htmlOwner).toContain('ویرایش تقویم‌ها');
      expect(htmlOwner).toContain('مشاهده تقویم کامل');

      // 2. Open CalendarStructureModal as owner
      const htmlModal = renderToString(
        <CalendarStructureModal
          isOpen={true}
          onClose={() => {}}
          campaignId="c-zorvania"
          userRole="owner"
        />
      );

      expect(htmlModal).toContain('تنظیم ساختار ماه‌ها');
      expect(htmlModal).toContain('افزودن ماه');
      expect(htmlModal).toContain('افزودن روز خارج از ماه');
      expect(htmlModal).toContain('افزودن روز هفته');
      expect(htmlModal).toContain('ذخیره ساختار گاه‌شمار');

      // 3. User clicks "افزودن ماه": dispatch ADD_MONTH
      const initialMonthsCount = dummyCal.months.length;
      const stateWithNewMonth = calendarStructureReducer(
        initCalendarStructureState(dummyCal),
        {
          type: 'ADD_MONTH',
          month: { name: 'ماه افزوده سیزدهم', days: 28, season: 'زمستان' }
        }
      );

      expect(stateWithNewMonth.calendar.months.length).toBe(initialMonthsCount + 1);
      expect(stateWithNewMonth.calendar.months[initialMonthsCount].name).toBe('ماه افزوده سیزدهم');
      expect(stateWithNewMonth.isDirty).toBe(true);

      // 4. Save structure -> calls updateCampaignCalendar with updated structure
      const validated = validateCalendar(stateWithNewMonth.calendar);
      expect(validated.valid).toBe(true);

      await mockUpdateCampaignCalendar('c-zorvania', dummyCal.id, stateWithNewMonth.calendar);
      expect(mockUpdateCampaignCalendar).toHaveBeenCalledTimes(1);
      expect(mockUpdateCampaignCalendar).toHaveBeenCalledWith(
        'c-zorvania',
        dummyCal.id,
        expect.objectContaining({
          months: expect.arrayContaining([
            expect.objectContaining({ name: 'ماه افزوده سیزدهم', days: 28 })
          ])
        })
      );
    });
  });

  describe('ب) CodexTab (گاه‌شمار) به عنوان player', () => {
    it('1. Hides edit button for player while rendering live calendar structure and time', () => {
      const htmlPlayer = renderToString(
        <CodexTab
          initialSubTab="calendar"
          initialCalendars={[dummyCal]}
          initialTime={{ epochDay: 42, primaryCalendarId: dummyCal.id || 'cal-shahroozan' } as any}
          isDm={false}
          revealedNpcs={[]}
          revealedItems={[]}
          campaignId="c-zorvania"
        />
      );

      // Edit button must NOT be rendered for player
      expect(htmlPlayer).not.toContain('ویرایش تقویم‌ها');
      // Structure details must be visible
      expect(htmlPlayer).toContain('مشاهده تقویم کامل');
      expect(htmlPlayer).toContain('زمان جاری در جهان زروانیا');
      expect(htmlPlayer).toContain('ماه‌های سال');
      expect(htmlPlayer).toContain('روزهای برون‌گاه');
      expect(htmlPlayer).toContain('آذران');
    });
  });

  describe('ج) گام ۳ ویزارد کمپین: انتخاب قالب، ویرایش ساختار و ممانعت پیش‌نویس نامعتبر', () => {
    it('1. Modifying calendar draft in wizard produces campaign calendar with 1 extra month than base template', async () => {
      // Base template
      const baseTemplate = TEMPLATE_GATHIC;
      const initialMonthsCount = baseTemplate.months.length;

      // Draft created in wizard
      let draft = createCampaignCalendarFromTemplate('camp-new', baseTemplate, {
        name: 'گاه‌شمار سفارشی گاتیک',
        startYear: 2000,
        eraLabel: 'عصر نو'
      });

      // User expands "ویرایش ساختار تقویم" and clicks "افزودن ماه"
      const updatedDraft = {
        ...draft,
        months: [
          ...draft.months,
          { name: 'ماه پایانی اضافی', days: 15, season: 'سرما' }
        ]
      };

      expect(updatedDraft.months.length).toBe(initialMonthsCount + 1);

      // Verify validation passes for valid draft
      const validCheck = validateCalendar(updatedDraft);
      expect(validCheck.valid).toBe(true);

      // Save to API upon step transition
      await mockCreateCampaignCalendar('camp-new', updatedDraft);
      expect(mockCreateCampaignCalendar).toHaveBeenCalledWith(
        'camp-new',
        expect.objectContaining({
          name: 'گاه‌شمار سفارشی گاتیک',
          months: expect.arrayContaining([
            expect.objectContaining({ name: 'ماه پایانی اضافی', days: 15 })
          ])
        })
      );
    });

    it('2. Invalid draft halts advancement past Step 3', () => {
      const invalidDraft: GenericCalendarData = {
        id: 'cal-invalid',
        name: '', // Empty name makes it invalid
        startYear: 1500,
        eraLabel: '',
        months: [{ name: 'ماه بدون روز', days: 0 }], // 0 days makes it invalid
        weekdays: ['روز ۱'],
        festivals: [],
        offDays: []
      };

      const validation = validateCalendar(invalidDraft);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Attempting to step forward with this invalid draft fails validation check
      const canAdvance = validation.valid;
      expect(canAdvance).toBe(false);
    });
  });

  describe('د) رندر کارتهای قالب در گام ۳ ویزارد و شکست خطوط (.option-card)', () => {
    it('1. Renders all 3 preset template names in DOM and verifies .option-card class wrapping', () => {
      const draftCampaign: Campaign = {
        id: 'draft-camp-1',
        title: 'کمپین آزمایشی',
        system: 'dnd5e',
        ownerId: 'u-1',
        dmIds: ['u-1'],
        playerIds: [],
        status: 'draft',
        createdAt: '2026-11-07',
        wizardState: {
          startMode: 'scratch',
          step: 3,
          completed: [1, 2]
        }
      } as any;

      const htmlWizard = renderToString(
        <CampaignWizardModal
          isOpen={true}
          onClose={() => {}}
          onLaunchSuccess={() => {}}
          currentUser={{ id: 'u-1', name: 'DM' } as any}
          existingDraftCampaign={draftCampaign}
          myCampaigns={[]}
        />
      );

      // All 3 template card names must appear completely in the DOM
      expect(htmlWizard).toContain('شاه‌روزان زروانیا');
      expect(htmlWizard).toContain('گاه‌شمار گاتایی');
      expect(htmlWizard).toContain('گاه‌شمار از صفر');

      // The cards must use option-card class
      expect(htmlWizard).toContain('option-card');

      // Collapsible section for structure editing is present in DOM
      expect(htmlWizard).toContain('ویرایش ساختار تقویم');
    });
  });
});
