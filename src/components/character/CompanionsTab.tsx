import React, { useState } from 'react';
import { Character, Companion } from '../../types';
import { Bot, Trees, Heart, Shield, Swords, Plus, Trash2, Sparkles } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface CompanionsTabProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  onRollCheck: (sides: number, count: number, modifier: number, label: string) => void;
}

export const CompanionsTab: React.FC<CompanionsTabProps> = ({
  character,
  onUpdate,
  onRollCheck,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompAc, setNewCompAc] = useState(13);
  const [newCompHp, setNewCompHp] = useState(15);
  const [newCompAtk, setNewCompAtk] = useState('ضربه تماسی (+۴، 1d6+2)');

  // Default companions based on character class & level
  const conMod = Math.floor(((character.abilities.con || 10) - 10) / 2);
  const isSaman = character.className.includes('دیوانزاد') || character.name.includes('سامان');
  const isMana = character.className.includes('پیمان') || character.name.includes('مانا');

  const constructMaxHp = Math.max(10, 2 * character.level + 2 * conMod);

  // Initialize companions if not present and eligible
  const companions: Companion[] = character.companions && character.companions.length > 0
    ? character.companions
    : (isSaman && character.level >= 3)
    ? [
        {
          id: 'comp-saman-construct',
          name: 'سازه همراه دیوانزاد',
          type: 'construct',
          ac: 15,
          hp: { max: constructMaxHp, current: constructMaxHp },
          attack: {
            name: 'کوبش بازوی برنزی',
            toHit: '+۵',
            damage: '1d8 + 3 کوبشی',
            description: 'ضربه سنگین هیدرولیکی سازه باستانی'
          },
          description: 'سازه سنگی و برنزی که با خون و ارتعاش دیوانزاد هدایت می‌شود.'
        }
      ]
    : (isMana && character.level >= 4)
    ? [
        {
          id: 'comp-mana-forest',
          name: 'همراه جنگل ورنا',
          type: 'forest',
          ac: 13,
          hp: { max: 18, current: 18 },
          attack: {
            name: 'نیش خاردار / چنگال ریشه',
            toHit: '+۴',
            damage: '1d6 + 2 نافذ',
            description: 'حمله ناگهانی از دل بیشه باستانی'
          },
          description: 'موجودی وفادار از شاخه‌ها و ریشه‌های حیات‌بخش ورنا.'
        }
      ]
    : [];

  const handleAdjustHp = (compId: string, delta: number) => {
    const updatedComps = companions.map(c => {
      if (c.id === compId) {
        const nextCur = Math.max(0, Math.min(c.hp.max, c.hp.current + delta));
        return { ...c, hp: { ...c.hp, current: nextCur } };
      }
      return c;
    });
    onUpdate({ ...character, companions: updatedComps });
  };

  const handleAddCustomCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const newCompanion: Companion = {
      id: `comp-${Date.now()}`,
      name: newCompName.trim(),
      type: 'custom',
      ac: Number(newCompAc) || 12,
      hp: { max: Number(newCompHp) || 15, current: Number(newCompHp) || 15 },
      attack: {
        name: 'حمله همراه',
        toHit: '+۳',
        damage: newCompAtk || '1d6+2',
      },
      description: 'همراه ماجراجو'
    };

    const nextList = [...companions, newCompanion];
    onUpdate({ ...character, companions: nextList });
    setShowAddModal(false);
    setNewCompName('');
  };

  const handleDeleteCompanion = (compId: string) => {
    const filtered = companions.filter(c => c.id !== compId);
    onUpdate({ ...character, companions: filtered });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#F2C265]">یاران و سازه‌های همراه</h3>
          <p className="text-[11px] text-[#A39A89]">همراهان مکانیکی دیوانزاد و پیوندهای جنگلی پیمان‌بان</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0A030]/20 hover:bg-[#E0A030]/30 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold transition touch-target"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن همراه</span>
        </button>
      </div>

      {companions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#171513] border border-[#2F2A23] space-y-2">
          <Bot className="w-8 h-8 text-[#8A8374] mx-auto" />
          <h4 className="text-xs font-bold text-[#C9C0AE]">هنوز همراهی برای این شخصیت فعال نشده است</h4>
          <p className="text-[11px] text-[#8A8374] max-w-xs mx-auto">
            دیوانزاد در سطح ۳ به «سازه همراه» (AC 15) و پیمان‌بان در سطح ۴ به «همراه جنگل» دسترسی پیدا می‌کنند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {companions.map(comp => {
            const hpPercent = Math.min(100, Math.round((comp.hp.current / Math.max(1, comp.hp.max)) * 100));
            return (
              <div
                key={comp.id}
                className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/30 space-y-3 shadow-lg relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#E0A030]/20 border border-[#E0A030]/40 flex items-center justify-center text-[#F2C265]">
                      {comp.type === 'construct' ? <Bot className="w-5 h-5" /> : <Trees className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-[#F2C265]">{comp.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#A39A89]">
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5 text-[#F2C265]" /> AC {comp.ac}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCompanion(comp.id)}
                    className="p-1 text-[#8A8374] hover:text-[#E8836B] transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* HP Tracker with +/- */}
                <div className="p-2.5 rounded-xl bg-[#131110] border border-[#2F2A23] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#C9C0AE] flex items-center gap-1">
                      <Heart className="w-3 h-3 text-[#E8836B]" /> جان (HP)
                    </span>
                    <span className="font-mono text-xs font-bold text-[#EDE6D8]">
                      {comp.hp.current} / {comp.hp.max}
                    </span>
                  </div>

                  {/* HP Bar */}
                  <div className="w-full h-1.5 bg-[#201D19] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        hpPercent > 50 ? 'bg-[#6F9E78]' : hpPercent > 20 ? 'bg-[#E0A030]' : 'bg-[#C2512B]'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Quick Buttons */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, -5)}
                      className="w-8 h-8 rounded-lg bg-[#C2512B]/15 active:bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] text-xs font-bold touch-target select-none"
                    >
                      -۵
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, -1)}
                      className="w-8 h-8 rounded-lg bg-[#C2512B]/15 active:bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] text-xs font-bold touch-target select-none"
                    >
                      -۱
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, +1)}
                      className="w-8 h-8 rounded-lg bg-[#6F9E78]/15 active:bg-[#6F9E78]/15 border border-[#6F9E78]/30 text-[#6F9E78] text-xs font-bold touch-target select-none"
                    >
                      +۱
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, +5)}
                      className="w-8 h-8 rounded-lg bg-[#6F9E78]/15 active:bg-[#6F9E78]/15 border border-[#6F9E78]/30 text-[#6F9E78] text-xs font-bold touch-target select-none"
                    >
                      +۵
                    </button>
                  </div>
                </div>

                {/* Attack Card */}
                {comp.attack && (
                  <div className="p-2.5 rounded-xl bg-[#181c28] border border-[#3A342B]/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F2C265]">{comp.attack.name}</div>
                      <div className="text-[10px] text-[#A39A89]">
                        {comp.attack.toHit} برای اصابت • {comp.attack.damage}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRollCheck(20, 1, 5, `حمله ${comp.name}`)}
                      className="p-2 rounded-lg bg-[#E0A030]/20 hover:bg-[#E0A030]/30 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold flex items-center gap-1 touch-target"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>تاس حمله</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Companion BottomSheet */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="افزودن همراه جدید"
      >
        <form onSubmit={handleAddCustomCompanion} className="space-y-3.5">
          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">نام همراه / سازه:</label>
            <input
              type="text"
              required
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              placeholder="مثلاً: بوف سنگی شن‌شین"
              className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">درجه زرهی (AC):</label>
              <input
                type="number"
                inputMode="numeric"
                value={newCompAc}
                onChange={(e) => setNewCompAc(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">حداکثر جان (HP):</label>
              <input
                type="number"
                inputMode="numeric"
                value={newCompHp}
                onChange={(e) => setNewCompHp(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">مشخصات حمله:</label>
            <input
              type="text"
              value={newCompAtk}
              onChange={(e) => setNewCompAtk(e.target.value)}
              placeholder="+۴ برای اصابت، 1d6+2 کوبشی"
              className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] transition cursor-pointer touch-target mt-3"
          >
            ذخیره و ایجاد همراه
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
