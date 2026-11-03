import React from 'react';
import { Heart, Plus, Minus } from 'lucide-react';

interface HPBarProps {
  current: number;
  max: number;
  temp?: number;
  onAdjust: (delta: number) => void;
  compact?: boolean;
}

export const HPBar: React.FC<HPBarProps> = ({
  current,
  max,
  temp = 0,
  onAdjust,
  compact = false,
}) => {
  const safeMax = Math.max(1, max);
  const percent = Math.min(100, Math.max(0, Math.round((current / safeMax) * 100)));

  // Color logic based on semantic design tokens: Heal (success), Amber (warning), Ember (danger)
  const barColor =
    percent > 50
      ? 'bg-success'
      : percent > 20
      ? 'bg-accent'
      : 'bg-danger';

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 w-full" dir="rtl">
        <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-extrabold dice-ltr text-text-primary min-w-0">
          <span className={current <= max * 0.2 ? 'text-danger' : 'text-text-primary'}>{current}</span>
          <span className="text-text-muted">/{max}</span>
        </div>
        <div className="flex-1 h-2 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ease-out ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-danger hover:border-danger/60 text-xs font-black transition active:scale-95"
            title="کاهش 1 جان"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-success hover:border-success/60 text-xs font-black transition active:scale-95"
            title="افزایش 1 جان"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2" dir="rtl">
      {/* Numbers & Label */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-danger">
          <Heart className="w-4 h-4 fill-danger/20" />
          <span>جان (HP)</span>
        </span>

        <div className="flex items-center gap-2">
          {temp > 0 && (
            <span className="px-2 py-0.5 rounded-[8px] bg-info/20 border border-info/40 text-info text-xs font-bold">
              +{temp} موقت
            </span>
          )}
          <div className="flex items-baseline gap-1 font-mono text-base font-extrabold dice-ltr">
            <span className={current <= max * 0.2 ? 'text-danger text-xl' : 'text-text-primary text-xl'}>
              {current}
            </span>
            <span className="text-text-muted">/ {max}</span>
          </div>
        </div>
      </div>

      {/* Bar container */}
      <div className="w-full h-3 rounded-full bg-surface-2 border border-border overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Wide touch adjustment buttons (≥ 48px hit area) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <button
          type="button"
          onClick={() => onAdjust(-5)}
          className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-danger hover:border-danger/60 text-xs font-black transition active:scale-95"
          title="کاهش 5 جان"
        >
          -5
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-danger hover:border-danger/60 text-xs font-black transition active:scale-95"
          title="کاهش 1 جان"
        >
          -1
        </button>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-success hover:border-success/60 text-xs font-black transition active:scale-95"
          title="افزایش 1 جان"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => onAdjust(5)}
          className="touch-target min-w-[44px]-lg rounded-[12px] bg-surface-2 border border-border text-success hover:border-success/60 text-xs font-black transition active:scale-95"
          title="افزایش 5 جان"
        >
          +5
        </button>
      </div>
    </div>
  );
};
