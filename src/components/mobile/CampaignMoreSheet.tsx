/**
 * Flat, 1-tap campaign secondary sheet.
 * Built on BottomSheet so Escape, the Android back button, drag-to-close and
 * safe-area padding behave like every other sheet in the app.
 */
import React from 'react';
import { Button } from '../ui/Button';
import { BottomSheet } from './BottomSheet';
import {
  Package, Users, Bot, Moon, CalendarDays, FileText, Settings, LogOut, ChevronLeft, Compass
} from 'lucide-react';

interface CampaignMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onJump: (key: string) => void;
}

const items = [
  { id: 'inventory', label: 'کوله‌پشتی', icon: Package },
  { id: 'map', label: 'نقشه جهان', icon: Compass },
  { id: 'companions', label: 'یاران', icon: Bot },
  { id: 'rest', label: 'استراحت', icon: Moon },
  { id: 'sessions', label: 'جلسات', icon: CalendarDays },
  { id: 'recaps', label: 'خلاصه‌ها', icon: FileText },
  { id: 'members', label: 'اعضا', icon: Users },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const rowClass =
  'w-full min-h-[48px] flex items-center gap-3 px-3 text-sm text-start transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

export const CampaignMoreSheet: React.FC<CampaignMoreSheetProps> = ({ isOpen, onClose, onJump }) => {
  if (!isOpen) return null;

  const jump = (id: string) => {
    onJump(id);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="بیشتر" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface-2/40 divide-y divide-border overflow-hidden">
          {items.map(it => {
            const Icon = it.icon;
            return (
              <Button key={it.id} type="button" onClick={() => jump(it.id)} className={`${rowClass} text-text-primary`}>
                <Icon className="w-5 h-5 text-text-muted shrink-0" />
                <span className="flex-1 min-w-0 truncate">{it.label}</span>
                <ChevronLeft className="w-4 h-4 text-text-disabled shrink-0" aria-hidden="true" />
              </Button>
            );
          })}
        </div>

        {/* Leaving is kept apart from navigation so it is never tapped by accident */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Button type="button" onClick={() => jump('logout')} className={`${rowClass} text-danger`}>
            <LogOut className="w-5 h-5 shrink-0" />
            <span>خروج از حساب</span>
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};