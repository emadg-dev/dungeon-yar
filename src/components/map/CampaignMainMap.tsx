import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, ImageOverlay, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';

import {
  Plus,
  Minus,
  Maximize2,
  MapPin,
  User,
  Skull,
  Shield,
  CircleDot,
  EyeOff,
  Map as MapIcon,
  Sparkles,
  Link as LinkIcon,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';

import type { CampaignMap, MapFeature, MapStamp, MapMarkerType } from '../../types';
import { api } from '../../services/api';
import {
  getMapBounds,
  getMapMaxBounds,
  getTerrainStyle,
  getRegionBorderStyle,
  getMarkerVisualConfig,
  formatCoordinatesFa,
  toLeafletLatLng,
  type LeafletSimpleBounds
} from '../../../shared/rules/mapVisualEngine';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { BottomSheet } from '../ui/BottomSheet';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

export interface CampaignMainMapProps {
  campaignId: string;
  mapId?: string;
  isDm?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Custom Floating Zoom & FitBounds Controller.
 * Ensures touch targets are at least 44px and respect semantic tokens.
 */
const MapControls: React.FC<{ bounds: LeafletSimpleBounds }> = ({ bounds }) => {
  const map = useMap();

  const handleZoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      map.zoomIn();
    },
    [map]
  );

  const handleZoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      map.zoomOut();
    },
    [map]
  );

  const handleFitBounds = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      map.fitBounds(bounds, { animate: true, padding: [24, 24] });
    },
    [map, bounds]
  );

  return (
    <div
      className="absolute top-4 start-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
      dir="rtl"
    >
      <div className="flex flex-col bg-surface-2/95 backdrop-blur-md border border-border rounded-xl shadow-lg overflow-hidden">
        <IconButton
          icon={<Plus className="w-5 h-5" />}
          aria-label="بزرگ‌نمایی نقشه"
          title="بزرگ‌نمایی (+)"
          variant="ghost"
          size="md"
          onClick={handleZoomIn}
          className="border-b border-border/50 text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent"
        />
        <IconButton
          icon={<Minus className="w-5 h-5" />}
          aria-label="کوچک‌نمایی نقشه"
          title="کوچک‌نمایی (−)"
          variant="ghost"
          size="md"
          onClick={handleZoomOut}
          className="text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleFitBounds}
        leftIcon={<Maximize2 className="w-4 h-4 text-accent" />}
        aria-label="نمای کل نقشه"
        title="نمای کل نقشه"
        className="bg-surface-2/95 backdrop-blur-md border-border shadow-lg text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>کل نقشه</span>
      </Button>
    </div>
  );
};

/**
 * Creates safe Leaflet DivIcon for markers with Lucide icons.
 * Never injects user strings into HTML.
 */
