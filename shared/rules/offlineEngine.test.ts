/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  enqueueEdit,
  pruneQueue,
  detectConflict,
  resolveConflict,
  determineSyncStatus,
  getFieldLabelFa,
  getSyncStatusLabelFa,
  OfflineEditItem
} from './offlineEngine';

describe('Offline Engine (Step 5.2)', () => {
  const sampleEdit1: OfflineEditItem = {
    id: 'edit-1',
    campaignId: 'camp-1',
    participationId: 'part-1',
    characterId: 'char-1',
    field: 'currentHp',
    baseRevision: 3,
    value: 24,
    timestamp: 1000,
  };

  describe('enqueueEdit', () => {
    it('appends edit when no prior edit for same participation and field exists', () => {
      const q = enqueueEdit([], sampleEdit1);
      expect(q).toHaveLength(1);
      expect(q[0].value).toBe(24);
      expect(q[0].baseRevision).toBe(3);
    });

    it('coalesces rapid edits on the same participation and field, keeping original baseRevision', () => {
      let q = enqueueEdit([], sampleEdit1);
      const rapidSecondEdit: OfflineEditItem = {
        id: 'edit-2',
        campaignId: 'camp-1',
        participationId: 'part-1',
        characterId: 'char-1',
        field: 'currentHp',
        baseRevision: 5, // Even if caller supplies a different base revision, original base is preserved
        value: 18,
        timestamp: 1500,
      };

      q = enqueueEdit(q, rapidSecondEdit);
      expect(q).toHaveLength(1);
      expect(q[0].value).toBe(18);
      expect(q[0].baseRevision).toBe(3); // Preserved original baseline!
      expect(q[0].timestamp).toBe(1500);
    });

    it('retains separate edits for distinct fields or participations', () => {
      let q = enqueueEdit([], sampleEdit1);
      const notesEdit: OfflineEditItem = {
        id: 'edit-notes',
        campaignId: 'camp-1',
        participationId: 'part-1',
        characterId: 'char-1',
        field: 'notes',
        baseRevision: 2,
        value: 'یافتن کلید باستانی در دخمه',
        timestamp: 1200,
      };
      q = enqueueEdit(q, notesEdit);
      expect(q).toHaveLength(2);
      expect(q[0].field).toBe('currentHp');
      expect(q[1].field).toBe('notes');
    });
  });

  describe('pruneQueue', () => {
    it('removes synced items by id', () => {
      const q: OfflineEditItem[] = [
        sampleEdit1,
        { ...sampleEdit1, id: 'edit-2', field: 'notes' },
        { ...sampleEdit1, id: 'edit-3', field: 'inventory' },
      ];
      const pruned = pruneQueue(q, ['edit-1', 'edit-3']);
      expect(pruned).toHaveLength(1);
      expect(pruned[0].id).toBe('edit-2');
    });
  });

  describe('detectConflict', () => {
    it('returns null if server revision equals or is behind baseRevision', () => {
      const serverEntity = { revision: 3, currentHp: 20 };
      const conflict = detectConflict(sampleEdit1, serverEntity);
      expect(conflict).toBeNull();
    });

    it('returns null if server revision is higher but field value matches client edit', () => {
      const serverEntity = { revision: 5, currentHp: 24 };
      const conflict = detectConflict(sampleEdit1, serverEntity);
      expect(conflict).toBeNull();
    });

    it('detects conflict if server revision is higher and field values differ', () => {
      const serverEntity = { revision: 4, currentHp: 12 };
      const conflict = detectConflict(sampleEdit1, serverEntity);
      expect(conflict).not.toBeNull();
      expect(conflict?.field).toBe('currentHp');
      expect(conflict?.clientValue).toBe(24);
      expect(conflict?.serverValue).toBe(12);
      expect(conflict?.baseRevision).toBe(3);
      expect(conflict?.serverRevision).toBe(4);
      expect(conflict?.resolved).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    it('resolves conflict with client strategy', () => {
      const serverEntity = { revision: 4, currentHp: 12 };
      const conflict = detectConflict(sampleEdit1, serverEntity)!;
      const res = resolveConflict(conflict, 'client');
      expect(res.conflict.resolved).toBe(true);
      expect(res.conflict.resolution).toBe('client');
      expect(res.chosenValue).toBe(24);
      expect(res.discardEdit).toBe(false);
    });

    it('resolves conflict with server strategy', () => {
      const serverEntity = { revision: 4, currentHp: 12 };
      const conflict = detectConflict(sampleEdit1, serverEntity)!;
      const res = resolveConflict(conflict, 'server');
      expect(res.conflict.resolved).toBe(true);
      expect(res.conflict.resolution).toBe('server');
      expect(res.chosenValue).toBe(12);
      expect(res.discardEdit).toBe(true);
    });
  });

  describe('determineSyncStatus and labels', () => {
    it('prioritizes conflict status above all', () => {
      const status = determineSyncStatus({
        isOnline: true,
        isSyncing: true,
        queueLength: 2,
        conflictCount: 1,
      });
      expect(status).toBe('conflict');
      expect(getSyncStatusLabelFa(status, 1)).toContain('مغایرت');
    });

    it('returns offline when not online and no conflicts', () => {
      const status = determineSyncStatus({
        isOnline: false,
        isSyncing: false,
        queueLength: 2,
        conflictCount: 0,
      });
      expect(status).toBe('offline');
      expect(getSyncStatusLabelFa(status)).toContain('آفلاین');
    });

    it('returns saving when online with pending edits or syncing', () => {
      const status = determineSyncStatus({
        isOnline: true,
        isSyncing: false,
        queueLength: 3,
        conflictCount: 0,
      });
      expect(status).toBe('saving');
      expect(getSyncStatusLabelFa(status)).toContain('همگام‌سازی');
    });

    it('returns saved when online with empty queue and no conflicts', () => {
      const status = determineSyncStatus({
        isOnline: true,
        isSyncing: false,
        queueLength: 0,
        conflictCount: 0,
      });
      expect(status).toBe('saved');
      expect(getSyncStatusLabelFa(status)).toContain('ذخیره شدند');
    });

    it('provides Persian labels for all fields', () => {
      expect(getFieldLabelFa('currentHp')).toBe('جان فعلی (HP)');
      expect(getFieldLabelFa('tempHp')).toBe('جان موقت (Temp HP)');
      expect(getFieldLabelFa('notes')).toBe('یادداشت‌های کاراکتر');
      expect(getFieldLabelFa('inventory')).toBe('کوله‌پشتی و تجهیزات');
      expect(getFieldLabelFa('customResources')).toBe('منابع و قابلیت‌های مصرفی');
    });
  });
});
