import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useDeferredValue, startTransition, memo } from 'react';
import { NPC, NpcType } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { VirtualList } from '../common/VirtualList';
import { SafeImage } from '../common/SafeImage';
import { 
  Users, Plus, Search, Edit3, Trash2, Copy, 
  Eye, EyeOff, Shield, Heart, Zap, Sparkles, Lock 
} from 'lucide-react';

// Plain Persian labels (the English suffixes made chips long and added no information).
// Previously this map was also duplicated inside the component.
const typeLabels: Record<NpcType, string> = {
  boss: 'باس اصلی',
  guardian: 'نگهبان معبد',
  elite: 'دشمن نخبه',
  minion: 'موجود ضعیف',
  hazard: 'خطر محیطی',
  neutral: 'شخصیت بی‌طرف',
  ally: 'متحد و همراه',
  merchant: 'بازرگان',
  'quest-giver': 'مأموریت‌دهنده',
  'guardian-construct': 'سازه نگهبان',
  other: 'سایر'
};

const FALLBACK_PORTRAIT =
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80';

// Fixed card height keeps the grid even and the virtual list's row height correct.
const CARD_HEIGHT = 232;

interface NpcCardRowProps {
  npc: NPC;
  onToggleRevealed: (npc: NPC) => void;
  onOpen: (npc: NPC) => void;
}

