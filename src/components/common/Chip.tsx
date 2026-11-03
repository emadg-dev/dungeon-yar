import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ChipProps {
  label?: string;
  icon?: LucideIcon;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'filter' | 'badge' | 'region' | 'class' | 'special' | 'showy';
  region?: 'varna' | 'desert' | 'sepidarun' | 'mahestan' | 'shanshin' | 'common' | string;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  icon: Icon,
  count,
  isActive = false,
  onClick,
  variant = 'filter',
  region,
  className = '',
}) => {
  const displayLabel = label ?? region ?? '';

  // Region palette mapping
  const regionStyles: Record<string, string> = {
    varna: 'bg-success/15 text-success border-success/35',
    desert: 'bg-warning/15 text-warning border-warning/35',
    sepidarun: 'bg-info/15 text-info border-info/35',
    mahestan: 'bg-info/15 text-info border-info/35',
    shanshin: 'bg-stat-ac/15 text-stat-ac border-stat-ac/35',
    common: 'bg-surface-3/15 text-text-muted border-border-strong/35',
  };

  if (variant === 'special') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-accent/20 text-accent border border-accent/40 text-xs font-bold shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (variant === 'showy') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-surface-3 text-text-muted border border-border text-xs font-bold shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (variant === 'region') {
    const regionKey = region ? region.toLowerCase() : 'common';
    const style = regionStyles[regionKey] || regionStyles.common;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] border text-xs font-bold shrink-0 ${style} ${className}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-surface-2 border border-border text-text-primary text-xs font-medium shrink-0 ${className}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{displayLabel}</span>
        {typeof count === 'number' && <span className="font-mono text-xs text-text-muted">({count})</span>}
      </span>
    );
  }

  // Interactive filter chip
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 border touch-target min-w-[44px] ${
        isActive
          ? 'bg-accent text-on-accent border-accent font-bold shadow-glow-amber'
          : 'bg-surface-2 text-text-muted hover:text-text-primary hover:bg-surface-2 border-border'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`font-mono text-xs ${isActive ? 'text-on-accent' : 'text-text-muted'}`}>
          ({count})
        </span>
      )}
    </button>
  );
};
