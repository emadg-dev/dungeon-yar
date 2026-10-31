/**
 * Pure notification and reminder logic for DungeonYar (دانجن‌یار).
 * Handles notification types, payload sanitization (no DM secrets),
 * preference filtering, grouping by campaign, and lazy session reminders.
 */

import {
  NotificationType,
  NotificationItem,
  NotificationPayload,
  NotificationPref,
  Session,
} from '../../src/types/index';

export interface NotificationTypeMeta {
  type: NotificationType;
  labelFa: string;
  category: 'campaign' | 'session' | 'character' | 'lore';
  defaultEnabled: boolean;
  descriptionFa: string;
}

export const NOTIFICATION_TYPE_DEFINITIONS: Record<NotificationType, NotificationTypeMeta> = {
  invite_received: {
    type: 'invite_received',
    labelFa: 'دعوت به کمپین',
    category: 'campaign',
    defaultEnabled: true,
    descriptionFa: 'دریافت دعوت‌نامه جدید برای عضویت در کمپین',
  },
  campaign_joined: {
    type: 'campaign_joined',
    labelFa: 'عضو جدید کمپین',
    category: 'campaign',
    defaultEnabled: true,
    descriptionFa: 'پیوستن بازیکن یا دستیار دانجن‌مستر جدید به کمپین',
  },
  session_scheduled: {
    type: 'session_scheduled',
    labelFa: 'جلسه جدید زمان‌بندی شد',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'تعیین زمان برگزاری جلسه جدید بازی',
  },
  session_changed: {
    type: 'session_changed',
    labelFa: 'تغییر زمان یا مکان جلسه',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'ویرایش زمان، مکان یا پیوند جلسه بازی',
  },
  session_cancelled: {
    type: 'session_cancelled',
    labelFa: 'لغو جلسه بازی',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'لغو شدن یکی از جلسات برنامه‌ریزی شده',
  },
  rsvp_reminder: {
    type: 'rsvp_reminder',
    labelFa: 'یادآوری اعلام حضور در جلسه',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'یادآوری برای ثبت وضعیت حضور (RSVP) در جلسه آتی',
  },
  poll_opened: {
    type: 'poll_opened',
    labelFa: 'نظرسنجی تاریخ جلسه',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'آغاز نظرسنجی برای تعیین بهترین زمان برگزاری جلسه',
  },
  poll_closed: {
    type: 'poll_closed',
    labelFa: 'پایان نظرسنجی تاریخ جلسه',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'بسته شدن نظرسنجی زمان جلسه توسط دانجن‌مستر',
  },
  handout_revealed: {
    type: 'handout_revealed',
    labelFa: 'سند یا نقشه جدید',
    category: 'lore',
    defaultEnabled: true,
    descriptionFa: 'آشکارسازی سند، نامه یا نقشه جغرافیایی جدید برای شما یا گروه',
  },
  quest_updated: {
    type: 'quest_updated',
    labelFa: 'به‌روزرسانی مأموریت',
    category: 'campaign',
    defaultEnabled: true,
    descriptionFa: 'افزودن مأموریت جدید یا تغییر اهداف و وضعیت آن',
  },
  encounter_started: {
    type: 'encounter_started',
    labelFa: 'آغاز نبرد فعال',
    category: 'session',
    defaultEnabled: true,
    descriptionFa: 'شروع رویارویی و مبارزه زنده در بازی',
  },
  approval_decided: {
    type: 'approval_decided',
    labelFa: 'نتیجه تأیید شخصیت/ارتقا',
    category: 'character',
    defaultEnabled: true,
    descriptionFa: 'تأیید یا رد درخواست ساخت شخصیت یا افزایش سطح توسط دانجن‌مستر',
  },
  level_up_available: {
    type: 'level_up_available',
    labelFa: 'امکان ارتقای سطح',
    category: 'character',
    defaultEnabled: true,
    descriptionFa: 'کسب تجربه کافی و دسترسی به ارتقای سطح شخصیت',
  },
  backstory_comment: {
    type: 'backstory_comment',
    labelFa: 'یادداشت دانجن‌مستر بر پیشینه',
    category: 'character',
    defaultEnabled: true,
    descriptionFa: 'ثبت دیدگاه یا بازخورد دانجن‌مستر بر سرگذشت و پیشینه شخصیت',
  },
};

/**
 * Checks if a specific notification type is muted for a user.
 */
export function isNotificationTypeMuted(
  prefs: NotificationPref | null | undefined,
  type: NotificationType
): boolean {
  if (!prefs || !prefs.types) {
    return false;
  }
  // If explicitly set to false in prefs, it's muted
  if (prefs.types[type] === false) {
    return true;
  }
  return false;
}

/**
 * Sanitizes notification payload to ensure NO DM-only secrets or private notes are leaked to players.
 */
export function sanitizePayloadForPlayer(
  payload: NotificationPayload,
  isDm: boolean
): NotificationPayload {
  if (isDm) {
    return { ...payload };
  }

  const cleanPayload: NotificationPayload = {
    title: payload.title,
    body: payload.body,
    campaignId: payload.campaignId,
    campaignTitle: payload.campaignTitle,
    targetType: payload.targetType,
    targetId: payload.targetId,
    link: payload.link,
    actorName: payload.actorName,
  };

  if (payload.metadata) {
    const cleanMeta = { ...payload.metadata };
    delete cleanMeta.dmNotes;
    delete cleanMeta.secretNotes;
    delete cleanMeta.dmAdvice;
    delete cleanMeta.internalNotes;
    delete cleanMeta.secret;
    cleanPayload.metadata = cleanMeta;
  }

  return cleanPayload;
}

