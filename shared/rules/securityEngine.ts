/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CampaignRole, StorageStats, TableStorageInfo, CleanupCounts, CleanupReport } from '../../src/types';

/**
 * Validates CSRF header and Origin for state-changing HTTP requests.
 */
export function validateCsrfAndOrigin(
  method: string,
  headers: Record<string, string | null | undefined>,
  hostUrl: string
): { valid: boolean; error?: string } {
  const upperMethod = method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod)) {
    return { valid: true };
  }

  // 1. Verify custom anti-CSRF header
  const xRequestedWith = headers['x-requested-with'] || headers['X-Requested-With'];
  if (!xRequestedWith || xRequestedWith.toLowerCase() !== 'zorvania') {
    return {
      valid: false,
      error: 'درخواست نامعتبر است (CSRF Header مفقود یا اشتباه است).'
    };
  }

  // 2. Verify Origin if provided by browser
  const origin = headers['origin'] || headers['Origin'];
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const expectedHost = new URL(hostUrl).host;
      if (originHost !== expectedHost) {
        return {
          valid: false,
          error: 'درخواست از مبدأ غیرمجاز رد گردید (Cross-Site Request Blocked).'
        };
      }
    } catch {
      return { valid: false, error: 'مبدأ ارسالی نامعتبر است.' };
    }
  }

  return { valid: true };
}

/**
 * Access control check for campaign entities.
 * - Non-members (role === null/undefined and not platform DM) -> 404 (hide existence)
 * - Inadequate role (e.g. player calling DM-only endpoint) -> 403
 */
export function evaluateCampaignAccess(
  memberRole: CampaignRole | null | undefined,
  isPlatformDm: boolean,
  requiredLevel: 'member' | 'dm' | 'owner'
): { allowed: boolean; status: 200 | 403 | 404; reason?: string } {
  const isMember = Boolean(memberRole);
  const isDm = isPlatformDm || memberRole === 'owner' || memberRole === 'co_dm';
  const isOwner = memberRole === 'owner';

  if (!isMember && !isPlatformDm) {
    return { allowed: false, status: 404, reason: 'کمپین یافت نشد یا شما عضو آن نیستید.' };
  }

  if (requiredLevel === 'owner' && !isOwner) {
    return { allowed: false, status: 403, reason: 'فقط مالک کمپین مجاز به انجام این عملیات است.' };
  }

  if (requiredLevel === 'dm' && !isDm) {
    return { allowed: false, status: 403, reason: 'فقط دانجن مستر یا مدیر کمپین مجاز به این عملیات است.' };
  }

  if (requiredLevel === 'member' && !isMember && !isPlatformDm) {
    return { allowed: false, status: 404, reason: 'عضو کمپین نیستید.' };
  }

  return { allowed: true, status: 200 };
}

/**
 * Cloning security rule:
 * Users may ONLY clone content from campaigns where they have DM/Owner privileges (or platform DM).
 * A caller who is only a player or non-member in the source campaign must NOT be able to clone (returns 404).
 */
export function canCloneFromCampaign(
  sourceCampaignRole: CampaignRole | null | undefined,
  isPlatformDm: boolean
): boolean {
  if (isPlatformDm) return true;
  return sourceCampaignRole === 'owner' || sourceCampaignRole === 'co_dm';
}

/**
 * Rate limit validation rule.
 */
export function isRateLimitExceeded(attemptCount: number, maxAllowed: number): boolean {
  return attemptCount >= maxAllowed;
}

/**
 * Input sanitization and length limiter for text fields.
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldLabel: string,
  min = 1,
  max = 500
): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value.trim() === '') {
    if (min > 0) return { valid: false, error: `${fieldLabel} نمی‌تواند خالی باشد.` };
    return { valid: true };
  }

  const length = value.trim().length;
  if (length < min) {
    return { valid: false, error: `${fieldLabel} باید حداقل ${min} نویسه باشد.` };
  }
  if (length > max) {
    return { valid: false, error: `${fieldLabel} نمی‌تواند بیش از ${max} نویسه باشد.` };
  }

  return { valid: true };
}

/**
 * Table storage estimation constants (average estimated row size in bytes).
 */
