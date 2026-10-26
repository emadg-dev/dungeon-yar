import React from 'react';
import { CampaignEndingState } from '../../types';
import {
  calculateTruthCount,
  calculateAryamanState,
  calculateChaosScore,
  evaluateEndings
} from '../../data/endings';
import { 
  Compass, Shield, AlertTriangle, Flame, Key, Sparkles, 
  CheckCircle2, Lock, Unlock, Eye, Check, RefreshCw 
} from 'lucide-react';

interface DmEndingTrackerProps {
  state: CampaignEndingState;
  onUpdateState: (updated: CampaignEndingState) => Promise<void>;
}

export const DmEndingTracker: React.FC<DmEndingTrackerProps> = ({
  state,
  onUpdateState,
}) => {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141824] border border-amber-500/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-amber-200">ردیاب پایان‌های هفت‌گانه زروانیا</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            محاسبه خودکار وضعیت سرنوشت جهان بر اساس حقیقت‌ها، محرک‌های آریامن، درصد اخگرها و آشفتگی
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-[#181c2b] border border-slate-700">
            حقیقت: <span className="text-amber-400 font-mono">{truthCount}/6</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border ${
            aryaman.state === 'returned'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : aryaman.state === 'hesitant'
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-red-950/60 border-red-500/50 text-red-300'
          }`}>
            آریامن: {aryaman.stateFa}
          </div>
          <div className={`px-3 py-1.5 rounded-xl border ${
            chaosScore >= 7
              ? 'bg-red-950 border-red-500 text-red-200 animate-pulse font-black'
              : chaosScore >= 4
              ? 'bg-amber-950/60 border-amber-500 text-amber-200'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            آشفتگی: {chaosScore}/10 {chaosScore >= 7 ? '(سقوط حتمی!)' : chaosScore >= 4 ? '(زخم سرنوشت)' : ''}
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Truth Sources (0 to 6) */}
        <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              حقیقت ({truthCount} از ۶ منبع)
            </span>
            <span className="text-[11px] text-slate-400">کشف اسرار بنیادی</span>
          </div>
          <div className="space-y-2">
            {(Object.keys(truthLabels) as Array<keyof CampaignEndingState['truthSources']>).map(k => (
              <label
                key={k}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#181c28] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={state.truthSources[k]}
                  onChange={() => toggleTruthSource(k)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className={state.truthSources[k] ? 'text-amber-200 font-bold' : 'text-slate-400'}>
                  {truthLabels[k]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Aryaman Triggers (0 to 5) */}
        <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              راه‌اندازهای آریامن ({aryaman.count} از ۵)
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
              aryaman.state === 'returned' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
              aryaman.state === 'hesitant' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
              'bg-red-950 text-red-300 border-red-500/40'
            }`}>
              {aryaman.stateFa}
            </span>
          </div>
          <div className="space-y-2">
            {(Object.keys(aryamanLabels) as Array<keyof CampaignEndingState['aryamanTriggers']>).map(k => (
              <label
                key={k}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#181c28] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={state.aryamanTriggers[k]}
                  onChange={() => toggleAryamanTrigger(k)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className={state.aryamanTriggers[k] ? 'text-amber-200 font-bold' : 'text-slate-400'}>
                  {aryamanLabels[k]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Embers & Mother Ember (0 to 100%) */}
        <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              اخگرها ({state.embersPercentage}٪ از ۱۰۰٪)
            </span>
            <label className="flex items-center gap-1 text-[11px] text-amber-300 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={state.motherEmberObtained}
                onChange={async () => {
                  await onUpdateState({
                    ...state,
                    motherEmberObtained: !state.motherEmberObtained
                  });
                }}
                className="w-3.5 h-3.5 rounded text-amber-500"
              />
              <span>اخگر مادر به‌دست آمد</span>
            </label>
          </div>

          {/* Embers progress bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                state.embersPercentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-amber-600'
              }`}
              style={{ width: `${state.embersPercentage}%` }}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            {state.emberSources.map((src, i) => (
              <label
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800 text-xs cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={src.collected}
                    onChange={() => toggleEmberSource(i)}
                    className="w-3.5 h-3.5 rounded text-amber-500"
                  />
                  <span className={src.collected ? 'text-slate-200 font-bold' : 'text-slate-400'}>
                    {src.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-amber-400 font-bold">+{src.percentage}٪</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. Chaos Tracker (0 to 10) */}
        <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              آشفتگی ({chaosScore} از ۱۰)
            </span>
            <span className="text-[11px] text-slate-400">
              {chaosScore >= 7 ? 'سقوط اجباری جهان' : chaosScore >= 4 ? 'زخم در پایان‌ها' : 'ثبات نسبی'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800">
              <span className="text-slate-300">مهر کلید شکسته (+۱ هر کدام، حداکثر ۳):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('brokenKeySeals', -1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >-1</button>
                <span className="font-mono font-bold text-amber-300">{state.chaos.brokenKeySeals}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('brokenKeySeals', +1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >+1</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800">
              <span className="text-slate-300">متحد اصلی کشته‌شده (+۱ هر کدام، حداکثر ۳):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('mainAlliesDead', -1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >-1</button>
                <span className="font-mono font-bold text-amber-300">{state.chaos.mainAlliesDead}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('mainAlliesDead', +1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >+1</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800">
              <span className="text-slate-300">فرقه/جناح دشمن‌شده (+۱ هر کدام، حداکثر ۳):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('ordersTurnedEnemy', -1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >-1</button>
                <span className="font-mono font-bold text-amber-300">{state.chaos.ordersTurnedEnemy}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('ordersTurnedEnemy', +1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >+1</button>
              </div>
            </div>

            <label className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800 cursor-pointer select-none">
              <span className="text-slate-300">آستانه مهارنشده سنگ‌خواب یا وردان (+۱):</span>
              <input
                type="checkbox"
                checked={state.chaos.unrestrainedThreshold}
                onChange={toggleChaosThreshold}
                className="w-4 h-4 rounded text-red-500"
              />
            </label>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#181c28] border border-slate-800">
              <span className="text-emerald-400">آشتی دادن جناح یا نجات متحد (-۱ کاهش):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustChaos('reconciledOrdersOrSavedAllies', -1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >-1</button>
                <span className="font-mono font-bold text-emerald-300">{state.chaos.reconciledOrdersOrSavedAllies}</span>
                <button
                  type="button"
                  onClick={() => adjustChaos('reconciledOrdersOrSavedAllies', +1)}
                  className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold"
                >+1</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Half Seal Checkbox & Method */}
      <div className="p-4 rounded-2xl bg-[#141824] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 text-slate-200 font-bold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.secondHalfSealObtained}
            onChange={async () => {
              await onUpdateState({
                ...state,
                secondHalfSealObtained: !state.secondHalfSealObtained
              });
            }}
            className="w-4 h-4 rounded text-amber-500 cursor-pointer"
          />
          <Key className="w-4 h-4 text-amber-400" />
          <span>نیمه دوم مهر آریامن به‌دست آمد (مهر کامل شد)</span>
        </label>

        {state.secondHalfSealObtained && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">نحوه دستیابی:</span>
            <select
              value={state.secondHalfSealMethod}
              onChange={async (e) => {
                await onUpdateState({
                  ...state,
                  secondHalfSealMethod: e.target.value as any
                });
              }}
              className="p-1.5 rounded-xl bg-[#181c28] border border-slate-700 text-xs text-amber-200"
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
        <h3 className="text-sm font-black text-amber-200 flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>ارزیابی سرنوشت و پایان‌های کمپین (Seven Endings)</span>
        </h3>

        <div className="space-y-2.5">
          {endingEvaluations.map(ending => (
            <div
              key={ending.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                ending.available
                  ? 'bg-[#151928] border-amber-500/50 shadow-md'
                  : 'bg-[#10131e] border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    ending.available ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {ending.available ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${ending.available ? 'text-amber-200' : 'text-slate-400'}`}>
                      {ending.name} ({ending.nameEn})
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{ending.notes}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    ending.available
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}>
                    {ending.available ? 'دسترس‌پذیر' : 'قفل‌شده'}
                  </span>
                </div>
              </div>

              {/* Requirements row */}
              <div className="mt-2 text-[11px] text-slate-400 bg-[#0e111a] p-2 rounded-xl border border-slate-800/80">
                <strong>پیش‌نیاز:</strong> {ending.requirements}
              </div>

              {/* Wound notification if applicable */}
              {ending.available && ending.woundEffect && (
                <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
