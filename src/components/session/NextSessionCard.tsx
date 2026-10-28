import React, { useState } from 'react';
import { Session, Campaign, WorldCalendar, User, CampaignRole, SessionRsvpChoice } from '../../types';
import { 
  formatSessionDateTime, 
  displayInWorldDate, 
  calculatePollTally, 
  canUserRsvp, 
  canUserVote, 
  canManageSessions 
} from '../../../shared/rules/sessionEngine';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle2, 
  HelpCircle, XCircle, ChevronLeft, Plus, Edit3, UserCheck, 
  Sparkles, Hourglass, MessageSquare, Check, X, ShieldAlert, BookOpen
} from 'lucide-react';

interface NextSessionCardProps {
  session: Session | null;
  campaign: Campaign | null;
  calendar?: WorldCalendar | null;
  currentUser: User | null;
  userRole?: CampaignRole | 'dm' | null;
  onRsvp: (sessionId: string, status: SessionRsvpChoice, note?: string) => Promise<void>;
  onVotePoll: (sessionId: string, optionId: string, choice: SessionRsvpChoice) => Promise<void>;
  onConfirmPollOption?: (sessionId: string, optionId: string) => Promise<void>;
  onOpenSessionList: () => void;
  onOpenCreateSession?: () => void;
  onOpenAttendance?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  onOpenClosingSheet?: (session: Session) => void;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = ({
  session,
  campaign,
  calendar,
  currentUser,
  userRole,
  onRsvp,
  onVotePoll,
  onConfirmPollOption,
  onOpenSessionList,
  onOpenCreateSession,
  onOpenAttendance,
  onEditSession,
  onOpenClosingSheet
}) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDm = canManageSessions(userRole);
  const userCanRsvp = canUserRsvp(userRole);
  const userCanVote = canUserVote(userRole);

  const timezone = campaign?.settings?.timezone || 'Asia/Tehran';

