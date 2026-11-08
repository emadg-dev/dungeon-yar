import { describe, it, expect } from 'vitest';
import {
  validateCampaignMapPayload,
  validateMapFeaturePayload,
  validateMapStampPayload,
  checkMapConflict,
  filterMapFeaturesForRole,
  clampCoordinate,
  clampPolygonCoordinates,
  detectImageMimeFromBytes,
  validateStampUploadFile,
  createInitialHistory,
  recordMapHistoryAction,
  undoMapHistoryAction,
  isConflictErrorMessage,
  CONFLICT_ERROR_FA,
  ALLOWED_TERRAIN_TYPES,
  ALLOWED_MARKER_TYPES
} from './mapEngine';
import type { MapFeature, CampaignMap, MapStamp } from '../../src/types';

describe('shared/rules/mapEngine', () => {
  describe('1. validateCampaignMapPayload', () => {
    it('accepts valid campaign map payload', () => {
      const res = validateCampaignMapPayload({
        name: 'نقشه جهان زروانیا',
        mediaId: 'media-map-1',
        width: 2000,
        height: 1400
      });
      expect(res.valid).toBe(true);
    });

    it('rejects empty name or name exceeding 100 characters', () => {
      expect(validateCampaignMapPayload({ name: '   ', mediaId: 'm1', width: 100, height: 100 }).valid).toBe(false);
      expect(validateCampaignMapPayload({ name: 'a'.repeat(101), mediaId: 'm1', width: 100, height: 100 }).valid).toBe(false);
    });

    it('rejects unsafe script payload in map name', () => {
      const res = validateCampaignMapPayload({
        name: 'نقشه <script>alert(1)</script>',
        mediaId: 'm1',
        width: 100,
        height: 100
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('غیرمجاز');
    });

    it('rejects missing image mediaId/imageUrl and non-positive dimensions', () => {
      expect(validateCampaignMapPayload({ name: 'نقشه', width: 100, height: 100 }).valid).toBe(false);
      expect(validateCampaignMapPayload({ name: 'نقشه', mediaId: 'm1', width: 0, height: 100 }).valid).toBe(false);
      expect(validateCampaignMapPayload({ name: 'نقشه', mediaId: 'm1', width: 100, height: -10 }).valid).toBe(false);
    });
  });

  describe('2. validateMapFeaturePayload', () => {
    const mapDim = { width: 2000, height: 1400 };

    it('accepts a valid terrain polygon', () => {
      const feature: Partial<MapFeature> = {
        kind: 'terrain',
        label: 'بیشه ورنا',
        geometry: {
          type: 'Polygon',
          coordinates: [[100, 200], [300, 200], [250, 400]]
        },
        style: {
          terrainType: 'forest'
        }
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(true);
    });

    it('rejects polygon with fewer than 3 coordinates', () => {
      const feature: Partial<MapFeature> = {
        kind: 'terrain',
        label: 'جنگل ناقص',
        geometry: {
          type: 'Polygon',
          coordinates: [[100, 200], [300, 200]]
        },
        style: { terrainType: 'forest' }
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('حداقل دارای ۳ نقطه');
    });

    it('rejects terrain with coordinates exceeding map dimensions', () => {
      const feature: Partial<MapFeature> = {
        kind: 'terrain',
        label: 'خارج از نقشه',
        geometry: {
          type: 'Polygon',
          coordinates: [[100, 200], [1500, 200], [250, 400]] // 1500 > height 1400
        },
        style: { terrainType: 'mountain' }
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('خارج از محدوده ابعاد نقشه');
    });

    it('rejects invalid terrainType', () => {
      const feature: Partial<MapFeature> = {
        kind: 'terrain',
        label: 'زمین نامشخص',
        geometry: {
          type: 'Polygon',
          coordinates: [[100, 200], [300, 200], [250, 400]]
        },
        style: { terrainType: 'lava' as any }
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('نوع زمین نامعتبر است');
    });

    it('accepts valid marker point with linked entity', () => {
      const feature: Partial<MapFeature> = {
        kind: 'marker',
        label: 'قلعه سپیدار',
        geometry: {
          type: 'Point',
          coordinates: [500, 600]
        },
        style: {
          markerType: 'location'
        },
        linkType: 'location',
        linkId: 'loc-1'
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(true);
    });

    it('rejects marker with missing linkId when linkType is present', () => {
      const feature: Partial<MapFeature> = {
        kind: 'marker',
        label: 'قلعه سپیدار',
        geometry: {
          type: 'Point',
          coordinates: [500, 600]
        },
        style: { markerType: 'location' },
        linkType: 'location',
        linkId: ''
      };
      const res = validateMapFeaturePayload(feature, mapDim);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('شناسه هدف (linkId) الزامی است');
    });

    it('accepts valid stamp feature and checks scale boundary', () => {
      const feature: Partial<MapFeature> = {
        kind: 'stamp',
        label: 'نشان قلعه دست‌کشیده',
        geometry: {
          type: 'Point',
          coordinates: [300, 400]
        },
        style: {
          stampId: 'stamp-1',
          scale: 1.5
        }
      };
      expect(validateMapFeaturePayload(feature, mapDim).valid).toBe(true);

      // Scale too small (< 0.1)
      expect(validateMapFeaturePayload({ ...feature, style: { stampId: 'stamp-1', scale: 0.05 } }).valid).toBe(false);
      // Scale too large (> 5.0)
      expect(validateMapFeaturePayload({ ...feature, style: { stampId: 'stamp-1', scale: 6.0 } }).valid).toBe(false);
      // Missing stampId
      expect(validateMapFeaturePayload({ ...feature, style: { scale: 1.0 } }).valid).toBe(false);
    });

    it('rejects label and description with script tags', () => {
      const f1: Partial<MapFeature> = {
        kind: 'marker',
        label: '<script>alert("xss")</script>',
        geometry: { type: 'Point', coordinates: [100, 100] },
        style: { markerType: 'enemy' }
      };
      expect(validateMapFeaturePayload(f1).valid).toBe(false);

      const f2: Partial<MapFeature> = {
        kind: 'region',
        label: 'مرز امن',
        description: 'توضیحات <iframe src="evil.com"></iframe>',
        geometry: { type: 'Polygon', coordinates: [[0, 0], [10, 0], [10, 10]] },
        style: {}
      };
      expect(validateMapFeaturePayload(f2).valid).toBe(false);
    });
  });

  describe('3. validateMapStampPayload', () => {
    it('validates stamp creation payload', () => {
      expect(validateMapStampPayload({ name: 'آیکون برج دیده‌بانی', mediaId: 'media-s1' }).valid).toBe(true);
      expect(validateMapStampPayload({ name: '', mediaId: 'media-s1' }).valid).toBe(false);
      expect(validateMapStampPayload({ name: 'برج', mediaId: '' }).valid).toBe(false);
    });
  });

  describe('4. checkMapConflict', () => {
    it('returns no conflict when revisions match or expectedRevision is undefined', () => {
      expect(checkMapConflict(3, 3).hasConflict).toBe(false);
      expect(checkMapConflict(3, undefined).hasConflict).toBe(false);
    });

    it('returns Persian conflict error when revisions differ', () => {
      const res = checkMapConflict(3, 2);
      expect(res.hasConflict).toBe(true);
      expect(res.error).toBe(CONFLICT_ERROR_FA);
    });
  });

  describe('5. filterMapFeaturesForRole', () => {
    const features: MapFeature[] = [
      {
        id: 'f1',
        mapId: 'm1',
        campaignId: 'c1',
        kind: 'terrain',
        geometry: { type: 'Polygon', coordinates: [[0, 0], [10, 0], [10, 10]] },
        label: 'جنگل علنی',
        style: { terrainType: 'forest' },
        isRevealed: true,
        updatedAt: 1000
      },
      {
        id: 'f2',
        mapId: 'm1',
        campaignId: 'c1',
        kind: 'marker',
        geometry: { type: 'Point', coordinates: [50, 50] },
        label: 'کمینگاه مخفی دیوان',
        style: { markerType: 'enemy' },
        isRevealed: false,
        updatedAt: 1000
      }
    ];

    it('returns all features for owner and co_dm', () => {
      expect(filterMapFeaturesForRole(features, 'owner')).toHaveLength(2);
      expect(filterMapFeaturesForRole(features, 'co_dm')).toHaveLength(2);
    });

    it('filters out unrevealed features for player, spectator, or null role', () => {
      const playerList = filterMapFeaturesForRole(features, 'player');
      expect(playerList).toHaveLength(1);
      expect(playerList[0].id).toBe('f1');

      const spectatorList = filterMapFeaturesForRole(features, 'spectator');
      expect(spectatorList).toHaveLength(1);
      expect(spectatorList[0].id).toBe('f1');

      const anonList = filterMapFeaturesForRole(features, null);
      expect(anonList).toHaveLength(1);
      expect(anonList[0].id).toBe('f1');
    });
  });

  describe('6. Coordinate Clamping', () => {
    it('clamps coordinates strictly within image bounds [0..height, 0..width]', () => {
      expect(clampCoordinate([-50, 1500], 1000, 800)).toEqual([0, 1000]);
      expect(clampCoordinate([900, -10], 1000, 800)).toEqual([800, 0]);
      expect(clampCoordinate([450.45, 600.22], 1000, 800)).toEqual([450.5, 600.2]);

      const poly = [[-10, -20], [500, 500], [900, 1200]] as [number, number][];
      const clamped = clampPolygonCoordinates(poly, 1000, 800);
      expect(clamped).toEqual([[0, 0], [500, 500], [800, 1000]]);
    });
  });

  describe('7. Stamp File Validation & Magic Bytes', () => {
    it('identifies PNG, JPEG, and WebP via binary magic bytes', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectImageMimeFromBytes(pngBytes)).toBe('image/png');

      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(detectImageMimeFromBytes(jpegBytes)).toBe('image/jpeg');

      // RIFF....WEBP
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // 'RIFF'
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50  // 'WEBP'
      ]);
      expect(detectImageMimeFromBytes(webpBytes)).toBe('image/webp');
    });

    it('strictly rejects SVG uploads', () => {
      const res = validateStampUploadFile('castle.svg', 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('SVG');
    });

    it('rejects files larger than 150 KB cap', () => {
      const res = validateStampUploadFile('huge.png', 160 * 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('۱۵۰ کیلوبایت');
    });

    it('rejects corrupt or invalid image bytes', () => {
      const corruptBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const res = validateStampUploadFile('valid-name.png', 5000, corruptBytes);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('نامعتبر');
    });
  });

  describe('8. Single-step Undo History', () => {
    it('records action and successfully reverts to previous feature state', () => {
      const initialFeatures = [{ id: 'f1', label: 'اول' }];
      let history = createInitialHistory();
      expect(history.canUndo).toBe(false);

      // Record before adding f2
      history = recordMapHistoryAction(initialFeatures as any);
      expect(history.canUndo).toBe(true);

      const modifiedFeatures = [{ id: 'f1', label: 'اول' }, { id: 'f2', label: 'دوم' }];
      const undoResult = undoMapHistoryAction(history, modifiedFeatures as any);

      expect(undoResult.features).toEqual(initialFeatures);
      expect(undoResult.newHistory.canUndo).toBe(false);
    });
  });

  describe('9. isConflictErrorMessage', () => {
    it('recognizes conflict errors accurately', () => {
      expect(isConflictErrorMessage('خطای همزمانی (Conflict): نقشه تغییر کرده است.')).toBe(true);
      expect(isConflictErrorMessage(new Error('revision mismatch'))).toBe(true);
      expect(isConflictErrorMessage('خطای عمومی شبکه')).toBe(false);
    });
  });
});

