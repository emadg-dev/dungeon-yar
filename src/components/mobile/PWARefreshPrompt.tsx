import React from 'react';
import { usePWARefresh } from '../../hooks/usePWARefresh';
import { RotateCw, X } from 'lucide-react';
import { APP_NAME_FA } from '../../config/app';
import { Button } from '../ui/Button';

export const PWARefreshPrompt: React.FC = () => {
  const { promptVisible, doRefresh, dismiss } = usePWARefresh();

  if (!promptVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-accent/40 p-6 shadow-2xl" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-xl font-bold text-accent-hover">به‌روزرسانی اپلیکیشن</h3>
          <Button
            onClick={() => dismiss()}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
            title="نادیده گرفتن"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-text-primary leading-relaxed">
            نسخه جدیدی از {APP_NAME_FA} در دسترس است.
          </p>
          <div className="flex items-center gap-2 text-sm text-accent-hover">
            <RotateCw className="w-4 h-4" />
            <span>برای دریافت به‌روزرسانی‌ها، به‌روز کنید.</span>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => doRefresh()}
              className="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-on-accent font-bold text-sm transition-colors"
            >
              به‌روز کردن
            </Button>
            <Button
              onClick={() => dismiss()}
              className="px-4 py-3 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-primary font-medium text-sm transition-colors"
            >
              بعدا‌بررسی
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};