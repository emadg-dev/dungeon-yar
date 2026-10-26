import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ChipProps {
  label: string;
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
  // Region palette mapping
  const regionStyles: Record<string, string> = {
    varna: 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/35',
    desert: 'bg-[#C97B4A]/15 text-[#C97B4A] border-[#C97B4A]/35',
    sepidarun: 'bg-[#7FB4D6]/15 text-[#7FB4D6] border-[#7FB4D6]/35',
    mahestan: 'bg-[#9AA3AD]/15 text-[#9AA3AD] border-[#9AA3AD]/35',
    shanshin: 'bg-[#D6B25E]/15 text-[#D6B25E] border-[#D6B25E]/35',
    common: 'bg-[#8C8576]/15 text-[#8C8576] border-[#8C8576]/35',
  };

  if (variant === 'special') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/40 text-[11px] font-bold shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </span>
    );
  }

  if (variant === 'showy') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#2F2A23] text-[#A39A89] border border-[#2F2A23] text-[11px] font-bold shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </span>
    );
  }

  if (variant === 'region') {
    const regionKey = region ? region.toLowerCase() : 'common';
    const style = regionStyles[regionKey] || regionStyles.common;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] border text-[11px] font-bold shrink-0 ${style} ${className}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] text-[11px] font-medium shrink-0 ${className}`}>
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
        {typeof count === 'number' && <span className="font-mono text-[10px] text-[#A39A89]">({count})</span>}
      </span>
    );
  }

  // Interactive filter chip
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 border touch-target ${
        isActive
          ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030] font-bold shadow-[0_0_10px_rgba(224,160,48,0.25)]'
          : 'bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621] border-[#2F2A23]'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`font-mono text-[10px] ${isActive ? 'text-[#0E0D0C]' : 'text-[#A39A89]'}`}>
          ({count})
        </span>
      )}
    </button>
  );
};
