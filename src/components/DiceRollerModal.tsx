import { Button } from './ui/Button';
import { Input } from './ui/Input';
import React, { useState, useEffect, memo } from 'react';
import { DiceRollResult, CampaignDiceRoll, User } from '../types';
import { rollDice, formatModifier } from '../utils/dice';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './mobile/BottomSheet';
import { VirtualList } from './common/VirtualList';
import { Dices, Flame, Skull, Table, Lock, Eye, RefreshCw, Sparkles, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { ScrollableRow } from './ui/ScrollableRow';

interface DiceRollCardRowProps {
  roll: CampaignDiceRoll;
}

const DiceRollCardRow = memo<DiceRollCardRowProps>(({ roll }) => {
  const isCrit = roll.details?.isCritical;
  const isFumble = roll.details?.isFumble;
  const dateStr = new Date(roll.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className={`p-3 rounded-2xl border transition-all content-visibility-card ${
        isCrit
          ? 'bg-accent/15 border-accent/50 shadow-md shadow-accent/20'
          : isFumble
          ? 'bg-danger/15 border-danger/50 shadow-md shadow-danger/20'
          : 'bg-surface border-border'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
        <div className="flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5 text-accent-hover" />
          <span className="font-bold text-text-primary">{roll.userName}</span>
          {roll.characterName && (
            <span className="text-xs text-text-muted">({roll.characterName})</span>
          )}
          {roll.visibility === 'dm_only' && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-danger/20 text-danger border border-danger/30 flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> مخفی
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted font-mono">{dateStr}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <div>
          <span className="text-xs text-accent-hover font-semibold block">{roll.rollType}</span>
          <span className="text-xs text-text-muted font-mono">{roll.diceExpression}</span>
        </div>

        <div className="flex items-center gap-2">
          {isCrit && (
            <span className="text-xs font-black text-accent-hover px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40">
              20 طبیعی!
            </span>
          )}
          {isFumble && (
            <span className="text-xs font-black text-danger-hover px-2 py-0.5 rounded-full bg-danger/20 border border-danger/40">
              1 طبیعی!
            </span>
          )}
          <span className={`text-2xl font-black font-mono ${
            isCrit ? 'text-accent-hover' : isFumble ? 'text-danger-hover' : 'text-text-primary'
          }`}>
            {roll.total}
          </span>
        </div>
      </div>
    </div>
  );
});
DiceRollCardRow.displayName = 'DiceRollCardRow';

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
      <div className="space-y-4 text-xs text-text-primary" dir="rtl">
        {/* Tab Switcher: کیسه تاس / میز بازی */}
        <ScrollableRow
          activeKey={activeTab}
          wrapperClassName="rounded-xl bg-bg border border-border p-1"
          className="gap-1"
        >
          <Button 
            type="button"
            data-key="bag"
            onClick={() => setActiveTab('bag')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'bag'
                ? 'bg-accent text-on-accent shadow-md font-black'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">کیسه تاس</span>
          </Button>
          <Button 
            type="button"
            data-key="table"
            onClick={() => {
              setActiveTab('table');
              fetchTableRolls();
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'table'
                ? 'bg-accent text-on-accent shadow-md font-black'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Table className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">میز بازی ({tableRolls.length})</span>
          </Button>
        </ScrollableRow>

        {activeTab === 'bag' ? (
          <>
            {/* Huge Result Display with Nat 20 Gold / Nat 1 Ember Glow */}
            {latestRoll && (
              <div
                className={`p-4 rounded-[14px] border transition-all text-center ${
                  latestRoll.isCritical
                    ? 'bg-accent/15 border-accent shadow-[0_0_25px_rgba(224,160,48,0.5)]'
                    : latestRoll.isFumble
                    ? 'bg-danger/20 border-danger shadow-[0_0_25px_rgba(194,81,43,0.5)]'
                    : 'bg-surface border-border'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted mb-1">
                  <span>{latestRoll.label}</span>
                  <span className="font-mono">{latestRoll.timestamp}</span>
                </div>

                <div className="flex items-baseline justify-center gap-3 my-2">
                  <span
                    className={`text-5xl font-extrabold font-mono ${
                      latestRoll.isCritical
                        ? 'text-accent-hover'
                        : latestRoll.isFumble
                        ? 'text-danger'
                        : 'text-text-primary'
                    }`}
                  >
                    {latestRoll.total}
                  </span>

                  {latestRoll.isCritical && (
                    <span className="px-2.5 py-1 text-xs font-black bg-accent/20 text-accent-hover border border-accent rounded-full flex items-center gap-1 animate-pulse">
                      <Flame className="w-3.5 h-3.5" /> بحرانی طبیعی! (20)
                    </span>
                  )}
                  {latestRoll.isFumble && (
                    <span className="px-2.5 py-1 text-xs font-black bg-danger/25 text-danger border border-danger rounded-full flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5" /> شکست فاجعه‌بار! (1)
                    </span>
                  )}
                </div>

                <div className="text-center text-xs text-text-muted flex items-center justify-center gap-2">
                  <span>تاس‌ها: [{latestRoll.rolls.join(' ، ')}]</span>
                  <span>•</span>
                  <span>مادیفایر: {formatModifier(latestRoll.modifier)}</span>
                  {latestRoll.advantage && (
                    <>
                      <span>•</span>
                      <span className="text-accent font-bold">
                        {latestRoll.advantage === 'adv' ? 'با مزیت' : 'با ضعف'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* d4–d100 Row */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">نوع تاس:</label>
              <ScrollableRow
                activeKey={selectedSides}
                wrapperClassName="w-full"
                className="gap-2"
              >
                {diceTypes.map(sides => (
                  <Button 
                    key={sides}
                    data-key={sides}
                    type="button"
                    onClick={() => setSelectedSides(sides)}
                    className={`min-h-[48px] min-w-[48px] py-2 px-2 rounded-[12px] font-mono font-extrabold text-sm transition border touch-target-lg active:scale-95 flex items-center justify-center whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                      selectedSides === sides
                        ? 'bg-accent text-on-accent border-accent shadow-glow-amber'
                        : 'bg-surface-2 text-text-primary border-border hover:border-accent/50'
                    }`}
                  >
                    d{sides}
                  </Button>
                ))}
              </ScrollableRow>
            </div>

            {/* Count & Modifier Steppers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">تعداد تاس:</label>
                <div className="flex items-center gap-1.5">
                  <Button 
                    type="button"
                    onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                    className="w-12 h-12 rounded-[12px] bg-surface-2 border border-border text-text-primary font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    -
                  </Button>
                  <span className="flex-1 text-center font-extrabold font-mono text-base bg-bg py-2 rounded-[12px] border border-border min-h-[48px] flex items-center justify-center">
                    {diceCount}
                  </span>
                  <Button 
                    type="button"
                    onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                    className="w-12 h-12 rounded-[12px] bg-surface-2 border border-border text-text-primary font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">مادیفایر:</label>
                <div className="flex items-center gap-1.5">
                  <Button 
                    type="button"
                    onClick={() => setModifier(modifier - 1)}
                    className="w-12 h-12 rounded-[12px] bg-surface-2 border border-border text-text-primary font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    -
                  </Button>
                  <span className="flex-1 text-center font-extrabold font-mono text-base bg-bg py-2 rounded-[12px] border border-border min-h-[48px] flex items-center justify-center">
                    {formatModifier(modifier)}
                  </span>
                  <Button 
                    type="button"
                    onClick={() => setModifier(modifier + 1)}
                    className="w-12 h-12 rounded-[12px] bg-surface-2 border border-border text-text-primary font-bold text-lg flex items-center justify-center min-h-[48px] active:scale-95"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Advantage Toggle */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">حالت پرتاب (مزیت / ضعف):</label>
              <ScrollableRow
                activeKey={advantage}
                wrapperClassName="w-full"
                className="gap-2"
              >
                {[
                  { id: 'none', label: 'عادی' },
                  { id: 'adv', label: 'با مزیت (Adv)' },
                  { id: 'dis', label: 'با ضعف (Dis)' },
                ].map(item => (
                  <Button 
                    key={item.id}
                    data-key={item.id}
                    type="button"
                    onClick={() => setAdvantage(item.id as any)}
                    className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition border min-h-[44px] whitespace-nowrap shrink-0 snap-start flex items-center justify-center ${
                      advantage === item.id
                        ? 'bg-accent text-on-accent border-accent'
                        : 'bg-surface-2 text-text-muted border-border'
                    }`}
                  >
                    <span className="whitespace-nowrap shrink-0">{item.label}</span>
                  </Button>
                ))}
              </ScrollableRow>
            </div>

            {/* Private Roll Toggle (Section 5) */}
            {(isDm || allowPlayerRollPrivate) && (
              <div className="p-3 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${isPrivateToDm ? 'text-accent-hover' : 'text-text-muted'}`} />
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      {isDm ? 'پرتاب محرمانه دانجن مستر' : 'ارسال محرمانه فقط برای دانجن مستر'}
                    </span>
                    <span className="text-xs text-text-muted">
                      این پرتاب برای سایر بازیکنان حاضر در میز پنهان می‌ماند
                    </span>
                  </div>
                </div>
                <Input noWrapper 
                  type="checkbox"
                  checked={isPrivateToDm}
                  onChange={e => setIsPrivateToDm(e.target.checked)}
                  className="w-5 h-5 accent-accent rounded cursor-pointer"
                 />
              </div>
            )}

            {/* Big Roll Button */}
            <Button 
              type="button"
              onClick={() => handleRoll()}
              className="w-full py-3.5 rounded-[12px] bg-accent hover:bg-accent-hover text-on-accent font-black text-sm flex items-center justify-center gap-2 shadow-lg min-h-[48px] active:scale-98 transition-colors"
            >
              <Dices className="w-5 h-5" />
              <span>پرتاب {diceCount}d{selectedSides} {modifier !== 0 ? formatModifier(modifier) : ''}</span>
            </Button>
          </>
        ) : (
          /* Table Tab: Shared Dice Feed (Last 50 rolls) */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary">
                پرتاب‌های زنده میز بازی (50 پرتاب اخیر)
              </span>
              <Button 
                onClick={fetchTableRolls}
                disabled={loadingTable}
                className="p-1.5 text-accent-hover hover:bg-accent/10 rounded-lg flex items-center gap-1 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTable ? 'animate-spin' : ''}`} />
                <span>بروزرسانی</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
              {tableRolls.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-2xl text-text-muted text-xs">
                  هنوز هیچ تاسی در این میز بازی پرتاب نشده است.
                </div>
              ) : tableRolls.length > 50 ? (
                <VirtualList
                  items={tableRolls}
                  itemHeight={88}
                  height={480}
                  keyExtractor={(r) => r.id}
                  renderItem={(roll) => (
                    <div className="pb-2">
                      <DiceRollCardRow roll={roll} />
                    </div>
                  )}
                />
              ) : (
                tableRolls.map(roll => (
                  <DiceRollCardRow key={roll.id} roll={roll} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
