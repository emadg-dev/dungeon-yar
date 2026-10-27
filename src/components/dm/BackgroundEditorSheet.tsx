import React, { useState } from 'react';
import { BackgroundTemplate, BackgroundPersonalityTables } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Plus, Trash2, Save, BookOpen, Sparkles, Wrench, Package, Heart } from 'lucide-react';

interface BackgroundEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  background?: BackgroundTemplate | null;
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  onSave: (bg: BackgroundTemplate) => Promise<void>;
}

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
  const [skillProficienciesText, setSkillProficienciesText] = useState(
    (background?.skillProficiencies || []).join('، ')
  );
  const [toolProficienciesText, setToolProficienciesText] = useState(
    (background?.toolProficiencies || []).join('، ')
  );
  const [languagesText, setLanguagesText] = useState(
    (background?.languages || []).join('، ')
  );
  const [equipmentText, setEquipmentText] = useState(
    Array.isArray(background?.startingEquipment)
      ? (background.startingEquipment as string[]).join('\n')
      : typeof background?.startingEquipment === 'string'
      ? background.startingEquipment
      : ''
  );

  // Background Feature
  const [featureName, setFeatureName] = useState(background?.featureName || '');
  const [featureDescription, setFeatureDescription] = useState(background?.featureDescription || '');

  // Personality Tables (1d6 or 1d8 entries)
  const [traitsText, setTraitsText] = useState(
    (background?.personalityTables?.traits || []).join('\n')
  );
  const [idealsText, setIdealsText] = useState(
    (background?.personalityTables?.ideals || []).join('\n')
  );
  const [bondsText, setBondsText] = useState(
    (background?.personalityTables?.bonds || []).join('\n')
  );
  const [flawsText, setFlawsText] = useState(
    (background?.personalityTables?.flaws || []).join('\n')
  );

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
      const parsedSkills = skillProficienciesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedTools = toolProficienciesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedLanguages = languagesText.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
      const parsedEquipment = equipmentText.split('\n').map(s => s.trim()).filter(Boolean);

      const personalityTables: BackgroundPersonalityTables = {
        traits: traitsText.split('\n').map(s => s.trim()).filter(Boolean),
        ideals: idealsText.split('\n').map(s => s.trim()).filter(Boolean),
        bonds: bondsText.split('\n').map(s => s.trim()).filter(Boolean),
        flaws: flawsText.split('\n').map(s => s.trim()).filter(Boolean)
      };

      const templateToSave: BackgroundTemplate = {
        id: background?.id || `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        scopeType,
        scopeId,
        name: name.trim(),
        description: description.trim(),
        skillProficiencies: parsedSkills,
        toolProficiencies: parsedTools,
        languages: parsedLanguages,
        startingEquipment: parsedEquipment,
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={background ? `ویرایش پیشینه: ${background.name}` : 'افزودن پیشینه جدید'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-right" dir="rtl">
        {error && (
          <div className="p-3 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] text-xs font-bold">
            {error}
          </div>
        )}

        {/* Basic Fields */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1815] border border-[#2F2A23]">
          <h4 className="text-xs font-extrabold text-[#F2C265] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>مشخصات پایه پیشینه (Background)</span>
          </h4>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">نام پیشینه *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: کاتب آتشکده، راهزن کویر، پناه‌جوی ورنا..."
              required
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">توصیف گذشته و جایگاه اجتماعی</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="شخصیت در چه محیطی پرورش یافته و با چه تجربیاتی وارد جهان ماجراجویی شده است..."
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] resize-y"
            />
          </div>
        </div>

        {/* Proficiencies & Equipment */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1815] border border-[#2F2A23]">
          <h4 className="text-xs font-extrabold text-[#F2C265] flex items-center gap-1.5">
            <Wrench className="w-4 h-4" />
            <span>مهارت‌ها، افزارها و تجهیزات اولیه</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">مهارت‌های مهارتی (۲ مهارت)</label>
              <input
                type="text"
                value={skillProficienciesText}
                onChange={e => setSkillProficienciesText(e.target.value)}
                placeholder="تاریخ، ادراک (جداشده با کاما)"
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">مهارت در افزارها / سازها</label>
              <input
                type="text"
                value={toolProficienciesText}
                onChange={e => setToolProficienciesText(e.target.value)}
                placeholder="ابزار جعل سند، ست نقاشی..."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">زبان‌های آموخته‌شده</label>
            <input
              type="text"
              value={languagesText}
              onChange={e => setLanguagesText(e.target.value)}
              placeholder="یک زبان اختیاری، دیوانی کهن..."
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">تجهیزات آغازین (هر خط یک آیتم)</label>
            <textarea
              value={equipmentText}
              onChange={e => setEquipmentText(e.target.value)}
              rows={3}
              placeholder="یک بطری جوهر تیره&#10;لباس‌های سفر ساده&#10;کیسه حاوی ۱۰ سکه نقره"
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] resize-y"
            />
          </div>
        </div>

        {/* Feature */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1815] border border-[#2F2A23]">
          <h4 className="text-xs font-extrabold text-[#F2C265] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>ویژگی اختصاصی پیشینه (Feature)</span>
          </h4>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">نام ویژگی</label>
            <input
              type="text"
              value={featureName}
              onChange={e => setFeatureName(e.target.value)}
              placeholder="مثال: پناهگاه نیایشگاه، اعتبار صنفی، راه‌های مخفی..."
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">شرح اثر مکانیکی یا مزیّت روایی</label>
            <textarea
              value={featureDescription}
              onChange={e => setFeatureDescription(e.target.value)}
              rows={3}
              placeholder="شخصیت می‌تواند در آتشکده‌های منطقه برای گروه اقامت و درمان مجانی بیابد..."
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] resize-y"
            />
          </div>
        </div>

        {/* Personality Tables */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1815] border border-[#2F2A23]">
          <h4 className="text-xs font-extrabold text-[#F2C265] flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            <span>جداول شخصیت (Personality, Ideals, Bonds, Flaws)</span>
          </h4>
          <p className="text-[11px] text-[#A39A89]">
            گزینه‌ها را به صورت خط‌به‌خط وارد کنید تا در برگه شخصیت به عنوان تاس تصادفی یا انتخابی استفاده شوند.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#EDE6D8] mb-1">ویژگی‌های رفتاری (Traits)</label>
              <textarea
                value={traitsText}
                onChange={e => setTraitsText(e.target.value)}
                rows={3}
                placeholder="من همیشه به نشانه‌های آتش احترام می‌گذارم.&#10;هیچ رازی را بدون بها فاش نمی‌کنم."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#EDE6D8] mb-1">آرمان‌ها و اصول (Ideals)</label>
              <textarea
                value={idealsText}
                onChange={e => setIdealsText(e.target.value)}
                rows={3}
                placeholder="دانش: علم باید برای آیندگان حفظ شود.&#10;عدالت: هیچ پیمانی نباید شکسته شود."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#EDE6D8] mb-1">پیوندها و علایق (Bonds)</label>
              <textarea
                value={bondsText}
                onChange={e => setBondsText(e.target.value)}
                rows={3}
                placeholder="زندگی‌ام را به نگهبانی از کتیبه کهن اختصاص داده‌ام."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#EDE6D8] mb-1">نقایص و ضعف‌ها (Flaws)</label>
              <textarea
                value={flawsText}
                onChange={e => setFlawsText(e.target.value)}
                rows={3}
                placeholder="در برابر دست‌نوشته‌های نایاب نمی‌توانم جلوی وسوسه خود را بگیرم."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره پیشینه در کتابخانه'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] font-bold text-xs min-h-[44px]"
          >
            انصراف
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
