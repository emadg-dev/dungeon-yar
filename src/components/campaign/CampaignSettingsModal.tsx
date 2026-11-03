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
      <form onSubmit={handleSubmit} className="space-y-5 py-2 text-start max-h-[75vh] overflow-y-auto pe-1" dir="rtl">
        {/* Approvals Group */}
        <div className="p-4 rounded-2xl bg-bg/80 border border-border space-y-3">
          <h4 className="text-xs font-bold text-accent-hover flex items-center gap-2">
            <Shield className="w-4 h-4" />
            سیستم نظارت و تأیید دانجن مستر
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">تأیید ورود شخصیت نو (onCreate)</span>
              <span className="text-xs text-text-muted">کاراکترهای جدید تا زمان تأیید DM در حالت معلق می‌مانند</span>
            </div>
            <input
              type="checkbox"
              checked={settings.approval?.onCreate}
              onChange={e => setSettings({
                ...settings,
                approval: { ...settings.approval, onCreate: e.target.checked }
              })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">تأیید ارتقای سطح (onLevelUp)</span>
              <span className="text-xs text-text-muted">تغییرات لول‌آپ بازیکن پس از تأیید دانجن مستر اعمال می‌شود</span>
            </div>
            <input
              type="checkbox"
              checked={settings.approval?.onLevelUp}
              onChange={e => setSettings({
                ...settings,
                approval: { ...settings.approval, onLevelUp: e.target.checked }
              })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">الزام تکمیل پیشینه برای تأیید ورود</span>
              <span className="text-xs text-text-muted">ورود شخصیت تنها پس از نگارش پیشینه و بازبینی ممکن باشد</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.approval?.backstoryRequiredForApproval ?? settings.backstoryRequiredForApproval)}
              onChange={e => setSettings({
                ...settings,
                backstoryRequiredForApproval: e.target.checked,
                approval: { ...settings.approval, backstoryRequiredForApproval: e.target.checked }
              })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">مجوز ساخت شخصیت توسط بازیکن</span>
              <span className="text-xs text-text-muted">بازیکنان می‌توانند مستقیماً شخصیت اضافه کنند</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPlayerCreateCharacter}
              onChange={e => setSettings({ ...settings, allowPlayerCreateCharacter: e.target.checked })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">علامت‌زدن اهداف مأموریت توسط بازیکن</span>
              <span className="text-xs text-text-muted">امکان تیک زدن اهداف مأموریت در طومار توسط خود بازیکنان</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.allowPlayerTickQuestObjectives)}
              onChange={e => setSettings({ ...settings, allowPlayerTickQuestObjectives: e.target.checked })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>
        </div>

        {/* Levels & Mechanics Group */}
        <div className="p-4 rounded-2xl bg-bg/80 border border-border space-y-3">
          <h4 className="text-xs font-bold text-accent-hover flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            سطوح و واحدهای اندازه‌گیری
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">سطح شروع کمپین</label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.startingLevel}
                onChange={e => setSettings({ ...settings, startingLevel: parseInt(e.target.value) || 1 })}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">سقف سطح مجاز ورود (Max)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.maxEntryLevel}
                onChange={e => setSettings({ ...settings, maxEntryLevel: parseInt(e.target.value) || 20 })}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">واحد فواصل بازی</span>
              <span className="text-xs text-text-muted">نمایش حرکات و بردهای اسلحه و جادوها</span>
            </div>
            <select
              value={settings.units}
              onChange={e => setSettings({ ...settings, units: e.target.value as any })}
              className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
            >
              <option value="feet">فوت (Feet / 5e)</option>
              <option value="meters">متر (Meters)</option>
            </select>
          </div>
        </div>

        {/* Dice & Privacy Group */}
        <div className="p-4 rounded-2xl bg-bg/80 border border-border space-y-3">
          <h4 className="text-xs font-bold text-accent-hover flex items-center gap-2">
            <Dice5 className="w-4 h-4" />
            تاس‌ها و دیداری‌سازی پیشینه
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">حالت پیش‌فرض پرتاب تاس</span>
              <span className="text-xs text-text-muted">نمایش پرتاب‌ها در فید مشترک میز بازی</span>
            </div>
            <select
              value={settings.diceVisibility}
              onChange={e => setSettings({ ...settings, diceVisibility: e.target.value as any })}
              className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
            >
              <option value="table">عمومی برای کل میز (Table)</option>
              <option value="dm_only">مخفی (فقط دانجن مستر)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">اجازه پرتاب مخفی به بازیکن</span>
              <span className="text-xs text-text-muted">امکان علامت‌گذاری پرتاب به‌عنوان محرمانه به DM</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPlayerRollPrivate}
              onChange={e => setSettings({ ...settings, allowPlayerRollPrivate: e.target.checked })}
              className="w-5 h-5 accent-accent rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-bg/40">
            <div>
              <span className="text-xs font-semibold text-text-primary block">دیداری‌سازی پیشینه (Backstory)</span>
              <span className="text-xs text-text-muted">پیشینه و بخش‌های عمومی برای هم‌تیمی‌ها نمایش داده شود؟</span>
            </div>
            <select
              value={settings.backstoryVisibility}
              onChange={e => setSettings({ ...settings, backstoryVisibility: e.target.value as any })}
              className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
            >
              <option value="party">مشترک با یاران گروه (Party)</option>
              <option value="dm_only">فقط برای دانجن مستر</option>
            </select>
          </div>
        </div>

        {/* Combat & Encounter Defaults */}
        <div className="p-4 rounded-2xl bg-bg/80 border border-border space-y-3">
          <h4 className="text-xs font-bold text-accent-hover flex items-center gap-2">
            <Heart className="w-4 h-4" />
            تنظیمات پیش‌فرض میدان نبرد
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showExactHp}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showExactHp: e.target.checked }
                })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span>نمایش عدد دقیق جان هیولاها به بازیکنان</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showAc}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showAc: e.target.checked }
                })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span>نمایش درجه زرهی (AC) هیولاها</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.playerInitiativeRolls}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, playerInitiativeRolls: e.target.checked }
                })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span>ثبت مستقیم ابتکار عمل توسط خود بازیکنان</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-bg/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.encounterDefaults?.showConditions}
                onChange={e => setSettings({
                  ...settings,
                  encounterDefaults: { ...settings.encounterDefaults, showConditions: e.target.checked }
                })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span>نمایش شرایط و وضعیت‌های فعال نبرد</span>
            </label>
          </div>
        </div>

        {/* House Rules */}
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">قوانین خانگی و توافقات میز (House Rules)</label>
          <textarea
            value={settings.houseRules || ''}
            onChange={e => setSettings({ ...settings, houseRules: e.target.value })}
            rows={2}
            placeholder="مثلاً: در این کمپین نوشیدن معجون با Bonus Action انجام می‌شود..."
            className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary min-h-[44px]"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2 min-h-[44px] shadow-lg shadow-accent/20"
          >
            {success ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaving ? 'در حال ذخیره...' : success ? 'ذخیره شد' : 'ذخیره تنظیمات'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
