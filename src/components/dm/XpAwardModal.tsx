import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Users, User, Award, Check } from 'lucide-react';
import { Character } from '../../types';
import { Field, ToggleChip, StickyFooter, inputCls, primaryBtnCls, secondaryBtnCls } from '../ui/FormLayout';

interface XpAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onAwardXp: (data: {
    participationId?: string;
    characterId?: string;
    amount: number;
    reason: string;
    isPartyWide: boolean;
  }) => Promise<void>;
}

const PRESET_AMOUNTS = [100, 250, 300, 500, 1000, 2000];

export const XpAwardModal: React.FC<XpAwardModalProps> = ({ isOpen, onClose, characters, onAwardXp }) => {
  const [targetMode, setTargetMode] = useState<'party' | 'single'>('party');
  const [pickedCharId, setPickedCharId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // characters may load after mount, so derive the effective selection instead of freezing characters[0] in state
  const selectedCharId = pickedCharId || characters[0]?.id || '';

  // Close timer is cleaned up if the sheet is dismissed early
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
    return () => clearTimeout(t);
  }, [success, onClose]);

  const canSubmit = amount > 0 && (targetMode === 'party' ? characters.length > 0 : !!selectedCharId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAwardXp({
        characterId: targetMode === 'single' ? selectedCharId : undefined,
        amount: Number(amount),
        reason: reason.trim() || 'اعطای تجربه توسط دانجن مستر',
        isPartyWide: targetMode === 'party'
      });
      setSuccess(true);
    } catch (err: any) {
      // Previously a rejected promise was swallowed: nothing told the DM that the award failed
      setError(err?.message || 'خطا در ثبت امتیاز تجربه.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recipientsText =
    targetMode === 'party'
      ? `${characters.length} شخصیت`
      : characters.find(c => c.id === selectedCharId)?.name || '—';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="اعطای امتیاز تجربه" subtitle="پیشرفت رسمی ۵e">
      <div className="text-start" dir="rtl">
        {success ? (
          <div role="status" className="py-10 text-center space-y-2">
            <Check className="w-8 h-8 text-success mx-auto" aria-hidden />
            <h4 className="text-base font-bold text-text-primary">تجربه اعطا شد</h4>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
              اگر شخصیتی از آستانه عبور کرده باشد، ارتقای سطح برایش فعال می‌شود.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="گیرنده" group>
              <div className="grid grid-cols-2 gap-2">
                <ToggleChip active={targetMode === 'party'} onClick={() => setTargetMode('party')}>
                  <Users className="w-4 h-4" aria-hidden />
                  <span>همه یاران</span>
                </ToggleChip>
                <ToggleChip active={targetMode === 'single'} onClick={() => setTargetMode('single')}>
                  <User className="w-4 h-4" aria-hidden />
                  <span>یک شخصیت</span>
                </ToggleChip>
              </div>
            </Field>

            {targetMode === 'single' && (
              <Field label="شخصیت">
                <Select noWrapper value={selectedCharId} onChange={e => setPickedCharId(e.target.value)} className={inputCls}>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (سطح {c.level}، {c.className})</option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="مقدار XP">
              <Input noWrapper type="number" inputMode="numeric" min="1" step="10" value={amount || ''}
                onChange={e => setAmount(Number(e.target.value) || 0)}
                placeholder="مثلاً 300" className={`${inputCls} tabular-nums`} />
              <span className="mt-2 flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map(p => (
                  <ToggleChip key={p} active={amount === p} onClick={() => setAmount(p)} className="tabular-nums">
                    {p}
                  </ToggleChip>
                ))}
              </span>
            </Field>

            <Field label="دلیل یا رویداد داستانی" hint="برای تاریخچه شخصیت ثبت می‌شود.">
              <Input noWrapper type="text" value={reason} onChange={e => setReason(e.target.value)}
                placeholder="مثال: کشف معبد کهن یا شکست هیولای باتلاق" className={inputCls} />
            </Field>

            <StickyFooter>
              {error && (
                <div role="alert" className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm">{error}</div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || !canSubmit} className={`${primaryBtnCls} flex-1 sm:flex-none disabled:opacity-50`}>
                  <Award className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'در حال ثبت...' : canSubmit ? `اعطای ${amount} XP به ${recipientsText}` : 'اعطای XP'}
                  </span>
                </Button>
                <Button type="button" onClick={onClose} className={secondaryBtnCls}>انصراف</Button>
              </div>
            </StickyFooter>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};