  if (!session) {
    return (
      <div className="rounded-2xl bg-[#1C1814] border border-[#2A241C] p-4 sm:p-5 shadow-lg text-right" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0A030]/10 border border-[#E0A030]/20 flex items-center justify-center text-[#F2C265]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#EDE6D8]">جلسات بازی</h3>
              <p className="text-xs text-[#8C8576] mt-0.5">در حال حاضر جلسه جدیدی برنامه‌ریزی نشده است.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSessionList}
              className="px-3 py-2 rounded-xl bg-[#2A241C] hover:bg-[#3A3227] text-xs font-semibold text-[#EDE6D8] transition-colors"
            >
              جلسات گذشته
            </button>
            {isDm && onOpenCreateSession && (
              <button
                type="button"
                onClick={onOpenCreateSession}
                className="px-3.5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                جلسه جدید
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const dt = session.scheduledAt ? formatSessionDateTime(session.scheduledAt, timezone) : null;
  const inWorldStr = displayInWorldDate(session.inWorldDate, calendar);

  // Poll handling
  const poll = session.poll;
  const pollTallies = poll ? calculatePollTally(poll, poll.votes || []) : {};

  // RSVP status
  const currentRsvp = typeof session.myRsvp === 'string' 
    ? session.myRsvp 
    : session.myRsvp?.status || session.rsvps?.find(r => r.userId === currentUser?.id)?.status;

  const handleRsvpSubmit = async (status: SessionRsvpChoice) => {
    if (!userCanRsvp || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRsvp(session.id, status, noteText || undefined);
      setNoteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteSubmit = async (optionId: string, choice: SessionRsvpChoice) => {
    if (!userCanVote || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onVotePoll(session.id, optionId, choice);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6F9E78] animate-pulse" />
            تأیید شده
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">
            {poll ? 'نظرسنجی تاریخ' : 'برنامه‌ریزی اولیه'}
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
            برگزار شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            لغو شده
          </span>
        );
    }
  };

  // RSVP summary counters
  const yesCount = session.rsvps?.filter(r => r.status === 'yes').length || 0;
  const maybeCount = session.rsvps?.filter(r => r.status === 'maybe').length || 0;
  const noCount = session.rsvps?.filter(r => r.status === 'no').length || 0;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#221C16] to-[#181411] border border-[#3A3024] p-4 sm:p-5 shadow-xl text-right transition-all" dir="rtl">
      {/* Header bar: Session # and Status */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-[#E0A030]/15 text-[#F2C265] border border-[#E0A030]/25 text-xs font-extrabold tracking-wide">
            جلسه {session.number}
          </span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          {isDm && onEditSession && (
            <button
              type="button"
              onClick={() => onEditSession(session)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#A39A89] hover:text-[#EDE6D8] transition-colors"
              title="ویرایش مشخصات جلسه"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSessionList}
            className="text-xs text-[#E0A030] hover:text-[#F2C265] flex items-center gap-1 font-semibold transition-colors"
          >
            همه جلسات
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Core Date/Time Info */}
      <div className="mt-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#EDE6D8] leading-tight">
          {session.title}
        </h2>

        {/* Date Display */}
        {dt ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-[#F2C265] font-bold bg-[#E0A030]/10 px-3 py-1.5 rounded-xl border border-[#E0A030]/20">
              <CalendarIcon className="w-4 h-4 text-[#E0A030]" />
              <span>{dt.weekday}، {dt.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#EDE6D8] font-semibold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-[#A39A89]" />
              <span>ساعت {dt.time}</span>
              <span className="text-[11px] text-[#8C8576]">({session.durationMinutes} دقیقه)</span>
            </div>
            {dt.relative && (
              <span className="text-xs font-medium text-[#6F9E78] px-2.5 py-1 rounded-lg bg-[#6F9E78]/15 border border-[#6F9E78]/25">
                {dt.relative}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
            <Hourglass className="w-4 h-4" />
            <span>تاریخ نهایی در نظرسنجی زیر در حال انتخاب است</span>
          </div>
        )}

        {/* In-world date if available */}
        {inWorldStr && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#C9BFAC]">
            <Hourglass className="w-3.5 h-3.5 text-[#E0A030]" />
            <span className="font-medium">تاریخ در جهان بازی:</span>
            <span className="font-bold text-[#F2C265]">{inWorldStr}</span>
          </div>
        )}

        {/* Place & Online URL */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#A39A89]">
          {session.placeText && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E0A030]" />
              <span className="text-[#EDE6D8]">{session.placeText}</span>
            </div>
          )}
          {session.onlineUrl && (
            <a
              href={session.onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9B72CF]/15 hover:bg-[#9B72CF]/25 text-[#C4A5EB] border border-[#9B72CF]/30 font-semibold transition-colors min-h-[36px]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>لینک اتاق صوتی/تصویری</span>
            </a>
          )}
        </div>

        {/* DM Notes (Private to DM / Co-DM) */}
        {session.dmNotes && (
          <div className="mt-3 p-3 rounded-xl bg-[#2A1F13] border border-[#E0A030]/20 text-xs text-[#E8D4B0] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#F2C265] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>یادداشت محرمانه دانجن مستر:</span>
            </div>
            <p className="whitespace-pre-wrap">{session.dmNotes}</p>
          </div>
        )}
      </div>

      {/* Date Poll Section (if active) */}
      {poll && poll.status === 'open' && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E0A030] animate-ping" />
              <h4 className="text-xs sm:text-sm font-bold text-[#F2C265]">نظرسنجی انتخاب زمان جلسه</h4>
            </div>
            <span className="text-[11px] text-[#A39A89]">
              {poll.votes?.length || 0} رأی ثبت شده
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.values(pollTallies).map((tally) => {
              const optDt = formatSessionDateTime(tally.startsAt, timezone);
              const myVote = poll.votes?.find(v => v.userId === currentUser?.id && v.optionId === tally.optionId)?.choice;

              return (
                <div
                  key={tally.optionId}
                  className="p-3 rounded-xl bg-[#171310] border border-white/5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#EDE6D8]">
                        {optDt.weekday}، {optDt.date}
                      </div>
                      <div className="text-xs text-[#A39A89] mt-0.5">
                        ساعت {optDt.time} {optDt.relative && `(${optDt.relative})`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-[#6F9E78]/15 text-[#6F9E78] font-bold">
                        {tally.yes} بله
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#E0A030]/15 text-[#F2C265] font-bold">
                        {tally.maybe} شاید
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold">
                        {tally.no} نه
                      </span>
                    </div>
                  </div>

                  {/* Voting buttons for players & DM */}
                  {userCanVote && (
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'yes')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'yes'
                            ? 'bg-[#6F9E78] text-[#0E0D0C] shadow-md ring-2 ring-[#6F9E78]/40'
                            : 'bg-white/5 hover:bg-white/10 text-[#6F9E78] border border-[#6F9E78]/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>بله، می‌آیم</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'maybe')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'maybe'
                            ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md ring-2 ring-[#E0A030]/40'
                            : 'bg-white/5 hover:bg-white/10 text-[#F2C265] border border-[#E0A030]/30'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>شاید</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'no')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'no'
                            ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>نمی‌توانم</span>
                      </button>
                    </div>
                  )}

                  {/* DM Confirm this Option */}
                  {isDm && onConfirmPollOption && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onConfirmPollOption(session.id, tally.optionId)}
                        className="px-3 py-1.5 rounded-lg bg-[#E0A030]/20 hover:bg-[#E0A030] text-[#F2C265] hover:text-[#0E0D0C] border border-[#E0A030]/40 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تأیید و نهایی‌سازی این تاریخ</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RSVP Section (When session has scheduledAt) */}
      {session.scheduledAt && session.status !== 'done' && session.status !== 'cancelled' && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EDE6D8]">وضعیت حضور شما:</span>
              {currentRsvp === 'yes' && (
                <span className="text-xs font-bold text-[#6F9E78] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حاضر می‌شوید
                </span>
              )}
              {currentRsvp === 'maybe' && (
                <span className="text-xs font-bold text-[#F2C265] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  شاید حضور پیدا کنید
                </span>
              )}
              {currentRsvp === 'no' && (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  نمی‌توانید حضور داشته باشید
                </span>
              )}
              {!currentRsvp && (
                <span className="text-xs text-[#8C8576]">هنوز ثبت نشده است</span>
              )}
            </div>

            {/* Total Counters */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6F9E78] font-bold" title="حاضران">
                {yesCount} بله
              </span>
              <span className="text-[#8C8576]">·</span>
              <span className="text-[#F2C265] font-bold" title="شاید">
                {maybeCount} شاید
              </span>
              <span className="text-[#8C8576]">·</span>
              <span className="text-rose-400 font-bold" title="غایبان">
                {noCount} نه
              </span>
            </div>
          </div>

          {/* 1-Tap RSVP Buttons (Player & DM) */}
          {userCanRsvp ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('yes')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'yes'
                      ? 'bg-[#6F9E78] text-[#0E0D0C] shadow-lg ring-2 ring-[#6F9E78]/50'
                      : 'bg-[#6F9E78]/10 hover:bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>بله، می‌آیم</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('maybe')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'maybe'
                      ? 'bg-[#E0A030] text-[#0E0D0C] shadow-lg ring-2 ring-[#E0A030]/50'
                      : 'bg-[#E0A030]/10 hover:bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>شاید</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('no')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'no'
                      ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-500/50'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>نمی‌توانم</span>
                </button>
              </div>

              {/* Optional note expander */}
              <div className="pt-1">
                {!noteOpen ? (
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="text-[11px] text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>افزودن یادداشت برای دانجن مستر...</span>
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="مثال: شاید نیم‌ساعت تاخیر داشته باشم"
                      className="flex-1 bg-[#12100E] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRsvpSubmit(currentRsvp || 'yes')}
                      className="px-3 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold"
                    >
                      ثبت
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteOpen(false)}
                      className="p-2 text-[#8C8576] hover:text-[#EDE6D8]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#8C8576] italic bg-white/5 p-2.5 rounded-xl text-center">
              تماشاچیان مجاز به ثبت حضور نیستند.
            </div>
          )}
        </div>
      )}

      {/* DM Footer Actions */}
      {isDm && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {session.status !== 'done' && onOpenAttendance && (
              <button
                type="button"
                onClick={() => onOpenAttendance(session)}
                className="px-3.5 py-2 rounded-xl bg-[#6F9E78]/20 hover:bg-[#6F9E78] text-[#6F9E78] hover:text-[#0E0D0C] border border-[#6F9E78]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm min-h-[40px]"
              >
                <UserCheck className="w-4 h-4" />
                <span>پایان جلسه و حضور و غیاب</span>
              </button>
            )}

            {onOpenClosingSheet && (
              <button
                type="button"
                onClick={() => onOpenClosingSheet(session)}
                className="px-3.5 py-2 rounded-xl bg-[#E0A030]/20 hover:bg-[#E0A030] text-[#F2C265] hover:text-[#0E0D0C] border border-[#E0A030]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm min-h-[40px]"
                title="ثبت خلاصه، پاداش‌های XP/Milestone و نکات برجسته"
              >
                <BookOpen className="w-4 h-4" />
                <span>خلاصه و پاداش‌ها</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mr-auto">
            {onOpenCreateSession && (
              <button
                type="button"
                onClick={onOpenCreateSession}
                className="px-3 py-2 rounded-xl bg-[#2A241C] hover:bg-[#3A3227] text-xs font-semibold text-[#EDE6D8] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>جلسه جدید</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
