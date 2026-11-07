import { describe, it, expect } from 'vitest';
import {
  calendarStructureReducer,
  initCalendarStructureState,
  calculateAnchorFromToday,
  computeTotalYearDays
} from './calendarStructureReducer';
import { TEMPLATE_SHAHROOZAN_ZORVANIA, TEMPLATE_SIMPLE_STARTER } from './calendarTemplates';
import { epochToDate, weekdayOf, dateToEpoch } from './calendar';

describe('Stage 2 Phase 2: calendarStructureReducer Pure Unit Tests', () => {
  it('1. Initializes valid state from template and calculates days in year and week length', () => {
    const state = initCalendarStructureState(TEMPLATE_SHAHROOZAN_ZORVANIA);
    expect(state.calendar.name).toBe('گاه‌شمار شاه‌روزان (زروانیا)');
    expect(state.isDirty).toBe(false);
    expect(state.validation.valid).toBe(true);
    expect(state.totalDaysInYear).toBe(365);
    expect(state.weekLength).toBe(7);
  });

  it('2. Supports adding, updating, removing, and moving months', () => {
    let state = initCalendarStructureState(TEMPLATE_SIMPLE_STARTER);
    expect(state.calendar.months).toHaveLength(12);

    // Add a 13th month
    state = calendarStructureReducer(state, {
      type: 'ADD_MONTH',
      month: { name: 'ماه سیزدهم', days: 25, season: 'فصل نو' }
    });
    expect(state.calendar.months).toHaveLength(13);
    expect(state.calendar.months[12].name).toBe('ماه سیزدهم');
    expect(state.calendar.months[12].days).toBe(25);
    expect(state.totalDaysInYear).toBe(12 * 30 + 25);
    expect(state.isDirty).toBe(true);

    // Update month days
    state = calendarStructureReducer(state, {
      type: 'UPDATE_MONTH',
      index: 0,
      month: { days: 32, name: 'فرورداد نو' }
    });
    expect(state.calendar.months[0].name).toBe('فرورداد نو');
    expect(state.calendar.months[0].days).toBe(32);

    // Move month 0 to index 2
    state = calendarStructureReducer(state, {
      type: 'MOVE_MONTH',
      fromIndex: 0,
      toIndex: 2
    });
    expect(state.calendar.months[2].name).toBe('فرورداد نو');

    // Remove month
    state = calendarStructureReducer(state, {
      type: 'REMOVE_MONTH',
      index: 12
    });
    expect(state.calendar.months).toHaveLength(12);
  });

  it('3. Enforces minimum month count (cannot delete the last month)', () => {
    let state = initCalendarStructureState({
      ...TEMPLATE_SIMPLE_STARTER,
      months: [{ name: 'تنها ماه', days: 30 }]
    });
    expect(state.calendar.months).toHaveLength(1);

    state = calendarStructureReducer(state, {
      type: 'REMOVE_MONTH',
      index: 0
    });
    expect(state.calendar.months).toHaveLength(1); // Not deleted!
  });

  it('4. Supports adding, updating, removing, and moving off-days', () => {
    let state = initCalendarStructureState(TEMPLATE_SIMPLE_STARTER);
    expect(state.calendar.offDays).toHaveLength(0);

    // Add off-day
    state = calendarStructureReducer(state, {
      type: 'ADD_OFF_DAY',
      offDay: { name: 'روز اعتدال', folkBelief: 'سکوت طبیعت' }
    });
    expect(state.calendar.offDays).toHaveLength(1);
    expect(state.calendar.offDays?.[0].name).toBe('روز اعتدال');
    expect(state.totalDaysInYear).toBe(361);

    // Add second off-day
    state = calendarStructureReducer(state, {
      type: 'ADD_OFF_DAY',
      offDay: { name: 'روز انقلاب تابستانی' }
    });
    expect(state.calendar.offDays).toHaveLength(2);

    // Move off-day
    state = calendarStructureReducer(state, {
      type: 'MOVE_OFF_DAY',
      fromIndex: 0,
      toIndex: 1
    });
    expect(state.calendar.offDays?.[1].name).toBe('روز اعتدال');

    // Remove off-day
    state = calendarStructureReducer(state, {
      type: 'REMOVE_OFF_DAY',
      index: 0
    });
    expect(state.calendar.offDays).toHaveLength(1);
    expect(state.calendar.offDays?.[0].name).toBe('روز اعتدال');
  });

  it('5. Supports customizing weekdays (week length 5, 7, or custom length) and auto-constrains anchor', () => {
    let state = initCalendarStructureState(TEMPLATE_SHAHROOZAN_ZORVANIA);
    expect(state.weekLength).toBe(7);

    // Set 5-day week
    state = calendarStructureReducer(state, {
      type: 'SET_WEEKDAYS',
      weekdays: ['آب', 'باد', 'خاک', 'آتش', 'اثیر']
    });
    expect(state.weekLength).toBe(5);
    expect(state.calendar.weekdays).toHaveLength(5);

    // Set anchor weekday index
    state = calendarStructureReducer(state, {
      type: 'SET_ANCHOR_WEEKDAY_INDEX',
      weekdayIndex: 3
    });
    expect(state.calendar.anchor?.weekdayIndex).toBe(3);

    // Remove weekday and verify anchor doesn't exceed new bounds
    state = calendarStructureReducer(state, {
      type: 'REMOVE_WEEKDAY',
      index: 4
    });
    expect(state.weekLength).toBe(4);
    expect(state.calendar.anchor?.weekdayIndex).toBeLessThanOrEqual(3);
  });

  it('6. Calculates anchor from today for syncing multiple calendars with different week lengths and off-days', () => {
    // Suppose the campaign is at absolute day 400
    const targetEpochDay = 400;

    // Calendar A: 12x30 + 5 off-days (365 days), 7-day week, start year 1500
    const cal = JSON.parse(JSON.stringify(TEMPLATE_SHAHROOZAN_ZORVANIA));

    // Desired: at epochDay 400, this calendar should read Year 1501, Month 2, Day 6, WeekdayIndex 0 (شنبه)
    const computed = calculateAnchorFromToday(
      cal,
      targetEpochDay,
      1501,
      { isOffDay: false, month: 2, day: 6 },
      0 // شنبه
    );

    cal.startYear = computed.startYear;
    cal.anchor = { weekdayIndex: computed.weekdayIndex };

    // Now test conversion with epochToDate:
    const projectedDate = epochToDate(cal, targetEpochDay);
    expect(projectedDate.year).toBe(1501);
    expect(projectedDate.month).toBe(2);
    expect(projectedDate.day).toBe(6);
    expect(projectedDate.isOffDay).toBe(false);

    const projectedWeekday = weekdayOf(cal, targetEpochDay);
    expect(projectedWeekday.name).toBe('شنبه');
  });

  it('7. Calculates anchor and startYear for date alignment under new calendar structure', () => {
    let state = initCalendarStructureState(TEMPLATE_SHAHROOZAN_ZORVANIA);
    // Suppose we want Day 0 of the calendar to correspond to Year 1500 Month 1 Day 1
    const targetEpoch = 0;
    const computed = calculateAnchorFromToday(
      state.calendar,
      targetEpoch,
      1500,
      { isOffDay: false, month: 1, day: 1 },
      0 // شنبه
    );
    state.calendar.startYear = computed.startYear;
    state.calendar.anchor = { weekdayIndex: computed.weekdayIndex };

    const dateAt0 = epochToDate(state.calendar, 0);
    expect(dateAt0.year).toBe(1500);
    expect(dateAt0.month).toBe(1);
    expect(dateAt0.day).toBe(1);
    expect(dateAt0.isOffDay).toBe(false);

    const weekdayAt0 = weekdayOf(state.calendar, 0);
    expect(weekdayAt0.name).toBe('شنبه');
  });

  it('8. Supports PRESERVE_TODAY_DATE_ACROSS_STRUCTURE_CHANGE when year length changes', () => {
    let state = initCalendarStructureState(TEMPLATE_SHAHROOZAN_ZORVANIA);
    const epoch = 250;
    const initialDate = epochToDate(state.calendar, epoch);
    const initialWeekday = weekdayOf(state.calendar, epoch);

    // DM alters calendar: adds a month (changing year length from 365 to 395)
    state = calendarStructureReducer(state, {
      type: 'ADD_MONTH',
      month: { name: 'ماه افزوده', days: 30 }
    });
    expect(state.totalDaysInYear).toBe(395);

    // Under the new structure without compensation, the date might shift.
    // DM chooses: Preserve today's date!
    state = calendarStructureReducer(state, {
      type: 'PRESERVE_TODAY_DATE_ACROSS_STRUCTURE_CHANGE',
      previousEpochDay: epoch,
      previousDate: {
        year: initialDate.year,
        month: initialDate.month,
        day: initialDate.day,
        isOffDay: initialDate.isOffDay,
        offDayIndex: initialDate.offDayIndex,
        weekdayIndex: initialWeekday.index
      }
    });

    // Verify today's date in this calendar still projects to the exact same date!
    const newDate = epochToDate(state.calendar, epoch);
    expect(newDate.year).toBe(initialDate.year);
    expect(newDate.month).toBe(initialDate.month);
    expect(newDate.day).toBe(initialDate.day);
    expect(newDate.isOffDay).toBe(initialDate.isOffDay);

    const newWeekday = weekdayOf(state.calendar, epoch);
    expect(newWeekday.index).toBe(initialWeekday.index);
  });
});
