import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { APP_NAME_FA } from '../config/app';
import { SEED_USERS } from '../data/seed';
import { api } from '../services/api';
import { Shield, Sparkles, KeyRound, Mail, UserPlus, LogIn, Eye, EyeOff, X, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { BottomSheet } from './mobile/BottomSheet';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register' | 'reset';
  initialInviteCode?: string;
  initialResetToken?: string;
  onSelectPreloadedUser?: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialInviteCode = '',
  initialResetToken = '',
  onSelectPreloadedUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    if (initialInviteCode) setInviteCode(initialInviteCode);
    if (initialResetToken) setResetToken(initialResetToken);
  }, [initialMode, initialInviteCode, initialResetToken]);

  if (!isOpen) return null;

  // Password strength calculator (0 to 4)
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(password);
  const strengthLabels = ['خیلی کوتاه / ضعیف', 'متوسط', 'خوب', 'قوی', 'بسیار امن'];
  const strengthColors = ['bg-danger', 'bg-warning', 'bg-accent', 'bg-success', 'bg-success'];

  const validate = () => {
    const errors: Record<string, string> = {};

    if (mode === 'login' || mode === 'register') {
      if (!email.trim()) {
        errors.email = 'پست الکترونیکی الزامی است.';
      } else if (!email.includes('@')) {
        errors.email = 'فرمت آدرس ایمیل صحیح نمی‌باشد.';
      }
    }

    if (mode === 'login') {
      if (!password) {
        errors.password = 'رمز عبور الزامی است.';
      }
    }

    if (mode === 'register') {
      if (!displayName.trim() || displayName.length < 2 || displayName.length > 40) {
        errors.displayName = 'نام نمایشی باید بین 2 تا 40 نویسه باشد.';
      }
      if (!password || password.length < 8) {
        errors.password = 'رمز عبور باید حداقل 8 نویسه باشد.';
      }
      if (password && email && password.toLowerCase() === email.toLowerCase()) {
        errors.password = 'رمز عبور نمی‌تواند مشابه ایمیل باشد.';
      }
    }

    if (mode === 'reset') {
      if (!resetToken.trim()) {
        errors.resetToken = 'توکن تغییر رمز الزامی است.';
      }
      if (!password || password.length < 8) {
        errors.password = 'رمز عبور جدید باید حداقل 8 نویسه باشد.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'تکرار رمز عبور همخوانی ندارد.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;

    setLoading(true);
    try {
      let user: User;
      if (mode === 'login') {
        user = await api.login(email, password);
      } else if (mode === 'register') {
        user = await api.register(email, password, displayName, inviteCode);
      } else if (mode === 'reset') {
        user = await api.consumeResetToken(resetToken, password);
      } else {
        return;
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'خطایی در پردازش رخ داد. لطفاً مجدداً بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`درگاه احراز هویت ${APP_NAME_FA}`}
      subtitle={
        mode === 'login' ? 'ورود ماجراجویان و دانجن مستر به گاهشمار وقایع' :
        mode === 'register' ? 'عضویت در کارزار با کد دعوت دانجن مستر' :
        mode === 'reset' ? 'تنظیم رمز عبور جدید از طریق پیوند اختصاصی' :
        'فراموشی رمز عبور و بازیابی دسترسی'
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">

        {/* Seal Mark & Logo Wordmark */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface border-2 border-accent shadow-[0_0_24px_rgba(224,160,48,0.3)] mb-3 relative">
            <svg
              viewBox="0 0 100 100"
              className="w-10 h-10 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="50,15 85,78 15,78" stroke="currentColor" fill="none" opacity="0.9" />
              <circle cx="50" cy="55" r="16" stroke="currentColor" fill="none" opacity="0.7" />
              <line x1="50" y1="20" x2="50" y2="4" stroke="currentColor" />
              <line x1="80" y1="75" x2="94" y2="83" stroke="currentColor" />
              <line x1="20" y1="75" x2="6" y2="83" stroke="currentColor" />
            </svg>
          </div>

          <h2 className="text-xl font-black text-text-primary tracking-tight">
            درگاه احراز هویت {APP_NAME_FA}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            {mode === 'login' && 'ورود ماجراجویان و دانجن مستر به گاهشمار وقایع'}
            {mode === 'register' && 'عضویت در کارزار با کد دعوت دانجن مستر'}
            {mode === 'reset' && 'تنظیم رمز عبور جدید از طریق پیوند اختصاصی'}
            {mode === 'forgot' && 'فراموشی رمز عبور و بازیابی دسترسی'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {mode !== 'reset' && mode !== 'forgot' && (
          <div className="flex rounded-[12px] bg-surface-2 p-1 border border-border">
            <button
              type="button"
              onClick={() => { setMode('login'); setGeneralError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] ${
                mode === 'login'
                  ? 'bg-accent text-on-accent shadow-sm font-extrabold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود به حساب</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setGeneralError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 touch-target min-w-[44px] ${
                mode === 'register'
                  ? 'bg-accent text-on-accent shadow-sm font-extrabold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ثبت‌نام با دعوت</span>
            </button>
          </div>
        )}

        {/* General Error Banner */}
        {generalError && (
          <div className="p-3 rounded-[10px] bg-danger/15 border border-danger/40 text-text-primary text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <span className="leading-relaxed">{generalError}</span>
          </div>
        )}

        {/* Forgot Password Explanation View */}
        {mode === 'forgot' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-text-primary">فراموشی رمز عبور</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              جهت حفظ امنیت و محرمانگی سناریوی کمپین، بازنشانی رمز عبور ماجراجویان به صورت مستقیم توسط <strong>دانجن مستر</strong> انجام می‌شود. لطفاً از دانجن مستر خود بخواهید یک «لینک یک‌بار مصرف تغییر رمز» برای شما ارسال کند.
            </p>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2.5 rounded-[12px] btn-primary-amber font-extrabold text-xs touch-target min-w-[44px]"
            >
              بازگشت به صفحه ورود
            </button>
          </div>
        )}

        {/* Main Form (Login / Register / Reset) */}
        {mode !== 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-primary">نام نمایشی در بازی</label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: پردیس یا آریا"
                    autoComplete="nickname"
                    enterKeyHint="next"
                    className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none min-h-[44px]"
                  />
                </div>
                {fieldErrors.displayName && (
                  <p className="text-xs text-danger">{fieldErrors.displayName}</p>
                )}
              </div>
            )}

            {/* Email (Login / Register) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-primary">رایانامه (ایمیل)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    enterKeyHint="next"
                    className="w-full py-2.5 ps-9 pe-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                  />
                  <Mail className="w-4 h-4 text-text-muted absolute top-3.5 start-3 pointer-events-none" />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-danger">{fieldErrors.email}</p>
                )}
              </div>
            )}

            {/* Invite Code (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-text-primary">کد دعوت کمپین</label>
                  <span className="text-xs text-text-muted">برای ایمیل‌های DM الزامی نیست</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="کد دعوت دریافتی از DM"
                    dir="ltr"
                    enterKeyHint="next"
                    className="w-full py-2.5 ps-9 pe-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end font-mono min-h-[44px]"
                  />
                  <KeyRound className="w-4 h-4 text-text-muted absolute top-3.5 start-3 pointer-events-none" />
                </div>
                {fieldErrors.inviteCode && (
                  <p className="text-xs text-danger">{fieldErrors.inviteCode}</p>
                )}
              </div>
            )}

            {/* Reset Token (Reset mode only) */}
            {mode === 'reset' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-primary">توکن بازنشانی</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="توکن دریافت شده از دانجن مستر"
                  dir="ltr"
                  className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end font-mono min-h-[44px]"
                />
                {fieldErrors.resetToken && (
                  <p className="text-xs text-danger">{fieldErrors.resetToken}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-text-primary">
                  {mode === 'reset' ? 'رمز عبور جدید' : 'رمز عبور'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-accent hover:underline"
                  >
                    فراموشی رمز؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل 8 نویسه"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  dir="ltr"
                  enterKeyHint={mode === 'reset' ? 'next' : 'done'}
                  className="w-full py-2.5 ps-10 pe-10 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                />
                <KeyRound className="w-4 h-4 text-text-muted absolute top-3.5 start-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-2.5 end-2.5 p-1.5 rounded-[8px] text-text-muted hover:text-text-primary touch-target min-w-[44px]"
                  title={showPassword ? 'مخفی کردن' : 'نمایش'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter (Register / Reset) */}
              {(mode === 'register' || mode === 'reset') && password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          strength > idx ? strengthColors[strength] : 'bg-surface-3'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-muted">
                    <span>استحکام رمز: {strengthLabels[strength]}</span>
                    <span>حداقل 8 کاراکتر</span>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <p className="text-xs text-danger">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password (Reset only) */}
            {mode === 'reset' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text-primary">تکرار رمز عبور جدید</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور"
                  autoComplete="new-password"
                  dir="ltr"
                  enterKeyHint="done"
                  className="w-full py-2.5 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none text-end min-h-[44px]"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-danger">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Sticky Submit Button */}
            <div className="pt-2 sticky bottom-0 bg-surface py-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-[12px] btn-primary-amber font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 touch-target min-w-[44px] disabled:opacity-50 min-h-[48px]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && <LogIn className="w-4 h-4" />}
                    {mode === 'register' && <UserPlus className="w-4 h-4" />}
                    {mode === 'reset' && <Check className="w-4 h-4" />}
                    <span>
                      {mode === 'login' && 'ورود به بازی'}
                      {mode === 'register' && 'تکمیل عضویت و ورود'}
                      {mode === 'reset' && 'ثبت رمز جدید و ورود'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Switcher (Only in preview / test mode) */}
        {onSelectPreloadedUser && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-muted">تست سریع (حالت پیش‌نمایش):</span>
              <span className="text-xs text-accent font-mono">Preview only</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
              {SEED_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onSelectPreloadedUser(u.id);
                    onClose();
                  }}
                  className="text-start p-2 rounded-[8px] bg-surface-2 hover:bg-surface-3 border border-border text-xs font-bold text-text-primary truncate touch-target min-w-[44px]"
                >
                  <span className="text-accent text-xs block">
                    {u.role === 'dm' ? 'دانجن مستر' : 'بازیکن'}
                  </span>
                  <span className="truncate block">{u.displayName || u.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
