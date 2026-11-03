import React, { useState, useEffect } from 'react';
import { User, AdminUserItem, AdminCampaignItem, InstanceSettings, StorageStats, CleanupReport } from '../../types';
import { api } from '../../services/api';
import { APP_NAME_FA, APP_NAME_LATIN } from '../../config/app';
import {
  X, Users, Castle, Settings, HardDrive, Trash2, Shield,
  CheckCircle2, AlertTriangle, RefreshCw, KeyRound, Ban,
  Archive, RotateCcw, AlertCircle, Copy, Check, FileText
} from 'lucide-react';
import { ScrollableRow } from '../ui/ScrollableRow';
import { BottomSheet } from '../mobile/BottomSheet';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

type AdminTab = 'users' | 'campaigns' | 'settings' | 'storage' | 'cleanup';

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [generatedReset, setGeneratedReset] = useState<{ userId: string; url: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<AdminCampaignItem[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');

  // Settings state
  const [settings, setSettings] = useState<InstanceSettings>({
    allowCampaignCreation: true,
    registrationMode: 'invite',
    perUserMediaQuotaBytes: 5 * 1024 * 1024,
    perCampaignMediaQuotaBytes: 20 * 1024 * 1024,
    storageWarningThresholdBytes: 800 * 1024 * 1024
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Storage state
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // Cleanup state
  const [cleanupReport, setCleanupReport] = useState<CleanupReport | null>(null);
  const [cleanupExecuting, setCleanupExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTabData(activeTab);
    }
  }, [isOpen, activeTab]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const list = await api.getAdminUsers();
        setUsers(list);
      } else if (tab === 'campaigns') {
        const list = await api.getAdminCampaigns();
        setCampaigns(list);
      } else if (tab === 'settings') {
        const s = await api.getInstanceSettings();
        setSettings(s);
      } else if (tab === 'storage') {
        const stats = await api.getStorageStats();
        setStorageStats(stats);
      } else if (tab === 'cleanup') {
        // Run dry run automatically for initial report
        const report = await api.runOrphanCleanup(true);
        setCleanupReport(report);
      }
    } catch (err: any) {
      showMsg(err.message || 'خطا در بارگذاری اطلاعات.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await api.toggleAdminUserStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: res.newStatus } : u));
      showMsg(`وضعیت کاربر به «${res.newStatus === 'active' ? 'فعال' : 'غیرفعال'}» تغییر یافت.`);
    } catch (err: any) {
      showMsg(err.message || 'خطا در تغییر وضعیت کاربر.', 'error');
    }
  };

  const handleGenerateResetLink = async (userId: string) => {
    try {
      const res = await api.generateAdminResetLink(userId);
      const fullUrl = `${window.location.origin}${res.resetUrl}`;
      setGeneratedReset({ userId, url: fullUrl });
      showMsg('لینک یک‌بارمصرف تغییر رمز تولید شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در تولید لینک تغییر رمز.', 'error');
    }
  };

  const handleCopyResetLink = () => {
    if (!generatedReset) return;
    navigator.clipboard.writeText(generatedReset.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRevokeSessions = async (userId: string) => {
    try {
      const res = await api.revokeAdminUserSessions(userId);
      showMsg(`تمام نشست‌های فعال کاربر لغو شد (${res.revokedCount} نشست).`);
    } catch (err: any) {
      showMsg(err.message || 'خطا در خاتمه نشست‌ها.', 'error');
    }
  };

  // Campaign Actions
  const handleArchiveCampaign = async (campaignId: string) => {
    if (!confirm('آیا از بایگانی کردن این کمپین اطمینان دارید؟')) return;
    try {
      await api.archiveAdminCampaign(campaignId);
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'archived' } : c));
      showMsg('کمپین با موفقیت بایگانی شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در بایگانی کمپین.', 'error');
    }
  };

  const handleRestoreCampaign = async (campaignId: string) => {
    try {
      await api.restoreAdminCampaign(campaignId);
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' } : c));
      showMsg('کمپین با موفقیت فعال شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در بازگردانی کمپین.', 'error');
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const saved = await api.updateInstanceSettings(settings);
      setSettings(saved);
      showMsg('تنظیمات سامانه با موفقیت ذخیره شد.');
    } catch (err: any) {
      showMsg(err.message || 'خطا در ذخیره تنظیمات.', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Cleanup Actions
  const handleRunCleanup = async (dryRun: boolean) => {
    if (!dryRun && !confirm('آیا از اجرای پاک‌سازی دائمی رکوردهای منقضی و فایل‌های بدون ارجاع اطمینان دارید؟')) {
      return;
    }
    setCleanupExecuting(true);
    try {
      const rep = await api.runOrphanCleanup(dryRun);
      setCleanupReport(rep);
      if (!dryRun) {
        showMsg(`پاک‌سازی انجام شد: مجموعاً ${rep.cleanedTotal} رکورد پاک‌سازی شدند.`);
      } else {
        showMsg('پیش‌نمایش پاک‌سازی به‌روز شد.');
      }
    } catch (err: any) {
      showMsg(err.message || 'خطا در اجرای پاک‌سازی.', 'error');
    } finally {
      setCleanupExecuting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u =>
    (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(c =>
    (c.name || '').toLowerCase().includes(campaignSearch.toLowerCase()) ||
    (c.ownerName || '').toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#E0A030] shrink-0" />
          <span className="truncate">کنسول مدیریت سامانه {APP_NAME_FA}</span>
        </div>
      }
      subtitle="نظارت بر کاربران، کمپین‌ها، منابع و سلامت پایگاه داده (D1)"
      fullHeight
      maxWidth="max-w-4xl"
      headerExtra={
        <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#C2512B]/20 text-[#C2512B] border border-[#C2512B]/35 font-bold shrink-0">
          مدیر سیستم
        </span>
      }
    >
      <div className="space-y-4">
        {/* Status Toast */}
        {statusMsg && (
          <div className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl border ${
            statusMsg.type === 'success'
              ? 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/30'
              : 'bg-[#C2512B]/15 text-[#C2512B] border-[#C2512B]/30'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tabs Bar */}
        {/* Tabs Bar */}
        <ScrollableRow
          activeKey={activeTab}
          wrapperClassName="border-b border-[#2F2A23] bg-[#1B1815]"
          className="p-2 gap-1.5"
        >
          <button
            data-key="users"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start transition touch-target min-w-[44px] min-h-[44px] ${
              activeTab === 'users'
                ? 'bg-[#E0A030] text-[#171513] font-black'
                : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#201D19]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">کاربران ({users.length})</span>
          </button>

          <button
            data-key="campaigns"
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-3.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start transition touch-target min-w-[44px] min-h-[44px] ${
              activeTab === 'campaigns'
                ? 'bg-[#E0A030] text-[#171513] font-black'
                : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#201D19]'
            }`}
          >
            <Castle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">کمپین‌ها ({campaigns.length})</span>
          </button>

          <button
            data-key="settings"
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start transition touch-target min-w-[44px] min-h-[44px] ${
              activeTab === 'settings'
                ? 'bg-[#E0A030] text-[#171513] font-black'
                : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#201D19]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">تنظیمات سامانه</span>
          </button>

          <button
            data-key="storage"
            onClick={() => setActiveTab('storage')}
            className={`py-2 px-3.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start transition touch-target min-w-[44px] min-h-[44px] ${
              activeTab === 'storage'
                ? 'bg-[#E0A030] text-[#171513] font-black'
                : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#201D19]'
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">پایش ذخیره‌سازی D1</span>
          </button>

          <button
            data-key="cleanup"
            onClick={() => setActiveTab('cleanup')}
            className={`py-2 px-3.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 snap-start transition touch-target min-w-[44px] min-h-[44px] ${
              activeTab === 'cleanup'
                ? 'bg-[#E0A030] text-[#171513] font-black'
                : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#201D19]'
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap shrink-0">پاک‌سازی داده‌های یتیم</span>
          </button>

          <div className="ms-auto pe-1 shrink-0">
            <button
              onClick={() => loadTabData(activeTab)}
              disabled={loading}
              className="p-2 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] touch-target min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              title="بارگذاری مجدد"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin text-[#E0A030]' : ''}`} />
            </button>
          </div>
        </ScrollableRow>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="جستجو بر اساس نام یا ایمیل کاربر..."
                  className="py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#736B5E] focus:border-[#E0A030] outline-none min-h-[44px]"
                />
                <span className="text-xs text-[#A39A89] text-left">
                  نمایش {filteredUsers.length} از {users.length} کاربر
                </span>
              </div>

              {/* Reset Link Card if active */}
              {generatedReset && (
                <div className="p-3.5 rounded-[12px] bg-[#201D19] border border-[#E0A030]/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#E0A030] flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>لینک تغییر رمز یک‌بارمصرف (معتبر تا 24 ساعت)</span>
                    </span>
                    <button
                      onClick={() => setGeneratedReset(null)}
                      className="text-xs text-[#A39A89] hover:text-[#EDE6D8]"
                    >
                      بستن
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedReset.url}
                      className="flex-1 py-1.5 px-3 rounded-[8px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] text-left outline-none"
                      dir="ltr"
                    />
                    <button
                      onClick={handleCopyResetLink}
                      className="py-1.5 px-3 rounded-[8px] btn-primary-amber text-xs font-bold flex items-center gap-1 touch-target min-w-[44px] min-h-[40px]"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table / List */}
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-[12px] bg-[#201D19] border border-[#2F2A23] flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-[#EDE6D8]">
                          {u.displayName || 'کاربر بدون نام'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold border ${
                          u.status === 'active'
                            ? 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/30'
                            : 'bg-[#C2512B]/15 text-[#C2512B] border-[#C2512B]/30'
                        }`}>
                          {u.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                        {u.platformRole === 'admin' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/35 font-bold">
                            مدیر پلتفرم
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#171513] text-[#A39A89] border border-[#2F2A23]">
                          {u.campaignsCount} کمپین
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#171513] text-[#A39A89] border border-[#2F2A23]">
                          ذخیره: {formatBytes(u.storageUsedBytes)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A39A89] font-mono truncate text-left" dir="ltr">
                        {u.email}
                      </p>
                      <div className="text-[10px] text-[#736B5E] flex items-center gap-3">
                        <span>عضویت: {new Date(u.createdAt).toLocaleDateString('fa-IR-u-nu-latn')}</span>
                        {u.lastLoginAt && (
                          <span>آخرین ورود: {new Date(u.lastLoginAt).toLocaleDateString('fa-IR-u-nu-latn')}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleGenerateResetLink(u.id)}
                        className="py-1.5 px-2.5 rounded-[8px] bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030] text-[11px] font-bold text-[#EDE6D8] flex items-center gap-1 touch-target min-w-[44px] min-h-[44px]"
                        title="تولید لینک یکبارمصرف تغییر رمز"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#E0A030]" />
                        <span>لینک بازنشانی</span>
                      </button>

                      <button
                        onClick={() => handleRevokeSessions(u.id)}
                        className="py-1.5 px-2.5 rounded-[8px] bg-[#171513] border border-[#2F2A23] hover:border-[#C2512B] text-[11px] font-bold text-[#EDE6D8] flex items-center gap-1 touch-target min-w-[44px] min-h-[44px]"
                        title="لغو تمام نشست‌های فعال این کاربر"
                      >
                        <Ban className="w-3.5 h-3.5 text-[#C2512B]" />
                        <span>خاتمه نشست‌ها</span>
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`py-1.5 px-2.5 rounded-[8px] text-[11px] font-bold border flex items-center gap-1 touch-target min-w-[44px] min-h-[44px] ${
                            u.status === 'active'
                              ? 'bg-[#C2512B]/15 text-[#C2512B] border-[#C2512B]/35 hover:bg-[#C2512B]/25'
                              : 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/35 hover:bg-[#6F9E78]/25'
                          }`}
                        >
                          <span>{u.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="p-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E0A030] shrink-0" />
                <span>
                  حفظ حریم خصوصی: مدیر سیستم به روایات محرمانه، یادداشت‌های خصوصی دی‌ام و محتوای داستانی کمپین‌ها دسترسی ندارد. فقط مشخصات کلان، اعضا و مدیریت وضعیت مجاز است.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <input
                  type="text"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="جستجو بر اساس نام کمپین یا مالک..."
                  className="py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#736B5E] focus:border-[#E0A030] outline-none min-h-[44px]"
                />
                <span className="text-xs text-[#A39A89] text-left">
                  نمایش {filteredCampaigns.length} از {campaigns.length} کمپین
                </span>
              </div>

              <div className="space-y-2">
                {filteredCampaigns.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-[12px] bg-[#201D19] border border-[#2F2A23] flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-[#EDE6D8]">
                          {c.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold border ${
                          c.status === 'active'
                            ? 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/30'
                            : c.status === 'archived'
                            ? 'bg-[#736B5E]/20 text-[#A39A89] border-[#736B5E]/30'
                            : 'bg-[#E0A030]/15 text-[#E0A030] border-[#E0A030]/30'
                        }`}>
                          {c.status === 'active' ? 'فعال' : c.status === 'archived' ? 'بایگانی‌شده' : 'پیش‌نویس'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#171513] text-[#A39A89] border border-[#2F2A23]">
                          {c.memberCount} عضو
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#171513] text-[#A39A89] border border-[#2F2A23]">
                          ذخیره: {formatBytes(c.storageUsedBytes)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A39A89]">
                        مالک: {c.ownerName} ({c.ownerEmail})
                      </p>
                      <div className="text-[10px] text-[#736B5E] flex items-center gap-3">
                        <span>شناسه: <code className="font-mono text-[#EDE6D8]">{c.id}</code></span>
                        <span>ایجاد: {new Date(c.createdAt).toLocaleDateString('fa-IR-u-nu-latn')}</span>
                        <span>آخرین فعالیت: {new Date(c.updatedAt).toLocaleDateString('fa-IR-u-nu-latn')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {c.status !== 'archived' ? (
                        <button
                          onClick={() => handleArchiveCampaign(c.id)}
                          className="py-1.5 px-3 rounded-[8px] bg-[#171513] border border-[#2F2A23] hover:border-[#C2512B] text-xs font-bold text-[#C2512B] flex items-center gap-1.5 touch-target min-w-[44px] min-h-[44px]"
                          title="بایگانی کردن کمپین"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>بایگانی</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreCampaign(c.id)}
                          className="py-1.5 px-3 rounded-[8px] bg-[#171513] border border-[#2F2A23] hover:border-[#6F9E78] text-xs font-bold text-[#6F9E78] flex items-center gap-1.5 touch-target min-w-[44px] min-h-[44px]"
                          title="بازگردانی کمپین به حالت فعال"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازگردانی</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] space-y-4">
                <h4 className="text-xs font-extrabold text-[#EDE6D8]">پیکربندی سهمیه‌ها و دسترسی‌های سامانه</h4>

                {/* Allow Campaign Creation */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
                  <div>
                    <span className="text-xs font-bold text-[#EDE6D8] block">مجوز ایجاد کمپین جدید توسط دی‌ام‌ها</span>
                    <span className="text-[11px] text-[#A39A89]">در صورت غیرفعال بودن، فقط مدیر می‌تواند کمپین جدید بسازد</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowCampaignCreation}
                    onChange={(e) => setSettings({ ...settings, allowCampaignCreation: e.target.checked })}
                    className="w-5 h-5 accent-[#E0A030] cursor-pointer"
                  />
                </div>

                {/* Registration Mode */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#EDE6D8]">شیوه ثبت‌نام کاربران</label>
                  <select
                    value={settings.registrationMode}
                    onChange={(e) => setSettings({ ...settings, registrationMode: e.target.value as any })}
                    className="w-full py-2.5 px-3 rounded-[10px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
                  >
                    <option value="invite">دعوت‌محور (فقط با داشتن کد دعوت معتبر)</option>
                    <option value="open">ثبت‌نام آزاد (برای همه کاربران بدون کد دعوت)</option>
                  </select>
                </div>

                {/* Per User Media Quota */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#EDE6D8]">سهمیه رسانه برای هر کاربر (مگابایت)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={Math.round(settings.perUserMediaQuotaBytes / (1024 * 1024))}
                    onChange={(e) => setSettings({ ...settings, perUserMediaQuotaBytes: Number(e.target.value) * 1024 * 1024 })}
                    className="w-full py-2 px-3 rounded-[10px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
                  />
                  <p className="text-[10px] text-[#A39A89]">تصاویر آواتار و پرتره‌های اختصاصی کاربر</p>
                </div>

                {/* Per Campaign Media Quota */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#EDE6D8]">سهمیه رسانه برای هر کمپین (مگابایت)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={Math.round(settings.perCampaignMediaQuotaBytes / (1024 * 1024))}
                    onChange={(e) => setSettings({ ...settings, perCampaignMediaQuotaBytes: Number(e.target.value) * 1024 * 1024 })}
                    className="w-full py-2 px-3 rounded-[10px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
                  />
                  <p className="text-[10px] text-[#A39A89]">تصاویر نقشه‌ها، دست‌نوشته‌ها و مدارک کمپین</p>
                </div>

                {/* Storage Warning Threshold */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#EDE6D8]">آستانه هشدار سهمیه پایگاه داده D1 (مگابایت)</label>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={Math.round(settings.storageWarningThresholdBytes / (1024 * 1024))}
                    onChange={(e) => setSettings({ ...settings, storageWarningThresholdBytes: Number(e.target.value) * 1024 * 1024 })}
                    className="w-full py-2 px-3 rounded-[10px] bg-[#171513] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
                  />
                  <p className="text-[10px] text-[#A39A89]">سقف رایگان پلن کلودفلر D1 معادل 1000 مگابایت (1 گیگابایت) است.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="py-2.5 px-5 rounded-[10px] btn-primary-amber font-extrabold text-xs touch-target min-w-[44px] min-h-[44px]"
              >
                {settingsSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات تنظیمات'}
              </button>
            </form>
          )}

          {/* TAB 4: STORAGE MONITOR */}
          {activeTab === 'storage' && storageStats && (
            <div className="space-y-4">
              {/* Overall Progress Card */}
              <div className="p-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#E0A030]" />
                    <span className="text-xs font-extrabold text-[#EDE6D8]">وضعیت مصرف پایگاه داده Cloudflare D1</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-[6px] border ${
                    storageStats.isOverThreshold
                      ? 'bg-[#C2512B]/20 text-[#C2512B] border-[#C2512B]/35'
                      : 'bg-[#6F9E78]/20 text-[#6F9E78] border-[#6F9E78]/35'
                  }`}>
                    {storageStats.warningPercent}٪ از آستانه هشدار
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-[#171513] overflow-hidden border border-[#2F2A23]">
                  <div
                    className={`h-full transition-all ${
                      storageStats.isOverThreshold ? 'bg-[#C2512B]' : 'bg-[#E0A030]'
                    }`}
                    style={{ width: `${Math.min(100, storageStats.warningPercent)}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A39A89]">
                  <span>مصرف تخمینی: {formatBytes(storageStats.totalBytes)}</span>
                  <span>آستانه هشدار: {formatBytes(storageStats.thresholdBytes)}</span>
                </div>
              </div>

              {/* Table Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#EDE6D8]">تفکیک داده‌ها به تفکیک جدول‌های D1</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {storageStats.tables.map(t => (
                    <div
                      key={t.table}
                      className="p-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#EDE6D8] block">{t.labelFa}</span>
                        <code className="text-[10px] text-[#736B5E] font-mono">{t.table}</code>
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-[#E0A030] block">{t.count.toLocaleString('fa-IR-u-nu-latn')} رکورد</span>
                        <span className="text-[10px] text-[#A39A89]">{formatBytes(t.estimatedBytes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORPHAN CLEANUP */}
          {activeTab === 'cleanup' && cleanupReport && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#C2512B]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#EDE6D8]">ابزار پاک‌سازی هوشمند رکوردهای یتیم</h4>
                    <p className="text-[11px] text-[#A39A89]">
                      حذف نشست‌های منقضی، لینک‌های تغییر رمز گذشته، کدهای دعوت باطل‌شده و فایل‌های تصویری بدون ارجاع
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
                    <span className="text-[11px] text-[#A39A89] block">تصاویر و فایل‌های یتیم</span>
                    <span className="text-sm font-extrabold text-[#EDE6D8]">{cleanupReport.counts.orphanMedia.toLocaleString('fa-IR-u-nu-latn')} مورد</span>
                  </div>

                  <div className="p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
                    <span className="text-[11px] text-[#A39A89] block">کدهای دعوت منقضی</span>
                    <span className="text-sm font-extrabold text-[#EDE6D8]">{cleanupReport.counts.expiredInvites.toLocaleString('fa-IR-u-nu-latn')} مورد</span>
                  </div>

                  <div className="p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
                    <span className="text-[11px] text-[#A39A89] block">نشست‌های باطل‌شده</span>
                    <span className="text-sm font-extrabold text-[#EDE6D8]">{cleanupReport.counts.expiredSessions.toLocaleString('fa-IR-u-nu-latn')} مورد</span>
                  </div>

                  <div className="p-3 rounded-[10px] bg-[#171513] border border-[#2F2A23]">
                    <span className="text-[11px] text-[#A39A89] block">لینک‌های تغییر رمز قدیمی</span>
                    <span className="text-sm font-extrabold text-[#EDE6D8]">{cleanupReport.counts.oldPasswordResets.toLocaleString('fa-IR-u-nu-latn')} مورد</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A39A89]">
                  <span>مجموع رکوردهای قابل پاک‌سازی: <strong className="text-[#E0A030]">{cleanupReport.cleanedTotal}</strong></span>
                  <span>آخرین بررسی: {new Date(cleanupReport.executedAt).toLocaleTimeString('fa-IR-u-nu-latn')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleRunCleanup(true)}
                  disabled={cleanupExecuting}
                  className="py-2.5 px-4 rounded-[10px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-xs font-bold text-[#EDE6D8] touch-target min-w-[44px] min-h-[44px]"
                >
                  بررسی مجدد (پیش‌نمایش)
                </button>

                <button
                  type="button"
                  onClick={() => handleRunCleanup(false)}
                  disabled={cleanupExecuting || cleanupReport.cleanedTotal === 0}
                  className="py-2.5 px-4 rounded-[10px] bg-[#C2512B] text-white hover:bg-[#A84322] font-extrabold text-xs transition touch-target min-w-[44px] min-h-[44px] flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>اجرای پاک‌سازی دائمی</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
