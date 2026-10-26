import React, { useState } from 'react';
import { NPC, NpcType } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { 
  Users, Plus, Search, Edit3, Trash2, Copy, 
  Eye, EyeOff, Shield, Heart, Zap, Sparkles 
} from 'lucide-react';

interface DmNpcManagerProps {
  npcs: NPC[];
  onCreateNpc: (npc: Omit<NPC, 'id' | 'updatedAt'>) => void;
  onUpdateNpc: (npc: NPC) => void;
  onDeleteNpc: (id: string) => void;
  onRollDice?: (sides: number, count: number, modifier: number, label: string) => void;
}

export const DmNpcManager: React.FC<DmNpcManagerProps> = ({
  npcs,
  onCreateNpc,
  onUpdateNpc,
  onDeleteNpc
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<NPC>>({
    name: '',
    type: 'minion',
    portraitUrl: '',
    description: '',
    locationTag: '',
    sessionTag: 'جلسه ۲',
    ac: '۱۴',
    hp: { current: 30, max: 30 },
    speed: '۹ متر',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: '',
    resistances: '',
    vulnerabilities: '',
    immunities: '',
    attacks: [],
    specialAbilities: [],
    tacticsTips: '',
    lootDrops: '',
    dialogueLines: [],
    isRevealed: false
  });

  const typeLabels: Record<NpcType, string> = {
    boss: 'باس اصلی (Boss)',
    guardian: 'نگهبان معبد (Guardian)',
    elite: 'دشمن نخبه (Elite)',
    minion: 'موجود ضعیف (Minion)',
    hazard: 'خطر محیطی (Hazard)',
    neutral: 'شخصیت بی‌طرف (Neutral)',
    ally: 'متحد و همراه (Ally)',
    merchant: 'بازرگان و سوداگر (Merchant)',
    'quest-giver': 'مأموریت‌دهنده (Quest Giver)',
    'guardian-construct': 'سازه نگهبان (Construct)',
    other: 'سایر'
  };

  const handleStartCreate = () => {
    setFormData({
      name: '',
      type: 'minion',
      portraitUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      description: '',
      locationTag: 'معبد زروانیا',
      sessionTag: 'جلسه ۲',
      ac: '۱۴',
      hp: { current: 35, max: 35 },
      speed: '۹ متر',
      abilities: { str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
      savingThrows: '',
      resistances: '',
      vulnerabilities: '',
      immunities: '',
      attacks: [{ id: 'atk-1', name: 'ضربه فیزیکی', toHit: '+۴', damage: '1d8 + 2' }],
      specialAbilities: [],
      tacticsTips: '',
      lootDrops: '',
      dialogueLines: [],
      isRevealed: false
    });
    setEditingNpc(null);
    setIsCreating(true);
  };

  const handleStartEdit = (npc: NPC) => {
    setFormData(npc);
    setEditingNpc(npc);
    setIsCreating(true);
  };

  const handleDuplicate = (npc: NPC) => {
    const copy: Omit<NPC, 'id' | 'updatedAt'> = {
      ...npc,
      name: `${npc.name} (کپی)`,
      isRevealed: false
    };
    onCreateNpc(copy);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingNpc) {
      onUpdateNpc({
        ...editingNpc,
        ...(formData as NPC),
        updatedAt: new Date().toISOString()
      });
    } else {
      onCreateNpc(formData as Omit<NPC, 'id' | 'updatedAt'>);
    }

    setIsCreating(false);
    setEditingNpc(null);
  };

  const toggleRevealed = (npc: NPC) => {
    onUpdateNpc({ ...npc, isRevealed: !npc.isRevealed });
  };

  const filteredNpcs = npcs.filter(npc => {
    const matchesType = selectedType === 'all' || npc.type === selectedType;
    const matchesSearch = !searchQuery || npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.locationTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header, Search & Add */}
      <div className="bg-[#171513] border border-[#2F2A23] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2F2A23]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-[#8A8374]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، مکان یا خصوصیات NPCها..."
              className="w-full py-2 pr-9 pl-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          <button
            onClick={handleStartCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            ساخت NPC / هیولای تازه
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedType === 'all'
                ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
            }`}
          >
            همه ({npcs.length})
          </button>
          {(Object.keys(typeLabels) as NpcType[]).map(typeKey => {
            const count = npcs.filter(n => n.type === typeKey).length;
            if (count === 0) return null;
            return (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedType === typeKey
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                }`}
              >
                {typeLabels[typeKey]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Create / Edit BottomSheet Modal */}
      <BottomSheet
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          setEditingNpc(null);
        }}
        title={editingNpc ? `ویرایش ${editingNpc.name}` : 'تعریف شخصیت غیربازیکن (NPC) یا هیولای تازه'}
        subtitle="تنظیم مشخصات، جان، زره، رفتار مبارزاتی و غنایم"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">نام موجود / شخص:</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">نوع:</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NpcType })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              >
                {(Object.keys(typeLabels) as NpcType[]).map(t => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">مکان و محیط:</label>
              <input
                type="text"
                value={formData.locationTag}
                onChange={(e) => setFormData({ ...formData, locationTag: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">درجه زرهی (AC):</label>
              <input
                type="text"
                value={formData.ac}
                placeholder="آشوبناک ۱۶ / مهارشده ۱۰"
                onChange={(e) => setFormData({ ...formData, ac: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8] font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">حداکثر جان (HP):</label>
              <input
                type="number"
                value={formData.hp?.max}
                onChange={(e) => setFormData({
                  ...formData,
                  hp: { current: parseInt(e.target.value) || 1, max: parseInt(e.target.value) || 1 }
                })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">سرعت حرکت:</label>
              <input
                type="text"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">جلسه کمپین:</label>
              <input
                type="text"
                value={formData.sessionTag}
                onChange={(e) => setFormData({ ...formData, sessionTag: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">شرح و پیش‌زمینه روایی:</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">نکات تاکتیکی و هوش مبارزاتی برای DM:</label>
            <textarea
              rows={2}
              value={formData.tacticsTips}
              onChange={(e) => setFormData({ ...formData, tacticsTips: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">غنیمت و پاداش (Loot Drops):</label>
            <input
              type="text"
              value={formData.lootDrops}
              onChange={(e) => setFormData({ ...formData, lootDrops: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#171513] border border-[#2F2A23]">
            <input
              type="checkbox"
              id="revealedCheck"
              checked={formData.isRevealed}
              onChange={(e) => setFormData({ ...formData, isRevealed: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 accent-amber-500"
            />
            <label htmlFor="revealedCheck" className="text-xs text-[#C9C0AE] font-bold cursor-pointer">
              آشکار برای بازیکنان (در دانشنامه کلاینت بازیکن نمایش داده شود)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingNpc(null);
              }}
              className="py-2.5 px-4 rounded-xl text-xs text-[#A39A89] touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs touch-target"
            >
              ذخیره NPC
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* NPCs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNpcs.map(npc => (
          <div
            key={npc.id}
            className="bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={npc.portraitUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'}
                    alt={npc.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E0A030]/30 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#EDE6D8]">{npc.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE]">
                      {typeLabels[npc.type]}
                    </span>
                    <span className="text-[10px] text-[#8A8374] block mt-0.5">
                      {npc.locationTag} • {npc.sessionTag}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRevealed(npc)}
                    title={npc.isRevealed ? 'آشکار برای بازیکنان (کلیک برای پنهان کردن)' : 'پنهان از بازیکنان (کلیک برای آشکارسازی)'}
                    className={`p-1.5 rounded-lg text-xs transition border ${
                      npc.isRevealed
                        ? 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]/30'
                        : 'bg-[#201D19] text-[#8A8374] border-[#3A342B]'
                    }`}
                  >
                    {npc.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(npc)}
                    title="تکثیر NPC"
                    className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(npc)}
                    title="ویرایش"
                    className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteNpc(npc.id)}
                    title="حذف"
                    className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Combat Stats Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#131110] p-2.5 rounded-xl border border-[#2F2A23] mb-3">
                <div>
                  <span className="text-[10px] text-[#8A8374] block">درجه زرهی (AC):</span>
                  <span className="font-bold text-[#F2C265]">{npc.ac}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8A8374] block">جان (HP):</span>
                  <span className="font-bold text-[#E8836B] font-mono">{npc.hp.max}</span>
                </div>
              </div>

              <p className="text-xs text-[#C9C0AE] leading-relaxed mb-3">
                {npc.description}
              </p>

              {/* Special Abilities / Phases */}
              {npc.specialAbilities?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {npc.specialAbilities.map((sa, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#181c28] border border-[#2F2A23] text-xs">
                      <span className="font-bold text-[#F2C265] block">{sa.name}</span>
                      <p className="text-[11px] text-[#C9C0AE] mt-0.5">{sa.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tactics Tips for DM */}
            {npc.tacticsTips && (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-[#E0A030]/25 text-[11px] text-[#F2C265]">
                <strong>نکته دانجن مستر:</strong> {npc.tacticsTips}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
