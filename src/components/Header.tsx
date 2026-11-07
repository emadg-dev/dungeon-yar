import { Button } from './ui/Button';
import { Select } from './ui/Select';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Character } from '../types';
import { APP_NAME_FA, APP_TAGLINE, APP_VERSION } from '../config/app';
import { BottomSheet } from './mobile/BottomSheet';
import {
  Menu, X, Home, ArrowLeftRight, Settings, Users, KeyRound, ClipboardCheck, UserCog,
  CheckCircle2, RefreshCw, Shield, BookOpen,
  Coffee, Sun, Moon, Type, LogOut, ChevronDown, ChevronLeft, Sparkles, Swords, Bell,
  WifiOff, AlertTriangle, Eye,
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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

/* ------------------------------------------------------------------
   Shared look.
   Rules used across this file:
   - Header bar: only context + the few things needed mid-game. Everything
     else (theme, font, wake lock, version, admin, approvals) lives in the menu.
   - One row height (44px) for every tappable thing.
   - Icon buttons are quiet (no border/fill) so filled buttons stand out.
   - Corner radius: rounded-lg for controls, rounded-xl for groups.
   - Red (danger) = conflict or live fight. Offline = warning. Nothing pulses
     except the small dot on a live encounter.
   ------------------------------------------------------------------ */
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
const ghostIconBtn = `relative inline-flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition ${focusRing}`;

const roleTone = (role?: string | null) =>
  role === 'owner' ? 'text-accent-hover'
  : role === 'co_dm' ? 'text-role-codm'
  : role === 'player' ? 'text-info'
  : 'text-text-muted';

interface MenuGroupProps { title: string; children: React.ReactNode }
const MenuGroup: React.FC<MenuGroupProps> = ({ title, children }) => (
  <section>
    <h3 className="px-1 mb-1.5 text-xs font-bold text-text-muted">{title}</h3>
    <div className="rounded-xl border border-border bg-surface-2/40 divide-y divide-border overflow-hidden">
      {children}
    </div>
  </section>
);

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  selected?: boolean;
}
const MenuRow: React.FC<MenuRowProps> = ({ icon, label, onClick, trailing, tone = 'default', disabled, selected }) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm text-start transition hover:bg-surface-2 disabled:opacity-50 ${
      tone === 'danger' ? 'text-danger' : selected ? 'text-accent font-bold' : 'text-text-primary'
    } ${focusRing}`}
  >
    <span className="shrink-0 text-text-muted">{icon}</span>
    <span className="flex-1 min-w-0 truncate">{label}</span>
    {trailing}
  </Button>
);

const CountBadge: React.FC<{ value: number; tone?: 'accent' | 'danger' }> = ({ value, tone = 'accent' }) => (
  <span
    className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold inline-flex items-center justify-center ${
      tone === 'danger' ? 'bg-danger text-on-danger' : 'bg-accent text-on-accent'
    }`}
  >
    {value > 99 ? '۹۹+' : toPersianDigits(value)}
  </span>
);

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
  theme = 'dark',
  onToggleTheme,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncSheetOpen, setSyncSheetOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Publish the real header height (incl. safe area and the spectator banner)
  // so sticky bars below it can sit flush: top-[var(--app-header-h)].
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--app-header-h', `${el.getBoundingClientRect().height}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isDm = activeCampaignRole === 'owner' || activeCampaignRole === 'co_dm' || currentUser?.role === 'dm';
  const inCampaign = viewMode === 'campaign_space';
  const isOffline = !isOnline || saveStatus === 'offline';
  const hasConflict = saveStatus === 'conflict';
  const showSync = isOffline || queueLength > 0 || hasConflict;
  const showLevelUp = inCampaign && levelUpAvailable && !isDmView && !!onOpenLevelUp;
  const showApprovals = inCampaign && isDm && !!onOpenCampaignApprovals && pendingApprovalsCount > 0;
  // A dot on the menu button when something inside the menu needs attention.
  const menuNeedsAttention = showApprovals || showLevelUp;
  const displayName = currentUser ? (currentUser.displayName || currentUser.name) : '';

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setTimeout(() => menuTriggerRef.current?.focus(), 100);
  }, []);

  // Run an action and close the menu without stealing focus back.
  const act = (fn?: () => void) => () => {
    setMenuOpen(false);
    fn?.();
  };

  // Lock page scroll while the menu is open.
  useEffect(() => {
    if (menuOpen) {
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
  }, [menuOpen]);

  // Focus trap + Escape. Focusable items are re-read on every Tab so the
  // collapsible "switch user" section is included once opened.
  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanelRef.current;
    if (!panel) return;
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !(el as HTMLButtonElement).disabled);
    const first = getFocusable()[0];
    if (first) setTimeout(() => first.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== 'Tab') return;
      const all = getFocusable();
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
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  const syncLabel = hasConflict
    ? `${toPersianDigits(conflictCount || 1)} مغایرت در همگام‌سازی`
    : isOffline && queueLength > 0
    ? `آفلاین، ${toPersianDigits(queueLength)} تغییر در صف ارسال`
    : isOffline
    ? 'آفلاین: اتصال اینترنت قطع است'
    : `در حال همگام‌سازی، ${toPersianDigits(queueLength)} تغییر در صف`;

  const syncTone = hasConflict
    ? 'text-danger bg-danger/15'
    : isOffline
    ? 'text-warning bg-warning/15'
    : 'text-accent bg-accent/10';

  const roleLabel = activeCampaignRole ? getRoleLabelFa(activeCampaignRole as CampaignRole) : '';

  // Campaign name + role, shown as one two-line control instead of three chips.
  const campaignLabel = (
    <>
      <span className="flex flex-col min-w-0 leading-tight text-start">
        <span className="text-sm font-bold text-text-primary truncate">{activeCampaignName || 'کمپین'}</span>
        {roleLabel && <span className={`text-xs truncate ${roleTone(activeCampaignRole)}`}>{roleLabel}</span>}
      </span>
      {onOpenCampaignSwitcher && <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
    </>
  );

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-20 w-full max-w-full glass-panel border-b border-border pt-[env(safe-area-inset-top,0px)] ps-[env(safe-area-inset-left,0px)] pe-[env(safe-area-inset-right,0px)]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-14 flex items-center gap-2">
          {/* ---------- Start: where am I ---------- */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              type="button"
              onClick={onGoHome}
              aria-label="صفحه اصلی"
              title={APP_NAME_FA}
              className={`flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-accent to-danger ${focusRing}`}
            >
              <span className="text-lg font-black color-primary leading-none">د</span>
            </Button>

            {inCampaign ? (
              <>
                {onOpenCampaignSwitcher ? (
                  <Button
                    type="button"
                    onClick={onOpenCampaignSwitcher}
                    title="تغییر یا انتخاب کمپین"
                    className={`flex items-center gap-1.5 shrink min-w-0 max-w-[12rem] sm:max-w-xs h-11 px-2 rounded-lg hover:bg-surface-2 transition ${focusRing}`}
                  >
                    {campaignLabel}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0 px-2">{campaignLabel}</div>
                )}

                {/* Character picker: header on wide screens, menu on phones */}
                {currentUser && characters.length > 0 && !isDmView && (
                  <div className="relative hidden md:block min-w-0 max-w-[11rem]">
                    <Select
                      noWrapper
                      value={activeCharacterId || ''}
                      onChange={(e) => onSelectCharacter(e.target.value)}
                      className={`w-full h-11 bg-surface-2 font-medium text-text-primary ps-3 pe-8 rounded-lg border border-border appearance-none cursor-pointer truncate ${focusRing}`}
                      title="تغییر شخصیت در این کمپین"
                      aria-label="شخصیت فعال"
                    >
                      {characters.map(c => (
                        <option key={c.id} value={c.id} className="bg-surface text-text-primary">
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </>
            ) : viewMode === 'character_master' ? (
              <div className="flex items-center gap-1 min-w-0">
                {onGoHome && (
                  <Button
                    type="button"
                    onClick={onGoHome}
                    className={`h-11 px-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 transition ${focusRing}`}
                  >
                    خانه
                  </Button>
                )}
                <ChevronLeft className="w-4 h-4 text-text-disabled shrink-0" />
                <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">پرونده جامع شخصیت</h1>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 min-w-0">
                <h1 className="text-base font-bold text-text-primary truncate">{APP_NAME_FA}</h1>
                <span className="hidden md:inline text-sm text-text-muted truncate">{APP_TAGLINE}</span>
              </div>
            )}
          </div>

          {/* ---------- End: what needs me, then the menu ---------- */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sync problems only. When everything is saved, the bar says nothing. */}
            {showSync && (
              <Button
                type="button"
                onClick={() => (hasConflict ? onOpenConflicts?.() : setSyncSheetOpen(true))}
                aria-label={syncLabel}
                title={syncLabel}
                className={`relative inline-flex items-center justify-center w-11 h-11 rounded-lg transition ${syncTone} ${focusRing}`}
              >
                {hasConflict ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : isOffline ? (
                  <WifiOff className="w-5 h-5" />
                ) : (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                )}
                {(hasConflict || queueLength > 0) && (
                  <span className="absolute top-0.5 end-0.5">
                    <CountBadge value={hasConflict ? conflictCount || 1 : queueLength} tone={hasConflict ? 'danger' : 'accent'} />
                  </span>
                )}
              </Button>
            )}

            {/* Live fight: the one loud thing in the bar */}
            {inCampaign && activeEncounter && onOpenActiveEncounter && (
              <Button
                type="button"
                onClick={onOpenActiveEncounter}
                aria-label={`مبارزه زنده: ${activeEncounter.name}`}
                title={`مبارزه فعال: ${activeEncounter.name}`}
                className={`inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-danger text-on-danger text-sm font-bold ${focusRing}`}
              >
                <span className="w-2 h-2 rounded-full bg-on-danger animate-pulse" aria-hidden="true" />
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">مبارزه زنده</span>
              </Button>
            )}

            {showLevelUp && (
              <Button
                type="button"
                onClick={onOpenLevelUp}
                title="ارتقای سطح آماده است"
                className={`hidden sm:inline-flex items-center gap-1.5 h-11 px-3 rounded-lg bg-accent text-on-accent text-sm font-bold ${focusRing}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>ارتقای سطح</span>
              </Button>
            )}

            {inCampaign && isDm && onToggleDmView && (
              <Button
                type="button"
                onClick={onToggleDmView}
                aria-pressed={isDmView}
                title={isDmView ? 'بازگشت به برگه شخصیت' : 'رفتن به ابزارهای مستر'}
                className={`hidden md:inline-flex items-center gap-1.5 h-11 px-3 rounded-lg border text-sm font-medium transition ${
                  isDmView
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface-2 text-text-primary border-border hover:border-accent'
                } ${focusRing}`}
              >
                {isDmView ? <Shield className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                <span>{isDmView ? 'ابزارهای مستر' : 'برگه شخصیت'}</span>
              </Button>
            )}

            {onOpenNotifications && (
              <Button
                type="button"
                onClick={onOpenNotifications}
                aria-label="اعلان‌ها"
                title="اعلان‌ها و رویدادها"
                className={`${ghostIconBtn} hidden md:inline-flex`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 end-0.5">
                    <CountBadge value={unreadNotificationsCount} />
                  </span>
                )}
              </Button>
            )}

            {!currentUser && (
              <Button
                type="button"
                onClick={onOpenAuth}
                className={`h-11 px-4 rounded-lg btn-primary text-sm font-bold ${focusRing}`}
              >
                ورود / عضویت
              </Button>
            )}

            {/* One menu button for everyone: avatar when signed in, hamburger otherwise */}
            <Button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={menuOpen}
              aria-controls="header-menu"
              title={ 'منو'}
              className={ghostIconBtn}
            >
              {(
                <Menu className="w-5 h-5" />
              )}
              {menuNeedsAttention && (
                <span className="absolute top-1.5 end-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {inCampaign && activeCampaignRole === 'spectator' && (
          <div className="w-full bg-surface border-t border-border px-3 py-1.5 flex items-center justify-center gap-2 text-xs text-text-muted">
            <Eye className="w-4 h-4 shrink-0" />
            <span>حالت تماشا: فقط می‌توانید برگه و تاس‌های روی میز را ببینید</span>
          </div>
        )}
      </header>

      {/* ================= Menu drawer ================= */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-overlay/60 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            id="header-menu"
            ref={menuPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="منوی اصلی"
            dir="rtl"
            className="fixed top-0 end-0 z-50 w-[min(22rem,92vw)] h-full bg-surface border-s border-border shadow-2xl overflow-y-auto overscroll-contain"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] bg-surface border-b border-border">
              {currentUser ? (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-surface-2 border border-border text-base font-bold text-accent flex items-center justify-center shrink-0">
                    {displayName?.[0] || 'ز'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">{displayName}</div>
                    {currentUser.email && <div className="text-xs text-text-muted truncate">{currentUser.email}</div>}
                  </div>
                </div>
              ) : (
                <h2 className="text-base font-bold text-text-primary">{APP_NAME_FA}</h2>
              )}
              <Button
                type="button"
                onClick={closeMenu}
                aria-label="بستن منو"
                className={ghostIconBtn}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <MenuGroup title="ناوبری">
                {onGoHome && <MenuRow icon={<Home className="w-4 h-4" />} label="صفحه اصلی" onClick={act(onGoHome)} />}
                {onOpenCampaignSwitcher && (
                  <MenuRow icon={<ArrowLeftRight className="w-4 h-4" />} label="جابه‌جایی بین کمپین‌ها" onClick={act(onOpenCampaignSwitcher)} />
                )}
                {onOpenNotifications && (
                  <MenuRow
                    icon={<Bell className="w-4 h-4" />}
                    label="اعلان‌ها و رویدادها"
                    onClick={act(onOpenNotifications)}
                    trailing={unreadNotificationsCount > 0 ? <CountBadge value={unreadNotificationsCount} /> : undefined}
                  />
                )}
              </MenuGroup>

              {inCampaign && (isDm || showLevelUp) && (
                <MenuGroup title="این کمپین">
                  {showLevelUp && (
                    <MenuRow icon={<Sparkles className="w-4 h-4 text-accent" />} label="ارتقای سطح آماده است" onClick={act(onOpenLevelUp)} />
                  )}
                  {isDm && onToggleDmView && (
                    <MenuRow
                      icon={isDmView ? <BookOpen className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      label={isDmView ? 'رفتن به برگه شخصیت' : 'رفتن به ابزارهای مستر'}
                      onClick={act(onToggleDmView)}
                    />
                  )}
                  {isDm && onOpenCampaignApprovals && (
                    <MenuRow
                      icon={<ClipboardCheck className="w-4 h-4" />}
                      label="تأیید شخصیت‌ها و ارتقای سطح"
                      onClick={act(onOpenCampaignApprovals)}
                      trailing={pendingApprovalsCount > 0 ? <CountBadge value={pendingApprovalsCount} /> : undefined}
                    />
                  )}
                  {isDm && onOpenCampaignMembers && (
                    <MenuRow icon={<Users className="w-4 h-4" />} label="اعضا و نقش‌ها" onClick={act(onOpenCampaignMembers)} />
                  )}
                  {isDm && onOpenCampaignInvites && (
                    <MenuRow icon={<KeyRound className="w-4 h-4" />} label="کدهای دعوت" onClick={act(onOpenCampaignInvites)} />
                  )}
                  {isDm && onOpenCampaignSettings && (
                    <MenuRow icon={<Settings className="w-4 h-4" />} label="تنظیمات و قوانین کمپین" onClick={act(onOpenCampaignSettings)} />
                  )}
                </MenuGroup>
              )}

              {characters.length > 0 && (
                <MenuGroup title="شخصیت فعال">
                  {characters.map(c => (
                    <MenuRow
                      key={c.id}
                      icon={activeCharacterId === c.id ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <span className="w-4 h-4 block" />}
                      label={c.name}
                      selected={activeCharacterId === c.id}
                      onClick={act(() => onSelectCharacter(c.id))}
                      trailing={<span className="text-xs text-text-muted">سطح {toPersianDigits(c.level)}</span>}
                    />
                  ))}
                </MenuGroup>
              )}

              <MenuGroup title="نمایش">
                {onToggleTheme && (
                  <MenuRow
                    icon={theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    label="حالت ظاهری"
                    onClick={onToggleTheme}
                    trailing={<span className="text-xs text-text-muted">{theme === 'dark' ? 'تاریک' : 'روشن'}</span>}
                  />
                )}
                <MenuRow
                  icon={<Type className="w-4 h-4" />}
                  label="اندازه قلم"
                  onClick={onToggleFontScale}
                  trailing={
                    <span className="text-xs text-text-muted">
                      {fontScale === 'xlarge' ? 'خیلی بزرگ' : fontScale === 'large' ? 'بزرگ' : 'استاندارد'}
                    </span>
                  }
                />
                {wakeLockSupported && (
                  <MenuRow
                    icon={<Coffee className="w-4 h-4" />}
                    label="روشن ماندن صفحه"
                    onClick={onToggleWakeLock}
                    trailing={<span className={`text-xs ${wakeLockActive ? 'text-accent' : 'text-text-muted'}`}>{wakeLockActive ? 'روشن' : 'خاموش'}</span>}
                  />
                )}
              </MenuGroup>

              <MenuGroup title="اتصال و نسخه">
                <div className="flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm text-text-primary">
                  {isOffline ? (
                    <WifiOff className="w-4 h-4 text-warning shrink-0" />
                  ) : queueLength > 0 ? (
                    <RefreshCw className="w-4 h-4 text-accent shrink-0 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  )}
                  <span className="flex-1 min-w-0">
                    {isOffline
                      ? 'آفلاین: تغییرات روی دستگاه ذخیره می‌شوند'
                      : queueLength > 0
                      ? 'در حال ارسال تغییرات'
                      : 'همه تغییرات ذخیره شده است'}
                  </span>
                  {queueLength > 0 && <CountBadge value={queueLength} />}
                </div>
                {onSyncNow && (isOffline || queueLength > 0) && (
                  <MenuRow icon={<RefreshCw className="w-4 h-4" />} label="همگام‌سازی اکنون" onClick={onSyncNow} />
                )}
                {onCheckForUpdates ? (
                  <MenuRow
                    icon={<RefreshCw className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin text-accent' : ''}`} />}
                    label={isCheckingUpdates ? 'در حال بررسی…' : 'بررسی به‌روزرسانی'}
                    onClick={onCheckForUpdates}
                    disabled={isCheckingUpdates}
                    trailing={<span className="text-xs text-text-muted">نسخه {toPersianDigits(appVersion || APP_VERSION)}</span>}
                  />
                ) : (
                  <div className="flex items-center justify-between px-3 py-3 min-h-[44px] text-sm text-text-muted">
                    <span>نسخه</span>
                    <span className="text-xs">{toPersianDigits(appVersion || APP_VERSION)}</span>
                  </div>
                )}
              </MenuGroup>

              {currentUser && (
                <MenuGroup title="حساب">
                  {onOpenAccount && <MenuRow icon={<UserCog className="w-4 h-4" />} label="حساب کاربری و نشست‌ها" onClick={act(onOpenAccount)} />}
                  {currentUser.platformRole === 'admin' && onOpenAdminConsole && (
                    <MenuRow icon={<Shield className="w-4 h-4" />} label="کنسول مدیریت سامانه" onClick={act(onOpenAdminConsole)} />
                  )}
                  <MenuRow icon={<LogOut className="w-4 h-4" />} label="خروج از حساب" tone="danger" onClick={act(onLogout)} />
                </MenuGroup>
              )}

              {allUsers.length > 1 && (
                <details className="rounded-xl border border-border">
                  <summary className="min-h-[44px] flex items-center px-3 text-sm text-text-muted cursor-pointer">
                    تعویض کاربر (برای آزمایش)
                  </summary>
                  <div className="border-t border-border divide-y divide-border">
                    {allUsers.map(u => (
                      <MenuRow
                        key={u.id}
                        icon={<span className="w-4 h-4 block" />}
                        label={u.displayName || u.name}
                        selected={currentUser?.id === u.id}
                        onClick={act(() => onSwitchUser(u.id))}
                        trailing={<span className="text-xs text-text-muted">{u.role === 'dm' ? 'مستر' : 'بازیکن'}</span>}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= Sync details sheet ================= */}
      <BottomSheet
        isOpen={syncSheetOpen}
        onClose={() => setSyncSheetOpen(false)}
        title="وضعیت اتصال و همگام‌سازی"
        subtitle="تغییرات منتظر ارسال روی دستگاه شما"
      >
        <div className="space-y-4 p-4 text-start" dir="rtl">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isOffline ? 'bg-warning/15 border-warning/40' : 'bg-success/15 border-success/40'
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-primary">
                {isOffline ? 'آفلاین: ارتباط با سرور قطع است' : 'اتصال برقرار است'}
              </h4>
              <p className="text-sm text-text-primary leading-relaxed">
                {isOffline
                  ? 'اینترنت دستگاه قطع است. ویرایش‌های شما روی دستگاه می‌مانند و بعد از اتصال ارسال می‌شوند.'
                  : 'تغییرات بلافاصله با سرور همگام می‌شوند.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-2/40 border border-border space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-muted">تغییرات منتظر ارسال</span>
              <span className="text-sm font-bold text-text-primary">{toPersianDigits(queueLength)}</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              {queueLength > 0
                ? 'جان، یادداشت‌ها، کوله‌پشتی یا تاس‌ها روی این دستگاه ذخیره شده‌اند و با برقراری اتصال خودکار ارسال می‌شوند.'
                : 'صف خالی است و اطلاعات دستگاه شما با سرور یکسان است.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {onSyncNow && (
              <Button
                type="button"
                onClick={() => {
                  onSyncNow();
                  setSyncSheetOpen(false);
                }}
                className={`flex-1 h-11 px-4 rounded-lg btn-primary text-sm font-bold flex items-center justify-center gap-2 ${focusRing}`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>تلاش مجدد برای همگام‌سازی</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => setSyncSheetOpen(false)}
              className={`h-11 px-4 rounded-lg bg-surface-2 border border-border text-sm font-medium text-text-primary hover:border-accent ${focusRing}`}
            >
              بستن
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};