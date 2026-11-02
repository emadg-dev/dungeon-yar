import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { KeyRound, Shield, Clock, Check, AlertCircle, Sparkles } from 'lucide-react';
import { EditGrantPreset, PRESET_FIELDS_MAP, getPersianFieldLabel } from '../../../shared/rules/sheetPolicy';

interface EditGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participationId: string;
  characterName: string;
  campaignId: string;
  onGrant: (data: {
    scope: 'preset' | 'fields';
    preset?: EditGrantPreset;
    fields?: string[];
    expiresAt: number;
    usesLeft: number;
    reason: string;
  }) => Promise<void>;
}

export const EditGrantModal: React.FC<EditGrantModalProps> = ({
  isOpen,
  onClose,
  participationId,
  characterName,
  campaignId,
  onGrant
}) => {
  const [scope, setScope] = useState<'preset' | 'fields'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<EditGrantPreset>('level_up');
  const [selectedFields, setSelectedFields] = useState<string[]>(['level', 'maxHp', 'features']);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [usesCount, setUsesCount] = useState<number>(1);
  const [reason, setReason] = useState<string>('مجوز ویرایش صادر شده توسط دانجن مستر');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const presets: { id: EditGrantPreset; label: string; desc: string }[] = [
    { id: 'level_up', label: 'ارتقای سطح (Level Up)', desc: 'سطح، سقف جان، خانه‌های جادو و فیت‌های جدید' },
    { id: 'respec', label: 'بازآفرینی کامل (Respec)', desc: 'تغییر کامل بیلد، کلاس، پیشینه و توانایی‌ها' },
    { id: 'ability_scores', label: 'تنظیم توانایی‌ها (Abilities)', desc: 'ویرایش ۶ ویژگی پایه (STR, DEX, CON, INT, WIS, CHA)' },
    { id: 'spell_swap', label: 'تعویض جادوها (Spell Swap)', desc: 'تغییر جادوهای آماده و شناخته‌شده در استراحت' },
    { id: 'inventory_add', label: 'افزودن به کوله‌پشتی', desc: 'امکان افزایش سکه‌ها یا ثبت آیتم‌ها و سلاح‌های تازه' },
    { id: 'full', label: 'دسترسی کامل موقت (Full Unrestricted)', desc: 'آزادسازی تمام فیلدهای شیت بدون محدودیت' }
  ];

  const availableCustomFields: { id: string; label: string }[] = [
    { id: 'level', label: 'سطح (Level)' },
    { id: 'maxHp', label: 'حداکثر جان (Max HP)' },
    { id: 'abilities', label: 'ویژگی‌های پایه (Abilities)' },
    { id: 'className', label: 'کلاس اصلی' },
    { id: 'subclassName', label: 'زیرکلاس' },
    { id: 'proficiencies', label: 'مهارت‌ها و تسلط‌ها' },
    { id: 'features', label: 'ویژگی‌ها و قابلیت‌ها' },
    { id: 'spellsKnown', label: 'لیست اسپل‌ها' },
    { id: 'inventoryQuantity', label: 'موجودی و اقلام' },
    { id: 'currencyBalance', label: 'موجودی طلا و سکه‌ها' }
  ];

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scope === 'fields' && selectedFields.length === 0) {
      setError('حداقل یک فیلد برای مجوز باید انتخاب شود.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const expiresAt = Date.now() + durationHours * 3600000;
      await onGrant({
        scope,
        preset: scope === 'preset' ? selectedPreset : undefined,
        fields: scope === 'fields' ? selectedFields : PRESET_FIELDS_MAP[selectedPreset],
        expiresAt,
        usesLeft: usesCount,
        reason: reason.trim() || 'اجازه ویرایش موقت توسط DM'
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت مجوز ویرایش.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="اعطای مجوز ویرایش شیت (Edit Grant)"
      subtitle={`شخصیت: ${characterName}`}
    >
      <div className="space-y-4 py-2 text-start" dir="rtl">
        <div className="p-3.5 rounded-xl bg-[#171513] border border-[#E0A030]/40 flex items-start gap-2.5 text-xs text-[#EDE6D8]">
          <KeyRound className="w-5 h-5 text-[#E0A030] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            با صدور این مجوز، بازیکن می‌تواند فیلدهای مشخص‌شده را در محدوده زمانی یا دفعات تعیین‌شده بدون نیاز به مداخله شما اصلاح نماید.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#C2512B]/20 border border-[#C2512B] text-xs text-[#E8836B]">
            {error}
          </div>
        )}

        <form onSubmit={handleGrant} className="space-y-4">
          {/* Scope Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#EDE6D8]">نوع مجوز:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('preset')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  scope === 'preset'
                    ? 'bg-[#E0A030]/20 border-[#E0A030] text-[#F2C265]'
                    : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                پکیج از پیش‌تعریف‌شده (Preset)
              </button>
              <button
                type="button"
                onClick={() => setScope('fields')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  scope === 'fields'
                    ? 'bg-[#E0A030]/20 border-[#E0A030] text-[#F2C265]'
                    : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                انتخاب دستی فیلدها (Custom)
              </button>
            </div>
          </div>

          {/* Preset Options */}
          {scope === 'preset' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#EDE6D8]">انتخاب قالب مجوز:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {presets.map(p => {
                  const isSelected = selectedPreset === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#E0A030]/15 border-[#E0A030]'
                          : 'bg-[#201D19] border-[#2F2A23] hover:border-[#2F2A23]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#EDE6D8]">{p.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#E0A030]" />}
                      </div>
                      <p className="text-[11px] text-[#A39A89] mt-0.5">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Fields Picker */
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#EDE6D8]">فیلدهای مجاز برای ویرایش:</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto no-scrollbar">
                {availableCustomFields.map(f => {
                  const isChecked = selectedFields.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleField(f.id)}
                      className={`p-2 rounded-xl text-xs font-bold border text-start flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-[#E0A030]/15 border-[#E0A030] text-[#F2C265]'
                          : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89]'
                      }`}
                    >
                      <span className="truncate">{f.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#E0A030] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expiration and Uses Count */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">مدت زمان اعتبار:</label>
              <select
                value={durationHours}
                onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              >
                <option value={1}>۱ ساعت</option>
                <option value={4}>۴ ساعت (طول جلسه)</option>
                <option value={24}>۲۴ ساعت (۱ روز)</option>
                <option value={48}>۴۸ ساعت (۲ روز)</option>
                <option value={168}>۱ هفته</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">تعداد دفعات اعمال:</label>
              <select
                value={usesCount}
                onChange={e => setUsesCount(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              >
                <option value={1}>۱ بار (یک‌بار مصرف)</option>
                <option value={3}>۳ بار ویرایش</option>
                <option value={999}>نامحدود تا زمان انقضا</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">علت یا یادداشت مجوز:</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: توافق داستانی در استراحت، تست ویژگی جدید..."
              className="w-full py-2 px-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-[#E0A030]/20 min-h-[44px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'در حال ثبت...' : 'صدور مجوز ویرایش'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-[#201D19] hover:bg-[#2F2A23] text-[#EDE6D8] text-xs font-bold border border-[#2F2A23] transition min-h-[44px]"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
};
