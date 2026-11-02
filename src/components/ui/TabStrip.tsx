import React from 'react';
import { ScrollableRow } from './ScrollableRow';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabStripProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill',
}) => {
  return (
    <ScrollableRow
      activeKey={activeTab}
      role="tablist"
      dir="rtl"
      wrapperClassName={className}
      className="py-1 px-1 gap-1.5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            data-key={tab.id}
            data-tab={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 snap-start flex items-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isActive
                ? variant === 'pill'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-amber-400 border-b-2 border-amber-400 rounded-b-none'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850 bg-stone-900/40'
            } ${tab.disabled ? 'opacity-30 pointer-events-none' : 'active:scale-95'}`}
          >
            {tab.icon && <span className="shrink-0 inline-flex items-center">{tab.icon}</span>}
            <span className="whitespace-nowrap shrink-0">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </ScrollableRow>
  );
};
