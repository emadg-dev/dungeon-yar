import React, { useState } from 'react';
import { User } from '../types';
import { SEED_USERS } from '../data/seed';
import { Shield, Sparkles, KeyRound, Mail, UserPlus, LogIn, Eye, EyeOff, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password?: string) => Promise<User>;
  onRegister: (email: string, password?: string, name?: string, campaignCode?: string) => Promise<User>;
  onSelectPreloadedUser: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onSelectPreloadedUser,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [campaignCode, setCampaignCode] = useState('ZORVANIA-1405');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = 'پست الکترونیکی الزامی است.';
    } else if (!email.includes('@')) {
      errors.email = 'فرمت ایمیل صحیح نمی‌باشد.';
    }

    if (!password) {
      errors.password = 'رمز عبور الزامی است.';
    } else if (password.length < 3) {
      errors.password = 'رمز عبور باید حداقل ۳ نویسه باشد.';
    }

    if (tab === 'register') {
      if (!name.trim()) errors.name = 'نام ماجراجو یا دانجن مستر الزامی است.';
      if (!campaignCode.trim()) errors.campaignCode = 'کد دعوت کمپین الزامی است.';
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
      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name, campaignCode);
      }
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'خطایی در فرآیند ورود یا عضویت رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0D0C]/95 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      dir="rtl"
    >
      <div className="w-full max-w-md surface-card card-gold-top p-5 sm:p-7 space-y-5 my-auto relative shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 start-4 p-2 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
          title="بستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Seal Mark & Logo Wordmark */}
        <div className="text-center pt-2">
          {/* Zorvan Seal: Triangle / Circle / Broken-line rays */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#171513] border-2 border-[#E0A030] shadow-[0_0_24px_rgba(224,160,48,0.3)] mb-3 relative">
            <svg
              viewBox="0 0 100 100"
              className="w-12 h-12 text-[#E0A030]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Outer Seal Circle */}
              <circle cx="50" cy="50" r="44" strokeDasharray="6 3" opacity="0.6" />
              {/* Inner Circle */}
              <circle cx="50" cy="50" r="32" stroke="currentColor" />
              {/* Central Triangle */}
              <polygon points="50,22 76,68 24,68" stroke="currentColor" fill="rgba(224,160,48,0.1)" />
              {/* Broken rays / Sundial marks */}
              <line x1="50" y1="6" x2="50" y2="16" />
              <line x1="50" y1="84" x2="50" y2="94" />
              <line x1="6" y1="50" x2="16" y2="50" />
              <line x1="84" y1="50" x2="94" y2="50" />
              <circle cx="50" cy="50" r="3" fill="#E0A030" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-[#EDE6D8] tracking-wide font-sans">
            زروانیا
          </h2>
          <p className="text-xs text-[#A39A89] mt-1 font-medium">
            دروازه ورود به جهان کهن، زمان و سرنوشت
          </p>
        </div>

        {/* Tab Switcher: Login / Register */}
        <div className="grid grid-cols-2 p-1 rounded-[12px] bg-[#201D19] border border-[#2F2A23]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setFieldErrors({});
              setGeneralError('');
            }}
            className={`py-2 rounded-[10px] text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setFieldErrors({});
              setGeneralError('');
            }}
            className={`py-2 rounded-[10px] text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            عضویت در کمپین
          </button>
        </div>

        {generalError && (
          <div className="p-3 rounded-[12px] bg-[#C2512B]/15 border border-[#C2512B]/40 text-[#C2512B] text-xs font-semibold">
            {generalError}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#EDE6D8] mb-1">نام ماجراجو / مستر:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="مثلاً: سورنا یا کیخسرو"
                className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus-amber placeholder-[#A39A89]/50"
              />
              {fieldErrors.name && (
                <span className="text-[11px] text-[#C2512B] mt-1 block font-medium">
                  {fieldErrors.name}
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#EDE6D8] mb-1">پست الکترونیکی:</label>
            <div className="relative">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="player@zorvania.ir"
                className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus-amber placeholder-[#A39A89]/50 dice-ltr text-right"
              />
            </div>
            {fieldErrors.email && (
              <span className="text-[11px] text-[#C2512B] mt-1 block font-medium">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#EDE6D8] mb-1">رمز عبور:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className="w-full py-2.5 ps-3 pe-10 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus-amber placeholder-[#A39A89]/50 dice-ltr text-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#A39A89] hover:text-[#EDE6D8] p-1"
                title={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز عبور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] text-[#C2512B] mt-1 block font-medium">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#EDE6D8] mb-1">کد دعوت کمپین:</label>
              <input
                type="text"
                value={campaignCode}
                onChange={(e) => setCampaignCode(e.target.value)}
                placeholder="ZORVANIA-1405"
                className="w-full py-2.5 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus-amber dice-ltr text-center font-mono"
              />
              {fieldErrors.campaignCode && (
                <span className="text-[11px] text-[#C2512B] mt-1 block font-medium">
                  {fieldErrors.campaignCode}
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 touch-target"
          >
            {tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{loading ? 'در حال برقراری پیوند...' : tab === 'login' ? 'ورود به زروانیا' : 'پیوستن به ماجراجویی'}</span>
          </button>
        </form>

        {/* Quick Demo Preloaded Users */}
        <div className="pt-3 border-t border-[#2F2A23]">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#E0A030] mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              ورود سریع با کاراکترهای آماده:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SEED_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelectPreloadedUser(u.id);
                  onClose();
                }}
                className={`p-2 rounded-[10px] text-right flex items-center gap-2 transition-all border ${
                  u.role === 'dm'
                    ? 'bg-[#E0A030]/10 border-[#E0A030]/35 text-[#EDE6D8] hover:bg-[#E0A030]/20'
                    : 'bg-[#201D19] border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621]'
                }`}
              >
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                  alt={u.name}
                  loading="lazy"
                  className="w-6 h-6 rounded-[6px] object-cover shrink-0 border border-[#2F2A23]"
                />
                <span className="text-xs font-bold truncate flex-1">{u.name}</span>
                {u.role === 'dm' && <Shield className="w-3.5 h-3.5 text-[#E0A030] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
