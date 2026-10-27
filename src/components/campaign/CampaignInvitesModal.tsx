import React, { useState } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { Campaign, CampaignInvite, CampaignRole } from '../../types';
import { Plus, Trash2, Copy, Check, Link, Clock, Users } from 'lucide-react';

interface CampaignInvitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  invites: CampaignInvite[];
  onCreateInvite: (data: {
    role?: CampaignRole;
    label?: string;
    expiresInDays?: number;
    maxUses?: number;
    assignParticipationId?: string;
  }) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
}

export const CampaignInvitesModal: React.FC<CampaignInvitesModalProps> = ({
  isOpen,
  onClose,
  campaign,
  invites,
  onCreateInvite,
  onRevokeInvite
}) => {
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<CampaignRole>('player');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(5);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateInvite({
        label: label.trim() || 'دعوت به کمپین',
        role,
        expiresInDays,
        maxUses
      });
      setLabel('');
      setShowCreateForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code?: string, id?: string) => {
    const inviteCode = code || id || '';
    const link = `${window.location.origin}/#register?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id || '');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="مدیریت دعوت‌نامه‌های کمپین">
      <div className="space-y-4 py-2 text-right" dir="rtl">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#A39A89]">
            لینک‌های دعوت جهت پیوستن بازیکنان یا تماشاچیان جدید به کمپین «{campaign.name}»
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            دعوت‌نامه جدید
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[#131110] border border-[#E0A030]/30 space-y-3">
            <h4 className="text-xs font-bold text-[#F2C265]">مشخصات دعوت‌نامه جدید</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#A39A89] mb-1">عنوان یادداشت دعوت</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="مثلاً: دعوت علی، گروه دوشنبه‌ها..."
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A39A89] mb-1">نقش پس از پیوستن</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as CampaignRole)}
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                >
                  <option value="player">بازیکن (ماجراجو)</option>
                  <option value="co_dm">دستیار دانجن مستر</option>
                  <option value="spectator">تماشاچی (فقط خواندن و تاس میز)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#A39A89] mb-1">انقضا (روز)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(parseInt(e.target.value) || 30)}
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A39A89] mb-1">حداکثر دفعات استفاده</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={e => setMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-xs text-[#A39A89] hover:text-[#EDE6D8]"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-[#E0A030] text-[#0E0D0C] text-xs font-bold rounded-xl hover:bg-[#F2C265] disabled:opacity-50"
              >
                ایجاد دعوت‌نامه
              </button>
            </div>
          </form>
        )}

        {/* Invites List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {invites.length === 0 ? (
            <p className="text-xs text-[#8A8374] text-center py-6 border border-dashed border-[#2F2A23] rounded-2xl">
              هنوز هیچ دعوت‌نامه‌ای برای این کمپین صادر نشده است.
            </p>
          ) : (
            invites.map(inv => {
              const isExpired = inv.expiresAt < Date.now();
              const isMaxed = inv.usedCount >= inv.maxUses;
              const isCopied = copiedId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-[#131110]/80 border border-[#2F2A23] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#F2C265]">{inv.label || 'دعوت‌نامه'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#A39A89]">
                        <span>نقش: {inv.role === 'co_dm' ? 'دستیار DM' : inv.role === 'spectator' ? 'تماشاچی' : 'بازیکن'}</span>
                        <span>•</span>
                        <span>استفاده: {inv.usedCount}/{inv.maxUses}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(inv.code, inv.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#F2C265] text-xs font-medium flex items-center gap-1 min-h-[36px]"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#6F9E78]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'کپی شد' : 'کپی لینک'}</span>
                      </button>
                      <button
                        onClick={() => onRevokeInvite(inv.id)}
                        className="p-2 text-[#D66138] hover:bg-[#C2512B]/10 rounded-xl transition-colors"
                        title="ابطال دعوت‌نامه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2F2A23]/80 flex items-center justify-between text-[10px] text-[#8A8374] font-mono">
                    <span>کد: {inv.code || inv.id}</span>
                    {isExpired && <span className="text-[#D66138]">منقضی شده</span>}
                    {isMaxed && !isExpired && <span className="text-[#F2C265]">تکمیل ظرفیت</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
