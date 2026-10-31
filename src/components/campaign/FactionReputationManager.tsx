import React, { useState, useEffect } from 'react';
import {
  FactionReputation,
  FactionReputationThreshold,
  ReputationLog,
  Faction,
  CharacterParticipation,
  CampaignRole
} from '../../types';
import { api } from '../../services/api';
import {
  canUserManageReputation,
  getReputationLabel,
  calculateReputationPercentage,
  DEFAULT_REPUTATION_THRESHOLDS
} from '../../../shared/rules/reputationEngine';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Sliders,
  History,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Users,
  User,
  AlertTriangle,
  RefreshCw,
  Flag
} from 'lucide-react';

interface FactionReputationManagerProps {
  campaignId: string;
  userRole?: CampaignRole | boolean | 'dm' | null;
  activeParticipationId?: string | null;
  participations?: CharacterParticipation[];
  factions?: Faction[];
  onOpenFactionDetails?: (factionId: string) => void;
}

export const FactionReputationManager: React.FC<FactionReputationManagerProps> = ({
  campaignId,
  userRole,
  activeParticipationId,
  participations = [],
  factions = [],
  onOpenFactionDetails
}) => {
  const isDm = canUserManageReputation(userRole);

  const [reputations, setReputations] = useState<FactionReputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected filter (all, party, or character ID)
  const [targetFilter, setTargetFilter] = useState<string>('all');

  // Modals
  const [adjustModal, setAdjustModal] = useState<{
    isOpen: boolean;
    reputation: FactionReputation | null;
    delta: number;
    reason: string;
    submitting: boolean;
  }>({
    isOpen: false,
    reputation: null,
    delta: 5,
    reason: '',
    submitting: false
  });

  const [logsModal, setLogsModal] = useState<{
    isOpen: boolean;
    reputation: FactionReputation | null;
    logs: ReputationLog[];
    loading: boolean;
  }>({
    isOpen: false,
    reputation: null,
    logs: [],
    loading: false
  });

  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    factionId: string;
    participationId: string;
    initialValue: number;
    min: number;
    max: number;
    visible: boolean;
    submitting: boolean;
  }>({
    isOpen: false,
    factionId: '',
    participationId: '',
    initialValue: 0,
    min: -100,
    max: 100,
    visible: true,
    submitting: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.listFactionReputations(campaignId, activeParticipationId || undefined);
      setReputations(list);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات شهرت جناح‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignId, activeParticipationId]);

  const handleAdjustReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal.reputation) return;

    try {
      setAdjustModal(prev => ({ ...prev, submitting: true }));
      const result = await api.adjustFactionReputation(
        campaignId,
        adjustModal.reputation.id,
        adjustModal.delta,
        adjustModal.reason || 'تنظیم شهرت'
      );
      setReputations(prev => prev.map(r => r.id === result.reputation.id ? result.reputation : r));
      setAdjustModal({ isOpen: false, reputation: null, delta: 5, reason: '', submitting: false });
    } catch (err: any) {
      alert(err?.message || 'خطا در ثبت تغییر شهرت');
      setAdjustModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleToggleVisibility = async (rep: FactionReputation) => {
    if (!isDm) return;
    try {
      const updated = await api.updateFactionReputation(campaignId, rep.id, {
        visible: !rep.visible
      });
      setReputations(prev => prev.map(r => r.id === rep.id ? updated : r));
    } catch (err: any) {
      alert(err?.message || 'خطا در تغییر وضعیت دیده‌شدن');
    }
  };

  const handleDeleteReputation = async (id: string) => {
    if (!isDm) return;
    if (!confirm('آیا از حذف این مسیر شهرت اطمینان دارید؟')) return;
    try {
      await api.deleteFactionReputation(campaignId, id);
      setReputations(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err?.message || 'خطا در حذف شهرت');
    }
  };

  const handleOpenLogs = async (rep: FactionReputation) => {
    try {
      setLogsModal({ isOpen: true, reputation: rep, logs: [], loading: true });
      const logs = await api.listReputationLogs(campaignId, rep.id);
      setLogsModal({ isOpen: true, reputation: rep, logs, loading: false });
    } catch (err) {
      setLogsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCreateReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModal.factionId) {
      alert('لطفاً یک جناح را انتخاب کنید.');
      return;
    }

    try {
      setCreateModal(prev => ({ ...prev, submitting: true }));
      const newRep = await api.createFactionReputation(campaignId, {
        factionId: createModal.factionId,
        participationId: createModal.participationId || null,
        value: createModal.initialValue,
        min: createModal.min,
        max: createModal.max,
        visible: createModal.visible,
        labels: DEFAULT_REPUTATION_THRESHOLDS
      });

      setReputations(prev => [newRep, ...prev]);
      setCreateModal({
        isOpen: false,
        factionId: '',
        participationId: '',
        initialValue: 0,
        min: -100,
        max: 100,
        visible: true,
        submitting: false
      });
    } catch (err: any) {
      alert(err?.message || 'خطا در ایجاد شهرت جناح');
      setCreateModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const getAttitudeBadgeColor = (label: string) => {
    switch (label) {
      case 'متحد':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'دوستانه':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'خصمانه':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'دشمن خونی':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-[#2F2A23] text-[#EDE6D8]/80 border-[#3D372E]';
    }
  };

  const filteredReputations = reputations.filter(r => {
    if (targetFilter === 'party') return !r.participationId;
    if (targetFilter !== 'all') return r.participationId === targetFilter;
    return true;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header bar */}
      <div className="surface-card rounded-[14px] p-4 border border-[#2F2A23] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E0A030]/10 border border-[#E0A030]/30 flex items-center justify-center text-[#E0A030]">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#EDE6D8]">شهرت و نگرش جناح‌ها</h3>
            <p className="text-xs text-[#A39A89]">
              {isDm
                ? 'مدیریت و سنجش پایگاه اجتماعی گروه و کاراکترها نزد سازمان‌ها و قدرت‌های منطقه'
                : 'میزان اعتماد، دوستی یا خصومت جناح‌ها و فرقه‌های منطقه با ماجراجویان'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="بازخوانی"
            className="p-2 rounded-lg bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isDm && (
            <button
              type="button"
              onClick={() => setCreateModal(prev => ({ ...prev, isOpen: true }))}
              className="px-3.5 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>ردیابی جناح جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setTargetFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            targetFilter === 'all'
              ? 'bg-[#E0A030] text-[#0E0D0C]'
              : 'bg-[#201D19] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
          }`}
        >
          همه مسیرها ({reputations.length})
        </button>
        <button
          type="button"
          onClick={() => setTargetFilter('party')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
            targetFilter === 'party'
              ? 'bg-[#E0A030] text-[#0E0D0C]'
              : 'bg-[#201D19] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>کل گروه</span>
        </button>

        {participations.map(p => (
          <button
            type="button"
            key={p.id}
            onClick={() => setTargetFilter(p.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
              targetFilter === p.id
                ? 'bg-[#E0A030] text-[#0E0D0C]'
                : 'bg-[#201D19] text-[#A39A89] border border-[#2F2A23] hover:text-[#EDE6D8]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{p.className ? `${p.className} (${p.id.slice(0, 4)})` : p.id}</span>
          </button>
        ))}
      </div>

      {/* Error / Empty State */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && reputations.length === 0 ? (
        <div className="surface-card rounded-[14px] p-8 border border-[#2F2A23] text-center text-[#A39A89] text-xs">
          در حال بارگذاری وضعیت شهرت جناح‌ها...
        </div>
      ) : filteredReputations.length === 0 ? (
        <div className="surface-card rounded-[14px] p-8 border border-[#2F2A23] text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-[#A39A89] mx-auto opacity-40" />
          <p className="text-sm font-bold text-[#EDE6D8]">هیچ رکورد شهرتی یافت نشد</p>
          <p className="text-xs text-[#A39A89]">
            {isDm ? 'برای شروع ردیابی نگرش جناح‌ها، دکمه «ردیابی جناح جدید» را لمس کنید.' : 'هنوز ارتباط ثبت‌شده‌ای با جناح‌های منطقه ندارید.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReputations.map(rep => {
            const currentLabel = getReputationLabel(rep.value, rep.labels);
            const percentage = calculateReputationPercentage(rep.value, rep.min, rep.max);
            const isPartyWide = !rep.participationId;

            return (
              <div
                key={rep.id}
                className="surface-card rounded-[14px] p-4 border border-[#2F2A23] card-gold-top relative space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#EDE6D8]">{rep.factionName || 'جناح ناشناس'}</h4>
                      {!rep.visible && isDm && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40 font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          <span>مخفی از بازیکنان</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A39A89]">
                      <span className="flex items-center gap-1">
                        {isPartyWide ? <Users className="w-3 h-3 text-[#E0A030]" /> : <User className="w-3 h-3 text-cyan-400" />}
                        <span>{isPartyWide ? 'مربوط به کل گروه' : (rep.characterName || 'کاراکتر خاص')}</span>
                      </span>
                      {rep.factionRegion && (
                        <>
                          <span>•</span>
                          <span>{rep.factionRegion}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stance badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${getAttitudeBadgeColor(currentLabel)}`}>
                    {currentLabel}
                  </span>
                </div>

                {/* Description if present */}
                {rep.factionDescription && (
                  <p className="text-xs text-[#EDE6D8]/70 line-clamp-2 leading-relaxed">
                    {rep.factionDescription}
                  </p>
                )}

                {/* Visual Scale Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#A39A89]">
                      مقیاس: {rep.min} تا {rep.max}
                    </span>
                    <span className="font-black text-[#EDE6D8]">
                      امتیاز: {rep.value > 0 ? `+${rep.value}` : rep.value}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#1A1815] border border-[#2F2A23] overflow-hidden p-0.5 relative">
                    {/* Neutral center mark */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#4A4337] z-10" />

                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rep.value > 20
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : rep.value < -20
                          ? 'bg-gradient-to-r from-red-600 to-rose-500'
                          : 'bg-gradient-to-r from-[#C9A048] to-[#F2C265]'
                      }`}
                      style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }}
                    />
                  </div>

                  {/* Threshold steps tags */}
                  <div className="flex justify-between text-[10px] text-[#A39A89] px-0.5 pt-0.5">
                    <span>خصومت ({rep.min})</span>
                    <span>بی‌طرف (۰)</span>
                    <span>اتحاد ({rep.max})</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2F2A23]/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenLogs(rep)}
                    className="text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>تاریخچه رویدادها</span>
                  </button>

                  {isDm && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(rep)}
                        title={rep.visible ? 'پنهان کردن از بازیکنان' : 'نمایش برای بازیکنان'}
                        className={`p-1.5 rounded-lg border transition ${
                          rep.visible
                            ? 'bg-[#201D19] border-[#2F2A23] text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {rep.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdjustModal({
                          isOpen: true,
                          reputation: rep,
                          delta: 5,
                          reason: '',
                          submitting: false
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#201D19] border border-[#2F2A23] text-[#F2C265] font-bold hover:bg-[#2B2620] flex items-center gap-1 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>تغییر شهرت</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReputation(rep.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adjust Reputation BottomSheet / Modal */}
      <BottomSheet
        isOpen={adjustModal.isOpen}
        onClose={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))}
        title={`تنظیم شهرت: ${adjustModal.reputation?.factionName || ''}`}
      >
        <form onSubmit={handleAdjustReputation} className="p-4 space-y-4" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
              میزان تغییر امتیاز (دلتا)
            </label>
            <div className="flex items-center gap-2">
              {[-20, -10, -5, +5, +10, +20].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAdjustModal(prev => ({ ...prev, delta: val }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border transition ${
                    adjustModal.delta === val
                      ? val > 0
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-red-500 text-white border-red-400'
                      : 'bg-[#1A1815] border-[#2F2A23] text-[#A39A89]'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={adjustModal.delta}
              onChange={e => setAdjustModal(prev => ({ ...prev, delta: Number(e.target.value) }))}
              className="mt-2 w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-center text-sm font-extrabold text-[#EDE6D8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">
              دلیل تغییر شهرت
            </label>
            <input
              type="text"
              placeholder="مثلاً: کمک به نجات کاروان موبدان در کویر خاموش"
              value={adjustModal.reason}
              onChange={e => setAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={adjustModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs shadow-sm disabled:opacity-50"
            >
              {adjustModal.submitting ? 'در حال ثبت...' : 'ثبت تغییر'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* History Log BottomSheet */}
      <BottomSheet
        isOpen={logsModal.isOpen}
        onClose={() => setLogsModal(prev => ({ ...prev, isOpen: false }))}
        title={`تاریخچه رویدادهای شهرت: ${logsModal.reputation?.factionName || ''}`}
      >
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto" dir="rtl">
          {logsModal.loading ? (
            <div className="text-center py-6 text-xs text-[#A39A89]">در حال دریافت تاریخچه...</div>
          ) : logsModal.logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#A39A89]">رویدادی برای این جناح ثبت نشده است.</div>
          ) : (
            logsModal.logs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#1A1815] border border-[#2F2A23] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#EDE6D8] leading-relaxed">{log.reason}</p>
                  <p className="text-[11px] text-[#A39A89] mt-1">
                    ثبت توسط: {log.createdByName || 'دانجن‌مستر'} • {new Date(log.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg font-black text-xs shrink-0 ${
                    log.delta > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </span>
              </div>
            ))
          )}
        </div>
      </BottomSheet>

      {/* Create Reputation Modal */}
      <BottomSheet
        isOpen={createModal.isOpen}
        onClose={() => setCreateModal(prev => ({ ...prev, isOpen: false }))}
        title="ردیابی شهرت جناح جدید"
      >
        <form onSubmit={handleCreateReputation} className="p-4 space-y-4" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">انتخاب جناح</label>
            <select
              value={createModal.factionId}
              onChange={e => setCreateModal(prev => ({ ...prev, factionId: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
            >
              <option value="">-- جناح را انتخاب کنید --</option>
              {factions.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.region || 'بدون منطقه'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">مخاطب مسیر شهرت</label>
            <select
              value={createModal.participationId}
              onChange={e => setCreateModal(prev => ({ ...prev, participationId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[#1A1815] border border-[#2F2A23] text-xs text-[#EDE6D8] outline-none"
            >
              <option value="">کل گروه (Party-Wide)</option>
              {participations.map(p => (
                <option key={p.id} value={p.id}>
                  شخصیت خاص: {p.className ? `${p.className} (${p.id.slice(0, 4)})` : p.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-[#A39A89] mb-1">امتیاز اولیه</label>
              <input
                type="number"
                value={createModal.initialValue}
                onChange={e => setCreateModal(prev => ({ ...prev, initialValue: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-[#1A1815] border border-[#2F2A23] text-center text-xs text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A39A89] mb-1">حداقل (Min)</label>
              <input
                type="number"
                value={createModal.min}
                onChange={e => setCreateModal(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-[#1A1815] border border-[#2F2A23] text-center text-xs text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A39A89] mb-1">حداکثر (Max)</label>
              <input
                type="number"
                value={createModal.max}
                onChange={e => setCreateModal(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-[#1A1815] border border-[#2F2A23] text-center text-xs text-[#EDE6D8]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="visibleCheck"
              checked={createModal.visible}
              onChange={e => setCreateModal(prev => ({ ...prev, visible: e.target.checked }))}
              className="w-4 h-4 accent-[#E0A030] rounded"
            />
            <label htmlFor="visibleCheck" className="text-xs text-[#EDE6D8] font-bold cursor-pointer">
              قابل مشاهده برای بازیکنان (در غیر این صورت فقط برای DM نشان داده می‌شود)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#A39A89]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={createModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-extrabold text-xs shadow-sm"
            >
              {createModal.submitting ? 'در حال ثبت...' : 'ایجاد ردیاب شهرت'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
