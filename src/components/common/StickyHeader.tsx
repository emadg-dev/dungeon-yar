import React, { useState, useEffect } from 'react';
import { Character } from '../../types';
import { Heart, Shield, AlertTriangle, Moon, Sun, Zap, Swords, Sparkles, Bot, Layers } from 'lucide-react';
import { TabStrip, TabItem } from './TabStrip';

export type SheetTab = 'overview' | 'abilities' | 'combat' | 'features' | 'companions' | 'resources';

interface StickyHeaderProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  onOpenRest: (type: 'short' | 'long' | 'special') => void;
  activeSheetTab: SheetTab;
  onSelectSheetTab: (tab: SheetTab) => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  character,
  onUpdate,
  onOpenRest,
  activeSheetTab,
  onSelectSheetTab,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const adjustHp = (delta: number) => {
    const nextCurrent = Math.max(
      0,
      Math.min(character.hp.max + (character.hp.temp || 0), character.hp.current + delta)
    );
    onUpdate({
      ...character,
      hp: { ...character.hp, current: nextCurrent },
    });
  };

  const hasCompanions = (character.companions && character.companions.length > 0) || character.className.includes('پیمانبان');

  const tabs: TabItem<SheetTab>[] = [
    { id: 'overview', label: 'نمای کلی', icon: Heart },
    { id: 'abilities', label: 'ویژگی‌ها', icon: Zap },
    { id: 'combat', label: 'مبارزه', icon: Swords },
    { id: 'features', label: 'توانایی‌ها', icon: Sparkles },
    ...(hasCompanions
      ? [{ id: 'companions' as SheetTab, label: 'یاران', icon: Bot, badge: character.companions?.length }]
      : []),
    { id: 'resources', label: 'منابع', icon: Layers, badge: character.customResources?.length },
  ];

  const hpPercent = Math.min(100, Math.round((character.hp.current / Math.max(1, character.hp.max)) * 100));
  const hpColor =
    hpPercent > 50 ? 'bg-[#6F9E78]' : hpPercent > 20 ? 'bg-[#E0A030]' : 'bg-[#C2512B]';

  return (
    <div
      className="sticky top-[49px] sm:top-[53px] z-20 bg-[#171513]/95 backdrop-blur-md border-b border-[#2F2A23] px-2.5 sm:px-4 py-1.5 transition-all duration-150 shadow-md"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        {/* Top: Character Info & Wide HP Controls */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Identity Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={character.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80'}
              alt={character.name}
              loading="lazy"
              decoding="async"
              className={`rounded-[10px] object-cover border border-[#2F2A23] shrink-0 transition-all duration-150 ${
                isScrolled ? 'w-7 h-7' : 'w-9 h-9 sm:w-10 sm:h-10'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-xs sm:text-sm text-[#EDE6D8] truncate">
                  {character.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 font-bold shrink-0">
                  سطح {character.level}
                </span>
              </div>

              {!isScrolled && (
                <div className="flex items-center gap-2 text-[11px] text-[#A39A89] mt-0.5 truncate">
                  <span>{character.className}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-[#EDE6D8] font-bold">
                    <Shield className="w-3 h-3 text-[#E0A030]" /> AC {character.ac}
                  </span>
                  {character.exhaustion > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[#C2512B] font-bold">
                      <AlertTriangle className="w-3 h-3" /> خستگی {character.exhaustion}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Wide HP Bar & 48px Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => adjustHp(-1)}
              className="touch-target-lg w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#C2512B] hover:border-[#C2512B]/60 font-black text-sm active:scale-95"
              title="کاهش ۱ جان"
            >
              -۱
            </button>

            {/* HP Value Display */}
            <div className="flex flex-col items-center justify-center px-2 py-1 rounded-[12px] bg-[#201D19] border border-[#2F2A23] min-w-[62px] min-h-[48px]">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-[#C2512B] fill-[#C2512B]/30" />
                <span className="font-mono font-extrabold text-sm text-[#EDE6D8] dice-ltr">
                  {character.hp.current}/{character.hp.max}
                </span>
              </div>
              <div className="w-full h-1 bg-[#171513] rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${hpColor}`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => adjustHp(1)}
              className="touch-target-lg w-12 h-12 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-[#6F9E78] hover:border-[#6F9E78]/60 font-black text-sm active:scale-95"
              title="افزایش ۱ جان"
            >
              +۱
            </button>
          </div>
        </div>

        {/* Bottom: Sticky Sub-Tab Strip */}
        <TabStrip
          tabs={tabs}
          activeTab={activeSheetTab}
          onSelectTab={onSelectSheetTab}
          className="pt-0.5"
        />
      </div>
    </div>
  );
};
