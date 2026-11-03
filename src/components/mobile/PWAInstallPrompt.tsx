import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { APP_NAME_FA } from '../../config/app';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone on homescreen, hide prompt
  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent-hover text-xs font-bold transition active:scale-95 touch-target min-w-[44px]"
        title="نصب اپلیکیشن روی دستگاه"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">نصب اپلیکیشن</span>
        <span className="sm:hidden">نصب</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent-hover text-xs font-bold transition active:scale-95 touch-target min-w-[44px]"
          title="نصب در آیفون / آیپد"
        >
          <Download className="w-3.5 h-3.5" />
          <span>نصب iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIOSGuide(false);
            }}
          >
            <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface border border-accent/30 p-5 text-text-primary shadow-2xl space-y-3" dir="rtl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <h4 className="font-bold text-sm text-accent-hover">نصب {APP_NAME_FA} روی آیفون و آیپد</h4>
                <button type="button" onClick={() => setShowIOSGuide(false)} className="text-text-muted p-2 touch-target min-w-[44px] hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-text-primary">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent font-bold flex items-center justify-center shrink-0 text-xs">۱</span>
                  <span>در نوار پایین مرورگر سافاری، دکمه <strong>Share</strong> (اشتراک‌گذاری) را لمس کنید:</span>
                  <Share2 className="w-4 h-4 text-accent-hover shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent font-bold flex items-center justify-center shrink-0 text-xs">۲</span>
                  <span>به پایین پیمایش کرده و گزینه <strong>Add to Home Screen</strong> را بزنید:</span>
                  <PlusSquare className="w-4 h-4 text-accent-hover shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-on-accent font-bold flex items-center justify-center shrink-0 text-xs">۳</span>
                  <span>اکنون {APP_NAME_FA} به صورت تمام‌صفحه و آفلاین در صفحه اصلی قرار می‌گیرد.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-2 text-text-primary font-bold text-xs"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
