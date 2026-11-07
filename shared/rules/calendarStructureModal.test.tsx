import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CalendarStructureModal } from '../../src/components/calendar/CalendarStructureModal';

// Mock api methods to avoid network requests during render
vi.mock('../../src/services/api', () => {
  const dummyCal = {
    id: 'starter-cal',
    name: 'گاه‌شمار پیش‌فرض',
    startYear: 1500,
    eraLabel: 'پ.ر.ن',
    months: [{ name: 'فروردین', days: 30 }],
    offDays: [],
    weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
    anchor: { weekdayIndex: 0 },
    festivals: []
  };

  return {
    api: {
      getCampaignCalendars: vi.fn().mockResolvedValue([dummyCal]),
      getCampaignTime: vi.fn().mockResolvedValue({ epochDay: 100, primaryCalendarId: 'starter-cal' }),
      updateCampaignCalendar: vi.fn().mockRejectedValue(new Error('خطای شبیه‌سازی‌شده در ذخیره گاه‌شمار')),
      createCampaignCalendar: vi.fn().mockResolvedValue({ ...dummyCal, id: 'cal-new' }),
      deleteCampaignCalendar: vi.fn().mockResolvedValue({ success: true }),
      setCampaignTime: vi.fn().mockResolvedValue({ success: true })
    }
  };
});

describe('CalendarStructureModal Role & Error Handling Render Tests', () => {
  it('1. Does not render content when isOpen is false', () => {
    const html = renderToString(
      <CalendarStructureModal
        isOpen={false}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="owner"
      />
    );
    expect(html).toBe('');
  });

  it('2. Renders in read-only mode for player and spectator without edit/save actions', () => {
    const htmlPlayer = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="player"
      />
    );

    // Save button must not be visible for player
    expect(htmlPlayer).not.toContain('ذخیره ساختار گاه‌شمار');
    // Add calendar button must not be visible
    expect(htmlPlayer).not.toContain('افزودن گاه‌شمار');
    // Subtitle must state view-only
    expect(htmlPlayer).toContain('مشاهده جزئیات ساختار گاه‌شمار');

    const htmlSpectator = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="spectator"
      />
    );
    expect(htmlSpectator).not.toContain('ذخیره ساختار گاه‌شمار');
    expect(htmlSpectator).toContain('مشاهده جزئیات ساختار گاه‌شمار');
  });

  it('3. Renders full editing controls and save button for owner and co_dm', () => {
    const htmlOwner = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="owner"
      />
    );
    expect(htmlOwner).toContain('تنظیم ساختار ماه‌ها');
    expect(htmlOwner).toContain('افزودن گاه‌شمار');
    expect(htmlOwner).toContain('ذخیره ساختار گاه‌شمار');

    const htmlCoDm = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="co_dm"
      />
    );
    expect(htmlCoDm).toContain('تنظیم ساختار ماه‌ها');
    expect(htmlCoDm).toContain('افزودن گاه‌شمار');
    expect(htmlCoDm).toContain('ذخیره ساختار گاه‌شمار');
  });

  it('4. Enforces disabled state on inputs when rendered for non-DM roles', () => {
    const htmlPlayer = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="player"
      />
    );
    // Inputs must be rendered with disabled attribute
    expect(htmlPlayer).toContain('disabled=""');
  });

  it('5. Renders calendar switcher and identity sections with semantic design tokens', () => {
    const html = renderToString(
      <CalendarStructureModal
        isOpen={true}
        onClose={() => {}}
        campaignId="camp-1"
        userRole="owner"
      />
    );
    expect(html).toContain('مشخصات هویتی گاه‌شمار');
    expect(html).toContain('روزهای هفته');
    expect(html).toContain('ماه‌های سال');
    expect(html).toContain('روزهای برون‌گاه');
  });
});
