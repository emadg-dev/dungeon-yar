import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValueText?: boolean;
  color?: 'accent' | 'success' | 'danger' | 'warning' | 'auto-hp';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValueText = false,
  color = 'accent',
  height = 'md',
  className = '',
}) => {
  const percent = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getBarColor = () => {
    if (color === 'auto-hp') {
      if (percent > 50) return 'bg-emerald-500';
      if (percent > 20) return 'bg-amber-500';
      return 'bg-red-500';
    }
    const colorStyles = {
      accent: 'bg-amber-500',
      success: 'bg-emerald-500',
      danger: 'bg-red-500',
      warning: 'bg-yellow-500',
    };
    return colorStyles[color];
  };

  return (
    <div className={`space-y-1 w-full ${className}`}>
      {(label || showValueText) && (
        <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
          {label && <span>{label}</span>}
          {showValueText && (
            <span dir="ltr" className="font-mono text-stone-400">
              {value} / {max}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'نوار پیشرفت'}
        className={`w-full ${heightStyles[height]} bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-800`}
      >
        <div
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full transition-all duration-300 ease-out ${getBarColor()}`}
        />
      </div>
    </div>
  );
};
