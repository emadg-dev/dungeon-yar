import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Link as LinkIcon,
  MapPin,
  Trees,
  Compass
} from 'lucide-react';
import type { MapFeature, MapTerrainType, MapMarkerType } from '../../types';
import {
  ALLOWED_TERRAIN_TYPES,
  ALLOWED_MARKER_TYPES,
  TERRAIN_TYPE_LABELS,
  MARKER_TYPE_LABELS
} from '../../../shared/rules/mapEngine';
import { formatCoordinatesFa } from '../../../shared/rules/mapVisualEngine';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

export interface MapFeatureEditSheetProps {
  feature: MapFeature | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MapFeature) => void;
  onDelete: (featureId: string) => void;
}

export const MapFeatureEditSheet: React.FC<MapFeatureEditSheetProps> = ({
  feature,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [terrainType, setTerrainType] = useState<MapTerrainType>('forest');
  const [markerType, setMarkerType] = useState<MapMarkerType>('location');
  const [stampScale, setStampScale] = useState<number>(1.0);
  const [linkType, setLinkType] = useState<string>('none');
  const [linkId, setLinkId] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feature) {
      setLabel(feature.label || '');
      setDescription(feature.description || '');
      setTerrainType(feature.style?.terrainType || 'forest');
      setMarkerType(feature.style?.markerType || 'location');
      setStampScale(feature.style?.scale || 1.0);
      setLinkType(feature.linkType || 'none');
      setLinkId(feature.linkId || '');
      setIsRevealed(Boolean(feature.isRevealed));
      setError(null);
    }
  }, [feature]);

  if (!feature) return null;

  const handleSave = () => {
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setError('برچسب و نام عارضه الزامی است.');
      return;
    }
    if (cleanLabel.length > 100) {
      setError('طول نام عارضه نمی‌تواند بیش از ۱۰۰ نویسه باشد.');
      return;
    }

    const updated: MapFeature = {
      ...feature,
      label: cleanLabel,
      description: description.trim() || null,
      isRevealed,
      linkType: linkType === 'none' ? null : (linkType as any),
      linkId: linkType === 'none' ? null : linkId.trim() || null,
      style: {
        ...feature.style,
        ...(feature.kind === 'terrain' ? { terrainType } : {}),
        ...(feature.kind === 'marker' ? { markerType } : {}),
        ...(feature.kind === 'stamp' ? { scale: stampScale } : {})
      },
      updatedAt: Date.now()
    };

    onSave(updated);
    onClose();
  };

  const kindLabelFa =
    feature.kind === 'terrain'
      ? 'عارضه طبیعی (زمین)'
      : feature.kind === 'region'
      ? 'مرز قلمرو'
      : feature.kind === 'stamp'
      ? 'المان سازه / دژ'
      : 'نشانگر روی نقشه';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`ویرایش ${kindLabelFa}`}
      description={
        feature.geometry.type === 'Point'
          ? formatCoordinatesFa(feature.geometry.coordinates)
          : `${feature.geometry.coordinates.length} رأس ثبت‌شده`
      }
    >
      <div className="space-y-4 py-2" dir="rtl">
        {/* Name / Label */}
        <Input
          label="نام و برچسب عارضه"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="مثال: جنگل سوگوار، اردوگاه راهزنان..."
          required
          maxLength={100}
        />

        {/* Kind-Specific Subtype Selector */}
        {feature.kind === 'terrain' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">نوع عارضه اقلیمی (زمین):</label>
            <div className="grid grid-cols-3 gap-2">
              {ALLOWED_TERRAIN_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerrainType(t)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    terrainType === t
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-border bg-surface-2 text-text-muted hover:bg-surface-3'
                  }`}
                >
                  {TERRAIN_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        {feature.kind === 'marker' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">نوع نشانه:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALLOWED_MARKER_TYPES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarkerType(m)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    markerType === m
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-border bg-surface-2 text-text-muted hover:bg-surface-3'
                  }`}
                >
                  {MARKER_TYPE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {feature.kind === 'stamp' && (
          <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                اندازه و مقیاس المان:
              </span>
              <span className="font-mono text-accent font-bold dir-ltr">
                {stampScale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={3.0}
              step={0.1}
              value={stampScale}
              onChange={e => setStampScale(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>
        )}

        {/* Description Textarea */}
        <Textarea
          label="توضیحات و یادداشت برای نقشه"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="توضیحات تکمیلی یا رازهای اقلیمی مربوط به این نقطه..."
          rows={3}
          maxLength={1000}
        />

        {/* Entity Link */}
        <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <LinkIcon className="w-4 h-4 text-accent" />
            <span>پیوند به داده‌های کمپین (اختیاری):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Select
              label="نوع پیوند"
              value={linkType}
              onChange={e => setLinkType(e.target.value)}
              options={[
                { value: 'none', label: 'بدون پیوند' },
                { value: 'location', label: 'مکان (Location)' },
                { value: 'npc', label: 'شخصیت داستانی (NPC)' },
                { value: 'participation', label: 'کاراکتر بازیکن' }
              ]}
            />
            {linkType !== 'none' && (
              <Input
                label="شناسه یا نام پیوند"
                value={linkId}
                onChange={e => setLinkId(e.target.value)}
                placeholder="شناسه یا کد مورد نظر..."
              />
            )}
          </div>
        </div>

        {/* Reveal Switch (Default: Hidden) */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center gap-2">
            {isRevealed ? (
              <Eye className="w-5 h-5 text-success" />
            ) : (
              <EyeOff className="w-5 h-5 text-warning" />
            )}
            <div>
              <p className="text-xs font-bold text-text-primary">نمایش برای بازیکنان</p>
              <p className="text-[11px] text-text-muted">
                {isRevealed
                  ? 'این عارضه در نقشه‌ی تمام بازیکنان کمپین نمایان است.'
                  : 'این عارضه پنهان است و تنها دانجن مستر آن را می‌بیند.'}
              </p>
            </div>
          </div>
          <Switch checked={isRevealed} onChange={setIsRevealed} />
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 p-2.5 rounded-lg border border-danger/30">
            {error}
          </p>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onDelete(feature.id);
              onClose();
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            حذف عارضه
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Check className="w-4 h-4" />}
            >
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
