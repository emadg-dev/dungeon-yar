import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Shield, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SheetChangeRequest } from '../../types';

interface SheetChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  campaignId: string;
  participationId: string;
  initialField?: string;
  onSubmitRequest: (request: {
    field: string;
    proposedValue: any;
    reason: string;
  }) => Promise<void>;
}

export const SheetChangeRequestModal: React.FC<SheetChangeRequestModalProps> = ({
  isOpen,
  onClose,
  characterName,
  campaignId,
  participationId,
  initialField,
  onSubmitRequest
}) => {
  const [selectedField, setSelectedField] = useState(initialField || 'abilityScores');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fieldOptions = [
    { value: 'abilityScores', label: 'امتیازات ویژگی‌های بنیادین (Abilities)' },
    { value: 'subclassName', label: 'زیرکلاس اختصاصی (Subclass)' },
    { value: 'className', label: 'کلاس اصلی (Class)' },
    { value: 'maxHp', label: 'حداکثر جان (Max HP)' },
    { value: 'hitDice', label: 'تاس‌های جان (Hit Dice)' },
    { value: 'features', label: 'قابلیت‌های ویژه (Features)' },
    { value: 'other', label: 'سایر مشخصات بنیادین' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('لطفاً دلیل درخواست را وارد نمایید.');
      return;
    }
    if (!proposedValue.trim()) {
      setError('لطفاً تغییر پیشنهادی خود را مشخص نمایید.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitRequest({
        field: selectedField,
        proposedValue: proposedValue.trim(),
        reason: reason.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت درخواست تغییر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="درخواست تغییر به دانجن مستر"
      subtitle={`شخصیت: ${characterName}`}
    >
      <div className="space-y-4 py-2 text-start" dir="rtl">
        <div className="p-3.5 rounded-xl bg-surface border border-accent/40 flex items-start gap-2.5">
          <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-primary/90 leading-relaxed">
            مشخصات بنیادین برگه کاراکتر به منظور حفظ تعادل قوانین کمپین قفل هستند. با ثبت این فرم، پیشنهاد تغییر مستقیماً در صف بررسی دانجن مستر قرار می‌گیرد.
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-success/15 border border-success/40 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">درخواست ارسال شد!</h4>
            <p className="text-xs text-text-muted">دانجن مستر پس از بازبینی، تغییر را تأیید یا با بازخورد پاسخ می‌دهد.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                موضوع و بخش مورد نظر:
              </label>
              <Select noWrapper
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-info border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
              >
                {fieldOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                تغییر پیشنهادی و مقدار جدید:
              </label>
              <Textarea noWrapper
                value={proposedValue}
                onChange={e => setProposedValue(e.target.value)}
                placeholder="مقدار، عدد یا عنوان مدنظرتان را بنویسید (مثال: تغییر زیرکلاس به بربر توتم)..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-info border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                دلیل درخواست (برای راوی / DM):
              </label>
              <Textarea noWrapper
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="توضیح دهید چرا این تغییر در این مرحله از ماجراجویی لازم یا متناسب با روایت است..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-info border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-danger/20 border border-danger text-xs text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent font-black text-xs transition flex items-center justify-center gap-2 touch-target min-w-[44px] min-h-[48px] shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ارسال...' : 'ارسال درخواست به دانجن مستر'}</span>
            </Button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
