import React, { useState } from 'react';
import { LocationEntry, LocationRegion } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Chip } from '../common/Chip';
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
      setIsCreating(false);
      setEditingLocation(null);
    } finally {
      setIsSubmitting(false);
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
    const matchesSearch = !searchQuery || 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.dmNotes && l.dmNotes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRegion = selectedRegion === 'all' || l.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A39A89] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مکان‌ها و یادداشت‌های مستر..."
            className="w-full bg-[#171513] text-[#EDE6D8] placeholder-[#A39A89] pr-9 pl-3 py-2 rounded-[12px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-[#E0A030] text-[#0E0D0C] font-extrabold px-4 py-2.5 rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#F2C265] transition shadow-md touch-target shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>مکان جدید</span>
        </button>
      </div>

      {/* Region Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedRegion('all')}
          className={`py-1 px-3 rounded-full text-xs font-bold transition shrink-0 touch-target ${
            selectedRegion === 'all'
              ? 'bg-[#E0A030] text-[#0E0D0C]'
              : 'bg-[#171513] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
          }`}
        >
          همه ({locations.length})
        </button>
        {REGION_OPTIONS.map(r => {
          const count = locations.filter(l => l.region === r).length;
          return (
            <button
              type="button"
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`py-1 px-3 rounded-full text-xs font-bold transition shrink-0 touch-target ${
                selectedRegion === r
                  ? 'bg-[#E0A030] text-[#0E0D0C]'
                  : 'bg-[#171513] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
              }`}
            >
              {r} ({count})
            </button>
          );
        })}
      </div>

      {/* Locations Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredLocations.map(loc => (
          <div
            key={loc.id}
            className={`surface-card rounded-[14px] p-3.5 border transition-all duration-150 flex flex-col justify-between gap-3 ${
              loc.revealed 
                ? 'border-[#2F2A23] hover:border-[#E0A030]/40' 
                : 'border-dashed border-[#2F2A23] bg-[#171513]/60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-[#EDE6D8] truncate">{loc.name}</h3>
                    <Chip 
                      variant="region" 
                      region={loc.region}
                      label={loc.region} 
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleRevealed(loc)}
                  title={loc.revealed ? 'آشکار برای بازیکنان (کلیک جهت پنهان‌سازی)' : 'مخفی از بازیکنان (کلیک جهت آشکارسازی)'}
                  className={`p-1.5 rounded-[8px] transition touch-target shrink-0 ${
                    loc.revealed
                      ? 'bg-[#6F9E78]/15 text-[#6F9E78] hover:bg-[#6F9E78]/25'
                      : 'bg-[#171513] text-[#A39A89] hover:text-[#EDE6D8]'
                  }`}
                >
                  {loc.revealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {loc.description && (
                <p className="text-xs text-[#A39A89] line-clamp-2 leading-relaxed">
                  {loc.description}
                </p>
              )}

              {loc.dmNotes && (
                <div className="bg-[#0E0D0C]/80 rounded-[8px] p-2 border border-[#C2512B]/30 flex items-start gap-1.5 text-xs text-[#EDE6D8]/90">
                  <Lock className="w-3.5 h-3.5 text-[#C2512B] shrink-0 mt-0.5" />
                  <span className="leading-snug">{loc.dmNotes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2F2A23]/60 text-xs text-[#A39A89]">
              <span>{loc.revealed ? 'آشکار در دانشنامه' : 'مخفی در دانشنامه'}</span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(loc)}
                  className="p-1.5 rounded-[6px] hover:bg-[#201D19] text-[#EDE6D8] transition touch-target"
                  title="ویرایش مکان"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`آیا از حذف مکان "${loc.name}" اطمینان دارید؟`)) {
                      onDeleteLocation(loc.id);
                    }
                  }}
                  className="p-1.5 rounded-[6px] hover:bg-rose-500/15 text-rose-400 transition touch-target"
                  title="حذف مکان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredLocations.length === 0 && (
          <div className="col-span-full p-8 text-center surface-card rounded-[14px] border border-[#2F2A23]">
            <Compass className="w-10 h-10 text-[#A39A89] mx-auto mb-2 opacity-50" />
            <p className="text-sm text-[#A39A89]">مکانی یافت نشد.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'ویرایش مکان' : 'افزودن مکان جدید'}
      >
        <form onSubmit={handleSave} className="space-y-4 pb-2" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">
              نام مکان <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: کاروانسرای ماه سرخ"
              className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">
              اقلیم و منطقه
            </label>
            <select
              value={formData.region || 'ورنا'}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as LocationRegion }))}
              className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
            >
              {REGION_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">
              توضیحات عمومی (قابل مشاهده برای بازیکنان پس از آشکارسازی)
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="شرح معماری، جو حاکم و حال‌وهوای این نقطه از جهان زروانیا..."
              className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#C2512B] mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>یادداشت‌های محرمانه دانجن مستر (هرگز به بازیکنان نمایش داده نمی‌شود)</span>
            </label>
            <textarea
              rows={2}
              value={formData.dmNotes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, dmNotes: e.target.value }))}
              placeholder="اسرار پنهان، خطرات محیطی، تله‌ها یا NPCهای مخفی..."
              className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#C2512B]/40 focus:border-[#C2512B] focus:outline-none text-sm touch-target"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A39A89] mb-1">
              نشانی تصویر یا نقشه (اختیاری)
            </label>
            <input
              type="text"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target text-left dir-ltr"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
            <div>
              <div className="text-sm font-bold text-[#EDE6D8]">آشکار برای بازیکنان</div>
              <div className="text-xs text-[#A39A89]">در صورت فعال بودن، در بخش مکان‌های دانشنامه بازیکن نمایش داده می‌شود.</div>
            </div>
            <input
              type="checkbox"
              checked={!!formData.revealed}
              onChange={(e) => setFormData(prev => ({ ...prev, revealed: e.target.checked }))}
              className="w-5 h-5 rounded accent-[#E0A030] cursor-pointer touch-target"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingLocation(null);
              }}
              className="flex-1 py-2.5 rounded-[10px] border border-[#2F2A23] text-[#A39A89] font-bold text-sm hover:text-[#EDE6D8] transition touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name?.trim()}
              className="flex-1 py-2.5 rounded-[10px] bg-[#E0A030] text-[#0E0D0C] font-extrabold text-sm hover:bg-[#F2C265] transition disabled:opacity-50 touch-target"
            >
              {isSubmitting ? 'در حال ذخیره...' : editingLocation ? 'ثبت تغییرات' : 'ایجاد مکان'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
