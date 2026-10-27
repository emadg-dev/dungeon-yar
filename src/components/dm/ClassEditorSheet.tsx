import React, { useState, useMemo } from 'react';
import { ClassTemplate, EquipmentChoiceGroup, CompanionDef } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { 
  computeMaxHp, computeSlots, computeClassResources, computeAC, 
  AbilityScoresInput, AbilityName, STANDARD_5E_SKILLS 
} from '../../../shared/rules/engine';
import { 
  Shield, Swords, Heart, Sparkles, BookOpen, Layers, 
  Check, Plus, Trash2, Edit, Sliders, CheckSquare, Square, 
  AlertCircle, ChevronDown, ChevronUp, Save, X, RefreshCw
} from 'lucide-react';

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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `ویرایش کلاس: ${initialData.name}` : 'تعریف کلاس جدید'}
    >
      <div className="space-y-4 py-2 text-right text-xs" dir="rtl">
        {error && (
          <div className="p-3 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 8 Tab Navigation Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[#2F2A23]">
          {[
            { id: 'basics', label: '۱. مبانی' },
            { id: 'skills_equip', label: '۲. مهارت و تجهیزات' },
            { id: 'ac_resources', label: '۳. زره و منابع' },
            { id: 'spells', label: '۴. جادوها' },
            { id: 'features', label: '۵. ویژگی‌های ۱–۲۰' },
            { id: 'subclasses', label: '۶. زیرکلاس‌ها' },
            { id: 'companions', label: '۷. همراهان' },
            { id: 'hp_table', label: '۸. جدول جان' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition min-h-[36px] ${
                activeTab === tab.id
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-black shadow-sm'
                  : 'bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:border-[#3A342B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BASICS */}
        {activeTab === 'basics' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[#A39A89] mb-1 font-bold">نام اصلی کلاس (شناسه):</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: فرهدار، موبد آذرین، جنگاور"
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A39A89] mb-1 font-bold">عنوان تماتیک / لقب:</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثلاً: نگهبان سوگندهای باستان"
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A39A89] mb-1 font-bold">توصیف و زمینه:</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="توضیح نقش و مفهوم این کلاس در جهان بازی..."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A39A89] mb-1 font-bold">تاس جان (Hit Die):</label>
                <select
                  value={hitDie}
                  onChange={e => setHitDie(Number(e.target.value))}
                  className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none"
                >
                  <option value={6}>d6 (جادوگران، ساحران)</option>
                  <option value={8}>d8 (روگ، دروید، راهب، کلریک)</option>
                  <option value={10}>d10 (پالادین، رنجر، جنگجو)</option>
                  <option value={12}>d12 (بربرین)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A39A89] mb-1 font-bold">تاس‌های نجات مسلط:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityName[]).map(ab => {
                    const active = savingThrows.includes(ab);
                    return (
                      <button
                        key={ab}
                        type="button"
                        onClick={() => {
                          setSavingThrows(prev => 
                            active ? prev.filter(a => a !== ab) : [...prev, ab]
                          );
                        }}
                        className={`py-1 rounded-lg text-center font-bold text-[11px] border transition ${
                          active 
                            ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]' 
                            : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                        }`}
                      >
                        {ab.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#A39A89] mb-1 font-bold">ویژگی‌های پایه توصیه‌شده (Base Abilities):</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityName[]).map(ab => (
                  <div key={ab} className="text-center">
                    <span className="block text-[10px] text-[#A39A89]">{ab.toUpperCase()}</span>
                    <input
                      type="number"
                      value={baseAbilities[ab] ?? 10}
                      onChange={e => setBaseAbilities(prev => ({ ...prev, [ab]: Number(e.target.value) }))}
                      className="w-full bg-[#201D19] border border-[#2F2A23] rounded-lg p-1 text-center text-xs text-[#EDE6D8]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS & EQUIPMENT */}
        {activeTab === 'skills_equip' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#201D19]/70 border border-[#2F2A23] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE6D8]">انتخاب مهارت‌ها:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#A39A89]">تعداد انتخاب:</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={skillChoices.count}
                    onChange={e => setSkillChoices(prev => ({ ...prev, count: Number(e.target.value) }))}
                    className="w-12 bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-center text-xs text-[#EDE6D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pt-1">
                {Object.entries(STANDARD_5E_SKILLS).map(([key, meta]) => {
                  const selected = skillChoices.from.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSkillChoices(prev => ({
                          ...prev,
                          from: selected ? prev.from.filter(k => k !== key) : [...prev.from, key]
                        }));
                      }}
                      className={`text-right px-2 py-1.5 rounded-lg text-[11px] font-medium border flex items-center justify-between transition ${
                        selected 
                          ? 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]' 
                          : 'bg-[#171513] text-[#A39A89] border-[#2F2A23]'
                      }`}
                    >
                      <span className="truncate">{meta.nameFa.split('(')[0].trim()}</span>
                      {selected ? <Check className="w-3 h-3 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Starting Equipment Choice Groups */}
            <div className="p-3 rounded-xl bg-[#201D19]/70 border border-[#2F2A23] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE6D8]">دسته‌های انتخاب تجهیزات آغازین:</span>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `group_${Date.now()}`;
                    setStartingEquipmentChoices(prev => [
                      ...prev,
                      { id: newId, label: 'گزینه جدید', options: [{ label: 'مورد اول', items: ['آیتم ۱'] }] }
                    ]);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>افزودن دسته</span>
                </button>
              </div>

              {startingEquipmentChoices.map((group, gIdx) => (
                <div key={group.id || gIdx} className="p-2.5 rounded-xl bg-[#171513] border border-[#2F2A23] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={group.label}
                      onChange={e => {
                        const val = e.target.value;
                        setStartingEquipmentChoices(prev => prev.map((g, i) => i === gIdx ? { ...g, label: val } : g));
                      }}
                      placeholder="عنوان دسته (مثلاً: زره اولیه)"
                      className="bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8] flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setStartingEquipmentChoices(prev => prev.filter((_, i) => i !== gIdx))}
                      className="text-[#C2512B] p-1 hover:bg-[#C2512B]/20 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Options inside this group */}
                  <div className="space-y-1.5 pl-2">
                    {group.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#A39A89]">({oIdx + 1})</span>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={e => {
                            const val = e.target.value;
                            setStartingEquipmentChoices(prev => prev.map((g, i) => {
                              if (i !== gIdx) return g;
                              const newOpts = [...g.options];
                              newOpts[oIdx] = { ...newOpts[oIdx], label: val };
                              return { ...g, options: newOpts };
                            }));
                          }}
                          placeholder="برچسب انتخاب"
                          className="w-1/3 bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1 text-[11px] text-[#EDE6D8]"
                        />
                        <input
                          type="text"
                          value={opt.items.join('، ')}
                          onChange={e => {
                            const val = e.target.value.split(/[,،]/).map(s => s.trim()).filter(Boolean);
                            setStartingEquipmentChoices(prev => prev.map((g, i) => {
                              if (i !== gIdx) return g;
                              const newOpts = [...g.options];
                              newOpts[oIdx] = { ...newOpts[oIdx], items: val };
                              return { ...g, options: newOpts };
                            }));
                          }}
                          placeholder="آیتم‌ها با کاما"
                          className="flex-1 bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1 text-[11px] text-[#EDE6D8]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setStartingEquipmentChoices(prev => prev.map((g, i) => {
                          if (i !== gIdx) return g;
                          return {
                            ...g,
                            options: [...g.options, { label: 'گزینه جدید', items: ['آیتم'] }]
                          };
                        }));
                      }}
                      className="text-[10px] text-[#E0A030] hover:underline block pt-1"
                    >
                      + افزودن گزینه به این دسته
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AC & RESOURCES */}
        {activeTab === 'ac_resources' && (
          <div className="space-y-4">
            {/* Structured AC Formula */}
            <div className="p-3 rounded-xl bg-[#201D19]/70 border border-[#2F2A23] space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F2C265]" />
                <span className="font-bold text-[#EDE6D8]">فرمول ساختاریافته کلاس زره (AC Formula):</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A39A89] mb-1 font-bold">مقدار پایه (Base AC):</label>
                  <input
                    type="number"
                    value={acFormula.base}
                    onChange={e => setAcFormula(prev => ({ ...prev, base: Number(e.target.value) }))}
                    className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setAcFormula(prev => ({ ...prev, unarmored: !prev.unarmored }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      acFormula.unarmored 
                        ? 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]' 
                        : 'bg-[#171513] text-[#A39A89] border-[#2F2A23]'
                    }`}
                  >
                    {acFormula.unarmored ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span>دفاع بدون زره (Unarmored)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#A39A89] mb-1 font-bold">تعدیل‌کننده‌های افزوده به AC:</label>
                <div className="flex gap-2">
                  {(['dex', 'con', 'wis', 'int', 'cha'] as AbilityName[]).map(ab => {
                    const active = acFormula.abilityMods.includes(ab);
                    return (
                      <button
                        key={ab}
                        type="button"
                        onClick={() => {
                          setAcFormula(prev => ({
                            ...prev,
                            abilityMods: active 
                              ? prev.abilityMods.filter(a => a !== ab)
                              : [...prev.abilityMods, ab]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          active 
                            ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]' 
                            : 'bg-[#171513] text-[#A39A89] border-[#2F2A23]'
                        }`}
                      >
                        +{ab.toUpperCase()} Mod
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#A39A89] mb-1 font-bold">یادداشت فنی یا قانون ویژه AC:</label>
                <input
                  type="text"
                  value={acFormula.note || ''}
                  onChange={e => setAcFormula(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="مثلاً: در صورت استفاده از سپر اعمال نمی‌شود..."
                  className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                />
              </div>
            </div>

            {/* Class Resources */}
            <div className="p-3 rounded-xl bg-[#201D19]/70 border border-[#2F2A23] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE6D8]">منابع کلاسی (Class Resources):</span>
                <button
                  type="button"
                  onClick={() => {
                    setClassResources(prev => [
                      ...prev,
                      { name: 'منبع جدید', type: 'points', formulaOrDiceByLevel: '= level', resetType: 'short' }
                    ]);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>افزودن منبع</span>
                </button>
              </div>

              {classResources.map((res, rIdx) => (
                <div key={rIdx} className="p-2.5 rounded-xl bg-[#171513] border border-[#2F2A23] grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <input
                    type="text"
                    value={res.name}
                    onChange={e => {
                      const val = e.target.value;
                      setClassResources(prev => prev.map((r, i) => i === rIdx ? { ...r, name: val } : r));
                    }}
                    placeholder="نام منبع (مثلاً: امتیاز کی/لحظه)"
                    className="bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8]"
                  />
                  <input
                    type="text"
                    value={typeof res.formulaOrDiceByLevel === 'string' ? res.formulaOrDiceByLevel : JSON.stringify(res.formulaOrDiceByLevel)}
                    onChange={e => {
                      const val = e.target.value;
                      setClassResources(prev => prev.map((r, i) => i === rIdx ? { ...r, formulaOrDiceByLevel: val } : r));
                    }}
                    placeholder="فرمول: = level یا INT mod + 1"
                    className="bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8]"
                  />
                  <select
                    value={res.resetType || 'short'}
                    onChange={e => {
                      const val = e.target.value as any;
                      setClassResources(prev => prev.map((r, i) => i === rIdx ? { ...r, resetType: val } : r));
                    }}
                    className="bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8]"
                  >
                    <option value="short">استراحت کوتاه</option>
                    <option value="long">استراحت بلند</option>
                  </select>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setClassResources(prev => prev.filter((_, i) => i !== rIdx))}
                      className="text-[#C2512B] p-1 hover:bg-[#C2512B]/20 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SPELLS */}
        {activeTab === 'spells' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#201D19]/70 border border-[#2F2A23] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE6D8]">سیستم اجرای جادو (Spellcasting):</span>
                <button
                  type="button"
                  onClick={() => setSpellcastingEnabled(!spellcastingEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    spellcastingEnabled 
                      ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]' 
                      : 'bg-[#171513] text-[#A39A89] border-[#2F2A23]'
                  }`}
                >
                  {spellcastingEnabled ? 'جادوگری فعال است' : 'فاقد جادوگری'}
                </button>
              </div>

              {spellcastingEnabled && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#A39A89] mb-1 font-bold">ویژگی جادوگری (Spell Ability):</label>
                      <select
                        value={spellAbility}
                        onChange={e => setSpellAbility(e.target.value as any)}
                        className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                      >
                        <option value="int">هوش (INT)</option>
                        <option value="wis">حکمت (WIS)</option>
                        <option value="cha">فرهمندی (CHA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#A39A89] mb-1 font-bold">نوع پیشرفت جایگاه جادو:</label>
                      <select
                        value={casterType}
                        onChange={e => setCasterType(e.target.value as any)}
                        className="w-full bg-[#171513] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                      >
                        <option value="full">جادوگر کامل (Full Caster: سطح ۱ تا ۹)</option>
                        <option value="half">نیمه‌جادوگر (Half Caster: سطح ۱ تا ۵)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#171513] text-[11px] text-[#A39A89]">
                    <span className="text-[#F2C265] font-bold block mb-1">پیش‌نمایش اسلات‌های جادو در سطح ۵:</span>
                    {spellcastingEnabled && (
                      <div className="flex gap-2">
                        {computeSlots(casterType === 'full' ? 'full_caster' : 'half_caster', 5).map((qty, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8]">
                            سطح {idx + 1}: {qty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: FEATURES BY LEVEL 1–20 */}
        {activeTab === 'features' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EDE6D8]">مرور کلی ویژگی‌ها (سطوح ۱ تا ۲۰):</span>
              <div className="flex items-center gap-2 text-[11px] text-[#A39A89]">
                <span>حمله مضاعف: سطح {extraAttackLevel || '—'}</span>
              </div>
            </div>

            {/* Read-Only Scrollable Overview */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => {
                const feats = featuresByLevel[lvl] || [];
                const isAsi = asiLevels.includes(lvl);
                const isExtra = extraAttackLevel === lvl;

                return (
                  <div
                    key={lvl}
                    onClick={() => handleOpenLevelEditor(lvl)}
                    className="p-2.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030]/50 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#E0A030]/20 text-[#F2C265] font-bold flex items-center justify-center text-xs shrink-0">
                        {lvl}
                      </span>
                      <div>
                        {feats.length === 0 ? (
                          <span className="text-[#A39A89] text-[11px] italic">بدون ویژگی ویژه</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {feats.map((f, fi) => (
                              <span key={fi} className="px-1.5 py-0.5 rounded bg-[#171513] text-[#EDE6D8] text-[11px]">
                                {f.name || f}
                              </span>
                            ))}
                          </div>
                        )}
                        {(isAsi || isExtra) && (
                          <div className="flex gap-1 mt-0.5">
                            {isAsi && <span className="text-[9px] text-[#F2C265]">بهبود ویژگی (ASI)</span>}
                            {isExtra && <span className="text-[9px] text-[#7FB4D6]">Extra Attack</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1 rounded bg-[#171513] text-[#A39A89] hover:text-[#EDE6D8]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: SUBCLASSES */}
        {activeTab === 'subclasses' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EDE6D8]">زیرکلاس‌ها (Subclasses):</span>
              <button
                type="button"
                onClick={() => {
                  setSubclasses(prev => [
                    ...prev,
                    { name: 'زیرکلاس جدید', unlockLevel: 3, featuresByLevel: {} }
                  ]);
                }}
                className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن زیرکلاس</span>
              </button>
            </div>

            {subclasses.map((sub, sIdx) => (
              <div key={sIdx} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={e => {
                      const val = e.target.value;
                      setSubclasses(prev => prev.map((s, i) => i === sIdx ? { ...s, name: val } : s));
                    }}
                    className="bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8] font-bold flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#A39A89]">سطح بازشدن:</span>
                    <input
                      type="number"
                      value={sub.unlockLevel}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setSubclasses(prev => prev.map((s, i) => i === sIdx ? { ...s, unlockLevel: val } : s));
                      }}
                      className="w-12 bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-center text-xs text-[#EDE6D8]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubclasses(prev => prev.filter((_, i) => i !== sIdx))}
                    className="text-[#C2512B] p-1 hover:bg-[#C2512B]/20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: COMPANIONS */}
        {activeTab === 'companions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EDE6D8]">همراهان مکانیکی و جادویی (Companions):</span>
              <button
                type="button"
                onClick={() => {
                  setCompanions(prev => [
                    ...prev,
                    { name: 'همراه جدید', type: 'construct', acFormula: '13 + CON', hpFormula: '2×level + 2×CON' }
                  ]);
                }}
                className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن همراه</span>
              </button>
            </div>

            {companions.map((comp, cIdx) => (
              <div key={cIdx} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={e => {
                      const val = e.target.value;
                      setCompanions(prev => prev.map((c, i) => i === cIdx ? { ...c, name: val } : c));
                    }}
                    placeholder="نام همراه"
                    className="bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8] font-bold flex-1"
                  />
                  <input
                    type="text"
                    value={comp.type || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setCompanions(prev => prev.map((c, i) => i === cIdx ? { ...c, type: val } : c));
                    }}
                    placeholder="نوع (construct/beast)"
                    className="w-24 bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8]"
                  />
                  <button
                    type="button"
                    onClick={() => setCompanions(prev => prev.filter((_, i) => i !== cIdx))}
                    className="text-[#C2512B] p-1 hover:bg-[#C2512B]/20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={typeof comp.acFormula === 'string' ? comp.acFormula : (comp.acFormula?.base ? String(comp.acFormula.base) : '')}
                    onChange={e => {
                      const val = e.target.value;
                      setCompanions(prev => prev.map((c, i) => i === cIdx ? { ...c, acFormula: val } : c));
                    }}
                    placeholder="فرمول AC (مثلاً: 13 + CON)"
                    className="bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8]"
                  />
                  <input
                    type="text"
                    value={comp.hpFormula || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setCompanions(prev => prev.map((c, i) => i === cIdx ? { ...c, hpFormula: val } : c));
                    }}
                    placeholder="فرمول HP (مثلاً: 2×level + 2×CON)"
                    className="bg-[#171513] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: HP TABLE */}
        {activeTab === 'hp_table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EDE6D8]">جدول پیشرفت جان ثابت (Fixed HP Table 1–20):</span>
              <button
                type="button"
                onClick={() => {
                  const die = hitDie;
                  const conBonus = 2;
                  const avg = Math.floor(die / 2) + 1;
                  const arr: number[] = [die + conBonus];
                  for (let l = 2; l <= 20; l++) {
                    arr.push(arr[arr.length - 1] + avg + conBonus);
                  }
                  setFixedHpByLevel(arr);
                }}
                className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[10px] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>محاسبه خودکار میانگین</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => (
                <div key={lvl} className="p-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                  <span className="text-[10px] text-[#A39A89] block">سطح {lvl}</span>
                  <input
                    type="number"
                    value={fixedHpByLevel[lvl - 1] ?? 10}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFixedHpByLevel(prev => {
                        const copy = [...prev];
                        copy[lvl - 1] = val;
                        return copy;
                      });
                    }}
                    className="w-full bg-[#171513] border border-[#2F2A23] rounded-lg p-1 text-center font-bold text-xs text-[#EDE6D8]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VALIDATION PANEL (Levels 1, 5, 11, 20) */}
        <div className="mt-4 p-3 rounded-2xl bg-[#171513] border border-[#E0A030]/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F2C265]" />
              <span className="font-extrabold text-[#F2C265]">اعتبارسنجی زنده با موتور قوانین (Rules Engine Validation):</span>
            </div>
            <span className="text-[10px] text-[#A39A89]">پیش‌نمایش سطوح ۱، ۵، ۱۱ و ۲۰</span>
          </div>

          {/* Validation Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#2F2A23] text-[#A39A89]">
                  <th className="py-1 px-2">سطح</th>
                  <th className="py-1 px-2">HP کل</th>
                  <th className="py-1 px-2">AC پیش‌فرض</th>
                  <th className="py-1 px-2">اسلات‌های جادو</th>
                  <th className="py-1 px-2">منابع کلاسی فعال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2F2A23]">
                {validationResults.map(res => (
                  <tr key={res.level} className="hover:bg-[#201D19]">
                    <td className="py-1.5 px-2 font-black text-[#F2C265]">سطح {res.level}</td>
                    <td className="py-1.5 px-2 font-bold text-[#EDE6D8]">{res.hp}</td>
                    <td className="py-1.5 px-2 font-bold text-[#7FB4D6]">{res.ac}</td>
                    <td className="py-1.5 px-2 text-[#A39A89]">
                      {res.slots && res.slots.length > 0 ? res.slots.join(' / ') : 'ندارد'}
                    </td>
                    <td className="py-1.5 px-2 text-[10px] text-[#EDE6D8]">
                      {Object.keys(res.resources).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.values(res.resources).map((r: any, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-[#201D19] border border-[#2F2A23]">
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
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#2F2A23] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] font-bold min-h-[44px]"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl btn-primary-amber font-extrabold shadow-md flex items-center gap-1.5 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره کلاس'}</span>
          </button>
        </div>
      </div>

      {/* SUB-SHEET: Edit Level Features One Level at a Time */}
      {editingLevel !== null && (
        <BottomSheet
          isOpen={editingLevel !== null}
          onClose={() => setEditingLevel(null)}
          title={`ویرایش ویژگی‌های سطح ${editingLevel}`}
        >
          <div className="space-y-3 py-2 text-right text-xs" dir="rtl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EDE6D8]">ویژگی‌های آزادشده در این سطح:</span>
              <button
                type="button"
                onClick={() => {
                  setEditingLevelFeatures(prev => [
                    ...prev,
                    { name: 'قابلیت جدید', description: 'توضیحات اثر مکانیکی...' }
                  ]);
                }}
                className="px-2 py-1 rounded-lg bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن قابلیت</span>
              </button>
            </div>

            {editingLevelFeatures.length === 0 ? (
              <p className="text-center text-[#A39A89] py-4">هیچ قابلیتی برای سطح {editingLevel} ثبت نشده است.</p>
            ) : (
              editingLevelFeatures.map((feat, fIdx) => (
                <div key={fIdx} className="p-2.5 rounded-xl bg-[#171513] border border-[#2F2A23] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={feat.name || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingLevelFeatures(prev => prev.map((f, i) => i === fIdx ? { ...f, name: val } : f));
                      }}
                      placeholder="نام ویژگی"
                      className="bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8] font-bold flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingLevelFeatures(prev => prev.filter((_, i) => i !== fIdx))}
                      className="text-[#C2512B] p-1 hover:bg-[#C2512B]/20 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={feat.description || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingLevelFeatures(prev => prev.map((f, i) => i === fIdx ? { ...f, description: val } : f));
                    }}
                    placeholder="شرح اثر مکانیکی یا کارکرد ویژگی..."
                    className="w-full bg-[#201D19] border border-[#2F2A23] rounded-lg px-2 py-1 text-xs text-[#EDE6D8]"
                  />
                </div>
              ))
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLevel(null)}
                className="px-3 py-1.5 rounded-xl bg-[#201D19] text-[#A39A89] min-h-[36px]"
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSaveLevelFeatures}
                className="px-4 py-1.5 rounded-xl btn-primary-amber font-bold text-xs min-h-[36px]"
              >
                تأیید سطح {editingLevel}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </BottomSheet>
  );
};
