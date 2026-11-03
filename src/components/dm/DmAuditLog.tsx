import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../../types';
import { api } from '../../services/api';
import { Scroll, Filter, Clock, RefreshCw, Shield, User, Key, UserCheck, Trash2 } from 'lucide-react';

interface DmAuditLogProps {
  campaignId?: string;
}

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

  const getActionFa = (action: string) => {
    switch (action) {
      case 'login': return 'ورود به حساب';
      case 'logout': return 'خروج از حساب';
      case 'logout-all': return 'خروج از تمام دستگاه‌ها';
      case 'register': return 'ثبت‌نام کاربر جدید';
      case 'password-change': return 'تغییر رمز عبور';
      case 'password-reset': return 'بازنشانی رمز عبور';
      case 'create-reset-token': return 'صدور لینک بازنشانی رمز';
      case 'user-update': return 'تغییر نقش یا وضعیت کاربر';
      case 'user-delete': return 'حذف کاربر';
      case 'invite-create': return 'صدور کد دعوت جدید';
      case 'invite-revoke': return 'ابطال کد دعوت';
      case 'assign-character': return 'واگذاری کاراکتر به کاربر';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('password') || action.includes('token')) return Key;
    if (action.includes('user') || action.includes('register')) return User;
    if (action.includes('invite')) return Shield;
    return Clock;
  };

  const filteredLogs = logs.filter(l => !actionFilter || l.action === actionFilter);

  const availableActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Filter */}
      <div className="surface-card rounded-[14px] p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-1.5">
            <Scroll className="w-4 h-4 text-accent" />
            <span>گزارش وقایع و امنیت سیستم (Audit Log)</span>
          </h3>
          <p className="text-xs text-text-muted">
            ثبت تمام اقدامات کلیدی، تغییر نقش‌ها، ورودها و صدور کدهای دعوت
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-1.5 px-3 rounded-[8px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none min-h-[44px]"
          >
            <option value="">همه رخدادها ({logs.length})</option>
            {availableActions.map(act => (
              <option key={act} value={act}>
                {getActionFa(act)} ({act})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadLogs}
            className="p-2 rounded-[8px] bg-surface-2 border border-border text-text-muted hover:text-text-primary touch-target min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="تازه‌سازی لاگ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="surface-card rounded-[14px] p-8 text-center text-xs text-text-muted">
            {loading ? 'در حال دریافت وقایع...' : 'هیچ رخدادی ثبت نشده است.'}
          </div>
        ) : (
          filteredLogs.map(item => {
            const Icon = getActionIcon(item.action);
            return (
              <div
                key={item.id}
                className="surface-card rounded-[10px] p-3 border border-border flex items-start gap-3 text-xs"
              >
                <div className="p-2 rounded-[8px] bg-surface-2 border border-border text-accent shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 gap-2 flex-wrap">
                    <span className="font-bold text-text-primary">{getActionFa(item.action)}</span>
                    <span className="text-xs text-text-muted font-mono" dir="ltr">
                      {new Date(item.createdAt).toLocaleDateString('fa-IR-u-nu-latn')} {new Date(item.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                    {item.actorId && <span>توسط: <code className="text-text-primary">{item.actorId}</code></span>}
                    {item.targetId && <span>هدف: <code className="text-accent">{item.targetId}</code></span>}
                  </div>

                  {item.meta && (
                    <div className="text-xs font-mono text-text-muted bg-surface p-1.5 rounded-[6px] border border-border mt-1 overflow-x-auto" dir="ltr">
                      {JSON.stringify(item.meta)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
