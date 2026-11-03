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
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 snap-start flex items-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? variant === 'pill'
                  ? 'bg-accent text-on-accent shadow-md font-bold'
                  : 'text-accent border-b-2 border-accent rounded-b-none'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-2 bg-surface/50'
            } ${tab.disabled ? 'opacity-30 pointer-events-none' : 'active:scale-95'}`}
          >
            {tab.icon && <span className="shrink-0 inline-flex items-center">{tab.icon}</span>}
            <span className="whitespace-nowrap shrink-0">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-on-accent text-accent' : 'bg-surface-2 text-text-muted'
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
