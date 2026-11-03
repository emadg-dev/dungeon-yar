import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import React, { useState } from 'react';
import { Character, Companion } from '../../types';
import { deriveSheet, computeCompanion } from '../../../shared/rules/engine';
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
  const [newCompAtk, setNewCompAtk] = useState('ضربه تماسی (+4، 1d6+2)');

  // Default companions based on character class & level derived from rules engine
  const derived = deriveSheet({ character });
  const conMod = derived.abilityModifiers.con;
  const isSaman = character.className.includes('دیوانزاد') || character.name.includes('سامان');
  const isMana = character.className.includes('پیمان') || character.name.includes('مانا');

  const companionDerived = derived.companion;
  const constructMaxHp = companionDerived && isSaman ? companionDerived.maxHp : (2 * character.level + 2 * conMod);
  const constructAc = companionDerived && isSaman ? companionDerived.ac : 15;

  const manaCompDerived = computeCompanion('پیمانبان', character.level, { conMod });
  const manaMaxHp = manaCompDerived ? manaCompDerived.maxHp : (3 * character.level + conMod);
  const manaAc = manaCompDerived ? manaCompDerived.ac : 13;

  // Initialize companions if not present and eligible
  const companions: Companion[] = character.companions && character.companions.length > 0
    ? character.companions
    : (isSaman && character.level >= 3)
    ? [
        {
          id: 'comp-saman-construct',
          name: companionDerived?.name || 'سازه همراه دیوانزاد',
          type: 'construct',
          ac: constructAc,
          hp: { max: constructMaxHp, current: constructMaxHp },
          attack: {
            name: 'کوبش بازوی برنزی',
            toHit: '+5',
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
          name: manaCompDerived?.name || 'همراه جنگل ورنا',
          type: 'forest',
          ac: manaAc,
          hp: { max: manaMaxHp, current: manaMaxHp },
          attack: {
            name: 'نیش خاردار / چنگال ریشه',
            toHit: '+4',
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
        toHit: '+3',
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-accent-hover">یاران و سازه‌های همراه</h3>
          <p className="text-xs text-text-muted">همراهان مکانیکی دیوانزاد و پیوندهای جنگلی پیمان‌بان</p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent-hover text-xs font-bold transition touch-target min-w-[44px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن همراه</span>
        </Button>
      </div>

      {companions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-surface border border-border space-y-2">
          <Bot className="w-8 h-8 text-text-muted mx-auto" />
          <h4 className="text-xs font-bold text-text-primary">هنوز همراهی برای این شخصیت فعال نشده است</h4>
          <p className="text-xs text-text-muted max-w-xs mx-auto">
            دیوانزاد در سطح 3 به «سازه همراه» (AC 15) و پیمان‌بان در سطح 4 به «همراه جنگل» دسترسی پیدا می‌کنند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {companions.map(comp => {
            const hpPercent = Math.min(100, Math.round((comp.hp.current / Math.max(1, comp.hp.max)) * 100));
            return (
              <div
                key={comp.id}
                className="p-4 rounded-2xl bg-surface border border-accent/30 space-y-3 shadow-lg relative"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-hover">
                      {comp.type === 'construct' ? <Bot className="w-5 h-5" /> : <Trees className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-accent-hover">{comp.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5 text-accent-hover" /> AC {comp.ac}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleDeleteCompanion(comp.id)}
                    className="p-1 text-text-muted hover:text-danger transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* HP Tracker with +/- */}
                <div className="p-2.5 rounded-xl bg-bg border border-border space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                      <Heart className="w-3 h-3 text-danger" /> جان (HP)
                    </span>
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {comp.hp.current} / {comp.hp.max}
                    </span>
                  </div>

                  {/* HP Bar */}
                  <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        hpPercent > 50 ? 'bg-success' : hpPercent > 20 ? 'bg-accent' : 'bg-danger'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Quick Buttons */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, -5)}
                      className="w-8 h-8 rounded-lg bg-danger/15 active:bg-danger/15 border border-danger/30 text-danger text-xs font-bold touch-target min-w-[44px] select-none"
                    >
                      -5
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, -1)}
                      className="w-8 h-8 rounded-lg bg-danger/15 active:bg-danger/15 border border-danger/30 text-danger text-xs font-bold touch-target min-w-[44px] select-none"
                    >
                      -1
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, +1)}
                      className="w-8 h-8 rounded-lg bg-success/15 active:bg-success/15 border border-success/30 text-success text-xs font-bold touch-target min-w-[44px] select-none"
                    >
                      +1
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAdjustHp(comp.id, +5)}
                      className="w-8 h-8 rounded-lg bg-success/15 active:bg-success/15 border border-success/30 text-success text-xs font-bold touch-target min-w-[44px] select-none"
                    >
                      +5
                    </Button>
                  </div>
                </div>

                {/* Attack Card */}
                {comp.attack && (
                  <div className="p-2.5 rounded-xl bg-info border border-border-strong/60 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-accent-hover">{comp.attack.name}</div>
                      <div className="text-xs text-text-muted">
                        {comp.attack.toHit} برای اصابت • {comp.attack.damage}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => onRollCheck(20, 1, 5, `حمله ${comp.name}`)}
                      className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent-hover text-xs font-bold flex items-center gap-1 touch-target min-w-[44px]"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>تاس حمله</span>
                    </Button>
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
            <label className="text-xs text-text-primary block mb-1">نام همراه / سازه:</label>
            <Input noWrapper
              type="text"
              required
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              placeholder="مثلاً: بوف سنگی شن‌شین"
              className="w-full p-2.5 rounded-xl bg-surface-2 border border-border-strong text-sm text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-primary block mb-1">درجه زرهی (AC):</label>
              <Input noWrapper
                type="number"
                inputMode="numeric"
                value={newCompAc}
                onChange={(e) => setNewCompAc(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-border-strong text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">حداکثر جان (HP):</label>
              <Input noWrapper
                type="number"
                inputMode="numeric"
                value={newCompHp}
                onChange={(e) => setNewCompHp(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-surface-2 border border-border-strong text-sm text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-primary block mb-1">مشخصات حمله:</label>
            <Input noWrapper
              type="text"
              value={newCompAtk}
              onChange={(e) => setNewCompAtk(e.target.value)}
              placeholder="+4 برای اصابت، 1d6+2 کوبشی"
              className="w-full p-2.5 rounded-xl bg-surface-2 border border-border-strong text-sm text-text-primary"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold bg-accent hover:bg-accent-hover text-on-accent transition cursor-pointer touch-target min-w-[44px] mt-3"
          >
            ذخیره و ایجاد همراه
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
};
