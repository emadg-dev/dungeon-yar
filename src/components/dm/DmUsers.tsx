import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { User, Character } from '../../types';
import { api } from '../../services/api';
import {
  Users, Search, Shield, UserCheck, UserX, KeyRound, Copy, Check,
  Trash2, RefreshCw, MoreVertical, X
} from 'lucide-react';
import { ActionMenu, ActionMenuItem } from '../common/ActionMenu';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { BottomSheet } from '../mobile/BottomSheet';
import { Badge, IconButton, inputCls, primaryBtnCls } from '../ui/FormLayout';

interface DmUsersProps {
  characters: Character[];
  onRefreshCharacters?: () => void;
}

/** One pending risky action, confirmed through the shared ConfirmSheet. */
interface PendingAction {
  title: string;
  description: string;
  confirmText: string;
  destructive: boolean;
  run: () => Promise<void>;
}

const nameOf = (u: User) => u.displayName || u.name;

export const DmUsers: React.FC<DmUsersProps> = ({ characters, onRefreshCharacters }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const [assignCharSheetOpen, setAssignCharSheetOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [resetLinkData, setResetLinkData] = useState<{ resetLink: string; resetToken: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Typing no longer fires a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch, roleFilter, statusFilter]);

  // Auto-dismiss success message (cleaned up on unmount / replacement)
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      setUsers(await api.listUsers({ search: debouncedSearch, role: roleFilter, status: statusFilter }));
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فهرست کاربران');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user: User) => {
    const nextRole = user.role === 'dm' ? 'player' : 'dm';
    try {
      await api.updateUser(user.id, { role: nextRole });
      setSuccessMsg(`نقش ${nameOf(user)} به ${nextRole === 'dm' ? 'دانجن مستر' : 'بازیکن'} تغییر کرد.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر نقش کاربر.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'disabled' ? 'active' : 'disabled';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      setSuccessMsg(`حساب ${nameOf(user)} ${nextStatus === 'active' ? 'فعال' : 'مسدود'} شد.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر وضعیت کاربر.');
    }
  };

  const handleRevokeSessions = async (user: User) => {
    try {
      await api.revokeUserSessions(user.id);
      setSuccessMsg(`نشست‌های فعال ${nameOf(user)} خاتمه یافت.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در لغو نشست‌ها.');
    }
  };

  const handleGenerateResetLink = async (user: User) => {
    try {
      setResetLinkData(await api.generateResetToken(user.id));
      setCopiedLink(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ساخت لینک بازنشانی.');
    }
  };

  const handleAssignCharacter = async (charId: string) => {
    if (!selectedUser) return;
    try {
      await api.assignCharacterToUser(selectedUser.id, charId);
      setAssignCharSheetOpen(false);
      setSuccessMsg('کاراکتر به کاربر واگذار شد.');
      loadUsers();
      onRefreshCharacters?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در واگذاری کاراکتر.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await api.deleteUser(user.id);
      setSelectedUser(null);
      setSuccessMsg('حساب کاربر غیرفعال و کاراکترهای او آزاد شدند.');
      loadUsers();
      onRefreshCharacters?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در حذف کاربر.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setErrorMsg('کپی انجام نشد؛ متن را دستی انتخاب کنید.');
    }
  };

  const getActionMenuItems = (): ActionMenuItem[] => {
    if (!selectedUser) return [];
    const u = selectedUser;
    const isDm = u.role === 'dm';
    const isDisabled = u.status === 'disabled';

    return [
      {
        id: 'role',
        label: isDm ? 'تبدیل به بازیکن' : 'ارتقا به دانجن مستر',
        icon: Shield,
        onClick: () =>
          isDm
            ? setPending({
                title: 'کاهش سطح دسترسی',
                description: `${nameOf(u)} دیگر به ابزارهای دانجن مستر دسترسی نخواهد داشت. ادامه می‌دهید؟`,
                confirmText: 'تبدیل به بازیکن',
                destructive: false,
                run: () => handleToggleRole(u)
              })
            : handleToggleRole(u)
      },
      {
        id: 'status',
        label: isDisabled ? 'فعال‌سازی مجدد حساب' : 'مسدود کردن حساب',
        icon: isDisabled ? UserCheck : UserX,
        onClick: () =>
          isDisabled
            ? handleToggleStatus(u)
            : setPending({
                title: 'مسدود کردن حساب',
                description: `${nameOf(u)} دیگر نمی‌تواند وارد شود تا زمانی که حساب را دوباره فعال کنید.`,
                confirmText: 'مسدود کردن',
                destructive: true,
                run: () => handleToggleStatus(u)
              })
      },
      { id: 'assign', label: 'واگذاری کاراکتر', icon: Users, onClick: () => setAssignCharSheetOpen(true) },
      { id: 'reset', label: 'ساخت پیوند تغییر رمز', icon: KeyRound, onClick: () => handleGenerateResetLink(u) },
      {
        id: 'revoke',
        label: 'خروج از همه دستگاه‌ها',
        icon: RefreshCw,
        onClick: () =>
          setPending({
            title: 'خاتمه نشست‌ها',
            description: `${nameOf(u)} از همه دستگاه‌ها خارج می‌شود و باید دوباره وارد شود.`,
            confirmText: 'خاتمه نشست‌ها',
            destructive: false,
            run: () => handleRevokeSessions(u)
          })
      },
      {
        id: 'delete',
        label: 'حذف کاربر',
        icon: Trash2,
        isDestructive: true,
        destructive: true,
        onClick: () =>
          setPending({
            title: 'حذف حساب کاربر',
            description: `حساب ${nameOf(u)} غیرفعال می‌شود، نشست‌هایش باطل و کاراکترهایش آزاد می‌شوند. ادامه می‌دهید؟`,
            confirmText: 'حذف کاربر',
            destructive: true,
            run: () => handleDeleteUser(u)
          })
      }
    ];
  };

  const confirmPending = async () => {
    const action = pending;
    setPending(null);
    if (action) await action.run();
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" aria-hidden />
            <span>کاربران</span>
          </h3>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            نقش‌ها، کاراکترهای واگذارشده و پیوندهای ورود را مدیریت کنید.
          </p>
        </div>
        <IconButton label="تازه‌سازی" onClick={loadUsers}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </IconButton>
      </div>

      {/* Filters: search full width, selects share a row on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="w-4 h-4 text-text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
          <Input noWrapper
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی نام یا ایمیل"
            aria-label="جستجوی کاربر"
            className={`${inputCls} ps-10`}
          />
        </div>
        <Select noWrapper value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="فیلتر نقش" className={`${inputCls} sm:w-40`}>
          <option value="">همه نقش‌ها</option>
          <option value="player">بازیکنان</option>
          <option value="dm">دانجن مسترها</option>
        </Select>
        <Select noWrapper value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="فیلتر وضعیت" className={`${inputCls} sm:w-40`}>
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="disabled">مسدود</option>
        </Select>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div role="alert" className="ps-3 pe-1 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm flex items-center justify-between gap-2">
          <span className="py-2.5">{errorMsg}</span>
          <IconButton label="بستن پیام" onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></IconButton>
        </div>
      )}
      {successMsg && (
        <div role="status" className="ps-3 pe-1 rounded-lg bg-success/15 border border-success/30 text-success text-sm flex items-center justify-between gap-2">
          <span className="py-2.5">{successMsg}</span>
          <IconButton label="بستن پیام" onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></IconButton>
        </div>
      )}

      {/* Reset link (shown once; contains a secret token) */}
      {resetLinkData && (
        <section className="rounded-xl border border-accent/40 bg-accent/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-accent-hover flex items-center gap-2">
              <KeyRound className="w-4 h-4" aria-hidden />
              پیوند تغییر رمز ساخته شد
            </h4>
            <IconButton label="بستن" onClick={() => setResetLinkData(null)}><X className="w-4 h-4" /></IconButton>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            این پیوند یک‌بار مصرف است و ۲۴ ساعت اعتبار دارد. آن را فقط برای خود بازیکن بفرستید.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input noWrapper type="text" readOnly dir="ltr" value={resetLinkData.resetLink} aria-label="پیوند تغییر رمز"
              className={`${inputCls} flex-1 font-mono select-all`} />
            <Button type="button" onClick={() => copyToClipboard(resetLinkData.resetLink)} className={primaryBtnCls}>
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'کپی شد' : 'کپی پیوند'}</span>
            </Button>
          </div>
        </section>
      )}

      {/* List */}
      {users.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted">
          {loading ? 'در حال بارگذاری...' : 'کاربری با این مشخصات پیدا نشد.'}
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
          {users.map(u => {
            const disabled = u.status === 'disabled';
            return (
              <li key={u.id} className="p-3 sm:p-4 flex items-center gap-3">
                <span
                  aria-hidden
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold shrink-0 ${
                    disabled ? 'bg-surface-2 text-text-muted border-border' : 'bg-accent/10 text-accent-hover border-accent/30'
                  }`}
                >
                  {nameOf(u).trim().charAt(0)}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Disabled is conveyed by a badge, not by fading the whole row (faded text fails contrast) */}
                    <span className="text-sm font-bold text-text-primary truncate">{nameOf(u)}</span>
                    <Badge tone={u.role === 'dm' ? 'accent' : 'neutral'}>{u.role === 'dm' ? 'دانجن مستر' : 'بازیکن'}</Badge>
                    {disabled && <Badge tone="danger">مسدود</Badge>}
                  </div>
                  <p dir="ltr" className="text-xs text-text-muted truncate text-start">{u.email}</p>
                  <p className="text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>
                      {u.characterNames && u.characterNames.length > 0
                        ? `کاراکتر: ${u.characterNames.join('، ')}`
                        : 'بدون کاراکتر'}
                    </span>
                    <span>آخرین ورود: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fa-IR-u-nu-latn') : 'هرگز'}</span>
                    <span>نشست فعال: {u.activeSessionCount || 0}</span>
                  </p>
                </div>

                <IconButton
                  label={`عملیات ${nameOf(u)}`}
                  onClick={() => {
                    setSelectedUser(u);
                    setActionMenuOpen(true);
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}

      <ActionMenu
        isOpen={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        title={selectedUser ? nameOf(selectedUser) : 'عملیات کاربر'}
        subtitle={selectedUser?.email}
        items={getActionMenuItems()}
      />

      {assignCharSheetOpen && selectedUser && (
        <BottomSheet
          isOpen={assignCharSheetOpen}
          onClose={() => setAssignCharSheetOpen(false)}
          title="واگذاری کاراکتر"
          subtitle={`انتخاب کاراکتر برای ${nameOf(selectedUser)}`}
        >
          <div className="space-y-2" dir="rtl">
            {characters.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">هنوز شخصیتی در کمپین ثبت نشده است.</p>
            ) : (
              characters.map(c => (
                <Button
                  key={c.id}
                  type="button"
                  onClick={() => handleAssignCharacter(c.id)}
                  className="w-full min-h-[56px] px-4 rounded-lg bg-surface-2 border border-border hover:border-accent text-start flex items-center justify-between gap-3 transition"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-text-primary truncate">{c.name}</span>
                    <span className="block text-xs text-text-muted">{c.className}، سطح {c.level}</span>
                  </span>
                  <span className="text-sm font-medium text-accent-hover shrink-0">واگذاری</span>
                </Button>
              ))
            )}
          </div>
        </BottomSheet>
      )}

      {/* ConfirmSheet is reused for every risky action; props follow the call this file already made */}
      <ConfirmSheet
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmText={pending?.confirmText ?? 'تأیید'}
        cancelText="انصراف"
        destructive={pending?.destructive ?? false}
      />
    </div>
  );
};