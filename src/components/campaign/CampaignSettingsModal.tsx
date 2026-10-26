import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign, CampaignSettings } from '../../types';
import { Settings, Shield, Sliders, Check, Eye, Dice5, Heart, Sparkles } from 'lucide-react';

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSaveSettings: (settings: CampaignSettings) => Promise<void>;
}

export const CampaignSettingsModal: React.FC<CampaignSettingsModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSaveSettings
}) => {
  const [settings, setSettings] = useState<CampaignSettings>(campaign.settings || {
    units: 'feet',
    startingLevel: 1,
    maxEntryLevel: 20,
    abilityScoreMethods: ['standard_array', 'point_buy', 'roll', 'manual'],
    approval: { onCreate: false, onLevelUp: false },
    backstoryVisibility: 'party',
    diceVisibility: 'table',
    allowPlayerRollPrivate: true,
    allowPlayerCreateCharacter: true,
    encounterDefaults: {
      showExactHp: false,
      showAc: false,
      showConditions: true,
      showDefeated: true,
      playerInitiativeRolls: true
    },
    houseRules: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings(settings);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="تنظیمات و قواعد کمپین">
      <form onSubmit={handleSubmit} className="space-y-5 py-2 text-right max-h-[75vh] overflow-y-auto pr-1" dir="rtl">
        {/* Approvals Group */}
        <div className="p-4 rounded-2xl bg-[#131110]/80 border border-[#2F2A23] space-y-3">
          <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-2">
            <Shield className="w-4 h-4" />
            سیستم نظارت و تأیید دانجن مستر
          </h4>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">تأیید ورود شخصیت نو (onCreate)</span>
              <span className="text-[10px] text-[#A39A89]">کاراکترهای جدید تا زمان تأیید DM در حالت معلق می‌مانند</span>
            </div>
            <input
              type="checkbox"
              checked={settings.approval?.onCreate}
              onChange={e => setSettings({
                ...settings,
                approval: { ...settings.approval, onCreate: e.target.checked }
              })}
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">تأیید ارتقای سطح (onLevelUp)</span>
              <span className="text-[10px] text-[#A39A89]">تغییرات لول‌آپ بازیکن پس از تأیید دانجن مستر اعمال می‌شود</span>
            </div>
            <input
              type="checkbox"
              checked={settings.approval?.onLevelUp}
              onChange={e => setSettings({
                ...settings,
                approval: { ...settings.approval, onLevelUp: e.target.checked }
              })}
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">مجوز ساخت شخصیت توسط بازیکن</span>
              <span className="text-[10px] text-[#A39A89]">بازیکنان می‌توانند مستقیماً شخصیت اضافه کنند</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPlayerCreateCharacter}
              onChange={e => setSettings({ ...settings, allowPlayerCreateCharacter: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </div>
        </div>

        {/* Levels & Mechanics Group */}
        <div className="p-4 rounded-2xl bg-[#131110]/80 border border-[#2F2A23] space-y-3">
          <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            سطوح و واحدهای اندازه‌گیری
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#A39A89] mb-1">سطح شروع کمپین</label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.startingLevel}
                onChange={e => setSettings({ ...settings, startingLevel: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A39A89] mb-1">سقف سطح مجاز ورود (Max)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.maxEntryLevel}
                onChange={e => setSettings({ ...settings, maxEntryLevel: parseInt(e.target.value) || 20 })}
                className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">واحد فواصل بازی</span>
              <span className="text-[10px] text-[#A39A89]">نمایش حرکات و بردهای اسلحه و جادوها</span>
            </div>
            <select
              value={settings.units}
              onChange={e => setSettings({ ...settings, units: e.target.value as any })}
              className="bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-1.5 text-xs text-[#EDE6D8]"
            >
              <option value="feet">فوت (Feet / ۵e)</option>
              <option value="meters">متر (Meters)</option>
            </select>
          </div>
        </div>

        {/* Dice & Privacy Group */}
        <div className="p-4 rounded-2xl bg-[#131110]/80 border border-[#2F2A23] space-y-3">
          <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-2">
            <Dice5 className="w-4 h-4" />
            تاس‌ها و دیداری‌سازی پیشینه
          </h4>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">حالت پیش‌فرض پرتاب تاس</span>
              <span className="text-[10px] text-[#A39A89]">نمایش پرتاب‌ها در فید مشترک میز بازی</span>
            </div>
            <select
              value={settings.diceVisibility}
              onChange={e => setSettings({ ...settings, diceVisibility: e.target.value as any })}
              className="bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-1.5 text-xs text-[#EDE6D8]"
            >
              <option value="table">عمومی برای کل میز (Table)</option>
              <option value="dm_only">مخفی (فقط دانجن مستر)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">اجازه پرتاب مخفی به بازیکن</span>
              <span className="text-[10px] text-[#A39A89]">امکان علامت‌گذاری پرتاب به‌عنوان محرمانه به DM</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPlayerRollPrivate}
              onChange={e => setSettings({ ...settings, allowPlayerRollPrivate: e.target.checked })}
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0E0D0C]/40">
            <div>
              <span className="text-xs font-semibold text-[#EDE6D8] block">دیداری‌سازی پیشینه (Backstory)</span>
              <span className="text-[10px] text-[#A39A89]">پیشینه و بخش‌های عمومی برای هم‌تیمی‌ها نمایش داده شود؟</span>
            </div>
            <select
              value={settings.backstoryVisibility}
              onChange={e => setSettings({ ...settings, backstoryVisibility: e.target.value as any })}
              className="bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-1.5 text-xs text-[#EDE6D8]"
            >
              <option value="party">مشترک با یاران گروه (Party)</option>
              <option value="dm_only">فقط برای دانجن مستر</option>
            </select>
          </div>
        </div>

        {/* Combat & Encounter Defaults */}
        <div className="p-4 rounded-2xl bg-[#131110]/80 border border-[#2F2A23] space-y-3">
          <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-2">
            <Heart className="w-4 h-4" />
            تنظیمات پیش‌فرض میدان نبرد
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E0D0C]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showExactHp}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showExactHp: e.target.checked }
                })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>نمایش عدد دقیق جان هیولاها به بازیکنان</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E0D0C]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showAc}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showAc: e.target.checked }
                })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>نمایش درجه زرهی (AC) هیولاها</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E0D0C]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.playerInitiativeRolls}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, playerInitiativeRolls: e.target.checked }
                })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>ثبت مستقیم ابتکار عمل توسط خود بازیکنان</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E0D0C]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showConditions}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showConditions: e.target.checked }
                })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>نمایش شرایط و وضعیت‌های فعال نبرد</span>
            </label>
          </div>
        </div>

        {/* House Rules */}
        <div>
          <label className="block text-xs font-bold text-[#C9C0AE] mb-1">قوانین خانگی و توافقات میز (House Rules)</label>
          <textarea
            value={settings.houseRules || ''}
            onChange={e => setSettings({ ...settings, houseRules: e.target.value })}
            rows={2}
            placeholder="مثلاً: در این کمپین نوشیدن معجون با Bonus Action انجام می‌شود..."
            className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2A23]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] min-h-[44px]"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs hover:bg-[#F2C265] disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-amber-500/20"
          >
            {success ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaving ? 'در حال ذخیره...' : success ? 'ذخیره شد' : 'ذخیره تنظیمات'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
