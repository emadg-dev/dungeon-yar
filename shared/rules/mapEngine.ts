/**
 * Pure rules and validation engine for Campaign Main Maps, Features, and Stamps.
 * Single source of truth used by both server and UI.
 */

import type {
  CampaignMap,
  MapFeature,
  MapFeatureKind,
  MapTerrainType,
  MapMarkerType,
  MapStamp,
  CampaignRole
} from '../../src/types';

export const ALLOWED_TERRAIN_TYPES: readonly MapTerrainType[] = [
  'forest',
  'water',
  'mountain',
  'desert',
  'swamp',
  'road'
] as const;

export const ALLOWED_MARKER_TYPES: readonly MapMarkerType[] = [
  'location',
  'npc',
  'enemy',
  'character',
  'player'
] as const;

export const TERRAIN_TYPE_LABELS: Record<MapTerrainType, string> = {
  forest: 'جنگل',
  water: 'آب و دریاچه',
  mountain: 'کوهستان',
  desert: 'بیابان و کویر',
  swamp: 'باتلاق و مرداب',
  road: 'جاده و گذرگاه'
};

export const MARKER_TYPE_LABELS: Record<MapMarkerType, string> = {
  location: 'مکان و اقلیم',
  npc: 'شخصیت غیربازیکن (NPC)',
  enemy: 'دشمن / هیولا',
  character: 'شخصیت ماجراجو',
  player: 'بازیکن'
};

export const CONFLICT_ERROR_FA = 'خطای همزمانی (Conflict): نقشه توسط کاربر دیگری ویرایش شده است. لطفاً صفحه را تازه‌سازی کنید.';

/**
 * Validates text to prevent XSS payloads and ensure safe textContent usage.
 */
export function isSafeText(text: string): boolean {
  if (typeof text !== 'string') return false;
  // Deny dangerous HTML tags or script schemes
  const dangerousPatterns = /<\s*script|<\s*iframe|<\s*embed|<\s*object|javascript:|data:\s*text\/html|on[a-z]+\s*=/i;
  return !dangerousPatterns.test(text);
}

export interface MapValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a campaign map creation or update payload.
 */
export function validateCampaignMapPayload(data: Partial<CampaignMap>): MapValidationResult {
  const name = (data.name || '').trim();
  if (!name) {
    return { valid: false, error: 'نام نقشه نمی‌تواند خالی باشد.' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'نام نقشه نمی‌تواند بیش از ۱۰۰ نویسه باشد.' };
  }
  if (!isSafeText(name)) {
    return { valid: false, error: 'نام نقشه حاوی عبارت‌های غیرمجاز است.' };
  }

  if (!data.mediaId && !data.imageUrl) {
    return { valid: false, error: 'تصویر نقشه الزامی است.' };
  }

  if (data.width !== undefined && (typeof data.width !== 'number' || data.width <= 0 || !Number.isFinite(data.width))) {
    return { valid: false, error: 'عرض نقشه باید عددی مثبت باشد.' };
  }

  if (data.height !== undefined && (typeof data.height !== 'number' || data.height <= 0 || !Number.isFinite(data.height))) {
    return { valid: false, error: 'ارتفاع نقشه باید عددی مثبت باشد.' };
  }

  return { valid: true };
}

/**
 * Validates a map feature payload (terrain, region, marker, stamp).
 */
