import type { GenericCalendarData, CalendarMonth, CalendarOffDay } from '../../src/types';
import { validateCalendar, daysInCalendarYear, weekdayOf, epochToDate, dateToEpoch } from './calendar';

export type CalendarStructureAction =
  | { type: 'SET_CALENDAR'; calendar: GenericCalendarData }
  | { type: 'UPDATE_BASIC'; name?: string; eraLabel?: string; startYear?: number }
  | { type: 'ADD_MONTH'; month: CalendarMonth; atIndex?: number }
  | { type: 'UPDATE_MONTH'; index: number; month: Partial<CalendarMonth> }
  | { type: 'REMOVE_MONTH'; index: number }
  | { type: 'MOVE_MONTH'; fromIndex: number; toIndex: number }
  | { type: 'ADD_OFF_DAY'; offDay: CalendarOffDay; atIndex?: number }
  | { type: 'UPDATE_OFF_DAY'; index: number; offDay: Partial<CalendarOffDay> }
  | { type: 'REMOVE_OFF_DAY'; index: number }
  | { type: 'MOVE_OFF_DAY'; fromIndex: number; toIndex: number }
  | { type: 'SET_WEEKDAYS'; weekdays: string[] }
  | { type: 'ADD_WEEKDAY'; name: string; atIndex?: number }
  | { type: 'UPDATE_WEEKDAY'; index: number; name: string }
  | { type: 'REMOVE_WEEKDAY'; index: number }
  | { type: 'MOVE_WEEKDAY'; fromIndex: number; toIndex: number }
  | { type: 'SET_ANCHOR_WEEKDAY_INDEX'; weekdayIndex: number }
  | {
      type: 'CALCULATE_ANCHOR_FROM_TODAY';
      targetEpochDay: number;
      todayYear: number;
      todayMonthOrOffDay: { isOffDay: boolean; month?: number; day?: number; offDayIndex?: number };
      todayWeekdayIndex: number;
    }
  | {
      type: 'PRESERVE_TODAY_DATE_ACROSS_STRUCTURE_CHANGE';
      previousEpochDay: number;
      previousDate: { year: number; month: number; day: number; isOffDay: boolean; offDayIndex?: number; weekdayIndex?: number };
    };

export interface CalendarStructureState {
  calendar: GenericCalendarData;
  validation: { valid: boolean; errors: string[] };
  isDirty: boolean;
  totalDaysInYear: number;
  weekLength: number;
}

/**
 * Pure helper to compute days in a calendar year without mutating state
 */
export function computeTotalYearDays(cal: GenericCalendarData): number {
  return daysInCalendarYear(cal);
}

/**
 * Calculates anchor.weekdayIndex and startYear adjustment so that a specific epochDay corresponds
 * exactly to the specified date and weekday in this calendar.
 */
export function calculateAnchorFromToday(
  calendar: GenericCalendarData,
  targetEpochDay: number,
  todayYear: number,
  todayDate: { isOffDay: boolean; month?: number; day?: number; offDayIndex?: number },
  todayWeekdayIndex: number
): { weekdayIndex: number; startYear: number } {
  const weekLength = Math.max(1, calendar.weekdays?.length || 7);
  // Calculate day-of-year for today in this calendar
  let dayInYear = 0;
  if (todayDate.isOffDay) {
    const totalMonthDays = (calendar.months || []).reduce((acc, m) => acc + (m.days || 0), 0);
    const offIdx = Math.max(0, (todayDate.offDayIndex ?? 1) - 1);
    dayInYear = totalMonthDays + offIdx;
  } else {
    const mIdx = Math.max(0, (todayDate.month ?? 1) - 1);
    for (let i = 0; i < mIdx; i++) {
      dayInYear += calendar.months[i]?.days || 0;
    }
    dayInYear += Math.max(0, (todayDate.day ?? 1) - 1);
  }

  // Desired: (targetEpochDay + offset) % yearDays corresponds to dayInYear
  // With startYear:
  // epochDay = (year - startYear) * yearDays + dayInYear
  // Therefore: (todayYear - startYear) * yearDays + dayInYear = targetEpochDay
  const yearDays = Math.max(1, computeTotalYearDays(calendar));
  // dateToEpoch formula:
  // epochDay = (date.year - startYear) * daysInYear + targetDayOfYear
  // We want: targetEpochDay = (todayYear - startYear) * yearDays + dayInYear
  // (todayYear - startYear) * yearDays = targetEpochDay - dayInYear
  // Therefore:
  // startYear = todayYear - Math.floor((targetEpochDay - dayInYear) / yearDays);
  // And to ensure the remainder day matches:
  // In epochToDate(cal, targetEpochDay):
  // yearOffset = Math.floor(targetEpochDay / yearDays);
  // dayOfYear = targetEpochDay % yearDays;
  // year = startYear + yearOffset;
  // We need dayOfYear === dayInYear, which means targetEpochDay % yearDays === dayInYear.
  // If targetEpochDay does not fall on dayInYear modulo yearDays, we set startYear based on targetEpochDay - dayInYear:
  const calculatedStartYear = Math.round(todayYear - (targetEpochDay - dayInYear) / yearDays);

  // Weekday in calendar.ts:
  // raw = ((epochDay + anchor.weekdayIndex) % W + W) % W
  // We want raw === todayWeekdayIndex when epochDay === targetEpochDay
  // (targetEpochDay + anchor.weekdayIndex) = todayWeekdayIndex (mod W)
  // anchor.weekdayIndex = (todayWeekdayIndex - targetEpochDay) (mod W)
  const calculatedAnchorWeekday = ((todayWeekdayIndex - targetEpochDay) % weekLength + weekLength) % weekLength;

  return {
    weekdayIndex: calculatedAnchorWeekday,
    startYear: calculatedStartYear
  };
}

