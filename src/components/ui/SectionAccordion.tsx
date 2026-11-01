import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SectionAccordionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (nextOpen: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  subtitle,
  badge,
  icon,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextState = !open;
    if (!isControlled) setInternalIsOpen(nextState);
    onToggle?.(nextState);
  };

  return (
    <div className={`border border-stone-800 rounded-2xl bg-stone-900/60 overflow-hidden transition-colors ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        style={{ touchAction: 'manipulation' }}
        className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-start hover:bg-stone-850/60 transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-amber-400 shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-100 truncate">{title}</span>
              {badge && <span className="shrink-0">{badge}</span>}
            </div>
            {subtitle && (
              <p className="text-xs text-stone-400 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180 text-amber-400' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-800/60 animate-in fade-in-0 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
