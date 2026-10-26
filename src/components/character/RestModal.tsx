import React, { useState } from 'react';
import { Moon, Sun, Sparkles, Heart } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface RestModalProps {
  isOpen: boolean;
  type: 'short' | 'long' | 'special';
  onClose: () => void;
  onConfirm: (type: 'short' | 'long' | 'special', notes: string) => void;
}

export const RestModal: React.FC<RestModalProps> = ({
  isOpen,
  type: initialType,
  onClose,
  onConfirm
}) => {
  const [restType, setRestType] = useState<'short' | 'long' | 'special'>(initialType || 'short');
  const [hitDiceToSpend, setHitDiceToSpend] = useState<number>(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(restType, notes);
    setNotes('');
    onClose();
  };

  const summaries = {
    short: {
      title: 'استراحت کوتاه (۱ ساعت)',
      resets: [
        'قابلیت‌های با برچسب «استراحت کوتاه» بازیابی می‌شوند.',
        'امکان مصرف تاس‌های جان برای ترمیم سلامتی.',
        'بازیابی پیپ‌های سلاح‌های ویژه.'
      ],
      icon: Moon,
      color: 'text-[#E0A030]'
    },
    long: {
      title: 'استراحت بلند و شبانه (۸ ساعت)',
      resets: [
        'جان (HP) به حداکثر مقدار پر می‌شود.',
        'نیمی از حداکثر تاس‌های جان مصرف‌شده بازیابی می‌گردند.',
        'تمام قابلیت‌ها، اسلات‌های جادویی و پیپ‌ها بازنشانی می‌شوند.',
        'یک درجه از سطح خستگی و فرسودگی کاسته می‌شود.'
      ],
      icon: Sun,
      color: 'text-[#E0A030]'
    },
    special: {
      title: 'اردوی بهاری پریان (شهد بهار)',
      resets: [
        'بلافاصله 2d6 + 2 جان ترمیم می‌شود.',
        '۱ درجه از خستگی و مسمومیت‌ها به کلی پاکسازی می‌گردد.',
        'تقویت روحیه و اعطای الهام به تمام یاران گروه.'
      ],
      icon: Sparkles,
      color: 'text-[#E0A030]'
    }
  };

  const activeSummary = summaries[restType];
  const Icon = activeSummary.icon;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="استراحت و بازیابی قوا"
      subtitle="ثبت استراحت در کاروانسرا یا طبیعت زروانیا"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#EDE6D8]" dir="rtl">
        {/* Short / Long / Special Radio Options */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'short', label: 'استراحت کوتاه', icon: Moon },
            { id: 'long', label: 'استراحت بلند', icon: Sun },
            { id: 'special', label: 'شهد بهار', icon: Sparkles },
          ].map(opt => {
            const OptIcon = opt.icon;
            const isSelected = restType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRestType(opt.id as any)}
                className={`py-2.5 px-2 rounded-[12px] border transition flex flex-col items-center justify-center gap-1.5 touch-target ${
                  isSelected
                    ? 'bg-[#E0A030]/15 border-[#E0A030] text-[#E0A030] shadow-sm'
                    : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8]'
                }`}
              >
                <OptIcon className="w-4 h-4" />
                <span className="font-extrabold text-[11px] truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear Summary of What Resets */}
        <div className="surface-2-card rounded-[12px] p-3 border border-[#2F2A23] space-y-2">
          <div className="flex items-center gap-2 border-b border-[#2F2A23] pb-1.5">
            <Icon className={`w-4 h-4 ${activeSummary.color}`} />
            <h4 className="font-extrabold text-xs text-[#EDE6D8]">{activeSummary.title}</h4>
          </div>

          <ul className="space-y-1 text-[11px] text-[#EDE6D8]/80 list-disc list-inside leading-relaxed">
            {activeSummary.resets.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Hit Dice Spend Stepper for Short Rest */}
        {restType === 'short' && (
          <div className="surface-2-card rounded-[12px] p-3 border border-[#2F2A23] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#6F9E78]" />
              <div>
                <span className="font-extrabold text-xs text-[#EDE6D8] block">تاس‌های جان برای مصرف:</span>
                <span className="text-[10px] text-[#A39A89]">ترمیم جان با پرتاب تاس جان + بنیه</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0E0D0C] p-1 rounded-[10px] border border-[#2F2A23]">
              <button
                type="button"
                onClick={() => setHitDiceToSpend(Math.max(0, hitDiceToSpend - 1))}
                className="w-8 h-8 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold text-xs touch-target flex items-center justify-center"
              >
                -
              </button>
              <span className="font-mono text-sm font-extrabold text-[#EDE6D8] min-w-[24px] text-center dice-ltr">
                {hitDiceToSpend}
              </span>
              <button
                type="button"
                onClick={() => setHitDiceToSpend(hitDiceToSpend + 1)}
                className="w-8 h-8 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold text-xs touch-target flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Additional Rest Notes */}
        <div>
          <label className="text-xs text-[#A39A89] block mb-1">یادداشت استراحت (اختیاری):</label>
          <input
            type="text"
            placeholder="مثلاً: نگهبانی سامان در برج دیده‌بانی کاروانسرا..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-[12px] text-xs text-[#A39A89] hover:text-[#EDE6D8] touch-target"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-md touch-target"
          >
            تأیید استراحت و بازیابی
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
