import { Button } from './ui/Button';
import { Select } from './ui/Select';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Character } from '../types';
import { APP_NAME_FA, APP_NAME_LATIN, APP_TAGLINE, APP_VERSION } from '../config/app';
import { BottomSheet } from './mobile/BottomSheet';
import { 
  Menu, X,
  CheckCircle2, RefreshCw, Shield, BookOpen, 
  SunMedium, Type, LogOut, ChevronDown, MoreVertical, Sparkles, Swords, Bell,
  WifiOff, AlertTriangle, Eye, Wifi
} from 'lucide-react';
import { getRoleLabelFa, CampaignRole } from '../../shared/permissions';
import { toPersianDigits } from '../../shared/rules/historyEngine';

export interface HeaderProps {
  currentUser: User | null;
  allUsers: User[];
  characters: Character[];
  activeCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onSwitchUser: (userId: string) => void;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onLogout: () => void;
  saveStatus?: 'saved' | 'saving' | 'offline' | 'conflict' | 'idle';
  conflictCount?: number;
  onOpenConflicts?: () => void;
  isDmView?: boolean;
  onToggleDmView?: () => void;
  wakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
  wakeLockSupported?: boolean;
  fontScale?: 'normal' | 'large' | 'xlarge';
  onToggleFontScale?: () => void;
  activeEncounter?: { id: string; name: string } | null;
  onOpenActiveEncounter?: () => void;
  // Multi-campaign extensions
  activeCampaignName?: string | null;
  activeCampaignRole?: string | null;
  viewMode?: 'home' | 'character_master' | 'campaign_space';
  onOpenCampaignSwitcher?: () => void;
  onGoHome?: () => void;
  onOpenCampaignSettings?: () => void;
  onOpenCampaignMembers?: () => void;
  onOpenCampaignInvites?: () => void;
  onOpenCampaignApprovals?: () => void;
  pendingApprovalsCount?: number;
  levelUpAvailable?: boolean;
  onOpenLevelUp?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenAdminConsole?: () => void;
  // Offline sync & versioning extensions
  queueLength?: number;
  isOnline?: boolean;
  onSyncNow?: () => void;
  appVersion?: string;
  onCheckForUpdates?: () => void;
  isCheckingUpdates?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  characters,
  activeCharacterId,
  onSelectCharacter,
  onSwitchUser,
  onOpenAuth,
  onOpenAccount,
  onLogout,
  saveStatus = 'saved',
  conflictCount = 0,
  onOpenConflicts,
  isDmView = false,
  onToggleDmView,
  wakeLockActive = false,
  onToggleWakeLock = () => {},
  wakeLockSupported = false,
  fontScale = 'normal',
  onToggleFontScale = () => {},
  activeEncounter,
  onOpenActiveEncounter,
  activeCampaignName,
  activeCampaignRole,
  viewMode = 'home',
  onOpenCampaignSwitcher,
  onGoHome,
  onOpenCampaignSettings,
  onOpenCampaignMembers,
  onOpenCampaignInvites,
  onOpenCampaignApprovals,
  pendingApprovalsCount = 0,
  levelUpAvailable = false,
  onOpenLevelUp,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenAdminConsole,
  queueLength = 0,
  isOnline = true,
  onSyncNow,
  appVersion = APP_VERSION,
  onCheckForUpdates,
  isCheckingUpdates = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncSheetOpen, setSyncSheetOpen] = useState(false);
  const isDm = activeCampaignRole === 'owner' || activeCampaignRole === 'co_dm' || currentUser?.role === 'dm';
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close menu on viewport grow past mobile (md = 768px)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock scroll while menu open (reuse existing body class)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('sheet-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('sheet-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('sheet-open');
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Focus trap inside drawer + return focus to hamburger on close
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const panel = menuPanelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    if (first) setTimeout(() => first.focus(), 50);
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const all = Array.from(focusable);
      if (all.length === 0) return;
      const firstEl = all[0];
      const lastEl = all[all.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener('keydown', handleTab);
    return () => panel.removeEventListener('keydown', handleTab);
  }, [mobileMenuOpen]);

  // Close menu when clicking outside backdrop or pressing Escape (backed by BottomSheet already, keep extra here)
  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setTimeout(() => hamburgerRef.current?.focus(), 100);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-20 w-full max-w-full glass-panel border-b border-border shadow-md pt-[env(safe-area-inset-top,0px)] ps-[env(safe-area-inset-left,0px)] pe-[env(safe-area-inset-right,0px)]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 gap-2">
        {/* Mobile hamburger — left of header, mobile only */}
        <Button 
          ref={hamburgerRef}
          type="button"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-header-menu"
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-[10px] bg-surface-2 border border-border text-text-primary hover:border-accent transition touch-target min-w-[44px] shrink-0"
          title={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Brand & Campaign Switcher / Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Brand Seal Logo Mark */}
          <Button 
            type="button"
            onClick={onGoHome}
            className="relative flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-br from-accent to-danger border border-accent-hover/40 shadow-glow-amber shrink-0 hover:scale-105 transition-transform"
            title={APP_NAME_FA}
          >
            <span className="text-base font-black text-on-accent leading-none">ز</span>
          </Button>

          {viewMode === 'campaign_space' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Campaign Switcher Chip */}
              {onOpenCampaignSwitcher && (
                <Button 
                  type="button"
                  onClick={onOpenCampaignSwitcher}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-black text-text-primary truncate max-w-[130px] sm:max-w-[180px] touch-target min-w-[44px] transition"
                  title="تغییر یا انتخاب کمپین"
                >
                  <span className="truncate text-accent">{activeCampaignName || 'کمپین'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                </Button>
              )}

              {/* Role Badge in campaign space */}
              {activeCampaignRole && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-black shrink-0 ${
                    activeCampaignRole === 'owner'
                      ? 'bg-accent/20 text-accent-hover border border-accent/40'
                      : activeCampaignRole === 'co_dm'
                      ? 'bg-role-codm/20 text-role-codm border border-role-codm/40'
                      : activeCampaignRole === 'player'
                      ? 'bg-info/30 text-info border border-info/40'
                      : 'bg-text-disabled/30 text-text-muted border border-text-disabled/40'
                  }`}
                  title={`نقش شما: ${getRoleLabelFa(activeCampaignRole as CampaignRole)}`}
                >
                  {getRoleLabelFa(activeCampaignRole as CampaignRole)}
                </span>
              )}

              {/* Character Dropdown inside campaign */}
              {currentUser && characters.length > 0 && !isDmView && (
                <div className="relative min-w-0 max-w-[120px] sm:max-w-[160px]">
                  <Select noWrapper 
                    value={activeCharacterId || ''}
                    onChange={(e) => onSelectCharacter(e.target.value)}
                    className="w-full bg-surface-2 text-xs font-bold text-accent py-1.5 pe-6 ps-2 rounded-[10px] border border-border focus:outline-none appearance-none cursor-pointer truncate touch-target min-w-[44px]"
                    title="تغییر کاراکتر در این کمپین"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface text-text-primary">
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <ChevronDown className="w-3 h-3 text-text-muted absolute start-auto end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Level-Up Ready Indicator Button */}
              {levelUpAvailable && onOpenLevelUp && !isDmView && (
                <Button 
                  type="button"
                  onClick={onOpenLevelUp}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-gradient-to-r from-warning to-accent text-on-accent text-xs font-black animate-pulse shadow-md shadow-accent/20 touch-target min-w-[44px] shrink-0"
                  title="ارتقای سطح آماده است!"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ارتقای سطح!</span>
                </Button>
              )}
            </div>
          ) : viewMode === 'character_master' ? (
            <div className="flex items-center gap-2 truncate">
              {onGoHome && (
                <Button 
                  type="button"
                  onClick={onGoHome}
                  className="text-xs font-bold text-text-muted hover:text-accent transition flex items-center gap-1"
                >
                  خانه /
                </Button>
              )}
              <h1 className="text-xs sm:text-sm font-black text-text-primary truncate">
                پرونده جامع شخصیت
              </h1>
            </div>
          ) : (
            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-black tracking-wide text-text-primary truncate">
                {APP_NAME_FA} <span className="text-accent text-xs font-bold sm:inline hidden">• {APP_TAGLINE}</span>
              </h1>
            </div>
          )}
        </div>

        {/* Visual Offline / Queue / Conflict Indicator — visible in navigation bar on ALL viewports */}
        {(!isOnline || saveStatus === 'offline' || queueLength > 0 || saveStatus === 'conflict') && (
          <Button 
            type="button"
            onClick={() => {
              if (saveStatus === 'conflict') {
                onOpenConflicts?.();
              } else {
                setSyncSheetOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-black transition shrink-0 touch-target min-w-[44px] min-h-[38px] ${
              saveStatus === 'conflict'
                ? 'bg-danger/25 text-accent-hover border border-danger/70 shadow-[0_0_8px_rgba(194,81,43,0.35)] animate-pulse'
                : (!isOnline || saveStatus === 'offline') && queueLength > 0
                ? 'bg-danger/25 text-accent-hover border border-danger/70 shadow-[0_0_10px_rgba(194,81,43,0.4)] animate-pulse'
                : (!isOnline || saveStatus === 'offline')
                ? 'bg-surface-2 text-text-primary border border-text-muted/40 hover:border-accent'
                : 'bg-surface-2 text-accent border border-accent/40'
            }`}
            aria-label={
              saveStatus === 'conflict'
                ? `${toPersianDigits(conflictCount || 1)} مغایرت در همگام‌سازی`
                : (!isOnline || saveStatus === 'offline') && queueLength > 0
                ? `آفلاین - ${toPersianDigits(queueLength)} تغییر در صف انتظار`
                : (!isOnline || saveStatus === 'offline')
                ? 'حالت آفلاین - اتصال اینترنت قطع است'
                : `در حال همگام‌سازی - ${toPersianDigits(queueLength)} تغییر در صف`
            }
            title={
              saveStatus === 'conflict'
                ? `${toPersianDigits(conflictCount || 1)} مغایرت در همگام‌سازی - جهت رفع لمس کنید`
                : (!isOnline || saveStatus === 'offline') && queueLength > 0
                ? `آفلاین: ${toPersianDigits(queueLength)} تغییر در صف ارسال منتظر اتصال است (جهت جزئیات لمس کنید)`
                : (!isOnline || saveStatus === 'offline')
                ? 'اتصال اینترنت قطع است (جهت جزئیات لمس کنید)'
                : 'در حال ارسال تغییرات به سرور...'
            }
          >
            {saveStatus === 'conflict' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-accent-hover shrink-0" />
                <span className="text-xs font-extrabold">{toPersianDigits(conflictCount || 1)} مغایرت</span>
              </>
            ) : (!isOnline || saveStatus === 'offline') ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-accent-hover shrink-0" />
                <span className="text-xs font-extrabold flex items-center gap-1">
                  <span>آفلاین</span>
                  {queueLength > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-danger text-white text-xs font-black leading-none">
                      {toPersianDigits(queueLength)} در صف
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
                <span className="text-xs text-accent font-bold">
                  {toPersianDigits(queueLength)} در صف
                </span>
              </>
            )}
          </Button>
        )}

        {/* Action Controls & Utilities — hidden on mobile; hamburger replaces below md */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {/* DM Pending Approvals notification */}
          {pendingApprovalsCount > 0 && onOpenCampaignApprovals && (
            <Button 
              type="button"
              onClick={onOpenCampaignApprovals}
              className="flex items-center gap-1 px-2 py-1 rounded-[10px] text-xs font-black bg-accent/20 text-accent-hover border border-accent/40 hover:bg-accent/30 transition touch-target min-w-[44px] animate-pulse"
              title={`${pendingApprovalsCount} درخواست در انتظار بررسی`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{pendingApprovalsCount}</span>
            </Button>
          )}

          {/* Live Encounter Button for Players or DM */}
          {viewMode === 'campaign_space' && activeEncounter && onOpenActiveEncounter && (
            <Button 
              type="button"
              onClick={onOpenActiveEncounter}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-black bg-danger hover:bg-danger text-white animate-pulse border border-accent-hover shadow-[0_0_12px_rgba(194,81,43,0.6)] touch-target min-w-[44px] transition"
              title={`مبارزه فعال: ${activeEncounter.name}`}
            >
              <Swords className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">مبارزه زنده</span>
            </Button>
          )}

          {/* Desktop Synced Status (when all saved and online) */}
          {isOnline && saveStatus === 'saved' && queueLength === 0 && (
            <div
              className="flex items-center gap-1 px-1.5 py-1 text-xs text-success"
              title="همه تغییرات ذخیره شدند"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-bold hidden lg:inline">ذخیره شد</span>
            </div>
          )}

          {/* Desktop App Version & Check for Updates Button */}
          {onCheckForUpdates && (
            <Button 
              type="button"
              onClick={onCheckForUpdates}
              disabled={isCheckingUpdates}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-text-muted hover:text-text-primary transition touch-target min-w-[44px]"
              title={`نسخه ${toPersianDigits(appVersion || APP_VERSION)} - بررسی به‌روزرسانی`}
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingUpdates ? 'animate-spin text-accent' : 'text-text-muted'}`} />
              <span>نسخه {toPersianDigits(appVersion || APP_VERSION)}</span>
            </Button>
          )}

          {/* DM / Player View Switcher (if user is DM in this campaign) */}
          {viewMode === 'campaign_space' && isDm && onToggleDmView && (
            <Button 
              type="button"
              onClick={onToggleDmView}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-xs font-bold transition border touch-target min-w-[44px] ${
                isDmView
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-surface-2 text-text-primary border-border hover:border-accent'
              }`}
              title={isDmView ? 'تغییر به کاراکترشیت' : 'تغییر به ابزارهای مستر'}
            >
              {isDmView ? <Shield className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isDmView ? 'ابزارهای مستر' : 'کاراکترشیت'}</span>
            </Button>
          )}

          {/* Desktop-only Quick Tools */}
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Screen Wake Lock toggle */}
            {wakeLockSupported && (
              <Button 
                type="button"
                onClick={onToggleWakeLock}
                className={`p-1.5 rounded-[10px] text-xs font-bold transition border touch-target min-w-[44px] ${
                  wakeLockActive
                    ? 'bg-accent/20 text-accent border-accent/50 shadow-glow-amber'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
                }`}
                title={wakeLockActive ? 'روشن ماندن صفحه فعال است' : 'فعال‌سازی روشن ماندن صفحه در حین بازی'}
              >
                <SunMedium className="w-4 h-4" />
              </Button>
            )}

            {/* Font Scale toggle */}
            <Button 
              type="button"
              onClick={onToggleFontScale}
              className={`p-1.5 rounded-[10px] text-xs font-bold transition border touch-target min-w-[44px] ${
                fontScale !== 'normal'
                  ? 'bg-accent/20 text-accent border-accent/40'
                  : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
              }`}
              title={fontScale === 'xlarge' ? 'فونت خیلی بزرگ' : fontScale === 'large' ? 'فونت بزرگ' : 'فونت استاندارد'}
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          {/* Notifications Bell */}
          {onOpenNotifications && (
            <Button 
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-[10px] text-xs font-bold transition border border-border bg-surface-2 text-text-muted hover:text-text-primary hover:border-accent touch-target min-w-[44px]"
              title="اعلان‌ها و رویدادها"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-xs font-bold flex items-center justify-center border border-bg shadow-sm animate-pulse">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </Button>
          )}

          {/* User Account / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {currentUser.platformRole === 'admin' && onOpenAdminConsole && (
                <Button 
                  type="button"
                  onClick={onOpenAdminConsole}
                  className="py-1 px-2.5 rounded-[10px] bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 text-xs font-bold transition touch-target min-w-[44px] flex items-center gap-1 min-h-[44px]"
                  title="کنسول مدیریت سامانه"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">مدیریت</span>
                </Button>
              )}
              <Button 
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-1.5 py-1 px-2 rounded-[10px] bg-surface-2 border border-border text-xs font-bold text-text-primary hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-95 transition touch-target min-w-[44px]"
                title={currentUser.displayName || currentUser.name}
              >
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentUser.displayName || currentUser.name}</span>
                <MoreVertical className="w-3.5 h-3.5 text-text-muted" />
              </Button>
            </div>
          ) : (
            <Button 
              type="button"
              onClick={onOpenAuth}
              className="py-1.5 px-3 rounded-[10px] btn-primary-amber font-bold text-xs shadow-md transition touch-target min-w-[44px] flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ورود / عضویت</span>
            </Button>
          )}
        </div>
      </div>

      {/* Persistent Spectator Banner */}
      {viewMode === 'campaign_space' && activeCampaignRole === 'spectator' && (
        <div className="w-full bg-surface border-t border-text-disabled/60 px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-bold text-text-muted">
          <Eye className="w-4 h-4 text-text-muted shrink-0" />
          <span>حالت تماشا — فقط‌خواندنی (مشاهده برگه و تاس‌های روی میز مجاز است)</span>
        </div>
      )}
    </header>
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            id="mobile-header-menu"
            ref={menuPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="منوی اصلی"
            className="fixed top-0 inset-inline-end-0 z-50 w-[min(22rem,92vw)] h-full bg-surface/98 backdrop-blur-xl border-s border-border shadow-2xl overflow-y-auto overscroll-contain transition-transform duration-200 ease-out"
          >
            <div className="flex items-center justify-between px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] border-b border-border sticky top-0 bg-surface/98 z-10">
              <div>
                <h2 className="text-xs font-black text-text-primary">{APP_NAME_FA}</h2>
                <span className="text-xs text-text-muted">منوی اصلی</span>
              </div>
              <Button 
                type="button"
                onClick={closeMenu}
                aria-label="بستن منو"
                className="w-10 h-10 rounded-[10px] bg-surface-2 border border-border text-text-primary hover:border-accent flex items-center justify-center transition touch-target min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3 space-y-1.5">
            {/* User identity summary */}
            {currentUser && (
              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-surface-2/60 border border-border">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-accent to-danger text-on-accent font-black flex items-center justify-center shrink-0">
                  {(currentUser.displayName || currentUser.name)?.[0] || 'ز'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-text-primary truncate">{currentUser.displayName || currentUser.name}</h3>
                  <span className="text-xs text-text-muted">{currentUser.email}</span>
                </div>
                <span className="ms-auto w-2 h-2 rounded-full bg-success shrink-0" title="آنلاین" />
              </div>
            )}

            {/* Navigation & Campaign Controls */}
            <div className="space-y-1.5">
              {onGoHome && (
                <Button 
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoHome();
                  }}
                  className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-text-primary flex items-center gap-2 touch-target min-w-[44px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>صفحه اصلی (کمپین‌ها و کاراکترها)</span>
                </Button>
              )}

              {onOpenCampaignSwitcher && (
                <Button 
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCampaignSwitcher();
                  }}
                  className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-accent flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                >
                  <span>جابجایی بین کمپین‌ها</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              )}

              {/* DM Campaign Management Tools */}
              {isDm && viewMode === 'campaign_space' && (
                <div className="space-y-1 pt-1.5 border-t border-border/60">
                  <span className="text-xs font-bold text-text-muted">مدیریت این کمپین:</span>
                  {onOpenCampaignSettings && (
                    <Button 
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignSettings();
                      }}
                      className="w-full text-start py-2 px-2.5 rounded-[8px] bg-surface-2/60 hover:bg-surface-2 text-xs text-text-primary flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>تنظیمات قوانین و واحدها</span>
                    </Button>
                  )}
                  {onOpenCampaignMembers && (
                    <Button 
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignMembers();
                      }}
                      className="w-full text-start py-2 px-2.5 rounded-[8px] bg-surface-2/60 hover:bg-surface-2 text-xs text-text-primary flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>اعضا و تعیین نقش‌ها</span>
                    </Button>
                  )}
                  {onOpenCampaignInvites && (
                    <Button 
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignInvites();
                      }}
                      className="w-full text-start py-2 px-2.5 rounded-[8px] bg-surface-2/60 hover:bg-surface-2 text-xs text-text-primary flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>ساخت و مدیریت کدهای دعوت</span>
                    </Button>
                  )}
                  {onOpenCampaignApprovals && (
                    <Button 
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignApprovals();
                      }}
                      className="w-full text-start py-2 px-2.5 rounded-[8px] bg-surface-2/60 hover:bg-surface-2 text-xs text-text-primary flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
                    >
                      <span>تأیید کاراکترها و ارتقای لول</span>
                      {pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent-hover text-xs font-bold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Account Management Button */}
            {onOpenAccount && (
              <Button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-text-primary flex items-center justify-center gap-2 touch-target min-w-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>مدیریت حساب کاربری و نشست‌ها</span>
              </Button>
            )}

            {/* Instance Admin Console Button */}
            {currentUser?.platformRole === 'admin' && onOpenAdminConsole && (
              <Button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminConsole();
                }}
                className="w-full py-2.5 px-3 rounded-[10px] bg-accent/15 border border-accent/40 text-xs font-extrabold text-accent flex items-center justify-center gap-2 touch-target min-w-[44px] min-h-[44px]"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>کنسول مدیریت سامانه (ادمین)</span>
              </Button>
            )}

            {/* Notifications and Events Button */}
            {onOpenNotifications && (
              <Button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNotifications();
                }}
                className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-text-primary flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-accent" />
                  <span>اعلان‌ها و رویدادها</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-danger text-white text-xs font-bold">
                    {unreadNotificationsCount} جدید
                  </span>
                )}
              </Button>
            )}

            {/* Character selection if multiple */}
            {characters.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">کاراکتر انتخابی شما:</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {characters.map(c => (
                    <Button 
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCharacter(c.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-start p-2.5 rounded-[10px] text-xs font-bold transition flex flex-wrap items-center justify-between gap-2 border touch-target min-w-[44px] ${
                        activeCharacterId === c.id
                          ? 'bg-accent/15 text-accent border-accent/40'
                          : 'bg-surface-2 text-text-primary border-border'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs text-text-muted">L{c.level}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* User Switcher for playtesting */}
            {allUsers.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-bold text-text-muted">سوئیچ کاربر برای تست بازی:</label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {allUsers.map(u => (
                    <Button 
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-start p-2 rounded-[8px] text-xs font-bold transition flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px] ${
                        currentUser?.id === u.id
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="truncate">{u.displayName || u.name}</span>
                      <span className="text-xs">{u.role === 'dm' ? 'مستر' : 'بازیکن'}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Utility Toggles */}
            <div className="space-y-2 pt-2 border-t border-border">
              {wakeLockSupported && (
                <Button 
                  type="button"
                  onClick={onToggleWakeLock}
                  className="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary touch-target min-w-[44px]"
                >
                  <span className="flex items-center gap-1.5">
                    <SunMedium className="w-4 h-4 text-accent" />
                    روشن ماندن صفحه
                  </span>
                  <span className="text-xs font-bold text-accent">
                    {wakeLockActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </Button>
              )}

              <Button 
                type="button"
                onClick={onToggleFontScale}
                className="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary touch-target min-w-[44px]"
              >
                <span className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-accent" />
                  اندازه قلم
                </span>
                <span className="text-xs font-bold text-accent">
                  {fontScale === 'xlarge' ? 'خیلی بزرگ' : fontScale === 'large' ? 'بزرگ' : 'استاندارد'}
                </span>
              </Button>
            </div>

            {/* Connection & Offline Status in Drawer */}
            <div className={`p-3.5 rounded-[12px] border space-y-2 text-start ${
              !isOnline || saveStatus === 'offline'
                ? 'bg-danger/15 border-danger/40'
                : 'bg-surface-2 border-border'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isOnline || saveStatus === 'offline' ? (
                    <WifiOff className="w-4 h-4 text-accent-hover" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  )}
                  <span className="text-xs font-bold text-text-primary">
                    {!isOnline || saveStatus === 'offline' ? 'حالت آفلاین (بدون اینترنت)' : 'اتصال اینترنت برقرار است'}
                  </span>
                </div>
                {queueLength > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-hover text-xs font-black border border-accent/40">
                    {toPersianDigits(queueLength)} در صف
                  </span>
                )}
              </div>
              {(!isOnline || queueLength > 0) && (
                <p className="text-xs text-text-primary leading-relaxed">
                  {queueLength > 0
                    ? `${toPersianDigits(queueLength)} تغییر ویرایشی در حافظه محلی دستگاه منتظر ارسال به سرور است.`
                    : 'اطلاعات در دستگاه ذخیره شده و پس از اتصال اینترنت همگام خواهند شد.'}
                </p>
              )}
              {onSyncNow && (
                <Button 
                  type="button"
                  onClick={onSyncNow}
                  className="w-full py-2 px-3 rounded-[8px] bg-surface-2 hover:bg-surface-3 border border-border-strong text-xs font-bold text-accent-hover flex items-center justify-center gap-1.5 transition touch-target min-h-[44px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" />
                  <span>تلاش برای همگام‌سازی اکنون</span>
                </Button>
              )}
            </div>

            {/* App Version & Check for Updates in Drawer */}
            <div className="p-3.5 rounded-[12px] bg-surface border border-border space-y-2.5 text-start">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-glow-amber" />
                  <span className="text-xs font-black text-text-primary">{APP_NAME_FA}</span>
                </div>
                <span className="text-xs font-bold text-accent bg-accent/15 border border-accent/40 px-2 py-0.5 rounded-[6px]">
                  نسخه {toPersianDigits(appVersion || APP_VERSION)}
                </span>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                پلتفرم همراه نقش‌آفرینی رومیزی — سازگار با حالت آفلاین
              </p>

              {onCheckForUpdates && (
                <Button 
                  type="button"
                  onClick={onCheckForUpdates}
                  disabled={isCheckingUpdates}
                  className="w-full py-2.5 px-3 rounded-[8px] bg-surface-2 border border-border hover:border-accent active:scale-[0.99] disabled:opacity-50 text-xs font-black text-text-primary hover:text-accent flex items-center justify-center gap-2 transition touch-target min-h-[44px]"
                  title="بررسی انتشار نسخه جدید اپلیکیشن"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin text-accent' : 'text-accent'}`} />
                  <span>{isCheckingUpdates ? 'در حال بررسی به‌روزرسانی...' : 'بررسی به‌روزرسانی'}</span>
                </Button>
              )}
            </div>

            {/* Logout Action */}
            <Button 
              type="button"
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-[10px] bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </Button>
          </div>
        </div>
        </>
      )}

      {/* Offline Sync Details Bottom Sheet */}
      <BottomSheet
        isOpen={syncSheetOpen}
        onClose={() => setSyncSheetOpen(false)}
        title="وضعیت اتصال و همگام‌سازی"
        subtitle="مدیریت وضعیت آفلاین و صف تغییرات محلی"
      >
        <div className="space-y-4 p-4 text-start" dir="rtl">
          {/* Network connection badge */}
          <div className={`p-4 rounded-[12px] border flex items-start gap-3 ${
            !isOnline || saveStatus === 'offline'
              ? 'bg-danger/15 border-danger/40 text-accent-hover'
              : 'bg-success/15 border-success/40 text-success'
          }`}>
            {!isOnline || saveStatus === 'offline' ? (
              <WifiOff className="w-5 h-5 text-accent-hover shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-text-primary">
                {!isOnline || saveStatus === 'offline'
                  ? 'حالت آفلاین (ارتباط با سرور قطع است)'
                  : 'اتصال اینترنت برقرار است'}
              </h4>
              <p className="text-xs text-text-primary leading-relaxed">
                {!isOnline || saveStatus === 'offline'
                  ? 'دستگاه شما در حال حاضر به اینترنت متصل نیست. تمام ویرایش‌های شما در حافظه محلی دستگاه محفوظ می‌ماند.'
                  : 'ارتباط با سرور برقرار است و تغییرات بلافاصله همگام‌سازی می‌شوند.'}
              </p>
            </div>
          </div>

          {/* Queued changes detail */}
          <div className="p-4 rounded-[12px] bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted">تغییرات منتظر در صف ارسال:</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[6px] ${
                queueLength > 0
                  ? 'bg-accent/20 text-accent-hover border border-accent/40'
                  : 'bg-surface-2 text-text-muted'
              }`}>
                {toPersianDigits(queueLength)} تغییر
              </span>
            </div>

            {queueLength > 0 ? (
              <p className="text-xs text-text-primary leading-relaxed">
                {toPersianDigits(queueLength)} تغییر انجام‌شده (از قبیل جان، یادداشت‌ها، کوله‌پشتی یا تاس‌ها) در این دستگاه ذخیره شده‌اند. به محض برقراری اتصال اینترنت، این موارد به صورت خودکار با سرور هماهنگ می‌شوند.
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                هیچ تغییری در صف انتظار نیست و اطلاعات دستگاه شما با سرور یکسان است.
              </p>
            )}
          </div>

          {/* Manual flush / retry button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {onSyncNow && (
              <Button 
                type="button"
                onClick={() => {
                  onSyncNow();
                  setSyncSheetOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-[10px] btn-primary-amber font-bold text-xs flex items-center justify-center gap-2 touch-target min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تلاش مجدد برای همگام‌سازی</span>
              </Button>
            )}
            <Button 
              type="button"
              onClick={() => setSyncSheetOpen(false)}
              className="py-3 px-4 rounded-[10px] bg-surface-2 border border-border text-text-primary font-bold text-xs hover:border-accent touch-target min-h-[44px]"
            >
              بستن
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
