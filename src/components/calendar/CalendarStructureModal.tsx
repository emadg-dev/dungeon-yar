import React, { useState, useEffect, useReducer } from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import type { GenericCalendarData, CampaignRole, CalendarMonth, CalendarOffDay } from '../../types';
import { api } from '../../services/api';
import {
  initCalendarStructureState,
  calendarStructureReducer,
  calculateAnchorFromToday
} from '../../../shared/rules/calendarStructureReducer';
import {
  CALENDAR_TEMPLATES,
  TEMPLATE_SIMPLE_STARTER,
  createCampaignCalendarFromTemplate
} from '../../../shared/rules/calendarTemplates';
import { epochToDate, weekdayOf } from '../../../shared/rules/calendar';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  AlertTriangle,
  RotateCcw,
  Copy,
  Layers,
  Star,
  Info
} from 'lucide-react';

export interface CalendarStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  userRole?: CampaignRole | string;
  onSaved?: () => void;
}

export const CalendarStructureModal: React.FC<CalendarStructureModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  userRole,
  onSaved
}) => {
  const isDm = userRole === 'owner' || userRole === 'co_dm';

  const [calendars, setCalendars] = useState<GenericCalendarData[]>([]);
  const [selectedCalId, setSelectedCalId] = useState<string>('');
  const [primaryCalId, setPrimaryCalId] = useState<string>('');
  const [currentEpochDay, setCurrentEpochDay] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reducer for current active calendar under editing
  const [state, dispatch] = useReducer(
    calendarStructureReducer,
    initCalendarStructureState(TEMPLATE_SIMPLE_STARTER)
  );

  // Add Calendar Template Choice
  const [showAddMenu, setShowAddMenu] = useState(false);
  // Delete Confirmation Sheet
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // Unsaved changes alert
  const [unsavedAlertOpen, setUnsavedAlertOpen] = useState(false);

  // Today Alignment inputs
  const [alignYear, setAlignYear] = useState<number>(1500);
  const [alignMonth, setAlignMonth] = useState<number>(1);
  const [alignDay, setAlignDay] = useState<number>(1);
  const [alignIsOffDay, setAlignIsOffDay] = useState<boolean>(false);
  const [alignOffDayIndex, setAlignOffDayIndex] = useState<number>(1);
  const [alignWeekdayIdx, setAlignWeekdayIdx] = useState<number>(0);

  // Load all campaign calendars and epoch time
  const loadData = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [cals, time] = await Promise.all([
        api.getCampaignCalendars(campaignId),
        api.getCampaignTime(campaignId)
      ]);
      setCalendars(cals);
      setPrimaryCalId(time.primaryCalendarId || cals[0]?.id || '');
      setCurrentEpochDay(time.epochDay || 0);

      const target = cals.find(c => c.id === selectedCalId) || cals[0] || TEMPLATE_SIMPLE_STARTER;
      setSelectedCalId(target.id || '');
      dispatch({ type: 'SET_CALENDAR', calendar: target });

      // Initialize alignment inputs to current projected date in target calendar
      const currentProj = epochToDate(target, time.epochDay || 0);
      setAlignYear(currentProj.year);
      setAlignMonth(currentProj.month);
      setAlignDay(currentProj.day);
      setAlignIsOffDay(currentProj.isOffDay);
      setAlignOffDayIndex(currentProj.offDayIndex || 1);
      const w = weekdayOf(target, time.epochDay || 0);
      setAlignWeekdayIdx(w.index);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در بارگذاری گاه‌شمارها' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  // Handle Calendar Switch
  const handleSelectCalendar = (calId: string) => {
    if (state.isDirty) {
      setUnsavedAlertOpen(true);
      return;
    }
    setSelectedCalId(calId);
    const target = calendars.find(c => c.id === calId);
    if (target) {
      dispatch({ type: 'SET_CALENDAR', calendar: target });
      const currentProj = epochToDate(target, currentEpochDay);
      setAlignYear(currentProj.year);
      setAlignMonth(currentProj.month);
      setAlignDay(currentProj.day);
      setAlignIsOffDay(currentProj.isOffDay);
      setAlignOffDayIndex(currentProj.offDayIndex || 1);
      const w = weekdayOf(target, currentEpochDay);
      setAlignWeekdayIdx(w.index);
    }
  };

  // Add Calendar
  const handleAddCalendar = async (sourceTemplate: GenericCalendarData) => {
    try {
      const newCalData = createCampaignCalendarFromTemplate(campaignId, sourceTemplate, {
        name: `${sourceTemplate.name} (کمپین)`
      });
      const created = await api.createCampaignCalendar(campaignId, newCalData);
      setCalendars(prev => [...prev, created]);
      setSelectedCalId(created.id || '');
      dispatch({ type: 'SET_CALENDAR', calendar: created });
      setShowAddMenu(false);
      setStatusMessage({ type: 'success', text: `گاه‌شمار «${created.name}» افزوده شد.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در افزودن گاه‌شمار' });
    }
  };

  // Delete Current Calendar
  const handleDeleteCalendar = async () => {
    if (calendars.length <= 1) {
      setStatusMessage({ type: 'error', text: 'امکان حذف آخرین گاه‌شمار کمپین وجود ندارد.' });
      setDeleteConfirmOpen(false);
      return;
    }
    try {
      await api.deleteCampaignCalendar(campaignId, selectedCalId);
      const remaining = calendars.filter(c => c.id !== selectedCalId);
      setCalendars(remaining);
      const nextTarget = remaining[0];
      setSelectedCalId(nextTarget.id || '');
      dispatch({ type: 'SET_CALENDAR', calendar: nextTarget });
      setDeleteConfirmOpen(false);
      setStatusMessage({ type: 'success', text: 'گاه‌شمار با موفقیت حذف شد.' });
      onSaved?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در حذف گاه‌شمار' });
      setDeleteConfirmOpen(false);
    }
  };

  // Set as Primary Calendar
  const handleSetPrimary = async () => {
    try {
      await api.setCampaignTime(campaignId, {
        epochDay: currentEpochDay,
        calendarId: selectedCalId
      });
      setPrimaryCalId(selectedCalId);
      setStatusMessage({ type: 'success', text: 'این گاه‌شمار به عنوان گاه‌شمار اصلی تنظیم شد.' });
      onSaved?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در تنظیم گاه‌شمار اصلی' });
    }
  };

  // Recalculate anchor from today inputs
  const handleApplyTodayAlignment = () => {
    dispatch({
      type: 'CALCULATE_ANCHOR_FROM_TODAY',
      targetEpochDay: currentEpochDay,
      todayYear: Number(alignYear),
      todayMonthOrOffDay: {
        isOffDay: alignIsOffDay,
        month: Number(alignMonth),
        day: Number(alignDay),
        offDayIndex: Number(alignOffDayIndex)
      },
      todayWeekdayIndex: Number(alignWeekdayIdx)
    });
    setStatusMessage({
      type: 'success',
      text: 'لنگر گاه‌شمار بر مبنای تاریخ انتخابی همگام شد.'
    });
  };

  // Save changes to server
  const handleSave = async () => {
    if (!state.validation.valid) {
      setStatusMessage({ type: 'error', text: 'لطفاً ابتدا خطاهای ساختار گاه‌شمار را برطرف کنید.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateCampaignCalendar(campaignId, selectedCalId, state.calendar);
      setCalendars(prev => prev.map(c => c.id === updated.id ? updated : c));
      dispatch({ type: 'SET_CALENDAR', calendar: updated });
      setStatusMessage({ type: 'success', text: 'تغییرات گاه‌شمار با موفقیت ذخیره شد.' });
      onSaved?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در ذخیره گاه‌شمار' });
    } finally {
      setSaving(false);
    }
  };

  const currentProj = epochToDate(state.calendar, currentEpochDay);
  const currentWeekday = weekdayOf(state.calendar, currentEpochDay);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={() => {
          if (state.isDirty) {
            setUnsavedAlertOpen(true);
          } else {
            onClose();
          }
        }}
        title="ویرایش و مدیریت گاه‌شمارهای کمپین"
        subtitle={isDm ? "تنظیم ساختار ماه‌ها، روزهای برون‌گاه، چرخه هفتگی و لنگر زمان" : "مشاهده جزئیات ساختار گاه‌شمار"}
        maxWidth="max-w-3xl"
        fullHeight
      >
        <div className="space-y-4 pb-12">
          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                statusMessage.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              <span>{statusMessage.text}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusMessage(null)}
                className="text-xs"
              >
                بستن
              </Button>
            </div>
          )}

          {/* Top Bar: Calendar Switcher & Management */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-accent-hover" />
                <span>گاه‌شمارهای کمپین ({calendars.length})</span>
              </span>

              {isDm && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="bg-accent/20 text-accent-hover border border-accent/40 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن گاه‌شمار</span>
                    </Button>

                    {showAddMenu && (
                      <div className="absolute end-0 top-full mt-1.5 w-56 rounded-xl bg-surface-1 border border-border shadow-xl p-1 z-30 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleAddCalendar(CALENDAR_TEMPLATES[0])}
                          className="w-full text-start p-2 rounded-lg hover:bg-surface-2 text-xs text-text-primary flex flex-col gap-0.5"
                        >
                          <span className="font-bold">قالب شاه‌روزان زروانیا</span>
                          <span className="text-text-muted text-[11px]">۱۲ ماه ۳۰ روزه + ۵ روز برون‌گاه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCalendar(CALENDAR_TEMPLATES[1])}
                          className="w-full text-start p-2 rounded-lg hover:bg-surface-2 text-xs text-text-primary flex flex-col gap-0.5"
                        >
                          <span className="font-bold">گاه‌شمار گاتایی</span>
                          <span className="text-text-muted text-[11px]">۱۲ ماه ۳۰ روزه + ۵ گاه اوستایی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCalendar(TEMPLATE_SIMPLE_STARTER)}
                          className="w-full text-start p-2 rounded-lg hover:bg-surface-2 text-xs text-text-primary flex flex-col gap-0.5"
                        >
                          <span className="font-bold">گاه‌شمار ساده از صفر</span>
                          <span className="text-text-muted text-[11px]">۱۲ ماه ۳۰ روزه آماده تغییر</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {calendars.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {calendars.map(c => {
                const isSelected = c.id === selectedCalId;
                const isPrimary = c.id === primaryCalId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCalendar(c.id || '')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'border-accent bg-accent/15 text-accent-hover shadow-sm'
                        : 'border-border bg-bg text-text-muted hover:border-border-strong'
                    }`}
                  >
                    <span>{c.name}</span>
                    {isPrimary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-hover flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>اصلی</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Set as primary button */}
            {isDm && selectedCalId !== primaryCalId && (
              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSetPrimary}
                  className="text-xs text-accent-hover flex items-center gap-1"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>تنظیم به عنوان گاه‌شمار اصلی نمایش</span>
                </Button>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {!state.validation.valid && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <span>خطاهای اعتبارسنجی ساختار گاه‌شمار:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-text-primary">
                {state.validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
            <h4 className="text-xs font-bold text-text-primary">مشخصات هویتی گاه‌شمار</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">نام گاه‌شمار</label>
                <Input
                  noWrapper
                  disabled={!isDm}
                  value={state.calendar.name}
                  onChange={e => dispatch({ type: 'UPDATE_BASIC', name: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">برچسب دوره (Era)</label>
                <Input
                  noWrapper
                  disabled={!isDm}
                  value={state.calendar.eraLabel || ''}
                  onChange={e => dispatch({ type: 'UPDATE_BASIC', eraLabel: e.target.value })}
                  placeholder="مثلاً: پ.ر.ن، هجری، سال خورشید"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">سال آغازین لنگر (Start Year)</label>
                <Input
                  noWrapper
                  type="number"
                  disabled={!isDm}
                  value={state.calendar.startYear ?? 1500}
                  onChange={e => dispatch({ type: 'UPDATE_BASIC', startYear: Number(e.target.value) })}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border text-xs text-text-muted">
              <span>تعداد روزهای سال: <strong className="text-text-primary">{state.totalDaysInYear} روز</strong></span>
              <span>طول هفته: <strong className="text-text-primary">{state.weekLength} روز</strong></span>
              <span>تعداد ماه‌ها: <strong className="text-text-primary">{state.calendar.months.length} ماه</strong></span>
              <span>روزهای برون‌گاه: <strong className="text-text-primary">{state.calendar.offDays?.length || 0} روز</strong></span>
            </div>
          </div>

          {/* Section: Today in this Calendar (Anchor Calculation) */}
          <div className="p-3.5 rounded-xl bg-info/40 border border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-accent-hover flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                <span>تنظیم تاریخ امروز در این گاه‌شمار (همگام‌سازی لنگر)</span>
              </span>
              <span className="text-xs text-text-muted">روز مطلق کمپین: {currentEpochDay}</span>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              با وارد کردن تاریخ امروز برای این تقویم، لنگر زمانی و روز هفته لنگر طوری محاسبه می‌شود که این تقویم با سایر گاه‌شمارهای کمپین در روز مطلق {currentEpochDay} همگام گردد.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">سال جاری</label>
                <Input
                  noWrapper
                  type="number"
                  disabled={!isDm}
                  value={alignYear}
                  onChange={e => setAlignYear(Number(e.target.value))}
                  className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">ماه جاری</label>
                <Select
                  disabled={!isDm || alignIsOffDay}
                  value={alignMonth}
                  onChange={e => setAlignMonth(Number(e.target.value))}
                  className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                >
                  {state.calendar.months.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m.name} ({idx + 1})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">روز ماه</label>
                <Input
                  noWrapper
                  type="number"
                  disabled={!isDm || alignIsOffDay}
                  value={alignDay}
                  onChange={e => setAlignDay(Number(e.target.value))}
                  className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">روز هفته امروز</label>
                <Select
                  disabled={!isDm}
                  value={alignWeekdayIdx}
                  onChange={e => setAlignWeekdayIdx(Number(e.target.value))}
                  className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                >
                  {(state.calendar.weekdays || []).map((w, idx) => (
                    <option key={idx} value={idx}>{w}</option>
                  ))}
                </Select>
              </div>
            </div>

            {isDm && (
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyTodayAlignment}
                  className="bg-accent/20 text-accent-hover border border-accent/40 text-xs font-bold"
                >
                  محاسبه لنگر و همگام‌سازی تاریخ امروز
                </Button>
              </div>
            )}
          </div>

          {/* Section: Weekdays */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary">روزهای هفته ({state.weekLength} روز)</span>
              {isDm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'ADD_WEEKDAY', name: `روز ${state.weekLength + 1}` })}
                  className="text-xs text-accent-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن روز هفته</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(state.calendar.weekdays || []).map((w, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-bg border border-border flex items-center justify-between gap-2">
                  <Input
                    noWrapper
                    disabled={!isDm}
                    value={w}
                    onChange={e => dispatch({ type: 'UPDATE_WEEKDAY', index: idx, name: e.target.value })}
                    className="w-full bg-transparent border-0 text-xs text-text-primary p-0 focus:outline-none"
                  />
                  {isDm && state.weekLength > 1 && (
                    <button
                      type="button"
                      aria-label="حذف روز هفته"
                      onClick={() => dispatch({ type: 'REMOVE_WEEKDAY', index: idx })}
                      className="text-text-muted hover:text-danger p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Months */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary">ماه‌های سال ({state.calendar.months.length} ماه)</span>
              {isDm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'ADD_MONTH', month: { name: `ماه ${state.calendar.months.length + 1}`, days: 30 } })}
                  className="text-xs text-accent-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن ماه</span>
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto p-1 scrollbar-none">
              {state.calendar.months.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-xs font-bold text-text-muted w-5 shrink-0">{idx + 1}</span>
                    <Input
                      noWrapper
                      disabled={!isDm}
                      value={m.name}
                      onChange={e => dispatch({ type: 'UPDATE_MONTH', index: idx, month: { name: e.target.value } })}
                      placeholder="نام ماه"
                      className="flex-1 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                    <Input
                      noWrapper
                      type="number"
                      disabled={!isDm}
                      value={m.days}
                      onChange={e => dispatch({ type: 'UPDATE_MONTH', index: idx, month: { days: Number(e.target.value) } })}
                      className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary text-center"
                    />
                    <span className="text-xs text-text-muted">روز</span>
                    <Input
                      noWrapper
                      disabled={!isDm}
                      value={m.season || ''}
                      onChange={e => dispatch({ type: 'UPDATE_MONTH', index: idx, month: { season: e.target.value } })}
                      placeholder="فصل (اختیاری)"
                      className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                    />
                  </div>

                  {isDm && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="انتقال به بالا"
                        disabled={idx === 0}
                        onClick={() => dispatch({ type: 'MOVE_MONTH', fromIndex: idx, toIndex: idx - 1 })}
                        className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="انتقال به پایین"
                        disabled={idx === state.calendar.months.length - 1}
                        onClick={() => dispatch({ type: 'MOVE_MONTH', fromIndex: idx, toIndex: idx + 1 })}
                        className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {state.calendar.months.length > 1 && (
                        <button
                          type="button"
                          aria-label="حذف ماه"
                          onClick={() => dispatch({ type: 'REMOVE_MONTH', index: idx })}
                          className="p-1.5 rounded text-text-muted hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Off-Days */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary">روزهای برون‌گاه / خارج از ماه ({state.calendar.offDays?.length || 0})</span>
              {isDm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: 'ADD_OFF_DAY', offDay: { name: `روز برون‌گاه ${(state.calendar.offDays?.length || 0) + 1}` } })}
                  className="text-xs text-accent-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن روز برون‌گاه</span>
                </Button>
              )}
            </div>

            {(!state.calendar.offDays || state.calendar.offDays.length === 0) ? (
              <p className="text-xs text-text-muted italic">این تقویم فاقد روز برون‌گاه است.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto p-1 scrollbar-none">
                {state.calendar.offDays.map((od, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-role-codm w-5 shrink-0">{idx + 1}</span>
                      <Input
                        noWrapper
                        disabled={!isDm}
                        value={od.name}
                        onChange={e => dispatch({ type: 'UPDATE_OFF_DAY', index: idx, offDay: { name: e.target.value } })}
                        placeholder="نام روز برون‌گاه"
                        className="flex-1 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                      />
                      <Input
                        noWrapper
                        disabled={!isDm}
                        value={od.folkBelief || od.note || ''}
                        onChange={e => dispatch({ type: 'UPDATE_OFF_DAY', index: idx, offDay: { folkBelief: e.target.value } })}
                        placeholder="باور اسطوره‌ای یا یادداشت"
                        className="flex-1 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                      />
                    </div>

                    {isDm && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="انتقال به بالا"
                          disabled={idx === 0}
                          onClick={() => dispatch({ type: 'MOVE_OFF_DAY', fromIndex: idx, toIndex: idx - 1 })}
                          className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="انتقال به پایین"
                          disabled={idx === (state.calendar.offDays?.length || 1) - 1}
                          onClick={() => dispatch({ type: 'MOVE_OFF_DAY', fromIndex: idx, toIndex: idx + 1 })}
                          className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف روز برون‌گاه"
                          onClick={() => dispatch({ type: 'REMOVE_OFF_DAY', index: idx })}
                          className="p-1.5 rounded text-text-muted hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          {isDm && (
            <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs"
              >
                انصراف
              </Button>

              <Button
                type="button"
                disabled={saving || !state.validation.valid || !state.isDirty}
                onClick={handleSave}
                className="bg-accent text-on-accent font-bold text-xs px-5 py-2.5 rounded-xl shadow-md min-h-[44px]"
              >
                {saving ? 'در حال ذخیره‌سازی...' : 'ذخیره ساختار گاه‌شمار'}
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Delete Calendar Confirm Sheet */}
      <ConfirmSheet
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteCalendar}
        title="حذف گاه‌شمار کمپین"
        message={`آیا از حذف گاه‌شمار «${state.calendar.name}» اطمینان دارید؟`}
        confirmText="حذف گاه‌شمار"
        cancelText="انصراف"
        destructive
      />

      {/* Unsaved Changes Alert Sheet */}
      <ConfirmSheet
        isOpen={unsavedAlertOpen}
        onClose={() => setUnsavedAlertOpen(false)}
        onConfirm={() => {
          setUnsavedAlertOpen(false);
          onClose();
        }}
        title="تغییرات ذخیره‌نشده"
        message="تغییراتی در ساختار گاه‌شمار ایجاد کرده‌اید که هنوز ذخیره نشده‌اند. آیا می‌خواهید بدون ذخیره خارج شوید؟"
        confirmText="خروج بدون ذخیره"
        cancelText="ادامه ویرایش"
        destructive={false}
      />
    </>
  );
};
