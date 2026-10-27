import React, { useState, useEffect } from 'react';
import { DiceRollResult, CampaignDiceRoll, User } from '../types';
import { rollDice, formatModifier } from '../utils/dice';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './mobile/BottomSheet';
import { Dices, Flame, Skull, Table, Lock, Eye, RefreshCw, Sparkles, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetRoll?: { sides: number; count: number; modifier: number; label: string } | null;
  history: DiceRollResult[];
  campaignId?: string | null;
  currentUser?: User | null;
  allowPlayerRollPrivate?: boolean;
  onAddRoll: (result: DiceRollResult) => void;
  onNotifyResult?: (msg: string) => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  presetRoll,
  history,
  campaignId,
  currentUser,
  allowPlayerRollPrivate = true,
  onAddRoll,
  onNotifyResult
}) => {
  const [activeTab, setActiveTab] = useState<'bag' | 'table'>('bag');
  const [selectedSides, setSelectedSides] = useState<number>(presetRoll?.sides || 20);
  const [diceCount, setDiceCount] = useState<number>(presetRoll?.count || 1);
  const [modifier, setModifier] = useState<number>(presetRoll?.modifier || 0);
  const [advantage, setAdvantage] = useState<'none' | 'adv' | 'dis'>('none');
  const [customLabel, setCustomLabel] = useState<string>(presetRoll?.label || 'پرتاب آزاد');
  const [isPrivateToDm, setIsPrivateToDm] = useState<boolean>(false);
  const [latestRoll, setLatestRoll] = useState<DiceRollResult | null>(null);

  // Shared Table Rolls state
  const [tableRolls, setTableRolls] = useState<CampaignDiceRoll[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Sync if preset changes
  useEffect(() => {
    if (presetRoll) {
      setSelectedSides(presetRoll.sides);
      setDiceCount(presetRoll.count);
      setModifier(presetRoll.modifier);
      setCustomLabel(presetRoll.label);
      const res = rollDice(
        presetRoll.count,
        presetRoll.sides,
        presetRoll.modifier,
        undefined,
        presetRoll.label
      );
      setLatestRoll(res);
      onAddRoll(res);

      if (res.isCritical) triggerHaptic('crit');
      else if (res.isFumble) triggerHaptic('fumble');
      else triggerHaptic('roll');

      onNotifyResult?.(`نتیجه ${res.label}: ${res.total}`);

      // Post to shared table if campaignId is present
      if (campaignId) {
        api.postDiceRoll(campaignId, {
          label: res.label,
          formula: `${presetRoll.count}d${presetRoll.sides}${presetRoll.modifier ? formatModifier(presetRoll.modifier) : ''}`,
          mode: 'normal',
          results: res.rolls,
          modifier: res.modifier,
          total: res.total,
          nat20: res.isCritical,
          nat1: res.isFumble,
          visibility: isPrivateToDm ? 'dm_only' : 'table'
        }).then(fetchTableRolls).catch(() => {});
      }
    }
  }, [presetRoll]);

  // Load shared table rolls
  const fetchTableRolls = async () => {
    if (!campaignId) return;
    setLoadingTable(true);
    try {
      const rolls = await api.listDiceRolls(campaignId, undefined, 50);
      setTableRolls(rolls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchTableRolls();
      const unsub = api.liveChannel.subscribe(campaignId, (update) => {
        if (update.data?.type === 'dice_roll') {
          fetchTableRolls();
        }
      });
      return () => unsub();
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  const handleRoll = async (adv: 'none' | 'adv' | 'dis' = advantage) => {
    const res = rollDice(
      diceCount,
      selectedSides,
      modifier,
      adv === 'none' ? undefined : adv,
      customLabel || `پرتاب d${selectedSides}`
    );
    setLatestRoll(res);
    onAddRoll(res);

    if (res.isCritical) triggerHaptic('crit');
    else if (res.isFumble) triggerHaptic('fumble');
    else triggerHaptic('roll');

    onNotifyResult?.(`نتیجه ${res.label}: ${res.total}`);

    // Post to shared table feed
    if (campaignId) {
      try {
        await api.postDiceRoll(campaignId, {
          label: res.label,
          formula: `${diceCount}d${selectedSides}${modifier ? formatModifier(modifier) : ''}`,
          mode: adv === 'none' ? 'normal' : adv,
          results: res.rolls,
          modifier: res.modifier,
          total: res.total,
          nat20: res.isCritical,
          nat1: res.isFumble,
          visibility: isPrivateToDm ? 'dm_only' : 'table'
        });
        await fetchTableRolls();
      } catch (e) {
        console.error('Failed to post roll to campaign feed:', e);
      }
    }
  };

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];
  const isDm = currentUser?.role === 'dm';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="کیسه تاس و میز بازی"
      subtitle="پرتاب تاس‌های D&D 5e و فید مشترک میز بازی"
    >
      <div className="space-y-4 text-xs text-[#EDE6D8]" dir="rtl">
        {/* Tab Switcher: کیسه تاس / میز بازی */}
        <div className="flex rounded-xl bg-[#131110] border border-[#2F2A23] p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('bag')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === 'bag'
                ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>کیسه تاس</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('table');
              fetchTableRolls();
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center justify-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>میز بازی ({tableRolls.length})</span>
          </button>
        </div>

        {activeTab === 'bag' ? (
          <>
            {/* Huge Result Display with Nat 20 Gold / Nat 1 Ember Glow */}
            {latestRoll && (
              <div
                className={`p-4 rounded-[14px] border transition-all text-center ${
                  latestRoll.isCritical
                    ? 'bg-[#E0A030]/15 border-[#E0A030] shadow-[0_0_25px_rgba(224,160,48,0.5)]'
                    : latestRoll.isFumble
                    ? 'bg-[#C2512B]/20 border-[#C2512B] shadow-[0_0_25px_rgba(194,81,43,0.5)]'
                    : 'bg-[#171513] border-[#2F2A23]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#A39A89] mb-1">
                  <span>{latestRoll.label}</span>
                  <span className="font-mono">{latestRoll.timestamp}</span>
                </div>

                <div className="flex items-baseline justify-center gap-3 my-2">
                  <span
                    className={`text-5xl font-extrabold font-mono ${
                      latestRoll.isCritical
                        ? 'text-[#F2C265]'
                        : latestRoll.isFumble
                        ? 'text-[#C2512B]'
                        : 'text-[#EDE6D8]'
                    }`}
                  >
                    {latestRoll.total}
                  </span>

                  {latestRoll.isCritical && (
                    <span className="px-2.5 py-1 text-xs font-black bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030] rounded-full flex items-center gap-1 animate-pulse">
                      <Flame className="w-3.5 h-3.5" /> بحرانی طبیعی! (۲۰)
                    </span>
                  )}
                  {latestRoll.isFumble && (
                    <span className="px-2.5 py-1 text-xs font-black bg-[#C2512B]/25 text-[#C2512B] border border-[#C2512B] rounded-full flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5" /> شکست فاجعه‌بار! (۱)
                    </span>
                  )}
                </div>

                <div className="text-center text-[11px] text-[#A39A89] flex items-center justify-center gap-2">
                  <span>تاس‌ها: [{latestRoll.rolls.join(' ، ')}]</span>
                  <span>•</span>
                  <span>مادیفایر: {formatModifier(latestRoll.modifier)}</span>
                  {latestRoll.advantage && (
                    <>
                      <span>•</span>
                      <span className="text-[#E0A030] font-bold">
                        {latestRoll.advantage === 'adv' ? 'با مزیت' : 'با ضعف'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* d4–d100 Row */}
            <div>
              <label className="block text-xs font-bold text-[#A39A89] mb-1.5">نوع تاس:</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {diceTypes.map(sides => (
                  <button
                    key={sides}
                    type="button"
                    onClick={() => setSelectedSides(sides)}
                    className={`min-h-[48px] min-w-[48px] py-2 px-1 rounded-[12px] font-mono font-extrabold text-sm transition border touch-target-lg active:scale-95 flex items-center justify-center ${
                      selectedSides === sides
                        ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030] shadow-[0_0_12px_rgba(224,160,48,0.4)]'
                        : 'bg-[#201D19] text-[#EDE6D8] border-[#2F2A23] hover:border-[#E0A030]/50'
                    }`}
                  >
                    d{sides}
                  </button>
                ))}
              </div>
            </div>

            {/* Count & Modifier Steppers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#A39A89] mb-1">تعداد تاس:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                    className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-extrabold font-mono text-base bg-[#0E0D0C] py-2 rounded-[12px] border border-[#2F2A23] min-h-[48px] flex items-center justify-center">
                    {diceCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                    className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A39A89] mb-1">مادیفایر:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModifier(modifier - 1)}
                    className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-extrabold font-mono text-base bg-[#0E0D0C] py-2 rounded-[12px] border border-[#2F2A23] min-h-[48px] flex items-center justify-center">
                    {formatModifier(modifier)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModifier(modifier + 1)}
                    className="w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Advantage Toggle */}
            <div>
              <label className="block text-xs font-bold text-[#A39A89] mb-1">حالت پرتاب (مزیت / ضعف):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'عادی' },
                  { id: 'adv', label: 'با مزیت (Adv)' },
                  { id: 'dis', label: 'با ضعف (Dis)' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdvantage(item.id as any)}
                    className={`py-2 px-1 rounded-[10px] text-xs font-bold transition border min-h-[44px] ${
                      advantage === item.id
                        ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]'
                        : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Private Roll Toggle (Section 5) */}
            {(isDm || allowPlayerRollPrivate) && (
              <div className="p-3 rounded-xl bg-[#131110] border border-[#2F2A23] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${isPrivateToDm ? 'text-[#F2C265]' : 'text-[#8A8374]'}`} />
                  <div>
                    <span className="text-xs font-bold text-[#EDE6D8] block">
                      {isDm ? 'پرتاب محرمانه دانجن مستر' : 'ارسال محرمانه فقط برای دانجن مستر'}
                    </span>
                    <span className="text-[10px] text-[#A39A89]">
                      این پرتاب برای سایر بازیکنان حاضر در میز پنهان می‌ماند
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateToDm}
                  onChange={e => setIsPrivateToDm(e.target.checked)}
                  className="w-5 h-5 accent-[#E0A030] rounded cursor-pointer"
                />
              </div>
            )}

            {/* Big Roll Button */}
            <button
              type="button"
              onClick={() => handleRoll()}
              className="w-full py-3.5 rounded-[12px] bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-black text-sm flex items-center justify-center gap-2 shadow-lg min-h-[48px] active:scale-98 transition-colors"
            >
              <Dices className="w-5 h-5" />
              <span>پرتاب {diceCount}d{selectedSides} {modifier !== 0 ? formatModifier(modifier) : ''}</span>
            </button>
          </>
        ) : (
          /* Table Tab: Shared Dice Feed (Last 50 rolls) */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C9C0AE]">
                پرتاب‌های زنده میز بازی (۵۰ پرتاب اخیر)
              </span>
              <button
                onClick={fetchTableRolls}
                disabled={loadingTable}
                className="p-1.5 text-[#F2C265] hover:bg-[#E0A030]/10 rounded-lg flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTable ? 'animate-spin' : ''}`} />
                <span>بروزرسانی</span>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {tableRolls.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#2F2A23] rounded-2xl text-[#8A8374] text-xs">
                  هنوز هیچ تاسی در این میز بازی پرتاب نشده است.
                </div>
              ) : (
                tableRolls.map(roll => {
                  const isCrit = roll.details?.isCritical;
                  const isFumble = roll.details?.isFumble;
                  const dateStr = new Date(roll.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={roll.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCrit
                          ? 'bg-[#E0A030]/15 border-[#E0A030]/50 shadow-md shadow-[#E0A030]/20'
                          : isFumble
                          ? 'bg-[#C2512B]/15 border-[#C2512B]/50 shadow-md shadow-[#C2512B]/20'
                          : 'bg-[#171513] border-[#2F2A23]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-[#F2C265]" />
                          <span className="font-bold text-[#EDE6D8]">{roll.userName}</span>
                          {roll.characterName && (
                            <span className="text-[10px] text-[#A39A89]">({roll.characterName})</span>
                          )}
                          {roll.visibility === 'dm_only' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C2512B]/20 text-[#E8836B] border border-[#C2512B]/30 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> مخفی
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8A8374] font-mono">{dateStr}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-xs text-[#F2C265] font-semibold block">{roll.rollType}</span>
                          <span className="text-[10px] text-[#A39A89] font-mono">{roll.diceExpression}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCrit && (
                            <span className="text-[10px] font-black text-[#F2C265] px-2 py-0.5 rounded-full bg-[#E0A030]/20 border border-[#E0A030]/40">
                              ۲۰ طبیعی!
                            </span>
                          )}
                          {isFumble && (
                            <span className="text-[10px] font-black text-[#D66138] px-2 py-0.5 rounded-full bg-[#C2512B]/20 border border-[#C2512B]/40">
                              ۱ طبیعی!
                            </span>
                          )}
                          <span className={`text-2xl font-black font-mono ${
                            isCrit ? 'text-[#F2C265]' : isFumble ? 'text-[#D66138]' : 'text-[#EDE6D8]'
                          }`}>
                            {roll.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