/** Compact summary card: who, key numbers, a short teaser, and the visibility switch. Tap for everything else. */
const NpcCardRow = memo<NpcCardRowProps>(({ npc, onToggleRevealed, onOpen }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onOpen(npc)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(npc);
      }
    }}
    style={{ height: CARD_HEIGHT }}
    className="bg-surface border border-border hover:border-accent/40 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden cursor-pointer transition-colors content-visibility-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  >
    {/* Identity */}
    <div className="flex items-center gap-3">
      <SafeImage
        src={npc.portraitUrl || FALLBACK_PORTRAIT}
        alt={npc.name}
        width={48}
        height={48}
        className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h4 className="font-extrabold text-base text-text-primary truncate leading-snug">{npc.name}</h4>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border whitespace-nowrap shrink-0">
            {typeLabels[npc.type]}
          </span>
          {npc.locationTag && <span className="text-xs text-text-muted truncate">{npc.locationTag}</span>}
        </div>
      </div>
    </div>

    {/* Key numbers */}
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-surface-2 border border-border">
        <Shield className="w-4 h-4 text-accent-hover" />
        <span className="text-xs text-text-muted">AC</span>
        <b className="text-text-primary tabular-nums">{npc.ac}</b>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-surface-2 border border-border">
        <Heart className="w-4 h-4 text-danger" />
        <span className="text-xs text-text-muted">HP</span>
        <b className="text-text-primary tabular-nums">{npc.hp.max}</b>
      </span>
      {npc.specialAbilities?.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-surface-2 border border-border text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-accent-hover" />
          <span className="tabular-nums">{npc.specialAbilities.length}</span>
          <span>توانایی</span>
        </span>
      )}
    </div>

    {/* Teaser */}
    <p className="flex-1 text-sm text-text-muted leading-snug line-clamp-2">
      {npc.description || 'بدون توضیحات.'}
    </p>

    {/* Visibility: a labelled switch, so state is readable without hovering */}
    <div className="pt-3 border-t border-border/60">
      <Button
        type="button"
        role="switch"
        aria-checked={npc.isRevealed}
        onClick={(e) => {
          e.stopPropagation();
          onToggleRevealed(npc);
        }}
        title={npc.isRevealed ? 'برای پنهان‌سازی لمس کنید' : 'برای آشکارسازی لمس کنید'}
        className={`h-10 px-3 rounded-[10px] text-sm font-bold transition flex items-center gap-1.5 ${
          npc.isRevealed
            ? 'bg-success/15 text-success hover:bg-success/25'
            : 'bg-surface-2 text-text-muted border border-border hover:text-text-primary'
        }`}
      >
        {npc.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>{npc.isRevealed ? 'آشکار برای بازیکنان' : 'مخفی از بازیکنان'}</span>
      </Button>
    </div>
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
  const [detailNpcId, setDetailNpcId] = useState<string | null>(null);

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
    setDetailNpcId(null);
    setFormData(npc);
    setEditingNpc(npc);
    setIsCreating(true);
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingNpc(null);
  };

  const handleDuplicate = (npc: NPC) => {
    const copy: Omit<NPC, 'id' | 'updatedAt'> = {
      ...npc,
      name: `${npc.name} (کپی)`,
      isRevealed: false
    };
    onCreateNpc(copy);
    setDetailNpcId(null);
  };

  // Deleting now asks first (it used to delete immediately from an icon next to "edit")
  const handleDelete = (npc: NPC) => {
    if (confirm(`آیا از حذف "${npc.name}" اطمینان دارید؟`)) {
      onDeleteNpc(npc.id);
      setDetailNpcId(null);
    }
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

    handleCloseForm();
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

  const hasActiveFilters = Boolean(searchQuery) || selectedType !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
  };

  // Always read the open NPC from props so the detail sheet reflects visibility toggles
  const detailNpc = detailNpcId ? npcs.find(n => n.id === detailNpcId) || null : null;
  const detailNotes = detailNpc ? (detailNpc.notes || (detailNpc as any).dmNotes) : '';

  const typeChips = [
    { id: 'all', label: 'همه', count: npcs.length },
    ...(Object.keys(typeLabels) as NpcType[])
      .map(k => ({ id: k as string, label: typeLabels[k], count: npcs.filter(n => n.type === k).length }))
      .filter(c => c.count > 0)
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search + the one primary action */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <Input noWrapper
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام، مکان یا توضیحات..."
            aria-label="جستجو در NPCها"
            className="w-full h-11 ps-9 pe-3 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <Button
          type="button"
          onClick={handleStartCreate}
          className="flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-extrabold text-sm transition whitespace-nowrap shrink-0 shadow-md"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>NPC جدید</span>
        </Button>
      </div>

      {/* Type filter */}
      <ScrollableRow activeKey={selectedType} className="items-center gap-1.5 pb-1">
        {typeChips.map(chip => (
          <Button
            key={chip.id}
            type="button"
            data-scroll-key={chip.id}
            aria-pressed={selectedType === chip.id}
            onClick={() => {
              startTransition(() => {
                setSelectedType(chip.id);
              });
            }}
            className={`h-10 px-3.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0 snap-start transition flex items-center gap-1.5 ${
              selectedType === chip.id
                ? 'bg-accent text-on-accent'
                : 'bg-surface text-text-primary border border-border hover:border-accent/40'
            }`}
          >
            <span>{chip.label}</span>
            <span className="text-xs tabular-nums opacity-75">{chip.count}</span>
          </Button>
        ))}
      </ScrollableRow>

      {/* Create / Edit sheet */}
      <BottomSheet
        isOpen={isCreating}
        onClose={handleCloseForm}
        title={editingNpc ? `ویرایش ${editingNpc.name}` : 'NPC یا هیولای جدید'}
        subtitle="مشخصات، جان، زره، تاکتیک و غنایم"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5 pb-2" dir="rtl">
          {/* Basics */}
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">نام</span>
              <Input noWrapper
                type="text"
                required
                value={formData.name ?? ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">نوع</span>
              <Select noWrapper
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NpcType })}
                className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
              >
                {(Object.keys(typeLabels) as NpcType[]).map(t => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </Select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">مکان</span>
                <Input noWrapper
                  type="text"
                  value={formData.locationTag ?? ''}
                  onChange={(e) => setFormData({ ...formData, locationTag: e.target.value })}
                  className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">جلسه</span>
                <Input noWrapper
                  type="text"
                  value={formData.sessionTag ?? ''}
                  onChange={(e) => setFormData({ ...formData, sessionTag: e.target.value })}
                  className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
                />
              </label>
            </div>
          </div>

          {/* Combat numbers */}
          <fieldset className="space-y-3 min-w-0 border-0 p-0 m-0 pt-4 border-t border-border">
            <legend className="text-xs font-bold text-text-muted mb-1">آمار مبارزه</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">درجه زرهی (AC)</span>
                <Input noWrapper
                  type="text"
                  value={formData.ac ?? ''}
                  onChange={(e) => setFormData({ ...formData, ac: e.target.value })}
                  className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary font-bold text-center"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">حداکثر جان (HP)</span>
                <Input noWrapper
                  type="number"
                  value={formData.hp?.max ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    hp: { current: parseInt(e.target.value) || 1, max: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary font-bold text-center"
                />
              </label>
            </div>
            <p className="text-xs text-text-muted">
              برای AC می‌توانید متن آزاد بنویسید، مثلاً «آشوبناک 16 / مهارشده 10».
            </p>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">سرعت حرکت</span>
              <Input noWrapper
                type="text"
                value={formData.speed ?? ''}
                onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
              />
            </label>
          </fieldset>

          {/* Story + visibility */}
          <fieldset className="space-y-4 min-w-0 border-0 p-0 m-0 pt-4 border-t border-border">
            <legend className="text-xs font-bold text-text-muted mb-1">برای بازیکنان</legend>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">شرح و پیش‌زمینه</span>
              <Textarea noWrapper
                rows={3}
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 rounded-[10px] bg-surface border border-border focus:border-accent focus:outline-none text-sm text-text-primary"
              />
            </label>

            <label className="flex items-center justify-between gap-3 min-h-[56px] px-3
             py-2 rounded-[10px] bg-surface border border-border cursor-pointer hover:border-accent/40 transition mb-3">
              <span className="min-w-80">
                <span className="block text-sm font-bold text-text-primary">آشکار برای بازیکنان</span>
                <span className="block text-xs text-text-muted mt-0.5">در دانشنامه‌ی بازیکن نمایش داده می‌شود.</span>
              </span>
              <Input noWrapper
                type="checkbox"
                checked={!!formData.isRevealed}
                onChange={(e) => setFormData({ ...formData, isRevealed: e.target.checked })}
                className="w-5 h-5 rounded accent-accent cursor-pointer "
              />
            </label>
          </fieldset>

          {/* DM only */}
          <fieldset className="space-y-2 min-w-0 border-0 p-0 m-0 pt-4 border-t border-border ">
            <legend className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>فقط برای مستر</span>
            </legend>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">نکات تاکتیکی</span>
              <Textarea noWrapper
                rows={2}
                value={formData.tacticsTips ?? ''}
                onChange={(e) => setFormData({ ...formData, tacticsTips: e.target.value })}
                className="w-full p-3 rounded-[10px] bg-surface border border-border focus:border-accent 
                focus:outline-none text-sm text-text-primary mb-0"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mt-0 mb-2">غنیمت و پاداش</span>
              <Input noWrapper
                type="text"
                value={formData.lootDrops ?? ''}
                onChange={(e) => setFormData({ ...formData, lootDrops: e.target.value })}
                className="w-full h-11 px-3 rounded-[10px] bg-surface border border-border 
                focus:border-accent focus:outline-none text-sm text-text-primary mb-3"
              />
            </label>
          </fieldset>

          <div className="flex gap-2">
            
            <Button
              type="submit"
              disabled={!formData.name?.trim()}
              className="flex-[2] h-12 rounded-[10px] bg-accent hover:bg-accent-hover text-on-accent font-extrabold text-sm transition disabled:opacity-50"
            >
              {editingNpc ? 'ثبت تغییرات' : 'ایجاد NPC'}
            </Button>
            <Button
              type="button"
              onClick={handleCloseForm}
              className="flex-1 h-12 rounded-[10px] border border-border text-text-muted hover:text-text-primary font-bold text-sm transition"
            >
              انصراف
            </Button>
            
          </div>
        </form>
      </BottomSheet>

      {/* Detail sheet: everything the card leaves out, plus the actions */}
      {detailNpc && (
        <BottomSheet
          isOpen={Boolean(detailNpc)}
          onClose={() => setDetailNpcId(null)}
          title={detailNpc.name}
        >
          <div className="space-y-4 py-2" dir="rtl">
            <div className="flex items-center gap-3">
              <SafeImage
                src={detailNpc.portraitUrl || FALLBACK_PORTRAIT}
                alt={detailNpc.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                  {typeLabels[detailNpc.type]}
                </span>
                <p className="text-xs text-text-muted">
                  {[detailNpc.locationTag, detailNpc.sessionTag].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'درجه زرهی', value: detailNpc.ac, tone: 'text-accent-hover' },
                { label: 'جان', value: detailNpc.hp.max, tone: 'text-danger' },
                { label: 'سرعت', value: detailNpc.speed || '—', tone: 'text-text-primary' }
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-bg border border-border p-2.5 text-center">
                  <span className="block text-xs text-text-muted">{s.label}</span>
                  <b className={`block text-base tabular-nums break-words ${s.tone}`}>{s.value}</b>
                </div>
              ))}
            </div>

            {detailNpc.description && (
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{detailNpc.description}</p>
            )}

            {detailNpc.specialAbilities?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-accent-hover" />
                  <span>توانایی‌های ویژه</span>
                </h5>
                {detailNpc.specialAbilities.map((sa, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border">
                    <span className="font-bold text-sm text-accent-hover block">{sa.name}</span>
                    <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{sa.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* DM-only block: muted, not error-red */}
            {(detailNotes || detailNpc.tacticsTips || detailNpc.lootDrops) && (
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/25 space-y-2 text-sm">
                <h5 className="font-bold text-accent-hover flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>فقط برای مستر</span>
                </h5>
                {detailNotes && (
                  <p className="text-text-primary leading-relaxed"><b>یادداشت محرمانه: </b>{detailNotes}</p>
                )}
                {detailNpc.tacticsTips && (
                  <p className="text-text-primary leading-relaxed"><b>تاکتیک: </b>{detailNpc.tacticsTips}</p>
                )}
                {detailNpc.lootDrops && (
                  <p className="text-text-primary leading-relaxed"><b>غنیمت: </b>{detailNpc.lootDrops}</p>
                )}
              </div>
            )}

            {/* Actions: one primary, one secondary, destructive kept apart */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => handleStartEdit(detailNpc)}
                  className="h-12 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ویرایش</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDuplicate(detailNpc)}
                  className="h-12 rounded-xl bg-surface-2 border border-border text-text-primary hover:border-accent/40 font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>تکثیر</span>
                </Button>
              </div>
              <Button
                type="button"
                onClick={() => handleDelete(detailNpc)}
                className="w-full h-11 rounded-xl text-danger-hover hover:bg-danger/10 font-bold text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف این NPC</span>
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Results */}
      {filteredNpcs.length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-2xl border border-border space-y-3">
          <Users className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <p className="text-sm text-text-muted">
            {npcs.length === 0 ? 'هنوز NPC یا هیولایی ثبت نشده است.' : 'موردی با این فیلترها یافت نشد.'}
          </p>
          {npcs.length === 0 ? (
            <Button
              type="button"
              onClick={handleStartCreate}
              className="h-11 px-4 rounded-xl bg-accent text-on-accent text-sm font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ساخت اولین NPC</span>
            </Button>
          ) : hasActiveFilters && (
            <Button
              type="button"
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl bg-surface-2 border border-border text-text-primary text-sm font-bold"
            >
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      ) : filteredNpcs.length > 50 ? (
        <VirtualList
          items={filteredNpcs}
          itemHeight={CARD_HEIGHT + 16}
          height={600}
          keyExtractor={(npc) => npc.id}
          renderItem={(npc) => (
            <div className="pb-4">
              <NpcCardRow npc={npc} onToggleRevealed={toggleRevealed} onOpen={(n) => setDetailNpcId(n.id)} />
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
              onOpen={(n) => setDetailNpcId(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};