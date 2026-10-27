import React, { useState } from 'react';
import { User, Character } from '../types';
import { APP_NAME_FA, APP_NAME_LATIN, APP_TAGLINE } from '../config/app';
import { BottomSheet } from './mobile/BottomSheet';
import { 
  CheckCircle2, RefreshCw, Shield, BookOpen, 
  SunMedium, Type, LogOut, ChevronDown, MoreVertical, Sparkles, Swords
} from 'lucide-react';

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
  saveStatus?: 'saved' | 'saving' | 'idle';
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
  pendingApprovalsCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDm = activeCampaignRole === 'owner' || activeCampaignRole === 'co_dm' || currentUser?.role === 'dm';

  return (
    <header className="sticky top-0 z-20 w-full max-w-full glass-panel border-b border-[#2F2A23] shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Brand & Campaign Switcher / Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Brand Seal Logo Mark */}
          <button
            type="button"
            onClick={onGoHome}
            className="relative flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#E0A030] to-[#C2512B] border border-[#F2C265]/40 shadow-[0_0_12px_rgba(224,160,48,0.3)] shrink-0 hover:scale-105 transition-transform"
            title={APP_NAME_FA}
          >
            <span className="text-base font-black text-[#0E0D0C] leading-none">ز</span>
          </button>

          {viewMode === 'campaign_space' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Campaign Switcher Chip */}
              {onOpenCampaignSwitcher && (
                <button
                  type="button"
                  onClick={onOpenCampaignSwitcher}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-black text-[#EDE6D8] truncate max-w-[130px] sm:max-w-[180px] touch-target transition"
                  title="تغییر یا انتخاب کمپین"
                >
                  <span className="truncate text-[#E0A030]">{activeCampaignName || 'کمپین'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A39A89] shrink-0" />
                </button>
              )}

              {/* Character Dropdown inside campaign */}
              {currentUser && characters.length > 0 && !isDmView && (
                <div className="relative min-w-0 max-w-[120px] sm:max-w-[160px]">
                  <select
                    value={activeCharacterId || ''}
                    onChange={(e) => onSelectCharacter(e.target.value)}
                    className="w-full bg-[#201D19] text-xs font-bold text-[#E0A030] py-1.5 pe-6 ps-2 rounded-[10px] border border-[#2F2A23] focus:outline-none appearance-none cursor-pointer truncate touch-target"
                    title="تغییر کاراکتر در این کمپین"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#171513] text-[#EDE6D8]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#A39A89] absolute start-auto end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
          ) : viewMode === 'character_master' ? (
            <div className="flex items-center gap-2 truncate">
              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  className="text-xs font-bold text-[#A39A89] hover:text-[#E0A030] transition flex items-center gap-1"
                >
                  خانه /
                </button>
              )}
              <h1 className="text-xs sm:text-sm font-black text-[#EDE6D8] truncate">
                پرونده جامع شخصیت
              </h1>
            </div>
          ) : (
            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-black tracking-wide text-[#EDE6D8] truncate">
                {APP_NAME_FA} <span className="text-[#E0A030] text-[11px] font-bold sm:inline hidden">• {APP_TAGLINE}</span>
              </h1>
            </div>
          )}
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* DM Pending Approvals notification */}
          {pendingApprovalsCount > 0 && onOpenCampaignApprovals && (
            <button
              type="button"
              onClick={onOpenCampaignApprovals}
              className="flex items-center gap-1 px-2 py-1 rounded-[10px] text-xs font-black bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40 hover:bg-[#E0A030]/30 transition touch-target animate-pulse"
              title={`${pendingApprovalsCount} درخواست در انتظار بررسی`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{pendingApprovalsCount}</span>
            </button>
          )}

          {/* Live Encounter Button for Players or DM */}
          {viewMode === 'campaign_space' && activeEncounter && onOpenActiveEncounter && (
            <button
              type="button"
              onClick={onOpenActiveEncounter}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-black bg-[#C2512B] hover:bg-[#D65D34] text-white animate-pulse border border-[#F2C265] shadow-[0_0_12px_rgba(194,81,43,0.6)] touch-target transition"
              title={`مبارزه فعال: ${activeEncounter.name}`}
            >
              <Swords className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">مبارزه زنده</span>
            </button>
          )}

          {/* Autosave Status Icon (when in campaign) */}
          {viewMode === 'campaign_space' && (
            <div className="flex items-center px-1" title={saveStatus === 'saving' ? 'در حال ذخیره‌سازی...' : 'ذخیره شد'}>
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#E0A030] animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6F9E78]" />
              )}
            </div>
          )}

          {/* DM / Player View Switcher (if user is DM in this campaign) */}
          {viewMode === 'campaign_space' && isDm && onToggleDmView && (
            <button
              type="button"
              onClick={onToggleDmView}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-xs font-bold transition border touch-target ${
                isDmView
                  ? 'bg-[#E0A030] text-[#0E0D0C] border-[#E0A030]'
                  : 'bg-[#201D19] text-[#EDE6D8] border-[#2F2A23] hover:border-[#E0A030]'
              }`}
              title={isDmView ? 'تغییر به کاراکترشیت' : 'تغییر به ابزارهای مستر'}
            >
              {isDmView ? <Shield className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isDmView ? 'ابزارهای مستر' : 'کاراکترشیت'}</span>
            </button>
          )}

          {/* Desktop-only Quick Tools */}
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Screen Wake Lock toggle */}
            {wakeLockSupported && (
              <button
                type="button"
                onClick={onToggleWakeLock}
                className={`p-1.5 rounded-[10px] text-xs font-bold transition border touch-target ${
                  wakeLockActive
                    ? 'bg-[#E0A030]/20 text-[#E0A030] border-[#E0A030]/50 shadow-[0_0_10px_rgba(224,160,48,0.2)]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                }`}
                title={wakeLockActive ? 'روشن ماندن صفحه فعال است' : 'فعال‌سازی روشن ماندن صفحه در حین بازی'}
              >
                <SunMedium className="w-4 h-4" />
              </button>
            )}

            {/* Font Scale toggle */}
            <button
              type="button"
              onClick={onToggleFontScale}
              className={`p-1.5 rounded-[10px] text-xs font-bold transition border touch-target ${
                fontScale !== 'normal'
                  ? 'bg-[#E0A030]/20 text-[#E0A030] border-[#E0A030]/40'
                  : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
              }`}
              title={fontScale === 'xlarge' ? 'فونت خیلی بزرگ' : fontScale === 'large' ? 'فونت بزرگ' : 'فونت استاندارد'}
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* User Account / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-1.5 py-1 px-2 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#EDE6D8] hover:border-[#E0A030] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0A030]/50 active:scale-95 transition touch-target"
                title={currentUser.displayName || currentUser.name}
              >
                <span className="w-2 h-2 rounded-full bg-[#6F9E78]" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentUser.displayName || currentUser.name}</span>
                <MoreVertical className="w-3.5 h-3.5 text-[#A39A89]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="py-1.5 px-3 rounded-[10px] btn-primary-amber font-bold text-xs shadow-md transition touch-target flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ورود / عضویت</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Menu Modal (centered modal, rendered via portal to be top-most) */}
      {mobileMenuOpen && (
        <BottomSheet
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title={currentUser?.displayName || currentUser?.name || 'منوی سریع'}
          subtitle={currentUser ? `نقش: ${currentUser.role === 'dm' ? 'دانجن مستر' : 'بازیکن'}` : undefined}
          centered
        >
          <div className="space-y-4">
            {/* User identity summary */}
            {currentUser && (
              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#201D19]/60 border border-[#2F2A23]">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#E0A030] to-[#C2512B] text-[#0E0D0C] font-black flex items-center justify-center shrink-0">
                  {(currentUser.displayName || currentUser.name)?.[0] || 'ز'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#EDE6D8] truncate">{currentUser.displayName || currentUser.name}</h3>
                  <span className="text-[10px] text-[#A39A89]">{currentUser.email}</span>
                </div>
                <span className="ms-auto w-2 h-2 rounded-full bg-[#6F9E78] shrink-0" title="آنلاین" />
              </div>
            )}

            {/* Navigation & Campaign Controls */}
            <div className="space-y-1.5">
              {onGoHome && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoHome();
                  }}
                  className="w-full py-2.5 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#EDE6D8] flex items-center gap-2 touch-target"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E0A030]" />
                  <span>صفحه اصلی (کمپین‌ها و کاراکترها)</span>
                </button>
              )}

              {onOpenCampaignSwitcher && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCampaignSwitcher();
                  }}
                  className="w-full py-2.5 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#E0A030] flex items-center justify-between touch-target"
                >
                  <span>جابجایی بین کمپین‌ها</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* DM Campaign Management Tools */}
              {isDm && viewMode === 'campaign_space' && (
                <div className="space-y-1 pt-1.5 border-t border-[#2F2A23]/60">
                  <span className="text-[10px] font-bold text-[#A39A89]">مدیریت این کمپین:</span>
                  {onOpenCampaignSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignSettings();
                      }}
                      className="w-full text-right py-2 px-2.5 rounded-[8px] bg-[#201D19]/60 hover:bg-[#201D19] text-xs text-[#EDE6D8] flex items-center justify-between touch-target"
                    >
                      <span>تنظیمات قوانین و واحدها</span>
                    </button>
                  )}
                  {onOpenCampaignMembers && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignMembers();
                      }}
                      className="w-full text-right py-2 px-2.5 rounded-[8px] bg-[#201D19]/60 hover:bg-[#201D19] text-xs text-[#EDE6D8] flex items-center justify-between touch-target"
                    >
                      <span>اعضا و تعیین نقش‌ها</span>
                    </button>
                  )}
                  {onOpenCampaignInvites && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignInvites();
                      }}
                      className="w-full text-right py-2 px-2.5 rounded-[8px] bg-[#201D19]/60 hover:bg-[#201D19] text-xs text-[#EDE6D8] flex items-center justify-between touch-target"
                    >
                      <span>ساخت و مدیریت کدهای دعوت</span>
                    </button>
                  )}
                  {onOpenCampaignApprovals && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCampaignApprovals();
                      }}
                      className="w-full text-right py-2 px-2.5 rounded-[8px] bg-[#201D19]/60 hover:bg-[#201D19] text-xs text-[#EDE6D8] flex items-center justify-between touch-target"
                    >
                      <span>تأیید کاراکترها و ارتقای لول</span>
                      {pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#E0A030]/20 text-[#F2C265] text-[10px] font-bold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Account Management Button */}
            {onOpenAccount && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="w-full py-2.5 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#EDE6D8] flex items-center justify-center gap-2 touch-target"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E0A030]" />
                <span>مدیریت حساب کاربری و نشست‌ها</span>
              </button>
            )}

            {/* Character selection if multiple */}
            {characters.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A39A89]">کاراکتر انتخابی شما:</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {characters.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCharacter(c.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right p-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-between border touch-target ${
                        activeCharacterId === c.id
                          ? 'bg-[#E0A030]/15 text-[#E0A030] border-[#E0A030]/40'
                          : 'bg-[#201D19] text-[#EDE6D8] border-[#2F2A23]'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-[#A39A89]">L{c.level}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Switcher for playtesting */}
            {allUsers.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-[#2F2A23]">
                <label className="text-xs font-bold text-[#A39A89]">سوئیچ کاربر برای تست بازی:</label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right p-2 rounded-[8px] text-xs font-bold transition flex items-center justify-between touch-target ${
                        currentUser?.id === u.id
                          ? 'bg-[#E0A030]/10 text-[#E0A030]'
                          : 'text-[#A39A89] hover:text-[#EDE6D8]'
                      }`}
                    >
                      <span className="truncate">{u.displayName || u.name}</span>
                      <span className="text-[10px]">{u.role === 'dm' ? 'مستر' : 'بازیکن'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Utility Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#2F2A23]">
              {wakeLockSupported && (
                <button
                  type="button"
                  onClick={onToggleWakeLock}
                  className="w-full flex items-center justify-between p-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] touch-target"
                >
                  <span className="flex items-center gap-1.5">
                    <SunMedium className="w-4 h-4 text-[#E0A030]" />
                    روشن ماندن صفحه
                  </span>
                  <span className="text-[10px] font-bold text-[#E0A030]">
                    {wakeLockActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleFontScale}
                className="w-full flex items-center justify-between p-2.5 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] touch-target"
              >
                <span className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#E0A030]" />
                  اندازه قلم
                </span>
                <span className="text-[10px] font-bold text-[#E0A030]">
                  {fontScale === 'xlarge' ? 'خیلی بزرگ' : fontScale === 'large' ? 'بزرگ' : 'استاندارد'}
                </span>
              </button>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-[10px] bg-[#C2512B]/15 hover:bg-[#C2512B]/25 text-[#C2512B] border border-[#C2512B]/30 text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </BottomSheet>
      )}
    </header>
  );
};
