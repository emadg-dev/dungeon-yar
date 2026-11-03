import React, { useState, useDeferredValue, startTransition, memo } from 'react';
import { NPC, NpcType } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { VirtualList } from '../common/VirtualList';
import { SafeImage } from '../common/SafeImage';
import { 
  Users, Plus, Search, Edit3, Trash2, Copy, 
  Eye, EyeOff, Shield, Heart, Zap, Sparkles 
} from 'lucide-react';

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

interface NpcCardRowProps {
  npc: NPC;
  onToggleRevealed: (npc: NPC) => void;
  onDuplicate: (npc: NPC) => void;
  onStartEdit: (npc: NPC) => void;
  onDeleteNpc: (id: string) => void;
}

const NpcCardRow = memo<NpcCardRowProps>(({
  npc,
  onToggleRevealed,
  onDuplicate,
  onStartEdit,
  onDeleteNpc,
}) => (
  <div
    className="bg-surface border border-border hover:border-accent/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between content-visibility-card"
  >
    <div>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <SafeImage
            src={npc.portraitUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'}
            alt={npc.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-xl object-cover border border-accent/30 shrink-0"
          />
          <div>
            <h4 className="font-bold text-sm text-text-primary">{npc.name}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-primary">
              {typeLabels[npc.type]}
            </span>
            <span className="text-xs text-text-muted block mt-0.5">
              {npc.locationTag} • {npc.sessionTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleRevealed(npc)}
            title={npc.isRevealed ? 'آشکار برای بازیکنان (کلیک برای پنهان کردن)' : 'پنهان از بازیکنان (کلیک برای آشکارسازی)'}
            className={`p-1.5 rounded-lg text-xs transition border ${
              npc.isRevealed
                ? 'bg-accent/20 text-accent-hover border-accent/30'
                : 'bg-surface-2 text-text-muted border-border-strong'
            }`}
          >
            {npc.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDuplicate(npc)}
            title="تکثیر NPC"
            className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartEdit(npc)}
            title="ویرایش"
            className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-text-primary"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteNpc(npc.id)}
            title="حذف"
            className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Combat Stats Bar */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-bg p-2.5 rounded-xl border border-border mb-3">
        <div>
          <span className="text-xs text-text-muted block">درجه زرهی (AC):</span>
          <span className="font-bold text-accent-hover">{npc.ac}</span>
        </div>
        <div>
          <span className="text-xs text-text-muted block">جان (HP):</span>
          <span className="font-bold text-danger font-mono">{npc.hp.max}</span>
        </div>
      </div>

      <p className="text-xs text-text-primary leading-relaxed mb-3">
        {npc.description}
      </p>

      {/* Special Abilities / Phases */}
      {npc.specialAbilities?.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {npc.specialAbilities.map((sa, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-info border border-border text-xs">
              <span className="font-bold text-accent-hover block">{sa.name}</span>
              <p className="text-xs text-text-primary mt-0.5">{sa.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* DM Secret Notes */}
    {(npc.notes || (npc as any).dmNotes) && (
      <div className="p-2.5 rounded-xl bg-danger border border-danger/40 text-xs text-danger">
        <span className="font-bold block mb-0.5">یادداشت محرمانه DM:</span>
        <p className="text-xs leading-relaxed">{npc.notes || (npc as any).dmNotes}</p>
      </div>
    )}
  </div>
));
NpcCardRow.displayName = 'NpcCardRow';

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
    sessionTag: 'جلسه 2',
    ac: '14',
    hp: { current: 30, max: 30 },
    speed: '9 متر',
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
      sessionTag: 'جلسه 2',
      ac: '14',
      hp: { current: 35, max: 35 },
      speed: '9 متر',
      abilities: { str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
      savingThrows: '',
      resistances: '',
      vulnerabilities: '',
      immunities: '',
      attacks: [{ id: 'atk-1', name: 'ضربه فیزیکی', toHit: '+4', damage: '1d8 + 2' }],
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

  const deferredSearch = useDeferredValue(searchQuery);

  const filteredNpcs = npcs.filter(npc => {
    const matchesType = selectedType === 'all' || npc.type === selectedType;
    const matchesSearch = !deferredSearch || npc.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      npc.description.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      npc.locationTag.toLowerCase().includes(deferredSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header, Search & Add */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، مکان یا خصوصیات NPCها..."
              className="w-full py-2 pe-9 ps-3 rounded-xl bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs transition whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>ساخت NPC / هیولای تازه</span>
          </button>
        </div>

        {/* Filter Pills */}
        <ScrollableRow activeKey={selectedType} className="items-center gap-1.5 pb-1">
          <button
            type="button"
            data-scroll-key="all"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
              selectedType === 'all'
                ? 'bg-accent text-on-accent border-accent-hover'
                : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
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
                type="button"
                data-scroll-key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
                  selectedType === typeKey
                    ? 'bg-accent text-on-accent border-accent-hover'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
                }`}
              >
                {typeLabels[typeKey]} ({count})
              </button>
            );
          })}
        </ScrollableRow>
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
              <label className="text-xs text-text-primary block mb-1">نام موجود / شخص:</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">نوع:</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NpcType })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              >
                {(Object.keys(typeLabels) as NpcType[]).map(t => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">مکان و محیط:</label>
              <input
                type="text"
                value={formData.locationTag}
                onChange={(e) => setFormData({ ...formData, locationTag: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-text-primary block mb-1">درجه زرهی (AC):</label>
              <input
                type="text"
                value={formData.ac}
                placeholder="آشوبناک 16 / مهارشده 10"
                onChange={(e) => setFormData({ ...formData, ac: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">حداکثر جان (HP):</label>
              <input
                type="number"
                value={formData.hp?.max}
                onChange={(e) => setFormData({
                  ...formData,
                  hp: { current: parseInt(e.target.value) || 1, max: parseInt(e.target.value) || 1 }
                })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">سرعت حرکت:</label>
              <input
                type="text"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-primary block mb-1">جلسه کمپین:</label>
              <input
                type="text"
                value={formData.sessionTag}
                onChange={(e) => setFormData({ ...formData, sessionTag: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-primary block mb-1">شرح و پیش‌زمینه روایی:</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
            />
          </div>

          <div>
            <label className="text-xs text-text-primary block mb-1">نکات تاکتیکی و هوش مبارزاتی برای DM:</label>
            <textarea
              rows={2}
              value={formData.tacticsTips}
              onChange={(e) => setFormData({ ...formData, tacticsTips: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
            />
          </div>

          <div>
            <label className="text-xs text-text-primary block mb-1">غنیمت و پاداش (Loot Drops):</label>
            <input
              type="text"
              value={formData.lootDrops}
              onChange={(e) => setFormData({ ...formData, lootDrops: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-border">
            <input
              type="checkbox"
              id="revealedCheck"
              checked={formData.isRevealed}
              onChange={(e) => setFormData({ ...formData, isRevealed: e.target.checked })}
              className="w-4 h-4 rounded text-accent accent-accent"
            />
            <label htmlFor="revealedCheck" className="text-xs text-text-primary font-bold cursor-pointer">
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
              className="py-2.5 px-4 rounded-xl text-xs text-text-muted touch-target min-w-[44px]"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-accent text-on-accent font-bold text-xs touch-target min-w-[44px]"
            >
              ذخیره NPC
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* NPCs Grid */}
      {filteredNpcs.length > 50 ? (
        <VirtualList
          items={filteredNpcs}
          itemHeight={240}
          height={600}
          keyExtractor={(npc) => npc.id}
          renderItem={(npc) => (
            <div className="pb-4">
              <NpcCardRow
                npc={npc}
                onToggleRevealed={toggleRevealed}
                onDuplicate={handleDuplicate}
                onStartEdit={handleStartEdit}
                onDeleteNpc={onDeleteNpc}
              />
            </div>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNpcs.map(npc => (
            <NpcCardRow
              key={npc.id}
              npc={npc}
              onToggleRevealed={toggleRevealed}
              onDuplicate={handleDuplicate}
              onStartEdit={handleStartEdit}
              onDeleteNpc={onDeleteNpc}
            />
          ))}
        </div>
      )}
    </div>
  );
};
