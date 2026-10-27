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
      <div className="p-2.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/40 text-[#F2C265] text-xs shadow-xl backdrop-blur-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-[#F2C265] shrink-0" />
          <span>حالت آفلاین (داده‌ها در حافظه دستگاه ذخیره می‌شوند)</span>
        </div>
        {offlineChangesCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-[#E0A030] text-[#0E0D0C] font-black text-[10px]">
            {offlineChangesCount} تغییر در صف
          </span>
        )}
      </div>
    </div>
  );
};
