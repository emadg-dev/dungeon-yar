import React, { useState, useEffect, useCallback } from 'react';
import { GenericCalendarData, CampaignTimeResponse } from '../../types';
import { api } from '../../services/api';
import { Calendar, Clock, Edit, Sparkles, FastForward, ChevronLeft, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarModal } from '../calendar/CalendarModal';
import { CalendarStructureModal } from '../calendar/CalendarStructureModal';
import { toPersianDigits } from '../../../shared/rules/historyEngine';

interface DmCalendarTabProps {
  campaignId: string;
  userRole?: 'owner' | 'co_dm' | 'player';
}

export const DmCalendarTab: React.FC<DmCalendarTabProps> = ({
  campaignId,
  userRole = 'owner'
}) => {
  const [calendars, setCalendars] = useState<GenericCalendarData[]>([]);
  const [campaignTime, setCampaignTime] = useState<CampaignTimeResponse | null>(null);
  const [selectedCalId, setSelectedCalId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [cals, time] = await Promise.all([
        api.getCampaignCalendars(campaignId).catch(() => []),
        api.getCampaignTime(campaignId).catch(() => null)
      ]);
      setCalendars(cals || []);
      setCampaignTime(time);
      if (cals && cals.length > 0) {
        const preferred = (time?.primaryCalendarId && cals.find(c => c.id === time.primaryCalendarId)) || cals[0];
        setSelectedCalId(preferred?.id || cals[0].id || '');
      }
    } catch (err) {
      console.error('Failed to load campaign calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCal = calendars.find(c => c.id === selectedCalId) || calendars[0];

  const handleAdvanceDays = async (days: number) => {
    if (!campaignId || advancing) return;
    setAdvancing(true);
    try {
      const res = await api.advanceCampaignTime(campaignId, { days });
      setCampaignTime(res);
      await loadData();
    } catch (err) {
      console.error('Failed to advance campaign time:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const totalDaysInYear = activeCal
    ? activeCal.months.reduce((acc, m) => acc + (m.days || 0), 0) + (activeCal.offDays?.length || 0)
    : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header Card */}
      <div className="surface-card rounded-2xl p-4 sm:p-5 border border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent-hover flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-text-primary">
                گاه‌شمار و زمان جهان کمپین
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                مدیریت تقویم‌های دنیا، پیشروی زمان رویدادها، ماه‌ها و روزهای ویژه
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => setCalendarModalOpen(true)}
              className="bg-accent text-on-accent text-xs font-bold px-4 py-2 rounded-xl shadow-md min-h-[44px] flex items-center gap-2 hover:bg-accent-hover transition"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>دیدن گاه‌شمار کامل</span>
            </Button>

            <Button
              type="button"
              onClick={() => setStructureModalOpen(true)}
              className="bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold px-3.5 py-2 rounded-xl border border-border min-h-[44px] flex items-center gap-2 transition"
            >
              <Edit className="w-4 h-4 shrink-0 text-accent" />
              <span>ویرایش ساختار تقویم‌ها</span>
            </Button>

            <Button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="بارگذاری مجدد اطلاعات گاه‌شمار"
              className="bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text-primary text-xs font-bold p-2.5 rounded-xl border border-border min-h-[44px] min-w-[44px] flex items-center justify-center transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Current Date Banner */}
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-accent-hover text-xs font-bold">
              <Clock className="w-4 h-4 shrink-0" />
              <span>زمان رسمی جهان کمپین</span>
            </div>
            {campaignTime?.activeFestivals?.[0] && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-accent text-on-accent">
                جشنواره: {campaignTime.activeFestivals[0].name}
              </span>
            )}
          </div>

          <div className="text-lg sm:text-xl font-black text-accent-hover">
            {campaignTime?.formattedDate || (loading ? 'در حال دریافت زمان...' : 'گاه‌شمار ثبت‌نشده')}
          </div>

          <div className="text-xs text-text-muted flex flex-wrap items-center gap-4 pt-1 border-t border-accent/20">
            <span>روز مطلق کمپین: <strong className="text-text-primary">{toPersianDigits(campaignTime?.epochDay ?? 0)}</strong></span>
            {activeCal && (
              <>
                <span>نام تقویم: <strong className="text-text-primary">{activeCal.name}</strong></span>
                <span>طول سال: <strong className="text-text-primary">{toPersianDigits(totalDaysInYear)} روز</strong></span>
                <span>تعداد ماه‌ها: <strong className="text-text-primary">{toPersianDigits(activeCal.months.length)}</strong></span>
                {activeCal.offDays && activeCal.offDays.length > 0 && (
                  <span>روزهای برون‌گاه: <strong className="text-text-primary">{toPersianDigits(activeCal.offDays.length)}</strong></span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fast Day Advance Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <FastForward className="w-4 h-4 text-accent shrink-0" />
            <span className="font-bold">پیشروی سریع زمان جهان:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={advancing}
              onClick={() => handleAdvanceDays(1)}
              className="bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold px-3 py-2 rounded-lg border border-border min-h-[44px] flex items-center gap-1.5 transition"
            >
              <span>+۱ روز</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              disabled={advancing}
              onClick={() => handleAdvanceDays(7)}
              className="bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold px-3 py-2 rounded-lg border border-border min-h-[44px] flex items-center gap-1.5 transition"
            >
              <span>+۷ روز (یک هفته)</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              disabled={advancing}
              onClick={() => handleAdvanceDays(30)}
              className="bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold px-3 py-2 rounded-lg border border-border min-h-[44px] flex items-center gap-1.5 transition"
            >
              <span>+۳۰ روز (یک ماه)</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Multi-Calendar Switcher */}
        {calendars.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-text-muted shrink-0">گاه‌شمار انتخابی:</span>
            <select
              value={selectedCalId}
              onChange={e => setSelectedCalId(e.target.value)}
              className="bg-surface-2 border border-border text-xs rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
            >
              {calendars.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Calendar Structure Overview */}
      {activeCal && (
        <div className="surface-card rounded-2xl p-4 sm:p-5 border border-border space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>ساختار ماه‌ها و روزهای {activeCal.name}</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                برچسب دوره: {activeCal.eraLabel || 'تعیین نشده'}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setStructureModalOpen(true)}
              className="text-xs text-accent-hover font-bold hover:underline flex items-center gap-1 min-h-[44px] px-2"
            >
              <span>ویرایش ماه‌ها و روزها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Month Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {activeCal.months.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-2 border border-border space-y-1 text-start"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-text-primary truncate">{m.name}</span>
                  <span className="text-[11px] font-bold text-accent px-1.5 py-0.5 rounded bg-accent/15">
                    {toPersianDigits(idx + 1)}
                  </span>
                </div>
                <div className="text-xs text-text-muted">
                  {toPersianDigits(m.days)} روز
                </div>
              </div>
            ))}
          </div>

          {/* Off-days / Festivals banner if any */}
          {activeCal.offDays && activeCal.offDays.length > 0 && (
            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-text-primary">
                روزهای برون‌گاه و تعطیلات ویژه:
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCal.offDays.map((od, odIdx) => (
                  <span
                    key={od.id || odIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary"
                  >
                    <Sparkles className="w-3 h-3 text-accent shrink-0" />
                    <span className="font-bold">{od.name}</span>
                    {od.note && (
                      <span className="text-[11px] text-text-muted">
                        ({od.note})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {calendarModalOpen && (
        <CalendarModal
          isOpen={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          isDm={userRole === 'owner' || userRole === 'co_dm'}
          timeResponse={campaignTime || undefined}
          activeCalendar={activeCal}
          campaignId={campaignId}
          onAdvanceCampaignTime={async (days) => {
            await handleAdvanceDays(days);
          }}
          onOpenStructureEditor={() => {
            setCalendarModalOpen(false);
            setStructureModalOpen(true);
          }}
        />
      )}

      {structureModalOpen && (
        <CalendarStructureModal
          isOpen={structureModalOpen}
          onClose={() => setStructureModalOpen(false)}
          campaignId={campaignId}
          userRole={userRole}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
