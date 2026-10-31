import React, { useState, useEffect } from 'react';
import {
  PartyItem,
  PartyCurrency,
  TreasuryLogEntry,
  Character,
  InventoryItem,
  CampaignRole,
  CampaignSettings
} from '../../types';
import { api } from '../../services/api';
import { canUserManageTreasury } from '../../../shared/rules/treasuryEngine';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  Coins,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  Plus,
  History,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Edit2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface PartyTreasuryManagerProps {
  campaignId: string;
  userRole?: CampaignRole | boolean | 'dm' | null;
  activeCharacter?: Character | null;
  activeParticipationId?: string | null;
  campaignSettings?: CampaignSettings | null;
  onUpdateCharacterInventory?: (newInventory: InventoryItem[]) => void;
}

export const PartyTreasuryManager: React.FC<PartyTreasuryManagerProps> = ({
  campaignId,
  userRole,
  activeCharacter,
  activeParticipationId,
  campaignSettings,
  onUpdateCharacterInventory
}) => {
  const [items, setItems] = useState<PartyItem[]>([]);
  const [currency, setCurrency] = useState<PartyCurrency>({
    campaignId,
    balances: { gold: 0, silver: 0, copper: 0 },
    revision: 1
  });
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [concurrencyError, setConcurrencyError] = useState<string | null>(null);

  const permissions = canUserManageTreasury(userRole, { ...campaignSettings, treasuryLocked: isLocked } as any);
  const isDm = typeof userRole === 'boolean'
    ? userRole
    : (userRole === 'owner' || userRole === 'co_dm' || userRole === 'dm');

  // Modals
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemCategory, setNewItemCategory] = useState('misc');
  const [newItemDesc, setNewItemDesc] = useState('');

  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean;
    item: PartyItem | null;
    quantity: number;
    submitting: boolean;
  }>({
    isOpen: false,
    item: null,
    quantity: 1,
    submitting: false
  });

  const [depositModal, setDepositModal] = useState<{
    isOpen: boolean;
    charItem: InventoryItem | null;
    quantity: number;
    submitting: boolean;
  }>({
    isOpen: false,
    charItem: null,
    quantity: 1,
    submitting: false
  });

  const [currencyModal, setCurrencyModal] = useState(false);
  const [tempBalances, setTempBalances] = useState<Record<string, number>>({});
  const [currencyNote, setCurrencyNote] = useState('');

  const [logsModal, setLogsModal] = useState<{
    isOpen: boolean;
    logs: TreasuryLogEntry[];
    loading: boolean;
  }>({
    isOpen: false,
    logs: [],
    loading: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConcurrencyError(null);
      const res = await api.getPartyTreasury(campaignId);
      setItems(res.items);
      setCurrency(res.currency);
      setIsLocked(res.locked);
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت اطلاعات خزانه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  // Handle Add Item to Stash
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const created = await api.addPartyItem(campaignId, {
        name: newItemName.trim(),
        quantity: Math.max(1, newItemQuantity),
        category: newItemCategory,
        description: newItemDesc.trim(),
        notes: ''
      });
      setItems(prev => [created, ...prev]);
      setAddItemModal(false);
      setNewItemName('');
      setNewItemQuantity(1);
      setNewItemDesc('');
    } catch (err: any) {
      if (err?.message?.includes('همزمانی')) {
        setConcurrencyError(err.message);
      } else {
        alert(err?.message || 'خطا در ثبت آیتم جدید');
      }
    }
  };

  // Withdraw item from treasury into character sheet
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawModal.item || !activeParticipationId) {
      alert('کاراکتر یا مشارکت فعالی انتخاب نشده است.');
      return;
    }

    try {
      setWithdrawModal(prev => ({ ...prev, submitting: true }));
      const res = await api.transferPartyItem(campaignId, {
        itemId: withdrawModal.item.id,
        quantity: withdrawModal.quantity,
        direction: 'to_inventory',
        participationId: activeParticipationId,
        currentRevision: withdrawModal.item.revision
      });

      // Update local party items list
      if (res.partyItem) {
        setItems(prev => prev.map(i => i.id === res.partyItem!.id ? res.partyItem! : i));
      } else {
        // Removed completely
        setItems(prev => prev.filter(i => i.id !== withdrawModal.item!.id));
      }

      if (onUpdateCharacterInventory) {
        onUpdateCharacterInventory(res.characterInventory);
      }

      setWithdrawModal({ isOpen: false, item: null, quantity: 1, submitting: false });
    } catch (err: any) {
      setWithdrawModal(prev => ({ ...prev, submitting: false }));
      if (err?.message?.includes('همزمانی')) {
        setConcurrencyError(err.message);
        setWithdrawModal({ isOpen: false, item: null, quantity: 1, submitting: false });
        // Reload fresh state to avoid stale UI
        loadData();
      } else {
        alert(err?.message || 'خطا در برداشت آیتم از خزانه');
      }
    }
  };

  // Deposit item from character sheet into treasury
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModal.charItem || !activeParticipationId) return;

    try {
      setDepositModal(prev => ({ ...prev, submitting: true }));
      const res = await api.transferPartyItem(campaignId, {
        itemId: depositModal.charItem.id,
        itemName: depositModal.charItem.name,
        itemCategory: depositModal.charItem.category,
        itemDescription: depositModal.charItem.description,
        quantity: depositModal.quantity,
        direction: 'to_treasury',
        participationId: activeParticipationId
      });

      if (res.partyItem) {
        setItems(prev => {
          const idx = prev.findIndex(i => i.id === res.partyItem!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.partyItem!;
            return next;
          }
          return [res.partyItem!, ...prev];
        });
      }

      if (onUpdateCharacterInventory) {
        onUpdateCharacterInventory(res.characterInventory);
      }

      setDepositModal({ isOpen: false, charItem: null, quantity: 1, submitting: false });
    } catch (err: any) {
      setDepositModal(prev => ({ ...prev, submitting: false }));
      if (err?.message?.includes('همزمانی')) {
        setConcurrencyError(err.message);
        setDepositModal({ isOpen: false, charItem: null, quantity: 1, submitting: false });
        loadData();
      } else {
        alert(err?.message || 'خطا در واریز به خزانه');
      }
    }
  };

  // Remove item from treasury directly
  const handleDeleteItem = async (item: PartyItem) => {
    if (!confirm(`آیا از حذف «${item.name}» از خزانه اطمینان دارید؟`)) return;
    try {
      await api.removePartyItem(campaignId, item.id, item.revision);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err: any) {
      if (err?.message?.includes('همزمانی')) {
        setConcurrencyError(err.message);
        loadData();
      } else {
        alert(err?.message || 'خطا در حذف آیتم');
      }
    }
  };

  // Currency Update
  const handleOpenCurrencyModal = () => {
    setTempBalances({ ...currency.balances });
    setCurrencyNote('');
    setCurrencyModal(true);
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updatePartyCurrency(campaignId, tempBalances, currency.revision, currencyNote);
      setCurrency(updated);
      setCurrencyModal(false);
    } catch (err: any) {
      if (err?.message?.includes('همزمانی')) {
        setConcurrencyError(err.message);
        setCurrencyModal(false);
        loadData();
      } else {
        alert(err?.message || 'خطا در ثبت سکه‌ها');
      }
    }
  };

  const handleOpenLogs = async () => {
    try {
      setLogsModal({ isOpen: true, logs: [], loading: true });
      const logs = await api.listTreasuryLogs(campaignId, 40);
      setLogsModal({ isOpen: true, logs, loading: false });
    } catch {
      setLogsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getCurrencyLabel = (key: string) => {
    switch (key.toLowerCase()) {
      case 'gold': case 'gp': return 'طلا (GP)';
      case 'silver': case 'sp': return 'نقره (SP)';
      case 'copper': case 'cp': return 'مس (CP)';
      case 'electrum': case 'ep': return 'الکتروم (EP)';
      case 'platinum': case 'pp': return 'پلاتین (PP)';
      default: return key;
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Treasury Header */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#E0A030]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#EDE6D8]">خزانه مشترک گروه</h3>
              {isLocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>قفل شده</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  <span>آزاد برای اعضا</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#A39A89]">
              صندوق غنائم، سکه‌ها و آذوقه اشتراکی تمام هم‌سفران با ثبت شفاف تاریخچه رویدادها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="بازخوانی خزانه"
            className="p-2 rounded-lg bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenLogs}
            className="px-3 py-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#EDE6D8] hover:bg-[#2B2620] flex items-center gap-1.5 transition"
          >
            <History className="w-3.5 h-3.5 text-[#E0A030]" />
            <span>گزارش فعالیت‌ها</span>
          </button>

          {permissions.canModify && (
            <button
              type="button"
              onClick={() => setAddItemModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آیتم به خزانه</span>
            </button>
          )}
        </div>
      </div>

      {/* Concurrency Collision Banner */}
      {concurrencyError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm text-amber-200">تداخل همزمانی در خزانه</p>
              <p className="mt-0.5 leading-relaxed">{concurrencyError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs shrink-0 hover:bg-amber-400 transition"
          >
            بازخوانی داده‌ها
          </button>
        </div>
      )}

      {/* Locked Notice for players */}
      {isLocked && !isDm && (
        <div className="p-3.5 rounded-xl bg-[#201D19] border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-red-400 shrink-0" />
          <span>خزانه گروه توسط دانجن‌مستر قفل شده است. دسترسی شما در وضعیت فقط-خواندنی قرار دارد.</span>
        </div>
      )}

      {/* Currency Section Cards */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] card-gold-top space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#F2C265]" />
            <h4 className="font-extrabold text-sm text-[#EDE6D8]">موجودی سکه‌های اشتراکی</h4>
          </div>

          {permissions.canModify && (
            <button
              type="button"
              onClick={handleOpenCurrencyModal}
              className="px-2.5 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#F2C265] hover:bg-[#2B2620] flex items-center gap-1 transition"
            >
              <Edit2 className="w-3 h-3" />
              <span>ویرایش موجودی</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(currency.balances).length === 0 ? (
            <div className="col-span-full text-xs text-[#A39A89] py-2 text-center">
              هنوز سکه‌ای در خزانه ثبت نشده است.
            </div>
          ) : (
            Object.entries(currency.balances).map(([currKey, amount]) => (
              <div
                key={currKey}
                className="p-3 rounded-xl bg-[#1A1815] border border-[#2F2A23] flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] text-[#A39A89] block">{getCurrencyLabel(currKey)}</span>
                  <span className="text-base font-black text-[#EDE6D8]">{amount.toLocaleString('fa-IR')}</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#201D19] border border-[#2F2A23] flex items-center justify-center text-[#E0A030] text-xs font-black">
                  {currKey.slice(0, 2).toUpperCase()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared Stash Items */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#E0A030]" />
            <h4 className="font-extrabold text-sm text-[#EDE6D8]">
              لوازم و غنائم اشتراکی ({items.length} مورد)
            </h4>
          </div>

          {activeCharacter && permissions.canModify && (
            <div className="text-xs text-[#A39A89]">
              شخصیت فعال: <strong className="text-[#EDE6D8]">{activeCharacter.name}</strong>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A39A89] space-y-1">
            <Package className="w-8 h-8 mx-auto opacity-30 text-[#A39A89]" />
            <p className="font-bold text-[#EDE6D8]">خزانه در حال حاضر خالی است</p>
            <p>می‌توانید غنائم ماجراجویی را در این بخش قرار دهید تا همه به آن دسترسی داشته باشند.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2F2A23]/60">
            {items.map(item => (
              <div
                key={item.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#EDE6D8]">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1A1815] border border-[#2F2A23] text-[10px] font-bold text-[#F2C265]">
                      تعداد: {item.quantity}
                    </span>
                    <span className="text-[10px] text-[#A39A89] bg-[#201D19] px-1.5 py-0.5 rounded">
                      نسخه: {item.revision}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-[#A39A89] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Player or DM can take item into their character backpack */}
                  {activeCharacter && permissions.canModify && (
                    <button
                      type="button"
                      onClick={() => setWithdrawModal({
                        isOpen: true,
                        item,
                        quantity: 1,
                        submitting: false
                      })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#201D19] border border-[#2F2A23] text-emerald-400 font-bold hover:bg-[#2B2620] flex items-center gap-1 transition"
                      title="برداشتن به کوله‌پشتی کاراکتر"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>برداشتن به کوله</span>
                    </button>
                  )}

                  {permissions.canModify && isDm && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                      title="حذف از خزانه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit from Character Backpack Section (if active character has inventory) */}
      {activeCharacter && permissions.canModify && (
        <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-sm text-[#EDE6D8]">
                واریز آیتم از کوله‌پشتی {activeCharacter.name} به خزانه
              </h4>
            </div>
          </div>

          {activeCharacter.inventory && activeCharacter.inventory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {activeCharacter.inventory.map(ci => (
                <div
                  key={ci.id}
                  className="p-2.5 rounded-xl bg-[#1A1815] border border-[#2F2A23] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate">
                    <p className="font-bold text-[#EDE6D8] truncate">{ci.name}</p>
                    <p className="text-[10px] text-[#A39A89]">موجودی: {ci.quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDepositModal({
                      isOpen: true,
                      charItem: ci,
                      quantity: 1,
                      submitting: false
                    })}
                    className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#F2C265] hover:bg-[#2B2620] shrink-0"
                  >
                    واریز به خزانه
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A39A89]">کوله‌پشتی کاراکتر خالی است.</p>
          )}
        </div>
      )}

      {/* Add Item BottomSheet */}
      <BottomSheet
        isOpen={addItemModal}
        onClose={() => setAddItemModal(false)}
        title="افزودن آیتم جدید به خزانه مشترک"
      >
        <form onSubmit={handleAddItem} className="p-4 space-y-3.5" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">نام آیتم</label>
            <input
              type="text"
              placeholder="مثلاً: مشعل، طناب ابریشمی، معجون شفا"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">تعداد</label>
              <input
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={e => setNewItemQuantity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">دسته‌بندی</label>
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
              >
                <option value="misc">لوازم عمومی</option>
                <option value="potion">معجون و کیمیاگری</option>
                <option value="scroll">طومار و جادو</option>
                <option value="weapon">سلاح و ابزار رزم</option>
                <option value="armor">زره و سپر</option>
                <option value="quest">کلید و مأموریت</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">توضیحات و ویژگی‌ها</label>
            <textarea
              placeholder="توضیح کوتاه درباره خواص یا منشأ آیتم..."
              value={newItemDesc}
              onChange={e => setNewItemDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddItemModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89]"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs shadow-sm"
            >
              افزودن به خزانه
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Withdraw Modal */}
      <BottomSheet
        isOpen={withdrawModal.isOpen}
        onClose={() => setWithdrawModal(prev => ({ ...prev, isOpen: false }))}
        title={`برداشتن: ${withdrawModal.item?.name || ''}`}
      >
        <form onSubmit={handleWithdraw} className="p-4 space-y-4" dir="rtl">
          <div>
            <p className="text-xs text-[#A39A89] mb-2 leading-relaxed">
              این آیتم از خزانه اشتراکی کسر شده و مستقیماً وارد کوله‌پشتی کاراکتر <strong>{activeCharacter?.name}</strong> خواهد شد.
            </p>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">
              تعداد برداشت (حداکثر موجود: {withdrawModal.item?.quantity || 1})
            </label>
            <input
              type="number"
              min="1"
              max={withdrawModal.item?.quantity || 1}
              value={withdrawModal.quantity}
              onChange={e => setWithdrawModal(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-sm text-center font-black text-[#EDE6D8]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setWithdrawModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={withdrawModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-sm"
            >
              {withdrawModal.submitting ? 'در حال انتقال...' : 'تأیید و برداشتن'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Deposit Modal */}
      <BottomSheet
        isOpen={depositModal.isOpen}
        onClose={() => setDepositModal(prev => ({ ...prev, isOpen: false }))}
        title={`واریز به خزانه: ${depositModal.charItem?.name || ''}`}
      >
        <form onSubmit={handleDeposit} className="p-4 space-y-4" dir="rtl">
          <div>
            <p className="text-xs text-[#A39A89] mb-2 leading-relaxed">
              این آیتم از کوله‌پشتی کاراکتر شما کسر شده و برای استفاده تمام هم‌سفران در خزانه گروه قرار می‌گیرد.
            </p>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">
              تعداد واریز (موجودی در کوله‌پشتی: {depositModal.charItem?.quantity || 1})
            </label>
            <input
              type="number"
              min="1"
              max={depositModal.charItem?.quantity || 1}
              value={depositModal.quantity}
              onChange={e => setDepositModal(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-sm text-center font-black text-[#EDE6D8]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDepositModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={depositModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs shadow-sm"
            >
              {depositModal.submitting ? 'در حال واریز...' : 'تأیید و واریز به خزانه'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Currency Editor Modal */}
      <BottomSheet
        isOpen={currencyModal}
        onClose={() => setCurrencyModal(false)}
        title="ویرایش موجودی سکه‌های خزانه"
      >
        <form onSubmit={handleSaveCurrency} className="p-4 space-y-4" dir="rtl">
          <div className="space-y-3">
            {['gold', 'silver', 'copper', 'platinum'].map(k => (
              <div key={k} className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-[#EDE6D8]">{getCurrencyLabel(k)}</label>
                <input
                  type="number"
                  min="0"
                  value={tempBalances[k] ?? 0}
                  onChange={e => setTempBalances(prev => ({ ...prev, [k]: Math.max(0, Number(e.target.value)) }))}
                  className="w-32 px-3 py-1.5 rounded-lg bg-[#1A1815] border border-[#2F2A23] text-center font-bold text-xs text-[#EDE6D8]"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1">یادداشت ثبت رویداد</label>
            <input
              type="text"
              placeholder="مثلاً: پاداش انجام مأموریت نجات کاروان"
              value={currencyNote}
              onChange={e => setCurrencyNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCurrencyModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89]"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs shadow-sm"
            >
              ذخیره موجودی
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Activity Logs BottomSheet */}
      <BottomSheet
        isOpen={logsModal.isOpen}
        onClose={() => setLogsModal(prev => ({ ...prev, isOpen: false }))}
        title="دفتر ثبت رویدادها و گردش خزانه"
      >
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto" dir="rtl">
          {logsModal.loading ? (
            <div className="text-center py-6 text-xs text-[#A39A89]">در حال بارگذاری گزارش...</div>
          ) : logsModal.logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#A39A89]">هنوز گردشی در خزانه ثبت نشده است.</div>
          ) : (
            logsModal.logs.map(log => {
              const isOut = log.type === 'transfer_out' || log.type === 'remove';
              const isIn = log.type === 'transfer_in' || log.type === 'add';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#1A1815] border border-[#2F2A23] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-[#EDE6D8] leading-relaxed">{log.note || log.itemRef}</p>
                    <p className="text-[11px] text-[#A39A89]">
                      عامل: {log.actorName || 'کاربر سیستم'} • {new Date(log.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      isIn
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isOut
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-[#2F2A23] text-[#EDE6D8]/80'
                    }`}
                  >
                    {log.type === 'transfer_in'
                      ? 'واریز'
                      : log.type === 'transfer_out'
                      ? 'برداشت'
                      : log.type === 'currency'
                      ? 'سکه'
                      : log.type === 'add'
                      ? 'افزودن'
                      : 'حذف'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
