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

  // Color logic based on design tokens: Heal #6F9E78, Amber #E0A030, Ember #C2512B
  const barColor =
    percent > 50
      ? 'bg-[#6F9E78]'
      : percent > 20
      ? 'bg-[#E0A030]'
      : 'bg-[#C2512B]';

  if (compact) {
    return (
      <div className="flex items-center gap-2 w-full" dir="rtl">
        <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-extrabold dice-ltr text-[#EDE6D8]">
          <span className={current <= max * 0.2 ? 'text-[#C2512B]' : 'text-[#EDE6D8]'}>{current}</span>
          <span className="text-[#A39A89]">/{max}</span>
        </div>
        <div className="flex-1 h-2 rounded-full bg-[#201D19] border border-[#2F2A23] overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ease-out ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            className="w-7 h-7 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:border-[#C2512B] flex items-center justify-center text-xs active:scale-95"
            title="کاهش ۱ جان"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            className="w-7 h-7 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:border-[#6F9E78] flex items-center justify-center text-xs active:scale-95"
            title="افزایش ۱ جان"
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
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-[#C2512B]">
          <Heart className="w-4 h-4 fill-[#C2512B]/20" />
          <span>جان (HP)</span>
        </span>

        <div className="flex items-center gap-2">
          {temp > 0 && (
            <span className="px-2 py-0.5 rounded-[8px] bg-[#7FB4D6]/20 border border-[#7FB4D6]/40 text-[#7FB4D6] text-[11px] font-bold">
              +{temp} موقت
            </span>
          )}
          <div className="flex items-baseline gap-1 font-mono text-base font-extrabold dice-ltr">
            <span className={current <= max * 0.2 ? 'text-[#C2512B] text-xl' : 'text-[#EDE6D8] text-xl'}>
              {current}
            </span>
            <span className="text-[#A39A89]">/ {max}</span>
          </div>
        </div>
      </div>

      {/* Bar container */}
      <div className="w-full h-3 rounded-full bg-[#201D19] border border-[#2F2A23] overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Wide touch adjustment buttons (≥ 48px hit area) */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAdjust(-5)}
          className="touch-target-lg rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#C2512B] hover:border-[#C2512B]/60 text-xs font-black transition active:scale-95"
          title="کاهش ۵ جان"
        >
          -۵
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="touch-target-lg rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#C2512B] hover:border-[#C2512B]/60 text-xs font-black transition active:scale-95"
          title="کاهش ۱ جان"
        >
          -۱
        </button>
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="touch-target-lg rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#6F9E78] hover:border-[#6F9E78]/60 text-xs font-black transition active:scale-95"
          title="افزایش ۱ جان"
        >
          +۱
        </button>
        <button
          type="button"
          onClick={() => onAdjust(5)}
          className="touch-target-lg rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#6F9E78] hover:border-[#6F9E78]/60 text-xs font-black transition active:scale-95"
          title="افزایش ۵ جان"
        >
          +۵
        </button>
      </div>
    </div>
  );
};
