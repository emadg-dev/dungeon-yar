import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import React, { useState } from 'react';
import { User } from '../../types';
import { Database, Users, Shield, RefreshCw, CheckCircle2, Server, Key, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { CalendarStructureModal } from '../calendar/CalendarStructureModal';

interface DmSettingsProps {
  users: User[];
  onUpdateUserRole: (userId: string, role: 'dm' | 'player') => void;
  onImportSeedIntoDb: () => Promise<void>;
  isHttpMode: boolean;
  campaignId?: string;
}

export const DmSettings: React.FC<DmSettingsProps> = ({
  users,
  onUpdateUserRole,
  onImportSeedIntoDb,
  isHttpMode,
  campaignId = 'zorvania-c1'
}) => {
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

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
      <div className="bg-surface border border-accent/25 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent-hover border border-accent/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-hover">درون‌ریزی داده‌های پیش‌فرض زروانیا (Seed Data)</h3>
            <p className="text-xs text-text-muted">
              بارگذاری یا بازنشانی 6 ماجراجوی اصلی (سامان، پردیس، شیده، مانا، هامون، سیاوش)، هیولاها، سلاح‌ها و قوانین
            </p>
          </div>
        </div>

        <p className="text-xs text-text-primary leading-relaxed bg-surface-2 p-3 rounded-xl border border-border mb-4">
          این عملیات در حالت محلی حافظه مرورگر را به روز می‌کند و در صورت اتصال به بک‌اند Cloudflare D1، اطلاعات را مستقیماً وارد سرور می‌نماید (Idempotent).
        </p>

        {importMessage && (
          <div className="p-3 mb-4 rounded-xl bg-success/15 border border-success/50 text-success text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {importMessage}
          </div>
        )}

        <Button
          onClick={() => setShowConfirmSheet(true)}
          disabled={importLoading}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-warning to-accent hover:from-accent hover:to-accent-hover text-on-accent font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 touch-target min-w-[44px]"
        >
          {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          درون‌ریزی و همگام‌سازی اطلاعات پیش‌فرض
        </Button>
      </div>

      {/* Backend & Environment Status */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-surface-2 text-text-primary">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">وضعیت لایه ارتباطی دیتا (Api Adapter)</h3>
            <p className="text-xs text-text-muted">محیط اجرایی فعال فعلی اپلیکیشن</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-2 border border-border">
            <span className="text-text-muted block mb-1">حالت جاری فعال:</span>
            <span className="font-bold text-accent-hover text-sm">
              {isHttpMode ? 'متصل به سرور ابری (Cloudflare Pages HttpApi)' : 'پیش‌نمایش محلی مرورگر (LocalApi)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2 border border-border">
            <span className="text-text-muted block mb-1">کد دعوت ثبت‌نام کمپین:</span>
            <span className="font-mono font-bold text-text-primary text-sm">
              ZORVANIA-1405
            </span>
          </div>
        </div>
      </div>

      {/* تقویم‌های دنیا (World Calendars) */}
      <div className="bg-surface border border-accent/25 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent-hover border border-accent/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-accent-hover">تقویم‌های دنیا و گاه‌شمار کمپین</h3>
              <p className="text-xs text-text-muted">
                مدیریت ماه‌ها، روزهای هفته، روزهای برون‌گاه و همگام‌سازی زمان جهان زروانیا
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setCalendarModalOpen(true)}
            className="bg-accent text-on-accent text-xs font-bold px-4 py-2 rounded-xl shadow-md min-h-[44px] flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span>ویرایش تقویم‌های دنیا</span>
          </Button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <Users className="w-5 h-5 text-accent-hover" />
          <h3 className="text-sm font-bold text-accent-hover">مدیریت کاربران و سطوح دسترسی ({users.length})</h3>
        </div>

        <div className="divide-y divide-border">
          {users.map(u => (
            <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-2 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                  alt={u.name}
                  loading="lazy"
                  decoding="async"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover border border-accent/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text-primary">{u.name}</span>
                    {u.role === 'dm' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-hover font-bold border border-accent/30">
                        دانجن مستر
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted font-mono">{u.email}</span>
                </div>
              </div>

              {/* Role Toggle */}
              <div className="flex items-center gap-2">
                <Select noWrapper
                  value={u.role}
                  onChange={(e) => onUpdateUserRole(u.id, e.target.value as 'dm' | 'player')}
                  className="bg-surface-2 border border-border-strong text-xs text-text-primary py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-accent"
                >
                  <option value="player">نقش: بازیکن (Player)</option>
                  <option value="dm">نقش: دانجن مستر (DM)</option>
                </Select>
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
        message="آیا از بارگذاری مجدد داده‌های پیش‌فرض کمپین زروانیا اطمینان دارید؟ داده‌های اولیه 6 ماجراجوی اصلی، هیولاها و قوانین بارگذاری مجدد خواهند شد."
        confirmLabel="تأیید و همگام‌سازی"
      />

      {/* World Calendar Structure Modal */}
      {calendarModalOpen && (
        <CalendarStructureModal
          isOpen={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          campaignId={campaignId}
          userRole="owner"
        />
      )}
    </div>
  );
};
