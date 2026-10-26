import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  offlineChangesCount: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, offlineChangesCount }) => {
  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-16 inset-x-3 z-30 max-w-sm mx-auto"
      dir="rtl"
    >
      <div className="p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs shadow-xl backdrop-blur-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>حالت آفلاین (داده‌ها در حافظه دستگاه ذخیره می‌شوند)</span>
        </div>
        {offlineChangesCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
            {offlineChangesCount} تغییر در صف
          </span>
        )}
      </div>
    </div>
  );
};
