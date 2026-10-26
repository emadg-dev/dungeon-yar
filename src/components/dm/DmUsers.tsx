import React, { useState, useEffect } from 'react';
import { User, Character } from '../../types';
import { api } from '../../services/api';
import { 
  Users, Search, Shield, UserCheck, UserX, KeyRound, Copy, Check, 
  Trash2, RefreshCw, MoreVertical, Link as LinkIcon, AlertTriangle, X, ShieldAlert 
} from 'lucide-react';
import { ActionMenu, ActionMenuItem } from '../common/ActionMenu';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { BottomSheet } from '../mobile/BottomSheet';

interface DmUsersProps {
  characters: Character[];
  onRefreshCharacters?: () => void;
}

export const DmUsers: React.FC<DmUsersProps> = ({ characters, onRefreshCharacters }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected user for action menu / sheets
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Sheets state
  const [assignCharSheetOpen, setAssignCharSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetLinkData, setResetLinkData] = useState<{ resetLink: string; resetToken: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await api.listUsers({ search, role: roleFilter, status: statusFilter });
      setUsers(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری فهرست کاربران');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null as any), 3500);
  };

  const handleToggleRole = async (user: User) => {
    const nextRole = user.role === 'dm' ? 'player' : 'dm';
    try {
      await api.updateUser(user.id, { role: nextRole });
      showSuccess(`نقش ${user.displayName || user.name} به ${nextRole === 'dm' ? 'دانجن مستر' : 'بازیکن'} تغییر یافت.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر نقش کاربر.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'disabled' ? 'active' : 'disabled';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      showSuccess(`وضعیت حساب کاربری به ${nextStatus === 'active' ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر وضعیت کاربر.');
    }
  };

  const handleRevokeSessions = async (user: User) => {
    try {
      await api.revokeUserSessions(user.id);
      showSuccess(`نشست‌های فعال ${user.displayName || user.name} خاتمه یافتند.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در لغو نشست‌ها.');
    }
  };

  const handleGenerateResetLink = async (user: User) => {
    try {
      const res = await api.generateResetToken(user.id);
      setResetLinkData(res);
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
      showSuccess('کاراکتر با موفقیت به کاربر اختصاص داده شد.');
      loadUsers();
      onRefreshCharacters?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در واگذاری کاراکتر.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.deleteUser(selectedUser.id);
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
      showSuccess('حساب کاربر غیرفعال و کاراکترهای او آزاد شدند.');
      loadUsers();
      onRefreshCharacters?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در حذف کاربر.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getActionMenuItems = (): ActionMenuItem[] => {
    if (!selectedUser) return [];
    const isDm = selectedUser.role === 'dm';
    const isDisabled = selectedUser.status === 'disabled';

    return [
      {
        id: 'role',
        label: isDm ? 'تنزل به بازیکن' : 'ارتقا به دانجن مستر',
        icon: Shield,
        onClick: () => handleToggleRole(selectedUser)
      },
      {
        id: 'status',
        label: isDisabled ? 'فعال‌سازی مجدد حساب' : 'غیرفعال‌سازی دسترسی (مسدود کردن)',
        icon: isDisabled ? UserCheck : UserX,
        onClick: () => handleToggleStatus(selectedUser)
      },
      {
        id: 'assign',
        label: 'اختصاص دادن کاراکتر به این کاربر',
        icon: Users,
        onClick: () => setAssignCharSheetOpen(true)
      },
      {
        id: 'reset',
        label: 'تولید پیوند یک‌بار مصرف تغییر رمز',
        icon: KeyRound,
        onClick: () => handleGenerateResetLink(selectedUser)
      },
      {
        id: 'revoke',
        label: 'خاتمه دادن به تمام نشست‌های فعال',
        icon: RefreshCw,
        onClick: () => handleRevokeSessions(selectedUser)
      },
      {
        id: 'delete',
        label: 'حذف کاربر (Soft Delete)',
        icon: Trash2,
        isDestructive: true,
        destructive: true,
        onClick: () => setDeleteConfirmOpen(true)
      }
    ];
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Filter Controls */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E0A030]" />
            <div>
              <h3 className="text-sm font-extrabold text-[#EDE6D8]">مدیریت کاربران و ماجراجویان</h3>
              <p className="text-[11px] text-[#A39A89]">کنترل نقش‌ها، کاراکترهای واگذارشده و پیوندهای ورود</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="py-1.5 px-3 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] touch-target flex items-center gap-1 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تازه‌سازی</span>
          </button>
        </div>

        {/* Search & Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام یا ایمیل..."
              className="w-full py-2 ps-8 pe-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
            />
            <Search className="w-4 h-4 text-[#A39A89] absolute top-3.5 start-2.5 pointer-events-none" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
          >
            <option value="">همه نقش‌ها</option>
            <option value="player">فقط بازیکنان</option>
            <option value="dm">فقط دانجن مسترها</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="disabled">غیرفعال (مسدود)</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-[10px] bg-[#C2512B]/15 border border-[#C2512B]/40 text-[#EDE6D8] text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="p-1 touch-target">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-[10px] bg-[#6F9E78]/15 border border-[#6F9E78]/40 text-[#6F9E78] text-xs flex items-center justify-between font-bold">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="p-1 touch-target">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Reset Link Modal / Card */}
      {resetLinkData && (
        <div className="p-4 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#E0A030] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              لینک یک‌بار مصرف تغییر رمز تولید شد
            </span>
            <button
              type="button"
              onClick={() => setResetLinkData(null)}
              className="p-1 text-[#A39A89] hover:text-[#EDE6D8] touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-[#EDE6D8]/90 leading-relaxed">
            هشدار امنیتی: این پیوند تنها یک‌بار مصرف است و ۲۴ ساعت اعتبار دارد. آن را کپی کرده و برای بازیکن ارسال فرمایید:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={resetLinkData.resetLink}
              dir="ltr"
              className="flex-1 py-2 px-3 rounded-[8px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] font-mono select-all min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(resetLinkData.resetLink)}
              className="py-2 px-3.5 rounded-[8px] btn-primary-amber text-xs font-bold touch-target flex items-center gap-1 shrink-0 min-h-[44px]"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="surface-card rounded-[14px] p-8 text-center text-xs text-[#A39A89]">
            {loading ? 'در حال بارگذاری اطلاعات...' : 'کاربری با این مشخصات یافت نشد.'}
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className={`surface-card rounded-[12px] p-3.5 border transition-all flex items-center justify-between gap-3 ${
                u.status === 'disabled'
                  ? 'opacity-60 border-[#C2512B]/40 bg-[#171513]'
                  : 'border-[#2F2A23] hover:border-[#E0A030]/30'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs text-[#EDE6D8] truncate">
                    {u.displayName || u.name}
                  </span>

                  {/* Role badge */}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-[6px] font-bold border ${
                      u.role === 'dm'
                        ? 'bg-[#E0A030]/20 text-[#E0A030] border-[#E0A030]/40'
                        : 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/30'
                    }`}
                  >
                    {u.role === 'dm' ? 'دانجن مستر' : 'بازیکن'}
                  </span>

                  {/* Status badge */}
                  {u.status === 'disabled' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#C2512B]/20 text-[#C2512B] border border-[#C2512B]/40 font-bold">
                      مسدود / غیرفعال
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[#A39A89] truncate flex items-center gap-2">
                  <span dir="ltr">{u.email}</span>
                  <span>•</span>
                  <span>
                    {u.characterNames && u.characterNames.length > 0
                      ? `کاراکترها: ${u.characterNames.join('، ')}`
                      : 'فاقد کاراکتر اختصاصی'}
                  </span>
                </div>

                <div className="text-[10px] text-[#A39A89]/80 flex items-center gap-2 pt-0.5">
                  <span>
                    آخرین ورود: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fa-IR') : 'هرگز'}
                  </span>
                  <span>•</span>
                  <span>نشست‌های فعال: {u.activeSessionCount || 0}</span>
                </div>
              </div>

              {/* Action Menu Trigger */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(u);
                  setActionMenuOpen(true);
                }}
                className="p-2 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] touch-target"
                title="عملیات کاربر"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Action Menu Bottom Sheet */}
      <ActionMenu
        isOpen={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        title={selectedUser?.displayName || selectedUser?.name || 'عملیات کاربر'}
        subtitle={selectedUser?.email}
        items={getActionMenuItems()}
      />

      {/* Assign Character Bottom Sheet */}
      {assignCharSheetOpen && selectedUser && (
        <BottomSheet
          isOpen={assignCharSheetOpen}
          onClose={() => setAssignCharSheetOpen(false)}
          title="واگذاری کاراکتر به کاربر"
          subtitle={`انتخاب کاراکتر برای ${selectedUser.displayName || selectedUser.name}`}
        >
          <div className="space-y-2 py-2" dir="rtl">
            {characters.length === 0 ? (
              <p className="text-xs text-[#A39A89] text-center py-4">هیچ شخصیتی در کمپین ثبت نشده است.</p>
            ) : (
              characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAssignCharacter(c.id)}
                  className="w-full text-right p-3 rounded-[10px] bg-[#201D19] hover:bg-[#2A2621] border border-[#2F2A23] flex items-center justify-between touch-target"
                >
                  <div>
                    <span className="font-extrabold text-xs text-[#EDE6D8] block">{c.name}</span>
                    <span className="text-[10px] text-[#A39A89]">{c.className} • سطح {c.level}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-[6px] bg-[#E0A030]/15 text-[#E0A030] font-bold">
                    واگذاری
                  </span>
                </button>
              ))
            )}
          </div>
        </BottomSheet>
      )}

      {/* Delete Confirmation Sheet */}
      <ConfirmSheet
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        title="حذف حساب کاربر"
        description={`آیا از حذف حساب کاربری ${selectedUser?.displayName || selectedUser?.name} اطمینان دارید؟ با این کار حساب غیرفعال شده، تمام نشست‌های آن باطل و کاراکترهای تحت مالکیت وی آزاد می‌شوند.`}
        confirmText="حذف کاربر"
        cancelText="انصراف"
        destructive={true}
      />
    </div>
  );
};
