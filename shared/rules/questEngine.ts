/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quest, QuestObjective, QuestStatus, CampaignRole } from '../../src/types';

/**
 * Checks if the user has DM permissions for quests.
 */
export function canUserManageQuests(userRole?: boolean | CampaignRole | 'dm' | null): boolean {
  if (typeof userRole === 'boolean') return userRole;
  return userRole === 'owner' || userRole === 'co_dm' || userRole === 'dm';
}

/**
 * Checks if a user is allowed to toggle an objective's done state.
 * DMs can always toggle. Players can only toggle if the campaign setting allows it.
 */
export function canUserToggleObjective(
  userRole?: boolean | CampaignRole | 'dm' | null,
  allowPlayerTick?: boolean
): boolean {
  if (typeof userRole === 'boolean') {
    if (userRole) return true;
    return Boolean(allowPlayerTick);
  }
  if (canUserManageQuests(userRole)) return true;
  if (userRole === 'player' && allowPlayerTick) return true;
  return false;
}

/**
 * Filters and sanitizes a quest for a viewer.
 * - DM/Owner/Co-DM sees everything (including hidden quests, all objectives, and dm_notes).
 * - Players/Spectators:
 *   - Hidden quests are completely excluded (returns null).
 *   - If the quest has specific participants and the player is not one of them, excluded (returns null).
 *   - dmNotes is stripped.
 *   - Non-visible objectives (visible === false) are stripped.
 */
export function filterQuestForViewer(
  quest: Quest,
  userRole?: boolean | CampaignRole | 'dm' | null,
  userParticipationId?: string | null
): Quest | null {
  const isDm = canUserManageQuests(userRole);

  if (isDm) {
    return { ...quest };
  }

  // Hidden quests are never visible to players or spectators
  if (quest.status === 'hidden') {
    return null;
  }

  // Selective participant check
  if (quest.participantIds && quest.participantIds.length > 0) {
    if (!userParticipationId || !quest.participantIds.includes(userParticipationId)) {
      return null;
    }
  }

  // Sanitize for player/spectator
  const visibleObjectives = (quest.objectives || []).filter(obj => obj.visible !== false);

  return {
    ...quest,
    dmNotes: undefined,
    objectives: visibleObjectives
  };
}

/**
 * Filters an array of quests for a viewer, stripping hidden items and fields.
 */
export function filterQuestsForViewer(
  quests: Quest[],
  userRole?: boolean | CampaignRole | 'dm' | null,
  userParticipationId?: string | null
): Quest[] {
  return quests
    .map(q => filterQuestForViewer(q, userRole, userParticipationId))
    .filter((q): q is Quest => q !== null);
}

/**
 * Calculates progress for a quest or set of objectives.
 */
export function calculateQuestProgress(target: Quest | QuestObjective[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const objectives = Array.isArray(target) ? target : (target?.objectives || []);
  if (!objectives || objectives.length === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const total = objectives.length;
  const completed = objectives.filter(o => o.done).length;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, percentage };
}

/**
 * Partitions quests into status buckets for the UI.
 */
export function partitionQuestsByStatus(quests: Quest[]): {
  active: Quest[];
  completed: Quest[];
  failed: Quest[];
  hidden: Quest[];
  abandoned: Quest[];
} {
  const active: Quest[] = [];
  const completed: Quest[] = [];
  const failed: Quest[] = [];
  const hidden: Quest[] = [];
  const abandoned: Quest[] = [];

  for (const q of quests) {
    switch (q.status) {
      case 'active':
        active.push(q);
        break;
      case 'completed':
        completed.push(q);
        break;
      case 'failed':
        failed.push(q);
        break;
      case 'hidden':
        hidden.push(q);
        break;
      case 'abandoned':
        abandoned.push(q);
        break;
      default:
        active.push(q);
        break;
    }
  }

  return { active, completed, failed, hidden, abandoned };
}

/**
 * Validates quest creation/update payload.
 */
export function validateQuestPayload(data: Partial<Quest>): { valid: boolean; errors: string[]; error?: string } {
  const errors: string[] = [];

  if (!data.title || !data.title.trim()) {
    errors.push('عنوان مأموریت الزامی است.');
  }

  const validStatuses: QuestStatus[] = ['hidden', 'active', 'completed', 'failed', 'abandoned'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('وضعیت مأموریت نامعتبر است.');
  }

  if (data.objectives && Array.isArray(data.objectives)) {
    for (let i = 0; i < data.objectives.length; i++) {
      const obj = data.objectives[i];
      if (!obj.text || !obj.text.trim()) {
        errors.push(`متن هدف شماره ${i + 1} نمی‌تواند خالی باشد.`);
      }
    }
  }

  return { valid: errors.length === 0, errors, error: errors[0] };
}

/**
 * Searches quests across title, description, objectives text, giver name, and location name.
 */
export function searchQuests(quests: Quest[], query: string): Quest[] {
  if (!query || !query.trim()) return quests;
  const q = query.trim().toLowerCase();

  return quests.filter(quest => {
    if (quest.title.toLowerCase().includes(q)) return true;
    if (quest.description && quest.description.toLowerCase().includes(q)) return true;
    if (quest.giverNpcName && quest.giverNpcName.toLowerCase().includes(q)) return true;
    if (quest.locationName && quest.locationName.toLowerCase().includes(q)) return true;
    if (quest.locationRegion && quest.locationRegion.toLowerCase().includes(q)) return true;
    if (quest.objectives && quest.objectives.some(obj => obj.text.toLowerCase().includes(q))) return true;
    return false;
  });
}
