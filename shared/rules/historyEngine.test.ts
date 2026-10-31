import { describe, it, expect } from 'vitest';
import {
  filterHistoryForViewer,
  groupHistoryByCampaign,
  computeCharacterStats,
  partitionCampaigns,
  calculateCountdown,
  validateLegacyJoin
} from './historyEngine';
import { CharacterHistoryEvent, CharacterParticipation, MasterCharacter, Campaign } from '../../src/types';

describe('historyEngine', () => {
  describe('filterHistoryForViewer', () => {
    const mockEvents: CharacterHistoryEvent[] = [
      {
        id: 'ev-1',
        characterId: 'char-1',
        campaignId: 'camp-a',
        eventType: 'joined',
        payload: { title: 'پیوستن به کمپین الف' },
        timestamp: 1000
      },
      {
        id: 'ev-2',
        characterId: 'char-1',
        campaignId: 'camp-b',
        eventType: 'joined',
        payload: { title: 'پیوستن به کمپین ب' },
        timestamp: 2000
      },
      {
        id: 'ev-3',
        characterId: 'char-1',
        campaignId: null,
        eventType: 'custom',
        payload: { title: 'رویداد عمومی' },
        timestamp: 500
      }
    ];

    it('allows character owner to see ALL history events across all campaigns', () => {
      const filtered = filterHistoryForViewer(mockEvents, 'user-owner', 'user-owner', ['camp-a']);
      expect(filtered.length).toBe(3);
    });

    it('restricts a DM to ONLY see events belonging to their campaign', () => {
      // User is DM of camp-a only
      const filtered = filterHistoryForViewer(mockEvents, 'user-dm', 'user-owner', ['camp-a']);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('ev-1');
      expect(filtered[0].campaignId).toBe('camp-a');
    });

    it('returns empty list if DM is not associated with any of the campaigns', () => {
      const filtered = filterHistoryForViewer(mockEvents, 'user-dm-other', 'user-owner', ['camp-other']);
      expect(filtered.length).toBe(0);
    });

    it('allows DM with multiple campaigns to see only their campaigns', () => {
      const filtered = filterHistoryForViewer(mockEvents, 'user-dm', 'user-owner', ['camp-a', 'camp-b']);
      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.campaignId)).toEqual(['camp-a', 'camp-b']);
    });
  });

  describe('groupHistoryByCampaign', () => {
    const events: CharacterHistoryEvent[] = [
      {
        id: 'ev-1',
        characterId: 'char-1',
        campaignId: 'camp-1',
        campaignName: 'زروانیا',
        eventType: 'joined',
        payload: { title: 'پیوستن' },
        timestamp: 1000
      },
      {
        id: 'ev-2',
        characterId: 'char-1',
        campaignId: 'camp-1',
        campaignName: 'زروانیا',
        eventType: 'level_up',
        payload: { title: 'صعود به سطح ۲' },
        timestamp: 2000
      },
      {
        id: 'ev-3',
        characterId: 'char-1',
        campaignId: 'camp-2',
        campaignName: 'سیاه‌چال کهن',
        eventType: 'joined',
        payload: { title: 'پیوستن' },
        timestamp: 3000
      },
      {
        id: 'ev-4',
        characterId: 'char-1',
        campaignId: null,
        eventType: 'major_deed',
        payload: { title: 'افتخار کهن دوران کودکی' },
        timestamp: 500
      }
    ];

    it('correctly groups events by campaign and general group', () => {
      const groups = groupHistoryByCampaign(events, { 'camp-1': 'زروانیا' });
      expect(groups.length).toBe(3);

      const camp1Group = groups.find(g => g.campaignId === 'camp-1');
      expect(camp1Group).toBeDefined();
      expect(camp1Group?.eventsCount).toBe(2);
      expect(camp1Group?.events[0].id).toBe('ev-2'); // Sorted descending by timestamp

      const generalGroup = groups.find(g => g.isGeneral);
      expect(generalGroup).toBeDefined();
      expect(generalGroup?.campaignName).toBe('رویدادهای عمومی و شخصی');
      expect(generalGroup?.eventsCount).toBe(1);
    });
  });

  describe('computeCharacterStats', () => {
    it('aggregates campaigns count, sessions attended, and highest level', () => {
      const participations: CharacterParticipation[] = [
        {
          id: 'p-1',
          characterId: 'c-1',
          campaignId: 'camp-1',
          level: 4,
          sessionsAttended: 5,
          status: 'active'
        } as any,
        {
          id: 'p-2',
          characterId: 'c-1',
          campaignId: 'camp-2',
          level: 7,
          sessionsAttended: 8,
          status: 'retired'
        } as any
      ];

      const stats = computeCharacterStats(participations, []);
      expect(stats.campaignsCount).toBe(2);
      expect(stats.highestLevel).toBe(7);
      expect(stats.sessionsAttended).toBe(13);
      expect(stats.activeParticipationsCount).toBe(1);
      expect(stats.retiredParticipationsCount).toBe(1);
    });

    it('handles empty participations safely', () => {
      const stats = computeCharacterStats([], []);
      expect(stats.campaignsCount).toBe(0);
      expect(stats.highestLevel).toBe(1);
      expect(stats.sessionsAttended).toBe(0);
    });
  });

  describe('partitionCampaigns', () => {
    it('partitions active/paused vs archived/left campaigns', () => {
      const campaigns: Campaign[] = [
        { id: 'c-1', name: 'کمپین فعال', status: 'active', membershipStatus: 'active' } as any,
        { id: 'c-2', name: 'کمپین بایگانی', status: 'archived', membershipStatus: 'active' } as any,
        { id: 'c-3', name: 'کمپین ترک شده', status: 'active', membershipStatus: 'left' } as any,
        { id: 'c-4', name: 'کمپین در حال ساخت', status: 'draft', membershipStatus: 'active' } as any
      ];

      const { current, past } = partitionCampaigns(campaigns);
      expect(current.map(c => c.id)).toEqual(['c-1', 'c-4']);
      expect(past.map(c => c.id)).toEqual(['c-2', 'c-3']);
      expect(past[0].isReadOnly).toBe(true);
    });
  });

  describe('calculateCountdown', () => {
    it('calculates friendly countdown for future session', () => {
      const now = new Date('2026-10-31T10:00:00Z').getTime();
      const future = new Date('2026-11-03T15:30:00Z').toISOString(); // 3 days, 5 hours, 30 min

      const res = calculateCountdown(future, now);
      expect(res).not.toBeNull();
      expect(res?.days).toBe(3);
      expect(res?.hours).toBe(5);
      expect(res?.text).toContain('۳ روز و ۵ ساعت مانده');
      expect(res?.isImminent).toBe(false);
    });

    it('flags sessions within 24 hours as imminent', () => {
      const now = new Date('2026-10-31T10:00:00Z').getTime();
      const future = new Date('2026-10-31T14:15:00Z').toISOString(); // 4 hours 15 min

      const res = calculateCountdown(future, now);
      expect(res?.isImminent).toBe(true);
      expect(res?.text).toContain('۴ ساعت و ۱۵ دقیقه مانده');
    });

    it('handles past sessions properly', () => {
      const now = new Date('2026-10-31T10:00:00Z').getTime();
      const past = new Date('2026-10-30T10:00:00Z').toISOString();

      const res = calculateCountdown(past, now);
      expect(res?.isPast).toBe(true);
      expect(res?.text).toBe('هم‌اکنون یا برگزار شده');
    });
  });

  describe('validateLegacyJoin', () => {
    const mockChar: MasterCharacter = {
      id: 'char-1',
      ownerId: 'user-1',
      name: 'آرتین',
      race: 'انسان',
      status: 'retired',
      appearance: '',
      backstory: { summary: '' } as any,
      createdAt: 1000,
      updatedAt: 2000
    };

    const mockCampaign: Campaign = {
      id: 'camp-2',
      name: 'کمپین جدید',
      status: 'active',
      ownerId: 'dm-1',
      settings: {
        startingLevel: 3,
        maxEntryLevel: 10,
        approval: { onCreate: true }
      }
    } as any;

    it('allows valid legacy join with correct initialLevel and requiresApproval flag', () => {
      const prevParts: CharacterParticipation[] = [
        { id: 'p-1', characterId: 'char-1', campaignId: 'camp-1', level: 5, status: 'retired' } as any
      ];

      const val = validateLegacyJoin(mockChar, mockCampaign, prevParts);
      expect(val.valid).toBe(true);
      expect(val.initialLevel).toBe(5); // Clamped between startingLevel(3) and maxEntryLevel(10)
      expect(val.requiresApproval).toBe(true);
    });

    it('rejects legacy join if character is dead', () => {
      const deadChar = { ...mockChar, status: 'dead' as const };
      const val = validateLegacyJoin(deadChar, mockCampaign, []);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('درگذشته');
    });

    it('rejects legacy join if character already has an active participation in target campaign', () => {
      const existing: CharacterParticipation[] = [
        { id: 'p-2', characterId: 'char-1', campaignId: 'camp-2', level: 3, status: 'active' } as any
      ];
      const val = validateLegacyJoin(mockChar, mockCampaign, existing);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('حضور فعال');
    });
  });
});
