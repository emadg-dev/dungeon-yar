import React, { useState, useEffect } from 'react';
import { User, UserSession, Character } from '../types';
import { APP_NAME_LATIN } from '../config/app';
import { api } from '../services/api';
import { 
  X, User as UserIcon, Mail, KeyRound, Smartphone, Download, 
  LogOut, Shield, Check, AlertCircle, Trash2, Globe, Clock, CheckCircle2 
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  characters: Character[];
  activeCharacterId: string | null;
  onSelectActiveCharacter: (charId: string) => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
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

  if (!isOpen) return null;

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.length < 2 || displayName.length > 40) {
      showMsg('نام نمایشی باید بین ۲ تا ۴۰ نویسه باشد.', 'error');
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
      showMsg('رمز عبور جدید باید حداقل ۸ نویسه باشد.', 'error');
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
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${APP_NAME_LATIN.toLowerCase()}-export-${currentUser.displayName || currentUser.name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      showMsg('داده‌های کاراکترها و یادداشت‌های شما دانلود شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در خروجی داده‌ها.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0D0C]/95 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      dir="rtl"
    >
      <div className="w-full max-w-lg surface-card card-gold-top p-5 sm:p-7 space-y-5 my-auto relative shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 start-4 p-2 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
          title="بستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-[10px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center font-black">
            {(currentUser.displayName || currentUser.name)?.[0] || 'ح'}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#EDE6D8]">
              مدیریت حساب کاربری
            </h2>
            <p className="text-xs text-[#A39A89]">
              {currentUser.email} • {currentUser.role === 'dm' ? 'دانجن مستر' : 'ماجراجو'}
            </p>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex rounded-[12px] bg-[#201D19] p-1 border border-[#2F2A23] overflow-x-auto no-scrollbar gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 touch-target shrink-0 ${
              activeTab === 'profile'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>پروفایل</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 touch-target shrink-0 ${
              activeTab === 'security'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>امنیت و رمز</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 touch-target shrink-0 ${
              activeTab === 'sessions'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>نشست‌ها</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1 touch-target shrink-0 ${
              activeTab === 'data'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>داده‌ها</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-[10px] text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30'
                : 'bg-[#C2512B]/15 text-[#EDE6D8] border border-[#C2512B]/35'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#C2512B] shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Profile & Active Character */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#EDE6D8]">نام نمایشی در کمپین</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
                  placeholder="مثال: پردیس"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-4 rounded-[10px] btn-primary-amber font-extrabold text-xs touch-target min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره تغییرات نام</span>
              </button>
            </form>

            {/* Active Character Selector (if user owns characters) */}
            {characters.length > 0 && (
              <div className="pt-3 border-t border-[#2F2A23] space-y-2">
                <label className="block text-xs font-bold text-[#EDE6D8]">کاراکتر فعال شما:</label>
                <p className="text-[11px] text-[#A39A89]">
                  برگه کاراکتر و منابع بازی بر اساس این شخصیت فعال نمایش داده می‌شوند.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {characters.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectActiveCharacter(c.id)}
                      className={`text-right p-2.5 rounded-[10px] border flex items-center justify-between transition-all touch-target ${
                        activeCharacterId === c.id
                          ? 'bg-[#E0A030]/15 text-[#E0A030] border-[#E0A030]/50 font-bold'
                          : 'bg-[#201D19] text-[#EDE6D8] border-[#2F2A23] hover:border-[#E0A030]/40'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate text-xs">{c.name}</span>
                        <span className="text-[10px] text-[#A39A89]">{c.className} • سطح {c.level}</span>
                      </div>
                      {activeCharacterId === c.id && (
                        <Check className="w-4 h-4 text-[#E0A030] shrink-0" />
                      )}
                    </button>
                  ))}
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
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">تغییر رمز عبور</h4>
              <div className="space-y-1">
                <label className="block text-[11px] text-[#A39A89]">رمز عبور فعلی</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none text-left min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-[#A39A89]">رمز عبور جدید (حداقل ۸ نویسه)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none text-left min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-[#A39A89]">تکرار رمز عبور جدید</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none text-left min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-4 rounded-[10px] btn-primary-amber font-extrabold text-xs touch-target min-h-[44px]"
              >
                به‌روزرسانی رمز عبور
              </button>
            </form>

            {/* Change Email */}
            <form onSubmit={handleChangeEmail} className="pt-4 border-t border-[#2F2A23] space-y-3">
              <h4 className="text-xs font-extrabold text-[#EDE6D8]">تغییر نشانی رایانامه (ایمیل)</h4>
              <div className="space-y-1">
                <label className="block text-[11px] text-[#A39A89]">ایمیل جدید</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  dir="ltr"
                  inputMode="email"
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none text-left min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-[#A39A89]">تأیید با رمز عبور فعلی</label>
                <input
                  type="password"
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  dir="ltr"
                  className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none text-left min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#EDE6D8] touch-target min-h-[44px]"
              >
                ثبت ایمیل جدید
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Active Sessions List */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2F2A23]">
              <div>
                <h4 className="text-xs font-bold text-[#EDE6D8]">نشست‌های فعال دستگاه‌ها</h4>
                <p className="text-[10px] text-[#A39A89]">مدیریت دسترسی‌های فعال به حساب کاربری</p>
              </div>
              <button
                type="button"
                onClick={handleLogoutAll}
                className="text-[11px] text-[#C2512B] hover:underline font-bold"
              >
                خروج از همه دستگاه‌ها
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#EDE6D8] truncate">
                        {s.userAgent?.includes('Mobile') ? 'گوشی تلفن همراه' : 'رایانه یا مرورگر وب'}
                      </span>
                      {s.isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#6F9E78]/20 text-[#6F9E78] font-bold border border-[#6F9E78]/30">
                          این دستگاه
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#A39A89] truncate" dir="ltr">
                      {s.userAgent?.substring(0, 50)}...
                    </p>
                    <span className="text-[10px] text-[#A39A89] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#A39A89]" />
                      آخرین فعالیت: {new Date(s.lastSeenAt).toLocaleDateString('fa-IR')} {new Date(s.lastSeenAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="p-2 rounded-[8px] bg-[#171513] text-[#A39A89] hover:text-[#C2512B] border border-[#2F2A23] touch-target"
                      title="خاتمه دادن به این نشست"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Data Export & Logout */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[12px] bg-[#201D19] border border-[#2F2A23] space-y-2">
              <h4 className="text-xs font-bold text-[#EDE6D8]">خروجی گرفتن از تمام اطلاعات (JSON)</h4>
              <p className="text-[11px] text-[#A39A89] leading-relaxed">
                می‌توانید تمام شخصیت‌ها، یادداشت‌های خصوصی و مشخصات بازی خود را به صورت پرونده ساختاریافته JSON دریافت و ذخیره کنید.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="py-2 px-3 rounded-[8px] btn-primary-amber font-bold text-xs touch-target flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>دانلود نسخه پشتیبان داده‌ها</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#2F2A23]">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-[10px] bg-[#C2512B]/15 text-[#C2512B] hover:bg-[#C2512B]/25 border border-[#C2512B]/35 font-extrabold text-xs transition touch-target flex items-center justify-center gap-2 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
