/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  OfflineEditItem,
  OfflineEditField,
  ConflictDetails,
  SyncStatus,
  enqueueEdit as pureEnqueue,
  pruneQueue as purePrune,
  determineSyncStatus,
  getFieldLabelFa
} from '../../shared/rules/offlineEngine';
import { api } from './api';

const QUEUE_STORAGE_KEY = 'dy_offline_queue';
const CONFLICTS_STORAGE_KEY = 'dy_sync_conflicts';

type SyncListener = (state: {
  syncStatus: SyncStatus;
  queueLength: number;
  conflicts: ConflictDetails[];
  isOnline: boolean;
}) => void;

class OfflineSyncManager {
  private queue: OfflineEditItem[] = [];
  private conflicts: ConflictDetails[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private flushTimer: any = null;

  constructor() {
    this.loadState();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.scheduleFlush(200);
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Storage event for multi-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === QUEUE_STORAGE_KEY || e.key === CONFLICTS_STORAGE_KEY) {
          this.loadState();
          this.notify();
        }
      });
    }
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const q = localStorage.getItem(QUEUE_STORAGE_KEY);
      this.queue = q ? JSON.parse(q) : [];
    } catch {
      this.queue = [];
    }

    try {
      const c = localStorage.getItem(CONFLICTS_STORAGE_KEY);
      this.conflicts = c ? JSON.parse(c) : [];
    } catch {
      this.conflicts = [];
    }
  }

  private saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      localStorage.setItem(CONFLICTS_STORAGE_KEY, JSON.stringify(this.conflicts));
    } catch {}
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState() {
    const syncStatus = determineSyncStatus({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
      conflictCount: this.conflicts.length,
    });
    return {
      syncStatus,
      queueLength: this.queue.length,
      conflicts: [...this.conflicts],
      isOnline: this.isOnline,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * Enqueues an edit for a gameplay field (currentHp, tempHp, notes, inventory, customResources)
   */
  public enqueue(edit: {
    campaignId: string;
    participationId: string;
    characterId: string;
    field: OfflineEditField;
    baseRevision: number;
    value: any;
  }): OfflineEditItem {
    const now = Date.now();
    const item: OfflineEditItem = {
      id: `edit-${now}-${Math.random().toString(36).substring(2, 7)}`,
      campaignId: edit.campaignId,
      participationId: edit.participationId,
      characterId: edit.characterId,
      field: edit.field,
      baseRevision: edit.baseRevision || 1,
      value: edit.value,
      timestamp: now,
    };

    this.queue = pureEnqueue(this.queue, item);
    this.saveState();
    this.notify();

    if (this.isOnline) {
      this.scheduleFlush(600);
    }

    return item;
  }

  private scheduleFlush(delayMs = 500) {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flush(), delayMs);
  }

  /**
   * Flushes the offline queue against the API
   */
  public async flush(): Promise<{ syncedCount: number; newConflictsCount: number }> {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) {
      return { syncedCount: 0, newConflictsCount: 0 };
    }

    this.isSyncing = true;
    this.notify();

    try {
      const pendingEdits = [...this.queue];
      const result = await api.syncOfflineEdits(pendingEdits);

      if (result.syncedIds.length > 0) {
        this.queue = purePrune(this.queue, result.syncedIds);
      }

      if (result.conflicts && result.conflicts.length > 0) {
        // Remove conflicting edits from queue since they must be resolved in modal
        const conflictEditIds = result.conflicts.map(c => c.editId);
        this.queue = purePrune(this.queue, conflictEditIds);

        // Add to active conflicts avoiding duplicates
        const existingIds = new Set(this.conflicts.map(c => c.id));
        for (const c of result.conflicts) {
          if (!existingIds.has(c.id)) {
            this.conflicts.push(c);
          }
        }
      }

      this.saveState();
      return { syncedCount: result.syncedIds.length, newConflictsCount: result.conflicts?.length || 0 };
    } catch {
      // Offline or network error: edits remain in queue safely
      return { syncedCount: 0, newConflictsCount: 0 };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Resolves a conflict by choosing 'client' or 'server'
   */
  public async resolve(conflictId: string, strategy: 'client' | 'server'): Promise<void> {
    const idx = this.conflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) return;

    try {
      await api.resolveSyncConflict(conflictId, strategy);
    } catch {}

    this.conflicts.splice(idx, 1);
    this.saveState();
    this.notify();
  }

  public getConflicts(): ConflictDetails[] {
    return [...this.conflicts];
  }
}

export const offlineSyncManager = new OfflineSyncManager();

/**
 * React hook to observe offline sync status and conflicts
 */
export function useOfflineSync() {
  const [state, setState] = useState(() => offlineSyncManager.getState());

  useEffect(() => {
    return offlineSyncManager.subscribe(setState);
  }, []);

  return {
    ...state,
    enqueueEdit: (edit: Parameters<typeof offlineSyncManager.enqueue>[0]) => offlineSyncManager.enqueue(edit),
    flushQueue: () => offlineSyncManager.flush(),
    resolveConflict: (conflictId: string, strategy: 'client' | 'server') => offlineSyncManager.resolve(conflictId, strategy),
  };
}