export function validateMapFeaturePayload(
  feature: Partial<MapFeature>,
  mapDimensions?: { width: number; height: number }
): MapValidationResult {
  const label = (feature.label || '').trim();
  if (!label) {
    return { valid: false, error: 'برچسب عارضه نقشه الزامی است.' };
  }
  if (label.length > 100) {
    return { valid: false, error: 'طول برچسب عارضه نمی‌تواند بیش از ۱۰۰ نویسه باشد.' };
  }
  if (!isSafeText(label)) {
    return { valid: false, error: 'برچسب عارضه حاوی عبارت‌های غیرمجاز است.' };
  }

  if (feature.description && feature.description.length > 1000) {
    return { valid: false, error: 'توضیحات عارضه نمی‌تواند بیش از ۱۰۰۰ نویسه باشد.' };
  }
  if (feature.description && !isSafeText(feature.description)) {
    return { valid: false, error: 'توضیحات عارضه حاوی عبارت‌های غیرمجاز است.' };
  }

  const kind = feature.kind;
  if (!kind || !['terrain', 'region', 'marker', 'stamp'].includes(kind)) {
    return { valid: false, error: 'نوع عارضه نقشه نامعتبر است (باید زمین، مرز، نشانه یا المان باشد).' };
  }

  // Validate geometry
  const geom = feature.geometry;
  if (!geom || typeof geom !== 'object') {
    return { valid: false, error: 'مختصات هندسی عارضه نامعتبر یا خالی است.' };
  }

  if (kind === 'terrain' || kind === 'region') {
    if (geom.type !== 'Polygon' || !Array.isArray(geom.coordinates)) {
      return { valid: false, error: 'هندسه عوارض زمین یا مرز باید از نوع پلی‌گون (Polygon) باشد.' };
    }
    const coords = geom.coordinates as [number, number][];
    if (coords.length < 3) {
      return { valid: false, error: 'پلی‌گون باید حداقل دارای ۳ نقطه مختصات باشد.' };
    }
    for (const pt of coords) {
      if (!Array.isArray(pt) || pt.length !== 2 || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
        return { valid: false, error: 'مختصات نقطه پلی‌گون باید به صورت زوج عدد [y, x] معتبر باشد.' };
      }
      if (mapDimensions) {
        if (pt[0] < 0 || pt[0] > mapDimensions.height || pt[1] < 0 || pt[1] > mapDimensions.width) {
          return { valid: false, error: `نقطه [${pt[0]}, ${pt[1]}] خارج از محدوده ابعاد نقشه است.` };
        }
      }
    }
  } else {
    // Marker or Stamp -> Point
    if (geom.type !== 'Point' || !Array.isArray(geom.coordinates)) {
      return { valid: false, error: 'هندسه نشانه‌ها و المان‌ها باید از نوع نقطه (Point) باشد.' };
    }
    const pt = geom.coordinates as [number, number];
    if (pt.length !== 2 || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
      return { valid: false, error: 'مختصات نقطه نشانه باید به صورت زوج عدد [y, x] معتبر باشد.' };
    }
    if (mapDimensions) {
      if (pt[0] < 0 || pt[0] > mapDimensions.height || pt[1] < 0 || pt[1] > mapDimensions.width) {
        return { valid: false, error: `مختصات [${pt[0]}, ${pt[1]}] خارج از محدوده ابعاد نقشه است.` };
      }
    }
  }

  // Validate kind-specific styles
  const style = feature.style || {};
  if (kind === 'terrain') {
    if (!style.terrainType || !ALLOWED_TERRAIN_TYPES.includes(style.terrainType)) {
      return { valid: false, error: 'نوع زمین نامعتبر است (باید جنگل، آب، کوه، بیابان، مرداب یا جاده باشد).' };
    }
  }

  if (kind === 'marker') {
    if (!style.markerType || !ALLOWED_MARKER_TYPES.includes(style.markerType)) {
      return { valid: false, error: 'نوع نشانه نامعتبر است (باید مکان، شخصیت غیربازیکن، دشمن، شخصیت یا بازیکن باشد).' };
    }
  }

  if (kind === 'stamp') {
    if (!style.stampId || typeof style.stampId !== 'string') {
      return { valid: false, error: 'شناسه المان (stampId) برای عارضه المان الزامی است.' };
    }
    if (style.scale !== undefined && (typeof style.scale !== 'number' || style.scale < 0.1 || style.scale > 5.0)) {
      return { valid: false, error: 'اندازه المان (scale) باید مقداری بین 0.1 تا 5.0 باشد.' };
    }
  }

  // Validate optional link
  if (feature.linkType) {
    if (!['location', 'npc', 'participation'].includes(feature.linkType)) {
      return { valid: false, error: 'نوع پیوند نامعتبر است (باید مکان، شخصیت یا کاراکتر باشد).' };
    }
    if (!feature.linkId) {
      return { valid: false, error: 'در صورت تعیین نوع پیوند، شناسه هدف (linkId) الزامی است.' };
    }
  }

  return { valid: true };
}

/**
 * Validates a map stamp payload.
 */
export function validateMapStampPayload(stamp: Partial<MapStamp>): MapValidationResult {
  const name = (stamp.name || '').trim();
  if (!name) {
    return { valid: false, error: 'نام المان نمی‌تواند خالی باشد.' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'نام المان نمی‌تواند بیش از ۱۰۰ نویسه باشد.' };
  }
  if (!isSafeText(name)) {
    return { valid: false, error: 'نام المان حاوی عبارت‌های غیرمجاز است.' };
  }
  if (!stamp.mediaId) {
    return { valid: false, error: 'فایل تصویر المان الزامی است.' };
  }
  return { valid: true };
}

/**
 * Checks optimistic concurrency revision to prevent simultaneous edit overwrites.
 */
