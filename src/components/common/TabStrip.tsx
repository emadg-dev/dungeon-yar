import React, { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeColor?: string;
}

interface TabStripProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onSelectTab: (tabId: T) => void;
  className?: string;
}

export function TabStrip<T extends string = string>({
  tabs,
  activeTab,
  onSelectTab,
  className = '',
}: TabStripProps<T>) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active tab into view horizontally
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 -mx-1 overscroll-contain ${className}`}
      dir="rtl"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            ref={isActive ? activeTabRef : null}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 touch-target relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E0A030]/30 active:scale-[.98] ${
              isActive
                ? 'bg-gradient-to-tr from-[#E0A030] to-[#F2C265] text-[#0E0D0C] shadow-[0_2px_10px_rgba(224,160,48,0.35)]'
                : 'bg-[#201D19]/80 backdrop-blur-sm text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621] border border-[#2F2A23]'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0E0D0C]' : 'text-[#A39A89]'}`} />}
            <span>{tab.label}</span>

            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-[#0E0D0C] text-[#E0A030]'
                    : 'bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/40'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
