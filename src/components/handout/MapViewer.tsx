import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { MapPin as MapPinIcon, Eye, EyeOff, Plus, Edit2, Trash2, X, Check, Info } from 'lucide-react';
import { MapPin } from '../../types';
import { MobileImageViewer } from './MobileImageViewer';

interface MapViewerProps {
  imageUrl: string;
  pins?: MapPin[];
  isDm?: boolean;
  onAddPin?: (pin: { x: number; y: number; label: string; note?: string; revealed: boolean }) => Promise<void>;
  onUpdatePin?: (pinId: string, updates: Partial<MapPin>) => Promise<void>;
  onDeletePin?: (pinId: string) => Promise<void>;
  onClose?: () => void;
  title?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  imageUrl,
  pins = [],
  isDm = false,
  onAddPin,
  onUpdatePin,
  onDeletePin,
  onClose,
  title,
}) => {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [isAddingPin, setIsAddingPin] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [isEditingSelectedPin, setIsEditingSelectedPin] = useState<boolean>(false);

  // Form states for creating/editing pin
  const [pinLabel, setPinLabel] = useState('');
  const [pinNote, setPinNote] = useState('');
  const [pinRevealed, setPinRevealed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Handle map click
  const handleMapClick = (xPercent: number, yPercent: number) => {
    if (!isDm) return;
    if (isAddingPin) {
      setPendingCoords({ x: xPercent, y: yPercent });
      setPinLabel('');
      setPinNote('');
      setPinRevealed(true);
    }
  };

  const handleSelectPin = (e: React.MouseEvent, pin: MapPin) => {
    e.stopPropagation();
    setSelectedPin(pin);
    setIsEditingSelectedPin(false);
  };

  const handleStartEdit = (pin: MapPin) => {
    setSelectedPin(pin);
    setPinLabel(pin.label);
    setPinNote(pin.note || '');
    setPinRevealed(Boolean(pin.revealed));
    setIsEditingSelectedPin(true);
  };

  const handleSaveNewPin = async () => {
    if (!pendingCoords || !pinLabel.trim() || !onAddPin) return;
    setIsSaving(true);
    try {
      await onAddPin({
        x: pendingCoords.x,
        y: pendingCoords.y,
        label: pinLabel.trim(),
        note: pinNote.trim() || undefined,
        revealed: pinRevealed,
      });
      setPendingCoords(null);
      setIsAddingPin(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditPin = async () => {
    if (!selectedPin || !pinLabel.trim() || !onUpdatePin) return;
    setIsSaving(true);
    try {
      await onUpdatePin(selectedPin.id, {
        label: pinLabel.trim(),
        note: pinNote.trim() || undefined,
        revealed: pinRevealed,
      });
      setSelectedPin({
        ...selectedPin,
        label: pinLabel.trim(),
        note: pinNote.trim() || undefined,
        revealed: pinRevealed,
      });
      setIsEditingSelectedPin(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentPin = async () => {
    if (!selectedPin || !onDeletePin) return;
    if (!window.confirm('آیا از حذف این نشانگر نقشه اطمینان دارید؟')) return;
    setIsSaving(true);
    try {
      await onDeletePin(selectedPin.id);
      setSelectedPin(null);
      setIsEditingSelectedPin(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleReveal = async (pin: MapPin) => {
    if (!isDm || !onUpdatePin) return;
    const nextVal = !pin.revealed;
    await onUpdatePin(pin.id, { revealed: nextVal });
    if (selectedPin?.id === pin.id) {
      setSelectedPin({ ...selectedPin, revealed: nextVal });
    }
  };

  return (
    <div className="relative w-full flex flex-col bg-bg text-text-primary">
      {/* DM Toolbar / Instructions */}
      {isDm && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-2 border-b border-border rounded-t-[16px] text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setIsAddingPin(!isAddingPin);
                setPendingCoords(null);
              }}
              className={`px-3 py-1.5 rounded-[8px] font-medium transition flex items-center gap-1.5 touch-target min-w-[44px] ${
                isAddingPin
                  ? 'bg-accent text-on-accent font-bold shadow-md ring-2 ring-accent/50'
                  : 'bg-surface-2 text-text-primary hover:bg-surface-3'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingPin ? 'لمس روی نقشه برای نشانگر...' : 'افزودن نشانگر جدید'}
            </Button>
            {isAddingPin && (
              <span className="text-text-muted animate-pulse hidden sm:inline">
                روی هر نقطه از نقشه ضربه بزنید
              </span>
            )}
          </div>

          <div className="text-xs text-text-muted flex items-center gap-2">
            <span>تعداد نشانگرها: {pins.length}</span>
            <span className="text-text-muted">|</span>
            <span className="flex items-center gap-1 text-success">
              <Eye className="w-3 h-3" /> {pins.filter(p => Boolean(p.revealed)).length}
            </span>
            <span className="flex items-center gap-1 text-danger">
              <EyeOff className="w-3 h-3" /> {pins.filter(p => !p.revealed).length}
            </span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="relative w-full">
        <MobileImageViewer
          imageUrl={imageUrl}
          alt={title || 'نقشه'}
          onClose={onClose}
          onMapClick={handleMapClick}
        >
          {/* Render pins */}
          {pins.map((pin) => {
            const isRevealed = Boolean(pin.revealed);
            const isSelected = selectedPin?.id === pin.id;

            return (
              <div
                key={pin.id}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                onClick={(e) => handleSelectPin(e, pin)}
                className="absolute z-20 cursor-pointer group"
              >
                {/* 44px min hit box */}
                <div className="w-11 h-11 -mt-3 -ms-3 flex items-center justify-center">
                  <div
                    className={`relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform ${
                      isSelected
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-bg'
                        : 'group-hover:scale-110 active:scale-95'
                    } ${
                      isRevealed
                        ? 'bg-accent text-on-accent border border-accent-hover'
                        : 'bg-surface-3 text-text-muted border border-dashed border-danger'
                    }`}
                  >
                    <MapPinIcon className="w-4 h-4 fill-current" />
                    {!isRevealed && isDm && (
                      <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-bg" />
                    )}
                  </div>
                </div>

                {/* Floating Pin Label on Hover or Selection */}
                <div
                  className={`pointer-events-none absolute bottom-full mb-1 start-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-[6px] text-xs font-bold shadow-md transition-opacity ${
                    isSelected ? 'opacity-100 bg-surface text-accent-hover border border-accent' : 'opacity-0 group-hover:opacity-100 bg-surface/90 text-white'
                  }`}
                  dir="rtl"
                >
                  {pin.label}
                  {!isRevealed && isDm && ' (مخفی)'}
                </div>
              </div>
            );
          })}

          {/* Pending Placement Marker */}
          {pendingCoords && (
            <div
              style={{
                left: `${pendingCoords.x}%`,
                top: `${pendingCoords.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
              className="absolute z-20 pointer-events-none animate-bounce"
            >
              <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-2xl ring-4 ring-accent/40">
                <MapPinIcon className="w-5 h-5 fill-current" />
              </div>
            </div>
          )}
        </MobileImageViewer>
      </div>

      {/* Selected Pin Detail Sheet (Bottom popover) */}
      {selectedPin && !isEditingSelectedPin && (
        <div
          className="p-3.5 bg-surface-2 border-t border-border rounded-b-[16px] space-y-2.5 animate-in fade-in slide-in-from-bottom-2"
          dir="rtl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                <MapPinIcon className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-sm text-text-primary">{selectedPin.label}</h4>
              {isDm && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                    selectedPin.revealed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedPin.revealed ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  {selectedPin.revealed ? 'آشکار برای بازیکنان' : 'مخفی از بازیکنان'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isDm && (
                <>
                  <Button
                    type="button"
                    onClick={() => handleToggleReveal(selectedPin)}
                    className="p-1.5 rounded-[8px] text-text-muted hover:text-text-primary hover:bg-surface-2 touch-target min-w-[44px]"
                    title={selectedPin.revealed ? 'مخفی‌سازی از بازیکنان' : 'آشکارسازی برای بازیکنان'}
                  >
                    {selectedPin.revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-success" />}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStartEdit(selectedPin)}
                    className="p-1.5 rounded-[8px] text-text-muted hover:text-text-primary hover:bg-surface-2 touch-target min-w-[44px]"
                    title="ویرایش نشانگر"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDeleteCurrentPin}
                    className="p-1.5 rounded-[8px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 touch-target min-w-[44px]"
                    title="حذف نشانگر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="p-1.5 rounded-[8px] text-text-muted hover:text-text-primary hover:bg-surface-2 touch-target min-w-[44px]"
                title="بستن اطلاعات"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {selectedPin.note ? (
            <div className="p-2.5 bg-bg border border-border rounded-[10px] text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
              {selectedPin.note}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">توضیحاتی برای این مکان ثبت نشده است.</p>
          )}
        </div>
      )}

      {/* Edit Selected Pin Form */}
      {selectedPin && isEditingSelectedPin && isDm && (
        <div className="p-3.5 bg-surface-2 border-t border-border rounded-b-[16px] space-y-3" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-text-primary">ویرایش نشانگر</h4>
            <Button
              type="button"
              onClick={() => setIsEditingSelectedPin(false)}
              className="text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Input noWrapper
              type="text"
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="عنوان نشانگر (الزامی)"
              className="w-full px-3 py-2 bg-bg border border-border rounded-[8px] text-xs text-white focus:outline-none focus:border-accent"
            />
            <Textarea noWrapper
              value={pinNote}
              onChange={(e) => setPinNote(e.target.value)}
              placeholder="توضیحات و یادداشت مکان..."
              rows={2}
              className="w-full px-3 py-2 bg-bg border border-border rounded-[8px] text-xs text-white focus:outline-none focus:border-accent resize-none"
            />
            <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
              <Input noWrapper
                type="checkbox"
                checked={pinRevealed}
                onChange={(e) => setPinRevealed(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent bg-bg border-border"
              />
              <span>آشکار برای بازیکنان</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={() => setIsEditingSelectedPin(false)}
              className="px-3 py-1.5 rounded-[8px] bg-surface-2 text-xs text-text-primary hover:bg-surface-3"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditPin}
              disabled={isSaving || !pinLabel.trim()}
              className="px-3 py-1.5 rounded-[8px] bg-accent text-xs font-bold text-on-accent hover:bg-accent-hover disabled:opacity-40"
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </div>
      )}

      {/* Add New Pin Form (triggered by click on map) */}
      {pendingCoords && isDm && (
        <div className="p-3.5 bg-surface-2 border-t border-border rounded-b-[16px] space-y-3" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-on-accent flex items-center justify-center font-bold text-xs">
                +
              </span>
              <h4 className="font-bold text-xs text-text-primary">افزودن نشانگر به نقشه</h4>
            </div>
            <Button
              type="button"
              onClick={() => setPendingCoords(null)}
              className="text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Input noWrapper
              type="text"
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="عنوان نشانگر (مثال: دروازه ورنا، چشمه آب گرم)"
              autoFocus
              className="w-full px-3 py-2 bg-bg border border-border rounded-[8px] text-xs text-white focus:outline-none focus:border-accent"
            />
            <Textarea noWrapper
              value={pinNote}
              onChange={(e) => setPinNote(e.target.value)}
              placeholder="توضیحات اختیاری درباره این موقعیت..."
              rows={2}
              className="w-full px-3 py-2 bg-bg border border-border rounded-[8px] text-xs text-white focus:outline-none focus:border-accent resize-none"
            />
            <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
              <Input noWrapper
                type="checkbox"
                checked={pinRevealed}
                onChange={(e) => setPinRevealed(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent bg-bg border-border"
              />
              <span>آشکار برای بازیکنان (در صورت عدم انتخاب، فقط برای دانجن‌مستر نمایش داده می‌شود)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={() => setPendingCoords(null)}
              className="px-3 py-1.5 rounded-[8px] bg-surface-2 text-xs text-text-primary hover:bg-surface-3"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewPin}
              disabled={isSaving || !pinLabel.trim()}
              className="px-3 py-1.5 rounded-[8px] bg-accent text-xs font-bold text-on-accent hover:bg-accent-hover disabled:opacity-40"
            >
              {isSaving ? 'در حال ثبت...' : 'ثبت نشانگر'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
