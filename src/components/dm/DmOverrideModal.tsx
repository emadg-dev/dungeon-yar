import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { Character, CharacterParticipation, AbilityName } from '../../types';

interface DmOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  participation?: CharacterParticipation | null;
  onOverride: (updates: Partial<CharacterParticipation>, reason: string) => Promise<void>;
}

export const DmOverrideModal: React.FC<DmOverrideModalProps> = ({
  isOpen,
  onClose,
  character,
  participation,
  onOverride
}) => {
  const [level, setLevel] = useState<number>(participation?.level ?? character.level ?? 1);
  const [maxHp, setMaxHp] = useState<number>(participation?.maxHp ?? character.hp.max ?? 10);
  const [subclassName, setSubclassName] = useState<string>(participation?.subclassName ?? character.subclassName ?? '');
  const [abilities, setAbilities] = useState({
    str: participation?.abilityScores?.str ?? character.abilities?.str ?? 10,
    dex: participation?.abilityScores?.dex ?? character.abilities?.dex ?? 10,
    con: participation?.abilityScores?.con ?? character.abilities?.con ?? 10,
    int: participation?.abilityScores?.int ?? character.abilities?.int ?? 10,
    wis: participation?.abilityScores?.wis ?? character.abilities?.wis ?? 10,
    cha: participation?.abilityScores?.cha ?? character.abilities?.cha ?? 10
  });
  const [sheetLocked, setSheetLocked] = useState<number>(participation?.sheetLocked ?? 1);
  const [reason, setReason] = useState<string>('تنظیم دستی راوی برای داستان یا رفع باگ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('ثبت دلیل برای بازرسی و تاریخچه اجباری است.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onOverride({
        level: Number(level),
        maxHp: Number(maxHp),
        subclassName: subclassName.trim() || undefined,
        abilityScores: abilities,
        sheetLocked
      }, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در اعمال ویرایش مستقیم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const abilityFa: Record<AbilityName, string> = {
    str: 'قدرت (STR)',
    dex: 'چابکی (DEX)',
    con: 'بنیه (CON)',
    int: 'هوش (INT)',
    wis: 'خرد (WIS)',
    cha: 'فرهمندی (CHA)'
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ویرایش مستقیم دانجن مستر (DM Override)"
      subtitle={`شخصیت: ${character.name} • ثبت شده در تاریخچه رویدادها`}
    >
      <div className="space-y-4 py-2 text-right" dir="rtl">
        <div className="p-3 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/40 flex items-start gap-2.5 text-xs text-[#EDE6D8]">
          <ShieldAlert className="w-5 h-5 text-[#E8836B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            این حالت قفل قوانین را دور زده و داده‌ها را مستقیماً اصلاح می‌کند. این تغییر با عنوان «ویرایش DM» در تاریخچه رسمی شخصیت با ذکر دلیل مستند می‌گردد.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">سطح (Level):</label>
              <input
                type="number"
                min="1"
                max="20"
                value={level}
                onChange={e => setLevel(Number(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs font-mono text-[#F2C265]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">حداکثر جان (Max HP):</label>
              <input
                type="number"
                min="1"
                value={maxHp}
                onChange={e => setMaxHp(Number(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs font-mono text-[#6F9E78]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">عنوان زیرکلاس:</label>
            <input
              type="text"
              value={subclassName}
              onChange={e => setSubclassName(e.target.value)}
              placeholder="مثال: قهرمان رزم، راه سایه‌ها..."
              className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs text-[#EDE6D8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">امتیازات ویژگی‌های بنیادین:</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(abilityFa) as AbilityName[]).map(stat => (
                <div key={stat} className="bg-[#10131e] p-2 rounded-xl border border-[#2F2A23]">
                  <span className="text-[10px] text-[#A39A89] block">{abilityFa[stat]}</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={abilities[stat]}
                    onChange={e => setAbilities(prev => ({ ...prev, [stat]: Number(e.target.value) || 10 }))}
                    className="w-full bg-transparent text-sm font-mono font-bold text-[#EDE6D8] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">وضعیت قفل برگه:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSheetLocked(1)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                  sheetLocked === 1
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                }`}
              >
                قفل استاندارد (Locked Core)
              </button>
              <button
                type="button"
                onClick={() => setSheetLocked(0)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                  sheetLocked === 0
                    ? 'bg-[#6F9E78] text-[#0E0D0C] border-[#6F9E78]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                }`}
              >
                ویرایش آزاد (Respec Window)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">دلیل ویرایش دانجن مستر (ثبت در لاگ):</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: اصلاح امتیاز اشتباه یا پاداش اختصاصی راوی..."
              className="w-full p-2.5 rounded-xl bg-[#10131e] border border-[#2F2A23] text-xs text-[#EDE6D8]"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[#C2512B]/20 border border-[#C2512B] text-xs text-[#E8836B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C2512B] to-[#E0A030] text-[#0E0D0C] font-black text-xs transition flex items-center justify-center gap-2 touch-target min-h-[48px] shadow-lg shadow-[#E0A030]/20 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال اعمال...' : 'اعمال تغییرات مستقیم و ثبت در تاریخچه'}</span>
          </button>
        </form>
      </div>
    </BottomSheet>
  );
};
