import React from 'react';

interface PipTrackerProps {
  label: string;
  current: number;
  max: number;
  onToggle: (index: number) => void;
  resetType?: 'short' | 'long' | 'session' | 'season' | 'none';
  pipColor?: string;
  emptyColor?: string;
  readOnly?: boolean;
}

export const PipTracker: React.FC<PipTrackerProps> = ({
  label,
  current,
  max,
  onToggle,
  resetType,
  pipColor = 'bg-accent border-accent shadow-glow-amber',
  emptyColor = 'bg-surface-2 border-border',
  readOnly = false,
}) => {
  const resetLabels: Record<string, string> = {
    short: 'استراحت کوتاه',
    long: 'استراحت بلند',
    session: 'هر جلسه',
    season: 'فصلی',
    none: 'بدون بازیابی خودکار',
  };

  const pips = Array.from({ length: Math.max(1, max) }, (_, i) => i < current);

  return (
    <div className="flex flex-col gap-1.5 w-full" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-text-primary">{label}</span>
        <div className="flex items-center gap-2">
          {resetType && (
            <span className="text-xs text-text-muted">
              {resetLabels[resetType] || resetType}
            </span>
          )}
          <span className="font-mono text-xs font-bold text-accent dice-ltr">
            {current}/{max}
          </span>
        </div>
      </div>

      {/* Row of Pips */}
      <div className="flex flex-wrap items-center gap-2 py-0.5">
        {pips.map((filled, idx) => (
          <button
            key={idx}
            type="button"
            disabled={readOnly}
            onClick={() => onToggle(idx)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] border transition-all duration-150 flex items-center justify-center ${
              filled ? pipColor : emptyColor
            } ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-90 hover:border-accent/60 touch-target min-w-[44px]'}`}
            title={`اسلات ${idx + 1}: ${filled ? 'مصرف شده' : 'خالی'}`}
            aria-label={`${label}، پیپ ${idx + 1} از ${max}: ${filled ? 'فعال' : 'خالی'}`}
          >
            {filled && (
              <span className="w-2 h-2 rounded-full bg-bg/70 shadow-sm" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
