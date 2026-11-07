import React, { useState } from 'react';
import { WorldCalendar, CampaignTimeResponse, GenericCalendarData } from '../../types';
import { CALENDAR_MONTHS, CALENDAR_OFF_DAYS, formatWorldDate } from '../../data/calendar';
import { BottomSheet } from '../mobile/BottomSheet';
import { Sparkles, FastForward, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarStructureModal } from './CalendarStructureModal';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar?: WorldCalendar;
  isDm: boolean;
  onAdvanceDays?: (days: number) => Promise<void>;
  onUpdateCalendar?: (updated: Partial<WorldCalendar>) => Promise<void>;
  timeResponse?: CampaignTimeResponse;
  activeCalendar?: GenericCalendarData;
  onAdvanceCampaignTime?: (days: number) => Promise<void>;
  campaignId?: string;
  onOpenStructureEditor?: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  calendar,
  isDm,
  onAdvanceDays,
  onUpdateCalendar,
  timeResponse,
  activeCalendar,
  onAdvanceCampaignTime,
  campaignId,
  onOpenStructureEditor
}) => {
  const [internalStructureOpen, setInternalStructureOpen] = useState(false);
  const currentYear = timeResponse?.date?.year ?? calendar?.year ?? 1500;
  const currentMonth = timeResponse?.date?.month ?? calendar?.month ?? 1;
  const isOffDay = timeResponse?.date?.isOffDay ?? calendar?.isOffDay ?? false;
  const offDayIndex = timeResponse?.date?.offDayIndex ?? calendar?.offDayIndex ?? 0;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [advancing, setAdvancing] = useState(false);

  const handleOpenStructure = () => {
    if (onOpenStructureEditor) {
      onOpenStructureEditor();
    } else {
      setInternalStructureOpen(true);
    }
  };

  const title = activeCalendar?.name || "تقویم باستانی زروانیا";
  const eraLabel = activeCalendar?.eraLabel || "پ.ر.ن. (پیش از روشنایی نو)";
  const subtitle = `سال ${currentYear} ${eraLabel}`;
  const formattedDate = timeResponse?.formattedDate ?? (calendar ? formatWorldDate(calendar) : '');
  const activeFestival = timeResponse?.activeFestivals?.[0]?.name || calendar?.currentFestival;

  const currentOffDayDef = isOffDay && offDayIndex 
    ? (activeCalendar?.offDays?.find((_, idx) => (idx + 1) === offDayIndex) || CALENDAR_OFF_DAYS.find(o => o.id === offDayIndex))
    : null;

  const handleAdvance = async (days: number) => {
    setAdvancing(true);
    try {
      if (onAdvanceCampaignTime) {
        await onAdvanceCampaignTime(days);
      } else if (onAdvanceDays) {
        await onAdvanceDays(days);
      }
    } finally {
      setAdvancing(false);
    }
  };

  const displayMonths = activeCalendar?.months?.length
    ? activeCalendar.months.map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        season: m.season || 'فصل',
        festival: activeCalendar.festivals?.find(f => f.monthIndex === (idx + 1) && (f.day === 1 || !f.day))?.name || 'جشن آغاز ماه'
      }))
    : CALENDAR_MONTHS;

  const displayOffDays = activeCalendar?.offDays?.length
    ? activeCalendar.offDays.map((o, idx) => ({
        id: idx + 1,
        name: o.name,
        folkBelief: o.folkBelief || o.note || 'روز ویژه بیرون از گاه‌شمار'
      }))
    : CALENDAR_OFF_DAYS;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-4 text-text-primary">
        {/* Current Date Banner */}
        <div className="p-4 rounded-2xl color-info-rgb border border-accent/40 shadow-lg">
          <div className="flex items-center gap-2 text-accent-hover text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-accent-hover shrink-0" />
            <span>زمان جاری در جهان زروانیا</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-lg font-black text-accent-hover">
              {formattedDate}
            </div>
            {isDm && (onOpenStructureEditor || campaignId) && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenStructure}
                className="bg-accent/20 hover:bg-accent/30 text-accent-hover border border-accent/40 text-xs font-bold flex items-center gap-1.5"
              >
                <span>ویرایش تقویم‌ها</span>
              </Button>
            )}
          </div>
          {activeFestival && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent/20 border border-accent/50 text-accent-hover text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-accent-hover shrink-0" />
              <span>{activeFestival}</span>
            </div>
          )}
        </div>

        {/* Off-Day folk belief note */}
        {currentOffDayDef && (
          <div className="p-3.5 rounded-xl bg-role-codm/15 border border-role-codm/40 text-role-codm text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-role-codm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>روز برون‌گاه: {currentOffDayDef.name}</span>
            </div>
            <p className="text-text-primary leading-relaxed">{currentOffDayDef.folkBelief}</p>
          </div>
        )}

        {/* DM Controls: Advance Time */}
        {isDm && (
          <div className="p-3.5 rounded-xl color-info border border-border-strong/80 space-y-2.5">
            <span className="text-xs font-bold text-accent-hover block">پیشبرد زمان توسط دانجن مستر:</span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(1)}
                className="py-2.5 px-2 rounded-xl bg-surface-2 hover:bg-surface-2 active:bg-warning active:text-on-accent text-xs font-bold text-text-primary transition border border-border-strong flex items-center justify-center gap-1 touch-target min-w-[44px] cursor-pointer"
              >
                <span>+1 روز</span>
              </Button>
              <Button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(7)}
                className="py-2.5 px-2 rounded-xl bg-surface-2 hover:bg-surface-2 active:bg-warning active:text-on-accent text-xs font-bold text-text-primary transition border border-border-strong flex items-center justify-center gap-1 touch-target min-w-[44px] cursor-pointer"
              >
                <span>+7 روز (1 هفته)</span>
              </Button>
              <Button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvance(30)}
                className="py-2.5 px-2 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-xs font-bold text-accent-hover transition flex items-center justify-center gap-1 touch-target min-w-[44px] cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 shrink-0" />
                <span>+1 ماه (30 روز)</span>
              </Button>
            </div>
          </div>
        )}

        {/* 12 Months & Festivals Overview */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-text-muted flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-accent-hover shrink-0" />
            <span>ماه‌های 12گانه و جشن‌های آغاز ماه (30 روزه)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-none">
            {displayMonths.map(m => {
              const isCurrent = !isOffDay && currentMonth === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    isCurrent
                      ? 'bg-accent/20 border-accent text-accent-hover font-bold shadow-md'
                      : 'color-info border-border text-text-primary'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black">{m.name}</span>
                    <span className="text-xs px-1 py-0.2 rounded bg-surface-2 text-text-muted">{m.season}</span>
                  </div>
                  <div className="text-xs text-accent-hover/80 mt-1">
                    روز 1: جشن {m.festival}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Off-Days of Vapasān */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-role-codm flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-role-codm shrink-0" />
            <span>5 روز برون‌گاه پس از 30 واپسان (خارج از سال‌شمار)</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
            {displayOffDays.map(off => (
              <div
                key={off.id}
                className="p-2.5 rounded-xl color-info border border-role-codm/20 text-xs space-y-1"
              >
                <div className="font-bold text-role-codm">{off.name}</div>
                <div className="text-xs text-text-muted leading-relaxed">{off.folkBelief}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>

    {internalStructureOpen && campaignId && (
      <CalendarStructureModal
        isOpen={internalStructureOpen}
        onClose={() => setInternalStructureOpen(false)}
        campaignId={campaignId}
        userRole="owner"
        onSaved={() => {
          // If onUpdateCalendar was provided, caller can reload
        }}
      />
    )}
  </>
  );
};
