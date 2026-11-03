import React from 'react';

export interface PipTrackerProps {
  current: number;
  max: number;
  onChange?: (val: number) => void;
  label?: string;
  size?: 'sm' | 'md';
  activeColor?: string;
  readOnly?: boolean;
  className?: string;
}

export const PipTracker: React.FC<PipTrackerProps> = ({
  current,
  max,
  onChange,
  label,
  size = 'md',
  activeColor = 'bg-primary border-primary shadow-[0_0_8px_rgb(var(--color-primary-rgb)/0.4)]',
  readOnly = false,
  className = '',
}) => {
  const pips = Array.from({ length: max }, (_, i) => i + 1);

  const handlePipClick = (pipIndex: number) => {
    if (readOnly || !onChange) return;
    // Clicking current active pip toggles it off
    if (pipIndex === current) {
      onChange(current - 1);
    } else {
      onChange(pipIndex);
    }
  };

  const pipSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
          <span>{label}</span>
          <span dir="ltr" className="font-mono text-text-muted text-[11px]">
            {current} / {max}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap" dir="ltr">
        {pips.map((index) => {
          const isFilled = index <= current;

          return (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              onClick={() => handlePipClick(index)}
              aria-label={`${index} از ${max}`}
              style={{ touchAction: 'manipulation' }}
              className={`${pipSize} rounded-md border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                isFilled
                  ? activeColor
                  : 'bg-surface-2 border-border hover:border-border-strong'
              } ${readOnly ? 'cursor-default pointer-events-none' : 'cursor-pointer active:scale-90'}`}
            />
          );
        })}
      </div>
    </div>
  );
};
