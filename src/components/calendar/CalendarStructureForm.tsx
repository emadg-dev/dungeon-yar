import React, { useReducer, useEffect, useRef, useState } from 'react';
import type { GenericCalendarData, CalendarMonth, CalendarOffDay } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  initCalendarStructureState,
  calendarStructureReducer,
  calculateAnchorFromToday,
  CalendarStructureAction,
  CalendarStructureState
} from '../../../shared/rules/calendarStructureReducer';
import { epochToDate, weekdayOf } from '../../../shared/rules/calendar';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export interface CalendarStructureFormProps {
  calendar: GenericCalendarData;
  onChange: (updatedCalendar: GenericCalendarData) => void;
  isDm?: boolean;
  currentEpochDay?: number;
  initialProjectedDate?: {
    year: number;
    month: number;
    monthName: string;
    day: number;
    isOffDay: boolean;
    offDayIndex?: number;
    weekdayIndex: number;
    weekdayName: string;
  } | null;
  hideBasicInfo?: boolean;
  showTodayAlignment?: boolean;
  externalState?: CalendarStructureState;
  externalDispatch?: React.Dispatch<CalendarStructureAction>;
}

export const CalendarStructureForm: React.FC<CalendarStructureFormProps> = ({
  calendar,
  onChange,
  isDm = true,
  currentEpochDay,
  initialProjectedDate,
  hideBasicInfo = false,
  showTodayAlignment = false,
  externalState,
  externalDispatch
}) => {
  // If external state is not passed, manage with internal reducer
  const [internalState, internalDispatch] = useReducer(
    calendarStructureReducer,
    initCalendarStructureState(calendar)
  );

  const state = externalState || internalState;
  const dispatch = externalDispatch || internalDispatch;

  const lastEmittedCalendar = useRef<GenericCalendarData>(calendar);

  // Sync internal state when external calendar prop changes
  useEffect(() => {
    if (!externalState && calendar !== lastEmittedCalendar.current) {
      internalDispatch({ type: 'SET_CALENDAR', calendar });
      lastEmittedCalendar.current = calendar;
    }
  }, [calendar, externalState]);

  const dispatchAndNotify = (action: CalendarStructureAction) => {
    if (externalDispatch) {
      externalDispatch(action);
    } else {
      const nextState = calendarStructureReducer(internalState, action);
      internalDispatch(action);
      lastEmittedCalendar.current = nextState.calendar;
      onChange(nextState.calendar);
    }
  };

  // Today Alignment inputs
  const [alignYear, setAlignYear] = useState<number>(state.calendar.startYear ?? 1500);
  const [alignMonth, setAlignMonth] = useState<number>(1);
  const [alignDay, setAlignDay] = useState<number>(1);
  const [alignIsOffDay, setAlignIsOffDay] = useState<boolean>(false);
  const [alignOffDayIndex, setAlignOffDayIndex] = useState<number>(1);
  const [alignWeekdayIdx, setAlignWeekdayIdx] = useState<number>(0);

  // Sync alignment defaults from current calendar
  useEffect(() => {
    if (currentEpochDay !== undefined) {
      try {
        const proj = epochToDate(state.calendar, currentEpochDay);
        setAlignYear(proj.year);
        setAlignMonth(proj.month);
        setAlignDay(proj.day);
        setAlignIsOffDay(proj.isOffDay);
        setAlignOffDayIndex(proj.offDayIndex || 1);
        const w = weekdayOf(state.calendar, currentEpochDay);
        setAlignWeekdayIdx(w.index);
      } catch {}
    }
  }, [state.calendar.id, currentEpochDay]);

  const handleApplyTodayAlignment = () => {
    if (currentEpochDay === undefined) return;
    dispatchAndNotify({
      type: 'CALCULATE_ANCHOR_FROM_TODAY',
      targetEpochDay: currentEpochDay,
      todayYear: alignYear,
      todayMonthOrOffDay: alignIsOffDay
        ? { isOffDay: true, offDayIndex: alignOffDayIndex }
        : { isOffDay: false, month: alignMonth, day: alignDay },
      todayWeekdayIndex: alignWeekdayIdx
    });
  };

  // Calculate current date projection for preview if currentEpochDay is defined
  const currentProj = currentEpochDay !== undefined ? epochToDate(state.calendar, currentEpochDay) : null;
  const currentWeekday = currentEpochDay !== undefined ? weekdayOf(state.calendar, currentEpochDay) : null;
  const currentMonthName = currentProj
    ? (currentProj.isOffDay
        ? (state.calendar.offDays?.[(currentProj.offDayIndex || 1) - 1]?.name || 'روز برون‌گاه')
        : (state.calendar.months?.[currentProj.month - 1]?.name || `ماه ${currentProj.month}`))
    : '';

  return (
    <div className="space-y-4 text-start" dir="rtl">
      {/* Validation Errors Box */}
      {!state.validation.valid && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <span>خطاهای اعتبارسنجی ساختار گاه‌شمار:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-text-primary">
            {state.validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 1: Basic Info (Optional) */}
      {!hideBasicInfo && (
        <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
          <h4 className="text-xs font-bold text-text-primary">مشخصات هویتی گاه‌شمار</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                <span>نام گاه‌شمار *</span>
                {!state.calendar.name?.trim() && (
                  <span className="text-danger text-[11px] ms-1.5 font-bold">الزامی است</span>
                )}
              </label>
              <Input
                noWrapper
                disabled={!isDm}
                value={state.calendar.name || ''}
                onChange={e => dispatchAndNotify({ type: 'UPDATE_BASIC', name: e.target.value })}
                className={`w-full bg-bg border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px] ${
                  !state.calendar.name?.trim() ? 'border-danger ring-1 ring-danger/30' : 'border-border'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">برچسب دوره (Era)</label>
              <Input
                noWrapper
                disabled={!isDm}
                value={state.calendar.eraLabel || ''}
                onChange={e => dispatchAndNotify({ type: 'UPDATE_BASIC', eraLabel: e.target.value })}
                placeholder="مثلاً: پ.ر.ن، هجری، سال خورشید"
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">سال آغازین لنگر (Start Year)</label>
              <Input
                noWrapper
                type="number"
                disabled={!isDm}
                value={state.calendar.startYear ?? 1500}
                onChange={e => dispatchAndNotify({ type: 'UPDATE_BASIC', startYear: Number(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
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
      )}

      {/* Structure Change Preview & Today Preservation */}
      {state.isDirty && isDm && initialProjectedDate && currentProj && currentWeekday && (
        <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-accent-hover flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-hover" />
              <span>پیش‌نمایش تاریخ امروز کمپین پس از تغییر ساختار</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent/20 text-accent-hover font-bold">
              روز مطلق کمپین: {currentEpochDay}
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            با تغییر ساختار گاه‌شمار (تعداد ماه‌ها یا طول سال)، تاریخ متناظر با روز مطلق جاری ({currentEpochDay}) تغییر می‌کند. روز مطلق هرگز تغییر نمی‌کند.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2 border border-border space-y-1">
              <span className="text-text-muted text-[11px] block">تاریخ پیشین در این روز مطلق:</span>
              <div className="font-bold text-text-primary">
                {initialProjectedDate.isOffDay ? (
                  `${initialProjectedDate.monthName}، سال ${initialProjectedDate.year} (${initialProjectedDate.weekdayName})`
                ) : (
                  `${initialProjectedDate.day} ${initialProjectedDate.monthName}، سال ${initialProjectedDate.year} (${initialProjectedDate.weekdayName})`
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-2 border border-border space-y-1">
              <span className="text-text-muted text-[11px] block">تاریخ جدید محاسباتی با ساختار فعلی:</span>
              <div className="font-bold text-accent-hover">
                {currentProj.isOffDay ? (
                  `${currentMonthName}، سال ${currentProj.year} (${currentWeekday.name})`
                ) : (
                  `${currentProj.day} ${currentMonthName}، سال ${currentProj.year} (${currentWeekday.name})`
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-accent/20">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                dispatchAndNotify({
                  type: 'PRESERVE_TODAY_DATE_ACROSS_STRUCTURE_CHANGE',
                  previousEpochDay: currentEpochDay || 0,
                  previousDate: {
                    year: initialProjectedDate.year,
                    month: initialProjectedDate.month,
                    day: initialProjectedDate.day,
                    isOffDay: initialProjectedDate.isOffDay,
                    offDayIndex: initialProjectedDate.offDayIndex,
                    weekdayIndex: initialProjectedDate.weekdayIndex
                  }
                });
              }}
              className="bg-accent/20 hover:bg-accent/30 text-accent-hover border border-accent/40 text-xs font-bold"
            >
              حفظ تاریخ امروز (محاسبه مجدد لنگر)
            </Button>
            <span className="text-[11px] text-text-muted">
              یا بدون کلیک: لنگر حفظ می‌شود و تاریخ‌ها به طور طبیعی شیفت می‌یابند.
            </span>
          </div>
        </div>
      )}

      {/* Section: Today in this Calendar (Anchor Calculation) */}
      {showTodayAlignment && currentEpochDay !== undefined && (
        <div className="p-3.5 rounded-xl color-info/40 border border-border space-y-3">
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
      )}

      {/* Section 2: Weekdays */}
      <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-primary">روزهای هفته ({state.weekLength} روز)</span>
          {isDm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatchAndNotify({ type: 'ADD_WEEKDAY', name: `روز ${state.weekLength + 1}` })}
              className="text-xs text-accent-hover flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>افزودن روز هفته</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(!state.calendar.weekdays || state.calendar.weekdays.length === 0) && (
            <p className="text-xs text-text-muted italic col-span-full">این گاه‌شمار فاقد روز هفته است.</p>
          )}
          {(state.calendar.weekdays || []).map((w, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-bg border border-border flex items-center justify-between gap-2">
              <Input
                noWrapper
                disabled={!isDm}
                value={w}
                onChange={e => dispatchAndNotify({ type: 'UPDATE_WEEKDAY', index: idx, name: e.target.value })}
                className="w-full bg-transparent border-0 text-xs text-text-primary p-0 focus:outline-none"
              />
              {isDm && state.weekLength > 1 && (
                <button
                  type="button"
                  aria-label="حذف روز هفته"
                  onClick={() => dispatchAndNotify({ type: 'REMOVE_WEEKDAY', index: idx })}
                  className="text-text-muted hover:text-danger min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg touch-target"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Months */}
      <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-primary">ماه‌های سال ({state.calendar.months.length} ماه)</span>
          {isDm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatchAndNotify({
                type: 'ADD_MONTH',
                month: { name: `ماه ${state.calendar.months.length + 1}`, days: 30 }
              })}
              className="text-xs text-accent-hover flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>افزودن ماه</span>
            </Button>
          )}
        </div>

        {state.calendar.months.length === 0 ? (
          <p className="text-xs text-text-muted italic">هیچ ماهی تعریف نشده است. از دکمه «افزودن ماه» استفاده کنید.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto p-1 scrollbar-none">
            {state.calendar.months.map((m, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-xs font-bold text-text-muted w-5 shrink-0">{idx + 1}</span>
                <Input
                  noWrapper
                  disabled={!isDm}
                  value={m.name}
                  onChange={e => dispatchAndNotify({ type: 'UPDATE_MONTH', index: idx, month: { name: e.target.value } })}
                  placeholder="نام ماه"
                  className={`flex-1 bg-surface-2 border rounded-lg px-2.5 py-1.5 text-xs text-text-primary min-h-[44px] min-w-40 ${
                    !m.name?.trim() ? 'border-danger ring-1 ring-danger/30' : 'border-border'
                  }`}
                />
                <Input
                  noWrapper
                  type="number"
                  disabled={!isDm}
                  value={m.days}
                  onChange={e => dispatchAndNotify({ type: 'UPDATE_MONTH', index: idx, month: { days: Number(e.target.value) } })}
                  className="w-16 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary
                   text-center min-h-[44px] min-w-20"
                />
                <span className="text-xs text-text-muted">روز</span>
                <Input
                  noWrapper
                  disabled={!isDm}
                  value={m.season || ''}
                  onChange={e => dispatchAndNotify({ type: 'UPDATE_MONTH', index: idx, month: { season: e.target.value } })}
                  placeholder="فصل (اختیاری)"
                  className="w-24 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary min-h-[44px]"
                />
              </div>

              {isDm && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="انتقال به بالا"
                    disabled={idx === 0}
                    onClick={() => dispatchAndNotify({ type: 'MOVE_MONTH', fromIndex: idx, toIndex: idx - 1 })}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 active:bg-surface-3 disabled:opacity-30 transition touch-target"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="انتقال به پایین"
                    disabled={idx === state.calendar.months.length - 1}
                    onClick={() => dispatchAndNotify({ type: 'MOVE_MONTH', fromIndex: idx, toIndex: idx + 1 })}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 active:bg-surface-3 disabled:opacity-30 transition touch-target"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {state.calendar.months.length > 1 && (
                    <button
                      type="button"
                      aria-label="حذف ماه"
                      onClick={() => dispatchAndNotify({ type: 'REMOVE_MONTH', index: idx })}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 active:bg-danger/20 transition touch-target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Section 4: Off-Days */}
      <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-text-primary">
            روزهای برون‌گاه / خارج از ماه ({state.calendar.offDays?.length || 0})
          </span>
          {isDm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatchAndNotify({
                type: 'ADD_OFF_DAY',
                offDay: { name: `روز برون‌گاه ${(state.calendar.offDays?.length || 0) + 1}` }
              })}
              className="text-xs text-accent-hover flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>افزودن روز خارج از ماه</span>
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
                    onChange={e => dispatchAndNotify({ type: 'UPDATE_OFF_DAY', index: idx, offDay: { name: e.target.value } })}
                    placeholder="نام روز برون‌گاه"
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5
                     text-xs text-text-primary min-h-[44px] "
                  />
                  <Input
                    noWrapper
                    disabled={!isDm}
                    value={od.folkBelief || od.note || ''}
                    onChange={e => dispatchAndNotify({ type: 'UPDATE_OFF_DAY', index: idx, offDay: { folkBelief: e.target.value } })}
                    placeholder="باور اسطوره‌ای یا یادداشت"
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs
                     text-text-primary min-h-[44px] min-w-80"
                  />
                </div>

                {isDm && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="انتقال به بالا"
                      disabled={idx === 0}
                      onClick={() => dispatchAndNotify({ type: 'MOVE_OFF_DAY', fromIndex: idx, toIndex: idx - 1 })}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 active:bg-surface-3 disabled:opacity-30 transition touch-target"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="انتقال به پایین"
                      disabled={idx === (state.calendar.offDays?.length || 1) - 1}
                      onClick={() => dispatchAndNotify({ type: 'MOVE_OFF_DAY', fromIndex: idx, toIndex: idx + 1 })}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 active:bg-surface-3 disabled:opacity-30 transition touch-target"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="حذف روز برون‌گاه"
                      onClick={() => dispatchAndNotify({ type: 'REMOVE_OFF_DAY', index: idx })}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 active:bg-danger/20 transition touch-target"
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
    </div>
  );
};
