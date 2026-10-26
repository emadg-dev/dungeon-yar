import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Shield, Sparkles, BookOpen, Layers } from 'lucide-react';
import { CampaignSettings } from '../../types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (data: {
    name: string;
    description?: string;
    tone?: string;
    packId?: string | null;
    settings?: Partial<CampaignSettings>;
  }) => Promise<void>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreateCampaign
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('');
  const [selectedPack, setSelectedPack] = useState<'pack-zorvania' | 'pack-srd-5e' | 'empty'>('pack-zorvania');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('نام کمپین الزامی است.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onCreateCampaign({
        name: name.trim(),
        description: description.trim(),
        tone: tone.trim(),
        packId: selectedPack === 'empty' ? null : selectedPack
      });
      setName('');
      setDescription('');
      setTone('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ایجاد کمپین.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ایجاد کمپین جدید">
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-right" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">نام کمپین *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثلاً: زروانیا: رازهای ورنا، سیاه‌چال اژدها..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">بسته‌ی محتوای اولیه (Content Pack)</label>
          <p className="text-[11px] text-slate-400 mb-2">
            محتوای بسته به‌صورت مستقل درون کمپین شما کپی می‌شود (Copy-on-use) و تغییرات بعدی کمپین‌های دیگر بر آن بی‌اثر است.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div
              onClick={() => setSelectedPack('pack-zorvania')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'pack-zorvania'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold">زروانیا</h4>
              </div>
              <p className="text-[10px] line-clamp-2">کلاس‌های اختصاصی، لور ورنا، سلاح‌های عهد و تقویم ۳۶۵ روزه</p>
            </div>

            <div
              onClick={() => setSelectedPack('pack-srd-5e')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'pack-srd-5e'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold">پایه ۵e</h4>
              </div>
              <p className="text-[10px] line-clamp-2">ساختار خالص مکانیک D&D 5e، ۶ ویژگی، مهارت‌ها و شرایط استاندارد</p>
            </div>

            <div
              onClick={() => setSelectedPack('empty')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'empty'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold">کمپین خالی</h4>
              </div>
              <p className="text-[10px] line-clamp-2">شروع از پایه بدون هیچ الگوی پیش‌ساخته، تنظیم تمام قواعد توسط DM</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">فضاسازی و لحن ماجراجویی (Tone)</label>
          <input
            type="text"
            value={tone}
            onChange={e => setTone(e.target.value)}
            placeholder="مثلاً: حماسی اساطیری، بقا در تاریکی، رمزآلود..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">شرح و مقدمه کمپین</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="شرح کوتاه از داستان و سرآغاز ماجرا..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2A23]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 min-h-[44px]"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-amber-500/20"
          >
            <Shield className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ایجاد...' : 'ساخت کمپین و ورود'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
