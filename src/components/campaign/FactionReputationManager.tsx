import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
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
        return 'bg-surface-3 text-text-primary/80 border-accent';
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
      <div className="surface-card rounded-[14px] p-4 border border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-text-primary">شهرت و نگرش جناح‌ها</h3>
            <p className="text-xs text-text-muted">
              {isDm
                ? 'مدیریت و سنجش پایگاه اجتماعی گروه و کاراکترها نزد سازمان‌ها و قدرت‌های منطقه'
                : 'میزان اعتماد، دوستی یا خصومت جناح‌ها و فرقه‌های منطقه با ماجراجویان'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={loadData}
            title="بازخوانی"
            className="p-2 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {isDm && (
            <Button
              type="button"
              onClick={() => setCreateModal(prev => ({ ...prev, isOpen: true }))}
              className="px-3.5 py-2 rounded-xl bg-accent text-on-accent font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>ردیابی جناح جدید</span>
            </Button>
          )}
        </div>
      </div>

      {/* Target Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Button
          type="button"
          onClick={() => setTargetFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            targetFilter === 'all'
              ? 'bg-accent text-on-accent'
              : 'bg-surface-2 text-text-muted border border-border hover:text-text-primary'
          }`}
        >
          همه مسیرها ({reputations.length})
        </Button>
        <Button
          type="button"
          onClick={() => setTargetFilter('party')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
            targetFilter === 'party'
              ? 'bg-accent text-on-accent'
              : 'bg-surface-2 text-text-muted border border-border hover:text-text-primary'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>کل گروه</span>
        </Button>

        {participations.map(p => (
          <Button
            type="button"
            key={p.id}
            onClick={() => setTargetFilter(p.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
              targetFilter === p.id
                ? 'bg-accent text-on-accent'
                : 'bg-surface-2 text-text-muted border border-border hover:text-text-primary'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{p.className ? `${p.className} (${p.id.slice(0, 4)})` : p.id}</span>
          </Button>
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
        <div className="surface-card rounded-[14px] p-8 border border-border text-center text-text-muted text-xs">
          در حال بارگذاری وضعیت شهرت جناح‌ها...
        </div>
      ) : filteredReputations.length === 0 ? (
        <div className="surface-card rounded-[14px] p-8 border border-border text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-text-muted mx-auto opacity-40" />
          <p className="text-sm font-bold text-text-primary">هیچ رکورد شهرتی یافت نشد</p>
          <p className="text-xs text-text-muted">
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
                className="surface-card rounded-[14px] p-4 border border-border card-gold-top relative space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-text-primary">{rep.factionName || 'جناح ناشناس'}</h4>
                      {!rep.visible && isDm && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40 font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          <span>مخفی از بازیکنان</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        {isPartyWide ? <Users className="w-3 h-3 text-accent" /> : <User className="w-3 h-3 text-cyan-400" />}
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
                  <p className="text-xs text-text-primary/70 line-clamp-2 leading-relaxed">
                    {rep.factionDescription}
                  </p>
                )}

                {/* Visual Scale Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">
                      مقیاس: {rep.min} تا {rep.max}
                    </span>
                    <span className="font-black text-text-primary">
                      امتیاز: {rep.value > 0 ? `+${rep.value}` : rep.value}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden p-0.5 relative">
                    {/* Neutral center mark */}
                    <div className="absolute top-0 bottom-0 start-1/2 w-0.5 bg-surface-3 z-10" />

                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rep.value > 20
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : rep.value < -20
                          ? 'bg-gradient-to-r from-red-600 to-rose-500'
                          : 'bg-gradient-to-r from-accent to-accent-hover'
                      }`}
                      style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }}
                    />
                  </div>

                  {/* Threshold steps tags */}
                  <div className="flex justify-between text-xs text-text-muted px-0.5 pt-0.5">
                    <span>خصومت ({rep.min})</span>
                    <span>بی‌طرف (0)</span>
                    <span>اتحاد ({rep.max})</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                  <Button
                    type="button"
                    onClick={() => handleOpenLogs(rep)}
                    className="text-text-muted hover:text-text-primary flex items-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>تاریخچه رویدادها</span>
                  </Button>

                  {isDm && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        onClick={() => handleToggleVisibility(rep)}
                        title={rep.visible ? 'پنهان کردن از بازیکنان' : 'نمایش برای بازیکنان'}
                        className={`p-1.5 rounded-lg border transition ${
                          rep.visible
                            ? 'bg-surface-2 border-border text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {rep.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setAdjustModal({
                          isOpen: true,
                          reputation: rep,
                          delta: 5,
                          reason: '',
                          submitting: false
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border text-accent-hover font-bold hover:bg-surface-2 flex items-center gap-1 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>تغییر شهرت</span>
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleDeleteReputation(rep.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              میزان تغییر امتیاز (دلتا)
            </label>
            <div className="flex items-center gap-2">
              {[-20, -10, -5, +5, +10, +20].map(val => (
                <Button
                  type="button"
                  key={val}
                  onClick={() => setAdjustModal(prev => ({ ...prev, delta: val }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border transition ${
                    adjustModal.delta === val
                      ? val > 0
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-red-500 text-white border-red-400'
                      : 'bg-surface border-border text-text-muted'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </Button>
              ))}
            </div>
            <Input noWrapper
              type="number"
              value={adjustModal.delta}
              onChange={e => setAdjustModal(prev => ({ ...prev, delta: Number(e.target.value) }))}
              className="mt-2 w-full px-3 py-2 rounded-xl bg-surface border border-border text-center text-sm font-extrabold text-text-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              دلیل تغییر شهرت
            </label>
            <Input noWrapper
              type="text"
              placeholder="مثلاً: کمک به نجات کاروان موبدان در کویر خاموش"
              value={adjustModal.reason}
              onChange={e => setAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary focus:border-accent outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={adjustModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-extrabold text-xs shadow-sm disabled:opacity-50"
            >
              {adjustModal.submitting ? 'در حال ثبت...' : 'ثبت تغییر'}
            </Button>
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
            <div className="text-center py-6 text-xs text-text-muted">در حال دریافت تاریخچه...</div>
          ) : logsModal.logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-text-muted">رویدادی برای این جناح ثبت نشده است.</div>
          ) : (
            logsModal.logs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-surface border border-border flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-text-primary leading-relaxed">{log.reason}</p>
                  <p className="text-xs text-text-muted mt-1">
                    ثبت توسط: {log.createdByName || 'دانجن‌مستر'} • {new Date(log.createdAt).toLocaleDateString('fa-IR-u-nu-latn')}
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
            <label className="block text-xs font-bold text-text-primary mb-1.5">انتخاب جناح</label>
            <Select noWrapper
              value={createModal.factionId}
              onChange={e => setCreateModal(prev => ({ ...prev, factionId: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary outline-none"
            >
              <option value="">-- جناح را انتخاب کنید --</option>
              {factions.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.region || 'بدون منطقه'})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">مخاطب مسیر شهرت</label>
            <Select noWrapper
              value={createModal.participationId}
              onChange={e => setCreateModal(prev => ({ ...prev, participationId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary outline-none"
            >
              <option value="">کل گروه (Party-Wide)</option>
              {participations.map(p => (
                <option key={p.id} value={p.id}>
                  شخصیت خاص: {p.className ? `${p.className} (${p.id.slice(0, 4)})` : p.id}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">امتیاز اولیه</label>
              <Input noWrapper
                type="number"
                value={createModal.initialValue}
                onChange={e => setCreateModal(prev => ({ ...prev, initialValue: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-center text-xs text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">حداقل (Min)</label>
              <Input noWrapper
                type="number"
                value={createModal.min}
                onChange={e => setCreateModal(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-center text-xs text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">حداکثر (Max)</label>
              <Input noWrapper
                type="number"
                value={createModal.max}
                onChange={e => setCreateModal(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-center text-xs text-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Input noWrapper
              type="checkbox"
              id="visibleCheck"
              checked={createModal.visible}
              onChange={e => setCreateModal(prev => ({ ...prev, visible: e.target.checked }))}
              className="w-4 h-4 accent-accent rounded"
            />
            <label htmlFor="visibleCheck" className="text-xs text-text-primary font-bold cursor-pointer">
              قابل مشاهده برای بازیکنان (در غیر این صورت فقط برای DM نشان داده می‌شود)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={() => setCreateModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={createModal.submitting}
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-extrabold text-xs shadow-sm"
            >
              {createModal.submitting ? 'در حال ثبت...' : 'ایجاد ردیاب شهرت'}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
