import React, { useState } from 'react';
import { Character, NPC, Encounter, EncounterCombatant } from '../../types';
import { 
  Swords, Shield, Heart, Plus, Trash2, Play, 
  RotateCcw, Save, ArrowRight, ArrowLeft, Dices, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Chip } from '../common/Chip';

interface DmEncounterRunnerProps {
  characters: Character[];
  npcs: NPC[];
  savedEncounters: Encounter[];
  onSaveEncounter: (enc: Encounter) => void;
  onRollDice: (sides: number, count: number, modifier: number, label: string) => void;
}

export const DmEncounterRunner: React.FC<DmEncounterRunnerProps> = ({
  characters,
  npcs,
  savedEncounters,
  onSaveEncounter,
  onRollDice
}) => {
  const [mode, setMode] = useState<'prep' | 'run'>('prep');
  const [encounterName, setEncounterName] = useState('نبرد کاروانسرای ماه سرخ');
  const [round, setRound] = useState(1);
  const [activeTurn, setActiveTurn] = useState(0);
  const [combatants, setCombatants] = useState<EncounterCombatant[]>([]);
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [npcQuantity, setNpcQuantity] = useState(1);

  // Direct-damage keypad sheet state
  const [keypadTarget, setKeypadTarget] = useState<EncounterCombatant | null>(null);
  const [keypadAmount, setKeypadAmount] = useState('');

  // Add condition sheet state
  const [conditionTarget, setConditionTarget] = useState<EncounterCombatant | null>(null);

  const availableConditions = [
    { name: 'بیهوش (Unconscious)', rounds: 3 },
    { name: 'گیج (Stunned)', rounds: 1 },
    { name: 'ریشه‌پیچ (Restrained)', rounds: 2 },
    { name: 'زمین‌خورده (Prone)', rounds: 1 },
    { name: 'مسموم (Poisoned)', rounds: 3 },
    { name: 'مهارشده با فره (Stabilized)', rounds: 5 }
  ];

  const handleAddAllCharacters = () => {
    const partyCombatants: EncounterCombatant[] = characters.map(c => ({
      id: `comb-${c.id}-${Date.now()}`,
      name: c.name,
      initiative: 10 + Math.floor(Math.random() * 10),
      hpCurrent: c.hp.current,
      hpMax: c.hp.max,
      ac: `${c.ac}`,
      isNpc: false,
      characterId: c.id,
      conditions: [],
      notes: `${c.className}`
    }));
    setCombatants(prev => [...prev, ...partyCombatants]);
  };

  const handleAddNpc = () => {
    if (!selectedNpcId) return;
    const template = npcs.find(n => n.id === selectedNpcId);
    if (!template) return;

    const newEntries: EncounterCombatant[] = [];
    for (let i = 1; i <= npcQuantity; i++) {
      const displayName = npcQuantity > 1 ? `${template.name} #${i}` : template.name;
      newEntries.push({
        id: `comb-npc-${Date.now()}-${i}`,
        name: displayName,
        initiative: 10 + Math.floor(Math.random() * 10),
        hpCurrent: template.hp.max,
        hpMax: template.hp.max,
        ac: template.ac,
        isNpc: true,
        npcId: template.id,
        conditions: [],
        notes: template.tacticsTips || ''
      });
    }
    setCombatants(prev => [...prev, ...newEntries]);
  };

  const sortByInitiative = () => {
    setCombatants(prev => [...prev].sort((a, b) => b.initiative - a.initiative));
    setActiveTurn(0);
  };

  const nextTurn = () => {
    if (combatants.length === 0) return;
    if (activeTurn >= combatants.length - 1) {
      setActiveTurn(0);
      setRound(r => r + 1);
    } else {
      setActiveTurn(prev => prev + 1);
    }
  };

  const prevTurn = () => {
    if (combatants.length === 0) return;
    if (activeTurn <= 0) {
      if (round > 1) {
        setRound(r => r - 1);
        setActiveTurn(combatants.length - 1);
      }
    } else {
      setActiveTurn(prev => prev - 1);
    }
  };

  const applyKeypadDamage = (isHealing = false) => {
    if (!keypadTarget) return;
    const amt = parseInt(keypadAmount) || 0;
    const delta = isHealing ? amt : -amt;

    setCombatants(prev => prev.map(c => {
      if (c.id === keypadTarget.id) {
        const next = Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta));
        return { ...c, hpCurrent: next };
      }
      return c;
    }));

    setKeypadTarget(null);
    setKeypadAmount('');
  };

  const addCondition = (conditionName: string) => {
    if (!conditionTarget) return;
    setCombatants(prev => prev.map(c => {
      if (c.id === conditionTarget.id) {
        return {
          ...c,
          conditions: [...(c.conditions || []), conditionName]
        };
      }
      return c;
    }));
    setConditionTarget(null);
  };

  const removeCondition = (combatantId: string, condIdx: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === combatantId) {
        return {
          ...c,
          conditions: c.conditions?.filter((_, i) => i !== condIdx)
        };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Mode Switcher: Prep vs Run */}
      <div className="surface-card rounded-[14px] p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setMode('prep')}
            className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
              mode === 'prep'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>آماده‌سازی (Prep)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sortByInitiative();
              setMode('run');
            }}
            className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
              mode === 'run'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>اجرای مبارزه (Run)</span>
          </button>
        </div>
      </div>

      {/* PREP MODE */}
      {mode === 'prep' && (
        <div className="space-y-4">
          {/* Quick Party Add & Monster Selector */}
          <div className="surface-card rounded-[14px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2F2A23] pb-2">
              <h3 className="text-xs font-bold text-[#EDE6D8]">افزودن مبارزان به صحنه نبرد</h3>
              <button
                type="button"
                onClick={handleAddAllCharacters}
                className="px-3 py-1.5 rounded-[10px] bg-[#6F9E78]/15 hover:bg-[#6F9E78]/25 text-[#6F9E78] border border-[#6F9E78]/30 text-xs font-bold transition touch-target"
              >
                + ورود تمام یاران
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-[#A39A89] block mb-1">انتخاب هیولا / NPC:</label>
                <select
                  value={selectedNpcId}
                  onChange={(e) => setSelectedNpcId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                >
                  <option value="">-- انتخاب هیولا --</option>
                  {npcs.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} (CR {n.cr || '1'} • {n.region || 'ورنا'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#A39A89] block mb-1">تعداد:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={npcQuantity}
                    onChange={(e) => setNpcQuantity(parseInt(e.target.value) || 1)}
                    className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] text-center font-mono focus:border-[#E0A030] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNpc}
                    disabled={!selectedNpcId}
                    className="py-2.5 px-4 rounded-[12px] btn-primary-amber font-bold text-xs shrink-0 disabled:opacity-40 touch-target"
                  >
                    افزودن
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Combatants in Prep */}
          <div className="surface-card rounded-[14px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2F2A23] pb-2">
              <h3 className="text-xs font-bold text-[#EDE6D8]">لیست نوبت‌ها ({combatants.length})</h3>
              <button
                type="button"
                onClick={sortByInitiative}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#201D19] text-[#E0A030] border border-[#2F2A23] text-xs font-bold touch-target"
              >
                مرتب‌سازی بر اساس ابتکار
              </button>
            </div>

            {combatants.length === 0 ? (
              <p className="text-xs text-[#A39A89] text-center py-6">
                هنوز مبارزی به صحنه اضافه نشده است.
              </p>
            ) : (
              <div className="space-y-2">
                {combatants.map((c, idx) => (
                  <div
                    key={c.id}
                    className="surface-2-card rounded-[10px] p-2.5 border border-[#2F2A23] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#E0A030] w-6 text-center dice-ltr">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-xs text-[#EDE6D8] truncate">{c.name}</span>
                      <span className="text-[10px] text-[#A39A89]">
                        (AC {c.ac} • HP {c.hpCurrent}/{c.hpMax})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        value={c.initiative}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCombatants(prev => prev.map((item, i) => i === idx ? { ...item, initiative: val } : item));
                        }}
                        className="w-12 py-1 px-1 rounded-[6px] bg-[#0E0D0C] border border-[#2F2A23] text-center text-xs font-mono font-bold text-[#EDE6D8]"
                        title="ابتکار عمل"
                      />
                      <button
                        type="button"
                        onClick={() => setCombatants(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-[#A39A89] hover:text-[#C2512B] touch-target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RUN MODE */}
      {mode === 'run' && (
        <div className="space-y-4">
          {/* Round Header & Next Turn Big Button */}
          <div className="surface-card rounded-[14px] p-4 flex items-center justify-between gap-3 card-gold-top">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex flex-col items-center justify-center font-mono">
                <span className="text-[10px] font-bold">دور</span>
                <span className="text-xl font-extrabold leading-none">{round}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A39A89] block">نوبت کنونی</span>
                <span className="font-extrabold text-sm text-[#EDE6D8]">
                  {combatants[activeTurn]?.name || 'پایان دور'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevTurn}
                className="p-2.5 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
                title="نوبت قبل"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextTurn}
                className="py-2.5 px-4 rounded-[12px] btn-primary-amber font-extrabold text-xs flex items-center gap-1.5 shadow-md touch-target"
              >
                <span>نوبت بعد</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vertical Initiative List (Active turn marked by a pulsing amber line) */}
          <div className="space-y-2">
            {combatants.map((c, idx) => {
              const isActive = idx === activeTurn;
              return (
                <div
                  key={c.id}
                  className={`surface-card rounded-[14px] p-3 border transition ${
                    isActive
                      ? 'border-r-4 border-r-[#E0A030] border-[#E0A030]/60 bg-[#E0A030]/10 shadow-md'
                      : 'border-[#2F2A23]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-7 h-7 rounded-[8px] flex items-center justify-center font-mono font-extrabold text-xs dice-ltr ${
                        isActive ? 'bg-[#E0A030] text-[#0E0D0C]' : 'bg-[#201D19] text-[#A39A89]'
                      }`}>
                        {c.initiative}
                      </span>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-[#EDE6D8] truncate block">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-[#A39A89]">
                          AC: <strong className="text-[#EDE6D8]">{c.ac}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Direct-Damage Keypad Trigger: Tap HP to open Keypad */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setKeypadTarget(c);
                          setKeypadAmount('');
                        }}
                        className="py-1 px-2.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-center touch-target"
                        title="لمس برای ثبت آسیب یا شفا"
                      >
                        <span className="font-mono font-extrabold text-sm text-[#EDE6D8] dice-ltr block">
                          {c.hpCurrent}/{c.hpMax}
                        </span>
                        <span className="text-[9px] text-[#E0A030] block">تنظیم جان</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConditionTarget(c)}
                        className="p-2 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
                        title="افزودن وضعیت (Condition)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Condition Badges */}
                  {c.conditions && c.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[#2F2A23]">
                      {c.conditions.map((cond, cIdx) => (
                        <span
                          key={cIdx}
                          onClick={() => removeCondition(c.id, cIdx)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C2512B]/20 text-[#C2512B] border border-[#C2512B]/40 cursor-pointer flex items-center gap-1"
                          title="کلیک برای پاک کردن وضعیت"
                        >
                          <span>{cond}</span>
                          <span className="text-[9px]">×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct-Damage Keypad Sheet (Tap HP to open) */}
      {keypadTarget && (
        <BottomSheet
          isOpen={!!keypadTarget}
          onClose={() => setKeypadTarget(null)}
          title={`تنظیم جان: ${keypadTarget.name}`}
          subtitle={`جان فعلی: ${keypadTarget.hpCurrent} از ${keypadTarget.hpMax}`}
        >
          <div className="space-y-3" dir="rtl">
            <div className="p-3 rounded-[12px] bg-[#0E0D0C] border border-[#2F2A23] text-center font-mono text-2xl font-black text-[#EDE6D8] dice-ltr">
              {keypadAmount || '۰'}
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setKeypadAmount(prev => prev + num)}
                  className="min-h-[48px] rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-lg font-bold font-mono text-[#EDE6D8] hover:border-[#E0A030] touch-target-lg"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setKeypadAmount('')}
                className="min-h-[48px] rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] touch-target-lg"
              >
                پاک کردن
              </button>
              <button
                type="button"
                onClick={() => setKeypadAmount(prev => prev + '0')}
                className="min-h-[48px] rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-lg font-bold font-mono text-[#EDE6D8] touch-target-lg"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setKeypadAmount(prev => prev.slice(0, -1))}
                className="min-h-[48px] rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] touch-target-lg"
              >
                ←
              </button>
            </div>

            {/* Action Buttons: Apply Damage or Healing */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => applyKeypadDamage(false)}
                className="py-3 rounded-[12px] btn-destructive-ember font-extrabold text-xs shadow-md touch-target"
              >
                اعمال آسیب (−)
              </button>
              <button
                type="button"
                onClick={() => applyKeypadDamage(true)}
                className="py-3 rounded-[12px] bg-[#6F9E78] text-[#0E0D0C] font-extrabold text-xs shadow-md hover:bg-[#6F9E78]/90 touch-target"
              >
                اعمال شفا (+)
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Condition Selector Sheet */}
      {conditionTarget && (
        <BottomSheet
          isOpen={!!conditionTarget}
          onClose={() => setConditionTarget(null)}
          title={`افزودن وضعیت به ${conditionTarget.name}`}
          subtitle="شرایط و حالات ناتوان‌کننده یا محافظتی"
        >
          <div className="space-y-2" dir="rtl">
            {availableConditions.map((cond, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addCondition(cond.name)}
                className="w-full p-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-right flex items-center justify-between text-xs font-bold text-[#EDE6D8] touch-target"
              >
                <span>{cond.name}</span>
                <span className="text-[10px] text-[#A39A89]">{cond.rounds} دور</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
