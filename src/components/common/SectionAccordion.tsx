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
        className="w-full p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-start cursor-pointer hover:bg-surface-2/60 transition-colors duration-150 touch-target min-w-[44px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {Icon && (
            <div className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-accent shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-text-primary truncate">{title}</span>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ms-2">
          {headerRight}
          <div
            className={`w-7 h-7 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center text-text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 pt-1 border-t border-border/80 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
