import { describe, it, expect } from 'vitest';
import {
  getMapBounds,
  getMapMaxBounds,
  getTerrainStyle,
  getRegionBorderStyle,
  getMarkerVisualConfig,
  formatCoordinatesFa,
  toLeafletLatLng
} from './mapVisualEngine';

describe('MapVisualEngine Pure Logic', () => {
  describe('1. Coordinate and Bounds Calculations', () => {
    it('calculates correct CRS.Simple bounds [[0,0], [height, width]]', () => {
      const bounds = getMapBounds(2000, 1400);
      expect(bounds).toEqual([[0, 0], [1400, 2000]]);
    });

    it('falls back gracefully to positive bounds if negative or zero dimensions passed', () => {
      const bounds = getMapBounds(0, -100);
      expect(bounds[1][0]).toBeGreaterThan(0);
      expect(bounds[1][1]).toBeGreaterThan(0);
    });

    it('calculates padded max bounds for smooth boundary panning', () => {
      const maxBounds = getMapMaxBounds(2000, 1000, 0.2);
      expect(maxBounds[0][0]).toBe(-200); // -1000 * 0.2
      expect(maxBounds[0][1]).toBe(-400); // -2000 * 0.2
      expect(maxBounds[1][0]).toBe(1200); // 1000 + 200
      expect(maxBounds[1][1]).toBe(2400); // 2000 + 400
    });

    it('transforms coordinate pairs safely into numbers', () => {
      const point = toLeafletLatLng([520.4, 680.9]);
      expect(point).toEqual([520.4, 680.9]);
    });

    it('formats coordinates in Persian digits', () => {
      const text = formatCoordinatesFa([500, 300]);
      expect(text).toContain('۵۰۰');
      expect(text).toContain('۳۰۰');
      expect(text).toContain('مختصات');
    });
  });

  describe('2. Terrain Path & Semantic Tokens Mapping', () => {
    it('maps forest terrain to --color-terrain-forest without hardcoded hex', () => {
      const style = getTerrainStyle('forest', 0.4);
      expect(style.color).toBe('var(--color-terrain-forest)');
      expect(style.fillColor).toBe('var(--color-terrain-forest)');
      expect(style.fillOpacity).toBe(0.4);
      expect(style.className).toBe('map-terrain-forest');
    });

    it('maps water terrain to --color-terrain-water', () => {
      const style = getTerrainStyle('water');
      expect(style.color).toBe('var(--color-terrain-water)');
      expect(style.className).toBe('map-terrain-water');
      expect(style.fillOpacity).toBeGreaterThan(0.3);
    });

    it('maps mountain, desert, swamp and road', () => {
      expect(getTerrainStyle('mountain').color).toBe('var(--color-terrain-mountain)');
      expect(getTerrainStyle('desert').color).toBe('var(--color-terrain-desert)');
      expect(getTerrainStyle('swamp').color).toBe('var(--color-terrain-swamp)');
      const road = getTerrainStyle('road');
      expect(road.color).toBe('var(--color-terrain-road)');
      expect(road.dashArray).toBeDefined();
    });

    it('differentiates hidden terrain for DM with lower opacity and dash border', () => {
      const revealed = getTerrainStyle('forest', 0.4, true, true);
      const hidden = getTerrainStyle('forest', 0.4, false, true);

      expect(hidden.fillOpacity).toBeLessThan(revealed.fillOpacity);
      expect(hidden.dashArray).toBeDefined();
      expect(hidden.className).toContain('opacity-60');
    });

    it('handles region borders with stroke-dasharray and semantic border token', () => {
      const style = getRegionBorderStyle({ strokeWidth: 3, strokeDasharray: '4,4' });
      expect(style.color).toBe('var(--color-region-border)');
      expect(style.fillColor).toBe('transparent');
      expect(style.fillOpacity).toBe(0);
      expect(style.weight).toBe(3);
      expect(style.dashArray).toBe('4,4');
      expect(style.className).toBe('map-region-border');
    });

    it('differentiates hidden region borders for DM with custom dash and opacity', () => {
      const hiddenBorder = getRegionBorderStyle({ strokeWidth: 3 }, false, true);
      expect(hiddenBorder.className).toContain('opacity-60');
      expect(hiddenBorder.dashArray).toBe('3, 6');
    });
  });

  describe('3. Marker Configuration & Role Visual Differentiation', () => {
    it('maps marker types to corresponding Lucide icon names and semantic styles', () => {
      const loc = getMarkerVisualConfig('location', true, false);
      expect(loc.iconName).toBe('MapPin');
      expect(loc.borderClass).toBe('border-accent');

      const npc = getMarkerVisualConfig('npc', true, false);
      expect(npc.iconName).toBe('User');
      expect(npc.borderClass).toBe('border-info');

      const enemy = getMarkerVisualConfig('enemy', true, false);
      expect(enemy.iconName).toBe('Skull');
      expect(enemy.borderClass).toBe('border-danger');

      const char = getMarkerVisualConfig('character', true, false);
      expect(char.iconName).toBe('Shield');
      expect(char.borderClass).toBe('border-success');

      const player = getMarkerVisualConfig('player', true, false);
      expect(player.iconName).toBe('CircleDot');
      expect(player.borderClass).toBe('border-accent');
    });

    it('flags hidden items for DM with faded opacity and eye-off badge', () => {
      // Hidden item viewed by DM
      const dmView = getMarkerVisualConfig('location', false, true);
      expect(dmView.isFaded).toBe(true);
      expect(dmView.showEyeOffBadge).toBe(true);

      // Revealed item viewed by DM
      const dmRevealed = getMarkerVisualConfig('location', true, true);
      expect(dmRevealed.isFaded).toBe(false);
      expect(dmRevealed.showEyeOffBadge).toBe(false);

      // Player view (hidden items shouldn't have showEyeOffBadge)
      const playerView = getMarkerVisualConfig('location', false, false);
      expect(playerView.showEyeOffBadge).toBe(false);
    });
  });
});
