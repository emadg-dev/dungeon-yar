/**
 * Pure business logic and domain helpers for Step 5.1:
 * Player Home, Campaign Partitioning, Next-Session Countdown,
 * Character History Timeline Grouping, Stats Aggregation, and Legacy Join.
 */

import {
  CharacterHistoryEvent,
  CharacterParticipation,
  MasterCharacter,
  Campaign,
  CampaignMember
} from '../../src/types';

export interface CharacterAggregateStats {
  campaignsCount: number;
  sessionsAttended: number;
  highestLevel: number;
  activeParticipationsCount: number;
  retiredParticipationsCount: number;
}

export interface GroupedHistoryCampaign {
  campaignId: string | null;
  campaignName: string;
  isGeneral: boolean;
  events: CharacterHistoryEvent[];
  eventsCount: number;
  joinedAt?: number;
  latestEventAt?: number;
}

export interface PartitionedCampaigns {
  current: Campaign[];
  past: Campaign[];
}

export interface CountdownResult {
  text: string;
  isImminent: boolean; // within 24 hours
  isPast: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
}

export function toPersianDigits(n: number | string): string {
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, d => pDigits[parseInt(d, 10)]);
}

export interface LegacyJoinValidation {
  valid: boolean;
  error?: string;
  initialLevel: number;
  requiresApproval: boolean;
}

/**
 * Filters character history events based on the viewer's role and campaign.
 * Rule: Character owner sees their full cross-campaign timeline.
 * A DM sees ONLY history belonging to THEIR campaign(s).
 */
export function filterHistoryForViewer(
  events: CharacterHistoryEvent[],
  viewerUserId: string,
  characterOwnerId: string,
  viewerDmCampaignIds: string[] = [],
  filterCampaignId?: string
): CharacterHistoryEvent[] {
  if (!Array.isArray(events)) return [];

  // Character owner sees full cross-campaign timeline
  if (viewerUserId === characterOwnerId) {
    if (filterCampaignId) {
      return events.filter(e => e.campaignId === filterCampaignId);
    }
    return events;
  }

  // If viewer is not owner, they must be a DM of relevant campaigns
  // They can ONLY see events from campaigns where they have DM rights
  const allowedCampaignSet = new Set(
    filterCampaignId
      ? viewerDmCampaignIds.filter(id => id === filterCampaignId)
      : viewerDmCampaignIds
  );

  return events.filter(e => e.campaignId && allowedCampaignSet.has(e.campaignId));
}

/**
 * Groups character history events by campaign.
 * Pre-campaign / general deeds (where campaignId is null or empty) are grouped under "رویدادهای عمومی و شخصی".
 */
export function groupHistoryByCampaign(
  events: CharacterHistoryEvent[],
  campaignNamesMap: Record<string, string> = {}
): GroupedHistoryCampaign[] {
  if (!Array.isArray(events) || events.length === 0) return [];

  const groups: Record<string, CharacterHistoryEvent[]> = {};
  const order: string[] = [];

  for (const ev of events) {
    const key = ev.campaignId || '__general__';
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(ev);
  }

  return order.map(key => {
    const evList = groups[key].sort((a, b) => b.timestamp - a.timestamp);
    const isGeneral = key === '__general__';
    const campaignId = isGeneral ? null : key;
    const campaignName = isGeneral
      ? 'رویدادهای عمومی و شخصی'
      : (campaignNamesMap[key] || evList[0]?.campaignName || `کمپین ${key}`);

    const joinedEv = evList.find(e => e.eventType === 'joined');

    return {
      campaignId,
      campaignName,
      isGeneral,
      events: evList,
      eventsCount: evList.length,
      joinedAt: joinedEv?.timestamp,
      latestEventAt: evList[0]?.timestamp
    };
  });
}

/**
 * Computes simple aggregate stats for a master character:
 * - Total campaigns participated in
 * - Total sessions attended across all participations & events
 * - Highest level achieved across all campaigns
 */
export function computeCharacterStats(
  participations: CharacterParticipation[] = [],
  history: CharacterHistoryEvent[] = []
): CharacterAggregateStats {
  const safeParts = Array.isArray(participations) ? participations : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const campaignsSet = new Set<string>();
  let maxLevel = 1;
  let partSessionsAttended = 0;
  let activeCount = 0;
  let retiredCount = 0;

  for (const p of safeParts) {
    if (p.campaignId) campaignsSet.add(p.campaignId);
    if (typeof p.level === 'number' && p.level > maxLevel) {
      maxLevel = p.level;
    }
    if (typeof p.sessionsAttended === 'number') {
      partSessionsAttended += p.sessionsAttended;
    }
    if (p.status === 'active') activeCount++;
    if (p.status === 'retired') retiredCount++;
  }

  // Count attendance history events if participations don't have sessionsAttended sum
  const attendanceEventsCount = safeHistory.filter(h =>
    h.eventType === 'session_attendance' ||
    (h.eventType === 'major_deed' && (h.payload?.title || '').includes('حضور در جلسه'))
  ).length;

  const sessionsAttended = Math.max(partSessionsAttended, attendanceEventsCount);

  // Check history events for level_up if higher
  for (const h of safeHistory) {
    if (h.eventType === 'level_up' && typeof h.payload?.newLevel === 'number') {
      if (h.payload.newLevel > maxLevel) maxLevel = h.payload.newLevel;
    }
    if (h.campaignId) campaignsSet.add(h.campaignId);
  }

  return {
    campaignsCount: campaignsSet.size,
    sessionsAttended,
    highestLevel: maxLevel,
    activeParticipationsCount: activeCount,
    retiredParticipationsCount: retiredCount
  };
}

