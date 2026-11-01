/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OfflineEditField =
  | 'currentHp'
  | 'tempHp'
  | 'notes'
  | 'inventory'
  | 'customResources';

export interface OfflineEditItem {
  id: string;
  campaignId: string;
  participationId: string;
  characterId: string;
  field: OfflineEditField;
  baseRevision: number;
  value: any;
  timestamp: number;
}

export interface ConflictDetails {
  id: string;
  editId: string;
  campaignId: string;
  participationId: string;
  field: OfflineEditField;
  fieldLabelFa: string;
  clientValue: any;
  serverValue: any;
  baseRevision: number;
  serverRevision: number;
  timestamp: number;
  resolved: boolean;
  resolution?: 'client' | 'server';
}

export type SyncStatus = 'idle' | 'saved' | 'saving' | 'offline' | 'conflict';

/**
 * Persian human-readable labels for gameplay fields
 */
export function getFieldLabelFa(field: OfflineEditField): string {
  switch (field) {
    case 'currentHp':
      return 'جان فعلی (HP)';
    case 'tempHp':
      return 'جان موقت (Temp HP)';
    case 'notes':
      return 'یادداشت‌های کاراکتر';
    case 'inventory':
      return 'کوله‌پشتی و تجهیزات';
    case 'customResources':
      return 'منابع و قابلیت‌های مصرفی';
    default:
      return 'اطلاعات کاراکتر';
  }
}

/**
 * Coalesces an edit into the queue.
 * If an edit for the exact same participationId and field already exists in the queue,
 * update it with the latest value and timestamp while preserving the original baseRevision.
 */
export function enqueueEdit(queue: OfflineEditItem[], edit: OfflineEditItem): OfflineEditItem[] {
  const existingIndex = queue.findIndex(
    item => item.participationId === edit.participationId && item.field === edit.field
  );

  if (existingIndex >= 0) {
    const existing = queue[existingIndex];
    const updated: OfflineEditItem = {
      ...existing,
      value: edit.value,
      timestamp: edit.timestamp,
      // Keep original baseRevision so conflict detection checks from original server baseline
      baseRevision: existing.baseRevision,
    };
    const nextQueue = [...queue];
    nextQueue[existingIndex] = updated;
    return nextQueue;
  }

  return [...queue, edit];
}

/**
 * Removes completed edits from the queue.
 */
export function pruneQueue(queue: OfflineEditItem[], syncedIds: string[]): OfflineEditItem[] {
  const set = new Set(syncedIds);
  return queue.filter(item => !set.has(item.id));
}

/**
 * Detects whether a server state conflicts with a pending client edit.
 * A conflict occurs if the server revision is newer than the client's base revision
 * AND the server's current value differs from the client's edit value.
 */
export function detectConflict(
  edit: OfflineEditItem,
  serverEntity: { revision?: number; [key: string]: any }
): ConflictDetails | null {
  const serverRev = Number(serverEntity.revision) || 1;
  const baseRev = Number(edit.baseRevision) || 1;

  // Server is ahead of base revision
  if (serverRev > baseRev) {
    const serverVal = serverEntity[edit.field];
    const clientVal = edit.value;

    const areValuesEqual = JSON.stringify(serverVal) === JSON.stringify(clientVal);
    if (!areValuesEqual) {
      return {
        id: `conflict-${edit.id}-${Date.now()}`,
        editId: edit.id,
        campaignId: edit.campaignId,
        participationId: edit.participationId,
        field: edit.field,
        fieldLabelFa: getFieldLabelFa(edit.field),
        clientValue: clientVal,
        serverValue: serverVal,
        baseRevision: baseRev,
        serverRevision: serverRev,
        timestamp: Date.now(),
        resolved: false,
      };
    }
  }

  return null;
}

/**
 * Resolves a conflict by applying chosen strategy.
 */
export function resolveConflict(
  conflict: ConflictDetails,
  strategy: 'client' | 'server'
): { conflict: ConflictDetails; chosenValue: any; discardEdit: boolean } {
  return {
    conflict: {
      ...conflict,
      resolved: true,
      resolution: strategy,
    },
    chosenValue: strategy === 'client' ? conflict.clientValue : conflict.serverValue,
    discardEdit: strategy === 'server',
  };
}

/**
 * Determines current top-level sync status for the UI indicator.
 */
export function determineSyncStatus(params: {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  conflictCount: number;
}): SyncStatus {
  if (params.conflictCount > 0) {
    return 'conflict';
  }
  if (!params.isOnline) {
    return 'offline';
  }
  if (params.isSyncing || params.queueLength > 0) {
    return 'saving';
  }
  return 'saved';
}

/**
 * Human-readable Persian string for sync status indicator tooltip/aria
 */
export function getSyncStatusLabelFa(status: SyncStatus, conflictCount = 0): string {
  switch (status) {
    case 'conflict':
      return `${conflictCount} مغایرت در همگام‌سازی - لمس جهت بررسی`;
    case 'offline':
      return 'حالت آفلاین - تغییرات در صف ذخیره هستند';
    case 'saving':
      return 'در حال همگام‌سازی با سرور...';
    case 'saved':
      return 'همه تغییرات ذخیره شدند';
    case 'idle':
    default:
      return 'آماده';
  }
}
