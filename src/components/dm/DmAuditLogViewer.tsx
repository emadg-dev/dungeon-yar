import React, { useState, useEffect } from 'react';
import { CampaignAuditLogEntry } from '../../types';
import { api } from '../../services/api';
import {
  FileText, Shield, RefreshCw, Search, Clock, User,
  Filter, CheckCircle2, AlertTriangle, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface DmAuditLogViewerProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DmAuditLogViewer: React.FC<DmAuditLogViewerProps> = ({
  campaignId,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<CampaignAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && campaignId) {
      loadLogs();
    }
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

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.actorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.targetId || '').toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(l.meta || {}).toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      selectedAction === 'all' || l.action.toLowerCase().includes(selectedAction.toLowerCase());

    return matchesSearch && matchesAction;
  });

  const getActionBadgeClass = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('revoke') || a.includes('archive')) {
      return 'bg-danger/20 text-danger border-danger/35';
    }
    if (a.includes('create') || a.includes('add') || a.includes('launch') || a.includes('restore')) {
      return 'bg-success/20 text-success border-success/35';
    }
    if (a.includes('update') || a.includes('edit') || a.includes('patch')) {
      return 'bg-accent/20 text-accent border-accent/35';
    }
    return 'bg-surface-2 text-text-muted border-border';
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <span>دفتر لاگ و رهگیری رویدادهای کمپین</span>
        </div>
      }
      subtitle="ثبت تغییرات امنیتی، اقدامات اعضا، دستکاری برگه‌ها و وضعیت نبردها"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">

        {/* Filter bar */}
        <div className="p-3 border-b border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-disabled absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کنش‌ها، مجری، شناسه یا جزئیات..."
              className="w-full py-2 pe-9 ps-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary placeholder-text-disabled focus:border-accent outline-none min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="py-2 px-3 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent outline-none min-h-[44px]"
            >
              <option value="all">همه کنش‌ها</option>
              <option value="session">جلسات</option>
              <option value="encounter">نبردها</option>
              <option value="roll">تاس‌ها</option>
              <option value="quest">ماموریت‌ها</option>
              <option value="handout">دست‌نوشته‌ها</option>
              <option value="character">شخصیت‌ها</option>
              <option value="member">اعضا</option>
            </select>

            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2.5 rounded-[10px] bg-surface-2 text-text-muted hover:text-text-primary border border-border touch-target min-w-[44px] min-h-[44px]"
              title="بارگذاری مجدد لاگ‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">در حال دریافت تاریخچه لاگ...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">هیچ لاگی یافت نشد.</div>
          ) : (
            filteredLogs.map(l => {
              const isExpanded = expandedId === l.id;
              return (
                <div
                  key={l.id}
                  className="p-3 rounded-[12px] bg-surface-2 border border-border space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-[6px] font-bold border ${getActionBadgeClass(l.action)}`}>
                        {l.action}
                      </span>
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span>{l.actorName || 'سیستم'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-disabled flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(l.createdAt).toLocaleDateString('fa-IR-u-nu-latn')} {new Date(l.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {l.meta && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : l.id)}
                          className="p-1 rounded text-text-muted hover:text-text-primary"
                          title="نمایش جزئیات فنی"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {l.targetId && (
                    <div className="text-xs text-text-muted">
                      شناسه هدف: <code className="font-mono text-text-primary text-xs">{l.targetId}</code>
                    </div>
                  )}

                  {isExpanded && l.meta && (
                    <pre className="p-2.5 rounded-[8px] bg-surface border border-border text-xs font-mono text-accent overflow-x-auto text-end" dir="ltr">
                      {JSON.stringify(l.meta, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