/**
 * Creates initial state from a GenericCalendarData object.
 */
export function initCalendarStructureState(calendar: GenericCalendarData): CalendarStructureState {
  const calCopy: GenericCalendarData = JSON.parse(JSON.stringify(calendar));
  if (!calCopy.weekdays || calCopy.weekdays.length === 0) {
    calCopy.weekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  }
  if (!calCopy.months) calCopy.months = [];
  if (!calCopy.offDays) calCopy.offDays = [];
  if (!calCopy.festivals) calCopy.festivals = [];
  if (!calCopy.anchor) calCopy.anchor = { weekdayIndex: 0 };

  const validation = validateCalendar(calCopy);
  return {
    calendar: calCopy,
    validation,
    isDirty: false,
    totalDaysInYear: computeTotalYearDays(calCopy),
    weekLength: calCopy.weekdays.length
  };
}

/**
 * Pure reducer function for calendar structure modifications.
 */
export function calendarStructureReducer(
  state: CalendarStructureState,
  action: CalendarStructureAction
): CalendarStructureState {
  let nextCal: GenericCalendarData = JSON.parse(JSON.stringify(state.calendar));

  switch (action.type) {
    case 'SET_CALENDAR': {
      return initCalendarStructureState(action.calendar);
    }

    case 'UPDATE_BASIC': {
      if (action.name !== undefined) nextCal.name = action.name;
      if (action.eraLabel !== undefined) nextCal.eraLabel = action.eraLabel;
      if (action.startYear !== undefined) nextCal.startYear = action.startYear;
      break;
    }

    case 'ADD_MONTH': {
      const idx = action.atIndex !== undefined ? Math.max(0, Math.min(action.atIndex, nextCal.months.length)) : nextCal.months.length;
      nextCal.months.splice(idx, 0, {
        name: action.month.name || `ماه ${nextCal.months.length + 1}`,
        days: Math.max(1, Number(action.month.days) || 30),
        season: action.month.season || ''
      });
      break;
    }

    case 'UPDATE_MONTH': {
      if (action.index >= 0 && action.index < nextCal.months.length) {
        const cur = nextCal.months[action.index];
        nextCal.months[action.index] = {
          ...cur,
          ...action.month,
          days: action.month.days !== undefined ? Math.max(1, Number(action.month.days)) : cur.days
        };
      }
      break;
    }

    case 'REMOVE_MONTH': {
      if (nextCal.months.length > 1 && action.index >= 0 && action.index < nextCal.months.length) {
        nextCal.months.splice(action.index, 1);
      }
      break;
    }

    case 'MOVE_MONTH': {
      const { fromIndex, toIndex } = action;
      if (
        fromIndex >= 0 && fromIndex < nextCal.months.length &&
        toIndex >= 0 && toIndex < nextCal.months.length &&
        fromIndex !== toIndex
      ) {
        const [moved] = nextCal.months.splice(fromIndex, 1);
        nextCal.months.splice(toIndex, 0, moved);
      }
      break;
    }

    case 'ADD_OFF_DAY': {
      const idx = action.atIndex !== undefined ? Math.max(0, Math.min(action.atIndex, nextCal.offDays?.length || 0)) : (nextCal.offDays?.length || 0);
      const newOffDay: CalendarOffDay = {
        id: action.offDay.id || `off-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        name: action.offDay.name || `روز برون‌گاه ${(nextCal.offDays?.length || 0) + 1}`,
        folkBelief: action.offDay.folkBelief || action.offDay.note || ''
      };
      if (!nextCal.offDays) nextCal.offDays = [];
      nextCal.offDays.splice(idx, 0, newOffDay);
      break;
    }

    case 'UPDATE_OFF_DAY': {
      if (nextCal.offDays && action.index >= 0 && action.index < nextCal.offDays.length) {
        nextCal.offDays[action.index] = {
          ...nextCal.offDays[action.index],
          ...action.offDay
        };
      }
      break;
    }

    case 'REMOVE_OFF_DAY': {
      if (nextCal.offDays && action.index >= 0 && action.index < nextCal.offDays.length) {
        nextCal.offDays.splice(action.index, 1);
      }
      break;
    }

    case 'MOVE_OFF_DAY': {
      const { fromIndex, toIndex } = action;
      if (
        nextCal.offDays &&
        fromIndex >= 0 && fromIndex < nextCal.offDays.length &&
        toIndex >= 0 && toIndex < nextCal.offDays.length &&
        fromIndex !== toIndex
      ) {
        const [moved] = nextCal.offDays.splice(fromIndex, 1);
        nextCal.offDays.splice(toIndex, 0, moved);
      }
      break;
    }

    case 'SET_WEEKDAYS': {
      if (Array.isArray(action.weekdays) && action.weekdays.length > 0) {
        nextCal.weekdays = [...action.weekdays];
        const maxIdx = Math.max(0, nextCal.weekdays.length - 1);
        if ((nextCal.anchor?.weekdayIndex ?? 0) > maxIdx) {
          nextCal.anchor = { ...nextCal.anchor, weekdayIndex: 0 };
        }
      }
      break;
    }

    case 'ADD_WEEKDAY': {
      const idx = action.atIndex !== undefined ? Math.max(0, Math.min(action.atIndex, nextCal.weekdays?.length || 0)) : (nextCal.weekdays?.length || 0);
      if (!nextCal.weekdays) nextCal.weekdays = [];
      nextCal.weekdays.splice(idx, 0, action.name.trim() || `روز ${nextCal.weekdays.length + 1}`);
      break;
    }

    case 'UPDATE_WEEKDAY': {
      if (nextCal.weekdays && action.index >= 0 && action.index < nextCal.weekdays.length) {
        nextCal.weekdays[action.index] = action.name;
      }
      break;
    }

    case 'REMOVE_WEEKDAY': {
      if (nextCal.weekdays && nextCal.weekdays.length > 1 && action.index >= 0 && action.index < nextCal.weekdays.length) {
        nextCal.weekdays.splice(action.index, 1);
        const maxIdx = nextCal.weekdays.length - 1;
        if ((nextCal.anchor?.weekdayIndex ?? 0) > maxIdx) {
          nextCal.anchor = { ...nextCal.anchor, weekdayIndex: 0 };
        }
      }
      break;
    }

    case 'MOVE_WEEKDAY': {
      const { fromIndex, toIndex } = action;
      if (
        nextCal.weekdays &&
        fromIndex >= 0 && fromIndex < nextCal.weekdays.length &&
        toIndex >= 0 && toIndex < nextCal.weekdays.length &&
        fromIndex !== toIndex
      ) {
        const [moved] = nextCal.weekdays.splice(fromIndex, 1);
        nextCal.weekdays.splice(toIndex, 0, moved);
      }
      break;
    }

    case 'SET_ANCHOR_WEEKDAY_INDEX': {
      const maxIdx = Math.max(0, (nextCal.weekdays?.length || 7) - 1);
      const val = Math.max(0, Math.min(action.weekdayIndex, maxIdx));
      nextCal.anchor = { ...nextCal.anchor, weekdayIndex: val };
      break;
    }

    case 'CALCULATE_ANCHOR_FROM_TODAY': {
      const { targetEpochDay, todayYear, todayMonthOrOffDay, todayWeekdayIndex } = action;
      const computed = calculateAnchorFromToday(
        nextCal,
        targetEpochDay,
        todayYear,
        todayMonthOrOffDay,
        todayWeekdayIndex
      );
      nextCal.startYear = computed.startYear;
      nextCal.anchor = {
        ...nextCal.anchor,
        weekdayIndex: computed.weekdayIndex
      };
      break;
    }

    case 'PRESERVE_TODAY_DATE_ACROSS_STRUCTURE_CHANGE': {
      const { previousEpochDay, previousDate } = action;
      const todayWeekdayIdx = previousDate.weekdayIndex ?? (nextCal.anchor?.weekdayIndex ?? 0);
      const computed = calculateAnchorFromToday(
        nextCal,
        previousEpochDay,
        previousDate.year,
        {
          isOffDay: previousDate.isOffDay,
          month: previousDate.month,
          day: previousDate.day,
          offDayIndex: previousDate.offDayIndex
        },
        todayWeekdayIdx
      );
      nextCal.startYear = computed.startYear;
      nextCal.anchor = {
        ...nextCal.anchor,
        weekdayIndex: computed.weekdayIndex
      };
      break;
    }

    default:
      return state;
  }

  const validation = validateCalendar(nextCal);
  return {
    calendar: nextCal,
    validation,
    isDirty: true,
    totalDaysInYear: computeTotalYearDays(nextCal),
    weekLength: nextCal.weekdays?.length || 7
  };
}
