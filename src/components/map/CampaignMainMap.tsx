import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, ImageOverlay, Polygon, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

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
  Info,
  PenTool,
  Move,
  Undo2,
  CheckCircle2,
  Loader2,
  X,
  Layers,
  Stamp as StampIcon,
  RotateCw,
  RefreshCw,
  Sliders
} from 'lucide-react';

import type {
  CampaignMap,
  MapFeature,
  MapStamp,
  MapMarkerType,
  MapTerrainType,
  MapFeatureKind
} from '../../types';
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
import {
  clampCoordinate,
  clampPolygonCoordinates,
  validateMapFeaturePayload,
  createInitialHistory,
  recordMapHistoryAction,
  undoMapHistoryAction,
  isConflictErrorMessage,
  CONFLICT_ERROR_FA,
  ALLOWED_TERRAIN_TYPES,
  ALLOWED_MARKER_TYPES,
  TERRAIN_TYPE_LABELS,
  MARKER_TYPE_LABELS,
  type MapEditHistory
} from '../../../shared/rules/mapEngine';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { BottomSheet } from '../ui/BottomSheet';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { MapFeatureEditSheet } from './MapFeatureEditSheet';
import { StampLibraryModal } from './StampLibraryModal';

export interface CampaignMainMapProps {
  campaignId: string;
  mapId?: string;
  isDm?: boolean;
  onClose?: () => void;
  className?: string;
}

type ActiveDmTool =
  | 'none'
  | 'terrain'
  | 'region'
  | 'marker'
  | 'stamp'
  | 'edit_geometry';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

/**
 * Floating Zoom & FitBounds Controller (>= 44px).
 */
const MapControls: React.FC<{ bounds: LeafletSimpleBounds }> = ({ bounds }) => {
  const map = useMap();

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
          onClick={e => {
            e.stopPropagation();
            map.zoomIn();
          }}
          className="border-b border-border/50 text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent"
        />
        <IconButton
          icon={<Minus className="w-5 h-5" />}
          aria-label="کوچک‌نمایی نقشه"
          title="کوچک‌نمایی (−)"
          variant="ghost"
          size="md"
          onClick={e => {
            e.stopPropagation();
            map.zoomOut();
          }}
          className="text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={e => {
          e.stopPropagation();
          map.fitBounds(bounds, { animate: true, padding: [24, 24] });
        }}
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
 * Leaflet DivIcon for Lucide markers. Never injects user strings into HTML.
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
      className={`relative flex items-center justify-center w-10 h-10 rounded-2xl bg-surface-2/95 border-2 ${config.borderClass} shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 ${
        config.isFaded ? 'opacity-60 ring-2 ring-warning/40' : ''
      }`}
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
 * Leaflet DivIcon for stamps using strictly <img> tags (never inline SVG).
 */
