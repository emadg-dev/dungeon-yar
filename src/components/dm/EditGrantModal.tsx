import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { KeyRound, Check, AlertTriangle } from 'lucide-react';
import { EditGrantPreset, PRESET_FIELDS_MAP, getPersianFieldLabel } from '../../../shared/rules/sheetPolicy';
import { api } from '../../services/api';
import { ScrollableRow } from '../ui/ScrollableRow';
import {
  Field, Badge, StickyFooter, ToggleChip,
  pillCls, inputCls, primaryBtnCls, secondaryBtnCls
} from '../ui/FormLayout';

interface EditGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participationId: string;
  characterName: string;
  campaignId: string;
  onGrant?: (data: {
    scope: 'preset' | 'fields';
    preset?: EditGrantPreset;
    fields?: string[];
    expiresAt: number;
    usesLeft: number;
    reason: string;
  }) => Promise<void>;
  onGrantCreated?: () => void;
}

const PRESETS: { id: EditGrantPreset; label: string; desc: string }[] = [
  { id: 'level_up', label: 'ارتقای سطح', desc: 'سطح، سقف جان، خانه‌های جادو و فیت‌های جدید' },
  { id: 'respec', label: 'بازآفرینی کامل', desc: 'تغییر کامل بیلد، کلاس، پیشینه و توانایی‌ها' },
  { id: 'ability_scores', label: 'تنظیم توانایی‌ها', desc: 'ویرایش شش ویژگی پایه' },
  { id: 'spell_swap', label: 'تعویض جادوها', desc: 'تغییر جادوهای آماده و شناخته‌شده هنگام استراحت' },
  { id: 'inventory_add', label: 'افزودن به کوله‌پشتی', desc: 'افزایش سکه یا ثبت آیتم و سلاح جدید' },
  { id: 'full', label: 'دسترسی کامل موقت', desc: 'آزاد شدن تمام فیلدهای شیت بدون محدودیت' }
];

const CUSTOM_FIELDS: { id: string; label: string }[] = [
  { id: 'level', label: 'سطح' },
  { id: 'maxHp', label: 'حداکثر جان' },
  { id: 'abilities', label: 'ویژگی‌های پایه' },
  { id: 'className', label: 'کلاس اصلی' },
  { id: 'subclassName', label: 'زیرکلاس' },
  { id: 'proficiencies', label: 'مهارت‌ها و تسلط‌ها' },
  { id: 'features', label: 'ویژگی‌ها و قابلیت‌ها' },
  { id: 'spellsKnown', label: 'فهرست جادوها' },
  { id: 'inventoryQuantity', label: 'موجودی و اقلام' },
  { id: 'currencyBalance', label: 'طلا و سکه‌ها' }
];

const DURATIONS = [
  { hours: 1, label: '۱ ساعت' },
  { hours: 4, label: '۴ ساعت (طول یک جلسه)' },
  { hours: 24, label: '۱ روز' },
  { hours: 48, label: '۲ روز' },
  { hours: 168, label: '۱ هفته' }
];

const USES = [
  { count: 1, label: '۱ بار' },
  { count: 3, label: '۳ بار' },
  { count: 999, label: 'نامحدود تا زمان انقضا' }
];

