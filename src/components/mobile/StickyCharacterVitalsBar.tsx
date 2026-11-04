import React from 'react';
import { Character } from '../../types';
import { Heart, Shield, AlertTriangle, Moon, Sun, Zap, Swords, Bot } from 'lucide-react';
import { Button } from '../ui/Button';

interface StickyCharacterVitalsBarProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  onOpenRest: (type: 'short' | 'long' | 'special') => void;
  activeSheetTab?: 'overview' | 'abilities' | 'combat' | 'companions';
  onSelectSheetTab?: (tab: 'overview' | 'abilities' | 'combat' | 'companions') => void;
}

export const StickyCharacterVitalsBar: React.FC<StickyCharacterVitalsBarProps> = ({
  character,
  onUpdate,
  onOpenRest,
  activeSheetTab = 'overview',
  onSelectSheetTab,
}) => {
  const hpPercent = Math.min(100, Math.round((character.hp.current / Math.max(1, character.hp.max)) * 100));

  const adjustHp = (delta: number) => {
    const nextCurrent = Math.max(0, Math.min(character.hp.max + (character.hp.temp || 0), character.hp.current + delta));
    onUpdate({
      ...character,
      hp: { ...character.hp, current: nextCurrent }
    });
  };

  interface TabItem {
    id: 'overview' | 'abilities' | 'combat' | 'companions';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const companionCount = character.companions?.length || 0;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'نمای کلی', icon: Heart },
    { id: 'abilities', label: 'ویژگی‌ها', icon: Zap },
    { id: 'combat', label: 'مبارزه', icon: Swords },
    { id: 'companions', label: 'یاران', icon: Bot, badge: companionCount > 0 ? companionCount : undefined },
  ];

  return (
    <div className="sticky top-[var(--app-header-h,3.5rem)] z-20 bg-bg/95 backdrop-blur-md border-b border-accent/20 px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
        {/* Top / Left: Identity & HP Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          {/* Identity info */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img
              src={character.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
              alt={character.name}
              loading="lazy"
              decoding="async"
              width={32}
              height={32}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-accent/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate">
                <span className="font-black text-xs text-accent-hover truncate">{character.name}</span>
                <span className="text-xs px-1 py-0.2 rounded bg-accent/15 text-accent-hover font-bold shrink-0">
                  L{character.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="flex items-center gap-0.5">
                  <Shield className="w-3.5 h-3.5 text-accent-hover" /> AC {character.ac}
                </span>
                {character.exhaustion > 0 && (
                  <span className="flex items-center gap-0.5 text-danger font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {character.exhaustion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick HP Controls (>= 48px targets with >= 8px spacing) */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => adjustHp(-1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-danger/15 active:bg-danger/15 border border-danger/40 text-danger font-black text-sm touch-target select-none"
              title="کاهش ۱ جان"
            >
              -۱
            </Button>

            {/* Current / Max HP Badge */}
            <div className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-surface border border-border-strong min-w-[58px] sm:min-w-[66px] min-h-[48px]">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-danger fill-danger/30" />
                <span className="font-mono font-black text-sm text-text-primary num-ltr">
                  {character.hp.current}/{character.hp.max}
                </span>
              </div>
              <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${
                    hpPercent > 50 ? 'bg-success' : hpPercent > 20 ? 'bg-accent' : 'bg-danger'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() => adjustHp(+1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-success/15 active:bg-success/15 border border-success/40 text-success font-black text-sm touch-target select-none"
              title="افزایش ۱ جان"
            >
              +۱
            </Button>
          </div>

          {/* Desktop Rest Triggers */}
          <div className="hidden md:flex items-center gap-2 ms-2">
            <Button
              type="button"
              onClick={() => onOpenRest('short')}
              className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold touch-target min-w-[44px]"
              title="استراحت کوتاه"
            >
              <Moon className="w-4 h-4 text-accent-hover" />
            </Button>
            <Button
              type="button"
              onClick={() => onOpenRest('long')}
              className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold touch-target min-w-[44px]"
              title="استراحت بلند"
            >
              <Sun className="w-4 h-4 text-accent-hover" />
            </Button>
          </div>
        </div>

        {/* Sub-Tabs: Never wraps to two lines, scrolls horizontally, smooth and clean */}
        {onSelectSheetTab && (
          <div className="bg-surface border border-border/80 rounded-xl p-1.5 flex items-center gap-2 overflow-x-auto flex-nowrap scrollbar-none w-full sm:w-auto shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSheetTab === tab.id;
              return (
                <Button
                  type="button"
                  key={tab.id}
                  onClick={() => onSelectSheetTab(tab.id)}
                  className={`flex-1 sm:flex-initial py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 touch-target min-w-[44px] whitespace-nowrap ${
                    isActive
                      ? 'bg-accent text-on-accent font-black shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-bg text-accent-hover' : 'bg-surface-2 text-text-muted'}`}>
                      {tab.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};