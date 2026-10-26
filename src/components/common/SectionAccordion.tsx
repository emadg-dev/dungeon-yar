import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface SectionAccordionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
  className = '',
  headerRight,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`surface-card overflow-hidden transition-all duration-150 ${className}`} dir="rtl">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-right cursor-pointer hover:bg-[#201D19]/60 transition-colors duration-150 touch-target"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {Icon && (
            <div className="w-8 h-8 rounded-[10px] bg-[#201D19] border border-[#2F2A23] flex items-center justify-center text-[#E0A030] shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#EDE6D8] truncate">{title}</span>
              {badge}
            </div>
            {subtitle && <p className="text-[11px] text-[#A39A89] truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ms-2">
          {headerRight}
          <div
            className={`w-7 h-7 rounded-[8px] bg-[#201D19] border border-[#2F2A23] flex items-center justify-center text-[#A39A89] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#E0A030]' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-1 border-t border-[#2F2A23]/80 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
