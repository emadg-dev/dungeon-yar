import { describe, it, expect } from 'vitest';
import {
  validateHandoutPayload,
  checkMediaSize,
  checkCampaignQuota,
  filterPinsForPlayer,
  filterHandoutsForPlayer,
  isHandoutNew,
  clampCoordinates,
  sortHandouts,
  MAX_HANDOUT_MEDIA_BYTES,
  DEFAULT_CAMPAIGN_MEDIA_QUOTA_BYTES
} from './handoutEngine';
import { Handout, MapPin } from '../../src/types';

describe('Handout Engine Unit Tests (Step 4.3)', () => {
  describe('validateHandoutPayload', () => {
    it('rejects empty title', () => {
      const res = validateHandoutPayload({ title: '   ', kind: 'text', body: 'سلام' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('عنوان');
    });

    it('rejects invalid kind', () => {
      const res = validateHandoutPayload({ title: 'سند', kind: 'video' as any });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('نوع سند');
    });

    it('rejects text handout without body', () => {
      const res = validateHandoutPayload({ title: 'نامه کهن', kind: 'text', body: '' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('متن سند');
    });

    it('accepts valid text handout', () => {
      const res = validateHandoutPayload({ title: 'نامه کهن', kind: 'text', body: 'به نام زروان...' });
      expect(res.valid).toBe(true);
    });

    it('rejects selected visibility with empty recipients', () => {
      const res = validateHandoutPayload({
        title: 'نقشه مخفی',
        kind: 'map',
        visibility: 'selected',
        recipients: []
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('حداقل یک ماجراجو');
    });

    it('accepts selected visibility with recipients', () => {
      const res = validateHandoutPayload({
        title: 'نقشه مخفی',
        kind: 'map',
        visibility: 'selected',
        recipients: ['part-1']
      });
      expect(res.valid).toBe(true);
    });
  });

  describe('Media Size and Quota Checks', () => {
    it('accepts media within 400KB cap', () => {
      const res = checkMediaSize(350 * 1024);
      expect(res.valid).toBe(true);
    });

    it('rejects media exceeding 400KB cap', () => {
      const res = checkMediaSize(450 * 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('بیش از سقف مجاز');
    });

    it('validates campaign media quota (20MB)', () => {
      const current = 18 * 1024 * 1024; // 18MB
      const ok = checkCampaignQuota(current, 300 * 1024);
      expect(ok.valid).toBe(true);

      const overflow = checkCampaignQuota(current, 3 * 1024 * 1024);
      expect(overflow.valid).toBe(false);
      expect(overflow.error).toContain('سهمیه ذخیره‌سازی');
    });
  });

  describe('filterHandoutsForPlayer and filterPinsForPlayer', () => {
    const mockPins: MapPin[] = [
      { id: 'pin-1', handoutId: 'h-1', x: 25, y: 30, label: 'دروازه شهر', revealed: 1 },
      { id: 'pin-2', handoutId: 'h-1', x: 50, y: 70, label: 'تله مرگبار مستر', revealed: 0 },
      { id: 'pin-3', handoutId: 'h-1', x: 80, y: 90, label: 'محراب زمان', revealed: true }
    ];

    const mockHandouts: Handout[] = [
      {
        id: 'h-revealed',
        campaignId: 'c1',
        title: 'نقشه ورنا',
        kind: 'map',
        visibility: 'revealed',
        tags: ['نقشه'],
        sortIndex: 0,
        createdBy: 'u-dm',
        createdAt: 1000,
        updatedAt: 1000,
        pins: mockPins
      },
      {
        id: 'h-hidden',
        campaignId: 'c1',
        title: 'اسناد سری فرقه',
        kind: 'text',
        body: 'یادداشت خصوصی دانجن‌مستر',
        visibility: 'hidden',
        tags: [],
        sortIndex: 1,
        createdBy: 'u-dm',
        createdAt: 2000,
        updatedAt: 2000
      },
      {
        id: 'h-selected',
        campaignId: 'c1',
        title: 'پیام پنهان برای رزم‌جو',
        kind: 'text',
        body: 'فقط برای تو...',
        visibility: 'selected',
        recipients: ['part-warrior'],
        tags: [],
        sortIndex: 2,
        createdBy: 'u-dm',
        createdAt: 3000,
        updatedAt: 3000
      }
    ];

    it('allows DM to see everything including secret pins and hidden handouts', () => {
      const dmHandouts = filterHandoutsForPlayer(mockHandouts, null, true);
      expect(dmHandouts.length).toBe(3);
      const mapHandout = dmHandouts.find(h => h.id === 'h-revealed');
      expect(mapHandout?.pins?.length).toBe(3);
    });

    it('filters hidden handouts and secret pins for regular players', () => {
      const playerHandouts = filterHandoutsForPlayer(mockHandouts, 'part-wizard', false);
      expect(playerHandouts.length).toBe(1);
      expect(playerHandouts[0].id).toBe('h-revealed');
      // Secret pin (revealed: 0) should be stripped out!
      expect(playerHandouts[0].pins?.length).toBe(2);
      expect(playerHandouts[0].pins?.some(p => p.id === 'pin-2')).toBe(false);
    });

    it('allows selected player to see their assigned handout', () => {
      const warriorHandouts = filterHandoutsForPlayer(mockHandouts, 'part-warrior', false);
      expect(warriorHandouts.length).toBe(2);
      expect(warriorHandouts.some(h => h.id === 'h-selected')).toBe(true);
      expect(warriorHandouts.some(h => h.id === 'h-hidden')).toBe(false);
    });
  });

  describe('isHandoutNew and Coordinates', () => {
    const handout: Handout = {
      id: 'h-new',
      campaignId: 'c1',
      title: 'نقشه تازه',
      kind: 'map',
      visibility: 'revealed',
      revealedAt: Date.now() - 3600000, // 1 hour ago
      tags: [],
      sortIndex: 0,
      createdBy: 'dm',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000
    };

    it('marks unseen handout as new', () => {
      expect(isHandoutNew(handout, [])).toBe(true);
    });

    it('does not mark seen handout as new', () => {
      expect(isHandoutNew(handout, ['h-new'])).toBe(false);
    });

    it('clamps coordinates to 0..100', () => {
      expect(clampCoordinates(-5, 120)).toEqual({ x: 0, y: 100 });
      expect(clampCoordinates(45.6789, 82.111)).toEqual({ x: 45.68, y: 82.11 });
    });

    it('sorts handouts properly', () => {
      const items: Handout[] = [
        { ...handout, id: '1', sortIndex: 2, updatedAt: 100 },
        { ...handout, id: '2', sortIndex: 1, updatedAt: 200 },
        { ...handout, id: '3', sortIndex: 1, updatedAt: 300 }
      ];
      const sorted = sortHandouts(items);
      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });
  });
});