function createMarkerDivIcon(feature: MapFeature, isDm: boolean): L.DivIcon {
  const config = getMarkerVisualConfig(feature.style?.markerType, feature.isRevealed, isDm);

  function renderIcon(type: MapMarkerType) {
    switch (type) {
      case 'npc':
        return <User className="w-5 h-5 text-info" />;
      case 'enemy':
        return <Skull className="w-5 h-5 text-danger" />;
      case 'character':
        return <Shield className="w-5 h-5 text-success" />;
      case 'player':
        return <CircleDot className="w-5 h-5 text-accent" />;
      case 'location':
      default:
        return <MapPin className="w-5 h-5 text-accent" />;
    }
  }

  const iconMarkup = renderToStaticMarkup(
    <div
      className={`relative flex items-center justify-center w-10 h-10 rounded-2xl bg-surface-2/95 border-2 ${config.borderClass} shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 ${config.isFaded ? 'opacity-60 ring-2 ring-warning/40' : ''}`}
    >
      {renderIcon(feature.style?.markerType || 'location')}
      {config.showEyeOffBadge && (
        <span
          className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-surface-sunken border border-warning flex items-center justify-center text-warning shadow-sm"
          title="مخفی برای بازیکنان"
        >
          <EyeOff className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'map-marker-icon-wrapper',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

/**
 * Creates safe Leaflet DivIcon for stamps using strictly <img> tags.
 * Never uses inline SVG.
 */
function createStampDivIcon(feature: MapFeature, stamps: MapStamp[], isDm: boolean): L.DivIcon {
  const stampDef = stamps.find(s => s.id === feature.style?.stampId);
  const imageUrl = stampDef?.imageUrl || '/stamps/fortress.svg';
  const scale = feature.style?.scale || 1;
  const width = Math.max(24, Math.min(512, Math.round((stampDef?.width || 64) * scale)));
  const height = Math.max(24, Math.min(512, Math.round((stampDef?.height || 64) * scale)));
  const isHidden = !feature.isRevealed && isDm;

  // Strict <img> rendering without inline SVG
  const stampHtml = `
    <div class="relative flex items-center justify-center ${isHidden ? 'opacity-60' : ''}" style="width: ${width}px; height: ${height}px;">
      <img src="${imageUrl}" alt="" class="w-full h-full object-contain pointer-events-auto" loading="lazy" />
      ${isHidden ? '<span class="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-surface-sunken border border-warning flex items-center justify-center text-warning text-[10px]">👁</span>' : ''}
    </div>
  `;

  return L.divIcon({
    html: stampHtml,
    className: 'map-stamp-icon-wrapper',
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), Math.round(height / 2)]
  });
}

export const CampaignMainMap: React.FC<CampaignMainMapProps> = ({
  campaignId,
  mapId,
  isDm = false,
  onClose,
  className = ''
}) => {
  const [map, setMap] = useState<CampaignMap | null>(null);
  const [stamps, setStamps] = useState<MapStamp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);

  // Load campaign map directly through Api
  const loadMapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch map stamps for rendering stamps
      const stampList = await api.getMapStamps(campaignId).catch(() => []);
      setStamps(stampList);

      // 2. If mapId provided, fetch specific map; otherwise fetch all maps and take isMain
      if (mapId) {
        const targetMap = await api.getCampaignMap(campaignId, mapId);
        if (!targetMap) {
          setError('نقشه‌ی درخواستی یافت نشد.');
          setMap(null);
        } else {
          setMap(targetMap);
        }
      } else {
        const maps = await api.getCampaignMaps(campaignId);
        const mainMap = maps.find(m => m.isMain) || maps[0] || null;
        if (!mainMap) {
          setMap(null);
        } else {
          // Fetch full map with features
          const fullMap = await api.getCampaignMap(campaignId, mainMap.id);
          setMap(fullMap || mainMap);
        }
      }
    } catch (err: any) {
      console.error('Failed to load campaign main map:', err);
      setError(err?.message || 'خطا در بارگذاری نقشه‌ی کمپین. لطفاً مجدداً تلاش کنید.');
      setMap(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, mapId]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Map Bounds derived from map dimensions
  const bounds = useMemo<LeafletSimpleBounds>(() => {
    if (!map) return [[0, 0], [1000, 1000]];
    return getMapBounds(map.width, map.height);
  }, [map]);

  const maxBounds = useMemo<LeafletSimpleBounds>(() => {
    if (!map) return [[-200, -200], [1200, 1200]];
    return getMapMaxBounds(map.width, map.height, 0.2);
  }, [map]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-surface-1 p-6 ${className}`}
        dir="rtl"
      >
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-text-muted">در حال بارگذاری نقشه‌ی کمپین...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`w-full h-full min-h-[420px] flex items-center justify-center bg-surface-1 p-6 ${className}`}
        dir="rtl"
      >
        <ErrorState
          title="خطا در دریافت نقشه"
          message={error}
          onRetry={loadMapData}
          retryLabel="تلاش مجدد"
        />
      </div>
    );
  }

  // Empty state
  if (!map || !map.imageUrl) {
    return (
      <div
        className={`w-full h-full min-h-[420px] flex items-center justify-center bg-surface-1 p-6 ${className}`}
        dir="rtl"
      >
        <EmptyState
          icon={<MapIcon className="w-8 h-8 text-text-muted" />}
          title="نقشه‌ای برای این کمپین ثبت نشده است"
          description="هنوز هیچ نقشه‌ی اصلی برای این کمپین بارگذاری یا انتخاب نشده است."
          actionLabel={onClose ? 'بازگشت' : undefined}
          onAction={onClose}
        />
      </div>
    );
  }

  const features = map.features || [];

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden bg-surface-sunken ${className}`}>
      {/* 
        Map Viewport Container.
        CRITICAL: Container MUST have dir="ltr" for Leaflet coordinate calculations.
      */}
      <div className="w-full h-full" dir="ltr">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          maxBounds={maxBounds}
          maxBoundsViscosity={0.8}
          minZoom={-2}
          maxZoom={3}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full z-0"
        >
          {/* Main Map Image Overlay */}
          <ImageOverlay url={map.imageUrl} bounds={bounds} />

          {/* Floating Controls with min 44px touch targets */}
          <MapControls bounds={bounds} />

          {/* Render Map Features */}
          {features.map(feature => {
            const geom = feature.geometry;

            // 1. Terrain Polygons
            if (feature.kind === 'terrain' && geom.type === 'Polygon') {
              const positions = geom.coordinates.map(toLeafletLatLng);
              const pathStyle = getTerrainStyle(feature.style?.terrainType, feature.style?.fillOpacity);

              return (
                <Polygon
                  key={feature.id}
                  positions={positions}
                  pathOptions={pathStyle}
                  eventHandlers={{
                    click: () => setSelectedFeature(feature)
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip">
                    {feature.label}
                  </Tooltip>
                </Polygon>
              );
            }

            // 2. Region Border Polygons
            if (feature.kind === 'region' && geom.type === 'Polygon') {
              const positions = geom.coordinates.map(toLeafletLatLng);
              const borderStyle = getRegionBorderStyle(feature.style);

              return (
                <Polygon
                  key={feature.id}
                  positions={positions}
                  pathOptions={borderStyle}
                  eventHandlers={{
                    click: () => setSelectedFeature(feature)
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip">
                    {feature.label}
                  </Tooltip>
                </Polygon>
              );
            }

            // 3. Markers (Location, NPC, Enemy, Character, Player)
            if (feature.kind === 'marker' && geom.type === 'Point') {
              const position = toLeafletLatLng(geom.coordinates);
              const icon = createMarkerDivIcon(feature, isDm);

              return (
                <Marker
                  key={feature.id}
                  position={position}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedFeature(feature)
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip" offset={[0, -22]}>
                    {feature.label}
                  </Tooltip>
                </Marker>
              );
            }

            // 4. Stamps
            if (feature.kind === 'stamp' && geom.type === 'Point') {
              const position = toLeafletLatLng(geom.coordinates);
              const stampIcon = createStampDivIcon(feature, stamps, isDm);

              return (
                <Marker
                  key={feature.id}
                  position={position}
                  icon={stampIcon}
                  eventHandlers={{
                    click: () => setSelectedFeature(feature)
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip" offset={[0, -16]}>
                    {feature.label}
                  </Tooltip>
                </Marker>
              );
            }

            return null;
          })}
        </MapContainer>
      </div>

      {/* Feature Information Bottom Sheet (Pure Text & Tokens) */}
      <BottomSheet
        isOpen={Boolean(selectedFeature)}
        onClose={() => setSelectedFeature(null)}
        title={selectedFeature?.label || 'مشخصات عارضه'}
        description={
          selectedFeature && (
            <span className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
              <Compass className="w-3.5 h-3.5" />
              <span>
                {selectedFeature.geometry.type === 'Point'
                  ? formatCoordinatesFa(selectedFeature.geometry.coordinates)
                  : `${selectedFeature.geometry.coordinates.length} نقطه ثبت‌شده`}
              </span>
            </span>
          )
        }
      >
        {selectedFeature && (
          <div className="space-y-4 py-2" dir="rtl">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Kind Badge */}
              <Badge variant="neutral">
                {selectedFeature.kind === 'terrain'
                  ? 'عارضه طبیعی (زمین)'
                  : selectedFeature.kind === 'region'
                  ? 'مرز قلمرو'
                  : selectedFeature.kind === 'stamp'
                  ? 'المان دژ/سازه'
                  : 'نشانگر'}
              </Badge>

              {/* Subtype Badge */}
              {selectedFeature.style?.terrainType && (
                <Badge variant="accent">
                  نوع زمین: {selectedFeature.style.terrainType}
                </Badge>
              )}
              {selectedFeature.style?.markerType && (
                <Badge variant="info">
                  {getMarkerVisualConfig(selectedFeature.style.markerType).labelFa}
                </Badge>
              )}

              {/* Reveal status */}
              {!selectedFeature.isRevealed ? (
                <Badge variant="warning">
                  <EyeOff className="w-3 h-3 ms-1" />
                  مخفی برای بازیکنان (فقط DM)
                </Badge>
              ) : (
                <Badge variant="success">نمایش برای همگان</Badge>
              )}
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl bg-surface-2 border border-border">
              <h4 className="text-xs font-semibold text-text-muted mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-accent" />
                توضیحات و یادداشت اقلیمی
              </h4>
              <p className="text-sm text-text-primary leading-relaxed">
                {selectedFeature.description || 'توضیحات تکمیلی برای این نقطه ثبت نشده است.'}
              </p>
            </div>

            {/* Entity Link if exists */}
            {selectedFeature.linkType && selectedFeature.linkId && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-accent" />
                  <span className="text-xs text-text-primary">
                    پیوند به {selectedFeature.linkType === 'location' ? 'مکان' : selectedFeature.linkType === 'npc' ? 'شخصیت داستانی' : 'مورد مرتبط'}:
                  </span>
                  <span className="text-xs font-bold text-accent">{selectedFeature.linkId}</span>
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedFeature(null)}
                className="w-full sm:w-auto"
              >
                بستن
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
