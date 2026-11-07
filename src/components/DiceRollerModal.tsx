import { Button } from './ui/Button';
import { Input } from './ui/Input';
import React, { useState, useEffect, memo } from 'react';
import { DiceRollResult, CampaignDiceRoll, User } from '../types';
import { rollDice, formatModifier } from '../utils/dice';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from './mobile/BottomSheet';
import { VirtualList } from './common/VirtualList';
import { Dices, Flame, Skull, Table, Lock, RefreshCw, User as UserIcon, Minus, Plus } from 'lucide-react';
import { api } from '../services/api';
import { Field, Badge, IconButton, StickyFooter, inputCls, primaryBtnCls } from './ui/FormLayout';

interface DiceRollCardRowProps {
  roll: CampaignDiceRoll;
}

const DiceRollCardRow = memo<DiceRollCardRowProps>(({ roll }) => {
  const isCrit = roll.details?.isCritical;
  const isFumble = roll.details?.isFumble;
  const dateStr = new Date(roll.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`p-3 rounded-xl border content-visibility-card ${
        isCrit ? 'bg-accent/10 border-accent/50' : isFumble ? 'bg-danger/10 border-danger/50' : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <UserIcon className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
          <span className="text-sm font-bold text-text-primary">{roll.userName}</span>
          {roll.characterName && <span className="text-xs text-text-muted">({roll.characterName})</span>}
          {roll.visibility === 'dm_only' && <Badge tone="danger" icon={Lock}>مخفی</Badge>}
        </div>
        <time className="text-xs text-text-muted font-mono shrink-0">{dateStr}</time>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{roll.rollType}</p>
          <p dir="ltr" className="text-xs text-text-muted font-mono text-start">{roll.diceExpression}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCrit && <Badge tone="accent">۲۰ طبیعی</Badge>}
          {isFumble && <Badge tone="danger">۱ طبیعی</Badge>}
          <span className={`text-2xl font-bold font-mono tabular-nums ${isCrit ? 'text-accent-hover' : isFumble ? 'text-danger' : 'text-text-primary'}`}>
            {roll.total}
          </span>
        </div>
      </div>
    </div>
  );
});
DiceRollCardRow.displayName = 'DiceRollCardRow';

/** − value + control with real 48px buttons and labels for assistive tech. */
const Stepper: React.FC<{ label: string; display: string; onDec: () => void; onInc: () => void }> = ({
  label, display, onDec, onInc
}) => (
  <Field label={label} group>
    <div className="flex items-center gap-2">
      <Button type="button" onClick={onDec} aria-label={`کم کردن ${label}`}
        className="min-h-[48px] min-w-[48px] rounded-lg bg-surface-2 border border-border text-text-primary inline-flex items-center justify-center active:scale-95">
        <Minus className="w-4 h-4" />
      </Button>
      <output className="flex-1 min-h-[48px] rounded-lg bg-bg border border-border flex items-center justify-center font-mono font-bold text-base tabular-nums dice-ltr">
        {display}
      </output>
      <Button type="button" onClick={onInc} aria-label={`زیاد کردن ${label}`}
        className="min-h-[48px] min-w-[48px] rounded-lg bg-surface-2 border border-border text-text-primary inline-flex items-center justify-center active:scale-95">
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  </Field>
);

const segCls = (active: boolean) =>
  `min-h-[44px] px-3 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-1.5 ${
    active ? 'bg-accent/15 text-accent-hover border-accent' : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
  }`;

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

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const ADVANTAGE_OPTIONS: Array<{ id: 'none' | 'adv' | 'dis'; label: string }> = [
  { id: 'none', label: 'عادی' },
  { id: 'adv', label: 'مزیت' },
  { id: 'dis', label: 'ضعف' }
];

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
  const [customLabel, setCustomLabel] = useState<string>(presetRoll?.label || '');
  const [isPrivateToDm, setIsPrivateToDm] = useState<boolean>(false);
  const [latestRoll, setLatestRoll] = useState<DiceRollResult | null>(null);
  const [shareError, setShareError] = useState(false);

  const [tableRolls, setTableRolls] = useState<CampaignDiceRoll[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const fetchTableRolls = async () => {
    if (!campaignId) return;
    setLoadingTable(true);
    try {
      setTableRolls(await api.listDiceRolls(campaignId, undefined, 50));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  };

  /** One code path for both the preset roll and the manual roll (they used to be duplicated). */
  const performRoll = async (opts: {
    count: number;
    sides: number;
    mod: number;
    adv?: 'adv' | 'dis';
    label: string;
  }) => {
    const res = rollDice(opts.count, opts.sides, opts.mod, opts.adv, opts.label);
    setLatestRoll(res);
    onAddRoll(res);

    if (res.isCritical) triggerHaptic('crit');
    else if (res.isFumble) triggerHaptic('fumble');
    else triggerHaptic('roll');

    onNotifyResult?.(`نتیجه ${res.label}: ${res.total}`);

    if (campaignId) {
      setShareError(false);
      try {
        await api.postDiceRoll(campaignId, {
          label: res.label,
          formula: `${opts.count}d${opts.sides}${opts.mod ? formatModifier(opts.mod) : ''}`,
          mode: opts.adv ?? 'normal',
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
        setShareError(true);
      }
    }
  };

  // Preset rolls (e.g. from a character sheet) roll immediately
  useEffect(() => {
    if (!presetRoll) return;
    setSelectedSides(presetRoll.sides);
    setDiceCount(presetRoll.count);
    setModifier(presetRoll.modifier);
    setCustomLabel(presetRoll.label);
    performRoll({ count: presetRoll.count, sides: presetRoll.sides, mod: presetRoll.modifier, label: presetRoll.label });
  }, [presetRoll]);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchTableRolls();
      const unsub = api.liveChannel.subscribe(campaignId, (update) => {
        if (update.data?.type === 'dice_roll') fetchTableRolls();
      });
      return () => unsub();
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  const handleRoll = () =>
    performRoll({
      count: diceCount,
      sides: selectedSides,
      mod: modifier,
      adv: advantage === 'none' ? undefined : advantage,
      label: customLabel.trim() || `پرتاب d${selectedSides}`
    });

  const isDm = currentUser?.role === 'dm';
  const canPrivate = isDm || allowPlayerRollPrivate;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="کیسه تاس و میز بازی" subtitle="پرتاب تاس و فید مشترک میز">
      <div className="space-y-5 text-start" dir="rtl">
        {/* Tabs (two items: no scrolling row needed) */}
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="بخش‌ها">
          <Button type="button" role="tab" aria-selected={activeTab === 'bag'} onClick={() => setActiveTab('bag')} className={segCls(activeTab === 'bag')}>
            <Dices className="w-4 h-4 shrink-0" aria-hidden />
            <span>کیسه تاس</span>
          </Button>
          <Button type="button" role="tab" aria-selected={activeTab === 'table'}
            onClick={() => { setActiveTab('table'); fetchTableRolls(); }} className={segCls(activeTab === 'table')}>
            <Table className="w-4 h-4 shrink-0" aria-hidden />
            <span>میز بازی ({tableRolls.length})</span>
          </Button>
        </div>

        {activeTab === 'bag' ? (
          <>
            {/* Result: the one thing that glows is the thing that matters (crit / fumble) */}
            <div role="status" aria-live="polite">
              {latestRoll && (
                <div
                  className={`p-4 rounded-xl border text-center ${
                    latestRoll.isCritical
                      ? 'bg-accent/10 border-accent'
                      : latestRoll.isFumble
                      ? 'bg-danger/10 border-danger'
                      : 'bg-surface border-border'
                  }`}
                >
                  <p className="text-sm text-text-muted">{latestRoll.label}</p>
                  <p className={`my-1 text-5xl font-bold font-mono tabular-nums dice-ltr ${
                    latestRoll.isCritical ? 'text-accent-hover' : latestRoll.isFumble ? 'text-danger' : 'text-text-primary'
                  }`}>
                    {latestRoll.total}
                  </p>
                  {latestRoll.isCritical && <Badge tone="accent" icon={Flame}>بحرانی طبیعی (۲۰)</Badge>}
                  {latestRoll.isFumble && <Badge tone="danger" icon={Skull}>شکست فاجعه‌بار (۱)</Badge>}
                  <p className="mt-2 text-sm text-text-muted flex flex-wrap items-center justify-center gap-x-3">
                    <span dir="ltr" className="font-mono">[{latestRoll.rolls.join(', ')}]</span>
                    <span>مادیفایر: <span dir="ltr">{formatModifier(latestRoll.modifier)}</span></span>
                    {latestRoll.advantage && (
                      <span className="font-medium text-accent-hover">{latestRoll.advantage === 'adv' ? 'با مزیت' : 'با ضعف'}</span>
                    )}
                  </p>
                </div>
              )}
              {shareError && (
                <p role="alert" className="mt-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning">
                  پرتاب برای میز بازی ارسال نشد؛ فقط خودتان آن را می‌بینید.
                </p>
              )}
            </div>

            {/* Die type: all seven visible at once, no hidden horizontal scroll */}
            <Field label="نوع تاس" group>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DICE_TYPES.map(sides => (
                  <Button key={sides} type="button" aria-pressed={selectedSides === sides} onClick={() => setSelectedSides(sides)}
                    className={`min-h-[48px] rounded-lg border font-mono font-bold text-sm transition active:scale-95 ${
                      selectedSides === sides
                        ? 'bg-accent/15 text-accent-hover border-accent'
                        : 'bg-surface-2 text-text-primary border-border hover:border-accent/50'
                    }`}>
                    d{sides}
                  </Button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Stepper label="تعداد تاس" display={String(diceCount)}
                onDec={() => setDiceCount(c => Math.max(1, c - 1))} onInc={() => setDiceCount(c => Math.min(20, c + 1))} />
              <Stepper label="مادیفایر" display={formatModifier(modifier)}
                onDec={() => setModifier(m => m - 1)} onInc={() => setModifier(m => m + 1)} />
            </div>

            <Field label="حالت پرتاب" group>
              <div className="grid grid-cols-3 gap-2">
                {ADVANTAGE_OPTIONS.map(item => (
                  <Button key={item.id} type="button" aria-pressed={advantage === item.id} onClick={() => setAdvantage(item.id)} className={segCls(advantage === item.id)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </Field>

            {/* The label was already used when rolling but had no input */}
            <Field label="عنوان پرتاب (اختیاری)" hint="در فید میز بازی نمایش داده می‌شود.">
              <Input noWrapper type="text" value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                placeholder="مثلاً: حمله با شمشیر" className={inputCls} />
            </Field>

            {canPrivate && (
              <label className="min-h-[56px] p-3 rounded-lg bg-surface-2 border border-border flex items-center gap-3 cursor-pointer">
                <Lock className={`w-4 h-4 shrink-0 ${isPrivateToDm ? 'text-accent-hover' : 'text-text-muted'}`} aria-hidden />
                <span className="flex-1 min-w-80">
                  <span className="block text-sm font-medium text-text-primary">
                    {isDm ? 'پرتاب محرمانه' : 'ارسال فقط برای دانجن مستر'}
                  </span>
                  <span className="block text-xs text-text-muted">برای سایر بازیکنان پنهان می‌ماند.</span>
                </span>
                <Input noWrapper type="checkbox" checked={isPrivateToDm} onChange={e => setIsPrivateToDm(e.target.checked)}
                  className="w-5 h-5 accent-accent rounded cursor-pointer" />
              </label>
            )}

            <StickyFooter>
              <Button type="button" onClick={handleRoll} className={`${primaryBtnCls} w-full min-h-[48px]  text-base`}>
                <Dices className="w-5 h-5" />
                <span dir="ltr">
                  {diceCount}d{selectedSides}{modifier !== 0 ? formatModifier(modifier) : ''}
                </span>
                <span>پرتاب</span>
              </Button>
            </StickyFooter>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-text-primary">پرتاب‌های اخیر میز (حداکثر ۵۰)</h4>
              <IconButton label="به‌روزرسانی" onClick={fetchTableRolls}>
                <RefreshCw className={`w-4 h-4 ${loadingTable ? 'animate-spin' : ''}`} />
              </IconButton>
            </div>

            {tableRolls.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-border rounded-xl text-sm text-text-muted">
                هنوز تاسی در این میز پرتاب نشده است.
              </div>
            ) : tableRolls.length > 50 ? (
              <VirtualList
                items={tableRolls}
                itemHeight={96}
                height={480}
                keyExtractor={r => r.id}
                renderItem={roll => (
                  <div className="pb-2">
                    <DiceRollCardRow roll={roll} />
                  </div>
                )}
              />
            ) : (
              <div className="space-y-2">
                {tableRolls.map(roll => <DiceRollCardRow key={roll.id} roll={roll} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};