import React from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  isDestructive?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
}) => {
  if (!isOpen) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="space-y-2 py-1" dir="rtl">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full p-3.5 rounded-[12px] flex flex-wrap items-center justify-between gap-2 transition-all duration-150 touch-target min-w-[44px] ${
                item.isDestructive
                  ? 'bg-danger/15 hover:bg-danger/25 text-accent border border-danger/35 active:scale-[0.98]'
                  : 'bg-surface-2 hover:bg-surface-2 text-text-primary border border-border active:scale-[0.98]'
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2.5">
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${
                      item.isDestructive ? 'text-danger' : 'text-accent'
                    }`}
                  />
                )}
                <span className={`text-xs font-bold ${item.isDestructive ? 'text-danger' : 'text-text-primary'}`}>
                  {item.label}
                </span>
              </div>
            </Button>
          );
        })}

        <Button
          type="button"
          onClick={onClose}
          className="w-full py-3 mt-2 rounded-[12px] bg-surface text-text-muted hover:text-text-primary text-xs font-semibold border border-border touch-target min-w-[44px]"
        >
          بستن منو
        </Button>
      </div>
    </BottomSheet>
  );
};
