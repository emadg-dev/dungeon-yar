import React, { useState, useDeferredValue, startTransition, useCallback, memo } from 'react';
import { Character, InventoryItem, ItemCategory, CampaignSettings } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { ActionMenu, ActionMenuItem } from '../common/ActionMenu';
import { PartyTreasuryManager } from '../campaign/PartyTreasuryManager';
import { VirtualList } from '../common/VirtualList';
import { 
  Package, Coins, Flame, Utensils, Search, Plus, 
  Trash2, ShieldCheck, Sparkles, MoreVertical, Check, Eye, Lock 
} from 'lucide-react';

interface InventoryItemRowProps {
  item: InventoryItem;
  onSelectDetail: (item: InventoryItem) => void;
  onAdjustQuantity: (id: string, delta: number) => void;
  onOpenActionMenu: (item: InventoryItem) => void;
}

const InventoryItemRow = memo<InventoryItemRowProps>(({
  item,
  onSelectDetail,
  onAdjustQuantity,
  onOpenActionMenu
}) => (
  <div
    className="surface-2-card rounded-[12px] p-2.5 border border-[#2F2A23] flex items-center justify-between gap-2 transition hover:border-[#2F2A23]/80 content-visibility-card"
  >
    {/* Left: Item Info (Tap = Detail Sheet) */}
    <button
      type="button"
      onClick={() => onSelectDetail(item)}
      className="flex items-center gap-2.5 min-w-0 flex-1 text-start touch-target"
    >
      {/* Amber "New" Dot for DM-granted items */}
      {item.isNew && (
        <span
          className="w-2.5 h-2.5 rounded-full bg-[#E0A030] shadow-[0_0_8px_rgba(224,160,48,0.8)] shrink-0 animate-pulse"
          title="شیء جدید از طرف دانجن مستر"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-extrabold text-xs text-[#EDE6D8] truncate">{item.name}</span>
          
          {/* Badges: Equipped / Quest / Artifact */}
          {item.isEquipped && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30 font-bold shrink-0">
              مجهز
            </span>
          )}
          {item.isQuest && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#C97B4A]/15 text-[#C97B4A] border border-[#C97B4A]/30 font-bold shrink-0">
              مأموریت
            </span>
          )}
          {item.isArtifact && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 font-bold shrink-0">
              آرتیفکت
            </span>
          )}
        </div>

        <div className="text-[10px] text-[#A39A89] mt-0.5 truncate">
          وزن: {item.weight} کیلو • {item.description || 'بدون توضیحات'}
        </div>
      </div>
    </button>

    {/* Right: Quantity Stepper & ⋯ Action Menu */}
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="flex items-center gap-1 bg-[#0E0D0C] p-0.5 rounded-[8px] border border-[#2F2A23]">
        <button
          type="button"
          onClick={() => onAdjustQuantity(item.id, -1)}
          className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold text-xs touch-target flex items-center justify-center"
        >
          -
        </button>
        <span className="font-mono text-xs font-extrabold text-[#EDE6D8] min-w-[20px] text-center dice-ltr">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onAdjustQuantity(item.id, 1)}
          className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] font-bold text-xs touch-target flex items-center justify-center"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpenActionMenu(item)}
        className="w-9 h-9 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] flex items-center justify-center touch-target"
        title="منوی عملیات"
        aria-label={`عملیات برای ${item.name}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  </div>
));
InventoryItemRow.displayName = 'InventoryItemRow';

interface InventoryTabProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  campaignId?: string;
  activeParticipationId?: string;
  campaignSettings?: CampaignSettings | null;
  sheetLocked?: boolean | number;
  activeGrants?: any[];
  isDm?: boolean;
  onOpenLockedField?: (fieldName: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  character,
  onUpdate,
  campaignId = 'zorvania-c1',
  activeParticipationId,
  campaignSettings,
  sheetLocked = true,
  activeGrants = [],
  isDm = false,
  onOpenLockedField
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryItem | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  const now = Date.now();
  const validGrants = (activeGrants || []).filter(g =>
    g && g.status === 'active' &&
    (!g.expires_at || g.expires_at > now) &&
    (!g.expiresAt || g.expiresAt > now) &&
    (g.uses_left == null || g.uses_left > 0)
  );

  const isInventoryLocked = Boolean(sheetLocked) && !isDm && !validGrants.some(g =>
    g.preset === 'full' || g.preset === 'inventory_add' ||
    (Array.isArray(g.fields) && (g.fields.includes('*') || g.fields.includes('addItem') || g.fields.includes('inventoryQuantity')))
  );

  const isCurrencyLocked = Boolean(sheetLocked) && !isDm && !validGrants.some(g =>
    g.preset === 'full' || g.preset === 'inventory_add' ||
    (Array.isArray(g.fields) && (g.fields.includes('*') || g.fields.includes('currencyBalance') || g.fields.includes('grantCurrency')))
  );

  // New Item State
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemWeight, setItemWeight] = useState(1);
  const [itemCategory, setItemCategory] = useState<ItemCategory>('misc');
  const [itemDescription, setItemDescription] = useState('');
  const [itemIsQuest, setItemIsQuest] = useState(false);

  // Trackers update
  const updateRations = (delta: number) => {
    if (delta > 0 && isInventoryLocked) {
      onOpenLockedField?.('inventoryQuantity');
      return;
    }
    onUpdate({
      ...character,
      rations: Math.max(0, (character.rations || 0) + delta)
    });
  };

  const updateLanternOil = (delta: number) => {
    if (delta > 0 && isInventoryLocked) {
      onOpenLockedField?.('inventoryQuantity');
      return;
    }
    onUpdate({
      ...character,
      lanternOil: Math.max(0, (character.lanternOil || 0) + delta)
    });
  };

  const updateCurrency = (key: 'gold' | 'silver' | 'copper', delta: number) => {
    if (delta > 0 && isCurrencyLocked) {
      onOpenLockedField?.('currencyBalance');
      return;
    }
    onUpdate({
      ...character,
      currencies: {
        ...character.currencies,
        [key]: Math.max(0, (character.currencies[key] || 0) + delta)
      }
    });
  };

  const toggleEquipped = (itemId: string) => {
    const updated = character.inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, isEquipped: !item.isEquipped, isNew: false };
      }
      return item;
    });
    onUpdate({ ...character, inventory: updated });
  };

  const adjustItemQuantity = (itemId: string, delta: number) => {
    if (delta > 0 && isInventoryLocked) {
      onOpenLockedField?.('inventoryQuantity');
      return;
    }
    const updated = character.inventory
      .map(item => {
        if (item.id === itemId) {
          const next = item.quantity + delta;
          return next > 0 ? { ...item, quantity: next, isNew: false } : null;
        }
        return item;
      })
      .filter((i): i is InventoryItem => i !== null);
    onUpdate({ ...character, inventory: updated });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: itemName.trim(),
      quantity: Math.max(1, itemQuantity),
      weight: Math.max(0, itemWeight),
      category: itemCategory,
      description: itemDescription.trim(),
      isQuest: itemIsQuest,
      isEquipped: false
    };

    onUpdate({
      ...character,
      inventory: [newItem, ...character.inventory]
    });

    setItemName('');
    setItemDescription('');
    setShowAddItem(false);
  };

  const categories = [
    { id: 'all', label: 'همه' },
    { id: 'weapon', label: 'سلاح‌ها' },
    { id: 'armor', label: 'زره و پوشش' },
    { id: 'potion', label: 'معجون‌ها' },
    { id: 'scroll', label: 'طومارها' },
    { id: 'misc', label: 'لوازم متفرقه' },
    { id: 'quest', label: 'مأموریت و کلیدی' }
  ];

  const deferredSearch = useDeferredValue(searchQuery);

  const filteredItems = character.inventory.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'quest' ? item.isQuest : item.category === selectedCategory);
    const matchesSearch =
      !deferredSearch ||
      item.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(deferredSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalWeight = character.inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  const getActionMenuItems = (item: InventoryItem): ActionMenuItem[] => [
    {
      id: 'equip',
      label: item.isEquipped ? 'خارج کردن از تن / تجهیز' : 'پوشیدن / تجهیز کردن',
      icon: ShieldCheck,
      onClick: () => toggleEquipped(item.id)
    },
    {
      id: 'inspect',
      label: 'مشاهده جزئیات کامل',
      icon: Eye,
      onClick: () => setSelectedItemDetail(item)
    },
    {
      id: 'delete',
      label: 'حذف از کوله‌پشتی',
      icon: Trash2,
      destructive: true,
      onClick: () => setDeleteConfirm({ isOpen: true, id: item.id, name: item.name })
    }
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Three Big Counter Bars (Rations, Lanterns, Currency) with -/+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* 1. Rations Bar */}
        <div className="surface-card rounded-[14px] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">جیره غذایی (Rations)</h4>
              <p className="text-[10px] text-[#A39A89]">1 جیره در روز، مانع خستگی</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateRations(-1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="کاهش جیره"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-[#E0A030] min-w-[32px] text-center dice-ltr">
              {character.rations}
            </span>
            <button
              type="button"
              onClick={() => updateRations(1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="افزایش جیره"
            >
              +
            </button>
          </div>
        </div>

        {/* 2. Lanterns Bar */}
        <div className="surface-card rounded-[14px] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#C2512B]/15 text-[#C2512B] border border-[#C2512B]/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">چراغ روغنی (Lanterns)</h4>
              <p className="text-[10px] text-[#A39A89]">هر چراغ ≈ 6 ساعت روشنایی</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateLanternOil(-1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="کاهش روغن"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-[#E0A030] min-w-[32px] text-center dice-ltr">
              {character.lanternOil}
            </span>
            <button
              type="button"
              onClick={() => updateLanternOil(1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="افزایش روغن"
            >
              +
            </button>
          </div>
        </div>

        {/* 3. Currency Bar */}
        <div className="surface-card rounded-[14px] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#D6B25E]/15 text-[#D6B25E] border border-[#D6B25E]/30 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">سکه طلا و نقره</h4>
              <p className="text-[10px] text-[#A39A89]">وزن کوله: {totalWeight.toFixed(1)} کیلو</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateCurrency('gold', -1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="کاهش طلا"
            >
              -
            </button>
            <span className="font-mono text-xl font-extrabold text-[#D6B25E] min-w-[32px] text-center dice-ltr">
              {character.currencies.gold}
            </span>
            <button
              type="button"
              onClick={() => updateCurrency('gold', 1)}
              className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-black text-sm touch-target flex items-center justify-center"
              title="افزایش طلا"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Category Chips + Search Bar */}
      <div className="surface-card rounded-[14px] p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="جستجو در اشیاء و نشان‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pe-3 ps-8 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#A39A89] absolute start-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={() => setShowTreasuryModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#201D19] border border-[#E0A030]/40 text-[#E0A030] hover:bg-[#2B2620] text-xs font-bold transition touch-target shrink-0"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>خزانه گروه</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isInventoryLocked) {
                onOpenLockedField?.('addItem');
              } else {
                setShowAddItem(true);
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target shrink-0"
          >
            {isInventoryLocked ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isInventoryLocked ? 'افزودن شیء (قفل DM)' : 'ثبت شیء نو'}</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" dir="rtl">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                startTransition(() => {
                  setSelectedCategory(cat.id);
                });
              }}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition whitespace-nowrap touch-target ${
                selectedCategory === cat.id
                  ? 'bg-[#E0A030] text-[#0E0D0C]'
                  : 'bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Item Rows List */}
        <div className="space-y-2 pt-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-[#A39A89] text-xs">
              شیئی در این دسته‌بندی یافت نشد.
            </div>
          ) : filteredItems.length > 50 ? (
            <VirtualList
              items={filteredItems}
              itemHeight={68}
              height={520}
              keyExtractor={(item) => item.id}
              renderItem={(item) => (
                <div className="pb-2">
                  <InventoryItemRow
                    item={item}
                    onSelectDetail={setSelectedItemDetail}
                    onAdjustQuantity={adjustItemQuantity}
                    onOpenActionMenu={setActionMenuItem}
                  />
                </div>
              )}
            />
          ) : (
            filteredItems.map(item => (
              <InventoryItemRow
                key={item.id}
                item={item}
                onSelectDetail={setSelectedItemDetail}
                onAdjustQuantity={adjustItemQuantity}
                onOpenActionMenu={setActionMenuItem}
              />
            ))
          )}
        </div>
      </div>

      {/* Item Detail Bottom Sheet */}
      {selectedItemDetail && (
        <BottomSheet
          isOpen={!!selectedItemDetail}
          onClose={() => setSelectedItemDetail(null)}
          title={selectedItemDetail.name}
          subtitle={`تعداد: ${selectedItemDetail.quantity} • وزن: ${selectedItemDetail.weight} کیلو`}
        >
          <div className="space-y-4 text-xs text-[#EDE6D8]" dir="rtl">
            <div className="p-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] leading-relaxed">
              {selectedItemDetail.description || 'توضیحات تکمیلی برای این شیء ثبت نشده است.'}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  toggleEquipped(selectedItemDetail.id);
                  setSelectedItemDetail(null);
                }}
                className="py-2.5 px-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold touch-target"
              >
                {selectedItemDetail.isEquipped ? 'خارج کردن از حالت مجهز' : 'مجهز کردن'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="py-2.5 px-5 rounded-[12px] btn-primary-amber text-xs font-bold touch-target"
              >
                بستن
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Item Action Menu Sheet */}
      {actionMenuItem && (
        <ActionMenu
          isOpen={!!actionMenuItem}
          title={actionMenuItem.name}
          items={getActionMenuItems(actionMenuItem)}
          onClose={() => setActionMenuItem(null)}
        />
      )}

      {/* Add Item Bottom Sheet */}
      <BottomSheet
        isOpen={showAddItem}
        onClose={() => setShowAddItem(false)}
        title="ثبت شیء تازه در کوله‌پشتی"
        subtitle="غنائم، ابزارها، معجون‌ها و نشان‌های تاریخی"
      >
        <form onSubmit={handleAddItem} className="space-y-3" dir="rtl">
          <div>
            <label className="text-xs text-[#A39A89] block mb-1">نام شیء یا غنیمت:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: خنجر نقره‌ای کاروانسرای ماه"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#A39A89] block mb-1">دسته‌بندی:</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as ItemCategory)}
                className="w-full py-2.5 px-2 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              >
                <option value="weapon">سلاح</option>
                <option value="armor">زره</option>
                <option value="potion">معجون</option>
                <option value="scroll">طومار</option>
                <option value="misc">متفرقه</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A39A89] block mb-1">وزن (کیلوگرم):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={itemWeight}
                onChange={(e) => setItemWeight(parseFloat(e.target.value) || 0)}
                className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#A39A89] block mb-1">شرح و خواص جادویی:</label>
            <textarea
              rows={3}
              placeholder="توضیحات و کاربرد..."
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddItem(false)}
              className="py-2.5 px-4 rounded-[12px] text-xs text-[#A39A89] touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target"
            >
              افزودن به کوله
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmSheet
          isOpen={deleteConfirm.isOpen}
          title="حذف از کوله‌پشتی"
          message={`آیا از حذف «${deleteConfirm.name}» مطمئن هستید؟`}
          confirmLabel="بله، حذف کن"
          cancelLabel="انصراف"
          isDestructive
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            onUpdate({
              ...character,
              inventory: character.inventory.filter(i => i.id !== deleteConfirm.id)
            });
            setDeleteConfirm(null);
          }}
        />
      )}

      {/* Party Treasury BottomSheet */}
      <BottomSheet
        isOpen={showTreasuryModal}
        onClose={() => setShowTreasuryModal(false)}
        title="خزانه مشترک گروه"
      >
        <div className="p-3 max-h-[75vh] overflow-y-auto">
          <PartyTreasuryManager
            campaignId={campaignId}
            userRole="player"
            activeCharacter={character}
            activeParticipationId={activeParticipationId}
            campaignSettings={campaignSettings}
            onUpdateCharacterInventory={(inv) => onUpdate({ ...character, inventory: inv })}
          />
        </div>
      </BottomSheet>
    </div>
  );
};
