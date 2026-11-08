import { describe, it, expect } from 'vitest';
import { createRealServerTestContext } from './serverTestApp';
import { CONFLICT_ERROR_FA, MAX_STAMP_BYTES } from './mapEngine';

describe('Server & Database Map System (Stage D Integration Tests)', () => {
  const campId = 'zorvania-c1';
  const mainMapId = `map-${campId}-main`;

  describe('1. Membership & Authorization (Non-member 404, Player 403 on writes)', () => {
    it('returns 404 for non-members on maps and stamps endpoints (never reveals existence)', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // outsider is not a member of zorvania-c1
      const resMaps = await dispatch(`/c/${campId}/maps`, { asUserId: 'user-outsider' });
      expect(resMaps.status).toBe(404);
      const dataMaps = await resMaps.json();
      expect(dataMaps.error).toContain('یافت نشد');

      const resStamps = await dispatch(`/c/${campId}/map-stamps`, { asUserId: 'user-outsider' });
      expect(resStamps.status).toBe(404);

      const resSingle = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-outsider' });
      expect(resSingle.status).toBe(404);
    });

    it('rejects player write attempts with 403 Forbidden', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // Player cannot create map
      const resCreateMap = await dispatch(`/c/${campId}/maps`, {
        method: 'POST',
        asUserId: 'user-player',
        body: { name: 'نقشه غیرمجاز', width: 1000, height: 1000 }
      });
      expect(resCreateMap.status).toBe(403);

      // Player cannot add feature
      const resAddFeat = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-player',
        body: {
          kind: 'marker',
          label: 'نشانه نامجاز',
          geometry: { type: 'Point', coordinates: [100, 100] },
          style: { markerType: 'location' }
        }
      });
      expect(resAddFeat.status).toBe(403);

      // Player cannot create stamp
      const resCreateStamp = await dispatch(`/c/${campId}/map-stamps`, {
        method: 'POST',
        asUserId: 'user-player',
        body: { name: 'استمپ نامجاز' }
      });
      expect(resCreateStamp.status).toBe(403);
    });
  });

  describe('2. SQL-level Visibility Filtering (DM vs Player)', () => {
    it('returns all features (revealed and unrevealed) to campaign DM/Owner', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const res = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-owner' });
      expect(res.status).toBe(200);
      const map = await res.json();
      expect(map.id).toBe(mainMapId);

      const labels = map.features.map((f: any) => f.label);
      expect(labels).toContain('بیشه سیاه ورنا'); // revealed terrain
      expect(labels).toContain('سرداب مخفی منشور پیوند'); // unrevealed secret marker
      expect(map.features.length).toBe(2);
    });

    it('returns ONLY revealed features to Player, stripping unrevealed items at SQL level', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const res = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-player' });
      expect(res.status).toBe(200);
      const map = await res.json();

      const labels = map.features.map((f: any) => f.label);
      expect(labels).toContain('بیشه سیاه ورنا');
      expect(labels).not.toContain('سرداب مخفی منشور پیوند');
      expect(map.features.length).toBe(1);
    });

    it('returns ONLY revealed features to Spectator', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const res = await dispatch(`/c/${campId}/maps`, { asUserId: 'user-spectator' });
      expect(res.status).toBe(200);
      const maps = await res.json();
      expect(maps.length).toBeGreaterThan(0);
      const targetMap = maps.find((m: any) => m.id === mainMapId);
      expect(targetMap).toBeDefined();

      const labels = targetMap.features.map((f: any) => f.label);
      expect(labels).toContain('بیشه سیاه ورنا');
      expect(labels).not.toContain('سرداب مخفی منشور پیوند');
    });
  });

  describe('3. DM Feature Mutations & Revision Concurrency Control', () => {
    it('allows DM to create a feature and bumps map revision atomically', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);

      const initialMap = state.campaignMaps.get(mainMapId);
      const initialRev = initialMap.revision;

      const res = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          kind: 'marker',
          label: 'اردوگاه دیده‌بانی جدید',
          description: 'پایگاه تازه تأسیس مرزداران',
          geometry: { type: 'Point', coordinates: [450, 650] },
          style: { markerType: 'location' },
          isRevealed: true
        }
      });

      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.id).toBeDefined();
      expect(created.label).toBe('اردوگاه دیده‌بانی جدید');

      // Verify map revision was incremented
      const updatedMap = state.campaignMaps.get(mainMapId);
      expect(updatedMap.revision).toBe(initialRev + 1);

      // Verify audit log recorded
      expect(state.auditLog.length).toBeGreaterThan(0);
    });

    it('returns 409 Conflict with Persian message when expectedRevision mismatches on map update', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);
      const map = state.campaignMaps.get(mainMapId);
      const currentRev = map.revision; // 1

      // Stale update with wrong revision (e.g. 999)
      const res = await dispatch(`/c/${campId}/maps/${mainMapId}`, {
        method: 'PATCH',
        asUserId: 'user-owner',
        body: {
          name: 'تغییر نام همزمان',
          expectedRevision: currentRev + 5
        }
      });

      expect(res.status).toBe(409);
      const err = await res.json();
      expect(err.error).toBe(CONFLICT_ERROR_FA);
    });

    it('allows DM to update and delete features', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);

      // Update feature
      const patchRes = await dispatch(`/c/${campId}/maps/${mainMapId}/features/feat-forest-1`, {
        method: 'PATCH',
        asUserId: 'user-owner',
        body: {
          label: 'بیشه ورنا (ویرایش‌شده)',
          isRevealed: true
        }
      });
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.label).toBe('بیشه ورنا (ویرایش‌شده)');

      // Delete feature
      const delRes = await dispatch(`/c/${campId}/maps/${mainMapId}/features/feat-forest-1`, {
        method: 'DELETE',
        asUserId: 'user-owner'
      });
      expect(delRes.status).toBe(200);
      const delData = await delRes.json();
      expect(delData.success).toBe(true);
      expect(state.mapFeatures.has('feat-forest-1')).toBe(false);
    });
  });

  describe('4. Input Validation & IDOR Prevention', () => {
    it('clamps coordinates to map bounds on creation', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // Coordinates [3000, 5000] are outside map height=1400, width=2000
      const res = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          kind: 'marker',
          label: 'نشانگر فرامرزی',
          geometry: { type: 'Point', coordinates: [3000, 5000] },
          style: { markerType: 'location' }
        }
      });

      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.geometry.coordinates).toEqual([1400, 2000]);
    });

    it('rejects polygon features with over 100 vertices', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const largeCoords = Array.from({ length: 105 }, (_, i) => [i, i] as [number, number]);
      const res = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          kind: 'terrain',
          label: 'پلیگون بیش از حد مجاز',
          geometry: { type: 'Polygon', coordinates: largeCoords },
          style: { terrainType: 'forest' }
        }
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('۱۰۰ نقطه');
    });

    it('prevents IDOR: rejects link_id pointing to another campaign entity', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // loc-foreign belongs to camp-foreign-diff, not zorvania-c1
      const res = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          kind: 'marker',
          label: 'تلاش برای IDOR',
          geometry: { type: 'Point', coordinates: [100, 100] },
          style: { markerType: 'location' },
          linkType: 'location',
          linkId: 'loc-foreign'
        }
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('یافت نشد');
    });

    it('accepts link_id pointing to entity within the same campaign', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const res = await dispatch(`/c/${campId}/maps/${mainMapId}/features`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          kind: 'marker',
          label: 'پیوند مجاز',
          geometry: { type: 'Point', coordinates: [100, 100] },
          style: { markerType: 'location' },
          linkType: 'location',
          linkId: 'loc-fire-temple'
        }
      });

      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.linkId).toBe('loc-fire-temple');
    });
  });

  describe('5. Stamp Upload, Magic Bytes & Size Limits', () => {
    it('strictly rejects SVG stamp uploads', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      const res = await dispatch(`/c/${campId}/map-stamps`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          name: 'استمپ SVG خطرناک',
          fileName: 'exploit.svg',
          dataBase64: Buffer.from('<svg></svg>').toString('base64')
        }
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('SVG');
    });

    it('rejects stamp files exceeding 150KB size cap', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // Create a dummy payload larger than 150KB
      const largeBuffer = Buffer.alloc(MAX_STAMP_BYTES + 1024);
      // Prepend PNG magic bytes so it only fails on size
      largeBuffer[0] = 0x89;
      largeBuffer[1] = 0x50;
      largeBuffer[2] = 0x4e;
      largeBuffer[3] = 0x47;

      const res = await dispatch(`/c/${campId}/map-stamps`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          name: 'استمپ بسیار حجیم',
          fileName: 'huge.png',
          dataBase64: largeBuffer.toString('base64')
        }
      });

      expect(res.status).toBe(400);
      const err = await res.json();
      expect(err.error).toContain('۱۵۰ کیلوبایت');
    });

    it('accepts valid PNG stamp upload, checks magic bytes, and lists it', async () => {
      const { dispatch } = await createRealServerTestContext(campId);

      // Real 1x1 transparent PNG buffer
      const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await dispatch(`/c/${campId}/map-stamps`, {
        method: 'POST',
        asUserId: 'user-owner',
        body: {
          name: 'نشان دژ پیروز',
          fileName: 'stamp.png',
          dataBase64: validPngBase64
        }
      });

      expect(res.status).toBe(201);
      const stamp = await res.json();
      expect(stamp.id).toBeDefined();
      expect(stamp.name).toBe('نشان دژ پیروز');

      // Check listing: DM sees all stamps in library
      const listResDm = await dispatch(`/c/${campId}/map-stamps`, { asUserId: 'user-owner' });
      expect(listResDm.status).toBe(200);
      const listDm = await listResDm.json();
      expect(listDm.some((s: any) => s.name === 'نشان دژ پیروز')).toBe(true);

      // Player only sees stamps that are actually placed in revealed features or fortress seed
      const listResPlayer = await dispatch(`/c/${campId}/map-stamps`, { asUserId: 'user-player' });
      expect(listResPlayer.status).toBe(200);
      const listPlayer = await listResPlayer.json();
      expect(listPlayer.some((s: any) => s.id === 'stamp-fortress-1')).toBe(true);
      expect(listPlayer.some((s: any) => s.name === 'نشان دژ پیروز')).toBe(false);

      // Delete stamp
      const delRes = await dispatch(`/c/${campId}/map-stamps/${stamp.id}`, {
        method: 'DELETE',
        asUserId: 'user-owner'
      });
      expect(delRes.status).toBe(200);
    });
  });

  describe('6. Security & Anti-Leak Hardening (dm_notes, hidden entity links, revision on delete)', () => {
    it('returns dmNotes to DM but completely strips it for Player', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);

      // Add a secret DM note to a revealed feature in DB state
      const feat = state.mapFeatures.get('feat-forest-1');
      if (feat) {
        feat.dm_notes = 'یادداشت مخفی مستر: گنج پنهان در تنه درخت';
      }

      // 1. DM view
      const resDm = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-owner' });
      expect(resDm.status).toBe(200);
      const mapDm = await resDm.json();
      const forestDm = mapDm.features.find((f: any) => f.id === 'feat-forest-1');
      expect(forestDm.dmNotes).toBe('یادداشت مخفی مستر: گنج پنهان در تنه درخت');

      // 2. Player view
      const resPlayer = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-player' });
      expect(resPlayer.status).toBe(200);
      const mapPlayer = await resPlayer.json();
      const forestPlayer = mapPlayer.features.find((f: any) => f.id === 'feat-forest-1');
      expect(forestPlayer.dmNotes).toBeUndefined();
    });

    it('strips linkType and linkId for player if linked location is not revealed', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);

      // Set linked location to unrevealed
      state.locations.set('loc-fire-temple', {
        id: 'loc-fire-temple',
        scope_type: 'campaign',
        scope_id: campId,
        name: 'آتشکده مخفی',
        revealed: 0
      });

      // Feature feat-forest-1 links to loc-fire-temple
      const feat = state.mapFeatures.get('feat-forest-1');
      if (feat) {
        feat.link_type = 'location';
        feat.link_id = 'loc-fire-temple';
      }

      // DM sees the link intact
      const resDm = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-owner' });
      const mapDm = await resDm.json();
      const forestDm = mapDm.features.find((f: any) => f.id === 'feat-forest-1');
      expect(forestDm.linkId).toBe('loc-fire-temple');

      // Player has the link stripped to prevent entity leakage
      const resPlayer = await dispatch(`/c/${campId}/maps/${mainMapId}`, { asUserId: 'user-player' });
      const mapPlayer = await resPlayer.json();
      const forestPlayer = mapPlayer.features.find((f: any) => f.id === 'feat-forest-1');
      expect(forestPlayer.linkId).toBeUndefined();
      expect(forestPlayer.linkType).toBeUndefined();
    });

    it('rejects feature DELETE when expectedRevision mismatches with 409 Conflict', async () => {
      const { dispatch, state } = await createRealServerTestContext(campId);
      const currentRev = state.campaignMaps.get(mainMapId).revision;

      // Stale delete request with mismatched expectedRevision
      const delRes = await dispatch(`/c/${campId}/maps/${mainMapId}/features/feat-forest-1?expectedRevision=${currentRev + 10}`, {
        method: 'DELETE',
        asUserId: 'user-owner'
      });
      expect(delRes.status).toBe(409);
      const err = await delRes.json();
      expect(err.error).toBe(CONFLICT_ERROR_FA);
    });
  });
});
