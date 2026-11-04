import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../../types';
import { api } from '../../services/api';
import { Scroll, Clock, RefreshCw, Shield, User, Key } from 'lucide-react';
import { inputCls } from '../ui/FormLayout';

interface DmAuditLogProps {
  campaignId?: string;
}

const ACTION_LABELS: Record<string, string> = {
  'login': 'ورود به حساب',
  'logout': 'خروج از حساب',
  'logout-all': 'خروج از تمام دستگاه‌ها',
  'register': 'ثبت‌نام کاربر جدید',
  'password-change': 'تغییر رمز عبور',
  'password-reset': 'بازنشانی رمز عبور',
  'create-reset-token': 'صدور لینک بازنشانی رمز',
  'user-update': 'تغییر نقش یا وضعیت کاربر',
  'user-delete': 'حذف کاربر',
  'invite-create': 'صدور کد دعوت',
  'invite-revoke': 'ابطال کد دعوت',
  'assign-character': 'واگذاری کاراکتر به کاربر'
};

const getActionFa = (action: string) => ACTION_LABELS[action] ?? action;

const getActionIcon = (action: string) => {
  if (action.includes('password') || action.includes('token')) return Key;
  if (action.includes('user') || action.includes('register')) return User;
  if (action.includes('invite')) return Shield;
  return Clock;
};

const formatDate = (iso: string | number) =>
  new Date(iso).toLocaleString('fa-IR-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' });

export const DmAuditLog: React.FC<DmAuditLogProps> = ({ campaignId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [campaignId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (campaignId) {
        const data = await api.getCampaignAuditLog(campaignId, 100);
        setLogs(data as any);
      } else {
        const data = await api.getAuditLog(100);
        setLogs(data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => !actionFilter || l.action === actionFilter);
  const availableActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header + filter: title left, controls right, no card wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Scroll className="w-4 h-4 text-accent" aria-hidden />
            <span>گزارش وقایع و امنیت</span>
          </h3>
          <p className="mt-1 text-xs text-text-muted">ورودها، تغییر نقش‌ها و صدور کدهای دعوت</p>
        </div>

        <div className="flex items-center gap-2">
          <Select noWrapper
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="فیلتر رخدادها"
            className={`${inputCls} sm:w-56`}
          >
            <option value="">همه رخدادها ({logs.length})</option>
            {availableActions.map(act => (
              <option key={act} value={act}>{getActionFa(act)}</option>
            ))}
          </Select>

          <Button
            type="button"
            onClick={loadLogs}
            aria-label="تازه‌سازی"
            title="تازه‌سازی"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* One list container, rows separated by dividers (denser than a card per row) */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted">
          {loading ? 'در حال دریافت وقایع...' : 'هیچ رخدادی ثبت نشده است.'}
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
          {filteredLogs.map(item => {
            const Icon = getActionIcon(item.action);
            return (
              <li key={item.id} className="p-3 sm:p-4 flex items-start gap-3">
                <span className="mt-0.5 w-9 h-9 rounded-lg bg-surface-2 text-accent flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="text-sm font-bold text-text-primary">{getActionFa(item.action)}</span>
                    <time className="text-xs text-text-muted tabular-nums">{formatDate(item.createdAt)}</time>
                  </div>

                  {(item.actorId || item.targetId) && (
                    <p className="mt-1 text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-0.5">
                      {item.actorId && <span>توسط: <code className="text-text-primary">{item.actorId}</code></span>}
                      {item.targetId && <span>هدف: <code className="text-text-primary">{item.targetId}</code></span>}
                    </p>
                  )}

                  {item.meta && (
                    <details className="mt-2">
                      <summary className="text-xs text-accent-hover cursor-pointer min-h-[32px] inline-flex items-center">
                        جزئیات فنی
                      </summary>
                      <pre
                        dir="ltr"
                        className="mt-1 p-2.5 rounded-lg bg-surface-2 text-xs font-mono text-text-muted overflow-x-auto"
                      >
                        {JSON.stringify(item.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};