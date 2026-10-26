import React from 'react';
import { 
  Heart, Package, FileText, Compass, Dices, 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal, Shield 
} from 'lucide-react';

interface BottomNavProps {
  isHomeView?: boolean;
  homeTab?: 'home' | 'characters' | 'campaigns' | 'account';
  onSelectHomeTab?: (tab: any) => void;
  isDmView: boolean;
  playerTab: string;
  onSelectPlayerTab: (tab: any) => void;
  dmTab: string;
  onSelectDmTab: (tab: any) => void;
  onOpenDice: () => void;
  inventoryBadge?: number;
  notesBadge?: number;
  isKeyboardOpen?: boolean;
  hasActiveEncounter?: boolean;
  onOpenActiveEncounter?: () => void;
}

/**
 * Liquid Dock bottom navigation (Jib-be-jib §5 pattern):
 * floating glass track with backdrop-blur, inner top glow,
 * and an amber gradient pill on the active item.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  isHomeView = false,
  homeTab = 'home',
  onSelectHomeTab,
  isDmView,
  playerTab,
  onSelectPlayerTab,
  dmTab,
  onSelectDmTab,
  onOpenDice,
  inventoryBadge = 0,
  notesBadge = 0,
  isKeyboardOpen = false,
  hasActiveEncounter = false,
  onOpenActiveEncounter,
}) => {
  // Hide bottom nav while on-screen keyboard is open to avoid covering inputs
  if (isKeyboardOpen) return null;

  // Home Navigation (Section 5: خانه / شخصیت‌ها / کمپین‌ها / حساب)
  if (isHomeView) {
    const homeItems = [
      { id: 'home', label: 'خانه', icon: Compass },
      { id: 'characters', label: 'شخصیت‌ها', icon: Heart },
      { id: 'campaigns', label: 'کمپین‌ها', icon: Shield },
      { id: 'account', label: 'حساب', icon: MoreHorizontal },
    ] as const;

    return (
      <nav 
        aria-label="منوی ناوبری اصلی"
        className="liquid-dock"
        dir="rtl"
      >
        <div className="liquid-dock__track grid grid-cols-4">
          {homeItems.map(item => {
            const Icon = item.icon;
            const isActive = homeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                aria-label={item.label}
                aria-pressed={isActive}
                onClick={() => onSelectHomeTab?.(item.id)}
                className={`liquid-dock__item mx-auto ${isActive ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="dock-label truncate max-w-[3.5rem]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (isDmView) {
    const dmItems = [
      { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
      { id: 'encounters', label: 'مبارزات', icon: Swords },
      { id: 'library', label: 'کتابخانه', icon: Library },
      { id: 'narrative', label: 'روایت', icon: Scroll },
      { id: 'more', label: 'بیشتر', icon: MoreHorizontal },
    ] as const;

    return (
      <nav 
        aria-label="منوی ناوبری دانجن مستر"
        className="liquid-dock"
        dir="rtl"
      >
        {/* Active Encounter Quick Join Bar on BottomNav */}
        {hasActiveEncounter && onOpenActiveEncounter && (
          <button
            type="button"
            onClick={onOpenActiveEncounter}
            className="liquid-dock__banner w-full flex items-center justify-center gap-2 mb-2 py-1.5 rounded-2xl bg-gradient-to-r from-[#C2512B] via-[#E0A030] to-[#C2512B] text-[11px] font-black text-[#0E0D0C] shadow-[0_4px_16px_rgba(194,81,43,0.35)] hover:opacity-95 transition pointer-events-auto"
          >
            <Swords className="w-3.5 h-3.5 animate-bounce shrink-0" />
            <span>مبارزه زنده در جریان است — لمس جهت مشاهده</span>
          </button>
        )}
        <div className="liquid-dock__track grid grid-cols-5">
          {dmItems.map(item => {
            const Icon = item.icon;
            // Map sub-tabs to 5 primary DM items
            const isActive =
              dmTab === item.id ||
              (item.id === 'library' && (dmTab === 'npcs' || dmTab === 'items' || dmTab === 'rewards')) ||
              (item.id === 'narrative' && (dmTab === 'calendar' || dmTab === 'endings' || dmTab === 'notes')) ||
              (item.id === 'more' && (dmTab === 'settings' || dmTab === 'users'));

            return (
              <button
                type="button"
                key={item.id}
                aria-label={item.label}
                aria-pressed={isActive}
                onClick={() => onSelectDmTab(item.id)}
                className={`liquid-dock__item mx-auto ${isActive ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="dock-label truncate max-w-[3.5rem]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Player Navigation (5): Sheet / Inventory / Dice (center raised) / Notes / Codex
  const isSheetTab = ['overview', 'abilities', 'combat', 'features', 'companions', 'resources'].includes(playerTab);

  return (
    <nav 
      aria-label="منوی ناوبری بازیکن"
      className="liquid-dock"
      dir="rtl"
    >
      {/* Active Encounter Quick Join Bar on BottomNav */}
      {hasActiveEncounter && onOpenActiveEncounter && (
        <button
          type="button"
          onClick={onOpenActiveEncounter}
          className="liquid-dock__banner w-full flex items-center justify-center gap-2 mb-2 py-1.5 rounded-2xl bg-gradient-to-r from-[#C2512B] via-[#E0A030] to-[#C2512B] text-[11px] font-black text-[#0E0D0C] shadow-[0_4px_16px_rgba(194,81,43,0.35)] hover:opacity-95 transition pointer-events-auto"
        >
          <Swords className="w-3.5 h-3.5 animate-bounce shrink-0" />
          <span>مبارزه زنده در جریان است — لمس جهت مشاهده</span>
        </button>
      )}
      <div className="liquid-dock__track grid grid-cols-5 items-center">
        {/* 1. Sheet */}
        <button
          type="button"
          aria-label="شیت شخصیت"
          aria-pressed={isSheetTab}
          onClick={() => onSelectPlayerTab('overview')}
          className={`liquid-dock__item mx-auto relative ${isSheetTab ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${isSheetTab ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {hasActiveEncounter && (
              <span 
                onClick={(e) => {
                  if (onOpenActiveEncounter) {
                    e.stopPropagation();
                    onOpenActiveEncounter();
                  }
                }}
                className="absolute -top-1.5 -end-2 w-4 h-4 rounded-full bg-[#C2512B] text-white flex items-center justify-center animate-pulse border border-[#F2C265] shadow-[0_0_8px_rgba(194,81,43,0.8)]"
                title="مبارزه زنده"
              >
                <Swords className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <span className="dock-label truncate">شیت</span>
        </button>

        {/* 2. Inventory */}
        <button
          type="button"
          aria-label="کوله‌پشتی"
          aria-pressed={playerTab === 'inventory'}
          onClick={() => onSelectPlayerTab('inventory')}
          className={`liquid-dock__item mx-auto relative ${playerTab === 'inventory' ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${playerTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {inventoryBadge > 0 && (
              <span className="absolute -top-1 -end-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#E0A030] text-[#0E0D0C] text-[9px] font-black px-0.5 border border-[#171513]">
                {inventoryBadge > 99 ? '99+' : inventoryBadge}
              </span>
            )}
          </div>
          <span className="dock-label truncate">کوله</span>
        </button>

        {/* 3. Center Raised Dice Button (FAB) */}
        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={onOpenDice}
            className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(224,160,48,0.5),0_4px_12px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-[#171513] touch-target z-[35]"
            title="پرتاب سریع تاس"
            aria-label="باز کردن پنجره پرتاب تاس"
          >
            <Dices className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Notes */}
        <button
          type="button"
          aria-label="یادداشت‌ها"
          aria-pressed={playerTab === 'notes'}
          onClick={() => onSelectPlayerTab('notes')}
          className={`liquid-dock__item mx-auto relative ${playerTab === 'notes' ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${playerTab === 'notes' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {notesBadge > 0 && (
              <span className="absolute -top-1 -end-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#E0A030] text-[#0E0D0C] text-[9px] font-black px-0.5 border border-[#171513]">
                {notesBadge > 99 ? '99+' : notesBadge}
              </span>
            )}
          </div>
          <span className="dock-label truncate">یادداشت</span>
        </button>

        {/* 5. Codex */}
        <button
          type="button"
          aria-label="دانشنامه"
          aria-pressed={playerTab === 'codex'}
          onClick={() => onSelectPlayerTab('codex')}
          className={`liquid-dock__item mx-auto ${playerTab === 'codex' ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
        >
          <Compass className={`w-5 h-5 ${playerTab === 'codex' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="dock-label truncate">دانشنامه</span>
        </button>
      </div>
    </nav>
  );
};
