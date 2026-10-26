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
      <div className="space-y-4 text-[#EDE6D8]">
        {/* Current Date Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2A1A0D]/60 via-[#181c28] to-[#171513] border border-[#E0A030]/40 shadow-lg">
          <div className="flex items-center gap-2 text-[#F2C265] text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-[#F2C265] shrink-0" />
            <span>زمان جاری در جهان زروانیا</span>
          </div>
          <div className="text-lg font-black text-amber-100">
            {formatWorldDate(calendar)}
          </div>
          {calendar.currentFestival && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E0A030]/20 border border-[#E0A030]/50 text-[#F2C265] text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C265] shrink-0" />
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
            <p className="text-[#C9C0AE] leading-relaxed">{currentOffDayDef.folkBelief}</p>
          </div>
        )}

        {/* DM Controls: Advance Time */}
        {isDm && (
          <div className="p-3.5 rounded-xl bg-[#141822] border border-[#3A342B]/80 space-y-2.5">
            <span className="text-xs font-bold text-[#F2C265] block">پیشبرد زمان توسط دانجن مستر:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(1)}
                className="py-2.5 px-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] active:bg-[#C97B4A] active:text-[#0E0D0C] text-xs font-bold text-[#EDE6D8] transition border border-[#3A342B] flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <span>+۱ روز</span>
              </button>
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(7)}
                className="py-2.5 px-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] active:bg-[#C97B4A] active:text-[#0E0D0C] text-xs font-bold text-[#EDE6D8] transition border border-[#3A342B] flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <span>+۷ روز (۱ هفته)</span>
              </button>
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(30)}
                className="py-2.5 px-2 rounded-xl bg-[#E0A030]/20 hover:bg-[#E0A030]/30 border border-[#E0A030]/40 text-xs font-bold text-[#F2C265] transition flex items-center justify-center gap-1 touch-target cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 shrink-0" />
                <span>+۱ ماه (۳۰ روز)</span>
              </button>
            </div>
          </div>
        )}

        {/* 12 Months & Festivals Overview */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#A39A89] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#F2C265] shrink-0" />
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
                      ? 'bg-[#E0A030]/20 border-[#E0A030] text-[#F2C265] font-bold shadow-md'
                      : 'bg-[#141822] border-[#2F2A23] text-[#C9C0AE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black">{m.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#201D19] text-[#A39A89]">{m.season}</span>
                  </div>
                  <div className="text-[11px] text-[#F2C265]/80 mt-1">
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
                <div className="text-[11px] text-[#A39A89] leading-relaxed">{off.folkBelief}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
