import React from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Lock, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { getPersianFieldLabel } from '../../../shared/rules/sheetPolicy';

interface LockedFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  characterName: string;
  onRequestChange: (field: string) => void;
}

export const LockedFieldModal: React.FC<LockedFieldModalProps> = ({
  isOpen,
  onClose,
  fieldName,
  characterName,
  onRequestChange
}) => {
  const label = getPersianFieldLabel(fieldName);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="فیلد قفل شده توسط دانجن‌مستر"
      subtitle={`شخصیت: ${characterName}`}
    >
      <div className="space-y-4 py-2 text-start" dir="rtl">
        <div className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/40 space-y-2">
          <div className="flex items-center gap-2 text-[#F2C265] font-bold text-sm">
            <Lock className="w-4 h-4 text-[#E0A030]" />
            <span>بخش قفل‌شده: {label}</span>
          </div>
          <p className="text-xs text-[#EDE6D8]/90 leading-relaxed">
            پس از نهایی‌شدن آفرینش شخصیت، مقادیر بنیادین برگه (از جمله سطح، کلاس، ویژگی‌های پایه، سقف جان و مهارت‌ها) جهت حفظ تعادل قوانین کمپین قفل هستند.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] space-y-1.5 leading-relaxed">
          <div className="text-[#EDE6D8] font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#E0A030]" />
            <span>چگونه این فیلد را تغییر دهم؟</span>
          </div>
          <p>
            ۱. ثبت «درخواست تغییر به DM» با ذکر دلیل و مقدار پیشنهادی.
          </p>
          <p>
            ۲. دریافت «مجوز ویرایش موقت» از دانجن‌مستر در حین جلسه یا استراحت.
          </p>
          <p>
            ۳. ارتقای سطح خودکار از طریق دکمه Level-Up پس از صدور مجوز مایلیستون یا XP کافی.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestChange(fieldName);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-[#E0A030]/20 min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>درخواست تغییر به DM</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#201D19] hover:bg-[#2F2A23] text-[#EDE6D8] text-xs font-bold border border-[#2F2A23] transition min-h-[44px]"
          >
            بستن
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
