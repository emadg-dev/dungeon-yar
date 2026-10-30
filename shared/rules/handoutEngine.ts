/**
 * Pure rules and validation engine for Handouts and Interactive Maps (Step 4.3).
 */

import { Handout, HandoutKind, HandoutVisibility, MapPin } from '../../src/types';

export const MAX_HANDOUT_MEDIA_BYTES = 400 * 1024; // 400 KB cap per handout/map image
export const DEFAULT_CAMPAIGN_MEDIA_QUOTA_BYTES = 20 * 1024 * 1024; // 20 MB per campaign

export interface HandoutValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a handout payload before creating or updating.
 */
export function validateHandoutPayload(data: {
  title?: string;
  kind?: string;
  body?: string;
  mediaId?: string | null;
  visibility?: string;
  recipients?: string[];
}): HandoutValidationResult {
  const title = (data.title || '').trim();
  if (!title) {
    return { valid: false, error: 'عنوان سند یا نقشه نمی‌تواند خالی باشد.' };
  }
  if (title.length > 100) {
    return { valid: false, error: 'عنوان سند نمی‌تواند بیش از ۱۰۰ نویسه باشد.' };
  }

  const kind = data.kind as HandoutKind;
  if (!kind || !['text', 'image', 'map'].includes(kind)) {
    return { valid: false, error: 'نوع سند نامعتبر است (باید متن، تصویر یا نقشه باشد).' };
  }

  if (kind === 'text') {
    const body = (data.body || '').trim();
    if (!body) {
      return { valid: false, error: 'متن سند متنی نمی‌تواند خالی باشد.' };
    }
  }

  if (data.visibility && !['hidden', 'revealed', 'selected'].includes(data.visibility)) {
    return { valid: false, error: 'وضعیت نمایش نامعتبر است.' };
  }

  if (data.visibility === 'selected') {
    if (!data.recipients || data.recipients.length === 0) {
      return { valid: false, error: 'برای نمایش اختصاصی، باید حداقل یک ماجراجو انتخاب شود.' };
    }
  }

  return { valid: true };
}

/**
 * Checks if a media file exceeds the 400KB cap.
 */
export function checkMediaSize(
  sizeBytes: number,
  maxBytes: number = MAX_HANDOUT_MEDIA_BYTES
): { valid: boolean; error?: string } {
  if (sizeBytes <= 0) {
    return { valid: false, error: 'حجم فایل معتبر نیست.' };
  }
  if (sizeBytes > maxBytes) {
    const maxKb = Math.round(maxBytes / 1024);
    const actualKb = Math.round(sizeBytes / 1024);
    return {
      valid: false,
      error: `حجم تصویر (${actualKb} کیلوبایت) بیش از سقف مجاز (${maxKb} کیلوبایت) است. لطفاً تصویر را فشرده کنید.`
    };
  }
  return { valid: true };
}

/**
 * Validates total campaign media quota against the 20MB limit.
 */
export function checkCampaignQuota(
  currentUsageBytes: number,
  newFileBytes: number,
  quotaBytes: number = DEFAULT_CAMPAIGN_MEDIA_QUOTA_BYTES
): { valid: boolean; remainingBytes: number; error?: string } {
  const projected = currentUsageBytes + newFileBytes;
  const remaining = Math.max(0, quotaBytes - currentUsageBytes);

  if (projected > quotaBytes) {
    const quotaMb = Math.round(quotaBytes / (1024 * 1024));
    return {
      valid: false,
      remainingBytes: remaining,
      error: `سهمیه ذخیره‌سازی رسانه‌های کمپین (${quotaMb} مگابایت) تکمیل شده است.`
    };
  }

  return {
    valid: true,
    remainingBytes: quotaBytes - projected
  };
}

/**
 * Filters a list of map pins based on user role (players only see revealed pins).
 */
export function filterPinsForPlayer(pins: MapPin[] = [], isDm: boolean = false): MapPin[] {
  if (isDm) return pins;
  return pins.filter(p => Boolean(p.revealed === 1 || p.revealed === true));
}

/**
 * Authorizes and filters handouts for players.
 * Players only see:
 * 1) 'revealed' handouts
 * 2) 'selected' handouts where their character's participation ID is in recipients
 * Players NEVER receive 'hidden' handouts or secret unrevealed pins on maps.
 */
export function filterHandoutsForPlayer(
  handouts: Handout[],
  participationId?: string | null,
  isDm: boolean = false
): Handout[] {
  if (isDm) return handouts;

  const filtered: Handout[] = [];

  for (const h of handouts) {
    if (h.visibility === 'revealed') {
      filtered.push({
        ...h,
        pins: filterPinsForPlayer(h.pins, false)
      });
    } else if (h.visibility === 'selected') {
      if (participationId && h.recipients && h.recipients.includes(participationId)) {
        filtered.push({
          ...h,
          pins: filterPinsForPlayer(h.pins, false)
        });
      }
    }
  }

  return filtered;
}

/**
 * Checks whether a handout is new for the user based on seen IDs or last seen timestamp.
 */
export function isHandoutNew(
  handout: Handout,
  seenIds: string[] | Set<string> = [],
  lastSeenTimestamp?: number
): boolean {
  if (handout.visibility === 'hidden') return false;

  const seenSet = seenIds instanceof Set ? seenIds : new Set(seenIds);
  if (seenSet.has(handout.id)) return false;

  if (lastSeenTimestamp && handout.revealedAt) {
    return handout.revealedAt > lastSeenTimestamp;
  }

  // If not in seen set and revealed within last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return (handout.revealedAt || handout.createdAt) > sevenDaysAgo;
}

export function isNewHandout(revealedAt?: number | null, thresholdMs: number = 24 * 60 * 60 * 1000): boolean {
  if (!revealedAt) return false;
  return Date.now() - revealedAt < thresholdMs;
}

/**
 * Clamps coordinates to 0..100 percentage.
 */
export function clampCoordinates(x: number, y: number): { x: number; y: number } {
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val * 100) / 100));
  return {
    x: clamp(x),
    y: clamp(y)
  };
}

/**
 * Sorts handouts by sortIndex ascending, then by updated/created descending.
 */
export function sortHandouts(handouts: Handout[]): Handout[] {
  return [...handouts].sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) {
      return a.sortIndex - b.sortIndex;
    }
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });
}
