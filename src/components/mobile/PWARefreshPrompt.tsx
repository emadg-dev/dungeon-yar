import React from 'react';
import { usePWARefresh } from '../../hooks/usePWARefresh';
import { RotateCw, X } from 'lucide-react';

export const PWARefreshPrompt: React.FC = () => {
  const { promptVisible, doRefresh, dismiss } = usePWARefresh();

  if (!promptVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#171513] border border-[#E0A030]/40 p-6 shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#F2C265]">به‌روزرسانی اپلیکیشن</h3>
          <button
            onClick={() => refreshApp()}
            className="p-2 text-[#A39A89] hover:text-[#EDE6D8] transition-colors"
            title="نادیده گرفتن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-[#C9C0AE] leading-relaxed">
            نسخه جدیدی از {process.env.VITE_APP_NAME || 'DungeonYar'} در دسترس است.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#F2C265]">
            <RotateCw className="w-4 h-4" />
            <span>برای دریافت به‌روزرسانی‌ها، به‌روز کنید.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => doRefresh()}
              className="flex-1 py-3 px-4 rounded-xl bg-[#E0A030] hover:bg-[#E0A030]/90 text-[#0E0D0C] font-bold text-sm transition-colors"
            >
              به‌روز کردن
            </button>
            <button
              onClick={() => dismiss()}
              className="px-4 py-3 rounded-xl bg-[#2A2621] hover:bg-[#3A3427] text-[#EDE6D8] font-medium text-sm transition-colors"
            >
              بعدا‌بررسی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};