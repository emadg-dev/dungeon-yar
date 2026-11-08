import { describe, it, expect, beforeEach } from 'vitest';

const mockStore = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.getItem) {
  globalThis.localStorage = {
    getItem: (key: string) => mockStore.get(key) ?? null,
    setItem: (key: string, val: string) => { mockStore.set(key, String(val)); },
    removeItem: (key: string) => { mockStore.delete(key); },
    clear: () => { mockStore.clear(); },
    key: (i: number) => Array.from(mockStore.keys())[i] ?? null,
    length: 0
  } as any;
}

import { api } from '../../src/services/api';
import { CONFLICT_ERROR_FA } from './mapEngine';

describe('LocalApi Campaign Maps & Permissions', () => {
  const campaignId = 'zorvania-c1';
  const mainMapId = 'map-zorvania-main';

  beforeEach(async () => {
    // Reset seed data in localStorage
    globalThis.localStorage.clear();
    // Default currentUser in api is u1 (DM/admin)
    await api.login('dm@zorvania.ir', 'admin123').catch(() => {});
  });

  describe('1. Read Operations & Seed Map', () => {
    it('returns seed campaign map for zorvania-c1', async () => {
      const maps = await api.getCampaignMaps(campaignId);
      expect(maps.length).toBeGreaterThanOrEqual(1);

      const mainMap = maps.find(m => m.id === mainMapId);
      expect(mainMap).toBeDefined();
      expect(mainMap?.isMain).toBe(true);
      expect(mainMap?.width).toBe(2000);
      expect(mainMap?.height).toBe(1400);
      expect(mainMap?.imageUrl).toBeDefined();
    });

    it('returns all features (including hidden ones) for DM', async () => {
      // Login as DM (u1 is owner)
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});
      const map = await api.getCampaignMap(campaignId, mainMapId);
      expect(map).not.toBeNull();
      expect(map?.features).toBeDefined();

      // Check features count for DM
      const allFeatures = map!.features!;
      expect(allFeatures.length).toBe(8);

      const hidden = allFeatures.find(f => f.id === 'feat-marker-hidden-vault');
      expect(hidden).toBeDefined();
      expect(hidden?.isRevealed).toBe(false);
    });

    it('strips hidden features for player role', async () => {
      // Login as player (e.g. u2 = Pardis, player role)
      await api.login('pardis@zorvania.ir', 'player123').catch(() => {});
      const map = await api.getCampaignMap(campaignId, mainMapId);
      expect(map).not.toBeNull();
      expect(map?.features).toBeDefined();

      const playerFeatures = map!.features!;
      expect(playerFeatures.length).toBe(7);

      const hidden = playerFeatures.find(f => f.id === 'feat-marker-hidden-vault');
      expect(hidden).toBeUndefined();
    });
  });

  describe('2. Permission Enforcement (dm_tools:handouts_maps)', () => {
    it('blocks player from creating a map', async () => {
      await api.login('pardis@zorvania.ir', 'player123').catch(() => {});
      await expect(
        api.createCampaignMap(campaignId, {
          name: 'نقشه غیرمجاز بازیکن',
          mediaId: 'm-dummy',
          width: 1000,
          height: 1000
        })
      ).rejects.toThrow('دسترسی غیرمجاز');
    });

    it('blocks player from creating a map feature', async () => {
      await api.login('pardis@zorvania.ir', 'player123').catch(() => {});
      await expect(
        api.createMapFeature(campaignId, mainMapId, {
          kind: 'marker',
          label: 'نشانگر غیرمجاز',
          geometry: { type: 'Point', coordinates: [100, 100] },
          style: { markerType: 'player' }
        })
      ).rejects.toThrow('دسترسی غیرمجاز');
    });

    it('blocks player from creating or deleting stamps', async () => {
      await api.login('pardis@zorvania.ir', 'player123').catch(() => {});
      await expect(
        api.createMapStamp(campaignId, { name: 'استمپ غیرمجاز', mediaId: 'm1' })
      ).rejects.toThrow('دسترسی غیرمجاز');

      await expect(
        api.deleteMapStamp(campaignId, 'stamp-fortress-1')
      ).rejects.toThrow('دسترسی غیرمجاز');
    });
  });

  describe('3. Concurrency Conflict & Revision Handling', () => {
    it('detects revision mismatch and throws Persian conflict error on map update', async () => {
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});
      const map = await api.getCampaignMap(campaignId, mainMapId);
      expect(map).not.toBeNull();
      const currentRev = map!.revision;

      // Updating with stale revision (e.g. currentRev - 1 or wrong number)
      await expect(
        api.updateCampaignMap(campaignId, mainMapId, {
          name: 'تغییر نام با ریویژن منقضی',
          expectedRevision: currentRev - 1
        })
      ).rejects.toThrow(CONFLICT_ERROR_FA);
    });

    it('succeeds when expectedRevision matches and increments revision', async () => {
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});
      const map = await api.getCampaignMap(campaignId, mainMapId);
      const currentRev = map!.revision;

      const updated = await api.updateCampaignMap(campaignId, mainMapId, {
        name: 'نقشه جهان زروانیا (ویرایش‌شده)',
        expectedRevision: currentRev
      });

      expect(updated.name).toBe('نقشه جهان زروانیا (ویرایش‌شده)');
      expect(updated.revision).toBe(currentRev + 1);
    });

    it('detects conflict on feature update if expectedRevision does not match map revision', async () => {
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});
      const map = await api.getCampaignMap(campaignId, mainMapId);
      const currentRev = map!.revision;

      await expect(
        api.updateMapFeature(campaignId, mainMapId, 'feat-marker-loc-1', {
          label: 'برچسب متناقض',
          expectedRevision: currentRev + 99
        })
      ).rejects.toThrow(CONFLICT_ERROR_FA);
    });
  });

  describe('4. Feature Lifecycle (CRUD) by DM', () => {
    it('allows DM to create, update, and delete features', async () => {
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});

      // 1. Create a new road terrain feature
      const newFeature = await api.createMapFeature(campaignId, mainMapId, {
        kind: 'terrain',
        label: 'شاهراه باستان',
        description: 'جاده تجاری میان ورنا و کویر خاموش',
        geometry: {
          type: 'Polygon',
          coordinates: [[500, 600], [550, 700], [600, 650]]
        },
        style: {
          terrainType: 'road'
        },
        isRevealed: true
      });
      expect(newFeature.id).toBeDefined();
      expect(newFeature.label).toBe('شاهراه باستان');

      // 2. Update feature
      const updated = await api.updateMapFeature(campaignId, mainMapId, newFeature.id, {
        label: 'شاهراه باستان (آسفالت‌شده)',
        description: 'مسیر بازسازی شده با نگهبانان'
      });
      expect(updated.label).toBe('شاهراه باستان (آسفالت‌شده)');

      // 3. Delete feature
      const del = await api.deleteMapFeature(campaignId, mainMapId, newFeature.id);
      expect(del.success).toBe(true);

      // Verify it no longer appears in map features
      const map = await api.getCampaignMap(campaignId, mainMapId);
      expect(map?.features?.some(f => f.id === newFeature.id)).toBe(false);
    });
  });

  describe('5. Stamp Library Lifecycle', () => {
    it('lists seed stamps and allows DM to create and delete a stamp', async () => {
      await api.login('dm@zorvania.ir', 'admin123').catch(() => {});

      const stamps = await api.getMapStamps(campaignId);
      expect(stamps.length).toBeGreaterThanOrEqual(1);
      expect(stamps[0].id).toBe('stamp-fortress-1');

      // Create new stamp
      const created = await api.createMapStamp(campaignId, {
        name: 'برج دیده‌بانی شرقی',
        mediaId: 'media-tower-1',
        width: 64,
        height: 64
      });
      expect(created.id).toBeDefined();
      expect(created.name).toBe('برج دیده‌بانی شرقی');

      // Delete stamp
      const del = await api.deleteMapStamp(campaignId, created.id);
      expect(del.success).toBe(true);
    });
  });

  describe('6. Non-DM Permission Rejection on Mutation APIs', () => {
    it('throws unauthorized error when a player attempts to create/update/delete features or stamps', async () => {
      // Login as regular player (Pardis - player role)
      await api.login('pardis@zorvania.ir', 'player123').catch(() => {});

      // 1. Attempt to create map feature
      await expect(
        api.createMapFeature(campaignId, mainMapId, {
          kind: 'marker',
          label: 'نشانه غیرمجاز بازیکن',
          geometry: { type: 'Point', coordinates: [100, 100] },
          style: { markerType: 'location' }
        })
      ).rejects.toThrow('دسترسی غیرمجاز');

      // 2. Attempt to update map feature
      await expect(
        api.updateMapFeature(campaignId, mainMapId, 'feat-marker-capital', {
          label: 'تغییر نام غیرمجاز'
        })
      ).rejects.toThrow('دسترسی غیرمجاز');

      // 3. Attempt to delete map feature
      await expect(
        api.deleteMapFeature(campaignId, mainMapId, 'feat-marker-capital')
      ).rejects.toThrow('دسترسی غیرمجاز');

      // 4. Attempt to create stamp
      await expect(
        api.createMapStamp(campaignId, {
          name: 'استمپ غیرمجاز',
          mediaId: 'm1'
        })
      ).rejects.toThrow('دسترسی غیرمجاز');

      // 5. Attempt to delete stamp
      await expect(
        api.deleteMapStamp(campaignId, 'stamp-fortress-1')
      ).rejects.toThrow('دسترسی غیرمجاز');

      // 6. Attempt to update campaign map metadata
      await expect(
        api.updateCampaignMap(campaignId, mainMapId, { name: 'نام نقشه تغییریافته' })
      ).rejects.toThrow('دسترسی غیرمجاز');
    });
  });
});

