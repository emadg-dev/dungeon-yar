import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { BackgroundTemplate, BackgroundPersonalityTables } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  Field, Section, SectionStack, StickyFooter,
  inputCls, textareaCls, primaryBtnCls, secondaryBtnCls
} from '../ui/FormLayout';
import { Save, BookOpen, Sparkles, Wrench, Heart, ChevronDown } from 'lucide-react';

interface BackgroundEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  background?: BackgroundTemplate | null;
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  onSave: (bg: BackgroundTemplate) => Promise<void>;
}

const splitList = (s: string) => s.split(/[,،\n]/).map(x => x.trim()).filter(Boolean);
const splitLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);

export const BackgroundEditorSheet: React.FC<BackgroundEditorSheetProps> = ({
  isOpen,
  onClose,
  background,
  scopeType = 'campaign',
  scopeId = 'zorvania-c1',
  onSave
}) => {
  const [name, setName] = useState(background?.name || '');
  const [description, setDescription] = useState(background?.description || '');
  const [skillProficienciesText, setSkillProficienciesText] = useState((background?.skillProficiencies || []).join('، '));
  const [toolProficienciesText, setToolProficienciesText] = useState((background?.toolProficiencies || []).join('، '));
  const [languagesText, setLanguagesText] = useState((background?.languages || []).join('، '));
  const [equipmentText, setEquipmentText] = useState(
    Array.isArray(background?.startingEquipment)
      ? (background.startingEquipment as string[]).join('\n')
      : typeof background?.startingEquipment === 'string'
      ? background.startingEquipment
      : ''
  );

  const [featureName, setFeatureName] = useState(background?.featureName || '');
  const [featureDescription, setFeatureDescription] = useState(background?.featureDescription || '');

  const [traitsText, setTraitsText] = useState((background?.personalityTables?.traits || []).join('\n'));
  const [idealsText, setIdealsText] = useState((background?.personalityTables?.ideals || []).join('\n'));
  const [bondsText, setBondsText] = useState((background?.personalityTables?.bonds || []).join('\n'));
  const [flawsText, setFlawsText] = useState((background?.personalityTables?.flaws || []).join('\n'));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('نام پیشینه الزامی است.');
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const personalityTables: BackgroundPersonalityTables = {
        traits: splitLines(traitsText),
        ideals: splitLines(idealsText),
        bonds: splitLines(bondsText),
        flaws: splitLines(flawsText)
      };

      const templateToSave: BackgroundTemplate = {
        id: background?.id || `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        scopeType,
        scopeId,
        name: name.trim(),
        description: description.trim(),
        skillProficiencies: splitList(skillProficienciesText),
        toolProficiencies: splitList(toolProficienciesText),
        languages: splitList(languagesText),
        startingEquipment: splitLines(equipmentText),
        featureName: featureName.trim() || 'خصلت پیشینه',
        featureDescription: featureDescription.trim(),
        personalityTables,
        tags: background?.tags || ['پیشینه'],
        createdAt: background?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await onSave(templateToSave);
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره پیشینه');
    } finally {
      setSaving(false);
    }
  };

  const personalityCount =
    splitLines(traitsText).length + splitLines(idealsText).length +
    splitLines(bondsText).length + splitLines(flawsText).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={background ? `ویرایش پیشینه: ${background.name}` : 'پیشینه جدید'}
    >
      <form onSubmit={handleSubmit} dir="rtl" className="text-start">
        <SectionStack>
          <Section title="مشخصات" icon={BookOpen}>
            <Field label="نام پیشینه" required>
              <Input noWrapper
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: کاتب آتشکده، راهزن کویر"
                required
                className={inputCls}
              />
            </Field>
            <Field label="گذشته و جایگاه اجتماعی">
              <Textarea noWrapper
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="شخصیت در چه محیطی پرورش یافته است؟"
                className={textareaCls}
              />
            </Field>
          </Section>

          <Section title="مهارت‌ها و تجهیزات" icon={Wrench}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="مهارت‌ها" hint="معمولاً دو مورد؛ با ویرگول جدا کنید.">
                <Input noWrapper
                  type="text"
                  value={skillProficienciesText}
                  onChange={e => setSkillProficienciesText(e.target.value)}
                  placeholder="تاریخ، ادراک"
                  className={inputCls}
                />
              </Field>
              <Field label="افزارها و سازها">
                <Input noWrapper
                  type="text"
                  value={toolProficienciesText}
                  onChange={e => setToolProficienciesText(e.target.value)}
                  placeholder="ابزار جعل سند، ست نقاشی"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="زبان‌ها">
              <Input noWrapper
                type="text"
                value={languagesText}
                onChange={e => setLanguagesText(e.target.value)}
                placeholder="یک زبان اختیاری، دیوانی کهن"
                className={inputCls}
              />
            </Field>
            <Field label="تجهیزات آغازین" hint="هر خط یک مورد.">
              <Textarea noWrapper
                value={equipmentText}
                onChange={e => setEquipmentText(e.target.value)}
                rows={3}
                placeholder={'یک بطری جوهر تیره\nلباس‌های سفر ساده'}
                className={textareaCls}
              />
            </Field>
          </Section>

          <Section title="ویژگی اختصاصی" icon={Sparkles}>
            <Field label="نام ویژگی">
              <Input noWrapper
                type="text"
                value={featureName}
                onChange={e => setFeatureName(e.target.value)}
                placeholder="مثال: پناهگاه نیایشگاه"
                className={inputCls}
              />
            </Field>
            <Field label="اثر مکانیکی یا مزیت روایی">
              <Textarea noWrapper
                value={featureDescription}
                onChange={e => setFeatureDescription(e.target.value)}
                rows={3}
                placeholder="مثلاً: در آتشکده‌های منطقه، اقامت و درمان رایگان برای گروه."
                className={textareaCls}
              />
            </Field>
          </Section>

          {/* Optional and long: collapsed by default so the form stays short */}
          <section className="py-5 last:pb-0">
            <details className="group">
              <summary className="min-h-[44px] flex items-center justify-between gap-3 cursor-pointer list-none">
                <span className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" aria-hidden />
                  جداول شخصیت
                  <span className="text-xs font-normal text-text-muted">
                    {personalityCount > 0 ? `${personalityCount} مورد` : 'اختیاری'}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-text-muted transition group-open:rotate-180" aria-hidden />
              </summary>

              <div className="mt-3 space-y-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  هر خط یک گزینه است؛ در برگه شخصیت برای انتخاب یا تاس تصادفی استفاده می‌شود.
                </p>
                <Field label="خصلت‌ها">
                  <Textarea noWrapper value={traitsText} onChange={e => setTraitsText(e.target.value)} rows={4}
                    placeholder="من همیشه به نشانه‌های آتش احترام می‌گذارم." className={textareaCls} />
                </Field>
                <Field label="آرمان‌ها">
                  <Textarea noWrapper value={idealsText} onChange={e => setIdealsText(e.target.value)} rows={4}
                    placeholder="دانش: علم باید برای آیندگان حفظ شود." className={textareaCls} />
                </Field>
                <Field label="پیوندها">
                  <Textarea noWrapper value={bondsText} onChange={e => setBondsText(e.target.value)} rows={4}
                    placeholder="زندگی‌ام را وقف نگهبانی از کتیبه کهن کرده‌ام." className={textareaCls} />
                </Field>
                <Field label="نقص‌ها">
                  <Textarea noWrapper value={flawsText} onChange={e => setFlawsText(e.target.value)} rows={4}
                    placeholder="در برابر دست‌نوشته‌های نایاب نمی‌توانم مقاومت کنم." className={textareaCls} />
                </Field>
              </div>
            </details>
          </section>
        </SectionStack>

        <StickyFooter>
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm font-medium">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className={`${primaryBtnCls} flex-1`}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره پیشینه'}</span>
            </Button>
            <Button type="button" onClick={onClose} className={secondaryBtnCls}>انصراف</Button>
          </div>
        </StickyFooter>
      </form>
    </BottomSheet>
  );
};