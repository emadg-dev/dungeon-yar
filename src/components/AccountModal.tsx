import { Button } from './ui/Button';
import { Input } from './ui/Input';
import React, { useState, useEffect } from 'react';
import { User, UserSession, Character } from '../types';
import { APP_NAME_FA, APP_NAME_LATIN, APP_VERSION, APP_VERSION_FA } from '../config/app';
import { api } from '../services/api';
import { toPersianDigits } from '../../shared/rules/historyEngine';
import { usePWARefresh } from '../hooks/usePWARefresh';
import { 
  X, User as UserIcon, Mail, KeyRound, Smartphone, Download, 
  LogOut, Shield, Check, AlertCircle, Trash2, Globe, Clock, CheckCircle2, RefreshCw, Sun, Moon 
} from 'lucide-react';
import { ScrollableRow } from './ui/ScrollableRow';
import { BottomSheet } from './mobile/BottomSheet';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  characters: Character[];
  activeCharacterId: string | null;
  onSelectActiveCharacter: (charId: string) => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  characters,
  activeCharacterId,
  onSelectActiveCharacter,
  onUpdateUser,
  onLogout,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'data'>('profile');

  // Profile form
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.name || '');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email change form
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');

  // Sessions list
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Account deletion form
  const [deleteMode, setDeleteMode] = useState<'anonymize' | 'remove_all'>('anonymize');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.displayName || currentUser.name || '');
      loadSessions();
    }
  }, [isOpen, currentUser]);

  const loadSessions = async () => {
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch {}
  };

  const { checkForUpdates, isChecking: isCheckingUpdates } = usePWARefresh();

  const handleModalCheckUpdates = async () => {
    showMsg(`در حال بررسی نسخه جدید ${APP_NAME_FA}...`);
    const res = await checkForUpdates();
    if (res.status === 'updated') {
      showMsg('نسخه جدید دریافت شد! لطفاً برنامه را مجدداً باز کنید.');
    } else if (res.status === 'latest') {
      showMsg(`شما از آخرین نسخه ${APP_NAME_FA} (${APP_VERSION_FA}) استفاده می‌کنید.`);
    } else if (res.status === 'offline') {
      showMsg('دستگاه شما آفلاین است. برای بررسی به‌روزرسانی به اینترنت متصل شوید.', 'error');
    } else {
      showMsg(`شما از آخرین نسخه ${APP_NAME_FA} (${APP_VERSION_FA}) استفاده می‌کنید.`);
    }
  };

  if (!isOpen) return null;

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.length < 2 || displayName.length > 40) {
      showMsg('نام نمایشی باید بین 2 تا 40 نویسه باشد.', 'error');
      return;
    }
    setLoading(true);
    try {
      const updated = await api.updateProfile(displayName.trim());
      onUpdateUser(updated);
      showMsg('پروفایل شما با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در ویرایش پروفایل.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showMsg('رمز عبور فعلی الزامی است.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showMsg('رمز عبور جدید باید حداقل 8 نویسه باشد.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg('تکرار رمز عبور جدید همخوانی ندارد.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMsg('رمز عبور شما با موفقیت تغییر کرد و سایر نشست‌ها خاتمه یافتند.');
      loadSessions();
    } catch (err: any) {
      showMsg(err.message || 'خطا در تغییر رمز عبور.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showMsg('آدرس ایمیل جدید معتبر نیست.', 'error');
      return;
    }
    if (!emailCurrentPassword) {
      showMsg('جهت تغییر ایمیل، وارد کردن رمز عبور فعلی الزامی است.', 'error');
      return;
    }
    setLoading(true);
    try {
      const updated = await api.changeEmail(emailCurrentPassword, newEmail);
      onUpdateUser(updated);
      setNewEmail('');
      setEmailCurrentPassword('');
      showMsg('آدرس ایمیل حساب کاربری با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در تغییر ایمیل.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      showMsg('نشست انتخابی با موفقیت لغو شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در لغو نشست.', 'error');
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('آیا از خروج از تمام دستگاه‌ها و نشست‌ها اطمینان دارید؟')) return;
    try {
      await api.logoutAll();
      onLogout();
      onClose();
    } catch (err: any) {
      showMsg(err.message || 'خطا در خروج سراسری.', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${APP_NAME_LATIN.toLowerCase()}-account-export-${currentUser.displayName || currentUser.name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      showMsg(`پشتیبان کامل دانلود شد (${data.characters?.length || 0} شخصیت، ${data.notes?.length || 0} یادداشت).`);
    } catch (err: any) {
      showMsg(err.message || 'خطا در خروجی داده‌ها.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMsg('وارد کردن رمز عبور فعلی الزامی است.', 'error');
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount({
        password: deletePassword,
        mode: deleteMode
      });
      alert('حساب کاربری شما با موفقیت حذف شد.');
      onLogout();
      onClose();
    } catch (err: any) {
      showMsg(err.message || 'خطا در حذف حساب کاربری.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-black text-xs shrink-0">
            {(currentUser.displayName || currentUser.name)?.[0] || 'ح'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-text-primary truncate">
              مدیریت حساب کاربری
            </h2>
            <p className="text-xs text-text-muted truncate">
              {currentUser.email} • {currentUser.role === 'dm' ? 'دانجن مستر' : 'ماجراجو'}
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">

        {/* Tab strip */}
        <ScrollableRow
          activeKey={activeTab}
          wrapperClassName="rounded-[12px] bg-surface-2 p-1 border border-border"
          className="gap-1"
        >
          <Button 
            type="button"
            data-key="profile"
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-3 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
              activeTab === 'profile'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap shrink-0">پروفایل</span>
          </Button>
          <Button 
            type="button"
            data-key="security"
            onClick={() => setActiveTab('security')}
            className={`py-1.5 px-3 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
              activeTab === 'security'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap shrink-0">امنیت و رمز</span>
          </Button>
          <Button 
            type="button"
            data-key="sessions"
            onClick={() => setActiveTab('sessions')}
            className={`py-1.5 px-3 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
              activeTab === 'sessions'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap shrink-0">نشست‌ها</span>
          </Button>
          <Button 
            type="button"
            data-key="data"
            onClick={() => setActiveTab('data')}
            className={`py-1.5 px-3 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
              activeTab === 'data'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap shrink-0">داده‌ها</span>
          </Button>
        </ScrollableRow>

        {/* Feedback message banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-[10px] text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-danger/15 text-text-primary border border-danger/35'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Profile & Active Character */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-primary">نام نمایشی در کمپین</label>
                <Input noWrapper 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none min-h-[44px]"
                  placeholder="مثال: پردیس"
                 />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="py-2.5 px-4 rounded-[10px] btn-primary font-extrabold text-xs touch-target min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره تغییرات نام</span>
              </Button>
            </form>

            {/* Active Character Selector (if user owns characters) */}
            {characters.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <label className="block text-xs font-bold text-text-primary">کاراکتر فعال شما:</label>
                <p className="text-xs text-text-muted">
                  برگه کاراکتر و منابع بازی بر اساس این شخصیت فعال نمایش داده می‌شوند.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {characters.map(c => (
                    <Button 
                      key={c.id}
                      type="button"
                      onClick={() => onSelectActiveCharacter(c.id)}
                      className={`text-start p-2.5 rounded-[10px] border flex flex-wrap items-center justify-between gap-2 transition-all touch-target min-w-[44px] ${
                        activeCharacterId === c.id
                          ? 'bg-accent/15 text-accent border-accent/50 font-bold'
                          : 'bg-surface-2 text-text-primary border-border hover:border-accent/40'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate text-xs">{c.name}</span>
                        <span className="text-xs text-text-muted">{c.className} • سطح {c.level}</span>
                      </div>
                      {activeCharacterId === c.id && (
                        <Check className="w-4 h-4 text-accent shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Preference */}
            {onToggleTheme && (
              <div className="pt-3 border-t border-border space-y-2">
                <label className="block text-xs font-bold text-text-primary">حالت ظاهری برنامه (تم):</label>
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-surface-2 border border-border gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-accent" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate">
                        {theme === 'dark' ? 'تم زغالی کهن (تاریک)' : 'تم کاغذپوستی روشن'}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {theme === 'dark' ? 'مناسب برای بازی در نور کم و محیط‌های تاریک' : 'کنتراست بالای خوانایی برای روز'}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={onToggleTheme}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-accent text-xs font-bold text-accent shrink-0"
                  >
                    {theme === 'dark' ? 'تغییر به روشن' : 'تغییر به تاریک'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Security (Password & Email) */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <h4 className="text-xs font-extrabold text-text-primary">تغییر رمز عبور</h4>
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">رمز عبور فعلی</label>
                <Input noWrapper 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                 />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">رمز عبور جدید (حداقل 8 نویسه)</label>
                <Input noWrapper 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                 />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">تکرار رمز عبور جدید</label>
                <Input noWrapper 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                 />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="py-2.5 px-4 rounded-[10px] btn-primary font-extrabold text-xs touch-target min-w-[44px] min-h-[44px]"
              >
                به‌روزرسانی رمز عبور
              </Button>
            </form>

            {/* Change Email */}
            <form onSubmit={handleChangeEmail} className="pt-4 border-t border-border space-y-3">
              <h4 className="text-xs font-extrabold text-text-primary">تغییر نشانی رایانامه (ایمیل)</h4>
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">ایمیل جدید</label>
                <Input noWrapper 
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  dir="ltr"
                  inputMode="email"
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                 />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">تأیید با رمز عبور فعلی</label>
                <Input noWrapper 
                  type="password"
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                 />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="py-2 px-4 rounded-[10px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-text-primary touch-target min-w-[44px] min-h-[44px]"
              >
                ثبت ایمیل جدید
              </Button>
            </form>
          </div>
        )}

        {/* Tab 3: Active Sessions List */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h4 className="text-xs font-bold text-text-primary">نشست‌های فعال دستگاه‌ها</h4>
                <p className="text-xs text-text-muted">مدیریت دسترسی‌های فعال به حساب کاربری</p>
              </div>
              <Button 
                type="button"
                onClick={handleLogoutAll}
                className="text-xs text-danger hover:underline font-bold"
              >
                خروج از همه دستگاه‌ها
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2 gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-primary truncate">
                        {s.userAgent?.includes('Mobile') ? 'گوشی تلفن همراه' : 'رایانه یا مرورگر وب'}
                      </span>
                      {s.isCurrent && (
                        <span className="text-xs px-1.5 py-0.2 rounded-[6px] bg-success/20 text-success font-bold border border-success/30">
                          این دستگاه
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate" dir="ltr">
                      {s.userAgent?.substring(0, 50)}...
                    </p>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      آخرین فعالیت: {new Date(s.lastSeenAt).toLocaleDateString('fa-IR-u-nu-latn')} {new Date(s.lastSeenAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!s.isCurrent && (
                    <Button 
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="p-2 rounded-[8px] bg-surface text-text-muted hover:text-danger border border-border touch-target min-w-[44px]"
                      title="خاتمه دادن به این نشست"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Data Export & Logout */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-surface-2 border border-border space-y-2">
              <h4 className="text-xs font-bold text-text-primary">خروجی گرفتن از تمام اطلاعات (JSON)</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                می‌توانید تمام شخصیت‌ها، یادداشت‌های خصوصی و مشخصات بازی خود را به صورت پرونده ساختاریافته JSON دریافت و ذخیره کنید.
              </p>
              <Button 
                type="button"
                onClick={handleExportData}
                className="py-2 px-3 rounded-[8px] btn-primary font-bold text-xs touch-target min-w-[44px] flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>دانلود نسخه پشتیبان داده‌ها</span>
              </Button>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="p-3.5 rounded-[12px] bg-danger/10 border border-danger/35 space-y-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-extrabold">منطقه خطر: حذف حساب کاربری</h4>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                با حذف حساب، نشست‌های شما منقضی شده و دسترسی شما قطع می‌شود. نحوه مدیریت داده‌ها را انتخاب کنید:
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-2 p-2.5 rounded-[8px] bg-surface border border-border cursor-pointer">
                  <Input noWrapper 
                    type="radio"
                    name="deleteMode"
                    value="anonymize"
                    checked={deleteMode === 'anonymize'}
                    onChange={() => setDeleteMode('anonymize')}
                    className="mt-0.5 accent-accent"
                   />
                  <div className="text-xs">
                    <strong className="text-text-primary block">ناشناس‌سازی (توصیه‌شده برای حفظ کمپین‌ها)</strong>
                    <span className="text-text-muted">نام شما به «کاربر حذف‌شده» تبدیل می‌شود تا رکورد بازی و یادداشت‌های ثبت‌شده برای بقیه بازیکنان و کمپین خراب نشود. کمپین‌های تحت مالکیت شما به دستیار DM یا حالت بایگانی منتقل می‌گردد.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2.5 rounded-[8px] bg-surface border border-border cursor-pointer">
                  <Input noWrapper 
                    type="radio"
                    name="deleteMode"
                    value="remove_all"
                    checked={deleteMode === 'remove_all'}
                    onChange={() => setDeleteMode('remove_all')}
                    className="mt-0.5 accent-danger"
                   />
                  <div className="text-xs">
                    <strong className="text-text-primary block">حذف کامل حساب و کاراکترها</strong>
                    <span className="text-text-muted">حساب کاربری و تمام شخصیت‌های اختصاصی شما غیرفعال و نشانه‌گذاری حذف می‌شوند.</span>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs text-text-primary font-bold">برای تأیید، رمز عبور فعلی خود را وارد کنید:</label>
                <Input noWrapper 
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="رمز عبور فعلی"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[8px] bg-surface border border-danger/40 text-xs text-text-primary focus:border-danger outline-none min-h-[44px]"
                 />
              </div>

              {!showDeleteConfirm ? (
                <Button 
                  type="button"
                  onClick={() => {
                    if (!deletePassword) {
                      showMsg('ابتدا رمز عبور فعلی خود را وارد نمایید.', 'error');
                      return;
                    }
                    setShowDeleteConfirm(true);
                  }}
                  className="py-2 px-3 rounded-[8px] bg-danger/20 text-danger hover:bg-danger/30 border border-danger/40 text-xs font-bold touch-target min-w-[44px] min-h-[44px] flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>درخواست حذف حساب کاربری</span>
                </Button>
              ) : (
                <div className="p-3 rounded-[8px] bg-surface border border-danger space-y-2">
                  <span className="text-xs font-bold text-danger block">آیا 100٪ مطمئن هستید؟ این عملیات غیرقابل بازگشت است.</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="py-1.5 px-3 rounded-[6px] bg-danger text-white hover:bg-danger font-bold text-xs touch-target min-w-[44px] min-h-[40px]"
                    >
                      {deleting ? 'در حال حذف...' : 'بله، حسابم را حذف کن'}
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 rounded-[6px] bg-surface-2 text-text-muted hover:text-text-primary text-xs font-bold touch-target min-w-[44px] min-h-[40px]"
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* App Version & Check for updates row */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs font-bold text-text-primary">
                  نسخه {toPersianDigits(APP_VERSION)}
                </span>
              </div>
              <Button 
                type="button"
                onClick={handleModalCheckUpdates}
                disabled={isCheckingUpdates}
                className="py-1.5 px-3 rounded-[8px] bg-surface-2 border border-border hover:border-accent text-xs font-bold text-accent disabled:opacity-50 transition flex items-center gap-1.5 touch-target min-h-[44px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdates ? 'در حال بررسی...' : 'بررسی به‌روزرسانی'}</span>
              </Button>
            </div>

            <div className="pt-2">
              <Button 
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-[10px] bg-surface-2 text-text-primary hover:text-danger hover:bg-surface-2/80 border border-border font-extrabold text-xs transition touch-target min-w-[44px] flex items-center justify-center gap-2 min-h-[44px]"
              >
                <LogOut className="w-4 h-4 text-text-muted" />
                <span>خروج از حساب کاربری</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