export interface GroupedNotifications {
  campaignId: string | null;
  campaignTitle: string;
  items: NotificationItem[];
  unreadCount: number;
}

/**
 * Groups notifications by campaign (with null/empty campaign grouped as Global/Account).
 */
export function groupNotificationsByCampaign(
  items: NotificationItem[],
  defaultGlobalTitle = 'اعلان‌های عمومی و حساب'
): GroupedNotifications[] {
  const groupsMap = new Map<string, GroupedNotifications>();

  // Ensure default global group is created if there are any global items
  for (const item of items) {
    const cid = item.campaignId || '__global__';
    const ctitle = cid === '__global__' ? defaultGlobalTitle : (item.campaignTitle || item.payload.campaignTitle || 'کمپین');

    let group = groupsMap.get(cid);
    if (!group) {
      group = {
        campaignId: cid === '__global__' ? null : cid,
        campaignTitle: ctitle,
        items: [],
        unreadCount: 0,
      };
      groupsMap.set(cid, group);
    }

    group.items.push(item);
    if (!item.readAt) {
      group.unreadCount += 1;
    }
  }

  // Sort groups: campaigns with unread first, then latest created item
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    const aLatest = a.items[0]?.createdAt || 0;
    const bLatest = b.items[0]?.createdAt || 0;
    return bLatest - aLatest;
  });
}

/**
 * Lazy session reminders:
 * Evaluates active upcoming sessions (scheduled within horizonHours, default 24h).
 * Generates an RSVP reminder notification if the user has not RSVP'd or is 'maybe',
 * and no reminder has already been created for this session within the window.
 */
export function computeLazySessionReminders(params: {
  userId: string;
  sessions: Session[];
  existingNotifications: NotificationItem[];
  nowMs?: number;
  horizonHours?: number;
}): NotificationItem[] {
  const { userId, sessions, existingNotifications, nowMs = Date.now(), horizonHours = 24 } = params;
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const newReminders: NotificationItem[] = [];

  for (const s of sessions) {
    if (s.status === 'cancelled' || s.status === 'done') {
      continue;
    }
    if (!s.scheduledAt) {
      continue;
    }

    const scheduledTime = new Date(s.scheduledAt).getTime();
    if (isNaN(scheduledTime)) {
      continue;
    }

    // Only look ahead between now and now + horizonMs
    const diff = scheduledTime - nowMs;
    if (diff <= 0 || diff > horizonMs) {
      continue;
    }

    // Check user's RSVP status
    const userRsvp = s.rsvps?.find((r) => r.userId === userId);
    const hasConfirmed = userRsvp && (userRsvp.status === 'yes' || userRsvp.status === 'no');

    if (hasConfirmed) {
      // User has already affirmatively confirmed or declined, no need to nag
      continue;
    }

    // Check if an rsvp_reminder for this session already exists for this user in the past 24 hours
    const alreadyReminded = existingNotifications.some((n) => {
      if (n.userId !== userId || n.type !== 'rsvp_reminder') return false;
      if (n.payload.targetId === s.id) return true;
      if (n.payload.metadata?.sessionId === s.id) return true;
      return false;
    });

    if (alreadyReminded) {
      continue;
    }

    // Format remaining hours
    const hoursLeft = Math.max(1, Math.round(diff / (60 * 60 * 1000)));

    const item: NotificationItem = {
      id: `remind_${s.id}_${userId}_${Math.floor(scheduledTime / (60 * 60 * 1000))}`,
      userId,
      campaignId: s.campaignId,
      type: 'rsvp_reminder',
      payload: {
        title: `یادآوری جلسه: ${s.title}`,
        body: `جلسه شماره ${s.number} حدود ${hoursLeft} ساعت دیگر آغاز می‌شود. لطفاً وضعیت حضور خود را مشخص فرمایید.`,
        campaignId: s.campaignId,
        targetType: 'session',
        targetId: s.id,
        link: `/campaign/${s.campaignId}/sessions?session=${s.id}`,
        metadata: {
          sessionId: s.id,
          sessionNumber: s.number,
          scheduledAt: s.scheduledAt,
        },
      },
      readAt: null,
      createdAt: nowMs,
      campaignTitle: undefined,
      isRead: false,
    };

    newReminders.push(item);
  }

  return newReminders;
}

/**
 * =========================================================================
 * DOCUMENTED EXTENSION POINT: Cloudflare Worker Cron Trigger
 * =========================================================================
 * While DungeonYar computes reminders lazily when users open the app or
 * invoke /live (no mandatory cron dependency), a standalone scheduled worker
 * can be deployed with wrangler.toml:
 *
 * [triggers]
 * crons = ["0 * * * *"] # Every hour
 *
 * In that worker, export default {
 *   async scheduled(event, env, ctx) {
 *     // 1. Query upcoming sessions within 24h:
 *     //    SELECT * FROM sessions WHERE status IN ('planned', 'confirmed') AND scheduled_at BETWEEN ...
 *     // 2. Query participants who have not RSVP'd.
 *     // 3. Invoke computeLazySessionReminders(...) or insert notifications into D1.
 *     // 4. Send Web Push using VAPID to subscribed push_subscriptions endpoints.
 *   }
 * }
 */
export function generateCronScheduledReminders(
  sessions: Session[],
  userList: { userId: string }[],
  existingNotifications: NotificationItem[],
  nowMs = Date.now()
): NotificationItem[] {
  const allGenerated: NotificationItem[] = [];
  for (const u of userList) {
    const reminders = computeLazySessionReminders({
      userId: u.userId,
      sessions,
      existingNotifications,
      nowMs,
    });
    allGenerated.push(...reminders);
  }
  return allGenerated;
}