export const TABLE_ROW_ESTIMATES: Record<string, { avgBytes: number; labelFa: string }> = {
  users: { avgBytes: 350, labelFa: 'کاربران' },
  auth_sessions: { avgBytes: 250, labelFa: 'نشست‌های فعال' },
  campaigns: { avgBytes: 1200, labelFa: 'کمپین‌ها' },
  campaign_members: { avgBytes: 150, labelFa: 'اعضای کمپین‌ها' },
  characters: { avgBytes: 2500, labelFa: 'پرونده کاراکترها' },
  character_participations: { avgBytes: 3500, labelFa: 'برگه‌های بازی در کمپین' },
  character_history_events: { avgBytes: 600, labelFa: 'وقایع‌نگاری شخصیت‌ها' },
  notes: { avgBytes: 1000, labelFa: 'یادداشت‌ها' },
  encounters: { avgBytes: 4000, labelFa: 'مبارزات و رویارویی‌ها' },
  sessions: { avgBytes: 1500, labelFa: 'جلسات بازی' },
  session_recaps: { avgBytes: 3000, labelFa: 'خلاصه‌های داستان' },
  handouts: { avgBytes: 2000, labelFa: 'اسناد و نقشه‌ها' },
  map_pins: { avgBytes: 300, labelFa: 'نشانگرهای نقشه' },
  quests: { avgBytes: 2000, labelFa: 'مأموریت‌ها' },
  faction_reputation: { avgBytes: 500, labelFa: 'شهرت در جناح‌ها' },
  party_items: { avgBytes: 400, labelFa: 'اشیاء خزانه مشترک' },
  party_currency: { avgBytes: 300, labelFa: 'سکه و دارایی‌های خزانه' },
  treasury_log: { avgBytes: 350, labelFa: 'سوابق خزانه' },
  notifications: { avgBytes: 500, labelFa: 'اعلان‌ها' },
  audit_log: { avgBytes: 400, labelFa: 'گزارش‌های امنیتی و لاگ' },
  media: { avgBytes: 45000, labelFa: 'تصاویر و فایل‌های رسانه' }
};

/**
 * Calculates storage statistics for D1 instance.
 */
export function calculateStorageStats(
  rowCounts: Record<string, number>,
  mediaActualBytes = 0,
  thresholdBytes = 419430400 // 400 MB warning threshold
): StorageStats {
  const tables: TableStorageInfo[] = [];
  let totalBytes = 0;

  for (const [table, meta] of Object.entries(TABLE_ROW_ESTIMATES)) {
    const count = rowCounts[table] || 0;
    let estimatedBytes = 0;

    if (table === 'media' && mediaActualBytes > 0) {
      estimatedBytes = mediaActualBytes;
    } else {
      estimatedBytes = count * meta.avgBytes;
    }

    tables.push({
      table,
      labelFa: meta.labelFa,
      count,
      estimatedBytes
    });

    totalBytes += estimatedBytes;
  }

  const warningPercent = Math.min(100, Math.round((totalBytes / thresholdBytes) * 100));
  const isOverThreshold = totalBytes >= thresholdBytes;

  return {
    tables,
    totalBytes,
    thresholdBytes,
    isOverThreshold,
    warningPercent
  };
}

/**
 * Identifies counts of unreferenced or expired entities for orphan cleanup.
 */
export function computeOrphanCleanupReport(
  dryRunOrCounts: boolean | Partial<CleanupCounts>,
  mediaIdsOrDryRun?: string[] | boolean,
  referencedMediaIds?: Set<string>,
  expiredInvitesCount = 0,
  expiredSessionsCount = 0,
  oldLoginAttemptsCount = 0,
  oldPasswordResetsCount = 0
): CleanupReport {
  if (typeof dryRunOrCounts === 'object') {
    const counts: CleanupCounts = {
      orphanMedia: dryRunOrCounts.orphanMedia || 0,
      expiredInvites: dryRunOrCounts.expiredInvites || 0,
      expiredSessions: dryRunOrCounts.expiredSessions || 0,
      oldLoginAttempts: dryRunOrCounts.oldLoginAttempts || 0,
      oldPasswordResets: dryRunOrCounts.oldPasswordResets || 0
    };
    const dryRun = mediaIdsOrDryRun !== false;
    const cleanedTotal =
      counts.orphanMedia +
      counts.expiredInvites +
      counts.expiredSessions +
      counts.oldLoginAttempts +
      counts.oldPasswordResets;

    return {
      dryRun,
      counts,
      executedAt: Date.now(),
      cleanedTotal
    };
  }

  const dryRun = Boolean(dryRunOrCounts);
  const mediaIds = Array.isArray(mediaIdsOrDryRun) ? mediaIdsOrDryRun : [];
  const refIds = referencedMediaIds || new Set<string>();

  let orphanMediaCount = 0;
  for (const id of mediaIds) {
    if (!refIds.has(id)) {
      orphanMediaCount++;
    }
  }

  const counts: CleanupCounts = {
    orphanMedia: orphanMediaCount,
    expiredInvites: expiredInvitesCount,
    expiredSessions: expiredSessionsCount,
    oldLoginAttempts: oldLoginAttemptsCount,
    oldPasswordResets: oldPasswordResetsCount
  };

  const cleanedTotal =
    counts.orphanMedia +
    counts.expiredInvites +
    counts.expiredSessions +
    counts.oldLoginAttempts +
    counts.oldPasswordResets;

  return {
    dryRun,
    counts,
    executedAt: Date.now(),
    cleanedTotal
  };
}
