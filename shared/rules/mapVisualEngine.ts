import type { MapTerrainType, MapMarkerType, MapFeatureStyle } from '../../src/types';
import { toPersianDigits } from './historyEngine';

export type LeafletSimpleBounds = [[number, number], [number, number]];

/**
 * Calculates Leaflet CRS.Simple bounds from image width and height.
 * In CRS.Simple, coordinates are [y, x].
 * SW = [0, 0], NE = [height, width].
 */
export function getMapBounds(width: number, height: number): LeafletSimpleBounds {
  const safeW = Math.max(1, Number(width) || 1000);
  const safeH = Math.max(1, Number(height) || 1000);
  return [[0, 0], [safeH, safeW]];
}

/**
 * Calculates max panning bounds with generous margin factor so users can pan slightly past edges.
 */
export function getMapMaxBounds(width: number, height: number, marginRatio = 0.25): LeafletSimpleBounds {
  const safeW = Math.max(1, Number(width) || 1000);
  const safeH = Math.max(1, Number(height) || 1000);
  const marginY = safeH * marginRatio;
  const marginX = safeW * marginRatio;
  return [
    [-marginY, -marginX],
    [safeH + marginY, safeW + marginX]
  ];
}

/**
 * Style mapping for terrain polygons based on semantic theme tokens.
 * Zero raw hex colors or inline style overrides.
 */
export interface TerrainPathOptions {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  dashArray?: string;
  className: string;
}

export function getTerrainStyle(terrainType?: MapTerrainType, customOpacity?: number): TerrainPathOptions {
  const baseOpacity = typeof customOpacity === 'number' ? Math.max(0.1, Math.min(1, customOpacity)) : 0.35;

  switch (terrainType) {
    case 'forest':
      return {
        color: 'var(--color-terrain-forest)',
        fillColor: 'var(--color-terrain-forest)',
        fillOpacity: baseOpacity,
        weight: 2,
        className: 'map-terrain-forest'
      };
    case 'water':
      return {
        color: 'var(--color-terrain-water)',
        fillColor: 'var(--color-terrain-water)',
        fillOpacity: Math.min(0.6, baseOpacity + 0.05),
        weight: 2,
        className: 'map-terrain-water'
      };
    case 'mountain':
      return {
        color: 'var(--color-terrain-mountain)',
        fillColor: 'var(--color-terrain-mountain)',
        fillOpacity: Math.min(0.6, baseOpacity + 0.05),
        weight: 2,
        className: 'map-terrain-mountain'
      };
    case 'desert':
      return {
        color: 'var(--color-terrain-desert)',
        fillColor: 'var(--color-terrain-desert)',
        fillOpacity: baseOpacity,
        weight: 2,
        className: 'map-terrain-desert'
      };
    case 'swamp':
      return {
        color: 'var(--color-terrain-swamp)',
        fillColor: 'var(--color-terrain-swamp)',
        fillOpacity: Math.min(0.6, baseOpacity + 0.05),
        weight: 2,
        className: 'map-terrain-swamp'
      };
    case 'road':
      return {
        color: 'var(--color-terrain-road)',
        fillColor: 'var(--color-terrain-road)',
        fillOpacity: Math.max(0.15, baseOpacity - 0.1),
        weight: 3.5,
        dashArray: '8, 4',
        className: 'map-terrain-road'
      };
    default:
      return {
        color: 'var(--color-terrain-road)',
        fillColor: 'var(--color-terrain-road)',
        fillOpacity: baseOpacity,
        weight: 2,
        className: 'map-terrain-default'
      };
  }
}

/**
 * Style mapping for region border polygons.
 */
export function getRegionBorderStyle(style?: MapFeatureStyle): TerrainPathOptions {
  return {
    color: 'var(--color-region-border)',
    fillColor: 'transparent',
    fillOpacity: 0,
    weight: style?.strokeWidth ?? 2.5,
    dashArray: style?.strokeDasharray || '6, 6',
    className: 'map-region-border'
  };
}

/**
 * Marker configuration: metadata, Persian labels, and theme classes.
 */
export interface MarkerVisualConfig {
  markerType: MapMarkerType;
  labelFa: string;
  iconName: 'MapPin' | 'User' | 'Skull' | 'Shield' | 'CircleDot';
  bgClass: string;
  borderClass: string;
  textClass: string;
  isFaded: boolean;
  showEyeOffBadge: boolean;
}

export function getMarkerVisualConfig(
  markerType: MapMarkerType = 'location',
  isRevealed = true,
  isDm = false
): MarkerVisualConfig {
  const isHiddenForPlayer = !isRevealed;
  const isFaded = isHiddenForPlayer && isDm;
  const showEyeOffBadge = isHiddenForPlayer && isDm;

  switch (markerType) {
    case 'npc':
      return {
        markerType: 'npc',
        labelFa: 'شخصیت داستانی (NPC)',
        iconName: 'User',
        bgClass: 'bg-surface-2',
        borderClass: 'border-info',
        textClass: 'text-info',
        isFaded,
        showEyeOffBadge
      };
    case 'enemy':
      return {
        markerType: 'enemy',
        labelFa: 'دشمن / تهدید',
        iconName: 'Skull',
        bgClass: 'bg-surface-2',
        borderClass: 'border-danger',
        textClass: 'text-danger',
        isFaded,
        showEyeOffBadge
      };
    case 'character':
      return {
        markerType: 'character',
        labelFa: 'کاراکتر',
        iconName: 'Shield',
        bgClass: 'bg-surface-2',
        borderClass: 'border-success',
        textClass: 'text-success',
        isFaded,
        showEyeOffBadge
      };
    case 'player':
      return {
        markerType: 'player',
        labelFa: 'بازیکن',
        iconName: 'CircleDot',
        bgClass: 'bg-surface-2',
        borderClass: 'border-accent',
        textClass: 'text-accent',
        isFaded,
        showEyeOffBadge
      };
    case 'location':
    default:
      return {
        markerType: 'location',
        labelFa: 'مکان',
        iconName: 'MapPin',
        bgClass: 'bg-surface-2',
        borderClass: 'border-accent',
        textClass: 'text-accent',
        isFaded,
        showEyeOffBadge
      };
  }
}

/**
 * Safely converts [x, y] or [y, x] to Leaflet CRS.Simple [y, x] coordinate.
 */
export function toLeafletLatLng(coords: [number, number]): [number, number] {
  return [Number(coords[0]) || 0, Number(coords[1]) || 0];
}

/**
 * Convert Latin digits to Persian digits.
 */
export function toPersianNum(n: number | string): string {
  if (n === null || n === undefined) return '';
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, w => pDigits[Number(w)]);
}

/**
 * Format coordinates for Persian UI inspection.
 */
export function formatCoordinatesFa(coords: [number, number]): string {
  const y = toPersianNum(Math.round(coords[0]));
  const x = toPersianNum(Math.round(coords[1]));
  return `مختصات: (عرض: ${y}، طول: ${x})`;
}
