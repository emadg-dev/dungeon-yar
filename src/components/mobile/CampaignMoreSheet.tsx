/**
 * Flat, 1-tap campaign secondary sheet (removes nested collapsible menus).
 */
import React from 'react';
import { Button } from '../ui/Button';
import {
  Package, Users, Coffee, CalendarDays, FileText, Settings, LogOut, Sparkles
} from 'lucide-react';

interface CampaignMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onJump: (key: string) => void;
}

export const CampaignMoreSheet: React.FC<CampaignMoreSheetProps> = ({ isOpen, onClose, onJump }) => {
  if (!isOpen) return null;

  const items = [
    { id: 'inventory', label: 'کوله‌پشتی', icon: Package },
    { id: 'companions', label: 'همراهان', icon: Users },
    { id: 'rest', label: 'استراحت', icon: Coffee },
    { id: 'sessions', label: 'جلسات', icon: CalendarDays },
    { id: 'recaps', label: 'خلاصه‌ها', icon: FileText },
    { id: 'members', label: 'اعضا', icon: Sparkles },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
    { id: 'logout', label: 'خروج', icon: LogOut },
  ];

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface/95 border-t border-accent/20 rounded-t-3xl p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-accent-hover">بیشتر</h2>
          <Button onClick={onClose} className="p-2 rounded-xl hover:bg-accent/10 text-text-muted hover:text-text-primary" aria-label="بستن">✕</Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map(it => {
            const Icon = it.icon;
            return (
              <Button
                key={it.id}
                onClick={() => { onJump(it.id); onClose(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-2/60 hover:bg-accent/10 border border-border hover:border-accent/40 transition touch-target min-h-[64px]"
              >
                <Icon className="w-6 h-6 text-accent stroke-[2]" />
                <span className="text-xs font-bold text-text-primary whitespace-nowrap">{it.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
