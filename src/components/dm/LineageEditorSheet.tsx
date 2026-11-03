import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { LineageTemplate, AbilityName, LineageTrait, SublineageDef } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Plus, Trash2, Save, X, Sparkles, Shield, Eye, BookOpen, User } from 'lucide-react';

interface LineageEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lineage?: LineageTemplate | null;
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  onSave: (lineage: LineageTemplate) => Promise<void>;
}

const ABILITY_LABELS: { key: AbilityName; label: string }[] = [
  { key: 'str', label: 'قدرت (STR)' },
  { key: 'dex', label: 'چابکی (DEX)' },
  { key: 'con', label: 'پایداری (CON)' },
  { key: 'int', label: 'هوش (INT)' },
  { key: 'wis', label: 'خرد (WIS)' },
  { key: 'cha', label: 'فرهمندی (CHA)' },
];

export const LineageEditorSheet: React.FC<LineageEditorSheetProps> = ({
  isOpen,
  onClose,
  lineage,
  scopeType = 'campaign',
  scopeId = 'zorvania-c1',
  onSave
}) => {
  const [name, setName] = useState(lineage?.name || '');
  const [description, setDescription] = useState(lineage?.description || '');
  const [size, setSize] = useState(lineage?.size || 'متوسط (Medium)');
  const [speed, setSpeed] = useState<number>(lineage?.speed ?? 30);

  // Ability bonuses
  const [bonusMode, setBonusMode] = useState<'fixed' | 'choose'>(lineage?.abilityBonuses?.mode || 'fixed');
  const [fixedBonuses, setFixedBonuses] = useState<Partial<Record<AbilityName, number>>>(
    lineage?.abilityBonuses?.fixed || { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  );
  const [chooseCount, setChooseCount] = useState<number>(lineage?.abilityBonuses?.chooseCount || 2);
  const [chooseValue, setChooseValue] = useState<number>(lineage?.abilityBonuses?.chooseValue || 1);

  // Traits
  const [traits, setTraits] = useState<LineageTrait[]>(
    lineage?.traits?.length ? lineage.traits : [{ name: '', description: '', usage: 'همیشگی (Passive)' }]
  );

  // Languages & Senses
  const [languagesText, setLanguagesText] = useState(
    (lineage?.languages || ['مشترک']).join('، ')
  );
  const [darkvision, setDarkvision] = useState<number>(lineage?.senses?.darkvision ?? 0);
  const [resistancesText, setResistancesText] = useState(
    (lineage?.resistances || []).join('، ')
  );

  // Proficiencies
  const [skillsText, setSkillsText] = useState(
    (lineage?.proficiencies?.skills || []).join('، ')
  );
  const [weaponsText, setWeaponsText] = useState(
    (lineage?.proficiencies?.weapons || []).join('، ')
  );

  // Sublineages
  const [sublineages, setSublineages] = useState<SublineageDef[]>(lineage?.sublineages || []);

  // Names & Backstory
  const [nameSuggestionsText, setNameSuggestionsText] = useState(
    (lineage?.nameSuggestions || []).join('\n')
  );
  const [backstoryPromptsText, setBackstoryPromptsText] = useState(
    (lineage?.backstoryPrompts || []).join('\n')
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTrait = () => {
    setTraits([...traits, { name: '', description: '', usage: 'همیشگی (Passive)' }]);
  };

  const handleRemoveTrait = (idx: number) => {
    setTraits(traits.filter((_, i) => i !== idx));
  };

  const handleAddSublineage = () => {
    setSublineages([...sublineages, { name: '', description: '', traits: [] }]);
  };

  const handleRemoveSublineage = (idx: number) => {
    setSublineages(sublineages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('نام نژاد الزامی است.');
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const parsedLanguages = languagesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedResistances = resistancesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedSkills = skillsText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedWeapons = weaponsText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedNames = nameSuggestionsText.split('\n').map(s => s.trim()).filter(Boolean);
      const parsedPrompts = backstoryPromptsText.split('\n').map(s => s.trim()).filter(Boolean);

      const templateToSave: LineageTemplate = {
        id: lineage?.id || `lin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        scopeType,
        scopeId,
        name: name.trim(),
        description: description.trim(),
        size,
        speed: Number(speed) || 30,
        abilityBonuses: {
          mode: bonusMode,
          fixed: fixedBonuses,
          chooseCount: Number(chooseCount) || 0,
          chooseValue: Number(chooseValue) || 1
        },
        traits: traits.filter(t => t.name.trim()),
        languages: parsedLanguages.length ? parsedLanguages : ['مشترک'],
        proficiencies: {
          skills: parsedSkills,
          weapons: parsedWeapons,
          armor: lineage?.proficiencies?.armor || [],
          tools: lineage?.proficiencies?.tools || []
        },
        resistances: parsedResistances,
        senses: {
          darkvision: Number(darkvision) || 0
        },
        sublineages: sublineages.filter(s => s.name.trim()),
        nameSuggestions: parsedNames,
        backstoryPrompts: parsedPrompts,
        tags: lineage?.tags || ['نژاد'],
        createdAt: lineage?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await onSave(templateToSave);
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره نژاد');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={lineage ? `ویرایش نژاد: ${lineage.name}` : 'افزودن نژاد جدید'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-start" dir="rtl">
        {error && (
          <div className="p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs font-bold">
            {error}
          </div>
        )}

        {/* Basic Fields */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface border border-border">
          <h4 className="text-xs font-extrabold text-accent-hover flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>مشخصات پایه نژاد / تبار</span>
          </h4>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">نام نژاد *</label>
            <Input noWrapper
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: دیوان‌تبار، پری‌زاد، آدمی..."
              required
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">توصیف و زمینه تاریخی</label>
            <Textarea noWrapper
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="ویژگی‌های ظاهری، خاستگاه و فرهنگ نژاد..."
              className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">اندازه و جثه (Size)</label>
              <Select noWrapper
                value={size}
                onChange={e => setSize(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
              >
                <option value="متوسط (Medium)">متوسط (Medium)</option>
                <option value="کوچک (Small)">کوچک (Small)</option>
                <option value="بزرگ (Large)">بزرگ (Large)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">سرعت پایه (فوت)</label>
              <Input noWrapper
                type="number"
                value={speed}
                onChange={e => setSpeed(parseInt(e.target.value, 10) || 30)}
                min={10}
                max={60}
                step={5}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Ability Score Bonuses */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-accent-hover flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>پاداش ویژگی‌ها (Ability Score Bonuses)</span>
            </h4>
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border">
              <Button
                type="button"
                onClick={() => setBonusMode('fixed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bonusMode === 'fixed' ? 'bg-accent text-on-accent' : 'text-text-muted'
                }`}
              >
                مقادیر ثابت
              </Button>
              <Button
                type="button"
                onClick={() => setBonusMode('choose')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bonusMode === 'choose' ? 'bg-accent text-on-accent' : 'text-text-muted'
                }`}
              >
                انتخاب بازیکن
              </Button>
            </div>
          </div>

          {bonusMode === 'fixed' ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ABILITY_LABELS.map(ab => (
                <div key={ab.key} className="bg-surface-2 p-2 rounded-xl border border-border text-center">
                  <span className="text-xs text-text-muted block mb-1">{ab.key.toUpperCase()}</span>
                  <Input noWrapper
                    type="number"
                    value={fixedBonuses[ab.key] ?? 0}
                    onChange={e => setFixedBonuses({
                      ...fixedBonuses,
                      [ab.key]: parseInt(e.target.value, 10) || 0
                    })}
                    min={-2}
                    max={4}
                    className="w-full text-center bg-surface border border-border rounded-lg py-1 text-xs text-accent-hover font-bold"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-text-muted text-xs mb-1">تعداد ویژگی‌های انتخابی</label>
                <Input noWrapper
                  type="number"
                  value={chooseCount}
                  onChange={e => setChooseCount(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  max={6}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>
              <div>
                <label className="block text-text-muted text-xs mb-1">مقدار افزایش هر ویژگی</label>
                <Input noWrapper
                  type="number"
                  value={chooseValue}
                  onChange={e => setChooseValue(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  max={3}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Traits */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-accent-hover flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>قابلیت‌ها و خصلت‌های نژادی (Traits)</span>
            </h4>
            <Button
              type="button"
              onClick={handleAddTrait}
              className="px-2.5 py-1 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold transition flex items-center gap-1 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن خصلت</span>
            </Button>
          </div>

          <div className="space-y-2">
            {traits.map((tr, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-surface-2 border border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
                  <Input noWrapper
                    type="text"
                    value={tr.name}
                    onChange={e => {
                      const updated = [...traits];
                      updated[idx].name = e.target.value;
                      setTraits(updated);
                    }}
                    placeholder="نام خصلت (مثال: دید در تاریکی، سرسختی کویر)"
                    className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <Button
                    type="button"
                    onClick={() => handleRemoveTrait(idx)}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea noWrapper
                  value={tr.description}
                  onChange={e => {
                    const updated = [...traits];
                    updated[idx].description = e.target.value;
                    setTraits(updated);
                  }}
                  rows={2}
                  placeholder="شرح مکانیکی یا روایی خصلت..."
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-primary resize-y"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Senses, Languages, Resistances */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface border border-border">
          <h4 className="text-xs font-extrabold text-accent-hover flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>حواس، زبان‌ها و مقاومت‌ها</span>
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">دید در تاریکی (Darkvision)</label>
              <Input noWrapper
                type="number"
                value={darkvision}
                onChange={e => setDarkvision(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={120}
                step={30}
                placeholder="0 یا 60 فوت"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">مقاومت به آسیب (Resistances)</label>
              <Input noWrapper
                type="text"
                value={resistancesText}
                onChange={e => setResistancesText(e.target.value)}
                placeholder="آتشین، سم، سرمایی (جداشده با کاما)"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">زبان‌ها</label>
            <Input noWrapper
              type="text"
              value={languagesText}
              onChange={e => setLanguagesText(e.target.value)}
              placeholder="مشترک، ورنایی، دیوانی..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">مهارت‌های اولیه نژادی</label>
              <Input noWrapper
                type="text"
                value={skillsText}
                onChange={e => setSkillsText(e.target.value)}
                placeholder="ادراک، پنهان‌کاری..."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">سلاح‌های مجاز نژادی</label>
              <Input noWrapper
                type="text"
                value={weaponsText}
                onChange={e => setWeaponsText(e.target.value)}
                placeholder="کمان کوتاه، شمشیر بلند..."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Sublineages */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-accent-hover flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>زیرنژادها / تیره‌ها (Sublineages)</span>
            </h4>
            <Button
              type="button"
              onClick={handleAddSublineage}
              className="px-2.5 py-1 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold transition flex items-center gap-1 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن تیره</span>
            </Button>
          </div>

          {sublineages.map((sub, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
                <Input noWrapper
                  type="text"
                  value={sub.name}
                  onChange={e => {
                    const updated = [...sublineages];
                    updated[idx].name = e.target.value;
                    setSublineages(updated);
                  }}
                  placeholder="نام تیره (مثال: دیوانزاد خاکی، پری کویر)"
                  className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                />
                <Button
                  type="button"
                  onClick={() => handleRemoveSublineage(idx)}
                  className="p-1.5 rounded-lg text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Textarea noWrapper
                value={sub.description}
                onChange={e => {
                  const updated = [...sublineages];
                  updated[idx].description = e.target.value;
                  setSublineages(updated);
                }}
                rows={2}
                placeholder="توصیف تیره و خصلت‌های اختصاصی..."
                className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-primary"
              />
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-xl btn-primary font-extrabold text-xs shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره نژاد در کتابخانه'}</span>
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-surface-3 hover:bg-surface-3 text-text-primary font-bold text-xs min-h-[44px]"
          >
            انصراف
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
