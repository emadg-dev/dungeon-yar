/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FactionReputation, FactionReputationThreshold, ReputationLog, CampaignRole } from '../../src/types';

/**
 * Standard Persian reputation thresholds default scale (-100 to 100).
 */
export const DEFAULT_REPUTATION_THRESHOLDS: FactionReputationThreshold[] = [
  { threshold: -50, label: 'دشمن خونی' },
  { threshold: -10, label: 'خصمانه' },
  { threshold: 0, label: 'بی‌طرف' },
  { threshold: 20, label: 'دوستانه' },
  { threshold: 60, label: 'متحد' },
];

/**
 * Checks if the user has DM permissions for managing faction reputations.
 */
export function canUserManageReputation(userRole?: boolean | CampaignRole | 'dm' | null): boolean {
  if (typeof userRole === 'boolean') return userRole;
  return userRole === 'owner' || userRole === 'co_dm' || userRole === 'dm';
}

/**
 * Computes the Persian label corresponding to the given reputation value.
 * Looks up thresholds in ascending order and picks the highest matching threshold.
 */
export function getReputationLabel(
  value: number,
  labels: FactionReputationThreshold[] = DEFAULT_REPUTATION_THRESHOLDS
): string {
  if (!labels || labels.length === 0) return 'بی‌طرف';

  // Sort ascending by threshold
  const sorted = [...labels].sort((a, b) => a.threshold - b.threshold);

  let currentLabel = sorted[0].label;
  for (const item of sorted) {
    if (value >= item.threshold) {
      currentLabel = item.label;
    }
  }
  return currentLabel;
}

/**
 * Clamps a reputation value within its min and max bounds.
 */
export function clampReputationValue(value: number, min = -100, max = 100): number {
  if (min > max) [min, max] = [max, min];
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculates percentage progress along the scale [min, max].
 * Returns a value between 0 and 100.
 */
export function calculateReputationPercentage(value: number, min = -100, max = 100): number {
  if (min >= max) return 50;
  const clamped = clampReputationValue(value, min, max);
  const range = max - min;
  return Math.round(((clamped - min) / range) * 100);
}

/**
 * Applies a delta adjustment to a faction reputation record.
 * Generates an updated reputation record and an audit log entry.
 */
export function applyReputationDelta(
  current: FactionReputation,
  delta: number,
  reason: string,
  createdBy: string,
  sessionId?: string | null
): {
  updated: FactionReputation;
  log: ReputationLog;
  actualDelta: number;
} {
  const newValue = clampReputationValue(current.value + delta, current.min, current.max);
  const actualDelta = newValue - current.value;
  const now = Date.now();

  const updated: FactionReputation = {
    ...current,
    value: newValue,
    currentLabel: getReputationLabel(newValue, current.labels),
    updatedAt: now,
  };

  const log: ReputationLog = {
    id: `replog-${now}-${Math.random().toString(36).substring(2, 7)}`,
    reputationId: current.id,
    delta: actualDelta,
    reason: reason.trim() || 'تغییر شهرت',
    sessionId: sessionId || null,
    createdBy,
    createdAt: now,
  };

  return { updated, log, actualDelta };
}

/**
 * Filters a single faction reputation record based on user role and participation.
 * - DM sees all records.
 * - Players only see visible records (visible === true).
 * - Per-character tracks are visible to the character's owner, or party-wide if participationId is null/empty.
 * Returns null if the user does not have permission to view.
 */
export function filterReputationForViewer(
  rep: FactionReputation,
  userRole?: boolean | CampaignRole | 'dm' | null,
  userParticipationId?: string | null
): FactionReputation | null {
  const isDm = canUserManageReputation(userRole);
  if (isDm) {
    return {
      ...rep,
      currentLabel: getReputationLabel(rep.value, rep.labels),
    };
  }

  // Hidden reputation is never in a player's response
  if (!rep.visible) {
    return null;
  }

  // If track is specific to a character participation, player must match
  if (rep.participationId && rep.participationId !== userParticipationId) {
    return null;
  }

  return {
    ...rep,
    currentLabel: getReputationLabel(rep.value, rep.labels),
  };
}

/**
 * Filters an array of reputation records for a viewer.
 */
export function filterReputationsForViewer(
  reputations: FactionReputation[],
  userRole?: boolean | CampaignRole | 'dm' | null,
  userParticipationId?: string | null
): FactionReputation[] {
  return reputations
    .map(r => filterReputationForViewer(r, userRole, userParticipationId))
    .filter((r): r is FactionReputation => r !== null);
}
