import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import React, { useState } from 'react';
import { User } from '../../types';
import { Database, Users, RefreshCw, CheckCircle2, AlertCircle, Server, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { CalendarStructureModal } from '../calendar/CalendarStructureModal';
import { Section, SectionStack, Badge, inputCls, secondaryBtnCls } from '../ui/FormLayout';

interface DmSettingsProps {
  users: User[];
  onUpdateUserRole: (userId: string, role: 'dm' | 'player') => void;
  onImportSeedIntoDb: () => Promise<void>;
  isHttpMode: boolean;
  /** Optional: pass the real campaign invite code instead of a hard-coded one. */
  campaignInviteCode?: string;
  /** Campaign whose world calendars are edited. Defaults to the Zorvania campaign, as before. */
  campaignId?: string;
}

const initialOf = (name: string) => (name || '?').trim().charAt(0);

export const DmSettings: React.FC<DmSettingsProps> = ({
  users,
  onUpdateUserRole,
  onImportSeedIntoDb,
  isHttpMode,
  campaignInviteCode,
  campaignId = 'zorvania-c1'
}) => {
  const [importLoading, setImportLoading] = useState(false);
  // Result carries its type: the old code showed errors with success styling.
  const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const handleExecuteImport = async () => {
    setShowConfirmSheet(false);
    setImportLoading(true);
    setImportResult(null);
    try {
      await onImportSeedIntoDb();
      setImportResult({ type: 'success', text: 'داده‌های پیش‌فرض با موفقیت بارگذاری و همگام شدند.' });
    } catch (err: any) {
      setImportResult({ type: 'error', text: err.message || 'خطا در بارگذاری داده‌ها' });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div dir="rtl">
      <SectionStack>
        {/* Users first: it is the most frequently used part of this screen */}
        <Section
          title={`کاربران و سطح دسترسی (${users.length})`}
          icon={Users}
        >
          <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
            {users.map(u => (
              <li key={u.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                    />
                  ) : (
                    // No third-party stock photo as fallback (extra request, breaks offline PWA mode)
                    <span
                      aria-hidden
                      className="w-10 h-10 rounded-lg bg-surface-2 border border-border text-text-primary font-bold flex items-center justify-center shrink-0"
                    >
                      {initialOf(u.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary truncate">{u.name}</span>
                      {u.role === 'dm' && <Badge tone="accent">دانجن مستر</Badge>}
                    </div>
                    <span dir="ltr" className="block text-xs text-text-muted font-mono truncate text-start">{u.email}</span>
                  </div>
                </div>

                <Select noWrapper
                  value={u.role}
                  onChange={e => onUpdateUserRole(u.id, e.target.value as 'dm' | 'player')}
                  aria-label={`نقش ${u.name}`}
                  className={`${inputCls} sm:w-44`}
                >
                  <option value="player">بازیکن</option>
                  <option value="dm">دانجن مستر</option>
                </Select>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="تقویم‌های دنیا"
          icon={CalendarIcon}
          description="ماه‌ها، روزهای هفته، روزهای برون‌گاه و همگام‌سازی زمان جهان کمپین."
        >
          <Button
            type="button"
            onClick={() => setCalendarModalOpen(true)}
            className={`${secondaryBtnCls} w-full sm:w-auto`}
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span>ویرایش تقویم‌ها</span>
          </Button>
        </Section>

        <Section title="وضعیت اتصال" icon={Server}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs text-text-muted">محیط فعال</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {isHttpMode ? 'سرور ابری (Cloudflare)' : 'پیش‌نمایش محلی مرورگر'}
              </dd>
            </div>
            {campaignInviteCode && (
              <div className="rounded-lg bg-surface-2 p-3">
                <dt className="text-xs text-text-muted">کد دعوت کمپین</dt>
                <dd dir="ltr" className="mt-1 text-sm font-mono font-bold text-text-primary text-start select-all">
                  {campaignInviteCode}
                </dd>
              </div>
            )}
          </dl>
        </Section>

        {/* Destructive/maintenance action lives last and looks like a secondary action, not the page's hero */}
        <Section
          title="داده‌های پیش‌فرض"
          icon={Database}
          description="شش ماجراجوی اصلی، هیولاها، سلاح‌ها و قوانین کمپین را بارگذاری یا بازنشانی می‌کند."
        >
          <p className="text-sm text-text-muted leading-relaxed">
            در حالت محلی، حافظه مرورگر به‌روز می‌شود؛ با اتصال به سرور، داده‌ها مستقیماً در پایگاه داده ثبت می‌شوند.
            اجرای دوباره مشکلی ایجاد نمی‌کند، ولی تغییرات دستی روی همین داده‌ها ممکن است بازنویسی شود.
          </p>

          {importResult && (
            <div
              role={importResult.type === 'error' ? 'alert' : 'status'}
              className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                importResult.type === 'success'
                  ? 'bg-success/15 border-success/30 text-success'
                  : 'bg-danger/15 border-danger/30 text-danger'
              }`}
            >
              {importResult.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />}
              <span>{importResult.text}</span>
            </div>
          )}

          <Button
            type="button"
            onClick={() => setShowConfirmSheet(true)}
            disabled={importLoading}
            className={`${secondaryBtnCls} w-full sm:w-auto disabled:opacity-50`}
          >
            {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{importLoading ? 'در حال همگام‌سازی...' : 'بارگذاری داده‌های پیش‌فرض'}</span>
          </Button>
        </Section>
      </SectionStack>

      <ConfirmSheet
        isOpen={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        onConfirm={handleExecuteImport}
        title="بارگذاری داده‌های پیش‌فرض"
        message="داده‌های پیش‌فرض ماجراجویان، هیولاها و قوانین دوباره بارگذاری می‌شوند و ممکن است تغییرات دستی روی آن‌ها بازنویسی شود. ادامه می‌دهید؟"
        confirmLabel="تأیید و همگام‌سازی"
      />

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