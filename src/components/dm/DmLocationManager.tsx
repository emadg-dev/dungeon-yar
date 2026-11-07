import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useDeferredValue, startTransition } from 'react';
import { LocationEntry, LocationRegion } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Chip } from '../common/Chip';
import { ScrollableRow } from '../ui/ScrollableRow';
import { 
  Compass, Plus, Search, Edit3, Trash2, 
  Eye, EyeOff, MapPin, FileText, Lock 
} from 'lucide-react';

interface DmLocationManagerProps {
  locations: LocationEntry[];
  onCreateLocation: (loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateLocation: (loc: LocationEntry) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

const REGION_OPTIONS: LocationRegion[] = [
  'ورنا',
  'کویر خاموش',
  'سپیدارون',
  'مهستان',
  'شانشین',
  'مشترک'
];

export const DmLocationManager: React.FC<DmLocationManagerProps> = ({
  locations,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [editingLocation, setEditingLocation] = useState<LocationEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<LocationEntry>>({
    name: '',
    region: 'ورنا',
    description: '',
    imageUrl: '',
    dmNotes: '',
    revealed: false,
    parentId: null
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      region: 'ورنا',
      description: '',
      imageUrl: '',
      dmNotes: '',
      revealed: false,
      parentId: null
    });
    setEditingLocation(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (loc: LocationEntry) => {
    setEditingLocation(loc);
    setFormData({ ...loc });
    setIsCreating(true);
  };

  const handleCloseSheet = () => {
    setIsCreating(false);
    setEditingLocation(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await onUpdateLocation({
          ...editingLocation,
          ...formData,
          name: formData.name.trim(),
          region: formData.region || 'ورنا',
          description: formData.description || '',
          imageUrl: formData.imageUrl || '',
          dmNotes: formData.dmNotes || '',
          revealed: !!formData.revealed,
          parentId: formData.parentId || null,
          updatedAt: Date.now()
        } as LocationEntry);
      } else {
        await onCreateLocation({
          name: formData.name.trim(),
          region: formData.region || 'ورنا',
          description: formData.description || '',
          imageUrl: formData.imageUrl || '',
          dmNotes: formData.dmNotes || '',
          revealed: !!formData.revealed,
          parentId: formData.parentId || null
        });
      }
      handleCloseSheet();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Destructive action lives inside the edit sheet, away from everyday list controls
  const handleDelete = () => {
    if (!editingLocation) return;
    if (confirm(`آیا از حذف مکان "${editingLocation.name}" اطمینان دارید؟`)) {
      onDeleteLocation(editingLocation.id);
      handleCloseSheet();
    }
  };

  const handleToggleRevealed = async (loc: LocationEntry) => {
    await onUpdateLocation({
      ...loc,
      revealed: !loc.revealed,
      updatedAt: Date.now()
    });
  };

  const filteredLocations = locations.filter(l => {
    const matchesSearch = !deferredSearch || 
      l.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      l.description.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (l.dmNotes && l.dmNotes.toLowerCase().includes(deferredSearch.toLowerCase()));
    const matchesRegion = selectedRegion === 'all' || l.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const hasActiveFilters = Boolean(searchQuery) || selectedRegion !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('all');
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search + the one primary action, always on one row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input noWrapper
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مکان‌ها و یادداشت‌ها..."
            aria-label="جستجو در مکان‌ها"
            className="w-full h-11 bg-surface text-text-primary placeholder-text-muted ps-9 pe-3 rounded-[12px] border border-border focus:border-accent focus:outline-none text-sm"
          />
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="h-11 bg-accent text-on-accent font-extrabold px-4 rounded-[12px] flex items-center justify-center gap-1.5 hover:bg-accent-hover transition shadow-md shrink-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>مکان جدید</span>
        </Button>
      </div>

      {/* Region filter */}
      <ScrollableRow activeKey={selectedRegion} className="items-center gap-1.5 pb-1">
        {[{ id: 'all', label: 'همه', count: locations.length }, ...REGION_OPTIONS.map(r => ({
          id: r as string,
          label: r as string,
          count: locations.filter(l => l.region === r).length
        }))].map(chip => (
          <Button
            type="button"
            key={chip.id}
            data-scroll-key={chip.id}
            aria-pressed={selectedRegion === chip.id}
            onClick={() => {
              startTransition(() => {
                setSelectedRegion(chip.id);
              });
            }}
            className={`h-10 px-3.5 rounded-full text-sm font-bold transition whitespace-nowrap shrink-0 snap-start flex items-center gap-1.5 ${
              selectedRegion === chip.id
                ? 'bg-accent text-on-accent'
                : 'bg-surface text-text-primary border border-border hover:border-accent/40'
            }`}
          >
            <span>{chip.label}</span>
            <span className="text-xs tabular-nums opacity-75">{chip.count}</span>
          </Button>
        ))}
      </ScrollableRow>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredLocations.map(loc => (
          <div
            key={loc.id}
            className={`surface-card rounded-[14px] p-4 border transition-colors flex flex-col gap-3 ${
              loc.revealed 
                ? 'border-border hover:border-accent/40' 
                : 'border-dashed border-border bg-surface/60'
            }`}
          >
            {/* What it is */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-text-primary break-words">{loc.name}</h3>
                <Chip 
                  variant="region" 
                  region={loc.region}
                  label={loc.region} 
                />
              </div>

              {loc.description && (
                <p className="text-sm text-text-muted line-clamp-2 leading-snug">
                  {loc.description}
                </p>
              )}

              {/* Private to the DM: a muted note, not an error-red box */}
              {loc.dmNotes && (
                <div className="rounded-[10px] p-2.5 bg-accent/5 border border-accent/25 flex items-start gap-2 text-sm text-text-primary">
                  <Lock className="w-4 h-4 text-accent-hover shrink-0 mt-0.5" />
                  <span className="leading-snug line-clamp-2">{loc.dmNotes}</span>
                </div>
              )}
            </div>

            {/* What you can do: visibility (labelled state) and edit */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                role="switch"
                aria-checked={loc.revealed}
                onClick={() => handleToggleRevealed(loc)}
                title={loc.revealed ? 'برای پنهان‌سازی لمس کنید' : 'برای آشکارسازی لمس کنید'}
                className={`h-10 px-3 rounded-[10px] text-sm font-bold transition flex items-center gap-1.5 ${
                  loc.revealed
                    ? 'bg-success/15 text-success hover:bg-success/25'
                    : 'bg-surface-2 text-text-muted border border-border hover:text-text-primary'
                }`}
              >
                {loc.revealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{loc.revealed ? 'آشکار برای بازیکنان' : 'مخفی از بازیکنان'}</span>
              </Button>

              <Button
                type="button"
                onClick={() => handleOpenEdit(loc)}
                className="h-10 px-3 rounded-[10px] bg-surface-2 border border-border text-text-primary text-sm font-bold hover:border-accent/40 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>ویرایش</span>
              </Button>
            </div>
          </div>
        ))}

        {filteredLocations.length === 0 && (
          <div className="col-span-full p-8 text-center surface-card rounded-[14px] border border-border space-y-3">
            <Compass className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <p className="text-sm text-text-muted">
              {locations.length === 0 ? 'هنوز مکانی ثبت نشده است.' : 'مکانی با این فیلترها یافت نشد.'}
            </p>
            {locations.length === 0 ? (
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="h-11 px-4 rounded-[10px] bg-accent text-on-accent text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت اولین مکان</span>
              </Button>
            ) : hasActiveFilters && (
              <Button
                type="button"
                onClick={clearFilters}
                className="h-11 px-4 rounded-[10px] bg-surface-2 border border-border text-text-primary text-sm font-bold"
              >
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isCreating}
        onClose={handleCloseSheet}
        title={editingLocation ? 'ویرایش مکان' : 'افزودن مکان جدید'}
      >
        <form onSubmit={handleSave} className="space-y-5 pb-2" dir="rtl">
          {/* Basics */}
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">نام مکان</span>
              <Input noWrapper
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: کاروانسرای ماه سرخ"
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">اقلیم و منطقه</span>
              <Select noWrapper
                value={formData.region || 'ورنا'}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as LocationRegion }))}
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              >
                {REGION_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </label>
          </div>

          {/* What players can see */}
          <fieldset className="space-y-4 min-w-0 border-0 p-0 m-0">
            <legend className="text-xs font-bold text-text-muted mb-3">برای بازیکنان</legend>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary">توضیحات عمومی</span>
              <span className="block text-xs text-text-muted mb-1.5">پس از آشکارسازی مکان، بازیکنان این متن را می‌بینند.</span>
              <Textarea noWrapper
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="شرح معماری، جو حاکم و حال‌وهوای این نقطه از جهان زروانیا..."
                className="w-full bg-surface text-text-primary p-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">
                نشانی تصویر یا نقشه <span className="font-normal text-text-muted">(اختیاری)</span>
              </span>
              <Input noWrapper
                type="text"
                dir="ltr"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            <label className="flex items-center justify-between gap-3 min-h-[56px] px-3 py-2 rounded-[10px] 
            bg-surface border border-border cursor-pointer hover:border-accent/40 transition mb-5">
              <span className="min-w-80">
                <span className="block text-sm font-bold text-text-primary">آشکار برای بازیکنان</span>
                <span className="block text-xs text-text-muted mt-0.5">در بخش مکان‌های دانشنامه‌ی بازیکن نمایش داده می‌شود.</span>
              </span>
              <Input noWrapper
                type="checkbox"
                checked={!!formData.revealed}
                onChange={(e) => setFormData(prev => ({ ...prev, revealed: e.target.checked }))}
                className="w-5 h-5 rounded accent-accent cursor-pointer "
              />
            </label>
          </fieldset>

          {/* DM only */}
          <fieldset className="space-y-2 min-w-0 border-0 p-0 m-0 pt-4 border-t border-border">
            <legend className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>فقط برای مستر</span>
            </legend>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mt-0 mb-1">یادداشت‌های محرمانه</span>
              <span className="block text-xs text-text-muted mb-2">هرگز به بازیکنان نمایش داده نمی‌شود.</span>
              <Textarea noWrapper
                rows={2}
                value={formData.dmNotes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dmNotes: e.target.value }))}
                placeholder="اسرار پنهان، خطرات محیطی، تله‌ها یا NPCهای مخفی..."
                className="w-full bg-surface text-text-primary p-3 rounded-[10px] border border-border focus:border-accent
                 focus:outline-none text-sm mb-2"
              />
            </label>
          </fieldset>

          {/* Actions: primary is wider than cancel */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name?.trim()}
              className="flex-[2] h-12 rounded-[10px] bg-accent text-on-accent font-extrabold text-sm hover:bg-accent-hover transition disabled:opacity-50"
            >
              {isSubmitting ? 'در حال ذخیره...' : editingLocation ? 'ثبت تغییرات' : 'ایجاد مکان'}
            </Button>
            <Button
              type="button"
              onClick={handleCloseSheet}
              className="flex-1 h-12 rounded-[10px] border border-border text-text-muted font-bold text-sm hover:text-text-primary transition"
            >
              انصراف
            </Button>
            
          </div>

          {editingLocation && (
            <Button
              type="button"
              onClick={handleDelete}
              className="w-full h-11 rounded-[10px] text-danger-hover hover:bg-danger/10 font-bold text-sm flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف این مکان</span>
            </Button>
          )}
        </form>
      </BottomSheet>
    </div>
  );
};