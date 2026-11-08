import React from 'react';
import { Button } from '../ui/Button';
import {
  Heart, Dices, FileText, Compass, MoreHorizontal,
  Shield, UserCheck, LayoutDashboard, User
} from 'lucide-react';

interface BottomNavProps {
  isHomeView?: boolean;
  homeTab?: string;
  onSelectHomeTab?: (tab: string) => void;
  isDmView: boolean;
  playerTab: string;
  onSelectPlayerTab: (tab: string) => void;
  dmTab: string;
  onSelectDmTab: (tab: string) => void;
  onOpenDice: () => void;
  onOpenCampaignMore?: () => void;
  inventoryBadge?: number;
  notesBadge?: number;
  isKeyboardOpen?: boolean;
  hasActiveEncounter?: boolean;
  onOpenActiveEncounter?: () => void;
  isInCombat?: boolean;
  queueLength?: number;
  isOnline?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isHomeView = false,
  homeTab = 'campaigns',
  onSelectHomeTab,
  isDmView,
  playerTab,
  onSelectPlayerTab,
  dmTab,
  onSelectDmTab,
  onOpenDice,
  onOpenCampaignMore,
  inventoryBadge = 0,
  notesBadge = 0,
  isKeyboardOpen = false,
}) => {
  if (isKeyboardOpen) return null;

  if (isHomeView) {
    const homeItems = [
      { id: 'campaigns', label: 'کمپین‌ها', icon: Shield },
      { id: 'characters', label: 'شخصیت‌ها', icon: Heart },
      { id: 'invites', label: 'دعوت‌ها', icon: UserCheck },
      { id: 'account', label: 'حساب', icon: User },
    ];
    return (
      <nav aria-label="منوی ناوبری اصلی" className="liquid-dock" dir="rtl">
        <div className="liquid-dock__track flex justify-around">
          {homeItems.map(item => {
            const Icon = item.icon;
            const isActive = homeTab === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-pressed={isActive}
                onClick={() => onSelectHomeTab?.(item.id)}
                className={`liquid-dock__item touch-target mx-auto ${isActive ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="dock-label whitespace-nowrap">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (isDmView) {
    const dmItems = [
      { id: 'dm', label: 'میز مستر', icon: LayoutDashboard },
      { id: 'sheet', label: 'برگه', icon: Heart },
      { id: 'dice', label: 'تاس', icon: Dices },
      { id: 'notes', label: 'یادداشت', icon: FileText },
      { id: 'world', label: 'جهان', icon: Compass },
    ];
    return (
      <nav aria-label="منوی ناوبری دانجن مستر" className="liquid-dock" dir="rtl">
        <div className="liquid-dock__track flex justify-around">
          {dmItems.map(item => {
            const Icon = item.icon;
            const isActive = dmTab === item.id || (item.id === 'sheet' && (dmTab === 'overview' || dmTab === 'abilities' || dmTab === 'combat')) || (item.id === 'world' && (dmTab === 'library' || dmTab === 'map'));
            return (
              <Button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-pressed={isActive}
                onClick={() => {
                  if (item.id === 'dm') onSelectDmTab('dashboard');
                  else if (item.id === 'sheet') onSelectDmTab('dashboard');
                  else if (item.id === 'dice' && onOpenDice) { onOpenDice(); }
                  else if (item.id === 'notes') onSelectDmTab('narrative');
                  else if (item.id === 'world') onSelectDmTab('library');
                  else onSelectDmTab(item.id);
                }}
                className={`liquid-dock__item touch-target mx-auto ${isActive ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="dock-label whitespace-nowrap">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }

  const playerItems = [
    { id: 'sheet', label: 'برگه', icon: Heart },
    { id: 'notes', label: 'یادداشت', icon: FileText },
    { id: 'dice', label: 'تاس', icon: Dices },
    { id: 'world', label: 'جهان', icon: Compass },
    { id: 'more', label: 'بیشتر', icon: MoreHorizontal },
  ];

  return (
    <nav aria-label="منوی ناوبری بازیکن" className="liquid-dock" dir="rtl">
      <div className="liquid-dock__track flex justify-around items-center">
        {playerItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = playerTab === item.id || (item.id === 'sheet' && (playerTab === 'overview' || playerTab === 'abilities' || playerTab === 'combat' || playerTab === 'companions' || playerTab === 'inventory')) || (item.id === 'world' && (playerTab === 'codex' || playerTab === 'map'));
          const isCenter = i === 2; // Dice in center
          if (isCenter) {
            return (
              <Button
                key={item.id}
                type="button"
                onClick={onOpenDice}
                className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-warning to-accent text-on-accent flex items-center justify-center shadow-glow-amber-lg hover:scale-105 active:scale-95 transition touch-target z-[35]"
                aria-label="پرتاب تاس"
              >
                <Dices className="w-6 h-6 stroke-[2.5]" />
              </Button>
            );
          }
          return (
            <Button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              onClick={() => {
                if (item.id === 'more') onOpenCampaignMore?.();
                else if (item.id === 'sheet') onSelectPlayerTab('overview');
                else if (item.id === 'world') onSelectPlayerTab('codex');
                else onSelectPlayerTab(item.id);
              }}
              className={`liquid-dock__item touch-target mx-auto ${isActive ? 'liquid-dock__item--active font-extrabold' : 'font-semibold'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="dock-label whitespace-nowrap">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};