export const EditGrantModal: React.FC<EditGrantModalProps> = ({
  isOpen,
  onClose,
  participationId,
  characterName,
  campaignId,
  onGrant,
  onGrantCreated
}) => {
  const [scope, setScope] = useState<'preset' | 'fields'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<EditGrantPreset>('level_up');
  const [selectedFields, setSelectedFields] = useState<string[]>(['level', 'maxHp', 'features']);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [usesCount, setUsesCount] = useState<number>(1);
  // Empty by default: a pre-filled generic reason ends up in the audit log for every grant
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleField = (fieldId: string) =>
    setSelectedFields(prev => (prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]));

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scope === 'fields' && selectedFields.length === 0) {
      setError('حداقل یک فیلد را انتخاب کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const expiresAt = Date.now() + durationHours * 3600000;
      const fields = scope === 'fields' ? selectedFields : PRESET_FIELDS_MAP[selectedPreset];
      const finalReason = reason.trim() || 'اجازه ویرایش موقت توسط DM';
      if (onGrant) {
        await onGrant({
          scope,
          preset: scope === 'preset' ? selectedPreset : undefined,
          fields,
          expiresAt,
          usesLeft: usesCount,
          reason: finalReason
        });
      } else {
        await api.createEditGrant(
          campaignId,
          participationId,
          scope,
          scope === 'preset' ? selectedPreset : undefined,
          fields,
          expiresAt,
          usesCount,
          finalReason
        );
      }
      onGrantCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت مجوز ویرایش.');
    } finally {
      setLoading(false);
    }
  };

  const presetFields: string[] = (PRESET_FIELDS_MAP[selectedPreset] as string[] | undefined) || [];
  const durationLabel = DURATIONS.find(d => d.hours === durationHours)?.label ?? `${durationHours} ساعت`;
  const usesLabel = USES.find(u => u.count === usesCount)?.label ?? `${usesCount} بار`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="مجوز ویرایش شیت" subtitle={`شخصیت: ${characterName}`}>
      <form onSubmit={handleGrant} className="space-y-5 text-start" dir="rtl">
        <p className="text-sm text-text-muted leading-relaxed">
          بازیکن می‌تواند فقط فیلدهای انتخاب‌شده را، در بازه زمانی و تعداد دفعات تعیین‌شده، بدون نیاز به شما ویرایش کند.
        </p>

        {/* Scope */}
        <Field label="نوع مجوز" group>
          <ScrollableRow activeKey={scope} className="gap-2">
            <Button type="button" data-key="preset" aria-pressed={scope === 'preset'} onClick={() => setScope('preset')}
              className={`${pillCls(scope === 'preset')} flex-1`}>
              قالب آماده
            </Button>
            <Button type="button" data-key="fields" aria-pressed={scope === 'fields'} onClick={() => setScope('fields')}
              className={`${pillCls(scope === 'fields')} flex-1`}>
              انتخاب دستی فیلدها
            </Button>
          </ScrollableRow>
        </Field>

        {scope === 'preset' ? (
          <Field label="قالب مجوز" group>
            <div className="space-y-2" role="radiogroup" aria-label="قالب مجوز">
              {PRESETS.map(p => {
                const isSelected = selectedPreset === p.id;
                return (
                  <label
                    key={p.id}
                    className={`min-h-[56px] p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition ${
                      isSelected ? 'bg-accent/10 border-accent' : 'bg-surface-2 border-border hover:border-border-strong'
                    }`}
                  >
                    <Input noWrapper type="radio" name="edit-grant-preset" checked={isSelected}
                      onChange={() => setSelectedPreset(p.id)} className="mt-1 w-5 h-5 accent-accent shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-text-primary">{p.label}</span>
                        {p.id === 'full' && <Badge tone="warning" icon={AlertTriangle}>حساس</Badge>}
                      </span>
                      <span className="block mt-0.5 text-xs text-text-muted leading-relaxed">{p.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {presetFields.length > 0 && (
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                <span className="font-medium text-text-primary">فیلدهای این قالب: </span>
                {presetFields.map(f => getPersianFieldLabel(f)).join('، ')}
              </p>
            )}
            {selectedPreset === 'full' && (
              <p className="mt-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning leading-relaxed">
                بازیکن می‌تواند هر بخش شیت را تغییر دهد. زمان و تعداد دفعات را کوتاه نگه دارید.
              </p>
            )}
          </Field>
        ) : (
          <Field label="فیلدهای مجاز" group>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOM_FIELDS.map(f => {
                const checked = selectedFields.includes(f.id);
                return (
                  <ToggleChip key={f.id} active={checked} onClick={() => toggleField(f.id)} className="justify-between text-start">
                    <span className="truncate">{f.label}</span>
                    {checked && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                  </ToggleChip>
                );
              })}
            </div>
          </Field>
        )}

        {/* Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="مدت اعتبار">
            <Select noWrapper value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} className={inputCls}>
              {DURATIONS.map(d => <option key={d.hours} value={d.hours}>{d.label}</option>)}
            </Select>
          </Field>
          <Field label="تعداد دفعات ویرایش">
            <Select noWrapper value={usesCount} onChange={e => setUsesCount(Number(e.target.value))} className={inputCls}>
              {USES.map(u => <option key={u.count} value={u.count}>{u.label}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="علت یا یادداشت" hint="در لاگ کمپین ثبت می‌شود.">
          <Input noWrapper type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="مثال: توافق داستانی هنگام استراحت" className={inputCls} />
        </Field>

        <StickyFooter>
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm">{error}</div>
          )}
          <p className="text-xs text-text-muted">
            خلاصه: {scope === 'preset' ? PRESETS.find(p => p.id === selectedPreset)?.label : `${selectedFields.length} فیلد`}،
            {' '}{durationLabel}، {usesLabel}
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'در حال ثبت...' : 'صدور مجوز'}</span>
            </Button>
            <Button type="button" onClick={onClose} className={secondaryBtnCls}>انصراف</Button>
          </div>
        </StickyFooter>
      </form>
    </BottomSheet>
  );
};