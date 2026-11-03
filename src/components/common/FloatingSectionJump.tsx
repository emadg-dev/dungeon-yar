/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bookmark, ChevronUp, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SectionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FloatingSectionJumpProps {
  sections: SectionItem[];
  className?: string;
}

/**
 * Lightweight floating "jump to section" pill for long mobile pages.
 * Flattens navigation depth by providing 1-tap access to any section on the page.
 */
export const FloatingSectionJump: React.FC<FloatingSectionJumpProps> = ({
  sections,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleJump = (sectionId: string) => {
    setIsOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <div 
      className={`fixed bottom-22 end-4 z-20 md:hidden print:hidden select-none ${className}`}
      dir="rtl"
    >
      {/* Expanded quick-jump popover */}
      {isOpen && (
        <div 
          className="mb-2 w-52 rounded-2xl bg-surface/95 border border-accent/40 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
          role="dialog"
          aria-label="پرش سریع به بخش"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1 px-2 border-b border-border">
            <span className="text-xs font-black text-accent-hover flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              پرش به بخش
            </span>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary transition touch-target min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="بستن منوی پرش"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar py-0.5">
            {sections.map(sec => (
              <Button
                key={sec.id}
                type="button"
                onClick={() => handleJump(sec.id)}
                className="w-full text-start px-2.5 py-2 rounded-xl text-xs font-bold text-text-primary hover:bg-accent/15 hover:text-accent-hover transition flex items-center justify-between gap-2 touch-target min-h-[38px]"
              >
                <span className="truncate">{sec.label}</span>
                {sec.icon ? (
                  <span className="shrink-0 text-accent">{sec.icon}</span>
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Floating button */}
      <Button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label="دسترسی سریع به بخش‌های صفحه"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface/90 hover:bg-surface-2 border border-accent/40 text-accent-hover shadow-lg shadow-black/60 backdrop-blur-md active:scale-95 transition-all text-xs font-bold min-h-[44px] min-w-[44px] touch-target"
      >
        <Bookmark className="w-4 h-4 text-accent" />
        <span className="text-xs font-extrabold whitespace-nowrap">بخش‌ها</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : 'text-text-muted'}`} />
      </Button>
    </div>
  );
};
