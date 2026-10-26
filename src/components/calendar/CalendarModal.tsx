import React, { useState } from 'react';
import { WorldCalendar } from '../../types';
import { CALENDAR_MONTHS, CALENDAR_OFF_DAYS, formatWorldDate } from '../../data/calendar';
import { BottomSheet } from '../mobile/BottomSheet';
import { Calendar as CalendarIcon, Sparkles, ChevronRight, FastForward, Clock, BookOpen, AlertCircle } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: WorldCalendar;
  isDm: boolean;
  onAdvanceDays: (days: number) => Promise<void>;
  onUpdateCalendar: (updated: Partial<WorldCalendar>) => Promise<void>;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  calendar,
  isDm,
  onAdvanceDays,
  onUpdateCalendar,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(calendar.month);
  const [advancing, setAdvancing] = useState(false);

  const currentMonthDef = CALENDAR_MONTHS.find(m => m.id === calendar.month);
  const currentOffDayDef = calendar.isOffDay && calendar.offDayIndex 
    ? CALENDAR_OFF_DAYS.find(o => o.id === calendar.offDayIndex)
    : null;

  const handleAdvance = async (days: number) => {
    setAdvancing(true);
    try {
      await onAdvanceDays(days);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="تقویم باستانی زروانیا"
      subtitle={`سال ${calendar.year} پ.ر.ن. (پیش از روشنایی نو)`}
    >
      <div className="space-y-4 text-slate-200">
        {/* Current Date Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#181c28] to-[#141824] border border-amber-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>زمان جاری در جهان زروانیا</span>
          </div>
          <div className="text-lg font-black text-amber-100">
            {formatWorldDate(calendar)}
          </div>
          {calendar.currentFestival && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{calendar.currentFestival}</span>
            </div>
          )}
        </div>

        {/* Off-Day folk belief note */}
        {currentOffDayDef && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-purple-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>روز برون‌گاه: {currentOffDayDef.name}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{currentOffDayDef.folkBelief}</p>
          </div>
        )}

        {/* DM Controls: Advance Time */}
        {isDm && (
          <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-700/80 space-y-2.5">
            <span className="text-xs font-bold text-amber-300 block">پیشبرد زمان توسط دانجن مستر:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(1)}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 active:text-slate-950 text-xs font-bold text-slate-200 transition border border-slate-700 flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <span>+۱ روز</span>
              </button>
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(7)}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 active:text-slate-950 text-xs font-bold text-slate-200 transition border border-slate-700 flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <span>+۷ روز (۱ هفته)</span>
              </button>
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(30)}
                className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 shrink-0" />
                <span>+۱ ماه (۳۰ روز)</span>
              </button>
            </div>
          </div>
        )}

        {/* 12 Months & Festivals Overview */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>ماه‌های ۱۲گانه و جشن‌های آغاز ماه (۳۰ روزه)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-none">
            {CALENDAR_MONTHS.map(m => {
              const isCurrent = !calendar.isOffDay && calendar.month === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-md'
                      : 'bg-[#141822] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black">{m.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">{m.season}</span>
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-1">
                    روز ۱: جشن {m.festival}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Off-Days of Vapasān */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>۵ روز برون‌گاه پس از ۳۰ واپسان (خارج از سال‌شمار)</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
            {CALENDAR_OFF_DAYS.map(off => (
              <div
                key={off.id}
                className="p-2.5 rounded-xl bg-[#141622] border border-purple-500/20 text-xs space-y-1"
              >
                <div className="font-bold text-purple-200">{off.name}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{off.folkBelief}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
