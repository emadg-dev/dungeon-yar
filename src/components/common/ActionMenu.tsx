import React from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { LucideIcon } from 'lucide-react';

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
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full p-3.5 rounded-[12px] flex items-center justify-between transition-all duration-150 touch-target ${
                item.isDestructive
                  ? 'bg-[#C2512B]/15 hover:bg-[#C2512B]/25 text-[#E0A030] border border-[#C2512B]/35 active:scale-[0.98]'
                  : 'bg-[#201D19] hover:bg-[#2A2621] text-[#EDE6D8] border border-[#2F2A23] active:scale-[0.98]'
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2.5">
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${
                      item.isDestructive ? 'text-[#C2512B]' : 'text-[#E0A030]'
                    }`}
                  />
                )}
                <span className={`text-xs font-bold ${item.isDestructive ? 'text-[#C2512B]' : 'text-[#EDE6D8]'}`}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 mt-2 rounded-[12px] bg-[#171513] text-[#A39A89] hover:text-[#EDE6D8] text-xs font-semibold border border-[#2F2A23] touch-target"
        >
          بستن منو
        </button>
      </div>
    </BottomSheet>
  );
};
