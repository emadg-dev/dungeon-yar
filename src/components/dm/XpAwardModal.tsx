import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Sparkles, Users, User, Award, Check } from 'lucide-react';
import { Character } from '../../types';

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

export const XpAwardModal: React.FC<XpAwardModalProps> = ({
  isOpen,
  onClose,
  characters,
  onAwardXp
}) => {
  const [targetMode, setTargetMode] = useState<'party' | 'single'>('party');
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || '');
  const [amount, setAmount] = useState<number>(300);
  const [reason, setReason] = useState<string>('پیروزی در نبرد');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const presetAmounts = [100, 250, 300, 500, 1000, 2000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onAwardXp({
        characterId: targetMode === 'single' ? selectedCharId : undefined,
        amount: Number(amount),
        reason: reason.trim() || 'اعطای تجربه توسط دانجن مستر',
        isPartyWide: targetMode === 'party'
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="اعطای امتیاز تجربه (XP)"
      subtitle="سیستم پیشرفت و تجربه رسمی ۵e"
    >
      <div className="space-y-4 py-2 text-start" dir="rtl">
        {success ? (
          <div className="p-6 rounded-2xl bg-success/15 border border-success/40 text-center space-y-2">
            <Check className="w-8 h-8 text-success mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">تجربه با موفقیت اعطا شد!</h4>
            <p className="text-xs text-text-muted">امتیاز تجربه به شخصیت‌ها افزوده شد و در صورت عبور از آستانه، ارتقای سطح فعال گردید.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                گیرنده تجربه:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setTargetMode('party')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    targetMode === 'party'
                      ? 'bg-accent text-on-accent border-accent-hover'
                      : 'bg-surface-2 text-text-muted border-border'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>تمام یاران (همگانی)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setTargetMode('single')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    targetMode === 'single'
                      ? 'bg-accent text-on-accent border-accent-hover'
                      : 'bg-surface-2 text-text-muted border-border'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>یک شخصیت خاص</span>
                </Button>
              </div>
            </div>

            {targetMode === 'single' && (
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  انتخاب شخصیت:
                </label>
                <Select noWrapper
                  value={selectedCharId}
                  onChange={e => setSelectedCharId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-info border border-border text-xs text-text-primary"
                >
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (سطح {c.level} - {c.className})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Amount & Presets */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                میزان XP:
              </label>
              <Input noWrapper
                type="number"
                min="1"
                step="10"
                value={amount}
                onChange={e => setAmount(Number(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-info border border-border text-sm font-mono text-accent-hover focus:outline-none focus:border-accent"
              />

              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetAmounts.map(preset => (
                  <Button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border hover:border-accent text-xs font-mono text-text-primary transition"
                  >
                    +{preset} XP
                  </Button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                دلیل و رویداد داستانی:
              </label>
              <Input noWrapper
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="مثال: کشف معبد کهن زروانیا یا شکست هیولای باتلاق..."
                className="w-full p-2.5 rounded-xl bg-info border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent font-black text-xs transition flex items-center justify-center gap-2 touch-target min-w-[44px] min-h-[48px] shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : `اعطای ${amount} امتیاز تجربه (XP)`}</span>
            </Button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
