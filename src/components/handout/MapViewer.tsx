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
    <div className="relative w-full flex flex-col bg-[#14120E] text-[#EDE6D8]">
      {/* DM Toolbar / Instructions */}
      {isDm && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1F1B15] border-b border-[#2F2A23] rounded-t-[16px] text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingPin(!isAddingPin);
                setPendingCoords(null);
              }}
              className={`px-3 py-1.5 rounded-[8px] font-medium transition flex items-center gap-1.5 touch-target ${
                isAddingPin
                  ? 'bg-[#E0A030] text-[#14120E] font-bold shadow-md ring-2 ring-[#E0A030]/50'
                  : 'bg-[#2A241C] text-[#EDE6D8] hover:bg-[#383126]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingPin ? 'لمس روی نقشه برای نشانگر...' : 'افزودن نشانگر جدید'}
            </button>
            {isAddingPin && (
              <span className="text-[#A39A89] animate-pulse hidden sm:inline">
                روی هر نقطه از نقشه ضربه بزنید
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#A39A89] flex items-center gap-2">
            <span>تعداد نشانگرها: {pins.length}</span>
            <span className="text-[#685F51]">|</span>
            <span className="flex items-center gap-1 text-[#4ADE80]">
              <Eye className="w-3 h-3" /> {pins.filter(p => Boolean(p.revealed)).length}
            </span>
            <span className="flex items-center gap-1 text-[#F87171]">
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
                <div className="w-11 h-11 -mt-3 -ml-3 flex items-center justify-center">
                  <div
                    className={`relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform ${
                      isSelected
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#14120E]'
                        : 'group-hover:scale-110 active:scale-95'
                    } ${
                      isRevealed
                        ? 'bg-[#E0A030] text-[#14120E] border border-[#F2C265]'
                        : 'bg-[#3A332A] text-[#A39A89] border border-dashed border-[#F87171]'
                    }`}
                  >
                    <MapPinIcon className="w-4 h-4 fill-current" />
                    {!isRevealed && isDm && (
                      <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#14120E]" />
                    )}
                  </div>
                </div>

                {/* Floating Pin Label on Hover or Selection */}
                <div
                  className={`pointer-events-none absolute bottom-full mb-1 start-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-[6px] text-[10px] font-bold shadow-md transition-opacity ${
                    isSelected ? 'opacity-100 bg-[#171410] text-[#F2C265] border border-[#E0A030]' : 'opacity-0 group-hover:opacity-100 bg-[#171410]/90 text-white'
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
              <div className="w-8 h-8 rounded-full bg-[#E0A030] text-[#14120E] flex items-center justify-center shadow-2xl ring-4 ring-[#E0A030]/40">
                <MapPinIcon className="w-5 h-5 fill-current" />
              </div>
            </div>
          )}
        </MobileImageViewer>
      </div>

      {/* Selected Pin Detail Sheet (Bottom popover) */}
      {selectedPin && !isEditingSelectedPin && (
        <div
          className="p-3.5 bg-[#1F1B15] border-t border-[#2F2A23] rounded-b-[16px] space-y-2.5 animate-in fade-in slide-in-from-bottom-2"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E0A030]/20 text-[#E0A030] flex items-center justify-center">
                <MapPinIcon className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-sm text-[#EDE6D8]">{selectedPin.label}</h4>
              {isDm && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
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
                  <button
                    type="button"
                    onClick={() => handleToggleReveal(selectedPin)}
                    className="p-1.5 rounded-[8px] text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A241C] touch-target"
                    title={selectedPin.revealed ? 'مخفی‌سازی از بازیکنان' : 'آشکارسازی برای بازیکنان'}
                  >
                    {selectedPin.revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#4ADE80]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(selectedPin)}
                    className="p-1.5 rounded-[8px] text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A241C] touch-target"
                    title="ویرایش نشانگر"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentPin}
                    className="p-1.5 rounded-[8px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 touch-target"
                    title="حذف نشانگر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="p-1.5 rounded-[8px] text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A241C] touch-target"
                title="بستن اطلاعات"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedPin.note ? (
            <div className="p-2.5 bg-[#14120E] border border-[#2F2A23] rounded-[10px] text-xs text-[#D5CDBC] leading-relaxed whitespace-pre-wrap">
              {selectedPin.note}
            </div>
          ) : (
            <p className="text-xs text-[#A39A89] italic">توضیحاتی برای این مکان ثبت نشده است.</p>
          )}
        </div>
      )}

      {/* Edit Selected Pin Form */}
      {selectedPin && isEditingSelectedPin && isDm && (
        <div className="p-3.5 bg-[#1F1B15] border-t border-[#2F2A23] rounded-b-[16px] space-y-3" dir="rtl">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#EDE6D8]">ویرایش نشانگر</h4>
            <button
              type="button"
              onClick={() => setIsEditingSelectedPin(false)}
              className="text-[#A39A89] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="عنوان نشانگر (الزامی)"
              className="w-full px-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[8px] text-xs text-white focus:outline-none focus:border-[#E0A030]"
            />
            <textarea
              value={pinNote}
              onChange={(e) => setPinNote(e.target.value)}
              placeholder="توضیحات و یادداشت مکان..."
              rows={2}
              className="w-full px-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[8px] text-xs text-white focus:outline-none focus:border-[#E0A030] resize-none"
            />
            <label className="flex items-center gap-2 text-xs text-[#EDE6D8] cursor-pointer">
              <input
                type="checkbox"
                checked={pinRevealed}
                onChange={(e) => setPinRevealed(e.target.checked)}
                className="w-4 h-4 rounded text-[#E0A030] focus:ring-[#E0A030] bg-[#14120E] border-[#2F2A23]"
              />
              <span>آشکار برای بازیکنان</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingSelectedPin(false)}
              className="px-3 py-1.5 rounded-[8px] bg-[#2A241C] text-xs text-[#EDE6D8] hover:bg-[#383126]"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSaveEditPin}
              disabled={isSaving || !pinLabel.trim()}
              className="px-3 py-1.5 rounded-[8px] bg-[#E0A030] text-xs font-bold text-[#14120E] hover:bg-[#F2C265] disabled:opacity-40"
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      )}

      {/* Add New Pin Form (triggered by click on map) */}
      {pendingCoords && isDm && (
        <div className="p-3.5 bg-[#1F1B15] border-t border-[#2F2A23] rounded-b-[16px] space-y-3" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E0A030] text-[#14120E] flex items-center justify-center font-bold text-xs">
                +
              </span>
              <h4 className="font-bold text-xs text-[#EDE6D8]">افزودن نشانگر به نقشه</h4>
            </div>
            <button
              type="button"
              onClick={() => setPendingCoords(null)}
              className="text-[#A39A89] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="عنوان نشانگر (مثال: دروازه ورنا، چشمه آب گرم)"
              autoFocus
              className="w-full px-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[8px] text-xs text-white focus:outline-none focus:border-[#E0A030]"
            />
            <textarea
              value={pinNote}
              onChange={(e) => setPinNote(e.target.value)}
              placeholder="توضیحات اختیاری درباره این موقعیت..."
              rows={2}
              className="w-full px-3 py-2 bg-[#14120E] border border-[#2F2A23] rounded-[8px] text-xs text-white focus:outline-none focus:border-[#E0A030] resize-none"
            />
            <label className="flex items-center gap-2 text-xs text-[#EDE6D8] cursor-pointer">
              <input
                type="checkbox"
                checked={pinRevealed}
                onChange={(e) => setPinRevealed(e.target.checked)}
                className="w-4 h-4 rounded text-[#E0A030] focus:ring-[#E0A030] bg-[#14120E] border-[#2F2A23]"
              />
              <span>آشکار برای بازیکنان (در صورت عدم انتخاب، فقط برای دانجن‌مستر نمایش داده می‌شود)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPendingCoords(null)}
              className="px-3 py-1.5 rounded-[8px] bg-[#2A241C] text-xs text-[#EDE6D8] hover:bg-[#383126]"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSaveNewPin}
              disabled={isSaving || !pinLabel.trim()}
              className="px-3 py-1.5 rounded-[8px] bg-[#E0A030] text-xs font-bold text-[#14120E] hover:bg-[#F2C265] disabled:opacity-40"
            >
              {isSaving ? 'در حال ثبت...' : 'ثبت نشانگر'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
