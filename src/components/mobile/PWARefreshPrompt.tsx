import React from 'react';
import { usePWARefresh } from '../../hooks/usePWARefresh';
import { RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

/**
 * An update is never urgent, so it must not block the screen. It sits above
 * the bottom dock, can be ignored, and does not cover what the person is doing.
 */
export const PWARefreshPrompt: React.FC = () => {
  const { promptVisible, doRefresh, dismiss } = usePWARefresh();

  if (!promptVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className="fixed inset-x-3 z-40 mx-auto max-w-sm bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-2xl">
        <RotateCw className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-sm text-text-primary">نسخه جدید آماده است</p>
        <Button
          onClick={() => dismiss()}
          className={`h-11 px-3 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 transition ${focusRing}`}
        >
          بعداً
        </Button>
        <Button
          onClick={() => doRefresh()}
          className={`h-11 px-4 rounded-lg bg-accent text-on-accent text-sm font-bold hover:bg-accent-hover transition ${focusRing}`}
        >
          به‌روزرسانی
        </Button>
      </div>
    </div>
  );
};