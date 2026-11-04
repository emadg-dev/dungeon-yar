import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { CampaignEndingState } from '../../types';
import {
  calculateTruthCount,
  calculateAryamanState,
  calculateChaosScore,
  evaluateEndings,
  INITIAL_ENDING_STATE
} from '../../data/endings';
import { api } from '../../services/api';
import { Badge, Tone, inputCls } from '../ui/FormLayout';
import { Compass, AlertTriangle, Flame, Key, Sparkles, Lock, Unlock, Eye, Minus, Plus } from 'lucide-react';

interface DmEndingTrackerProps {
  state?: CampaignEndingState;
  onUpdateState?: (updated: CampaignEndingState) => Promise<void>;
}

/** One checklist row: whole row is the 44px touch target. */
const CheckRow: React.FC<{
  checked: boolean;
  onChange: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}> = ({ checked, onChange, trailing, children }) => (
  <label
    className={`min-h-[44px] px-3 py-2 rounded-lg border flex items-center gap-3 cursor-pointer select-none transition ${
      checked ? 'bg-accent/10 border-accent/40' : 'bg-surface-2 border-border hover:border-border-strong'
    }`}
  >
    <Input noWrapper type="checkbox" checked={checked} onChange={onChange}
      className="w-5 h-5 rounded accent-accent shrink-0 cursor-pointer" />
    <span className={`flex-1 text-sm leading-relaxed ${checked ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
      {children}
    </span>
    {trailing}
  </label>
);

/** −  value  + with real 44px buttons (the old ones had an invalid min-width class and no size). */
const Stepper: React.FC<{
  value: number;
  onChange: (delta: number) => void;
  label: string;
  tone?: 'default' | 'good';
}> = ({ value, onChange, label, tone = 'default' }) => (
  <div className="flex items-center gap-1 shrink-0" role="group" aria-label={label}>
    <Button type="button" onClick={() => onChange(-1)} aria-label="کم کردن"
      className="min-h-[44px] min-w-[44px] rounded-lg bg-surface border border-border text-text-primary inline-flex items-center justify-center">
      <Minus className="w-4 h-4" />
    </Button>
    <span className={`min-w-[2rem] text-center text-base font-bold tabular-nums ${tone === 'good' ? 'text-success' : 'text-text-primary'}`}>
      {value}
    </span>
    <Button type="button" onClick={() => onChange(1)} aria-label="زیاد کردن"
      className="min-h-[44px] min-w-[44px] rounded-lg bg-surface border border-border text-text-primary inline-flex items-center justify-center">
      <Plus className="w-4 h-4" />
    </Button>
  </div>
);

const Panel: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  meta?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon: Icon, meta, children }) => (
  <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        {title}
      </h3>
      {meta}
    </header>
    {children}
  </section>
);

export const DmEndingTracker: React.FC<DmEndingTrackerProps> = ({
  state: propState,
  onUpdateState: propOnUpdateState,
}) => {
  const [internalState, setInternalState] = useState<CampaignEndingState>(propState || INITIAL_ENDING_STATE);

  useEffect(() => {
    if (propState) {
      setInternalState(propState);
    } else {
      api.getEndingState().then(setInternalState).catch(() => {});
    }
  }, [propState]);

  const state = propState || internalState;

  const onUpdateState = async (updated: CampaignEndingState) => {
    if (propOnUpdateState) {
      await propOnUpdateState(updated);
    } else {
      setInternalState(updated);
      await api.updateEndingState(updated);
    }
  };
  const truthCount = calculateTruthCount(state.truthSources);
  const aryaman = calculateAryamanState(state.aryamanTriggers);
  const chaosScore = calculateChaosScore(state.chaos);
  const endingEvaluations = evaluateEndings(state);

  const toggleTruthSource = (key: keyof CampaignEndingState['truthSources']) =>
    onUpdateState({ ...state, truthSources: { ...state.truthSources, [key]: !state.truthSources[key] } });

  const toggleAryamanTrigger = (key: keyof CampaignEndingState['aryamanTriggers']) =>
    onUpdateState({ ...state, aryamanTriggers: { ...state.aryamanTriggers, [key]: !state.aryamanTriggers[key] } });

  const adjustChaos = async (field: keyof CampaignEndingState['chaos'], delta: number) => {
    if (typeof state.chaos[field] === 'number') {
      const current = state.chaos[field] as number;
      const nextVal = Math.max(0, Math.min(3, current + delta));
      await onUpdateState({ ...state, chaos: { ...state.chaos, [field]: nextVal } });
    }
  };

  const toggleChaosThreshold = () =>
    onUpdateState({ ...state, chaos: { ...state.chaos, unrestrainedThreshold: !state.chaos.unrestrainedThreshold } });

  const toggleEmberSource = async (idx: number) => {
    const nextSources = state.emberSources.map((s, i) => (i === idx ? { ...s, collected: !s.collected } : s));
    const sum = nextSources.reduce((acc, s) => acc + (s.collected ? s.percentage : 0), 0);
    await onUpdateState({ ...state, emberSources: nextSources, embersPercentage: Math.min(100, sum) });
  };

  const truthLabels: Record<keyof CampaignEndingState['truthSources'], string> = {
    fairies: 'حقیقت پریان ورنا',
    divs: 'حقیقت دیوان باستان',
    kandavaran: 'حقیقت کنداوران و کاتبان',
    mehzedegan: 'حقیقت مهزادگان',
    mobads: 'حقیقت موبدان آذرین',
    documents: 'اسناد و کتیبه‌های تاریخی'
  };

  const aryamanLabels: Record<keyof CampaignEndingState['aryamanTriggers'], string> = {
    shahbazFriendOrHigher: 'شهباز در وضعیت «دوست» یا بالاتر با گروه است',
    farrehMarkRevealed: 'نشان فره در برابر آریامن آشکار شده است',
    divanzadPresent: 'حضور دیوانزاد (سامان) کنار گروه تأیید شده است',
    emptyCrownOnFarrehDar: 'تاج خالی بر سر فره‌دار (پردیس) نهاده شده است',
    motherEmberMemory: 'خاطره‌ی اخگر مادر زنده شده است'
  };

  const aryamanTone: Tone = aryaman.state === 'returned' ? 'success' : aryaman.state === 'hesitant' ? 'accent' : 'danger';
  const chaosTone: Tone = chaosScore >= 7 ? 'danger' : chaosScore >= 4 ? 'warning' : 'neutral';
  const chaosNote = chaosScore >= 7 ? 'سقوط اجباری جهان' : chaosScore >= 4 ? 'زخم در پایان‌ها' : 'ثبات نسبی';

  const chaosRows: Array<{ field: keyof CampaignEndingState['chaos']; label: string; good?: boolean }> = [
    { field: 'brokenKeySeals', label: 'مهر کلید شکسته (+1 هر کدام، حداکثر 3)' },
    { field: 'mainAlliesDead', label: 'متحد اصلی کشته‌شده (+1 هر کدام، حداکثر 3)' },
    { field: 'ordersTurnedEnemy', label: 'فرقه یا جناح دشمن‌شده (+1 هر کدام، حداکثر 3)' },
    { field: 'reconciledOrdersOrSavedAllies', label: 'آشتی دادن جناح یا نجات متحد (−1 هر کدام)', good: true }
  ];

  return (
    <div className="space-y-6">
      {/* Summary: three quiet stat tiles; no pulsing, no gradient */}
      <header className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent" aria-hidden />
            ردیاب پایان‌های هفت‌گانه
          </h2>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            وضعیت سرنوشت جهان از روی حقیقت‌ها، راه‌اندازهای آریامن، اخگرها و آشفتگی محاسبه می‌شود.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-muted">حقیقت</p>
            <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums">{truthCount}<span className="text-sm text-text-muted"> / 6</span></p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-muted">آریامن</p>
            <div className="mt-1"><Badge tone={aryamanTone}>{aryaman.stateFa}</Badge></div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-muted">آشفتگی</p>
            <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums">{chaosScore}<span className="text-sm text-text-muted"> / 10</span></p>
            <div className="mt-1"><Badge tone={chaosTone}>{chaosNote}</Badge></div>
          </div>
        </div>
      </header>

      {/* Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={`حقیقت (${truthCount} از 6)`} icon={Eye}>
          <div className="space-y-2">
            {(Object.keys(truthLabels) as Array<keyof CampaignEndingState['truthSources']>).map(k => (
              <CheckRow key={k} checked={state.truthSources[k]} onChange={() => toggleTruthSource(k)}>
                {truthLabels[k]}
              </CheckRow>
            ))}
          </div>
        </Panel>

        <Panel
          title={`راه‌اندازهای آریامن (${aryaman.count} از 5)`}
          icon={Sparkles}
          meta={<Badge tone={aryamanTone}>{aryaman.stateFa}</Badge>}
        >
          <div className="space-y-2">
            {(Object.keys(aryamanLabels) as Array<keyof CampaignEndingState['aryamanTriggers']>).map(k => (
              <CheckRow key={k} checked={state.aryamanTriggers[k]} onChange={() => toggleAryamanTrigger(k)}>
                {aryamanLabels[k]}
              </CheckRow>
            ))}
          </div>
        </Panel>

        <Panel title={`اخگرها (${state.embersPercentage}٪)`} icon={Flame}>
          <div
            role="progressbar"
            aria-valuenow={state.embersPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="درصد اخگرها"
            className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden"
          >
            <div
              className={`h-full transition-all ${state.embersPercentage >= 60 ? 'bg-accent' : 'bg-warning'}`}
              style={{ width: `${state.embersPercentage}%` }}
            />
          </div>

          <div className="space-y-2">
            {state.emberSources.map((src, i) => (
              <CheckRow
                key={i}
                checked={src.collected}
                onChange={() => toggleEmberSource(i)}
                trailing={<span className="text-sm font-bold text-accent-hover tabular-nums">+{src.percentage}٪</span>}
              >
                {src.name}
              </CheckRow>
            ))}
            <CheckRow
              checked={state.motherEmberObtained}
              onChange={() => onUpdateState({ ...state, motherEmberObtained: !state.motherEmberObtained })}
            >
              اخگر مادر به‌دست آمد
            </CheckRow>
          </div>
        </Panel>

        <Panel
          title={`آشفتگی (${chaosScore} از 10)`}
          icon={AlertTriangle}
          meta={<Badge tone={chaosTone}>{chaosNote}</Badge>}
        >
          <div className="space-y-2">
            {chaosRows.map(row => (
              <div key={row.field} className="px-3 py-2 rounded-lg border border-border bg-surface-2 flex items-center justify-between gap-3">
                <span className={`text-sm leading-relaxed ${row.good ? 'text-success' : 'text-text-primary'}`}>{row.label}</span>
                <Stepper
                  label={row.label}
                  tone={row.good ? 'good' : 'default'}
                  value={state.chaos[row.field] as number}
                  onChange={d => adjustChaos(row.field, d)}
                />
              </div>
            ))}
            <CheckRow checked={state.chaos.unrestrainedThreshold} onChange={toggleChaosThreshold}>
              آستانه مهارنشده سنگ‌خواب یا وردان (+1)
            </CheckRow>
          </div>
        </Panel>
      </div>

      {/* Second half of the seal */}
      <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <CheckRow
          checked={state.secondHalfSealObtained}
          onChange={() => onUpdateState({ ...state, secondHalfSealObtained: !state.secondHalfSealObtained })}
          trailing={<Key className="w-4 h-4 text-accent" aria-hidden />}
        >
          نیمه دوم مهر آریامن به‌دست آمد
        </CheckRow>
        {state.secondHalfSealObtained && (
          <label className="block">
            <span className="block text-sm font-medium text-text-primary mb-1.5">نحوه دستیابی</span>
            <Select noWrapper
              value={state.secondHalfSealMethod}
              onChange={e => onUpdateState({ ...state, secondHalfSealMethod: e.target.value as any })}
              className={inputCls}
            >
              <option value="given">اهدایی و صلح‌آمیز</option>
              <option value="defeat">پس از شکست دشمن</option>
              <option value="stolen_by_shahbaz">دزدیده‌شده توسط شهباز</option>
            </Select>
          </label>
        )}
      </section>

      {/* Outcome */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Compass className="w-4 h-4 text-accent" aria-hidden />
          پایان‌های کمپین
        </h3>

        <ul className="space-y-3">
          {endingEvaluations.map(ending => (
            <li
              key={ending.id}
              className={`rounded-xl border bg-surface p-4 space-y-2.5 ${
                ending.available ? 'border-accent/50' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ending.available ? 'bg-accent/15 text-accent-hover' : 'bg-surface-2 text-text-muted'
                  }`}>
                    {ending.available ? <Unlock className="w-4 h-4" aria-hidden /> : <Lock className="w-4 h-4" aria-hidden />}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-text-primary">
                      {ending.name}
                      <span dir="ltr" className="ms-2 text-xs font-normal text-text-muted">{ending.nameEn}</span>
                    </h4>
                    <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{ending.notes}</p>
                  </div>
                </div>
                <Badge tone={ending.available ? 'success' : 'neutral'}>
                  {ending.available ? 'دسترس‌پذیر' : 'قفل‌شده'}
                </Badge>
              </div>

              <p className="text-sm text-text-muted leading-relaxed">
                <span className="font-medium text-text-primary">پیش‌نیاز: </span>
                {ending.requirements}
              </p>

              {ending.available && ending.woundEffect && (
                <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <span>{ending.woundEffect}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};