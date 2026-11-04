import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { CampaignAuditLogEntry } from '../../types';
import { api } from '../../services/api';
import { FileText, RefreshCw, Search, Clock, User } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';
import { inputCls } from '../ui/FormLayout';

interface DmAuditLogViewerProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (iso: string | number) =>
  new Date(iso).toLocaleString('fa-IR-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' });

const getActionBadgeClass = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('revoke') || a.includes('archive')) return 'bg-danger/15 text-danger border-danger/30';
  if (a.includes('create') || a.includes('add') || a.includes('launch') || a.includes('restore')) return 'bg-success/15 text-success border-success/30';
  if (a.includes('update') || a.includes('edit') || a.includes('patch')) return 'bg-accent/15 text-accent-hover border-accent/30';
  return 'bg-surface-2 text-text-muted border-border';
};

export const DmAuditLogViewer: React.FC<DmAuditLogViewerProps> = ({ campaignId, isOpen, onClose }) => {
  const [logs, setLogs] = useState<CampaignAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  useEffect(() => {
    if (isOpen && campaignId) loadLogs();
  }, [isOpen, campaignId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const items = await api.getCampaignAuditLog(campaignId, 100);
      setLogs(items);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      !q ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.actorName || '').toLowerCase().includes(q) ||
      (l.targetId || '').toLowerCase().includes(q) ||
      JSON.stringify(l.meta || {}).toLowerCase().includes(q);
    const matchesAction = selectedAction === 'all' || l.action.toLowerCase().includes(selectedAction);
    return matchesSearch && matchesAction;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" aria-hidden />
          <span>لاگ رویدادهای کمپین</span>
        </div>
      }
      subtitle="تغییرات، اقدامات اعضا و وضعیت نبردها"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Filters stay visible while the list scrolls (sheet scrolls, not a nested box) */}
        <div className="sticky top-0 z-10 bg-surface pb-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden />
            <Input noWrapper
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کنش، مجری یا جزئیات"
              aria-label="جستجو در لاگ"
              className={`${inputCls} ps-10`}
            />
          </div>

          <div className="flex gap-2">
            <Select noWrapper
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="فیلتر نوع کنش"
              className={`${inputCls} flex-1 sm:w-40`}
            >
              <option value="all">همه کنش‌ها</option>
              <option value="session">جلسات</option>
              <option value="encounter">نبردها</option>
              <option value="roll">تاس‌ها</option>
              <option value="quest">ماموریت‌ها</option>
              <option value="handout">دست‌نوشته‌ها</option>
              <option value="character">شخصیت‌ها</option>
              <option value="member">اعضا</option>
            </Select>

            <Button
              onClick={loadLogs}
              disabled={loading}
              aria-label="بارگذاری مجدد"
              title="بارگذاری مجدد"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">در حال دریافت لاگ...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">هیچ لاگی یافت نشد.</div>
        ) : (
          <ul className="rounded-xl border border-border divide-y divide-border">
            {filteredLogs.map(l => (
              <li key={l.id} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      dir="ltr"
                      className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium border ${getActionBadgeClass(l.action)}`}
                    >
                      {l.action}
                    </span>
                    <span className="text-sm font-medium text-text-primary inline-flex items-center gap-1 min-w-0">
                      <User className="w-3.5 h-3.5 text-text-muted shrink-0" aria-hidden />
                      <span className="truncate">{l.actorName || 'سیستم'}</span>
                    </span>
                  </div>
                  <time className="text-xs text-text-muted inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" aria-hidden />
                    {formatDate(l.createdAt)}
                  </time>
                </div>

                {l.targetId && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    هدف: <code className="font-mono text-text-primary">{l.targetId}</code>
                  </p>
                )}

                {l.meta && (
                  <details className="mt-1.5">
                    <summary className="text-xs text-accent-hover cursor-pointer min-h-[32px] inline-flex items-center">
                      جزئیات فنی
                    </summary>
                    <pre dir="ltr" className="mt-1 p-2.5 rounded-lg bg-surface-2 text-xs font-mono text-text-muted overflow-x-auto">
                      {JSON.stringify(l.meta, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
};