import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPE_DEFINITIONS,
  isNotificationTypeMuted,
  sanitizePayloadForPlayer,
  groupNotificationsByCampaign,
  computeLazySessionReminders,
  generateCronScheduledReminders,
} from './notifications';
import { NotificationItem, NotificationPayload, NotificationPref, Session } from '../../src/types/index';

describe('Notifications & Reminders Engine', () => {
  it('has valid definitions for all 14 notification types', () => {
    const expectedTypes = [
      'invite_received',
      'campaign_joined',
      'session_scheduled',
      'session_changed',
      'session_cancelled',
      'rsvp_reminder',
      'poll_opened',
      'poll_closed',
      'handout_revealed',
      'quest_updated',
      'encounter_started',
      'approval_decided',
      'level_up_available',
      'backstory_comment',
    ] as const;

    for (const t of expectedTypes) {
      expect(NOTIFICATION_TYPE_DEFINITIONS[t]).toBeDefined();
      expect(NOTIFICATION_TYPE_DEFINITIONS[t].labelFa).toBeTruthy();
      expect(NOTIFICATION_TYPE_DEFINITIONS[t].descriptionFa).toBeTruthy();
      expect(NOTIFICATION_TYPE_DEFINITIONS[t].defaultEnabled).toBe(true);
    }
  });

  describe('isNotificationTypeMuted', () => {
    it('returns false when prefs are undefined or empty', () => {
      expect(isNotificationTypeMuted(undefined, 'session_scheduled')).toBe(false);
      expect(isNotificationTypeMuted(null, 'invite_received')).toBe(false);
      expect(
        isNotificationTypeMuted(
          { userId: 'u1', types: {}, pushEnabled: true },
          'quest_updated'
        )
      ).toBe(false);
    });

    it('respects explicitly muted preferences', () => {
      const prefs: NotificationPref = {
        userId: 'u1',
        types: {
          session_scheduled: false,
          quest_updated: true,
        },
        pushEnabled: true,
      };

      expect(isNotificationTypeMuted(prefs, 'session_scheduled')).toBe(true);
      expect(isNotificationTypeMuted(prefs, 'quest_updated')).toBe(false);
      expect(isNotificationTypeMuted(prefs, 'invite_received')).toBe(false);
    });
  });

  describe('sanitizePayloadForPlayer (Security requirement: Never leak DM-only text to players)', () => {
    const secretPayload: NotificationPayload = {
      title: 'مأموریت جدید',
      body: 'متن مأموریت برای همه بازیکنان',
      campaignId: 'c1',
      targetType: 'quest',
      targetId: 'q1',
      metadata: {
        questId: 'q1',
        publicSummary: 'عمومی',
        dmNotes: 'راز مخفی: غول در غار پنهان شده است',
        secretNotes: 'تله جادویی در ورودی قرار دارد',
        dmAdvice: 'به بازیکنان سختی بده',
        internalNotes: 'اطلاعات محرمانه مستر',
        secret: 'گنج در صندوق سوم است',
      },
    };

    it('keeps secrets when recipient is DM', () => {
      const dmView = sanitizePayloadForPlayer(secretPayload, true);
      expect(dmView.metadata?.dmNotes).toBe('راز مخفی: غول در غار پنهان شده است');
      expect(dmView.metadata?.secretNotes).toBe('تله جادویی در ورودی قرار دارد');
    });

    it('strips all DM secrets and notes when recipient is player', () => {
      const playerView = sanitizePayloadForPlayer(secretPayload, false);
      expect(playerView.title).toBe('مأموریت جدید');
      expect(playerView.body).toBe('متن مأموریت برای همه بازیکنان');
      expect(playerView.metadata?.publicSummary).toBe('عمومی');
      expect(playerView.metadata?.dmNotes).toBeUndefined();
      expect(playerView.metadata?.secretNotes).toBeUndefined();
      expect(playerView.metadata?.dmAdvice).toBeUndefined();
      expect(playerView.metadata?.internalNotes).toBeUndefined();
      expect(playerView.metadata?.secret).toBeUndefined();
    });
  });

  describe('groupNotificationsByCampaign', () => {
    const items: NotificationItem[] = [
      {
        id: 'n1',
        userId: 'u1',
        campaignId: 'c1',
        campaignTitle: 'کمپین زروانیا',
        type: 'session_scheduled',
        payload: { title: 'جلسه ۱', body: '' },
        readAt: null,
        createdAt: 1000,
      },
      {
        id: 'n2',
        userId: 'u1',
        campaignId: 'c1',
        campaignTitle: 'کمپین زروانیا',
        type: 'quest_updated',
        payload: { title: 'مأموریت ۱', body: '' },
        readAt: 1200,
        createdAt: 1100,
      },
      {
        id: 'n3',
        userId: 'u1',
        campaignId: null,
        type: 'invite_received',
        payload: { title: 'دعوت‌نامه', body: '' },
        readAt: null,
        createdAt: 900,
      },
      {
        id: 'n4',
        userId: 'u1',
        campaignId: 'c2',
        campaignTitle: 'کمپین دوم',
        type: 'handout_revealed',
        payload: { title: 'نقشه ورنا', body: '' },
        readAt: null,
        createdAt: 1300,
      },
    ];

    it('groups correctly by campaign and global items', () => {
      const grouped = groupNotificationsByCampaign(items);
      expect(grouped.length).toBe(3);

      const c1Group = grouped.find((g) => g.campaignId === 'c1');
      expect(c1Group).toBeDefined();
      expect(c1Group?.items.length).toBe(2);
      expect(c1Group?.unreadCount).toBe(1);

      const globalGroup = grouped.find((g) => g.campaignId === null);
      expect(globalGroup).toBeDefined();
      expect(globalGroup?.items.length).toBe(1);
      expect(globalGroup?.unreadCount).toBe(1);
    });
  });

  describe('computeLazySessionReminders', () => {
    const baseNow = new Date('2026-11-01T12:00:00Z').getTime();

    const upcomingSession: Session = {
      id: 'sess-1',
      campaignId: 'c1',
      number: 5,
      title: 'دروازه‌های ورنا',
      scheduledAt: new Date(baseNow + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      durationMinutes: 180,
      status: 'confirmed',
      createdBy: 'dm-1',
      createdAt: baseNow - 86400000,
      updatedAt: baseNow - 86400000,
      rsvps: [],
    };

    it('generates rsvp_reminder if user has not RSVPd for upcoming session within horizon', () => {
      const reminders = computeLazySessionReminders({
        userId: 'player-1',
        sessions: [upcomingSession],
        existingNotifications: [],
        nowMs: baseNow,
        horizonHours: 24,
      });

      expect(reminders.length).toBe(1);
      expect(reminders[0].type).toBe('rsvp_reminder');
      expect(reminders[0].payload.targetId).toBe('sess-1');
      expect(reminders[0].payload.body).toContain('ساعت دیگر');
    });

    it('does NOT generate reminder if user already confirmed or declined', () => {
      const sessionWithYes: Session = {
        ...upcomingSession,
        rsvps: [
          {
            sessionId: 'sess-1',
            userId: 'player-1',
            status: 'yes',
            updatedAt: baseNow - 1000,
          },
        ],
      };

      const reminders = computeLazySessionReminders({
        userId: 'player-1',
        sessions: [sessionWithYes],
        existingNotifications: [],
        nowMs: baseNow,
      });

      expect(reminders.length).toBe(0);
    });

    it('de-duplicates if reminder for this session was already created', () => {
      const existingReminder: NotificationItem = {
        id: 'existing-1',
        userId: 'player-1',
        campaignId: 'c1',
        type: 'rsvp_reminder',
        payload: {
          title: 'یادآوری',
          body: '',
          targetId: 'sess-1',
        },
        readAt: null,
        createdAt: baseNow - 3600000,
      };

      const reminders = computeLazySessionReminders({
        userId: 'player-1',
        sessions: [upcomingSession],
        existingNotifications: [existingReminder],
        nowMs: baseNow,
      });

      expect(reminders.length).toBe(0);
    });

    it('skips cancelled or far-future sessions', () => {
      const farFutureSession: Session = {
        ...upcomingSession,
        scheduledAt: new Date(baseNow + 72 * 60 * 60 * 1000).toISOString(), // 3 days away
      };
      const cancelledSession: Session = {
        ...upcomingSession,
        status: 'cancelled',
      };

      const reminders = computeLazySessionReminders({
        userId: 'player-1',
        sessions: [farFutureSession, cancelledSession],
        existingNotifications: [],
        nowMs: baseNow,
        horizonHours: 24,
      });

      expect(reminders.length).toBe(0);
    });

    it('generateCronScheduledReminders processes multiple users', () => {
      const allReminders = generateCronScheduledReminders(
        [upcomingSession],
        [{ userId: 'u1' }, { userId: 'u2' }],
        [],
        baseNow
      );

      expect(allReminders.length).toBe(2);
      expect(allReminders.map((r) => r.userId)).toEqual(['u1', 'u2']);
    });
  });
});
