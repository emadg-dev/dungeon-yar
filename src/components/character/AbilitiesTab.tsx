import React, { useState } from 'react';
import { Character, AbilityName, SkillDefinition } from '../../types';
import { getAbilityModifier, getProficiencyBonus, formatModifier } from '../../utils/dice';
import { Shield, Sparkles, Plus, Dices, Search, Check } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface AbilitiesTabProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  onRollCheck: (sides: number, count: number, modifier: number, label: string) => void;
}

export const AbilitiesTab: React.FC<AbilitiesTabProps> = ({
  character,
  onUpdate,
  onRollCheck
}) => {
  const [showAddCustomSkill, setShowAddCustomSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillAbility, setCustomSkillAbility] = useState<AbilityName>('int');
  const [skillsSearch, setSkillsSearch] = useState('');

  const profBonus = getProficiencyBonus(character.level);

  const abilityLabels: Record<AbilityName, { fa: string; shortFa: string; en: string }> = {
    str: { fa: 'قدرتمندی', shortFa: 'قدرت', en: 'STR' },
    dex: { fa: 'چابکی', shortFa: 'چابکی', en: 'DEX' },
    con: { fa: 'بنیه و استقامت', shortFa: 'بنیه', en: 'CON' },
    int: { fa: 'هوش و دانش', shortFa: 'هوش', en: 'INT' },
    wis: { fa: 'خرد و بینش', shortFa: 'خرد', en: 'WIS' },
    cha: { fa: 'فرهمندی و جذبه', shortFa: 'فرهمندی', en: 'CHA' }
  };

  const handleAbilityScoreChange = (ability: AbilityName, newScore: number) => {
    onUpdate({
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: Math.max(1, Math.min(30, newScore))
      }
    });
  };

  const handleToggleSavingThrow = (ability: AbilityName) => {
    onUpdate({
      ...character,
      savingThrows: {
        ...character.savingThrows,
        [ability]: !character.savingThrows[ability]
      }
    });
  };

  // Cycle proficiency: none -> proficient -> expertise -> none
  const cycleSkillProficiency = (skillId: string) => {
    const updatedSkills = character.skills.map(s => {
      if (s.id === skillId) {
        if (!s.proficient && !s.expertise) {
          return { ...s, proficient: true, expertise: false };
        } else if (s.proficient && !s.expertise) {
          return { ...s, proficient: true, expertise: true };
        } else {
          return { ...s, proficient: false, expertise: false };
        }
      }
      return s;
    });
    onUpdate({ ...character, skills: updatedSkills });
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillName.trim()) return;

    const newSkill: SkillDefinition = {
      id: `custom-skill-${Date.now()}`,
      nameFa: customSkillName.trim(),
      nameEn: 'Custom',
      ability: customSkillAbility,
      proficient: true,
      expertise: false,
      custom: true
    };

    onUpdate({
      ...character,
      skills: [...character.skills, newSkill]
    });

    setCustomSkillName('');
    setShowAddCustomSkill(false);
  };

  const filteredSkills = character.skills.filter(s =>
    !skillsSearch || s.nameFa.toLowerCase().includes(skillsSearch.toLowerCase()) ||
    abilityLabels[s.ability].fa.includes(skillsSearch)
  );

  const abilityKeys: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  return (
    <div className="space-y-4" dir="rtl">
      {/* 2×3 Grid of Ability Cards */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E0A030]" />
            ویژگی‌های بنیادین (شش‌گانه)
          </h3>
          <span className="text-[11px] text-[#A39A89]">
            پاداش تسلط: <strong className="text-[#E0A030] font-mono dice-ltr font-black">+{profBonus}</strong>
          </span>
        </div>

        {/* 2 columns on mobile (2x3), 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {abilityKeys.map(key => {
            const score = character.abilities[key];
            const mod = getAbilityModifier(score);

            return (
              <div
                key={key}
                className="surface-card rounded-[14px] p-3 flex flex-col items-center justify-between text-center transition"
              >
                <div className="w-full flex items-center justify-between text-xs text-[#A39A89] font-bold px-0.5">
                  <span className="text-xs text-[#EDE6D8]">{abilityLabels[key].shortFa}</span>
                  <span className="text-[10px] text-[#A39A89] font-mono">{abilityLabels[key].en}</span>
                </div>

                {/* Big Modifier Button: Tap to Roll */}
                <button
                  type="button"
                  onClick={() => onRollCheck(20, 1, mod, `چک ${abilityLabels[key].fa}`)}
                  className="my-1.5 w-full py-2 px-3 rounded-[12px] bg-[#201D19] active:bg-[#E0A030]/20 border border-[#2F2A23] active:border-[#E0A030] text-[#E0A030] font-mono text-3xl font-black transition active:scale-95 touch-target flex items-center justify-center gap-1 cursor-pointer dice-ltr"
                  title="لمس برای پرتاب تاس چک ویژگی"
                >
                  <span>{formatModifier(mod)}</span>
                  <Dices className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Small Score Stepper */}
                <div className="flex items-center justify-center gap-1 text-xs text-[#A39A89] bg-[#0E0D0C] py-0.5 px-1 rounded-[10px] border border-[#2F2A23] w-full">
                  <button
                    type="button"
                    onClick={() => handleAbilityScoreChange(key, score - 1)}
                    className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold flex items-center justify-center touch-target active:scale-95"
                    title="کاهش امتیاز"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="30"
                    value={score}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleAbilityScoreChange(key, parseInt(e.target.value) || 10)}
                    className="w-8 text-center font-bold text-[#EDE6D8] bg-transparent focus:outline-none text-sm font-mono dice-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => handleAbilityScoreChange(key, score + 1)}
                    className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold flex items-center justify-center touch-target active:scale-95"
                    title="افزایش امتیاز"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saves Row */}
      <div className="surface-card rounded-[14px] p-3.5">
        <h3 className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5 mb-2.5 pb-2 border-b border-[#2F2A23]">
          <Shield className="w-4 h-4 text-[#E0A030]" />
          تست‌های نجات (Saving Throws)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {abilityKeys.map(key => {
            const isProf = !!character.savingThrows[key];
            const mod = getAbilityModifier(character.abilities[key]);
            const saveBonus = mod + (isProf ? profBonus : 0);

            return (
              <div
                key={key}
                className={`flex items-center justify-between p-2 rounded-[10px] border transition ${
                  isProf
                    ? 'bg-[#E0A030]/10 border-[#E0A030]/40 text-[#EDE6D8]'
                    : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89]'
                }`}
              >
                <label className="flex items-center gap-1.5 cursor-pointer touch-target select-none">
                  <input
                    type="checkbox"
                    checked={isProf}
                    onChange={() => handleToggleSavingThrow(key)}
                    className="w-4 h-4 rounded text-[#E0A030] accent-[#E0A030] cursor-pointer"
                  />
                  <span className="text-xs font-bold">{abilityLabels[key].shortFa}</span>
                </label>

                <button
                  type="button"
                  onClick={() => onRollCheck(20, 1, saveBonus, `تست نجات ${abilityLabels[key].fa}`)}
                  className="font-mono font-extrabold text-xs px-2 py-1 rounded-[8px] bg-[#171513] hover:bg-[#E0A030]/20 text-[#E0A030] transition cursor-pointer touch-target dice-ltr border border-[#2F2A23]"
                >
                  {formatModifier(saveBonus)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills Section with Proficiency Dots */}
      <div className="surface-card rounded-[14px] p-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#2F2A23]">
          <div>
            <h3 className="text-xs font-bold text-[#EDE6D8]">مهارت‌ها (Skills)</h3>
            <p className="text-[10px] text-[#A39A89]">
              نقطه خالی = غیرمسلط • نقطه پر = مسلط • نقطه طلایی = تخصص دوبرابر
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="جستجوی مهارت..."
                value={skillsSearch}
                onChange={(e) => setSkillsSearch(e.target.value)}
                className="w-full sm:w-44 py-1.5 pe-3 ps-7 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
              <Search className="w-3.5 h-3.5 text-[#A39A89] absolute start-2 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustomSkill(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-[#E0A030]/15 hover:bg-[#E0A030]/25 text-[#E0A030] border border-[#E0A030]/30 text-xs font-bold transition touch-target shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهارت نو</span>
            </button>
          </div>
        </div>

        {/* Skills List with Proficiency Dots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredSkills.map((skill) => {
            const baseMod = getAbilityModifier(character.abilities[skill.ability]);
            let totalMod = baseMod;
            if (skill.expertise) {
              totalMod += profBonus * 2;
            } else if (skill.proficient) {
              totalMod += profBonus;
            }

            return (
              <div
                key={skill.id}
                className="flex items-center justify-between p-2 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#2F2A23]/80 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Proficiency Dot Button: Cycles empty -> filled -> gold (expertise) */}
                  <button
                    type="button"
                    onClick={() => cycleSkillProficiency(skill.id)}
                    className="touch-target w-8 h-8 flex items-center justify-center shrink-0"
                    title={skill.expertise ? 'تخصص دوبرابر (لمس برای بازنشانی)' : skill.proficient ? 'مسلط (لمس برای تبدیل به تخصص)' : 'غیرمسلط (لمس برای تسلط)'}
                    aria-label={`تغییر تسلط ${skill.nameFa}`}
                  >
                    {skill.expertise ? (
                      <span className="w-4 h-4 rounded-full bg-[#E0A030] border-2 border-[#F2C265] shadow-[0_0_8px_rgba(224,160,48,0.6)] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E0D0C]" />
                      </span>
                    ) : skill.proficient ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#E0A030] border border-[#E0A030]" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-[#A39A89]/50 bg-transparent" />
                    )}
                  </button>

                  {/* Skill Name: Tap to Roll */}
                  <button
                    type="button"
                    onClick={() => onRollCheck(20, 1, totalMod, `چک مهارت ${skill.nameFa} (${abilityLabels[skill.ability].shortFa})`)}
                    className="text-right truncate flex-1 hover:text-[#E0A030] transition touch-target"
                  >
                    <div className="text-xs font-bold text-[#EDE6D8] truncate">{skill.nameFa}</div>
                    <div className="text-[10px] text-[#A39A89]">
                      {abilityLabels[skill.ability].shortFa} {skill.expertise ? '• تخصص ۲x' : skill.proficient ? '• مسلط' : ''}
                    </div>
                  </button>
                </div>

                {/* Roll Modifier Badge */}
                <button
                  type="button"
                  onClick={() => onRollCheck(20, 1, totalMod, `چک مهارت ${skill.nameFa} (${abilityLabels[skill.ability].shortFa})`)}
                  className="font-mono font-extrabold text-xs px-2 py-1 rounded-[8px] bg-[#171513] text-[#E0A030] border border-[#2F2A23] hover:border-[#E0A030] transition touch-target dice-ltr"
                >
                  {formatModifier(totalMod)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Skill Sheet */}
      <BottomSheet
        isOpen={showAddCustomSkill}
        onClose={() => setShowAddCustomSkill(false)}
        title="تعریف مهارت اختصاصی"
        subtitle="افزودن مهارت‌های ویژه مربوط به فرهنگ و تبار زروانیا"
      >
        <form onSubmit={handleAddCustomSkill} className="space-y-4">
          <div>
            <label className="text-xs text-[#A39A89] block mb-1">نام مهارت:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: شناخت تاروپودهای باستانی"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#A39A89] block mb-1">وابسته به کدام ویژگی بنیادین:</label>
            <select
              value={customSkillAbility}
              onChange={(e) => setCustomSkillAbility(e.target.value as AbilityName)}
              className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            >
              {abilityKeys.map(key => (
                <option key={key} value={key}>
                  {abilityLabels[key].fa} ({abilityLabels[key].en})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddCustomSkill(false)}
              className="py-2.5 px-4 rounded-[12px] text-xs text-[#A39A89] touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target"
            >
              افزودن مهارت
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
