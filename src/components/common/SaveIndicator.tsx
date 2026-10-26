import React from 'react';
import { CheckCircle2, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'conflict' | 'idle';

interface SaveIndicatorProps {
  status: SyncStatus;
  showText?: boolean;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  showText = false,
  className = '',
}) => {
  const configs: Record<SyncStatus, { icon: React.ReactNode; text: string; color: string }> = {
    saving: {
      icon: <RefreshCw className="w-3.5 h-3.5 text-[#E0A030] animate-spin" />,
      text: 'در حال ذخیره‌سازی...',
      color: 'text-[#E0A030]',
    },
    saved: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#6F9E78]" />,
      text: 'ذخیره شد',
      color: 'text-[#6F9E78]',
    },
    offline: {
      icon: <WifiOff className="w-3.5 h-3.5 text-[#A39A89]" />,
      text: 'آفلاین (در صف همگام‌سازی)',
      color: 'text-[#A39A89]',
    },
    conflict: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#C2512B] animate-pulse" />,
      text: 'تداخل نسخه',
      color: 'text-[#C2512B]',
    },
    idle: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#A39A89]" />,
      text: 'آماده',
      color: 'text-[#A39A89]',
    },
  };

  const current = configs[status] || configs.saved;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[8px] bg-[#171513] border border-[#2F2A23] text-xs font-semibold ${className}`}
      title={current.text}
      dir="rtl"
    >
      {current.icon}
      {showText && <span className={`text-[11px] ${current.color}`}>{current.text}</span>}
    </div>
  );
};
