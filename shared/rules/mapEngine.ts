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
