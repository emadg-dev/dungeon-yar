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
import { 
  Compass, Shield, AlertTriangle, Flame, Key, Sparkles, 
  CheckCircle2, Lock, Unlock, Eye, Check, RefreshCw 
} from 'lucide-react';

interface DmEndingTrackerProps {
  state?: CampaignEndingState;
  onUpdateState?: (updated: CampaignEndingState) => Promise<void>;
}

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

  const toggleTruthSource = async (key: keyof CampaignEndingState['truthSources']) => {
    const nextSources = {
      ...state.truthSources,
      [key]: !state.truthSources[key]
    };
    await onUpdateState({
      ...state,
      truthSources: nextSources
    });
  };

  const toggleAryamanTrigger = async (key: keyof CampaignEndingState['aryamanTriggers']) => {
    const nextTriggers = {
      ...state.aryamanTriggers,
      [key]: !state.aryamanTriggers[key]
    };
    await onUpdateState({
      ...state,
      aryamanTriggers: nextTriggers
    });
  };

  const adjustChaos = async (field: keyof CampaignEndingState['chaos'], delta: number) => {
    if (typeof state.chaos[field] === 'number') {
      const current = state.chaos[field] as number;
      const nextVal = Math.max(0, Math.min(3, current + delta));
      await onUpdateState({
        ...state,
        chaos: {
          ...state.chaos,
          [field]: nextVal
        }
      });
    }
  };

  const toggleChaosThreshold = async () => {
    await onUpdateState({
      ...state,
      chaos: {
        ...state.chaos,
        unrestrainedThreshold: !state.chaos.unrestrainedThreshold
      }
    });
  };

  const toggleEmberSource = async (idx: number) => {
    const nextSources = state.emberSources.map((s, i) =>
      i === idx ? { ...s, collected: !s.collected } : s
    );
    const sum = nextSources.reduce((acc, s) => acc + (s.collected ? s.percentage : 0), 0);
    await onUpdateState({
      ...state,
      emberSources: nextSources,
      embersPercentage: Math.min(100, sum)
    });
  };

  const truthLabels: Record<keyof CampaignEndingState['truthSources'], string> = {
    fairies: 'حقیقت پریان ورنا (Fairies)',
    divs: 'حقیقت دیوان باستان (Divs)',
    kandavaran: 'حقیقت کنداوران و کاتبان (Kandavaran)',
    mehzedegan: 'حقیقت مهزادگان (Mehzedegan)',
    mobads: 'حقیقت موبدان آذرین (Mobads)',
    documents: 'اسناد و کتیبه‌های تاریخی (Ancient Documents)'
  };

  const aryamanLabels: Record<keyof CampaignEndingState['aryamanTriggers'], string> = {
    shahbazFriendOrHigher: 'شهباز در وضعیت «دوست» یا بالاتر با گروه قرار دارد',
    farrehMarkRevealed: 'نشان فره در برابر آریامن آشکار شده است',
    divanzadPresent: 'حضور دیوانزاد (سامان) در کنار گروه تأیید شده است',
    emptyCrownOnFarrehDar: 'تاج خالی بر سر فره‌دار (پردیس) نهاده شده است',
    motherEmberMemory: 'خاطره‌ی اخگر مادر زنده شده است'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-accent/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent-hover" />
            <h2 className="text-base font-black text-accent-hover">ردیاب پایان‌های هفت‌گانه زروانیا</h2>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            محاسبه خودکار وضعیت سرنوشت جهان بر اساس حقیقت‌ها، محرک‌های آریامن، درصد اخگرها و آشفتگی
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-strong">
            حقیقت: <span className="text-accent-hover font-mono">{truthCount}/6</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border ${
            aryaman.state === 'returned'
              ? 'bg-success/15 border-success/50 text-success'
              : aryaman.state === 'hesitant'
              ? 'bg-accent/15 border-accent/50 text-accent-hover'
              : 'bg-danger/15 border-danger/50 text-danger'
          }`}>
            آریامن: {aryaman.stateFa}
          </div>
          <div className={`px-3 py-1.5 rounded-xl border ${
            chaosScore >= 7
              ? 'bg-danger/15 border-danger text-danger animate-pulse font-black'
              : chaosScore >= 4
              ? 'bg-accent/15 border-accent text-accent-hover'
              : 'bg-surface-2 border-border-strong text-text-primary'
          }`}>
            آشفتگی: {chaosScore}/10 {chaosScore >= 7 ? '(سقوط حتمی!)' : chaosScore >= 4 ? '(زخم سرنوشت)' : ''}
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Truth Sources (0 to 6) */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs font-black text-accent-hover flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-accent-hover" />
              حقیقت ({truthCount} از 6 منبع)
            </span>
            <span className="text-xs text-text-muted">کشف اسرار بنیادی</span>
          </div>
          <div className="space-y-2">
            {(Object.keys(truthLabels) as Array<keyof CampaignEndingState['truthSources']>).map(k => (
              <label
                key={k}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-info border border-border hover:border-border-strong cursor-pointer transition select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={state.truthSources[k]}
                  onChange={() => toggleTruthSource(k)}
                  className="w-4 h-4 rounded text-accent focus:ring-0 cursor-pointer"
                />
                <span className={state.truthSources[k] ? 'text-accent-hover font-bold' : 'text-text-muted'}>
                  {truthLabels[k]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Aryaman Triggers (0 to 5) */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs font-black text-accent-hover flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-hover" />
              راه‌اندازهای آریامن ({aryaman.count} از 5)
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              aryaman.state === 'returned' ? 'bg-success/15 text-success border-success/40' :
              aryaman.state === 'hesitant' ? 'bg-accent/15 text-accent-hover border-accent/40' :
              'bg-danger/15 text-danger border-danger/40'
            }`}>
              {aryaman.stateFa}
            </span>
          </div>
          <div className="space-y-2">
            {(Object.keys(aryamanLabels) as Array<keyof CampaignEndingState['aryamanTriggers']>).map(k => (
              <label
                key={k}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-info border border-border hover:border-border-strong cursor-pointer transition select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={state.aryamanTriggers[k]}
                  onChange={() => toggleAryamanTrigger(k)}
                  className="w-4 h-4 rounded text-accent focus:ring-0 cursor-pointer"
                />
                <span className={state.aryamanTriggers[k] ? 'text-accent-hover font-bold' : 'text-text-muted'}>
                  {aryamanLabels[k]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Embers & Mother Ember (0 to 100%) */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs font-black text-accent-hover flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-accent-hover" />
              اخگرها ({state.embersPercentage}٪ از 100٪)
            </span>
            <label className="flex items-center gap-1 text-xs text-accent-hover cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={state.motherEmberObtained}
                onChange={async () => {
                  await onUpdateState({
                    ...state,
                    motherEmberObtained: !state.motherEmberObtained
                  });
                }}
                className="w-3.5 h-3.5 rounded text-accent"
              />
              <span>اخگر مادر به‌دست آمد</span>
            </label>
          </div>

          {/* Embers progress bar */}
          <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                state.embersPercentage >= 60 ? 'bg-gradient-to-r from-accent to-accent-hover' : 'bg-warning'
              }`}
              style={{ width: `${state.embersPercentage}%` }}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            {state.emberSources.map((src, i) => (
              <label
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border text-xs cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={src.collected}
                    onChange={() => toggleEmberSource(i)}
                    className="w-3.5 h-3.5 rounded text-accent"
                  />
                  <span className={src.collected ? 'text-text-primary font-bold' : 'text-text-muted'}>
                    {src.name}
                  </span>
                </div>
                <span className="font-mono text-xs text-accent-hover font-bold">+{src.percentage}٪</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. Chaos Tracker (0 to 10) */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs font-black text-danger flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-danger" />
              آشفتگی ({chaosScore} از 10)
            </span>
            <span className="text-xs text-text-muted">
              {chaosScore >= 7 ? 'سقوط اجباری جهان' : chaosScore >= 4 ? 'زخم در پایان‌ها' : 'ثبات نسبی'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border">
              <span className="text-text-primary min-w-0 truncate">مهر کلید شکسته (+1 هر کدام، حداکثر 3):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('brokenKeySeals', -1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >-1</button>
                <span className="font-mono font-bold text-accent-hover">{state.chaos.brokenKeySeals}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('brokenKeySeals', +1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >+1</button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border">
              <span className="text-text-primary">متحد اصلی کشته‌شده (+1 هر کدام، حداکثر 3):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('mainAlliesDead', -1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >-1</button>
                <span className="font-mono font-bold text-accent-hover">{state.chaos.mainAlliesDead}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('mainAlliesDead', +1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >+1</button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border">
              <span className="text-text-primary">فرقه/جناح دشمن‌شده (+1 هر کدام، حداکثر 3):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('ordersTurnedEnemy', -1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >-1</button>
                <span className="font-mono font-bold text-accent-hover">{state.chaos.ordersTurnedEnemy}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('ordersTurnedEnemy', +1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >+1</button>
              </div>
            </div>

            <label className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border cursor-pointer select-none">
              <span className="text-text-primary">آستانه مهارنشده سنگ‌خواب یا وردان (+1):</span>
              <input
                type="checkbox"
                checked={state.chaos.unrestrainedThreshold}
                onChange={toggleChaosThreshold}
                className="w-4 h-4 rounded text-danger"
              />
            </label>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-xl bg-info border border-border">
              <span className="text-success">آشتی دادن جناح یا نجات متحد (-1 کاهش):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('reconciledOrdersOrSavedAllies', -1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >-1</button>
                <span className="font-mono font-bold text-success">{state.chaos.reconciledOrdersOrSavedAllies}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('reconciledOrdersOrSavedAllies', +1)}
                  className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 text-text-primary font-bold"
                >+1</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Half Seal Checkbox & Method */}
      <div className="p-4 rounded-2xl bg-surface border border-accent/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 text-text-primary font-bold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.secondHalfSealObtained}
            onChange={async () => {
              await onUpdateState({
                ...state,
                secondHalfSealObtained: !state.secondHalfSealObtained
              });
            }}
            className="w-4 h-4 rounded text-accent cursor-pointer"
          />
          <Key className="w-4 h-4 text-accent-hover" />
          <span>نیمه دوم مهر آریامن به‌دست آمد (مهر کامل شد)</span>
        </label>

        {state.secondHalfSealObtained && (
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs">نحوه دستیابی:</span>
            <select
              value={state.secondHalfSealMethod}
              onChange={async (e) => {
                await onUpdateState({
                  ...state,
                  secondHalfSealMethod: e.target.value as any
                });
              }}
              className="p-1.5 rounded-xl bg-info border border-border-strong text-xs text-accent-hover"
            >
              <option value="given">اهدایی و صلح‌آمیز</option>
              <option value="defeat">پس از شکست دشمن</option>
              <option value="stolen_by_shahbaz">دزدیده‌شده توسط شهباز</option>
            </select>
          </div>
        )}
      </div>

      {/* 7 Endings Evaluation Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-accent-hover flex items-center gap-2">
          <Compass className="w-4 h-4 text-accent-hover" />
          <span>ارزیابی سرنوشت و پایان‌های کمپین (Seven Endings)</span>
        </h3>

        <div className="space-y-2.5">
          {endingEvaluations.map(ending => (
            <div
              key={ending.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                ending.available
                  ? 'bg-info border-accent/50 shadow-md'
                  : 'bg-info border-border/80 opacity-70'
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    ending.available ? 'bg-accent/20 text-accent-hover' : 'bg-surface-2 text-text-muted'
                  }`}>
                    {ending.available ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${ending.available ? 'text-accent-hover' : 'text-text-muted'}`}>
                      {ending.name} ({ending.nameEn})
                    </h4>
                    <span className="text-xs text-text-muted block mt-0.5">{ending.notes}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                    ending.available
                      ? 'bg-success/15 text-success border-success/40'
                      : 'bg-surface-2/60 text-text-muted border-border-strong'
                  }`}>
                    {ending.available ? 'دسترس‌پذیر' : 'قفل‌شده'}
                  </span>
                </div>
              </div>

              {/* Requirements row */}
              <div className="mt-2 text-xs text-text-muted bg-bg p-2 rounded-xl border border-border/80">
                <strong>پیش‌نیاز:</strong> {ending.requirements}
              </div>

              {/* Wound notification if applicable */}
              {ending.available && ending.woundEffect && (
                <div className="mt-2 text-xs text-accent-hover bg-accent/15 p-2 rounded-xl border border-accent/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-hover shrink-0" />
                  <span>{ending.woundEffect}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
