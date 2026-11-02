import React from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  onRemove,
  icon,
  badge,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const isInteractive = Boolean(onClick);

  const sizeClasses =
    size === 'sm'
      ? `text-xs py-1.5 px-3 gap-1.5 ${isInteractive ? 'min-h-[44px]' : 'min-h-[32px]'}`
      : `text-xs sm:text-sm py-2 px-3.5 gap-2 ${isInteractive ? 'min-h-[44px]' : 'min-h-[36px]'}`;

  return (
    <span
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onClick={!disabled && onClick ? onClick : undefined}
      onKeyDown={(e) => {
        if (isInteractive && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{ touchAction: 'manipulation' }}
      className={`inline-flex items-center rounded-xl font-medium select-none whitespace-nowrap shrink-0 transition-all duration-150 border outline-none ${
        selected
          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(224,160,48,0.2)] font-bold'
          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-stone-100'
      } ${
        isInteractive && !disabled
          ? 'cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400'
          : ''
      } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${sizeClasses} ${className}`}
    >
      {icon && <span className="shrink-0 inline-flex items-center">{icon}</span>}
      <span className="whitespace-nowrap shrink-0">{label}</span>
      {badge !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
            selected ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-400'
          }`}
        >
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`حذف ${label}`}
          className="hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-stone-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
};
