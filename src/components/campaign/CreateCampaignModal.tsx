import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
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
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-start" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">نام کمپین *</label>
          <Input noWrapper
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثلاً: زروانیا: رازهای ورنا، سیاه‌چال اژدها..."
            className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">بسته‌ی محتوای اولیه (Content Pack)</label>
          <p className="text-xs text-text-muted mb-2">
            محتوای بسته به‌صورت مستقل درون کمپین شما کپی می‌شود (Copy-on-use) و تغییرات بعدی کمپین‌های دیگر بر آن بی‌اثر است.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div
              onClick={() => setSelectedPack('pack-zorvania')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'pack-zorvania'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-accent-hover" />
                <h4 className="text-xs font-bold">زروانیا</h4>
              </div>
              <p className="text-xs line-clamp-2">کلاس‌های اختصاصی، لور ورنا، سلاح‌های عهد و تقویم 365 روزه</p>
            </div>

            <div
              onClick={() => setSelectedPack('pack-srd-5e')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'pack-srd-5e'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-info" />
                <h4 className="text-xs font-bold">پایه 5e</h4>
              </div>
              <p className="text-xs line-clamp-2">ساختار خالص مکانیک D&D 5e، 6 ویژگی، مهارت‌ها و شرایط استاندارد</p>
            </div>

            <div
              onClick={() => setSelectedPack('empty')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedPack === 'empty'
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg/60 border-border text-text-muted hover:border-border-strong'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-success" />
                <h4 className="text-xs font-bold">کمپین خالی</h4>
              </div>
              <p className="text-xs line-clamp-2">شروع از پایه بدون هیچ الگوی پیش‌ساخته، تنظیم تمام قواعد توسط DM</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">فضاسازی و لحن ماجراجویی (Tone)</label>
          <Input noWrapper
            type="text"
            value={tone}
            onChange={e => setTone(e.target.value)}
            placeholder="مثلاً: حماسی اساطیری، بقا در تاریکی، رمزآلود..."
            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">شرح و مقدمه کمپین</label>
          <Textarea noWrapper
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="شرح کوتاه از داستان و سرآغاز ماجرا..."
            rows={3}
            className="w-full bg-bg border border-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary min-h-[44px]"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-accent/20"
          >
            <Shield className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ایجاد...' : 'ساخت کمپین و ورود'}</span>
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
