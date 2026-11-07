import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { LineageTemplate, AbilityName, LineageTrait, SublineageDef } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Plus, Trash2, Save, Sparkles, Shield, Eye, BookOpen, User, ChevronDown } from 'lucide-react';
import {
  Field, Section, SectionStack, StickyFooter, ToggleChip, AddButton, IconButton,
  inputCls, textareaCls, primaryBtnCls, secondaryBtnCls, cardCls
} from '../ui/FormLayout';

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

const splitList = (s: string) => s.split(/[,،\n]/).map(x => x.trim()).filter(Boolean);
const splitLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);

/** Optional, long content stays collapsed so the form starts short. */
const Disclosure: React.FC<{ title: string; icon: React.ComponentType<{ className?: string }>; meta?: string; children: React.ReactNode }> = ({
  title, icon: Icon, meta, children
}) => (
  <section className="py-5 last:pb-0">
    <details className="group">
      <summary className="min-h-[44px] flex items-center justify-between gap-3 cursor-pointer list-none">
        <span className="text-base font-bold text-text-primary flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          {title}
          {meta && <span className="text-xs font-normal text-text-muted">{meta}</span>}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-3 space-y-4">{children}</div>
    </details>
  </section>
);

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

  const [bonusMode, setBonusMode] = useState<'fixed' | 'choose'>(lineage?.abilityBonuses?.mode || 'fixed');
  const [fixedBonuses, setFixedBonuses] = useState<Partial<Record<AbilityName, number>>>(
    lineage?.abilityBonuses?.fixed || { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  );
  const [chooseCount, setChooseCount] = useState<number>(lineage?.abilityBonuses?.chooseCount || 2);
  const [chooseValue, setChooseValue] = useState<number>(lineage?.abilityBonuses?.chooseValue || 1);

  const [traits, setTraits] = useState<LineageTrait[]>(
    lineage?.traits?.length ? lineage.traits : [{ name: '', description: '', usage: 'همیشگی (Passive)' }]
  );

  const [languagesText, setLanguagesText] = useState((lineage?.languages || ['مشترک']).join('، '));
  const [darkvision, setDarkvision] = useState<number>(lineage?.senses?.darkvision ?? 0);
  const [resistancesText, setResistancesText] = useState((lineage?.resistances || []).join('، '));
  const [skillsText, setSkillsText] = useState((lineage?.proficiencies?.skills || []).join('، '));
  const [weaponsText, setWeaponsText] = useState((lineage?.proficiencies?.weapons || []).join('، '));

  const [sublineages, setSublineages] = useState<SublineageDef[]>(lineage?.sublineages || []);

  const [nameSuggestionsText, setNameSuggestionsText] = useState((lineage?.nameSuggestions || []).join('\n'));
  const [backstoryPromptsText, setBackstoryPromptsText] = useState((lineage?.backstoryPrompts || []).join('\n'));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Immutable updates (the old code mutated the objects inside state)
  const patchTrait = (idx: number, patch: Partial<LineageTrait>) =>
    setTraits(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const patchSublineage = (idx: number, patch: Partial<SublineageDef>) =>
    setSublineages(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('نام نژاد الزامی است.');
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const parsedLanguages = splitList(languagesText);

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
          chooseCount: Number(chooseCount) || 1,
          chooseValue: Number(chooseValue) || 1
        },
        traits: traits.filter(t => t.name.trim()),
        languages: parsedLanguages.length ? parsedLanguages : ['مشترک'],
        proficiencies: {
          skills: splitList(skillsText),
          weapons: splitList(weaponsText),
          armor: lineage?.proficiencies?.armor || [],
          tools: lineage?.proficiencies?.tools || []
        },
        resistances: splitList(resistancesText),
        senses: { darkvision: Number(darkvision) || 0 },
        sublineages: sublineages.filter(s => s.name.trim()),
        nameSuggestions: splitLines(nameSuggestionsText),
        backstoryPrompts: splitLines(backstoryPromptsText),
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

  const hasUnnamedContent = traits.some(t => !t.name.trim() && t.description.trim());

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={lineage ? `ویرایش نژاد: ${lineage.name}` : 'نژاد جدید'}>
      <form onSubmit={handleSubmit} dir="rtl" className="text-start">
        <SectionStack>
          <Section title="مشخصات" icon={User}>
            <Field label="نام نژاد" required>
              <Input noWrapper type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="مثال: دیوان‌تبار، پری‌زاد، آدمی" className={inputCls} />
            </Field>
            <Field label="توصیف و زمینه تاریخی">
              <Textarea noWrapper value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="ظاهر، خاستگاه و فرهنگ نژاد" className={textareaCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اندازه">
                <Select noWrapper value={size} onChange={e => setSize(e.target.value)} className={inputCls}>
                  <option value="متوسط (Medium)">متوسط (Medium)</option>
                  <option value="کوچک (Small)">کوچک (Small)</option>
                  <option value="بزرگ (Large)">بزرگ (Large)</option>
                </Select>
              </Field>
              <Field label="سرعت پایه (فوت)">
                <Input noWrapper type="number" inputMode="numeric" value={speed || ''}
                  onChange={e => setSpeed(Number(e.target.value))} min={10} max={60} step={5} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="پاداش ویژگی‌ها" icon={Sparkles}>
            <Field label="روش" group>
              <div className="grid grid-cols-2 gap-2">
                <ToggleChip active={bonusMode === 'fixed'} onClick={() => setBonusMode('fixed')}>مقادیر ثابت</ToggleChip>
                <ToggleChip active={bonusMode === 'choose'} onClick={() => setBonusMode('choose')}>انتخاب بازیکن</ToggleChip>
              </div>
            </Field>

            {bonusMode === 'fixed' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ABILITY_LABELS.map(ab => (
                  <Field key={ab.key} label={ab.label}>
                    <Input noWrapper type="number" inputMode="numeric" value={fixedBonuses[ab.key] ?? 0}
                      onChange={e => setFixedBonuses(prev => ({ ...prev, [ab.key]: parseInt(e.target.value, 10) || 0 }))}
                      min={-2} max={4} className={`${inputCls} text-center font-bold tabular-nums`} />
                  </Field>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="تعداد ویژگی‌های قابل انتخاب">
                  <Input noWrapper type="number" inputMode="numeric" value={chooseCount || ''}
                    onChange={e => setChooseCount(Number(e.target.value))} min={1} max={6} className={inputCls} />
                </Field>
                <Field label="مقدار افزایش هر ویژگی">
                  <Input noWrapper type="number" inputMode="numeric" value={chooseValue || ''}
                    onChange={e => setChooseValue(Number(e.target.value))} min={1} max={3} className={inputCls} />
                </Field>
              </div>
            )}
          </Section>

          <Section
            title="خصلت‌های نژادی"
            icon={Shield}
            action={
              <AddButton onClick={() => setTraits(prev => [...prev, { name: '', description: '', usage: 'همیشگی (Passive)' }])}>
                <Plus className="w-4 h-4" aria-hidden />
                <span>خصلت</span>
              </AddButton>
            }
          >
            {traits.map((tr, idx) => (
              <div key={idx} className={cardCls}>
                <div className="flex items-center gap-2">
                  <Input noWrapper type="text" value={tr.name} aria-label="نام خصلت"
                    onChange={e => patchTrait(idx, { name: e.target.value })}
                    placeholder="نام خصلت (مثال: دید در تاریکی)" className={`${inputCls} flex-1 font-bold`} />
                  <IconButton label="حذف خصلت" danger onClick={() => setTraits(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
                <Textarea noWrapper value={tr.description} rows={3} aria-label="شرح خصلت"
                  onChange={e => patchTrait(idx, { description: e.target.value })}
                  placeholder="شرح مکانیکی یا روایی" className={textareaCls} />
              </div>
            ))}
            {hasUnnamedContent && (
              <p className="text-xs text-warning">خصلت‌های بدون نام هنگام ذخیره حذف می‌شوند.</p>
            )}
          </Section>

          <Section title="حواس، زبان‌ها و مهارت‌ها" icon={Eye}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="دید در تاریکی (فوت)" hint="۰ یعنی ندارد؛ معمولاً ۶۰.">
                <Input noWrapper type="number" inputMode="numeric" value={darkvision}
                  onChange={e => setDarkvision(Number(e.target.value) || 0)} min={0} max={120} step={30} className={inputCls} />
              </Field>
              <Field label="مقاومت به آسیب" hint="با ویرگول جدا کنید.">
                <Input noWrapper type="text" value={resistancesText} onChange={e => setResistancesText(e.target.value)}
                  placeholder="آتشین، سم، سرمایی" className={inputCls} />
              </Field>
            </div>
            <Field label="زبان‌ها">
              <Input noWrapper type="text" value={languagesText} onChange={e => setLanguagesText(e.target.value)}
                placeholder="مشترک، ورنایی، دیوانی" className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="مهارت‌های نژادی">
                <Input noWrapper type="text" value={skillsText} onChange={e => setSkillsText(e.target.value)}
                  placeholder="ادراک، پنهان‌کاری" className={inputCls} />
              </Field>
              <Field label="سلاح‌های مجاز نژادی">
                <Input noWrapper type="text" value={weaponsText} onChange={e => setWeaponsText(e.target.value)}
                  placeholder="کمان کوتاه، شمشیر بلند" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section
            title="زیرنژادها"
            icon={BookOpen}
            action={
              <AddButton onClick={() => setSublineages(prev => [...prev, { name: '', description: '', traits: [] }])}>
                <Plus className="w-4 h-4" aria-hidden />
                <span>تیره</span>
              </AddButton>
            }
          >
            {sublineages.length === 0 && <p className="text-sm text-text-muted">زیرنژادی تعریف نشده است.</p>}
            {sublineages.map((sub, idx) => (
              <div key={idx} className={cardCls}>
                <div className="flex items-center gap-2">
                  <Input noWrapper type="text" value={sub.name} aria-label="نام تیره"
                    onChange={e => patchSublineage(idx, { name: e.target.value })}
                    placeholder="نام تیره (مثال: دیوانزاد خاکی)" className={`${inputCls} flex-1 font-bold`} />
                  <IconButton label="حذف تیره" danger onClick={() => setSublineages(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
                <Textarea noWrapper value={sub.description} rows={3} aria-label="توصیف تیره"
                  onChange={e => patchSublineage(idx, { description: e.target.value })}
                  placeholder="توصیف تیره و خصلت‌های اختصاصی" className={textareaCls} />
              </div>
            ))}
          </Section>

          {/* These two lists were already saved by the old code but had no inputs, so they could never be edited */}
          <Disclosure
            title="پیشنهاد نام و ایده پیشینه"
            icon={BookOpen}
            meta={splitLines(nameSuggestionsText).length + splitLines(backstoryPromptsText).length > 0 ? undefined : 'اختیاری'}
          >
            <Field label="نام‌های پیشنهادی" hint="هر خط یک نام.">
              <Textarea noWrapper value={nameSuggestionsText} onChange={e => setNameSuggestionsText(e.target.value)}
                rows={4} className={textareaCls} />
            </Field>
            <Field label="ایده‌های پیشینه" hint="هر خط یک ایده.">
              <Textarea noWrapper value={backstoryPromptsText} onChange={e => setBackstoryPromptsText(e.target.value)}
                rows={4} className={textareaCls} />
            </Field>
          </Disclosure>
        </SectionStack>

        <StickyFooter>
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm font-medium">{error}</div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className={`${primaryBtnCls} flex-1`}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره نژاد'}</span>
            </Button>
            <Button type="button" onClick={onClose} className={secondaryBtnCls}>انصراف</Button>
          </div>
        </StickyFooter>
      </form>
    </BottomSheet>
  );
};