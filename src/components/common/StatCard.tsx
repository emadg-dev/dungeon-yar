import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  iconColor?: string;
  accentColor?: string;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-[#E0A030]',
  accentColor,
  onClick,
  isInteractive = false,
}) => {
  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`surface-card p-3 sm:p-3.5 flex flex-col justify-between relative transition-all duration-150 ${
        isInteractive
          ? 'cursor-pointer hover:border-[#E0A030]/50 active:scale-[0.98] active-amber touch-target'
          : ''
      }`}
      style={{
        borderTopColor: accentColor || undefined,
        borderTopWidth: accentColor ? '2px' : undefined,
      }}
    >
      <div className="flex items-center justify-between text-xs text-[#A39A89] font-medium mb-1.5">
        <span className="truncate">{label}</span>
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />}
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <span className="font-extrabold text-2xl sm:text-3xl text-[#EDE6D8] font-mono dice-ltr tracking-tight">
          {value}
        </span>
        {subValue && (
          <span className="text-[11px] text-[#A39A89] truncate">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