function createStampDivIcon(feature: MapFeature, stamps: MapStamp[], isDm: boolean): L.DivIcon {
  const stampDef = stamps.find(s => s.id === feature.style?.stampId);
  const imageUrl = stampDef?.imageUrl || '/stamps/fortress.svg';
  const scale = feature.style?.scale || 1;
  const width = Math.max(24, Math.min(512, Math.round((stampDef?.width || 64) * scale)));
  const height = Math.max(24, Math.min(512, Math.round((stampDef?.height || 64) * scale)));
  const isHidden = !feature.isRevealed && isDm;

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

/**
 * Geoman Interaction & Event Controller.
 * Mounts inside MapContainer to access map instance.
 */
interface GeomanEditorProps {
  activeTool: ActiveDmTool;
  activeTerrainType: MapTerrainType;
  activeMarkerType: MapMarkerType;
  pendingStamp: { stamp: MapStamp; scale: number } | null;
  mapDimensions: { width: number; height: number };
  onFeatureCreated: (feature: MapFeature) => void;
  onGeometryEdited: (featureId: string, newCoords: [number, number] | [number, number][]) => void;
  onCancelTool: () => void;
}

const GeomanEditorBridge: React.FC<GeomanEditorProps> = ({
  activeTool,
  activeTerrainType,
  activeMarkerType,
  pendingStamp,
  mapDimensions,
  onFeatureCreated,
  onGeometryEdited,
  onCancelTool
}) => {
  const map = useMap();

  // Handle Tool activation
  useEffect(() => {
    const pm = (map as any).pm;
    if (!pm) return;

    // First disable all drawing modes
    pm.disableDraw();

    if (activeTool === 'terrain') {
      pm.enableDraw('Polygon', {
        snappable: true,
        snapDistance: 20,
        allowSelfIntersection: false,
        templineStyle: { color: 'var(--color-accent)' },
        hintlineStyle: { color: 'var(--color-accent)', dashArray: [5, 5] }
      });
    } else if (activeTool === 'region') {
      pm.enableDraw('Polygon', {
        snappable: true,
        snapDistance: 20,
        allowSelfIntersection: false,
        templineStyle: { color: 'var(--color-region-border)' },
        hintlineStyle: { color: 'var(--color-region-border)', dashArray: [5, 5] }
      });
    } else if (activeTool === 'marker') {
      pm.enableDraw('Marker', { snappable: true });
    } else if (activeTool === 'stamp') {
      pm.enableDraw('Marker', { snappable: true });
    } else if (activeTool === 'edit_geometry') {
      pm.toggleGlobalEditMode({ snappable: true });
    } else {
      pm.disableGlobalEditMode();
    }

    return () => {
      pm.disableDraw();
      if (activeTool === 'edit_geometry') {
        pm.disableGlobalEditMode();
      }
    };
  }, [map, activeTool]);

  // Handle pm:create event (Creation of new shapes)
  useEffect(() => {
    const handlePmCreate = (e: any) => {
      const layer = e.layer;
      if (!layer) return;

      let created: MapFeature | null = null;
      const id = `feat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      if (activeTool === 'terrain' || activeTool === 'region') {
        const rawLatLngs = layer.getLatLngs();
        const flat: L.LatLng[] = Array.isArray(rawLatLngs[0]) ? rawLatLngs[0] : rawLatLngs;
        const coords: [number, number][] = flat.map((ll: any) => [ll.lat, ll.lng]);
        const clamped = clampPolygonCoordinates(coords, mapDimensions.width, mapDimensions.height);

        created = {
          id,
          mapId: '',
          campaignId: '',
          kind: activeTool === 'terrain' ? 'terrain' : 'region',
          label:
            activeTool === 'terrain'
              ? `${TERRAIN_TYPE_LABELS[activeTerrainType]} جدید`
              : 'مرز قلمرو جدید',
          description: null,
          geometry: {
            type: 'Polygon',
            coordinates: clamped
          },
          style:
            activeTool === 'terrain'
              ? { terrainType: activeTerrainType }
              : { strokeDasharray: '6, 6' },
          isRevealed: false,
          updatedAt: Date.now()
        };
      } else if (activeTool === 'marker') {
        const latLng = layer.getLatLng();
        const clamped = clampCoordinate([latLng.lat, latLng.lng], mapDimensions.width, mapDimensions.height);

        created = {
          id,
          mapId: '',
          campaignId: '',
          kind: 'marker',
          label: `${MARKER_TYPE_LABELS[activeMarkerType]} جدید`,
          description: null,
          geometry: {
            type: 'Point',
            coordinates: clamped
          },
          style: { markerType: activeMarkerType },
          isRevealed: false,
          updatedAt: Date.now()
        };
      } else if (activeTool === 'stamp' && pendingStamp) {
        const latLng = layer.getLatLng();
        const clamped = clampCoordinate([latLng.lat, latLng.lng], mapDimensions.width, mapDimensions.height);

        created = {
          id,
          mapId: '',
          campaignId: '',
          kind: 'stamp',
          label: pendingStamp.stamp.name,
          description: null,
          geometry: {
            type: 'Point',
            coordinates: clamped
          },
          style: { stampId: pendingStamp.stamp.id, scale: pendingStamp.scale },
          isRevealed: false,
          updatedAt: Date.now()
        };
      }

      // Immediately remove temporary Geoman layer and let React render the real feature from state
      map.removeLayer(layer);
      (map as any).pm?.disableDraw();

      if (created) {
        onFeatureCreated(created);
      }
    };

    map.on('pm:create', handlePmCreate);
    return () => {
      map.off('pm:create', handlePmCreate);
    };
  }, [map, activeTool, activeTerrainType, activeMarkerType, pendingStamp, mapDimensions, onFeatureCreated]);

  // Handle geometry edit events on existing layers
  useEffect(() => {
    const handlePmEdit = (e: any) => {
      const layer = e.layer;
      const featureId = (layer as any)?.featureId;
      if (!featureId) return;

      if (layer.getLatLngs) {
        const raw = layer.getLatLngs();
        const flat: L.LatLng[] = Array.isArray(raw[0]) ? raw[0] : raw;
        const coords: [number, number][] = flat.map((ll: any) => [ll.lat, ll.lng]);
        const clamped = clampPolygonCoordinates(coords, mapDimensions.width, mapDimensions.height);
        onGeometryEdited(featureId, clamped);
      } else if (layer.getLatLng) {
        const ll = layer.getLatLng();
        const clamped = clampCoordinate([ll.lat, ll.lng], mapDimensions.width, mapDimensions.height);
        onGeometryEdited(featureId, clamped);
      }
    };

    map.on('pm:edit', handlePmEdit);
    return () => {
      map.off('pm:edit', handlePmEdit);
    };
  }, [map, mapDimensions, onGeometryEdited]);

  // Escape key handler to cancel active tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTool !== 'none') {
        (map as any)?.pm?.disableDraw();
        (map as any)?.pm?.disableGlobalEditMode();
        onCancelTool();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map, activeTool, onCancelTool]);

  return null;
};

export const CampaignMainMap: React.FC<CampaignMainMapProps> = ({
  campaignId,
  mapId,
  isDm = false,
  onClose,
  className = ''
}) => {
  const [map, setMap] = useState<CampaignMap | null>(null);
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [stamps, setStamps] = useState<MapStamp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // DM Tooling State
  const [activeTool, setActiveTool] = useState<ActiveDmTool>('none');
  const [activeTerrainType, setActiveTerrainType] = useState<MapTerrainType>('forest');
  const [activeMarkerType, setActiveMarkerType] = useState<MapMarkerType>('location');
  const [pendingStamp, setPendingStamp] = useState<{ stamp: MapStamp; scale: number } | null>(null);

  // Panels & Modals
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [isStampLibraryOpen, setIsStampLibraryOpen] = useState(false);
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState(false);
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [newMapForm, setNewMapForm] = useState({
    name: 'نقشه اصلی کمپین',
    imageUrl: '/maps/zorvania-main.svg',
    width: 1000,
    height: 1000
  });

  // Concurrency & Autosave
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const saveQueueRef = useRef<Promise<any>>(Promise.resolve());

  // Undo History
  const [history, setHistory] = useState<MapEditHistory>(createInitialHistory());

  // Load campaign map directly through Api
  const loadMapData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConflictError(null);
    try {
      const stampList = await api.getMapStamps(campaignId).catch(() => []);
      setStamps(stampList);

      let targetMap: CampaignMap | null = null;
      if (mapId) {
        targetMap = await api.getCampaignMap(campaignId, mapId);
      } else {
        const maps = await api.getCampaignMaps(campaignId);
        const main = maps.find(m => m.isMain) || maps[0] || null;
        if (main) {
          targetMap = await api.getCampaignMap(campaignId, main.id);
        }
      }

      if (!targetMap) {
        setMap(null);
        setFeatures([]);
      } else {
        setMap(targetMap);
        setFeatures(targetMap.features || []);
        setHistory(createInitialHistory());
      }
    } catch (err: any) {
      console.error('Failed to load campaign main map:', err);
      setError(err?.message || 'خطا در بارگذاری نقشه‌ی کمپین.');
      setMap(null);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, mapId]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Debounced Autosave (700ms) with sequential promise queue & optimistic revision check
  const scheduleSave = useCallback(() => {
    if (!isDm || !map) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSaveStatus('saving');
    setConflictError(null);

    saveTimeoutRef.current = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .then(async () => {
          const updatedMap = await api.updateCampaignMap(campaignId, map.id, {
            expectedRevision: map.revision
          });

          // Sync revision directly from response
          if (updatedMap && typeof updatedMap.revision === 'number') {
            setMap(prev => (prev ? { ...prev, revision: updatedMap.revision } : null));
          } else {
            setMap(prev => (prev ? { ...prev, revision: (prev.revision || 1) + 1 } : null));
          }
          setSaveStatus('saved');

          setTimeout(() => {
            setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
          }, 2000);
        })
        .catch((err: any) => {
          console.error('Autosave map error:', err);
          if (isConflictErrorMessage(err)) {
            setSaveStatus('conflict');
            setConflictError(CONFLICT_ERROR_FA);
          } else {
            setSaveStatus('error');
          }
        });
    }, 700);
  }, [campaignId, isDm, map]);

  // Feature Operations with Undo recording
  const handleFeatureCreated = useCallback(
    async (newFeature: MapFeature) => {
      if (!map) return;
      newFeature.mapId = map.id;
      newFeature.campaignId = campaignId;

      // Record Undo
      setHistory(recordMapHistoryAction(features));

      try {
        const saved = await api.createMapFeature(campaignId, map.id, newFeature);
        const updated = [...features, saved];
        setFeatures(updated);
        setMap(prev => (prev ? { ...prev, revision: (prev.revision || 1) + 1 } : null));
        setSelectedFeature(saved);
        setActiveTool('none');
      } catch (err: any) {
        console.error('Failed to create map feature:', err);
      }
    },
    [campaignId, map, features]
  );

  const handleUpdateFeature = useCallback(
    async (updated: MapFeature) => {
      if (!map) return;
      // Record Undo
      setHistory(recordMapHistoryAction(features));

      try {
        const saved = await api.updateMapFeature(campaignId, map.id, updated.id, {
          ...updated,
          expectedRevision: map.revision
        });
        const updatedList = features.map(f => (f.id === saved.id ? saved : f));
        setFeatures(updatedList);
        setMap(prev => (prev ? { ...prev, revision: (prev.revision || 1) + 1 } : null));
        setSelectedFeature(null);
      } catch (err: any) {
        console.error('Failed to update map feature:', err);
        if (isConflictErrorMessage(err)) {
          setConflictError(CONFLICT_ERROR_FA);
          setSaveStatus('conflict');
        }
      }
    },
    [campaignId, map, features]
  );

  const handleDeleteFeature = useCallback(
    async (featureId: string) => {
      if (!map) return;
      // Record Undo
      setHistory(recordMapHistoryAction(features));

      try {
        await api.deleteMapFeature(campaignId, map.id, featureId);
        const updated = features.filter(f => f.id !== featureId);
        setFeatures(updated);
        setMap(prev => (prev ? { ...prev, revision: (prev.revision || 1) + 1 } : null));
        setSelectedFeature(null);
      } catch (err: any) {
        console.error('Failed to delete map feature:', err);
      }
    },
    [campaignId, map, features]
  );

  // Silent Geometry Editing (without destroying edit handles)
  const handleGeometryEdited = useCallback(
    (featureId: string, newCoords: [number, number] | [number, number][]) => {
      if (!map) return;
      setFeatures(prev =>
        prev.map(f => {
          if (f.id !== featureId) return f;
          if (f.geometry.type === 'Polygon' && Array.isArray(newCoords[0])) {
            return {
              ...f,
              geometry: { type: 'Polygon', coordinates: newCoords as [number, number][] }
            };
          }
          if (f.geometry.type === 'Point' && !Array.isArray(newCoords[0])) {
            return {
              ...f,
              geometry: { type: 'Point', coordinates: newCoords as [number, number] }
            };
          }
          return f;
        })
      );
      // Trigger debounced save
      scheduleSave();
    },
    [map, scheduleSave]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (!history.canUndo || !history.previousFeatures) return;
    const result = undoMapHistoryAction(history, features);
    setFeatures(result.features);
    setHistory(result.newHistory);
    scheduleSave();
  }, [history, features, scheduleSave]);

  const handleCreateMap = async () => {
    if (!newMapForm.name.trim() || !newMapForm.imageUrl.trim()) return;
    setIsCreatingMap(true);
    try {
      const created = await api.createCampaignMap(campaignId, {
        name: newMapForm.name.trim(),
        imageUrl: newMapForm.imageUrl.trim(),
        width: newMapForm.width,
        height: newMapForm.height,
        isMain: true
      });
      setMap(created);
      setFeatures(created.features || []);
      setIsCreateMapModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create campaign map:', err);
      setError(err?.message || 'خطا در ایجاد نقشه کمپین.');
    } finally {
      setIsCreatingMap(false);
    }
  };

  // Bounds derived from map dimensions
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
          icon={<MapIcon className="w-8 h-8 text-accent" />}
          title={isDm ? 'نقشه‌ای برای این کمپین ثبت نشده است' : 'نقشه‌ای منتشر نشده است'}
          description={
            isDm
              ? 'برای شروع ترسیم قلمرو و نشانه‌گذاری عوارض جغرافیایی، نقشه اصلی کمپین را ایجاد یا بارگذاری کنید.'
              : 'دانجن مستر هنوز نقشه‌ای برای این کمپین بارگذاری یا منتشر نکرده است.'
          }
          actionLabel={isDm ? 'ایجاد یا بارگذاری نقشه' : onClose ? 'بازگشت' : undefined}
          onAction={isDm ? () => setIsCreateMapModalOpen(true) : onClose}
        />

        {isDm && (
          <Dialog
            isOpen={isCreateMapModalOpen}
            onClose={() => setIsCreateMapModalOpen(false)}
            title="ایجاد نقشه‌ی اصلی کمپین"
            description="مشخصات نقشه را وارد کنید تا بوم جغرافیایی کمپین راه‌اندازی شود."
            confirmLabel="ایجاد نقشه"
            cancelLabel="انصراف"
            onConfirm={handleCreateMap}
            isConfirmLoading={isCreatingMap}
            maxWidth="md"
          >
            <div className="space-y-4 py-2" dir="rtl">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  نام نقشه
                </label>
                <Input
                  value={newMapForm.name}
                  onChange={e => setNewMapForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: نقشه قاره زروانیا"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  آدرس تصویر نقشه
                </label>
                <Input
                  value={newMapForm.imageUrl}
                  onChange={e => setNewMapForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="/maps/zorvania-main.svg یا آدرس تصویر"
                  dir="ltr"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  می‌توانید از فایل پیش‌فرض <code>/maps/zorvania-main.svg</code> یا تصویر بارگذاری‌شده استفاده نمایید.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    عرض (پیکسل)
                  </label>
                  <Input
                    type="number"
                    min={200}
                    max={10000}
                    value={newMapForm.width}
                    onChange={e => setNewMapForm(prev => ({ ...prev, width: Number(e.target.value) || 1000 }))}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    ارتفاع (پیکسل)
                  </label>
                  <Input
                    type="number"
                    min={200}
                    max={10000}
                    value={newMapForm.height}
                    onChange={e => setNewMapForm(prev => ({ ...prev, height: Number(e.target.value) || 1000 }))}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden bg-surface-sunken select-none ${className}`}>
      {/* Optional Floating Close Button */}
      {onClose && (
        <div className="absolute top-4 end-4 z-[1000] pointer-events-auto" dir="rtl">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="w-4 h-4" />}
            aria-label="بستن نقشه"
            className="bg-surface-2/95 backdrop-blur-md border-border shadow-lg text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
          >
            <span>بستن</span>
          </Button>
        </div>
      )}

      {/* 
        Map Viewport Container (dir="ltr" required by Leaflet)
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

          {/* Floating Navigation Controls */}
          <MapControls bounds={bounds} />

          {/* Geoman DM Bridge Controller */}
          {isDm && (
            <GeomanEditorBridge
              activeTool={activeTool}
              activeTerrainType={activeTerrainType}
              activeMarkerType={activeMarkerType}
              pendingStamp={pendingStamp}
              mapDimensions={{ width: map.width, height: map.height }}
              onFeatureCreated={handleFeatureCreated}
              onGeometryEdited={handleGeometryEdited}
              onCancelTool={() => setActiveTool('none')}
            />
          )}

          {/* Render Features from state */}
          {features.map(feature => {
            const geom = feature.geometry;

            // 1. Terrain Polygons
            if (feature.kind === 'terrain' && geom.type === 'Polygon') {
              const positions = geom.coordinates.map(toLeafletLatLng);
              const pathStyle = getTerrainStyle(
                feature.style?.terrainType,
                feature.style?.fillOpacity,
                feature.isRevealed,
                isDm
              );

              return (
                <Polygon
                  key={feature.id}
                  positions={positions}
                  pathOptions={pathStyle}
                  eventHandlers={{
                    add: e => {
                      (e.target as any).featureId = feature.id;
                    },
                    click: () => {
                      if (activeTool === 'none') {
                        setSelectedFeature(feature);
                      }
                    }
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip">
                    {!feature.isRevealed && isDm ? `👁‍🗨 ${feature.label}` : feature.label}
                  </Tooltip>
                </Polygon>
              );
            }

            // 2. Region Border Polygons
            if (feature.kind === 'region' && geom.type === 'Polygon') {
              const positions = geom.coordinates.map(toLeafletLatLng);
              const borderStyle = getRegionBorderStyle(
                feature.style,
                feature.isRevealed,
                isDm
              );

              return (
                <Polygon
                  key={feature.id}
                  positions={positions}
                  pathOptions={borderStyle}
                  eventHandlers={{
                    add: e => {
                      (e.target as any).featureId = feature.id;
                    },
                    click: () => {
                      if (activeTool === 'none') {
                        setSelectedFeature(feature);
                      }
                    }
                  }}
                >
                  <Tooltip permanent direction="top" className="map-feature-tooltip">
                    {!feature.isRevealed && isDm ? `👁‍🗨 ${feature.label}` : feature.label}
                  </Tooltip>
                </Polygon>
              );
            }

            // 3. Markers
            if (feature.kind === 'marker' && geom.type === 'Point') {
              const position = toLeafletLatLng(geom.coordinates);
              const icon = createMarkerDivIcon(feature, isDm);

              return (
                <Marker
                  key={feature.id}
                  position={position}
                  icon={icon}
                  eventHandlers={{
                    add: e => {
                      (e.target as any).featureId = feature.id;
                    },
                    click: () => {
                      if (activeTool === 'none') {
                        setSelectedFeature(feature);
                      }
                    }
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
                    add: e => {
                      (e.target as any).featureId = feature.id;
                    },
                    click: () => {
                      if (activeTool === 'none') {
                        setSelectedFeature(feature);
                      }
                    }
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

      {/* 
        DM Toolbar (Visible ONLY to owner / co_dm)
        Touch targets >= 44px, one-handed mobile friendly
      */}
      {isDm && (
        <div
          className="absolute bottom-5 inset-x-2 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 z-[1000] flex flex-col items-center gap-2 pointer-events-auto"
          dir="rtl"
        >
          {/* Active Submenu / Drawing Hint */}
          {activeTool !== 'none' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/95 border border-accent/40 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
              {activeTool === 'terrain' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-text-primary">نوع زمین:</span>
                  <div className="flex items-center gap-1">
                    {ALLOWED_TERRAIN_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTerrainType(t)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeTerrainType === t
                            ? 'bg-accent text-surface-1 shadow'
                            : 'bg-surface-3 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {TERRAIN_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'marker' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-text-primary">نوع نشانه:</span>
                  <div className="flex items-center gap-1">
                    {ALLOWED_MARKER_TYPES.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setActiveMarkerType(m)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeMarkerType === m
                            ? 'bg-accent text-surface-1 shadow'
                            : 'bg-surface-3 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {MARKER_TYPE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'stamp' && pendingStamp && (
                <div className="flex items-center gap-2 text-xs text-text-primary">
                  <span className="font-bold text-accent">{pendingStamp.stamp.name}</span>
                  <span className="text-text-muted">({pendingStamp.scale}x) — کلیک روی نقشه برای درج</span>
                </div>
              )}

              {activeTool === 'edit_geometry' && (
                <span className="text-xs font-bold text-accent">
                  حالت ویرایش فعال است: رئوس و نشانه‌ها را بکشید
                </span>
              )}

              <IconButton
                icon={<X className="w-4 h-4" />}
                aria-label="لغو ابزار جاری"
                variant="ghost"
                size="xs"
                onClick={() => setActiveTool('none')}
                className="text-text-muted hover:text-danger ms-1"
              />
            </div>
          )}

          {/* Main Floating Tool Buttons */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-2/95 border border-border shadow-2xl backdrop-blur-md max-w-full overflow-x-auto">
            {/* Draw Terrain */}
            <IconButton
              icon={<PenTool className="w-5 h-5" />}
              aria-label="رسم عوارض زمین (Terrain)"
              title="رسم زمین (جنگل، کوه، آب...)"
              variant={activeTool === 'terrain' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveTool(activeTool === 'terrain' ? 'none' : 'terrain')}
            />

            {/* Draw Region Border */}
            <IconButton
              icon={<Layers className="w-5 h-5" />}
              aria-label="رسم مرز منطقه (Region)"
              title="رسم مرز قلمرو"
              variant={activeTool === 'region' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveTool(activeTool === 'region' ? 'none' : 'region')}
            />

            {/* Add Marker */}
            <IconButton
              icon={<MapPin className="w-5 h-5" />}
              aria-label="افزودن نشانگر (Marker)"
              title="افزودن نشانه (مکان، NPC، دشمن...)"
              variant={activeTool === 'marker' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveTool(activeTool === 'marker' ? 'none' : 'marker')}
            />

            {/* Stamp Library */}
            <IconButton
              icon={<StampIcon className="w-5 h-5" />}
              aria-label="کتابخانه المان‌ها (Stamps)"
              title="کتابخانه المان‌های دژ/سازه‌ها"
              variant={activeTool === 'stamp' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setIsStampLibraryOpen(true)}
            />

            <div className="w-px h-6 bg-border mx-0.5" />

            {/* Edit / Move Geometry */}
            <IconButton
              icon={<Move className="w-5 h-5" />}
              aria-label="ویرایش و جابه‌جایی هندسه"
              title="ویرایش و جابه‌جایی نقاط"
              variant={activeTool === 'edit_geometry' ? 'primary' : 'ghost'}
              size="md"
              onClick={() =>
                setActiveTool(activeTool === 'edit_geometry' ? 'none' : 'edit_geometry')
              }
            />

            {/* Single-step Undo */}
            <IconButton
              icon={<Undo2 className="w-5 h-5" />}
              aria-label="واگرد آخرین اقدام"
              title="واگرد (Undo)"
              variant="ghost"
              size="md"
              disabled={!history.canUndo}
              onClick={handleUndo}
              className={history.canUndo ? 'text-accent' : 'text-text-muted/40'}
            />
          </div>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2/90 border border-border/80 shadow-md backdrop-blur-sm text-[11px] text-text-muted">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-semibold">ذخیره شد</span>
              </>
            )}
            {saveStatus === 'conflict' && (
              <div className="flex items-center gap-1 text-danger font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>تعارض همزمانی</span>
                <button
                  type="button"
                  onClick={loadMapData}
                  className="underline ms-1 text-accent flex items-center gap-0.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  بارگذاری مجدد
                </button>
              </div>
            )}
            {saveStatus === 'idle' && (
              <span>نسخه {map.revision || 1} • ویرایشگر نقشه</span>
            )}
          </div>
        </div>
      )}

      {/* Feature Edit Sheet (Bottom Sheet for DM) */}
      {isDm && (
        <MapFeatureEditSheet
          feature={selectedFeature}
          isOpen={Boolean(selectedFeature)}
          onClose={() => setSelectedFeature(null)}
          onSave={handleUpdateFeature}
          onDelete={handleDeleteFeature}
        />
      )}

      {/* Feature Info Sheet (Read-Only for Players/Spectators) */}
      {!isDm && (
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">
                  {selectedFeature.kind === 'terrain'
                    ? 'عارضه طبیعی'
                    : selectedFeature.kind === 'region'
                    ? 'مرز قلمرو'
                    : selectedFeature.kind === 'stamp'
                    ? 'المان سازه'
                    : 'نشانگر'}
                </Badge>
                {selectedFeature.style?.terrainType && (
                  <Badge variant="accent">
                    {TERRAIN_TYPE_LABELS[selectedFeature.style.terrainType] ||
                      selectedFeature.style.terrainType}
                  </Badge>
                )}
                {selectedFeature.style?.markerType && (
                  <Badge variant="info">
                    {MARKER_TYPE_LABELS[selectedFeature.style.markerType] ||
                      selectedFeature.style.markerType}
                  </Badge>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border">
                <h4 className="text-xs font-semibold text-text-muted mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  توضیحات و یادداشت اقلیمی
                </h4>
                <p className="text-sm text-text-primary leading-relaxed">
                  {selectedFeature.description || 'توضیحات تکمیلی برای این نقطه ثبت نشده است.'}
                </p>
              </div>

              {selectedFeature.linkType && selectedFeature.linkId && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-primary">
                      پیوند به{' '}
                      {selectedFeature.linkType === 'location'
                        ? 'مکان'
                        : selectedFeature.linkType === 'npc'
                        ? 'شخصیت داستانی'
                        : 'مورد مرتبط'}
                      :
                    </span>
                    <span className="text-xs font-bold text-accent">{selectedFeature.linkId}</span>
                  </div>
                </div>
              )}

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
      )}

      {/* Stamp Library Modal */}
      {isDm && (
        <StampLibraryModal
          isOpen={isStampLibraryOpen}
          campaignId={campaignId}
          onClose={() => setIsStampLibraryOpen(false)}
          onSelectStampForPlacement={(stamp, scale) => {
            setPendingStamp({ stamp, scale });
            setActiveTool('stamp');
          }}
        />
      )}
    </div>
  );
};
