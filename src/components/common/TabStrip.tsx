import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ScrollableRow } from '../ui/ScrollableRow';
import { Button } from '../ui/Button';

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
  return (
    <ScrollableRow
      activeKey={activeTab}
      role="tablist"
      dir="rtl"
      wrapperClassName={className}
      className="py-1 px-1 -mx-1 gap-1.5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Button
            key={tab.id}
            data-key={tab.id}
            data-tab={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 snap-start touch-target min-w-[44px] relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 active:scale-[.98] ${
              isActive
                ? 'bg-gradient-to-tr from-accent to-accent-hover text-on-accent shadow-glow-amber'
                : 'bg-surface-2/80 backdrop-blur-sm text-text-muted hover:text-text-primary hover:bg-surface-2 border border-border'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-on-accent' : 'text-text-muted'}`} />}
            <span className="whitespace-nowrap shrink-0">{tab.label}</span>

            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${
                  isActive
                    ? 'bg-bg text-accent'
                    : 'bg-accent/20 text-accent border border-accent/40'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Button>
        );
      })}
    </ScrollableRow>
  );
}
