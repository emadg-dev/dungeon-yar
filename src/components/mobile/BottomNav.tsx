import React from 'react';
import { 
  Heart, Package, FileText, Compass, Dices, 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal 
} from 'lucide-react';

interface BottomNavProps {
  isDmView: boolean;
  playerTab: string;
  onSelectPlayerTab: (tab: any) => void;
  dmTab: string;
  onSelectDmTab: (tab: any) => void;
  onOpenDice: () => void;
  inventoryBadge?: number;
  notesBadge?: number;
  isKeyboardOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isDmView,
  playerTab,
  onSelectPlayerTab,
  dmTab,
  onSelectDmTab,
  onOpenDice,
  inventoryBadge = 0,
  notesBadge = 0,
  isKeyboardOpen = false,
}) => {
  // Hide bottom nav while on-screen keyboard is open to avoid covering inputs
  if (isKeyboardOpen) return null;

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
        className="fixed bottom-0 inset-x-0 z-[30] bg-[#171513]/95 backdrop-blur-md border-t border-[#2F2A23] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_25px_rgba(0,0,0,0.8)]"
        dir="rtl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
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
                onClick={() => onSelectDmTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 touch-target transition-all duration-150 relative ${
                  isActive
                    ? 'text-[#E0A030] font-extrabold'
                    : 'text-[#A39A89] hover:text-[#EDE6D8]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-xs leading-none font-semibold truncate">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0A030] shadow-[0_0_6px_#E0A030]" />
                )}
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
      className="fixed bottom-0 inset-x-0 z-[30] bg-[#171513]/95 backdrop-blur-md border-t border-[#2F2A23] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_25px_rgba(0,0,0,0.8)]"
      dir="rtl"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1 items-center">
        {/* 1. Sheet */}
        <button
          type="button"
          onClick={() => onSelectPlayerTab('overview')}
          className={`flex flex-col items-center justify-center gap-1 touch-target transition-all duration-150 relative ${
            isSheetTab
              ? 'text-[#E0A030] font-extrabold'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Heart className={`w-5 h-5 ${isSheetTab ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-none font-semibold truncate">شیت</span>
          {isSheetTab && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0A030] shadow-[0_0_6px_#E0A030]" />
          )}
        </button>

        {/* 2. Inventory */}
        <button
          type="button"
          onClick={() => onSelectPlayerTab('inventory')}
          className={`flex flex-col items-center justify-center gap-1 touch-target transition-all duration-150 relative ${
            playerTab === 'inventory'
              ? 'text-[#E0A030] font-extrabold'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${playerTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {inventoryBadge > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#E0A030] text-[#0E0D0C] text-[9px] font-black px-0.5">
                {inventoryBadge > 99 ? '99+' : inventoryBadge}
              </span>
            )}
          </div>
          <span className="text-xs leading-none font-semibold truncate">کوله</span>
          {playerTab === 'inventory' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0A030] shadow-[0_0_6px_#E0A030]" />
          )}
        </button>

        {/* 3. Center Raised Dice Button (FAB) */}
        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={onOpenDice}
            className="w-13 h-13 -mt-5 rounded-full bg-gradient-to-tr from-[#C97B4A] to-[#E0A030] hover:from-[#E0A030] hover:to-[#F2C265] text-[#0E0D0C] flex flex-col items-center justify-center shadow-[0_0_18px_rgba(224,160,48,0.45)] active:scale-95 transition-transform duration-150 border-2 border-[#171513] touch-target z-[35]"
            title="پرتاب سریع تاس"
            aria-label="باز کردن پنجره پرتاب تاس"
          >
            <Dices className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Notes */}
        <button
          type="button"
          onClick={() => onSelectPlayerTab('notes')}
          className={`flex flex-col items-center justify-center gap-1 touch-target transition-all duration-150 relative ${
            playerTab === 'notes'
              ? 'text-[#E0A030] font-extrabold'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${playerTab === 'notes' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {notesBadge > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#E0A030] text-[#0E0D0C] text-[9px] font-black px-0.5">
                {notesBadge > 99 ? '99+' : notesBadge}
              </span>
            )}
          </div>
          <span className="text-xs leading-none font-semibold truncate">یادداشت</span>
          {playerTab === 'notes' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0A030] shadow-[0_0_6px_#E0A030]" />
          )}
        </button>

        {/* 5. Codex */}
        <button
          type="button"
          onClick={() => onSelectPlayerTab('codex')}
          className={`flex flex-col items-center justify-center gap-1 touch-target transition-all duration-150 relative ${
            playerTab === 'codex'
              ? 'text-[#E0A030] font-extrabold'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Compass className={`w-5 h-5 ${playerTab === 'codex' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs leading-none font-semibold truncate">دانشنامه</span>
          {playerTab === 'codex' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0A030] shadow-[0_0_6px_#E0A030]" />
          )}
        </button>
      </div>
    </nav>
  );
};
