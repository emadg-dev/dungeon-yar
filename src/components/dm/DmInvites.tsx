import React, { useState, useEffect } from 'react';
import { Invite, Character } from '../../types';
import { api } from '../../services/api';
import { 
  KeyRound, Plus, Copy, Check, X, Trash2, Clock, 
  Users, CheckCircle2, AlertCircle, Sparkles, Share2 
} from 'lucide-react';

interface DmInvitesProps {
  characters: Character[];
}

export const DmInvites: React.FC<DmInvitesProps> = ({ characters }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form fields
  const [label, setLabel] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [assignCharacterId, setAssignCharacterId] = useState('');

  // Generated invite display
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState<Invite | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const list = await api.listInvites();
      setInvites(list);
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در دریافت لیست دعوت‌ها', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const inv = await api.createInvite({
        label: label.trim() || 'دعوت جدید',
        expiresInDays,
        maxUses,
        assignCharacterId: assignCharacterId || undefined
      });
      setNewlyCreatedInvite(inv);
      setShowCreateForm(false);
      setLabel('');
      setAssignCharacterId('');
      loadInvites();
      setMessage({ text: 'کد دعوت با موفقیت صادر گردید.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در صدور کد دعوت', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('آیا از ابطال این کد دعوت اطمینان دارید؟ دیگر امکان ثبت‌نام با آن وجود نخواهد داشت.')) return;
    try {
      await api.revokeInvite(inviteId);
      loadInvites();
      setMessage({ text: 'کد دعوت با موفقیت باطل شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در ابطال دعوت', type: 'error' });
    }
  };

  const copyText = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const getStatusBadge = (inv: Invite) => {
    const isRevoked = !!inv.revokedAt;
    const isExpired = inv.expiresAt > 0 && inv.expiresAt < Date.now();
    const isUsed = inv.usedCount >= inv.maxUses;

    if (isRevoked) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#C2512B]/20 text-[#C2512B] border border-[#C2512B]/40 font-bold">
          باطل‌شده
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#C97B4A]/20 text-[#C97B4A] border border-[#C97B4A]/40 font-bold">
          منقضی‌شده
        </span>
      );
    }
    if (isUsed) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#A39A89]/20 text-[#A39A89] border border-[#A39A89]/40 font-bold">
          مصرف‌شده
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/40 font-bold">
        فعال و معتبر
      </span>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header & Actions */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#EDE6D8] flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-[#E0A030]" />
            <span>کدهای دعوت و پیوند‌های ثبت‌نام</span>
          </h3>
          <p className="text-[11px] text-[#A39A89] mt-0.5">
            صدور دعوت‌نامه با امکان انتساب خودکار کاراکتر به ماجراجو در زمان ثبت‌نام
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="py-2 px-3.5 rounded-[10px] btn-primary-amber text-xs font-bold touch-target flex items-center gap-1.5 shrink-0"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showCreateForm ? 'انصراف' : 'صدور کد دعوت جدید'}</span>
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-3 rounded-[10px] text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#6F9E78]/15 text-[#6F9E78] border border-[#6F9E78]/30 font-bold'
              : 'bg-[#C2512B]/15 text-[#EDE6D8] border border-[#C2512B]/35'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="p-1 touch-target">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Newly Created Invite Card with Copy Warning */}
      {newlyCreatedInvite && (
        <div className="surface-card rounded-[14px] p-4 border-2 border-[#E0A030] bg-[#E0A030]/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#E0A030] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              کد دعوت با موفقیت تولید شد
            </span>
            <button
              type="button"
              onClick={() => setNewlyCreatedInvite(null)}
              className="p-1 text-[#A39A89] hover:text-[#EDE6D8] touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#EDE6D8]/90 leading-relaxed">
            پیوند مستقیم ثبت‌نام زیر را کپی کرده و برای بازیکن مورد نظر ارسال کنید:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={newlyCreatedInvite.inviteLink || `${window.location.origin}/#register?code=${newlyCreatedInvite.code}`}
              dir="ltr"
              className="flex-1 py-2 px-3 rounded-[8px] bg-[#171513] border border-[#2F2A23] text-xs font-mono text-[#EDE6D8] select-all min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => copyText(newlyCreatedInvite.inviteLink || `${window.location.origin}/#register?code=${newlyCreatedInvite.code}`, true)}
              className="py-2 px-4 rounded-[8px] btn-primary-amber text-xs font-bold touch-target flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'پیوند کپی شد' : 'کپی پیوند ثبت‌نام'}</span>
            </button>
          </div>

          {newlyCreatedInvite.code && (
            <div className="text-[11px] text-[#A39A89] flex items-center gap-2 pt-1">
              <span>کد کوتاه:</span>
              <span className="font-mono text-[#E0A030] font-bold">{newlyCreatedInvite.code}</span>
              <button
                type="button"
                onClick={() => copyText(newlyCreatedInvite.code!, false)}
                className="text-[10px] text-[#A39A89] hover:text-[#EDE6D8] underline"
              >
                {copiedCode ? 'کپی شد' : 'کپی کد'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Invite Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateInvite} className="surface-card rounded-[14px] p-4 border border-[#2F2A23] space-y-3.5">
          <h4 className="text-xs font-extrabold text-[#EDE6D8]">مشخصات دعوت‌نامه جدید</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#EDE6D8]">عنوان / یادداشت دعوت</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: دعوت علی (بازیکن سامان)"
                className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#EDE6D8]">کاراکتر انتسابی خودکار (اختیاری)</label>
              <select
                value={assignCharacterId}
                onChange={(e) => setAssignCharacterId(e.target.value)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
              >
                <option value="">بدون کاراکتر اولیه (انتخاب بعدی توسط DM)</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.className} - سطح {c.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#EDE6D8]">مدت اعتبار (روز)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10) || 30)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#EDE6D8]">حداکثر دفعات مجاز استفاده</label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="py-2 px-4 rounded-[10px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] text-xs font-bold touch-target min-h-[44px]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 rounded-[10px] btn-primary-amber font-extrabold text-xs touch-target min-h-[44px]"
            >
              تولید و دریافت لینک
            </button>
          </div>
        </form>
      )}

      {/* Invites List */}
      <div className="space-y-2">
        {invites.length === 0 ? (
          <div className="surface-card rounded-[14px] p-8 text-center text-xs text-[#A39A89]">
            {loading ? 'در حال بارگذاری دعوت‌ها...' : 'هیچ کد دعوتی صادر نشده است.'}
          </div>
        ) : (
          invites.map((inv) => (
            <div
              key={inv.id}
              className="surface-card rounded-[12px] p-3.5 border border-[#2F2A23] flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-[#EDE6D8] truncate">{inv.label || 'دعوت'}</span>
                  {getStatusBadge(inv)}
                </div>

                <div className="text-[11px] text-[#A39A89] flex items-center gap-2 flex-wrap">
                  <span>مصرف: {inv.usedCount} از {inv.maxUses} بار</span>
                  <span>•</span>
                  <span>
                    انقضا: {new Date(inv.expiresAt).toLocaleDateString('fa-IR')}
                  </span>
                  {inv.assignCharacterId && (
                    <>
                      <span>•</span>
                      <span className="text-[#E0A030]">
                        کاراکتر: {characters.find(c => c.id === inv.assignCharacterId)?.name || 'اختصاصی'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Revoke button */}
              {!inv.revokedAt && (
                <button
                  type="button"
                  onClick={() => handleRevoke(inv.id)}
                  className="p-2 rounded-[8px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#C2512B] touch-target"
                  title="ابطال این دعوت‌نامه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
