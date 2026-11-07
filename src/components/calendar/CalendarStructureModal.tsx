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
import { CalendarStructureForm } from './CalendarStructureForm';
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

  // Initial projected date for Before/After preview on structure change
  const [initialProjectedDate, setInitialProjectedDate] = useState<{
    year: number;
    month: number;
    monthName: string;
    day: number;
    isOffDay: boolean;
    offDayIndex?: number;
    weekdayIndex: number;
    weekdayName: string;
  } | null>(null);

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

      // Initialize alignment inputs and record initial projection for before/after comparison
      const currentProj = epochToDate(target, time.epochDay || 0);
      setAlignYear(currentProj.year);
      setAlignMonth(currentProj.month);
      setAlignDay(currentProj.day);
      setAlignIsOffDay(currentProj.isOffDay);
      setAlignOffDayIndex(currentProj.offDayIndex || 1);
      const w = weekdayOf(target, time.epochDay || 0);
      setAlignWeekdayIdx(w.index);

      const mName = currentProj.isOffDay
        ? (target.offDays?.[(currentProj.offDayIndex || 1) - 1]?.name || 'روز برون‌گاه')
        : (target.months?.[currentProj.month - 1]?.name || `ماه ${currentProj.month}`);

      setInitialProjectedDate({
        year: currentProj.year,
        month: currentProj.month,
        monthName: mName,
        day: currentProj.day,
        isOffDay: currentProj.isOffDay,
        offDayIndex: currentProj.offDayIndex,
        weekdayIndex: w.index,
        weekdayName: w.name
      });
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

      const mName = currentProj.isOffDay
        ? (target.offDays?.[(currentProj.offDayIndex || 1) - 1]?.name || 'روز برون‌گاه')
        : (target.months?.[currentProj.month - 1]?.name || `ماه ${currentProj.month}`);

      setInitialProjectedDate({
        year: currentProj.year,
        month: currentProj.month,
        monthName: mName,
        day: currentProj.day,
        isOffDay: currentProj.isOffDay,
        offDayIndex: currentProj.offDayIndex,
        weekdayIndex: w.index,
        weekdayName: w.name
      });
    }
  };

  // Add Calendar from Template
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

  // Duplicate Current Calendar
  const handleDuplicateCurrentCalendar = async () => {
    try {
      const copyData: GenericCalendarData = {
        ...JSON.parse(JSON.stringify(state.calendar)),
        id: undefined,
        name: `${state.calendar.name} (کپی)`
      };
      const created = await api.createCampaignCalendar(campaignId, copyData);
      setCalendars(prev => [...prev, created]);
      setSelectedCalId(created.id || '');
      dispatch({ type: 'SET_CALENDAR', calendar: created });
      setShowAddMenu(false);
      setStatusMessage({ type: 'success', text: `نسخه کپی با نام «${created.name}» ایجاد شد.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در کپی گاه‌شمار' });
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

      // If the deleted calendar was primary, promote nextTarget to primary
      if (selectedCalId === primaryCalId && nextTarget.id) {
        setPrimaryCalId(nextTarget.id);
        try {
          await api.setCampaignTime(campaignId, {
            epochDay: currentEpochDay,
            calendarId: nextTarget.id
          });
        } catch {}
      }

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
  const currentMonthName = currentProj.isOffDay
    ? (state.calendar.offDays?.[(currentProj.offDayIndex || 1) - 1]?.name || 'روز برون‌گاه')
    : (state.calendar.months?.[currentProj.month - 1]?.name || `ماه ${currentProj.month}`);

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
                      <div className="absolute end-0 top-full mt-1.5 w-56 rounded-xl bg-surface border border-border shadow-xl p-1 z-30 space-y-1">
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
                        <button
                          type="button"
                          onClick={handleDuplicateCurrentCalendar}
                          className="w-full text-start p-2 rounded-lg hover:bg-surface-2 text-xs text-text-primary flex flex-col gap-0.5 border-t border-border/60 pt-1.5"
                        >
                          <span className="font-bold flex items-center gap-1 text-accent-hover">
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی از گاه‌شمار فعلی</span>
                          </span>
                          <span className="text-text-muted text-[11px]">نسخه‌برداری با تنظیمات مستقل</span>
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

          {/* Calendar Structure Form (Standalone & Pure) */}
          <CalendarStructureForm
            calendar={state.calendar}
            onChange={(updated) => dispatch({ type: 'SET_CALENDAR', calendar: updated })}
            isDm={isDm}
            currentEpochDay={currentEpochDay}
            initialProjectedDate={initialProjectedDate}
            showTodayAlignment={true}
            externalState={state}
            externalDispatch={dispatch}
          />

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
