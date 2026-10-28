/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionRecap, SessionHighlight, CampaignRole, CharacterHistoryEvent } from '../../src/types';

/**
 * Filters a session recap based on viewer role and ownership.
 * DM/Owner/Co-DM or the recap author sees drafts and dm_only recaps.
 * Players and spectators only see published recaps with 'party' visibility.
 */
export function filterRecapForViewer(
  recap: SessionRecap,
  isDm: boolean,
  currentUserId?: string
): SessionRecap | null {
  if (isDm) return recap;
  if (currentUserId && recap.authorId === currentUserId) return recap;

  if (recap.visibility === 'dm_only' || recap.status === 'draft') {
    return null;
  }
  return recap;
}

/**
 * Filters an array of recaps for viewer.
 */
export function filterRecapsForViewer(
  recaps: SessionRecap[],
  isDm: boolean,
  currentUserId?: string
): SessionRecap[] {
  return recaps
    .map(r => filterRecapForViewer(r, isDm, currentUserId))
    .filter((r): r is SessionRecap => r !== null);
}

/**
 * Filters session highlights for player vs DM visibility.
 */
export function filterHighlightForViewer(
  highlight: SessionHighlight,
  isDm: boolean
): SessionHighlight | null {
  if (isDm) return highlight;
  const isVisible = highlight.visibleToPlayer !== false && highlight.visibleToPlayer !== 0;
  return isVisible ? highlight : null;
}

/**
 * Determines whether a user can author a recap.
 */
export function canUserCreateRecap(
  role?: CampaignRole | 'dm' | null,
  allowPlayerRecaps: boolean = false
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'co_dm' || role === 'dm') return true;
  if (role === 'player') return Boolean(allowPlayerRecaps);
  return false;
}

/**
 * Determines whether a user can edit/delete a specific recap.
 */
export function canUserEditRecap(
  recap: SessionRecap,
  role?: CampaignRole | 'dm' | null,
  currentUserId?: string
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'co_dm' || role === 'dm') return true;
  if (currentUserId && recap.authorId === currentUserId) return true;
  return false;
}

/**
 * Validates recap payload.
 */
export function validateRecapPayload(payload: { title?: string; body?: string }): {
  valid: boolean;
  error?: string;
} {
  if (!payload.title || !payload.title.trim()) {
    return { valid: false, error: 'عنوان خلاصه جلسه نمی‌تواند خالی باشد.' };
  }
  if (!payload.body || !payload.body.trim()) {
    return { valid: false, error: 'متن خلاصه جلسه نمی‌تواند خالی باشد.' };
  }
  return { valid: true };
}

/**
 * Search recaps by query (title, body, author, session number).
 */
export function searchRecaps(recaps: SessionRecap[], query: string): SessionRecap[] {
  const q = query.trim().toLowerCase();
  if (!q) return recaps;

  return recaps.filter(r => {
    if (r.title.toLowerCase().includes(q)) return true;
    if (r.body.toLowerCase().includes(q)) return true;
    if (r.authorName && r.authorName.toLowerCase().includes(q)) return true;
    if (r.sessionTitle && r.sessionTitle.toLowerCase().includes(q)) return true;
    if (r.sessionNumber !== undefined) {
      const sessionLabel = `جلسه ${r.sessionNumber}`;
      if (sessionLabel.toLowerCase().includes(q) || String(r.sessionNumber).includes(q)) return true;
    }
    return false;
  });
}

/**
 * Generates a milestone character history event from a session highlight.
 */
export function buildHighlightHistoryEvent(
  highlight: SessionHighlight,
  sessionNumber?: number
): Omit<CharacterHistoryEvent, 'id'> {
  const sessionPart = sessionNumber !== undefined ? ` در جلسه ${sessionNumber}` : '';
  return {
    characterId: highlight.characterId || '',
    title: `رویداد برجسته${sessionPart}`,
    description: highlight.text,
    eventType: 'milestone',
    timestamp: highlight.createdAt || Date.now(),
    sessionNumber: sessionNumber,
    metadata: {
      sessionId: highlight.sessionId,
      highlightId: highlight.id
    }
  };
}

/**
 * Formats a clean excerpt of a recap body for cards and previews.
 */
export function formatRecapExcerpt(body: string, maxLength: number = 180): string {
  if (!body) return '';
  // Strip simple markdown headers / bold / italic markers
  const plain = body
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + '…';
}
