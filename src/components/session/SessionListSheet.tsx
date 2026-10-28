import React, { useState } from 'react';
import { Session, Campaign, WorldCalendar, User, CampaignRole } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { 
  formatSessionDateTime, 
  displayInWorldDate, 
  partitionSessions, 
  canManageSessions 
} from '../../../shared/rules/sessionEngine';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle2, 
  HelpCircle, XCircle, Plus, Edit3, Trash2, UserCheck, 
  Hourglass, AlertCircle, Sparkles, BookOpen
} from 'lucide-react';

interface SessionListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  campaign: Campaign | null;
  calendar?: WorldCalendar | null;
  currentUser: User | null;
  userRole?: CampaignRole | 'dm' | null;
  onOpenCreateSession?: () => void;
  onEditSession?: (session: Session) => void;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onOpenAttendance?: (session: Session) => void;
  onOpenClosingSheet?: (session: Session) => void;
  onOpenRecapArchive?: () => void;
}

export const SessionListSheet: React.FC<SessionListSheetProps> = ({
  isOpen,
  onClose,
  sessions,
  campaign,
  calendar,
  currentUser,
  userRole,
  onOpenCreateSession,
  onEditSession,
  onDeleteSession,
  onOpenAttendance,
  onOpenClosingSheet,
  onOpenRecapArchive
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isDm = canManageSessions(userRole);
  const timezone = campaign?.settings?.timezone || 'Asia/Tehran';

  const { upcoming, past } = partitionSessions(sessions);
  const currentList = activeTab === 'upcoming' ? upcoming : past;

  const handleDelete = async (sid: string) => {
    if (!onDeleteSession || !window.confirm('آیا از حذف این جلسه اطمینان دارید؟ تمامی آرا و حضورها پاک خواهد شد.')) {
      return;
    }
    setDeletingId(sid);
    try {
      await onDeleteSession(sid);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30">تأیید شده</span>;
      case 'planned':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">برنامه‌ریزی</span>;
      case 'done':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">پایان‌یافته</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">لغو شده</span>;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="جلسات کمپین"
      subtitle={`مدیریت زمان، هماهنگی حضور و تاریخچه جلسات (${campaign?.name || ''})`}
      fullHeight
    >
      <div className="space-y-4 pb-20 text-right" dir="rtl">
        {/* Top Control Bar: Tabs & New Session Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex bg-[#12100E] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              پیش‌رو ({upcoming.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'past'
                  ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              گذشته ({past.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRecapArchive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecapArchive();
                }}
                className="px-3 py-2 rounded-xl bg-[#2A241C] hover:bg-[#3A3227] text-[#EDE6D8] text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[40px]"
                title="آرشیو خلاصه جلسات"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#E0A030]" />
                <span className="hidden sm:inline">آرشیو خلاصه‌ها</span>
              </button>
            )}

            {isDm && onOpenCreateSession && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateSession();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>جلسه جدید</span>
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {currentList.length === 0 ? (
          <div className="py-12 text-center text-[#8C8576] space-y-2">
            <CalendarIcon className="w-10 h-10 mx-auto text-[#8C8576]/50" />
            <p className="text-sm font-semibold">
              {activeTab === 'upcoming' ? 'جلسه پیش‌رویی ثبت نشده است.' : 'هنوز جلسه‌ای برگزار نشده است.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((s) => {
              const dt = s.scheduledAt ? formatSessionDateTime(s.scheduledAt, timezone) : null;
              const inWorldStr = displayInWorldDate(s.inWorldDate, calendar);

              const yesCount = s.rsvps?.filter(r => r.status === 'yes').length || 0;
              const maybeCount = s.rsvps?.filter(r => r.status === 'maybe').length || 0;
              const noCount = s.rsvps?.filter(r => r.status === 'no').length || 0;
              const attendedCount = s.attendance?.filter(a => a.attended).length || 0;

              return (
                <div
                  key={s.id}
                  className="rounded-2xl bg-[#1C1814] border border-[#2E2820] p-4 shadow-md space-y-3 transition-all hover:border-[#E0A030]/30"
                >
                  {/* Header: Session number, title & status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#E0A030]/15 text-[#F2C265] font-extrabold text-xs">
                          جلسه {s.number}
                        </span>
                        {getStatusBadge(s.status)}
                      </div>
                      <h3 className="text-base font-bold text-[#EDE6D8]">{s.title}</h3>
                    </div>

                    {/* Actions for DM */}
                    {isDm && (
                      <div className="flex items-center gap-1">
                        {onEditSession && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditSession(s);
                            }}
                            className="p-2 rounded-lg text-[#A39A89] hover:text-[#EDE6D8] hover:bg-white/5 transition-colors"
                            title="ویرایش جلسه"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteSession && (
                          <button
                            type="button"
                            disabled={deletingId === s.id}
                            onClick={() => handleDelete(s.id)}
                            className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="حذف جلسه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date & Time */}
                  {dt ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[#F2C265] font-semibold bg-[#E0A030]/10 px-2.5 py-1 rounded-lg">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{dt.weekday}، {dt.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#EDE6D8] bg-white/5 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-[#8C8576]" />
                        <span>ساعت {dt.time}</span>
                        <span className="text-[11px] text-[#8C8576]">({s.durationMinutes} د)</span>
                      </div>
                      {dt.relative && (
                        <span className="text-[11px] text-[#6F9E78] font-medium bg-[#6F9E78]/15 px-2 py-0.5 rounded-md">
                          {dt.relative}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 font-medium">
                      در حال تعیین زمان از طریق نظرسنجی
                    </div>
                  )}

                  {/* In-world date */}
                  {inWorldStr && (
                    <div className="flex items-center gap-1.5 text-xs text-[#C9BFAC]">
                      <Hourglass className="w-3.5 h-3.5 text-[#E0A030]" />
                      <span>تقویم جهان بازی:</span>
                      <span className="font-semibold text-[#F2C265]">{inWorldStr}</span>
                    </div>
                  )}

                  {/* Place / URL */}
                  {(s.placeText || s.onlineUrl) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A39A89]">
                      {s.placeText && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#E0A030]" />
                          <span>{s.placeText}</span>
                        </div>
                      )}
                      {s.onlineUrl && (
                        <a
                          href={s.onlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#C4A5EB] hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>اتاق آنلاین</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* DM Notes */}
                  {s.dmNotes && (
                    <div className="p-2.5 rounded-xl bg-[#2A1F13] border border-[#E0A030]/20 text-xs text-[#E8D4B0] leading-relaxed">
                      <span className="font-bold text-[#F2C265]">یادداشت مستر: </span>
                      {s.dmNotes}
                    </div>
                  )}

                  {/* Footer Stats: RSVP / Attendance */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    {s.status === 'done' ? (
                      <div className="flex items-center gap-1.5 text-[#6F9E78] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{attendedCount} نفر شرکت داشتند</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[#6F9E78] font-bold">{yesCount} بله</span>
                        <span className="text-[#8C8576]">·</span>
                        <span className="text-[#F2C265] font-bold">{maybeCount} شاید</span>
                        <span className="text-[#8C8576]">·</span>
                        <span className="text-rose-400 font-bold">{noCount} نه</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {/* Attendance button for DM on past/open session */}
                      {isDm && s.status !== 'done' && onOpenAttendance && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAttendance(s);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#6F9E78]/20 hover:bg-[#6F9E78] text-[#6F9E78] hover:text-[#0E0D0C] text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>ثبت حضور</span>
                        </button>
                      )}

                      {/* Closing sheet / Recap & Rewards button for DM */}
                      {isDm && onOpenClosingSheet && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenClosingSheet(s);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#E0A030]/20 hover:bg-[#E0A030] text-[#F2C265] hover:text-[#0E0D0C] text-xs font-bold transition-colors flex items-center gap-1"
                          title="خلاصه جلسه، پاداش‌ها و رویدادهای کاراکترها"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>خلاصه و پاداش‌ها</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
