import React, { useState } from 'react';
import { ItemLibraryEntry, ItemLibraryCategory, Character, RewardPackage, WeaponTemplate } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
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
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.whoItsFor.toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="flex border-b border-[#2F2A23] pb-2 gap-4">
        <button
          onClick={() => setSubTab('items')}
          className={`pb-2 text-xs font-bold transition border-b-2 ${
            subTab === 'items'
              ? 'border-[#F2C265] text-[#F2C265]'
              : 'border-transparent text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          گنجینه اشیاء و آرتیفکت‌ها ({items.length})
        </button>
        <button
          onClick={() => setSubTab('rewards')}
          className={`pb-2 text-xs font-bold transition border-b-2 ${
            subTab === 'rewards'
              ? 'border-[#F2C265] text-[#F2C265]'
              : 'border-transparent text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          بسته‌های پاداش و غنایم ({rewards.length})
        </button>
      </div>

      {subTab === 'items' ? (
        <>
          {/* Header & Controls */}
          <div className="bg-[#171513] border border-[#2F2A23] rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2F2A23]">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-[#8A8374]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در آرتیفکت‌ها، سلاح‌ها و پاداش‌ها..."
                  className="w-full py-2 pr-9 pl-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>

              <button
                onClick={handleStartCreate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                افزودن شیء / آرتیفکت تازه
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedCat === 'all'
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                }`}
              >
                همه ({items.length})
              </button>
              {(Object.keys(categoryLabels) as ItemLibraryCategory[]).map(cat => {
                const count = items.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                      selectedCat === cat
                        ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                        : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                    }`}
                  >
                    {categoryLabels[cat]} ({count})
                  </button>
                );
              })}
            </div>
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
                  <label className="text-xs text-[#C9C0AE] block mb-1">نام شیء:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثلاً: خنجر ایستایی زروان"
                    className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#C9C0AE] block mb-1">دسته‌بندی:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemLibraryCategory })}
                    className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                  >
                    {(Object.keys(categoryLabels) as ItemLibraryCategory[]).map(c => (
                      <option key={c} value={c}>{categoryLabels[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C9C0AE] block mb-1">کمیابی:</label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
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
                <label className="text-xs text-[#C9C0AE] block mb-1">شرح و ظاهر:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                />
              </div>

              <div>
                <label className="text-xs text-[#C9C0AE] block mb-1">اثر مکانیکی و قوانین بازی:</label>
                <textarea
                  rows={2}
                  value={formData.mechanicalEffect}
                  onChange={(e) => setFormData({ ...formData, mechanicalEffect: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C9C0AE] block mb-1">مناسب برای (تگ بازیکن):</label>
                  <input
                    type="text"
                    value={formData.whoItsFor}
                    onChange={(e) => setFormData({ ...formData, whoItsFor: e.target.value })}
                    placeholder="سامان یا پردیس"
                    className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#C9C0AE] block mb-1">یادداشت محرمانه DM:</label>
                  <input
                    type="text"
                    value={formData.secretNotes}
                    onChange={(e) => setFormData({ ...formData, secretNotes: e.target.value })}
                    placeholder="عوارض جانبی یا راز پشت پرده..."
                    className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#171513] border border-[#2F2A23]">
                <input
                  type="checkbox"
                  id="revealedItemCheck"
                  checked={formData.isRevealed}
                  onChange={(e) => setFormData({ ...formData, isRevealed: e.target.checked })}
                  className="w-4 h-4 rounded text-[#E0A030] accent-[#E0A030]"
                />
                <label htmlFor="revealedItemCheck" className="text-xs text-[#C9C0AE] font-bold cursor-pointer">
                  آشکار برای بازیکنان (در دانشنامه بازیکنان نمایش داده شود)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="py-2.5 px-4 rounded-xl text-xs text-[#A39A89] touch-target"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs touch-target"
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
                className="bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#F2C265]">{item.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0A030]/15 text-[#F2C265] border border-[#E0A030]/30 font-bold">
                        {item.rarity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleRevealed(item)}
                        title={item.isRevealed ? 'آشکار برای بازیکنان' : 'پنهان از بازیکنان'}
                        className={`p-1.5 rounded-lg text-xs transition border ${
                          item.isRevealed
                            ? 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]/30'
                            : 'bg-[#201D19] text-[#8A8374] border-[#3A342B]'
                        }`}
                      >
                        {item.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-[#E8836B]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#8A8374] block mb-2">
                    دسته‌بندی: {categoryLabels[item.category]} • اختصاصی: {item.whoItsFor || 'نامشخص'}
                  </span>

                  <p className="text-xs text-[#C9C0AE] leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {item.mechanicalEffect && (
                    <div className="p-2.5 rounded-xl bg-[#131110] border border-[#2F2A23] text-xs text-[#F2C265]/90 mb-3">
                      <strong>اثر مکانیکی:</strong> {item.mechanicalEffect}
                    </div>
                  )}

                  {item.secretNotes && (
                    <div className="p-2.5 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/30 text-xs text-[#E8836B] mb-3">
                      <strong>راز DM:</strong> {item.secretNotes}
                    </div>
                  )}
                </div>

                {/* Give to Player Button */}
                <button
                  onClick={() => handleOpenGive(item)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] text-xs font-bold transition flex items-center justify-center gap-1.5"
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
              <div key={rew.id} className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/25 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-[#F2C265]">{rew.title}</h4>
                    <span className="text-[10px] text-[#8A8374] font-mono">
                      {new Date(rew.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <p className="text-xs text-[#C9C0AE] mb-3">{rew.description}</p>

                  <div className="flex items-center gap-4 text-xs font-mono bg-[#131110] p-2.5 rounded-xl border border-[#2F2A23] mb-3">
                    <span className="text-[#F2C265] font-bold">{rew.gold} سکه طلا</span>
                    <span className="text-[#C9C0AE]">{rew.silver} سکه نقره</span>
                    <span className="text-[#F2C265] font-bold">{rew.skillPoints} امتیاز مهارت</span>
                  </div>

                  {rew.items?.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <span className="text-[11px] text-[#A39A89] block font-semibold">اقلام همراه بسته:</span>
                      {rew.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-[#C9C0AE] flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#F2C265]" />
                          <span>{it.name} (x{it.quantity})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDistributeAll(rew)}
                  className="w-full py-2 px-3 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-bold text-xs transition flex items-center justify-center gap-2"
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
            <p className="text-xs text-[#A39A89]">
              شیء در کوله‌پشتی بازیکن با نشان «جدید» قرار خواهد گرفت و در صورت سلاح بودن، خودکار به تب مبارزه افزوده می‌شود.
            </p>

            {giveSuccessMsg ? (
              <div className="p-3 rounded-xl bg-[#6F9E78]/15 border border-[#6F9E78]/50 text-[#6F9E78] text-xs text-center font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {giveSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#C9C0AE] block mb-1">انتخاب بازیکن:</label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#181c28] border border-[#3A342B] text-sm text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
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
                    className="py-2.5 px-4 rounded-xl text-xs text-[#A39A89] hover:text-[#EDE6D8] touch-target"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGive}
                    className="py-2.5 px-5 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-bold text-xs shadow-md transition touch-target"
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
