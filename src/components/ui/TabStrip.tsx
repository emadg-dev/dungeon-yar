import React, { useRef, useEffect } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto scroll active tab into view in RTL
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      dir="rtl"
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            ref={isActive ? activeBtnRef : undefined}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0 ${
              isActive
                ? variant === 'pill'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'text-amber-400 border-b-2 border-amber-400 rounded-b-none'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850 bg-stone-900/40'
            } ${tab.disabled ? 'opacity-30 pointer-events-none' : 'active:scale-95'}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
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
    </div>
  );
};
