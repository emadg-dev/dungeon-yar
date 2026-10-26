import React from 'react';

interface AppShellProps {
  header: React.ReactNode;
  stickySubHeader?: React.ReactNode;
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  toast?: React.ReactNode;
  modals?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  stickySubHeader,
  children,
  bottomNav,
  toast,
  modals,
}) => {
  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#0E0D0C] noise-bg text-[#EDE6D8] flex flex-col font-sans selection:bg-[#E0A030]/30 selection:text-[#F2C265] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-20"
      dir="rtl"
    >
      {/* Toast Layer (z-index 50) */}
      {toast}

      {/* Global Sticky Header (z-index 20) */}
      {header}

      {/* Optional Sticky SubHeader (e.g. Sheet vitals & subtabs) */}
      {stickySubHeader}

      {/* Only main scrolls */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        {children}
      </main>

      {/* Fixed Bottom Navigation (z-index 30) */}
      {bottomNav}

      {/* Modals & Dialogs (z-index 40/41) */}
      {modals}
    </div>
  );
};
