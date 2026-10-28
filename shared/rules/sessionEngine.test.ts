import { describe, it, expect } from 'vitest';
import {
  filterSessionForViewer,
  canUserRsvp,
  canUserVote,
  canManageSessions,
  validatePollOptions,
  calculatePollTally,
  findBestPollOption,
  formatSessionDateTime,
  buildAttendanceHistoryEvent,
  partitionSessions
} from './sessionEngine';
import type { Session, SessionPoll, SessionPollVote } from '../../src/types';

describe('sessionEngine', () => {
  const dummySession: Session = {
    id: 'ses-1',
    campaignId: 'camp-1',
    number: 3,
    title: 'نبرد در دره تاریک',
    scheduledAt: '2026-11-20T16:00:00.000Z',
    durationMinutes: 180,
    placeText: 'کافه بردگیم',
    onlineUrl: 'https://meet.google.com/xyz',
    status: 'confirmed',
    inWorldDate: '۱۵ زروان، سال ۱۵۰۰',
    dmNotes: 'اطلاعات محرمانه دانجن مستر درباره تله‌ها',
    createdBy: 'dm-user-1',
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  };

  describe('filterSessionForViewer (DM notes confidentiality)', () => {
    it('preserves dmNotes for owner', () => {
      const filtered = filterSessionForViewer(dummySession, 'owner');
      expect(filtered.dmNotes).toBe('اطلاعات محرمانه دانجن مستر درباره تله‌ها');
    });

    it('preserves dmNotes for co_dm', () => {
      const filtered = filterSessionForViewer(dummySession, 'co_dm');
      expect(filtered.dmNotes).toBe('اطلاعات محرمانه دانجن مستر درباره تله‌ها');
    });

    it('removes dmNotes for players', () => {
      const filtered = filterSessionForViewer(dummySession, 'player');
      expect(filtered.dmNotes).toBeUndefined();
    });

    it('removes dmNotes for spectators', () => {
      const filtered = filterSessionForViewer(dummySession, 'spectator');
      expect(filtered.dmNotes).toBeUndefined();
    });

    it('removes dmNotes when role is missing or null', () => {
      const filtered = filterSessionForViewer(dummySession, null);
      expect(filtered.dmNotes).toBeUndefined();
    });
  });

  describe('RBAC permissions', () => {
    it('allows player and DMs to RSVP, forbids spectators', () => {
      expect(canUserRsvp('owner')).toBe(true);
      expect(canUserRsvp('co_dm')).toBe(true);
      expect(canUserRsvp('player')).toBe(true);
      expect(canUserRsvp('spectator')).toBe(false);
      expect(canUserRsvp(null)).toBe(false);
    });

    it('allows player and DMs to vote in polls, forbids spectators', () => {
      expect(canUserVote('owner')).toBe(true);
      expect(canUserVote('co_dm')).toBe(true);
      expect(canUserVote('player')).toBe(true);
      expect(canUserVote('spectator')).toBe(false);
      expect(canUserVote(undefined)).toBe(false);
    });

    it('allows only owner and co_dm to manage sessions', () => {
      expect(canManageSessions('owner')).toBe(true);
      expect(canManageSessions('co_dm')).toBe(true);
      expect(canManageSessions('player')).toBe(false);
      expect(canManageSessions('spectator')).toBe(false);
    });
  });

  describe('validatePollOptions', () => {
    it('rejects fewer than 2 options', () => {
      const res = validatePollOptions([{ startsAt: '2026-11-20T16:00:00Z' }]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('حداقل ۲ گزینه');
    });

    it('rejects more than 5 options', () => {
      const res = validatePollOptions([
        { startsAt: '2026-11-20T16:00:00Z' },
        { startsAt: '2026-11-21T16:00:00Z' },
        { startsAt: '2026-11-22T16:00:00Z' },
        { startsAt: '2026-11-23T16:00:00Z' },
        { startsAt: '2026-11-24T16:00:00Z' },
        { startsAt: '2026-11-25T16:00:00Z' }
      ]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('حداکثر می‌توانید ۵ گزینه');
    });

    it('accepts between 2 and 5 valid options and assigns IDs if missing', () => {
      const res = validatePollOptions([
        { startsAt: '2026-11-20T16:00:00Z' },
        { startsAt: '2026-11-21T18:00:00Z', id: 'opt-custom' }
      ]);
      expect(res.valid).toBe(true);
      expect(res.normalized?.length).toBe(2);
      expect(res.normalized?.[1].id).toBe('opt-custom');
      expect(res.normalized?.[0].id).toBeTruthy();
    });

    it('rejects invalid date strings', () => {
      const res = validatePollOptions([
        { startsAt: 'not-a-valid-date' },
        { startsAt: '2026-11-21T18:00:00Z' }
      ]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('نامعتبر است');
    });
  });

  describe('calculatePollTally and findBestPollOption', () => {
    const poll: SessionPoll = {
      id: 'poll-1',
      sessionId: 'ses-1',
      options: [
        { id: 'opt-1', startsAt: '2026-11-20T16:00:00Z' },
        { id: 'opt-2', startsAt: '2026-11-21T16:00:00Z' },
        { id: 'opt-3', startsAt: '2026-11-22T16:00:00Z' }
      ],
      status: 'open',
      createdAt: 1700000000000
    };

    const votes: SessionPollVote[] = [
      { pollId: 'poll-1', optionId: 'opt-1', userId: 'u1', choice: 'yes', updatedAt: 1 },
      { pollId: 'poll-1', optionId: 'opt-1', userId: 'u2', choice: 'yes', updatedAt: 2 },
      { pollId: 'poll-1', optionId: 'opt-2', userId: 'u1', choice: 'maybe', updatedAt: 3 },
      { pollId: 'poll-1', optionId: 'opt-2', userId: 'u2', choice: 'no', updatedAt: 4 },
      { pollId: 'poll-1', optionId: 'opt-3', userId: 'u1', choice: 'no', updatedAt: 5 }
    ];

    it('tallies votes accurately per option', () => {
      const tally = calculatePollTally(poll, votes);
      expect(tally['opt-1'].yes).toBe(2);
      expect(tally['opt-1'].score).toBe(4); // 2 * 2 = 4
      expect(tally['opt-2'].maybe).toBe(1);
      expect(tally['opt-2'].no).toBe(1);
      expect(tally['opt-2'].score).toBe(1); // 0 + 1 = 1
      expect(tally['opt-3'].no).toBe(1);
      expect(tally['opt-3'].score).toBe(0);
    });

    it('picks the best poll option with the highest score', () => {
      const best = findBestPollOption(poll, votes);
      expect(best?.id).toBe('opt-1');
    });
  });

  describe('formatSessionDateTime', () => {
    it('formats UTC ISO timestamp into Persian date and time with Asia/Tehran', () => {
      const formatted = formatSessionDateTime('2026-11-20T16:30:00.000Z', 'Asia/Tehran');
      expect(formatted.date).toBeTruthy();
      expect(formatted.time).toBeTruthy();
      expect(formatted.full).toContain(formatted.time);
    });

    it('handles invalid date input gracefully', () => {
      const formatted = formatSessionDateTime('invalid-date');
      expect(formatted.date).toBe('نامشخص');
      expect(formatted.time).toBe('--:--');
    });
  });

  describe('buildAttendanceHistoryEvent', () => {
    it('generates the exact milestone event required with "حضور در جلسه N"', () => {
      const ev = buildAttendanceHistoryEvent(4, 'ماجراجویی در قلعه کهن', 'ses-4', 'camp-1');
      expect(ev.eventType).toBe('major_deed');
      expect(ev.payload.title).toBe('حضور در جلسه 4');
      expect(ev.payload.sessionNumber).toBe(4);
      expect(ev.payload.sessionId).toBe('ses-4');
    });
  });

  describe('partitionSessions', () => {
    it('splits sessions into upcoming and past', () => {
      const sessions: Session[] = [
        { ...dummySession, id: 's1', number: 1, status: 'done' },
        { ...dummySession, id: 's2', number: 2, status: 'confirmed' },
        { ...dummySession, id: 's3', number: 3, status: 'planned' },
        { ...dummySession, id: 's4', number: 4, status: 'cancelled' }
      ];

      const { upcoming, past, nextSession } = partitionSessions(sessions);
      expect(upcoming.length).toBe(2);
      expect(past.length).toBe(2);
      expect(nextSession?.id).toBe('s2');
    });
  });
});
