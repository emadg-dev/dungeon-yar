import React, { useState } from 'react';
import { ShanshinEncounter } from '../../types';
import { Dices, Edit3, Check, Sparkles, AlertCircle } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface DmShanshinEncountersProps {
  encounters: ShanshinEncounter[];
  onUpdateEncounter: (enc: ShanshinEncounter) => Promise<void>;
  onRollEncounter: () => Promise<{ result: ShanshinEncounter; roll: number }>;
}

export const DmShanshinEncounters: React.FC<DmShanshinEncountersProps> = ({
  encounters,
  onUpdateEncounter,
  onRollEncounter,
}) => {
  const [activeRoll, setActiveRoll] = useState<{ result: ShanshinEncounter; roll: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<ShanshinEncounter | null>(null);

  const handleRoll = async () => {
    setRolling(true);
    try {
      const res = await onRollEncounter();
      setActiveRoll(res);
    } finally {
      setRolling(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEncounter) return;
    await onUpdateEncounter(editingEncounter);
    setEditingEncounter(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Roll Action */}
      <div className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-base font-black text-[#F2C265] flex items-center gap-2">
            <Dices className="w-5 h-5 text-[#F2C265]" />
            <span>برخوردهای تصادفی شهر شن‌شین (جدول d8)</span>
          </h2>
          <p className="text-xs text-[#A39A89] mt-1">
            یک کلیک برای پرتاب تاس d8 و احضار فوری برخوردهای محله‌های مختلف شن‌شین
          </p>
        </div>

        <button
          type="button"
          disabled={rolling}
          onClick={handleRoll}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#C97B4A] via-[#E0A030] to-[#C97B4A] hover:from-[#E0A030] hover:to-[#F2C265] active:scale-95 text-[#0E0D0C] font-black text-xs shadow-lg shadow-[#3A2415]/40 transition flex items-center justify-center gap-2 touch-target cursor-pointer"
        >
          <Dices className={`w-5 h-5 ${rolling ? 'animate-spin' : ''}`} />
          <span>پرتاب تاس d8 برخورد شانشین</span>
        </button>
      </div>

      {/* Active Rolled Encounter Card */}
      {activeRoll && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2A1A0D]/40 via-[#201D19] to-[#171513] border border-[#E0A030]/60 shadow-xl space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-black flex items-center justify-center text-sm font-mono">
                d8: {activeRoll.roll}
              </span>
              <h3 className="font-black text-sm text-[#F2C265]">{activeRoll.result.title}</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#E0A030]/20 text-[#F2C265] font-bold border border-[#E0A030]/30">
              برخورد جاری
            </span>
          </div>

          <p className="text-xs text-[#EDE6D8] leading-relaxed pt-1">
            {activeRoll.result.description}
          </p>

          {activeRoll.result.mechanicsNote && (
            <div className="p-2.5 rounded-xl bg-[#131110] border border-[#2F2A23] text-xs text-[#F2C265]/90 leading-relaxed">
              <strong>نکته مکانیکی:</strong> {activeRoll.result.mechanicsNote}
            </div>
          )}

          {activeRoll.result.dmAdvice && (
            <div className="text-[11px] text-[#A39A89] italic">
              راهنمای راوی: {activeRoll.result.dmAdvice}
            </div>
          )}
        </div>
      )}

      {/* Table of 8 encounters */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#A39A89]">فهرست کامل گزینه‌های جدول (قابل ویرایش توسط DM):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {encounters.map(enc => (
            <div
              key={enc.id}
              className="p-3.5 rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/30 transition space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#201D19] border border-[#3A342B] text-[#F2C265] font-mono font-bold flex items-center justify-center text-xs">
                    {enc.id}
                  </span>
                  <h4 className="font-bold text-xs text-[#EDE6D8]">{enc.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEncounter(enc)}
                  className="p-1.5 text-[#A39A89] hover:text-[#F2C265] transition rounded-lg hover:bg-[#2A2621]"
                  title="ویرایش برخورد"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-[#A39A89] leading-relaxed">
                {enc.description}
              </p>

              {enc.mechanicsNote && (
                <div className="text-[10px] text-[#F2C265]/80 bg-[#131110] p-1.5 rounded-lg border border-[#2F2A23]">
                  {enc.mechanicsNote}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Encounter BottomSheet */}
      {editingEncounter && (
        <BottomSheet
          isOpen={!!editingEncounter}
          onClose={() => setEditingEncounter(null)}
          title={`ویرایش برخورد شماره ${editingEncounter.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">عنوان برخورد:</label>
              <input
                type="text"
                required
                value={editingEncounter.title}
                onChange={(e) => setEditingEncounter({ ...editingEncounter, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-xs text-[#EDE6D8]"
              />
            </div>

            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">توضیحات و رخداد روایی:</label>
              <textarea
                rows={3}
                required
                value={editingEncounter.description}
                onChange={(e) => setEditingEncounter({ ...editingEncounter, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-xs text-[#EDE6D8]"
              />
            </div>

            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">نکته مکانیکی و DC تاس:</label>
              <input
                type="text"
                value={editingEncounter.mechanicsNote}
                onChange={(e) => setEditingEncounter({ ...editingEncounter, mechanicsNote: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-xs text-[#EDE6D8]"
              />
            </div>

            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">راهنمای راوی (DM Advice):</label>
              <input
                type="text"
                value={editingEncounter.dmAdvice}
                onChange={(e) => setEditingEncounter({ ...editingEncounter, dmAdvice: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#201D19] border border-[#3A342B] text-xs text-[#EDE6D8]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] transition cursor-pointer touch-target mt-3"
            >
              ذخیره تغییرات
            </button>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};
