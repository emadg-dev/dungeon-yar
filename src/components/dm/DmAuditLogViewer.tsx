import React, { useState, useEffect } from 'react';
import { CampaignAuditLogEntry } from '../../types';
import { api } from '../../services/api';
import {
  FileText, Shield, RefreshCw, Search, Clock, User,
  Filter, CheckCircle2, AlertTriangle, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

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
      return 'bg-[#C2512B]/20 text-[#C2512B] border-[#C2512B]/35';
    }
    if (a.includes('create') || a.includes('add') || a.includes('launch') || a.includes('restore')) {
      return 'bg-[#6F9E78]/20 text-[#6F9E78] border-[#6F9E78]/35';
    }
    if (a.includes('update') || a.includes('edit') || a.includes('patch')) {
      return 'bg-[#E0A030]/20 text-[#E0A030] border-[#E0A030]/35';
    }
    return 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="w-full max-w-3xl bg-[#171513] border border-[#2F2A23] rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2F2A23] bg-[#201D19]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[10px] bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#EDE6D8]">دفتر لاگ و رهگیری رویدادهای کمپین</h2>
              <p className="text-[11px] text-[#A39A89]">
                ثبت تغییرات امنیتی، اقدامات اعضا، دستکاری برگه‌ها و وضعیت نبردها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] text-xs font-bold touch-target min-h-[44px]"
          >
            بستن
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#2F2A23] bg-[#1B1815] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#736B5E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کنش‌ها، مجری، شناسه یا جزئیات..."
              className="w-full py-2 pr-9 pl-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#736B5E] focus:border-[#E0A030] outline-none min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
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
              className="p-2.5 rounded-[10px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] touch-target min-h-[44px]"
              title="بارگذاری مجدد لاگ‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A39A89]">در حال دریافت تاریخچه لاگ...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A39A89]">هیچ لاگی یافت نشد.</div>
          ) : (
            filteredLogs.map(l => {
              const isExpanded = expandedId === l.id;
              return (
                <div
                  key={l.id}
                  className="p-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold border ${getActionBadgeClass(l.action)}`}>
                        {l.action}
                      </span>
                      <span className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#A39A89]" />
                        <span>{l.actorName || 'سیستم'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#736B5E] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(l.createdAt).toLocaleDateString('fa-IR-u-nu-latn')} {new Date(l.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {l.meta && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : l.id)}
                          className="p-1 rounded text-[#A39A89] hover:text-[#EDE6D8]"
                          title="نمایش جزئیات فنی"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {l.targetId && (
                    <div className="text-[11px] text-[#A39A89]">
                      شناسه هدف: <code className="font-mono text-[#EDE6D8] text-[10px]">{l.targetId}</code>
                    </div>
                  )}

                  {isExpanded && l.meta && (
                    <pre className="p-2.5 rounded-[8px] bg-[#171513] border border-[#2F2A23] text-[10px] font-mono text-[#E0A030] overflow-x-auto text-left" dir="ltr">
                      {JSON.stringify(l.meta, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
