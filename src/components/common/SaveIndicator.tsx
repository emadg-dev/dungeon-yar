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
      icon: <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin" />,
      text: 'در حال ذخیره‌سازی...',
      color: 'text-accent',
    },
    saved: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
      text: 'ذخیره شد',
      color: 'text-success',
    },
    offline: {
      icon: <WifiOff className="w-3.5 h-3.5 text-text-muted" />,
      text: 'آفلاین (در صف همگام‌سازی)',
      color: 'text-text-muted',
    },
    conflict: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-danger animate-pulse" />,
      text: 'تداخل نسخه',
      color: 'text-danger',
    },
    idle: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />,
      text: 'آماده',
      color: 'text-text-muted',
    },
  };

  const current = configs[status] || configs.saved;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[8px] bg-surface border border-border text-xs font-semibold ${className}`}
      title={current.text}
      dir="rtl"
    >
      {current.icon}
      {showText && <span className={`text-xs ${current.color}`}>{current.text}</span>}
    </div>
  );
};
