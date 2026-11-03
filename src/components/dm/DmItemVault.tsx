import React, { useState, useDeferredValue, startTransition } from 'react';
import { ItemLibraryEntry, ItemLibraryCategory, Character, RewardPackage, WeaponTemplate } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { 
  Sparkles, Plus, Search, Edit3, Trash2, Gift, 
  Eye, EyeOff, Coins, Package, Flame, Check 
} from 'lucide-react';

interface DmItemVaultProps {
  items: ItemLibraryEntry[];
  characters: Character[];
  rewards?: RewardPackage[];
  weaponTemplates: WeaponTemplate[];
  onCreateItem: (item: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>) => void;
  onUpdateItem: (item: ItemLibraryEntry) => void;
  onDeleteItem: (id: string) => void;
  onGiveItem?: (characterId: string, item: ItemLibraryEntry) => void;
  onGiveItemToPlayer?: (characterId: string, item: ItemLibraryEntry) => void;
  onDistributeReward?: (rewardId: string, characterIds: string[]) => void;
  onCreateReward?: (reward: Omit<RewardPackage, 'id' | 'createdAt'>) => void;
}

export const DmItemVault: React.FC<DmItemVaultProps> = ({
  items,
  characters,
  rewards = [],
  weaponTemplates,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onGiveItem,
  onGiveItemToPlayer = onGiveItem || (() => {}),
  onDistributeReward = () => {},
  onCreateReward = () => {}
}) => {
  const [subTab, setSubTab] = useState<'items' | 'rewards'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [giveModalItem, setGiveModalItem] = useState<ItemLibraryEntry | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [giveSuccessMsg, setGiveSuccessMsg] = useState<string>('');

  // Reward Distribution modal state
  const [distributeModalReward, setDistributeModalReward] = useState<RewardPackage | null>(null);
  const [selectedRewardCharIds, setSelectedRewardCharIds] = useState<string[]>([]);

  // Item Form State
  const [formData, setFormData] = useState<Partial<ItemLibraryEntry>>({
    name: '',
    category: 'artifact',
    rarity: 'کمیاب',
    description: '',
    mechanicalEffect: '',
    secretNotes: '',
    whoItsFor: '',
    isRevealed: false
  });

  const categoryLabels: Record<ItemLibraryCategory, string> = {
    artifact: 'آرتیفکت باستانی',
    loot: 'غنیمت و اشیاء گرانبها',
    consumable: 'معجون و مصرفی',
    weapon: 'سلاح و ادوات جنگی',
    quest: 'مأموریتی و کلید',
    treasure: 'گنجینه و جواهرات'
  };

  const handleStartCreate = () => {
    setFormData({
      name: '',
      category: 'artifact',
      rarity: 'کمیاب',
      description: '',
      mechanicalEffect: '',
      secretNotes: '',
      whoItsFor: 'همه اعضای گروه',
      isRevealed: true
    });
    setIsCreating(true);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    onCreateItem(formData as Omit<ItemLibraryEntry, 'id' | 'updatedAt'>);
    setIsCreating(false);
  };

  // Open Give Modal
  const handleOpenGive = (item: ItemLibraryEntry) => {
    setGiveModalItem(item);
    setSelectedCharacterId(characters[0]?.id || '');
    setGiveSuccessMsg('');
  };

  const handleConfirmGive = () => {
    if (!giveModalItem || !selectedCharacterId) return;
    onGiveItemToPlayer(selectedCharacterId, giveModalItem);
    const char = characters.find(c => c.id === selectedCharacterId);
    setGiveSuccessMsg(`آیتم «${giveModalItem.name}» با موفقیت به کوله‌پشتی ${char?.name} اضافه شد!`);
    setTimeout(() => {
      setGiveModalItem(null);
      setGiveSuccessMsg('');
    }, 1500);
  };

  const toggleRevealed = (item: ItemLibraryEntry) => {
    onUpdateItem({ ...item, isRevealed: !item.isRevealed });
  };

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    const matchesSearch = !deferredSearch || item.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      item.whoItsFor.toLowerCase().includes(deferredSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Distribute Reward Package
  const handleDistributeAll = (reward: RewardPackage) => {
    onDistributeReward(reward.id, characters.map(c => c.id));
    alert(`بسته پاداش «${reward.title}» بین تمام ماجراجویان توزیع شد!`);
  };

  return (
    <div className="space-y-6">
      {/* Vault Subtab switcher */}
      <ScrollableRow activeKey={subTab} className="border-b border-border pb-2 gap-4">
        <button
          type="button"
          data-scroll-key="items"
          onClick={() => setSubTab('items')}
          className={`pb-2 text-xs font-bold transition border-b-2 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
            subTab === 'items'
              ? 'border-accent-hover text-accent-hover'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          گنجینه اشیاء و آرتیفکت‌ها ({items.length})
        </button>
        <button
          type="button"
          data-scroll-key="rewards"
          onClick={() => setSubTab('rewards')}
          className={`pb-2 text-xs font-bold transition border-b-2 whitespace-nowrap shrink-0 snap-start min-h-[44px] ${
            subTab === 'rewards'
              ? 'border-accent-hover text-accent-hover'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          بسته‌های پاداش و غنایم ({rewards.length})
        </button>
      </ScrollableRow>

      {subTab === 'items' ? (
        <>
          {/* Header & Controls */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در آرتیفکت‌ها، سلاح‌ها و پاداش‌ها..."
                  className="w-full py-2 pe-9 ps-3 rounded-xl bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
                />
              </div>

              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs transition whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>افزودن شیء / آرتیفکت تازه</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <ScrollableRow activeKey={selectedCat} className="items-center gap-1.5 pb-1">
              <button
                type="button"
                data-scroll-key="all"
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
                  selectedCat === 'all'
                    ? 'bg-accent text-on-accent border-accent-hover'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
                }`}
              >
                همه ({items.length})
              </button>
              {(Object.keys(categoryLabels) as ItemLibraryCategory[]).map(cat => {
                const count = items.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    data-scroll-key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
                      selectedCat === cat
                        ? 'bg-accent text-on-accent border-accent-hover'
                        : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
                    }`}
                  >
                    {categoryLabels[cat]} ({count})
                  </button>
                );
              })}
            </ScrollableRow>
          </div>

          {/* Create Item BottomSheet Modal */}
          <BottomSheet
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            title="ثبت شیء یا آرتیفکت در گنجینه کمپین"
            subtitle="تنظیم مشخصات، دسته‌بندی، کمیابی، خواص و تگ مالک"
          >
            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-primary block mb-1">نام شیء:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثلاً: خنجر ایستایی زروان"
                    className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-primary block mb-1">دسته‌بندی:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemLibraryCategory })}
                    className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                  >
                    {(Object.keys(categoryLabels) as ItemLibraryCategory[]).map(c => (
                      <option key={c} value={c}>{categoryLabels[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-primary block mb-1">کمیابی:</label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                  >
                    <option value="معمولی">معمولی</option>
                    <option value="کمیاب">کمیاب</option>
                    <option value="بسیار کمیاب">بسیار کمیاب</option>
                    <option value="افسانه‌ای">افسانه‌ای</option>
                    <option value="باستانی و ممنوعه">باستانی و ممنوعه</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-primary block mb-1">شرح و ظاهر:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs text-text-primary block mb-1">اثر مکانیکی و قوانین بازی:</label>
                <textarea
                  rows={2}
                  value={formData.mechanicalEffect}
                  onChange={(e) => setFormData({ ...formData, mechanicalEffect: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-primary block mb-1">مناسب برای (تگ بازیکن):</label>
                  <input
                    type="text"
                    value={formData.whoItsFor}
                    onChange={(e) => setFormData({ ...formData, whoItsFor: e.target.value })}
                    placeholder="سامان یا پردیس"
                    className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-primary block mb-1">یادداشت محرمانه DM:</label>
                  <input
                    type="text"
                    value={formData.secretNotes}
                    onChange={(e) => setFormData({ ...formData, secretNotes: e.target.value })}
                    placeholder="عوارض جانبی یا راز پشت پرده..."
                    className="w-full py-2 px-3 rounded-xl bg-bg border border-border-strong text-sm text-text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-border">
                <input
                  type="checkbox"
                  id="revealedItemCheck"
                  checked={formData.isRevealed}
                  onChange={(e) => setFormData({ ...formData, isRevealed: e.target.checked })}
                  className="w-4 h-4 rounded text-accent accent-accent"
                />
                <label htmlFor="revealedItemCheck" className="text-xs text-text-primary font-bold cursor-pointer">
                  آشکار برای بازیکنان (در دانشنامه بازیکنان نمایش داده شود)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="py-2.5 px-4 rounded-xl text-xs text-text-muted touch-target min-w-[44px]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-accent text-on-accent font-bold text-xs touch-target min-w-[44px]"
                >
                  ذخیره در گنجینه
                </button>
              </div>
            </form>
          </BottomSheet>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-surface border border-border hover:border-accent/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between content-visibility-card"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-accent-hover">{item.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-hover border border-accent/30 font-bold">
                        {item.rarity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleRevealed(item)}
                        title={item.isRevealed ? 'آشکار برای بازیکنان' : 'پنهان از بازیکنان'}
                        className={`p-1.5 rounded-lg text-xs transition border ${
                          item.isRevealed
                            ? 'bg-accent/20 text-accent-hover border-accent/30'
                            : 'bg-surface-2 text-text-muted border-border-strong'
                        }`}
                      >
                        {item.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-surface-2 text-text-muted hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <span className="text-xs text-text-muted block mb-2">
                    دسته‌بندی: {categoryLabels[item.category]} • اختصاصی: {item.whoItsFor || 'نامشخص'}
                  </span>

                  <p className="text-xs text-text-primary leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {item.mechanicalEffect && (
                    <div className="p-2.5 rounded-xl bg-bg border border-border text-xs text-accent-hover/90 mb-3">
                      <strong>اثر مکانیکی:</strong> {item.mechanicalEffect}
                    </div>
                  )}

                  {item.secretNotes && (
                    <div className="p-2.5 rounded-xl bg-danger/15 border border-danger/30 text-xs text-danger mb-3">
                      <strong>راز DM:</strong> {item.secretNotes}
                    </div>
                  )}
                </div>

                {/* Give to Player Button */}
                <button
                  onClick={() => handleOpenGive(item)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  اهدای این شیء به یکی از ماجراجویان
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Rewards Subtab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map(rew => (
              <div key={rew.id} className="p-4 rounded-2xl bg-surface border border-accent/25 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-accent-hover">{rew.title}</h4>
                    <span className="text-xs text-text-muted font-mono">
                      {new Date(rew.createdAt).toLocaleDateString('fa-IR-u-nu-latn')}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary mb-3">{rew.description}</p>

                  <div className="flex items-center gap-4 text-xs font-mono bg-bg p-2.5 rounded-xl border border-border mb-3">
                    <span className="text-accent-hover font-bold">{rew.gold} سکه طلا</span>
                    <span className="text-text-primary">{rew.silver} سکه نقره</span>
                    <span className="text-accent-hover font-bold">{rew.skillPoints} امتیاز مهارت</span>
                  </div>

                  {rew.items?.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <span className="text-xs text-text-muted block font-semibold">اقلام همراه بسته:</span>
                      {rew.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-text-primary flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-accent-hover" />
                          <span>{it.name} (x{it.quantity})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDistributeAll(rew)}
                  className="w-full py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  توزیع این بسته بین تمام اعضای گروه
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Give to Player Modal */}
      <BottomSheet
        isOpen={!!giveModalItem}
        onClose={() => setGiveModalItem(null)}
        title={giveModalItem ? `اهدای «${giveModalItem.name}» به ماجراجو` : 'اهدای شیء به ماجراجو'}
        subtitle="قرارگیری مستقیم در کوله‌پشتی یا بخش سلاح‌های بازیکن"
      >
        {giveModalItem && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              شیء در کوله‌پشتی بازیکن با نشان «جدید» قرار خواهد گرفت و در صورت سلاح بودن، خودکار به تب مبارزه افزوده می‌شود.
            </p>

            {giveSuccessMsg ? (
              <div className="p-3 rounded-xl bg-success/15 border border-success/50 text-success text-xs text-center font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {giveSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-primary block mb-1">انتخاب بازیکن:</label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-info border border-border-strong text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.className})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setGiveModalItem(null)}
                    className="py-2.5 px-4 rounded-xl text-xs text-text-muted hover:text-text-primary touch-target min-w-[44px]"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGive}
                    className="py-2.5 px-5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs shadow-md transition touch-target min-w-[44px]"
                  >
                    تأیید و ارسال به ماجراجو
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
