import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E0A030]/15 hover:bg-[#E0A030]/25 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold transition active:scale-95 touch-target"
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E0A030]/10 hover:bg-[#E0A030]/20 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold transition active:scale-95 touch-target"
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
            <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#171513] border border-[#E0A030]/30 p-5 text-[#EDE6D8] shadow-2xl space-y-3" dir="rtl">
              <div className="flex items-center justify-between border-b border-[#2F2A23] pb-2">
                <h4 className="font-bold text-sm text-[#F2C265]">نصب زروانیا روی آیفون و آیپد</h4>
                <button type="button" onClick={() => setShowIOSGuide(false)} className="text-[#A39A89] p-2 touch-target hover:text-[#EDE6D8]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[#C9C0AE]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E0A030] text-[#0E0D0C] font-bold flex items-center justify-center shrink-0 text-[10px]">۱</span>
                  <span>در نوار پایین مرورگر سافاری، دکمه <strong>Share</strong> (اشتراک‌گذاری) را لمس کنید:</span>
                  <Share2 className="w-4 h-4 text-[#F2C265] shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E0A030] text-[#0E0D0C] font-bold flex items-center justify-center shrink-0 text-[10px]">۲</span>
                  <span>به پایین پیمایش کرده و گزینه <strong>Add to Home Screen</strong> را بزنید:</span>
                  <PlusSquare className="w-4 h-4 text-[#F2C265] shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E0A030] text-[#0E0D0C] font-bold flex items-center justify-center shrink-0 text-[10px]">۳</span>
                  <span>اکنون زروانیا به صورت تمام‌صفحه و آفلاین در صفحه اصلی قرار می‌گیرد.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-3 py-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#EDE6D8] font-bold text-xs"
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
