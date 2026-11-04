import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useMemo } from 'react';
import { ClassTemplate, EquipmentChoiceGroup, CompanionDef } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  computeMaxHp, computeSlots, computeClassResources, computeAC,
  AbilityScoresInput, AbilityName, STANDARD_5E_SKILLS
} from '../../../shared/rules/engine';
import {
  Shield, Sparkles, Check, Plus, Trash2, Edit, CheckSquare, Square,
  AlertCircle, Save, RefreshCw, ChevronDown
} from 'lucide-react';
import { ScrollableRow } from '../ui/ScrollableRow';
import {
  Field, Section, SectionStack, StickyFooter, ToggleChip, AddButton, IconButton,
  inputCls, textareaCls, primaryBtnCls, secondaryBtnCls, cardCls
} from '../ui/FormLayout';

interface ClassEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Partial<ClassTemplate>) => Promise<void>;
  initialData?: ClassTemplate | null;
  scopeType: 'campaign' | 'pack';
  scopeId: string;
}

type TabType = 'basics' | 'skills_equip' | 'ac_resources' | 'spells' | 'features' | 'subclasses' | 'companions' | 'hp_table';

export const ClassEditorSheet: React.FC<ClassEditorSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  scopeType,
  scopeId
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basics');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [hitDie, setHitDie] = useState<number>(
    typeof initialData?.hitDie === 'number'
      ? initialData.hitDie
      : (parseInt(String(initialData?.hitDie || 8).replace(/\D/g, ''), 10) || 8)
  );
  const [savingThrows, setSavingThrows] = useState<string[]>(
    initialData?.savingThrows || initialData?.saves || ['str', 'con']
  );
  
  const [baseAbilities, setBaseAbilities] = useState<Record<string, number>>(
    (initialData?.baseAbilities as Record<string, number>) ||
    ((initialData?.baseAbilityScores as unknown) as Record<string, number>) || {
      str: 14, dex: 12, con: 14, int: 10, wis: 12, cha: 10
    }
  );

  // Skills & Equipment
  const [skillChoices, setSkillChoices] = useState<{ count: number; from: string[] }>({
    count: initialData?.skillChoices?.count || 2,
    from: initialData?.skillChoices?.from || initialData?.skillChoices?.options || ['athletics', 'perception', 'survival', 'intimidation']
  });
  const [weaponProf, setWeaponProf] = useState<string[]>(
    Array.isArray(initialData?.weaponProf)
      ? initialData.weaponProf
      : (typeof initialData?.weaponProf === 'string' ? [initialData.weaponProf] : ['سلاح‌های ساده', 'سلاح‌های جنگی'])
  );
  const [armorProf, setArmorProf] = useState<string[]>(
    Array.isArray(initialData?.armorProf)
      ? initialData.armorProf
      : (typeof initialData?.armorProf === 'string' ? [initialData.armorProf] : ['سبک', 'متوسط', 'سپر'])
  );
  
  const [startingEquipmentChoices, setStartingEquipmentChoices] = useState<EquipmentChoiceGroup[]>(
    initialData?.startingEquipmentChoices || [
      {
        id: 'group_1',
        label: 'سلاح اصلی',
        options: [
          { label: 'شمشیر بلند و سپر', items: ['شمشیر بلند', 'سپر چوبی'] },
          { label: 'تبر دو دست', items: ['تبر دو دست جنگی'] }
        ]
      }
    ]
  );

  const [starterWeaponOptions, setStarterWeaponOptions] = useState<Array<{ name: string; kind: 'special' | 'showy'; description?: string }>>(() => {
    if (!initialData?.starterWeaponOptions) return [];
    return (initialData.starterWeaponOptions as any[]).map(item => {
      if (typeof item === 'string') return { name: item, kind: 'special' as const };
      return item;
    });
  });

  // AC & Resources
  const [acFormula, setAcFormula] = useState<{
    base: number;
    abilityMods: AbilityName[];
    unarmored?: boolean;
    maxDexMod?: number | null;
    note?: string;
  }>(() => {
    if (initialData?.acFormula && typeof initialData.acFormula === 'object') {
      return {
        base: initialData.acFormula.base ?? 10,
        abilityMods: (initialData.acFormula.abilityMods as AbilityName[]) || ['dex'],
        unarmored: Boolean(initialData.acFormula.unarmored),
        maxDexMod: initialData.acFormula.maxDexMod ?? null,
        note: initialData.acFormula.note || ''
      };
    }
    return { base: 10, abilityMods: ['dex'], unarmored: true, maxDexMod: null, note: '' };
  });

  const [classResources, setClassResources] = useState<Array<{
    name: string;
    type: string;
    formulaOrDiceByLevel: string | Record<number, string | number>;
    resetType?: 'short' | 'long';
  }>>(() => {
    if (!initialData?.classResources) return [];
    return initialData.classResources.map(r => ({
      name: r.name,
      type: r.type || 'resource',
      formulaOrDiceByLevel: r.formulaOrDiceByLevel || '',
      resetType: (r.resetType === 'long' || r.resetType === 'short') ? r.resetType : undefined
    }));
  });

  // Spells
  const [spellcastingEnabled, setSpellcastingEnabled] = useState<boolean>(Boolean(initialData?.spellcasting));
  const [spellAbility, setSpellAbility] = useState<'int' | 'wis' | 'cha'>(
    (initialData?.spellcasting?.ability as any) || 'wis'
  );
  const [casterType, setCasterType] = useState<'full' | 'half' | 'none'>(() => {
    if (!initialData?.spellcasting) return 'none';
    const slots = initialData.spellcasting.slotsTable?.[1] || [];
    if (slots[0] >= 2) return 'full';
    return 'half';
  });

  // Features by level 1-20
  const [featuresByLevel, setFeaturesByLevel] = useState<Record<number, any[]>>(() => {
    const f = initialData?.featuresByLevel || {};
    const res: Record<number, any[]> = {};
    for (let lvl = 1; lvl <= 20; lvl++) {
      res[lvl] = Array.isArray(f[lvl]) ? [...f[lvl]] : [];
    }
    return res;
  });

  const [extraAttackLevel, setExtraAttackLevel] = useState<number | null>(initialData?.extraAttackLevel ?? 5);
  const [asiLevels, setAsiLevels] = useState<number[]>(initialData?.asiLevels || [4, 8, 12, 16, 19]);

  // Subclasses
  const [subclasses, setSubclasses] = useState<Array<{
    name: string;
    unlockLevel: number;
    featuresByLevel: Record<number, any[]>;
  }>>((initialData?.subclasses as any) || []);

  // Companions
  const [companions, setCompanions] = useState<CompanionDef[]>(initialData?.companions || []);

  // HP Table
  const [fixedHpByLevel, setFixedHpByLevel] = useState<number[]>(() => {
    if (initialData?.fixedHpByLevel && Array.isArray(initialData.fixedHpByLevel) && initialData.fixedHpByLevel.length >= 20) {
      return [...initialData.fixedHpByLevel];
    }
    // Generate default based on hitDie
    const die = typeof initialData?.hitDie === 'string' ? (parseInt(initialData.hitDie.replace(/\D/g, ''), 10) || 8) : (initialData?.hitDie || 8);
    const conBonus = 2;
    const avg = Math.floor(die / 2) + 1;
    const arr: number[] = [die + conBonus];
    for (let l = 2; l <= 20; l++) {
      arr.push(arr[arr.length - 1] + avg + conBonus);
    }
    return arr;
  });

  // Level Feature Edit Bottom Sheet
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editingLevelFeatures, setEditingLevelFeatures] = useState<any[]>([]);

  // Validation Panel Sample Character State
  const [sampleStats, setSampleStats] = useState<AbilityScoresInput>({
    str: 14,
    dex: 14,
    con: 14,
    int: 12,
    wis: 14,
    cha: 10
  });

  // Computed Validation Matrix (Levels 1, 5, 11, 20)
  const validationResults = useMemo(() => {
    const levels = [1, 5, 11, 20];
    const mockClassTemplate: any = {
      name,
      hitDie,
      fixedHpByLevel,
      acFormula,
      spellcasting: spellcastingEnabled ? {
        ability: spellAbility,
        slotsTable: {}
      } : undefined,
      classResources
    };

    return levels.map(lvl => {
      // 1. Max HP
      const hp = computeMaxHp({
        level: lvl,
        className: name,
        abilities: sampleStats,
        classTemplate: mockClassTemplate,
        hpMode: 'fixed_table'
      });

      // 2. AC
      const ac = computeAC({
        acFormula,
        className: name,
        abilities: sampleStats,
        hasShield: false,
        armorType: 'none'
      });

      // 3. Spell Slots
      const slots = spellcastingEnabled ? computeSlots(name || (casterType === 'full' ? 'full_caster' : 'half_caster'), lvl) : [];

      // 4. Resources
      const res = computeClassResources(name || mockClassTemplate, lvl, sampleStats);

      return {
        level: lvl,
        hp,
        ac,
        slots,
        resources: res
      };
    });
  }, [name, hitDie, fixedHpByLevel, acFormula, spellcastingEnabled, spellAbility, casterType, classResources, sampleStats]);

  const handleOpenLevelEditor = (lvl: number) => {
    setEditingLevel(lvl);
    setEditingLevelFeatures(featuresByLevel[lvl] ? [...featuresByLevel[lvl]] : []);
  };

  const handleSaveLevelFeatures = () => {
    if (editingLevel === null) return;
    setFeaturesByLevel(prev => ({
      ...prev,
      [editingLevel]: editingLevelFeatures
    }));
    setEditingLevel(null);
  };

  const handleSaveAll = async () => {
    if (!name.trim()) {
      setError('نام کلاس الزامی است.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const payload: Partial<ClassTemplate> = {
        name: name.trim(),
        title: title.trim(),
        description: description.trim(),
        hitDie,
        savingThrows,
        baseAbilities,
        skillChoices,
        weaponProf,
        armorProf,
        startingEquipmentChoices,
        starterWeaponOptions,
        acFormula,
        classResources,
        spellcasting: spellcastingEnabled ? {
          ability: spellAbility,
          slotsTable: {},
          cantripsKnownByLevel: {},
          spellsKnownByLevel: {}
        } : undefined,
        extraAttackLevel,
        asiLevels,
        fixedHpByLevel,
        featuresByLevel,
        subclasses,
        companions
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره‌سازی کلاس');
    } finally {
      setIsSaving(false);
    }
  };

  // Six tabs instead of eight: related settings live together (defense + resources + HP; level features + subclasses).
  const TABS: Array<{ id: TabType; label: string }> = [
    { id: 'basics', label: 'مبانی' },
    { id: 'skills_equip', label: 'مهارت و تجهیزات' },
    { id: 'ac_resources', label: 'دفاع و منابع' },
    { id: 'spells', label: 'جادو' },
    { id: 'features', label: 'پیشرفت سطحی' },
    { id: 'companions', label: 'همراهان' }
  ];

  const ABILITIES: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `ویرایش کلاس: ${initialData.name}` : 'کلاس جدید'}
    >
      <div dir="rtl" className="text-start">
        {/* Tabs */}
        <ScrollableRow activeKey={activeTab} wrapperClassName="border-b border-border" className="pb-2 gap-2">
          {TABS.map(tab => (
            <Button
              key={tab.id}
              data-key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 snap-start transition min-h-[44px] border ${
                activeTab === tab.id
                  ? 'bg-accent/15 text-accent-hover border-accent'
                  : 'bg-surface-2 border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </ScrollableRow>

        <div className="pt-5">
          {/* TAB: BASICS */}
          {activeTab === 'basics' && (
            <SectionStack>
              <Section title="هویت کلاس">
                <Field label="نام کلاس" required>
                  <Input noWrapper type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="مثلاً: فرهدار، موبد آذرین" className={inputCls} />
                </Field>
                <Field label="عنوان یا لقب">
                  <Input noWrapper type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="مثلاً: نگهبان سوگندهای باستان" className={inputCls} />
                </Field>
                <Field label="توصیف">
                  <Textarea noWrapper value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    placeholder="نقش و مفهوم این کلاس در جهان بازی" className={textareaCls} />
                </Field>
              </Section>

              <Section title="جان و تاس نجات">
                <Field label="تاس جان">
                  <Select noWrapper value={hitDie} onChange={e => setHitDie(Number(e.target.value))} className={inputCls}>
                    <option value={6}>d6 (جادوگران، ساحران)</option>
                    <option value={8}>d8 (روگ، دروید، راهب، کلریک)</option>
                    <option value={10}>d10 (پالادین، رنجر، جنگجو)</option>
                    <option value={12}>d12 (بربرین)</option>
                  </Select>
                </Field>
                <Field label="تاس‌های نجات مسلط" group>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {ABILITIES.map(ab => (
                      <ToggleChip
                        key={ab}
                        active={savingThrows.includes(ab)}
                        onClick={() =>
                          setSavingThrows(prev => (prev.includes(ab) ? prev.filter(a => a !== ab) : [...prev, ab]))
                        }
                      >
                        {ab.toUpperCase()}
                      </ToggleChip>
                    ))}
                  </div>
                </Field>
              </Section>

              <Section title="ویژگی‌های پایه توصیه‌شده" description="مقادیری که هنگام ساخت شخصیت پیشنهاد می‌شود.">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {ABILITIES.map(ab => (
                    <Field key={ab} label={ab.toUpperCase()}>
                      <Input noWrapper type="number" inputMode="numeric" value={baseAbilities[ab] ?? 10}
                        onChange={e => setBaseAbilities(prev => ({ ...prev, [ab]: Number(e.target.value) }))}
                        className={`${inputCls} text-center`} />
                    </Field>
                  ))}
                </div>
              </Section>
            </SectionStack>
          )}

          {/* TAB: SKILLS & EQUIPMENT */}
          {activeTab === 'skills_equip' && (
            <SectionStack>
              <Section title="مهارت‌های قابل انتخاب" description="بازیکن از این فهرست به تعداد مشخص‌شده انتخاب می‌کند.">
                <Field label="تعداد مهارت قابل انتخاب" className="max-w-[10rem]">
                  <Input noWrapper type="number" inputMode="numeric" min={1} max={6} value={skillChoices.count}
                    onChange={e => setSkillChoices(prev => ({ ...prev, count: Number(e.target.value) }))}
                    className={`${inputCls} text-center`} />
                </Field>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(STANDARD_5E_SKILLS).map(([key, meta]) => {
                    const selected = skillChoices.from.includes(key);
                    return (
                      <ToggleChip
                        key={key}
                        active={selected}
                        className="justify-between"
                        onClick={() =>
                          setSkillChoices(prev => ({
                            ...prev,
                            from: selected ? prev.from.filter(k => k !== key) : [...prev.from, key]
                          }))
                        }
                      >
                        <span className="truncate">{meta.nameFa.split('(')[0].trim()}</span>
                        {selected && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                      </ToggleChip>
                    );
                  })}
                </div>
              </Section>

              <Section
                title="تجهیزات آغازین"
                description="هر دسته یک انتخاب برای بازیکن است."
                action={
                  <AddButton
                    onClick={() => {
                      const newId = `group_${Date.now()}`;
                      setStartingEquipmentChoices(prev => [
                        ...prev,
                        { id: newId, label: 'گزینه جدید', options: [{ label: 'مورد اول', items: ['آیتم 1'] }] }
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    <span>دسته</span>
                  </AddButton>
                }
              >
                {startingEquipmentChoices.map((group, gIdx) => (
                  <div key={group.id || gIdx} className={cardCls}>
                    <div className="flex items-center gap-2">
                      <Input noWrapper type="text" value={group.label} aria-label="عنوان دسته"
                        onChange={e => {
                          const val = e.target.value;
                          setStartingEquipmentChoices(prev => prev.map((g, i) => (i === gIdx ? { ...g, label: val } : g)));
                        }}
                        placeholder="عنوان دسته (مثلاً: زره اولیه)" className={`${inputCls} flex-1 font-bold`} />
                      <IconButton label="حذف دسته" danger
                        onClick={() => setStartingEquipmentChoices(prev => prev.filter((_, i) => i !== gIdx))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>

                    <div className="space-y-3">
                      {group.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex flex-col sm:flex-row gap-2">
                          <Input noWrapper type="text" value={opt.label} aria-label={`برچسب گزینه ${oIdx + 1}`}
                            onChange={e => {
                              const val = e.target.value;
                              setStartingEquipmentChoices(prev => prev.map((g, i) => {
                                if (i !== gIdx) return g;
                                const newOpts = [...g.options];
                                newOpts[oIdx] = { ...newOpts[oIdx], label: val };
                                return { ...g, options: newOpts };
                              }));
                            }}
                            placeholder="برچسب گزینه" className={`${inputCls} sm:w-1/3`} />
                          <Input noWrapper type="text" value={opt.items.join('، ')} aria-label={`آیتم‌های گزینه ${oIdx + 1}`}
                            onChange={e => {
                              const val = e.target.value.split(/[,،]/).map(s => s.trim()).filter(Boolean);
                              setStartingEquipmentChoices(prev => prev.map((g, i) => {
                                if (i !== gIdx) return g;
                                const newOpts = [...g.options];
                                newOpts[oIdx] = { ...newOpts[oIdx], items: val };
                                return { ...g, options: newOpts };
                              }));
                            }}
                            placeholder="آیتم‌ها، با ویرگول جدا کنید" className={`${inputCls} flex-1`} />
                        </div>
                      ))}
                    </div>

                    <AddButton
                      className="w-full sm:w-auto"
                      onClick={() =>
                        setStartingEquipmentChoices(prev => prev.map((g, i) =>
                          i !== gIdx ? g : { ...g, options: [...g.options, { label: 'گزینه جدید', items: ['آیتم'] }] }
                        ))
                      }
                    >
                      <Plus className="w-4 h-4" aria-hidden />
                      <span>گزینه</span>
                    </AddButton>
                  </div>
                ))}
              </Section>
            </SectionStack>
          )}

          {/* TAB: DEFENSE, RESOURCES & HP */}
          {activeTab === 'ac_resources' && (
            <SectionStack>
              <Section title="کلاس زره (AC)" icon={Shield}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <Field label="مقدار پایه">
                    <Input noWrapper type="number" inputMode="numeric" value={acFormula.base}
                      onChange={e => setAcFormula(prev => ({ ...prev, base: Number(e.target.value) }))}
                      className={inputCls} />
                  </Field>
                  <ToggleChip active={Boolean(acFormula.unarmored)}
                    onClick={() => setAcFormula(prev => ({ ...prev, unarmored: !prev.unarmored }))}>
                    {acFormula.unarmored ? <CheckSquare className="w-4 h-4" aria-hidden /> : <Square className="w-4 h-4" aria-hidden />}
                    <span>دفاع بدون زره</span>
                  </ToggleChip>
                </div>

                <Field label="تعدیل‌کننده‌های افزوده به AC" group>
                  <div className="flex flex-wrap gap-2">
                    {(['dex', 'con', 'wis', 'int', 'cha'] as AbilityName[]).map(ab => {
                      const active = acFormula.abilityMods.includes(ab);
                      return (
                        <ToggleChip key={ab} active={active}
                          onClick={() =>
                            setAcFormula(prev => ({
                              ...prev,
                              abilityMods: active ? prev.abilityMods.filter(a => a !== ab) : [...prev.abilityMods, ab]
                            }))
                          }>
                          +{ab.toUpperCase()}
                        </ToggleChip>
                      );
                    })}
                  </div>
                </Field>

                <Field label="یادداشت قانون ویژه">
                  <Input noWrapper type="text" value={acFormula.note || ''}
                    onChange={e => setAcFormula(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="مثلاً: با سپر اعمال نمی‌شود" className={inputCls} />
                </Field>
              </Section>

              <Section
                title="منابع کلاسی"
                action={
                  <AddButton
                    onClick={() =>
                      setClassResources(prev => [
                        ...prev,
                        { name: 'منبع جدید', type: 'points', formulaOrDiceByLevel: '= level', resetType: 'short' }
                      ])
                    }
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    <span>منبع</span>
                  </AddButton>
                }
              >
                {classResources.length === 0 && (
                  <p className="text-sm text-text-muted">این کلاس منبع ویژه‌ای ندارد.</p>
                )}
                {classResources.map((res, rIdx) => (
                  <div key={rIdx} className={cardCls}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="نام منبع">
                        <Input noWrapper type="text" value={res.name}
                          onChange={e => {
                            const val = e.target.value;
                            setClassResources(prev => prev.map((r, i) => (i === rIdx ? { ...r, name: val } : r)));
                          }}
                          placeholder="مثلاً: امتیاز کی" className={inputCls} />
                      </Field>
                      <Field label="فرمول">
                        <Input noWrapper type="text" dir="ltr"
                          value={typeof res.formulaOrDiceByLevel === 'string' ? res.formulaOrDiceByLevel : JSON.stringify(res.formulaOrDiceByLevel)}
                          onChange={e => {
                            const val = e.target.value;
                            setClassResources(prev => prev.map((r, i) => (i === rIdx ? { ...r, formulaOrDiceByLevel: val } : r)));
                          }}
                          placeholder="= level" className={inputCls} />
                      </Field>
                    </div>
                    <div className="flex items-end gap-2">
                      <Field label="بازیابی" className="flex-1">
                        <Select noWrapper value={res.resetType || 'short'}
                          onChange={e => {
                            const val = e.target.value as any;
                            setClassResources(prev => prev.map((r, i) => (i === rIdx ? { ...r, resetType: val } : r)));
                          }}
                          className={inputCls}>
                          <option value="short">استراحت کوتاه</option>
                          <option value="long">استراحت بلند</option>
                        </Select>
                      </Field>
                      <IconButton label="حذف منبع" danger
                        onClick={() => setClassResources(prev => prev.filter((_, i) => i !== rIdx))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </Section>

              <Section
                title="جدول جان ثابت (سطح 1 تا 20)"
                action={
                  <AddButton
                    onClick={() => {
                      const die = hitDie;
                      const conBonus = 2;
                      const avg = Math.floor(die / 2) + 1;
                      const arr: number[] = [die + conBonus];
                      for (let l = 2; l <= 20; l++) arr.push(arr[arr.length - 1] + avg + conBonus);
                      setFixedHpByLevel(arr);
                    }}
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden />
                    <span>میانگین خودکار</span>
                  </AddButton>
                }
              >
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => (
                    <Field key={lvl} label={`سطح ${lvl}`}>
                      <Input noWrapper type="number" inputMode="numeric" value={fixedHpByLevel[lvl - 1] ?? 10}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFixedHpByLevel(prev => {
                            const copy = [...prev];
                            copy[lvl - 1] = val;
                            return copy;
                          });
                        }}
                        className={`${inputCls} text-center`} />
                    </Field>
                  ))}
                </div>
              </Section>
            </SectionStack>
          )}

          {/* TAB: SPELLS */}
          {activeTab === 'spells' && (
            <SectionStack>
              <Section title="جادوگری">
                <ToggleChip
                  active={spellcastingEnabled}
                  onClick={() => {
                    const next = !spellcastingEnabled;
                    setSpellcastingEnabled(next);
                    // 'none' is not a selectable option; default to something valid when enabling
                    if (next && casterType === 'none') setCasterType('half');
                  }}
                  className="w-full sm:w-auto"
                >
                  {spellcastingEnabled ? <CheckSquare className="w-4 h-4" aria-hidden /> : <Square className="w-4 h-4" aria-hidden />}
                  <span>این کلاس جادو اجرا می‌کند</span>
                </ToggleChip>

                {spellcastingEnabled && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="ویژگی جادوگری">
                        <Select noWrapper value={spellAbility} onChange={e => setSpellAbility(e.target.value as any)} className={inputCls}>
                          <option value="int">هوش (INT)</option>
                          <option value="wis">حکمت (WIS)</option>
                          <option value="cha">فرهمندی (CHA)</option>
                        </Select>
                      </Field>
                      <Field label="پیشرفت جایگاه جادو">
                        <Select noWrapper value={casterType === 'none' ? 'half' : casterType}
                          onChange={e => setCasterType(e.target.value as any)} className={inputCls}>
                          <option value="full">کامل (سطح 1 تا 9)</option>
                          <option value="half">نیمه (سطح 1 تا 5)</option>
                        </Select>
                      </Field>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-text-primary mb-2">جایگاه‌های جادو در سطح 5</p>
                      <div className="flex flex-wrap gap-2">
                        {computeSlots(casterType === 'full' ? 'full_caster' : 'half_caster', 5).map((qty, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary">
                            سطح {idx + 1}: {qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Section>
            </SectionStack>
          )}

          {/* TAB: LEVEL FEATURES + SUBCLASSES */}
          {activeTab === 'features' && (
            <SectionStack>
              <Section
                title="ویژگی‌ها در هر سطح"
                description={`برای ویرایش، روی هر سطح بزنید. حمله مضاعف: سطح ${extraAttackLevel || '—'}`}
              >
                <ul className="rounded-xl border border-border divide-y divide-border">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => {
                    const feats = featuresByLevel[lvl] || [];
                    const isAsi = asiLevels.includes(lvl);
                    const isExtra = extraAttackLevel === lvl;
                    return (
                      <li key={lvl}>
                        <button
                          type="button"
                          onClick={() => handleOpenLevelEditor(lvl)}
                          className="w-full min-h-[56px] p-3 flex items-center gap-3 text-start hover:bg-surface-2 transition"
                        >
                          <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent-hover font-bold flex items-center justify-center text-sm shrink-0">
                            {lvl}
                          </span>
                          <span className="flex-1 min-w-0 space-y-1">
                            {feats.length === 0 ? (
                              <span className="block text-sm text-text-muted">بدون ویژگی ویژه</span>
                            ) : (
                              <span className="flex flex-wrap gap-1.5">
                                {feats.map((f, fi) => (
                                  <span key={fi} className="px-2 py-0.5 rounded-md bg-surface-2 text-text-primary text-sm">
                                    {f.name || f}
                                  </span>
                                ))}
                              </span>
                            )}
                            {(isAsi || isExtra) && (
                              <span className="flex gap-2 text-xs">
                                {isAsi && <span className="text-accent-hover">بهبود ویژگی (ASI)</span>}
                                {isExtra && <span className="text-info">حمله مضاعف</span>}
                              </span>
                            )}
                          </span>
                          <Edit className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <Section
                title="زیرکلاس‌ها"
                action={
                  <AddButton
                    onClick={() =>
                      setSubclasses(prev => [...prev, { name: 'زیرکلاس جدید', unlockLevel: 3, featuresByLevel: {} }])
                    }
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    <span>زیرکلاس</span>
                  </AddButton>
                }
              >
                {subclasses.length === 0 && <p className="text-sm text-text-muted">زیرکلاسی تعریف نشده است.</p>}
                {subclasses.map((sub, sIdx) => (
                  <div key={sIdx} className={cardCls}>
                    <div className="flex items-end gap-2">
                      <Field label="نام" className="flex-1">
                        <Input noWrapper type="text" value={sub.name}
                          onChange={e => {
                            const val = e.target.value;
                            setSubclasses(prev => prev.map((s, i) => (i === sIdx ? { ...s, name: val } : s)));
                          }}
                          className={`${inputCls} font-bold`} />
                      </Field>
                      <Field label="سطح بازشدن" className="w-24">
                        <Input noWrapper type="number" inputMode="numeric" value={sub.unlockLevel}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setSubclasses(prev => prev.map((s, i) => (i === sIdx ? { ...s, unlockLevel: val } : s)));
                          }}
                          className={`${inputCls} text-center`} />
                      </Field>
                      <IconButton label="حذف زیرکلاس" danger
                        onClick={() => setSubclasses(prev => prev.filter((_, i) => i !== sIdx))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </Section>
            </SectionStack>
          )}

          {/* TAB: COMPANIONS */}
          {activeTab === 'companions' && (
            <SectionStack>
              <Section
                title="همراهان مکانیکی و جادویی"
                action={
                  <AddButton
                    onClick={() =>
                      setCompanions(prev => [
                        ...prev,
                        { name: 'همراه جدید', type: 'construct', acFormula: '13 + CON', hpFormula: '2×level + 2×CON' }
                      ])
                    }
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    <span>همراه</span>
                  </AddButton>
                }
              >
                {companions.length === 0 && <p className="text-sm text-text-muted">همراهی تعریف نشده است.</p>}
                {companions.map((comp, cIdx) => (
                  <div key={cIdx} className={cardCls}>
                    <div className="flex items-end gap-2">
                      <Field label="نام" className="flex-1">
                        <Input noWrapper type="text" value={comp.name}
                          onChange={e => {
                            const val = e.target.value;
                            setCompanions(prev => prev.map((c, i) => (i === cIdx ? { ...c, name: val } : c)));
                          }}
                          className={`${inputCls} font-bold`} />
                      </Field>
                      <Field label="نوع" className="w-32">
                        <Input noWrapper type="text" dir="ltr" value={comp.type || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setCompanions(prev => prev.map((c, i) => (i === cIdx ? { ...c, type: val } : c)));
                          }}
                          placeholder="construct" className={inputCls} />
                      </Field>
                      <IconButton label="حذف همراه" danger
                        onClick={() => setCompanions(prev => prev.filter((_, i) => i !== cIdx))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="فرمول AC">
                        <Input noWrapper type="text" dir="ltr"
                          value={typeof comp.acFormula === 'string' ? comp.acFormula : (comp.acFormula?.base ? String(comp.acFormula.base) : '')}
                          onChange={e => {
                            const val = e.target.value;
                            setCompanions(prev => prev.map((c, i) => (i === cIdx ? { ...c, acFormula: val } : c)));
                          }}
                          placeholder="13 + CON" className={inputCls} />
                      </Field>
                      <Field label="فرمول HP">
                        <Input noWrapper type="text" dir="ltr" value={comp.hpFormula || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setCompanions(prev => prev.map((c, i) => (i === cIdx ? { ...c, hpFormula: val } : c)));
                          }}
                          placeholder="2×level + 2×CON" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                ))}
              </Section>
            </SectionStack>
          )}
        </div>

        {/* Live validation: secondary, so it is collapsed instead of always sitting under every tab */}
        <details className="mt-6 rounded-xl border border-border group">
          <summary className="min-h-[48px] px-4 flex items-center justify-between gap-3 cursor-pointer list-none">
            <span className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden />
              پیش‌نمایش محاسبات (سطح 1، 5، 11، 20)
            </span>
            <ChevronDown className="w-4 h-4 text-text-muted transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-start text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 pe-3 font-medium text-start">سطح</th>
                  <th className="py-2 pe-3 font-medium text-start">HP</th>
                  <th className="py-2 pe-3 font-medium text-start">AC</th>
                  <th className="py-2 pe-3 font-medium text-start">جایگاه جادو</th>
                  <th className="py-2 font-medium text-start">منابع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {validationResults.map(res => (
                  <tr key={res.level}>
                    <td className="py-2 pe-3 font-bold text-accent-hover whitespace-nowrap">سطح {res.level}</td>
                    <td className="py-2 pe-3 font-bold text-text-primary">{res.hp}</td>
                    <td className="py-2 pe-3 font-bold text-info">{res.ac}</td>
                    <td className="py-2 pe-3 text-text-muted whitespace-nowrap">
                      {res.slots && res.slots.length > 0 ? res.slots.join(' / ') : 'ندارد'}
                    </td>
                    <td className="py-2 text-text-primary">
                      {Object.keys(res.resources).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(res.resources).map((r: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-surface-2 whitespace-nowrap">
                              {r.name.split('(')[0].trim()}: {r.currentDice || r.max}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Sticky actions: always reachable on a long form; error shown next to them */}
        <StickyFooter>
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={handleSaveAll} disabled={isSaving} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
              <Save className="w-4 h-4" aria-hidden />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره کلاس'}</span>
            </Button>
            <Button type="button" onClick={onClose} className={secondaryBtnCls}>انصراف</Button>
          </div>
        </StickyFooter>
      </div>

      {/* SUB-SHEET: edit one level's features */}
      {editingLevel !== null && (
        <BottomSheet
          isOpen={editingLevel !== null}
          onClose={() => setEditingLevel(null)}
          title={`ویژگی‌های سطح ${editingLevel}`}
        >
          <div dir="rtl" className="text-start space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">ویژگی‌هایی که در این سطح باز می‌شوند</span>
              <AddButton
                onClick={() =>
                  setEditingLevelFeatures(prev => [...prev, { name: 'قابلیت جدید', description: 'توضیحات اثر مکانیکی...' }])
                }
              >
                <Plus className="w-4 h-4" aria-hidden />
                <span>قابلیت</span>
              </AddButton>
            </div>

            {editingLevelFeatures.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-6">برای سطح {editingLevel} قابلیتی ثبت نشده است.</p>
            ) : (
              editingLevelFeatures.map((feat, fIdx) => (
                <div key={fIdx} className={cardCls}>
                  <div className="flex items-center gap-2">
                    <Input noWrapper type="text" value={feat.name || ''} aria-label="نام ویژگی"
                      onChange={e => {
                        const val = e.target.value;
                        setEditingLevelFeatures(prev => prev.map((f, i) => (i === fIdx ? { ...f, name: val } : f)));
                      }}
                      placeholder="نام ویژگی" className={`${inputCls} flex-1 font-bold`} />
                    <IconButton label="حذف قابلیت" danger
                      onClick={() => setEditingLevelFeatures(prev => prev.filter((_, i) => i !== fIdx))}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                  <Textarea noWrapper rows={3} value={feat.description || ''} aria-label="شرح ویژگی"
                    onChange={e => {
                      const val = e.target.value;
                      setEditingLevelFeatures(prev => prev.map((f, i) => (i === fIdx ? { ...f, description: val } : f)));
                    }}
                    placeholder="شرح اثر مکانیکی یا کارکرد ویژگی" className={textareaCls} />
                </div>
              ))
            )}

            <StickyFooter>
              <div className="flex gap-2">
                <Button type="button" onClick={handleSaveLevelFeatures} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
                  تأیید سطح {editingLevel}
                </Button>
                <Button type="button" onClick={() => setEditingLevel(null)} className={secondaryBtnCls}>لغو</Button>
              </div>
            </StickyFooter>
          </div>
        </BottomSheet>
      )}
    </BottomSheet>
  );
};