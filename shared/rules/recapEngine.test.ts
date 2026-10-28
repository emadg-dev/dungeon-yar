/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  filterRecapForViewer,
  filterRecapsForViewer,
  filterHighlightForViewer,
  canUserCreateRecap,
  canUserEditRecap,
  validateRecapPayload,
  searchRecaps,
  buildHighlightHistoryEvent,
  formatRecapExcerpt
} from './recapEngine';
import { SessionRecap, SessionHighlight } from '../../src/types';

describe('recapEngine', () => {
  const publishedPartyRecap: SessionRecap = {
    id: 'r1',
    sessionId: 's1',
    campaignId: 'c1',
    authorId: 'u-dm',
    authorName: 'دانجن مستر',
    sessionNumber: 1,
    sessionTitle: 'نبرد در دره سایه',
    title: 'شکست نگهبانان دخمه',
    body: 'گروه ماجراجویان پس از عبور از گذرگاه کوهستانی با ارواح باستانی روبرو شدند.',
    visibility: 'party',
    status: 'published',
    createdAt: 1000,
    updatedAt: 1000
  };

  const draftRecap: SessionRecap = {
    ...publishedPartyRecap,
    id: 'r2',
    status: 'draft',
    title: 'پیش‌نویس بررسی وقایع'
  };

  const dmOnlyRecap: SessionRecap = {
    ...publishedPartyRecap,
    id: 'r3',
    visibility: 'dm_only',
    title: 'اسرار پشت پرده فرقه'
  };

  describe('filterRecapForViewer', () => {
    it('allows DM to view published, draft, and dm_only recaps', () => {
      expect(filterRecapForViewer(publishedPartyRecap, true)).not.toBeNull();
      expect(filterRecapForViewer(draftRecap, true)).not.toBeNull();
      expect(filterRecapForViewer(dmOnlyRecap, true)).not.toBeNull();
    });

    it('allows the author to view their own draft and dm_only recaps', () => {
      expect(filterRecapForViewer(draftRecap, false, 'u-dm')).not.toBeNull();
      expect(filterRecapForViewer(dmOnlyRecap, false, 'u-dm')).not.toBeNull();
    });

    it('hides drafts and dm_only recaps from normal players', () => {
      expect(filterRecapForViewer(publishedPartyRecap, false, 'u-player')).not.toBeNull();
      expect(filterRecapForViewer(draftRecap, false, 'u-player')).toBeNull();
      expect(filterRecapForViewer(dmOnlyRecap, false, 'u-player')).toBeNull();
    });

    it('filters arrays of recaps appropriately for players', () => {
      const all = [publishedPartyRecap, draftRecap, dmOnlyRecap];
      const filtered = filterRecapsForViewer(all, false, 'u-player');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('r1');
    });
  });

  describe('filterHighlightForViewer', () => {
    const visibleHighlight: SessionHighlight = {
      id: 'h1',
      sessionId: 's1',
      campaignId: 'c1',
      characterId: 'char-1',
      text: 'شیردال ضربه کاری را به سرکرده راهزنان وارد آورد.',
      visibleToPlayer: 1,
      createdAt: 1000
    };

    const hiddenHighlight: SessionHighlight = {
      id: 'h2',
      sessionId: 's1',
      campaignId: 'c1',
      characterId: 'char-2',
      text: 'سرنخ پنهانی که تنها دانجن مستر می‌داند.',
      visibleToPlayer: 0,
      createdAt: 1000
    };

    it('allows DM to see both visible and hidden highlights', () => {
      expect(filterHighlightForViewer(visibleHighlight, true)).not.toBeNull();
      expect(filterHighlightForViewer(hiddenHighlight, true)).not.toBeNull();
    });

    it('hides hidden highlights from players', () => {
      expect(filterHighlightForViewer(visibleHighlight, false)).not.toBeNull();
      expect(filterHighlightForViewer(hiddenHighlight, false)).toBeNull();
    });
  });

  describe('canUserCreateRecap', () => {
    it('always allows DM, owner, and co_dm', () => {
      expect(canUserCreateRecap('owner', false)).toBe(true);
      expect(canUserCreateRecap('co_dm', false)).toBe(true);
      expect(canUserCreateRecap('dm', false)).toBe(true);
    });

    it('only allows player if campaign allows player recaps', () => {
      expect(canUserCreateRecap('player', false)).toBe(false);
      expect(canUserCreateRecap('player', true)).toBe(true);
    });

    it('forbids spectator and guests', () => {
      expect(canUserCreateRecap('spectator', true)).toBe(false);
      expect(canUserCreateRecap(null, true)).toBe(false);
    });
  });

  describe('canUserEditRecap', () => {
    it('allows DMs to edit any recap', () => {
      expect(canUserEditRecap(publishedPartyRecap, 'owner', 'u-other')).toBe(true);
      expect(canUserEditRecap(publishedPartyRecap, 'co_dm', 'u-other')).toBe(true);
      expect(canUserEditRecap(publishedPartyRecap, 'dm', 'u-other')).toBe(true);
    });

    it('allows author to edit their own recap', () => {
      expect(canUserEditRecap(publishedPartyRecap, 'player', 'u-dm')).toBe(true);
    });

    it('forbids other players from editing', () => {
      expect(canUserEditRecap(publishedPartyRecap, 'player', 'u-player2')).toBe(false);
    });
  });

  describe('validateRecapPayload', () => {
    it('rejects empty title or body', () => {
      expect(validateRecapPayload({ title: '', body: 'متن' }).valid).toBe(false);
      expect(validateRecapPayload({ title: 'عنوان', body: '   ' }).valid).toBe(false);
    });

    it('accepts valid payload', () => {
      expect(validateRecapPayload({ title: 'جلسه اول', body: 'ماجرا آغاز شد.' }).valid).toBe(true);
    });
  });

  describe('searchRecaps', () => {
    const list: SessionRecap[] = [
      publishedPartyRecap,
      {
        ...publishedPartyRecap,
        id: 'r4',
        sessionNumber: 2,
        title: 'اسرار ویرانه‌های باستانی',
        body: 'پیدا کردن کتابچه قدیمی کیمیاگری.'
      }
    ];

    it('finds recaps by title or body', () => {
      expect(searchRecaps(list, 'دخمه')).toHaveLength(1);
      expect(searchRecaps(list, 'کیمیاگری')).toHaveLength(1);
      expect(searchRecaps(list, 'جلسه 2')).toHaveLength(1);
      expect(searchRecaps(list, 'ناموجود')).toHaveLength(0);
    });
  });

  describe('buildHighlightHistoryEvent', () => {
    it('constructs milestone history event correctly', () => {
      const highlight: SessionHighlight = {
        id: 'hl-1',
        sessionId: 's-5',
        campaignId: 'c-1',
        characterId: 'char-10',
        text: 'دفاع فداکارانه در برابر غول سنگی',
        visibleToPlayer: 1,
        createdAt: 500000
      };

      const event = buildHighlightHistoryEvent(highlight, 5);
      expect(event.characterId).toBe('char-10');
      expect(event.eventType).toBe('milestone');
      expect(event.title).toBe('رویداد برجسته در جلسه 5');
      expect(event.description).toBe('دفاع فداکارانه در برابر غول سنگی');
      expect(event.sessionNumber).toBe(5);
    });
  });

  describe('formatRecapExcerpt', () => {
    it('truncates and cleans markdown', () => {
      const markdown = '### شروع نبرد\n\n**سورنا** با شمشیر خود _حمله_ کرد.';
      const excerpt = formatRecapExcerpt(markdown, 30);
      expect(excerpt).not.toContain('###');
      expect(excerpt).not.toContain('**');
      expect(excerpt.length).toBeLessThanOrEqual(35);
    });
  });
});
