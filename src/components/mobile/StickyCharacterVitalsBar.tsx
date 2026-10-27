import React from 'react';
import { Character } from '../../types';
import { Heart, Shield, AlertTriangle, Moon, Sun, Zap, Swords, Bot } from 'lucide-react';

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
    <div className="sticky top-[49px] sm:top-[53px] z-20 bg-[#131110]/95 backdrop-blur-md border-b border-[#E0A030]/20 px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
        {/* Top / Left: Identity & HP Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          {/* Identity info */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img
              src={character.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
              alt={character.name}
              loading="lazy"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#E0A030]/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate">
                <span className="font-black text-xs text-[#F2C265] truncate">{character.name}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#E0A030]/15 text-[#F2C265] font-bold shrink-0">
                  L{character.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#A39A89]">
                <span className="flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5 text-[#F2C265]" /> AC {character.ac}
                </span>
                {character.exhaustion > 0 && (
                  <span className="flex items-center gap-0.5 text-[#E8836B] font-bold">
                    <AlertTriangle className="w-2.5 h-2.5" /> {character.exhaustion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick HP Controls (>= 48px targets with >= 8px spacing) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => adjustHp(-1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#C2512B]/15 active:bg-[#C2512B]/15 border border-[#C2512B]/40 text-[#E8836B] font-black text-sm touch-target-lg select-none"
              title="کاهش ۱ جان"
            >
              -۱
            </button>

            {/* Current / Max HP Badge */}
            <div className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-[#171513] border border-[#3A342B] min-w-[58px] sm:min-w-[66px] min-h-[48px]">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-[#E8836B] fill-[#C2512B]/30" />
                <span className="font-mono font-black text-sm text-[#EDE6D8] num-ltr">
                  {character.hp.current}/{character.hp.max}
                </span>
              </div>
              <div className="w-full h-1 bg-[#201D19] rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${
                    hpPercent > 50 ? 'bg-[#6F9E78]' : hpPercent > 20 ? 'bg-[#E0A030]' : 'bg-[#C2512B]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => adjustHp(+1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#6F9E78]/15 active:bg-[#6F9E78]/15 border border-[#6F9E78]/40 text-[#6F9E78] font-black text-sm touch-target-lg select-none"
              title="افزایش ۱ جان"
            >
              +۱
            </button>
          </div>

          {/* Desktop Rest Triggers */}
          <div className="hidden md:flex items-center gap-2 ms-2">
            <button
              type="button"
              onClick={() => onOpenRest('short')}
              className="p-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#C9C0AE] text-xs font-bold touch-target"
              title="استراحت کوتاه"
            >
              <Moon className="w-4 h-4 text-[#F2C265]" />
            </button>
            <button
              type="button"
              onClick={() => onOpenRest('long')}
              className="p-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#C9C0AE] text-xs font-bold touch-target"
              title="استراحت بلند"
            >
              <Sun className="w-4 h-4 text-[#F2C265]" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Never wraps to two lines, scrolls horizontally, smooth and clean */}
        {onSelectSheetTab && (
          <div className="bg-[#171513] border border-[#2F2A23]/80 rounded-xl p-1 flex items-center gap-1 overflow-x-auto flex-nowrap scrollbar-none w-full sm:w-auto shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSheetTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => onSelectSheetTab(tab.id)}
                  className={`flex-1 sm:flex-initial py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target whitespace-nowrap ${
                    isActive
                      ? 'bg-[#E0A030] text-[#0E0D0C] font-black shadow-sm'
                      : 'text-[#A39A89] hover:text-[#EDE6D8]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-[#0E0D0C] text-[#F2C265]' : 'bg-[#201D19] text-[#A39A89]'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
