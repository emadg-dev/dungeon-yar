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
      <div className="space-y-4 py-2 text-right" dir="rtl">
        {success ? (
          <div className="p-6 rounded-2xl bg-[#6F9E78]/15 border border-[#6F9E78]/40 text-center space-y-2">
            <Check className="w-8 h-8 text-[#6F9E78] mx-auto" />
            <h4 className="text-sm font-bold text-[#EDE6D8]">تجربه با موفقیت اعطا شد!</h4>
            <p className="text-xs text-[#A39A89]">امتیاز تجربه به شخصیت‌ها افزوده شد و در صورت عبور از آستانه، ارتقای سطح فعال گردید.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
                گیرنده تجربه:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetMode('party')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    targetMode === 'party'
                      ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                      : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>تمام یاران (همگانی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('single')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    targetMode === 'single'
                      ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                      : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>یک شخصیت خاص</span>
                </button>
              </div>
            </div>

            {targetMode === 'single' && (
              <div>
                <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
                  انتخاب شخصیت:
                </label>
                <select
                  value={selectedCharId}
                  onChange={e => setSelectedCharId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs text-[#EDE6D8]"
                >
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (سطح {c.level} - {c.className})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount & Presets */}
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
                میزان XP:
              </label>
              <input
                type="number"
                min="1"
                step="10"
                value={amount}
                onChange={e => setAmount(Number(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-sm font-mono text-[#F2C265] focus:outline-none focus:border-[#E0A030]"
              />

              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="px-2.5 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-[11px] font-mono text-[#EDE6D8] transition"
                  >
                    +{preset} XP
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
                دلیل و رویداد داستانی:
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="مثال: کشف معبد کهن زروانیا یا شکست هیولای باتلاق..."
                className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] font-black text-xs transition flex items-center justify-center gap-2 touch-target min-h-[48px] shadow-lg shadow-[#E0A030]/20 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : `اعطای ${amount} امتیاز تجربه (XP)`}</span>
            </button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