/**
 * Partitions campaigns into current (active/paused/draft) vs past (archived or user left/removed).
 */
export function partitionCampaigns(
  campaigns: Campaign[] = []
): PartitionedCampaigns {
  const current: Campaign[] = [];
  const past: Campaign[] = [];

  for (const c of campaigns) {
    const isArchived = c.status === 'archived';
    const isMemberLeft = c.membershipStatus === 'left' || c.membershipStatus === 'removed';

    if (isArchived || isMemberLeft) {
      past.push({
        ...c,
        isReadOnly: true
      });
    } else {
      current.push(c);
    }
  }

  return { current, past };
}

/**
 * Calculates a friendly countdown string and metadata for an upcoming scheduled session.
 */
export function calculateCountdown(
  scheduledAt: string | null | undefined,
  now = Date.now()
): CountdownResult | null {
  if (!scheduledAt) return null;

  const target = new Date(scheduledAt).getTime();
  if (isNaN(target)) return null;

  const diffMs = target - now;

  if (diffMs <= 0) {
    return {
      text: 'هم‌اکنون یا برگزار شده',
      isImminent: true,
      isPast: true,
      totalMs: diffMs,
      days: 0,
      hours: 0,
      minutes: 0
    };
  }

  const minutesTotal = Math.floor(diffMs / (1000 * 60));
  const hoursTotal = Math.floor(minutesTotal / 60);
  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;
  const minutes = minutesTotal % 60;

  const isImminent = diffMs <= 24 * 60 * 60 * 1000;

  const pDays = toPersianDigits(days);
  const pHours = toPersianDigits(hours);
  const pMinutes = toPersianDigits(minutes);

  let text = '';
  if (days > 0) {
    text = `${pDays} روز و ${pHours} ساعت مانده`;
  } else if (hours > 0) {
    text = `${pHours} ساعت و ${pMinutes} دقیقه مانده`;
  } else {
    text = `${pMinutes} دقیقه مانده (به‌زودی!)`;
  }

  return {
    text,
    isImminent,
    isPast: false,
    totalMs: diffMs,
    days,
    hours,
    minutes
  };
}

/**
 * Validates whether a character can perform a "Legacy Join" into a target campaign.
 * Rules:
 * - Character must have at least one past or retired participation, or character status !== 'dead'.
 * - Cannot already have an 'active' or 'pending_approval' participation in the target campaign.
 * - Target campaign must not be archived.
 * - Campaign entry rules (startingLevel, maxEntryLevel, approval requirements) apply.
 */
export function validateLegacyJoin(
  character: MasterCharacter,
  targetCampaign: Campaign,
  existingParticipations: CharacterParticipation[] = []
): LegacyJoinValidation {
  if (!character || !targetCampaign) {
    return { valid: false, error: 'اطلاعات شخصیت یا کمپین نامعتبر است.', initialLevel: 1, requiresApproval: false };
  }

  if (character.status === 'dead') {
    return { valid: false, error: 'شخصیت درگذشته امکان پیوستن به کمپین جدید را ندارد.', initialLevel: 1, requiresApproval: false };
  }

  if (targetCampaign.status === 'archived') {
    return { valid: false, error: 'امکان پیوستن به کمپین بایگانی‌شده وجود ندارد.', initialLevel: 1, requiresApproval: false };
  }

  // Check if character already has active or pending participation in target campaign
  const inTarget = existingParticipations.filter(p => p.campaignId === targetCampaign.id);
  const activeInTarget = inTarget.find(p => p.status === 'active' || p.status === 'pending_approval');
  if (activeInTarget) {
    return {
      valid: false,
      error: 'این شخصیت در حال حاضر در این کمپین حضور فعال دارد.',
      initialLevel: activeInTarget.level || 1,
      requiresApproval: false
    };
  }

  // Calculate entry level:
  // Campaign startingLevel default or clamped by maxEntryLevel
  const settings = targetCampaign.settings || {};
  const startingLevel = settings.startingLevel || 1;
  const maxEntryLevel = settings.maxEntryLevel || 20;

  // For a legacy join, find highest past level
  let prevHighestLevel = 1;
  for (const p of existingParticipations) {
    if (typeof p.level === 'number' && p.level > prevHighestLevel) {
      prevHighestLevel = p.level;
    }
  }

  // Clamped by campaign rules:
  // Level cannot exceed campaign maxEntryLevel, and cannot be lower than campaign startingLevel
  const initialLevel = Math.max(startingLevel, Math.min(prevHighestLevel, maxEntryLevel));

  const requiresApproval = Boolean(settings.approval?.onCreate);

  return {
    valid: true,
    initialLevel,
    requiresApproval
  };
}
