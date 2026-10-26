import React, { useState } from 'react';
import { User } from '../../types';
import { Database, Users, Shield, RefreshCw, CheckCircle2, Server, Key } from 'lucide-react';
import { ConfirmSheet } from '../mobile/ConfirmSheet';

interface DmSettingsProps {
  users: User[];
  onUpdateUserRole: (userId: string, role: 'dm' | 'player') => void;
  onImportSeedIntoDb: () => Promise<void>;
  isHttpMode: boolean;
}

export const DmSettings: React.FC<DmSettingsProps> = ({
  users,
  onUpdateUserRole,
  onImportSeedIntoDb,
  isHttpMode
}) => {
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  const handleExecuteImport = async () => {
    setShowConfirmSheet(false);
    setImportLoading(true);
    setImportMessage('');
    try {
      await onImportSeedIntoDb();
      setImportMessage('داده‌های زروانیا با موفقیت در پایگاه داده بازنویسی و همگام شدند!');
    } catch (err: any) {
      setImportMessage(err.message || 'خطا در بارگذاری داده‌ها');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seed Database Card */}
      <div className="bg-[#12151e] border border-amber-500/25 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">درون‌ریزی داده‌های پیش‌فرض زروانیا (Seed Data)</h3>
            <p className="text-xs text-slate-400">
              بارگذاری یا بازنشانی ۶ ماجراجوی اصلی (سامان، پردیس، شیده، مانا، هامون، سیاوش)، هیولاها، سلاح‌ها و قوانین
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#161a26] p-3 rounded-xl border border-slate-800 mb-4">
          این عملیات در حالت محلی حافظه مرورگر را به روز می‌کند و در صورت اتصال به بک‌اند Cloudflare D1، اطلاعات را مستقیماً وارد سرور می‌نماید (Idempotent).
        </p>

        {importMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {importMessage}
          </div>
        )}

        <button
          onClick={() => setShowConfirmSheet(true)}
          disabled={importLoading}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 touch-target"
        >
          {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          درون‌ریزی و همگام‌سازی اطلاعات پیش‌فرض
        </button>
      </div>

      {/* Backend & Environment Status */}
      <div className="bg-[#12151e] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">وضعیت لایه ارتباطی دیتا (Api Adapter)</h3>
            <p className="text-xs text-slate-400">محیط اجرایی فعال فعلی اپلیکیشن</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#161a26] border border-slate-800">
            <span className="text-slate-500 block mb-1">حالت جاری فعال:</span>
            <span className="font-bold text-amber-300 text-sm">
              {isHttpMode ? 'متصل به سرور ابری (Cloudflare Pages HttpApi)' : 'پیش‌نمایش محلی مرورگر (LocalApi)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#161a26] border border-slate-800">
            <span className="text-slate-500 block mb-1">کد دعوت ثبت‌نام کمپین:</span>
            <span className="font-mono font-bold text-slate-200 text-sm">
              ZORVANIA-1405
            </span>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-[#12151e] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
          <Users className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-200">مدیریت کاربران و سطوح دسترسی ({users.length})</h3>
        </div>

        <div className="divide-y divide-slate-800">
          {users.map(u => (
            <div key={u.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                  alt={u.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{u.name}</span>
                    {u.role === 'dm' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                        دانجن مستر
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                </div>
              </div>

              {/* Role Toggle */}
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => onUpdateUserRole(u.id, e.target.value as 'dm' | 'player')}
                  className="bg-[#161a26] border border-slate-700 text-xs text-slate-200 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="player">نقش: بازیکن (Player)</option>
                  <option value="dm">نقش: دانجن مستر (DM)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Reset Confirm Sheet */}
      <ConfirmSheet
        isOpen={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        onConfirm={handleExecuteImport}
        title="درون‌ریزی و بازنشانی اطلاعات زروانیا"
        message="آیا از بارگذاری مجدد داده‌های پیش‌فرض کمپین زروانیا اطمینان دارید؟ داده‌های اولیه ۶ ماجراجوی اصلی، هیولاها و قوانین بارگذاری مجدد خواهند شد."
        confirmLabel="تأیید و همگام‌سازی"
      />
    </div>
  );
};
