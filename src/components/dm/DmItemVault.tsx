import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useDeferredValue } from 'react';
import { ItemLibraryEntry, ItemLibraryCategory, Character, RewardPackage, WeaponTemplate } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import {
  Field, Badge, IconButton, StickyFooter, ToggleChip,
  pillCls, inputCls, textareaCls, primaryBtnCls, secondaryBtnCls
} from '../ui/FormLayout';
import { Plus, Search, Trash2, Gift, Eye, EyeOff, Package, Check, Lock, CheckSquare, Square } from 'lucide-react';

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

const CATEGORY_LABELS: Record<ItemLibraryCategory, string> = {
  artifact: 'آرتیفکت باستانی',
  loot: 'غنیمت و اشیاء گرانبها',
  consumable: 'معجون و مصرفی',
  weapon: 'سلاح و ادوات جنگی',
  quest: 'مأموریتی و کلید',
  treasure: 'گنجینه و جواهرات'
};

const EMPTY_FORM: Partial<ItemLibraryEntry> = {
  name: '',
  category: 'artifact',
  rarity: 'کمیاب',
  description: '',
  mechanicalEffect: '',
  secretNotes: '',
  whoItsFor: 'همه اعضای گروه',
  isRevealed: true
};

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
  const [statusMsg, setStatusMsg] = useState<string>('');

  const [formData, setFormData] = useState<Partial<ItemLibraryEntry>>(EMPTY_FORM);

  const handleStartCreate = () => {
    setFormData(EMPTY_FORM);
    setIsCreating(true);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onCreateItem(formData as Omit<ItemLibraryEntry, 'id' | 'updatedAt'>);
    setIsCreating(false);
  };

  const handleOpenGive = (item: ItemLibraryEntry) => {
    setGiveModalItem(item);
    setSelectedCharacterId(characters[0]?.id || '');
    setGiveSuccessMsg('');
  };

  const handleConfirmGive = () => {
    if (!giveModalItem || !selectedCharacterId) return;
    onGiveItemToPlayer(selectedCharacterId, giveModalItem);
    const char = characters.find(c => c.id === selectedCharacterId);
    setGiveSuccessMsg(`«${giveModalItem.name}» به کوله‌پشتی ${char?.name} اضافه شد.`);
    setTimeout(() => {
      setGiveModalItem(null);
      setGiveSuccessMsg('');
    }, 1500);
  };

  const toggleRevealed = (item: ItemLibraryEntry) => onUpdateItem({ ...item, isRevealed: !item.isRevealed });

  const handleDeleteItem = (item: ItemLibraryEntry) => {
    if (window.confirm(`«${item.name}» از گنجینه حذف شود؟`)) onDeleteItem(item.id);
  };

  const q = deferredSearch.toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.whoItsFor.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Giving a package to everyone is hard to undo: confirm first, report inline (no alert()).
  const handleDistributeAll = (reward: RewardPackage) => {
    if (!window.confirm(`بسته «${reward.title}» بین همه ماجراجویان توزیع شود؟`)) return;
    onDistributeReward(reward.id, characters.map(c => c.id));
    setStatusMsg(`بسته «${reward.title}» بین ${characters.length} ماجراجو توزیع شد.`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Sub tabs */}
      <ScrollableRow activeKey={subTab} className="gap-2 pb-1">
        <Button type="button" data-scroll-key="items" onClick={() => setSubTab('items')} className={pillCls(subTab === 'items')}>
          اشیاء و آرتیفکت‌ها ({items.length})
        </Button>
        <Button type="button" data-scroll-key="rewards" onClick={() => setSubTab('rewards')} className={pillCls(subTab === 'rewards')}>
          بسته‌های پاداش ({rewards.length})
        </Button>
      </ScrollableRow>

      {statusMsg && (
        <div role="status" className="p-3 rounded-lg bg-success/15 border border-success/30 text-success text-sm">
          {statusMsg}
        </div>
      )}

      {subTab === 'items' ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden />
              <Input noWrapper
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در اشیاء"
                aria-label="جستجو در اشیاء"
                className={`${inputCls} ps-10`}
              />
            </div>
            <Button type="button" onClick={handleStartCreate} className={`${primaryBtnCls} shrink-0`}>
              <Plus className="w-4 h-4 shrink-0" />
              <span>شیء جدید</span>
            </Button>
          </div>

          <ScrollableRow activeKey={selectedCat} className="items-center gap-2 pb-1">
            <Button type="button" data-scroll-key="all" onClick={() => setSelectedCat('all')} className={pillCls(selectedCat === 'all')}>
              همه ({items.length})
            </Button>
            {(Object.keys(CATEGORY_LABELS) as ItemLibraryCategory[]).map(cat => (
              <Button key={cat} type="button" data-scroll-key={cat} onClick={() => setSelectedCat(cat)} className={pillCls(selectedCat === cat)}>
                {CATEGORY_LABELS[cat]} ({items.filter(i => i.category === cat).length})
              </Button>
            ))}
          </ScrollableRow>

          {/* Create item */}
          <BottomSheet
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            title="شیء جدید"
            subtitle="مشخصات، کمیابی، خواص و مالک پیشنهادی"
          >
            <form onSubmit={handleSubmitItem} className="space-y-4">
              <Field label="نام شیء" required>
                <Input noWrapper type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثلاً: خنجر ایستایی زروان" className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="دسته‌بندی">
                  <Select noWrapper value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ItemLibraryCategory })}
                    className={inputCls}>
                    {(Object.keys(CATEGORY_LABELS) as ItemLibraryCategory[]).map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="کمیابی">
                  <Select noWrapper value={formData.rarity}
                    onChange={e => setFormData({ ...formData, rarity: e.target.value as any })}
                    className={inputCls}>
                    <option value="معمولی">معمولی</option>
                    <option value="کمیاب">کمیاب</option>
                    <option value="بسیار کمیاب">بسیار کمیاب</option>
                    <option value="افسانه‌ای">افسانه‌ای</option>
                    <option value="باستانی و ممنوعه">باستانی و ممنوعه</option>
                  </Select>
                </Field>
              </div>

              <Field label="شرح و ظاهر">
                <Textarea noWrapper rows={3} value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} className={textareaCls} />
              </Field>

              <Field label="اثر مکانیکی و قوانین">
                <Textarea noWrapper rows={3} value={formData.mechanicalEffect}
                  onChange={e => setFormData({ ...formData, mechanicalEffect: e.target.value })} className={textareaCls} />
              </Field>

              <Field label="مناسب برای" hint="نام بازیکن یا شخصیت.">
                <Input noWrapper type="text" value={formData.whoItsFor}
                  onChange={e => setFormData({ ...formData, whoItsFor: e.target.value })}
                  placeholder="سامان یا پردیس" className={inputCls} />
              </Field>

              <Field label="یادداشت محرمانه DM" hint="فقط شما می‌بینید.">
                <Input noWrapper type="text" value={formData.secretNotes}
                  onChange={e => setFormData({ ...formData, secretNotes: e.target.value })}
                  placeholder="عوارض جانبی یا رازی پشت پرده" className={inputCls} />
              </Field>

              <ToggleChip
                active={!!formData.isRevealed}
                onClick={() => setFormData({ ...formData, isRevealed: !formData.isRevealed })}
                className="w-full justify-start"
              >
                {formData.isRevealed ? <CheckSquare className="w-4 h-4" aria-hidden /> : <Square className="w-4 h-4" aria-hidden />}
                <span>در دانشنامه بازیکنان نمایش داده شود</span>
              </ToggleChip>

              <StickyFooter>
                <div className="flex gap-2">
                  <Button type="submit" className={`${primaryBtnCls} flex-1 sm:flex-none`}>ذخیره در گنجینه</Button>
                  <Button type="button" onClick={() => setIsCreating(false)} className={secondaryBtnCls}>انصراف</Button>
                </div>
              </StickyFooter>
            </form>
          </BottomSheet>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              {items.length === 0 ? 'گنجینه خالی است.' : 'شیئی با این جستجو پیدا نشد.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <article
                  key={item.id}
                  className="flex flex-col p-4 rounded-xl bg-surface border border-border hover:border-accent/40 transition content-visibility-card"
                >
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1.5">
                      <h4 className="text-base font-bold text-text-primary break-words">{item.name}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="accent">{item.rarity}</Badge>
                        {!item.isRevealed && <Badge icon={EyeOff}>مخفی از بازیکنان</Badge>}
                      </div>
                      <p className="text-xs text-text-muted">
                        {CATEGORY_LABELS[item.category]} · برای: {item.whoItsFor || 'نامشخص'}
                      </p>
                    </div>

                    <div className="flex -me-2 -mt-2 shrink-0">
                      <IconButton
                        label={item.isRevealed ? 'مخفی کردن از بازیکنان' : 'آشکار کردن برای بازیکنان'}
                        onClick={() => toggleRevealed(item)}
                      >
                        {item.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </IconButton>
                      <IconButton label="حذف شیء" danger onClick={() => handleDeleteItem(item)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </header>

                  <p className="mt-3 text-sm text-text-primary leading-relaxed">{item.description}</p>

                  {item.mechanicalEffect && (
                    <p className="mt-3 p-3 rounded-lg bg-surface-2 text-sm text-text-primary leading-relaxed">
                      <span className="font-medium text-accent-hover">اثر مکانیکی: </span>
                      {item.mechanicalEffect}
                    </p>
                  )}

                  {item.secretNotes && (
                    <p className="mt-3 p-3 rounded-lg border border-dashed border-border-strong text-sm text-text-primary leading-relaxed flex items-start gap-2">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5 text-text-muted" aria-hidden />
                      <span><span className="font-medium">فقط DM: </span>{item.secretNotes}</span>
                    </p>
                  )}

                  <Button type="button" onClick={() => handleOpenGive(item)} className={`${secondaryBtnCls} w-full mt-4`}>
                    <Gift className="w-4 h-4" />
                    اهدا به ماجراجو
                  </Button>
                </article>
              ))}
            </div>
          )}
        </>
      ) : rewards.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted">هنوز بسته پاداشی ساخته نشده است.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map(rew => (
            <article key={rew.id} className="flex flex-col p-4 rounded-xl bg-surface border border-border">
              <header className="flex items-start justify-between gap-2">
                <h4 className="text-base font-bold text-text-primary">{rew.title}</h4>
                <time className="text-xs text-text-muted tabular-nums shrink-0">
                  {new Date(rew.createdAt).toLocaleDateString('fa-IR-u-nu-latn')}
                </time>
              </header>
              <p className="mt-2 text-sm text-text-primary leading-relaxed">{rew.description}</p>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'طلا', value: rew.gold },
                  { label: 'نقره', value: rew.silver },
                  { label: 'امتیاز مهارت', value: rew.skillPoints }
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-surface-2 p-2">
                    <dd className="text-base font-bold text-text-primary tabular-nums">{s.value}</dd>
                    <dt className="text-xs text-text-muted">{s.label}</dt>
                  </div>
                ))}
              </dl>

              {rew.items?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-text-muted">اقلام همراه</p>
                  {rew.items.map((it, idx) => (
                    <div key={idx} className="text-sm text-text-primary flex items-center gap-2">
                      <Package className="w-4 h-4 text-accent shrink-0" aria-hidden />
                      <span>{it.name} (×{it.quantity})</span>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" onClick={() => handleDistributeAll(rew)} className={`${secondaryBtnCls} w-full mt-4`}>
                <Gift className="w-4 h-4" />
                توزیع بین همه اعضا
              </Button>
            </article>
          ))}
        </div>
      )}

      {/* Give to player */}
      <BottomSheet
        isOpen={!!giveModalItem}
        onClose={() => setGiveModalItem(null)}
        title={giveModalItem ? `اهدای «${giveModalItem.name}»` : 'اهدای شیء'}
        subtitle="مستقیم در کوله‌پشتی یا بخش سلاح‌های بازیکن قرار می‌گیرد"
      >
        {giveModalItem && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted leading-relaxed">
              شیء با نشان «جدید» در کوله‌پشتی می‌آید و اگر سلاح باشد، خودکار به تب مبارزه هم اضافه می‌شود.
            </p>

            {giveSuccessMsg ? (
              <div role="status" className="p-3 rounded-lg bg-success/15 border border-success/40 text-success text-sm text-center font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {giveSuccessMsg}
              </div>
            ) : (
              <>
                <Field label="بازیکن">
                  <Select noWrapper value={selectedCharacterId} onChange={e => setSelectedCharacterId(e.target.value)} className={inputCls}>
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.className})</option>
                    ))}
                  </Select>
                </Field>

                <StickyFooter>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleConfirmGive} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
                      تأیید و ارسال
                    </Button>
                    <Button type="button" onClick={() => setGiveModalItem(null)} className={secondaryBtnCls}>انصراف</Button>
                  </div>
                </StickyFooter>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};