export function checkMapConflict(
  currentRevision: number,
  expectedRevision?: number
): { hasConflict: boolean; error?: string } {
  if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
    return {
      hasConflict: true,
      error: CONFLICT_ERROR_FA
    };
  }
  return { hasConflict: false };
}

/**
 * Filters map features based on campaign role.
 * Non-DMs only receive items where isRevealed is true.
 */
export function filterMapFeaturesForRole(
  features: MapFeature[],
  role?: CampaignRole | string | null
): MapFeature[] {
  if (!Array.isArray(features)) return [];
  const isDm = role === 'owner' || role === 'co_dm';
  if (isDm) {
    return features;
  }
  return features.filter(f => Boolean(f.isRevealed));
}

/**
 * Clamps coordinates [y, x] to image boundaries [0, height] and [0, width].
 */
export function clampCoordinate(
  coord: [number, number],
  width: number,
  height: number
): [number, number] {
  const y = Math.max(0, Math.min(height, coord[0]));
  const x = Math.max(0, Math.min(width, coord[1]));
  return [Math.round(y * 10) / 10, Math.round(x * 10) / 10];
}

/**
 * Clamps all vertices of a polygon to image boundaries.
 */
export function clampPolygonCoordinates(
  coords: [number, number][],
  width: number,
  height: number
): [number, number][] {
  if (!Array.isArray(coords)) return [];
  return coords.map(pt => clampCoordinate(pt, width, height));
}

export type AllowedStampMime = 'image/png' | 'image/jpeg' | 'image/webp';
export const MAX_STAMP_BYTES = 150 * 1024; // 150 KB cap for stamps

/**
 * Detects image MIME type from binary magic bytes.
 */
export function detectImageMimeFromBytes(bytes: Uint8Array): AllowedStampMime | null {
  if (!bytes || bytes.length < 4) return null;
  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  // WebP: RIFF ... WEBP
  if (bytes.length >= 12) {
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (isRiff && isWebp) {
      return 'image/webp';
    }
  }
  return null;
}

/**
 * Validates an uploaded stamp file: size, extension, and magic bytes.
 * Strictly rejects SVG uploads.
 */
export function validateStampUploadFile(
  fileName: string,
  sizeBytes: number,
  bytes?: Uint8Array
): { valid: boolean; error?: string; detectedMime?: AllowedStampMime } {
  const lowerName = (fileName || '').toLowerCase();
  if (lowerName.endsWith('.svg')) {
    return {
      valid: false,
      error: 'فقط فایل‌های تصویری PNG، JPEG و WebP مجاز هستند. امکان آپلود فایل SVG وجود ندارد.'
    };
  }

  if (sizeBytes > MAX_STAMP_BYTES) {
    return {
      valid: false,
      error: `حجم فایل المان (${Math.round(sizeBytes / 1024)} کیلوبایت) بیش از سقف مجاز ۱۵۰ کیلوبایت است.`
    };
  }

  if (bytes && bytes.length > 0) {
    const detected = detectImageMimeFromBytes(bytes);
    if (!detected) {
      return {
        valid: false,
        error: 'قالب فایل ارسالی نامعتبر است. فقط تصویر واقعی با فرمت PNG، JPEG یا WebP پذیرفته می‌شود.'
      };
    }
    return { valid: true, detectedMime: detected };
  }

  return { valid: true };
}

/**
 * Single-step Undo state tracker for DM map operations.
 */
export interface MapEditHistory {
  previousFeatures: MapFeature[] | null;
  canUndo: boolean;
}

export function createInitialHistory(): MapEditHistory {
  return { previousFeatures: null, canUndo: false };
}

export function recordMapHistoryAction(currentFeatures: MapFeature[]): MapEditHistory {
  return {
    previousFeatures: JSON.parse(JSON.stringify(currentFeatures)),
    canUndo: true
  };
}

export function undoMapHistoryAction(
  history: MapEditHistory,
  currentFeatures: MapFeature[]
): { features: MapFeature[]; newHistory: MapEditHistory } {
  if (!history.canUndo || !history.previousFeatures) {
    return { features: currentFeatures, newHistory: history };
  }
  return {
    features: history.previousFeatures,
    newHistory: {
      previousFeatures: null,
      canUndo: false
    }
  };
}

/**
 * Detects whether an error message or error instance signifies an optimistic concurrency conflict.
 */
export function isConflictErrorMessage(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err as any).message || '';
  return msg.includes('Conflict') || msg.includes('همزمانی') || msg.includes('revision');
}

