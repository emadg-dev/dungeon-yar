import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
      <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5 shadow-lg text-start" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-hover">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">جلسات بازی</h3>
              <p className="text-xs text-text-muted mt-0.5">در حال حاضر جلسه جدیدی برنامه‌ریزی نشده است.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onOpenSessionList}
              className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-text-primary transition-colors"
            >
              جلسات گذشته
            </Button>
            {isDm && onOpenCreateSession && (
              <Button
                type="button"
                onClick={onOpenCreateSession}
                className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                جلسه جدید
              </Button>
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            تأیید شده
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent-hover border border-accent/30">
            {poll ? 'نظرسنجی تاریخ' : 'برنامه‌ریزی اولیه'}
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-2 text-text-muted border border-border">
            برگزار شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger/20 text-danger border border-danger/30">
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
    <div className="rounded-2xl bg-gradient-to-b from-surface-2 to-surface border border-border p-4 sm:p-5 shadow-xl text-start transition-all" dir="rtl">
      {/* Header bar: Session # and Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-accent/15 text-accent-hover border border-accent/25 text-xs font-extrabold tracking-wide">
            جلسه {session.number}
          </span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          {isDm && onEditSession && (
            <Button
              type="button"
              onClick={() => onEditSession(session)}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
              title="ویرایش مشخصات جلسه"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            onClick={onOpenSessionList}
            className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-semibold transition-colors"
          >
            همه جلسات
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Title & Core Date/Time Info */}
      <div className="mt-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-text-primary leading-tight">
          {session.title}
        </h2>

        {/* Date Display */}
        {dt ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-accent-hover font-bold bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">
              <CalendarIcon className="w-4 h-4 text-accent" />
              <span>{dt.weekday}، {dt.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-primary font-semibold bg-surface-2 px-3 py-1.5 rounded-xl border border-border">
              <Clock className="w-4 h-4 text-text-muted" />
              <span>ساعت {dt.time}</span>
              <span className="text-xs text-text-muted">({session.durationMinutes} دقیقه)</span>
            </div>
            {dt.relative && (
              <span className="text-xs font-medium text-success px-2.5 py-1 rounded-lg bg-success/15 border border-success/25">
                {dt.relative}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Hourglass className="w-4 h-4" />
            <span>تاریخ نهایی در نظرسنجی زیر در حال انتخاب است</span>
          </div>
        )}

        {/* In-world date if available */}
        {inWorldStr && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-text-muted">
            <Hourglass className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium">تاریخ در جهان بازی:</span>
            <span className="font-bold text-accent-hover">{inWorldStr}</span>
          </div>
        )}

        {/* Place & Online URL */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          {session.placeText && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span className="text-text-primary">{session.placeText}</span>
            </div>
          )}
          {session.onlineUrl && (
            <a
              href={session.onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-role-codm/15 hover:bg-role-codm/25 text-role-codm border border-role-codm/30 font-semibold transition-colors min-h-[44px]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>لینک اتاق صوتی/تصویری</span>
            </a>
          )}
        </div>

        {/* DM Notes (Private to DM / Co-DM) */}
        {session.dmNotes && (
          <div className="mt-3 p-3 rounded-xl bg-surface-2 border border-accent/20 text-xs text-accent-hover leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-accent-hover mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>یادداشت محرمانه دانجن مستر:</span>
            </div>
            <p className="whitespace-pre-wrap">{session.dmNotes}</p>
          </div>
        )}
      </div>

      {/* Date Poll Section (if active) */}
      {poll && poll.status === 'open' && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <h4 className="text-xs sm:text-sm font-bold text-accent-hover">نظرسنجی انتخاب زمان جلسه</h4>
            </div>
            <span className="text-xs text-text-muted">
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
                  className="p-3 rounded-xl bg-surface border border-border space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-text-primary">
                        {optDt.weekday}، {optDt.date}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        ساعت {optDt.time} {optDt.relative && `(${optDt.relative})`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-success/15 text-success font-bold">
                        {tally.yes} بله
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent-hover font-bold">
                        {tally.maybe} شاید
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-danger/15 text-danger font-bold">
                        {tally.no} نه
                      </span>
                    </div>
                  </div>

                  {/* Voting buttons for players & DM */}
                  {userCanVote && (
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'yes')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'yes'
                            ? 'bg-success text-on-accent shadow-md ring-2 ring-success/40'
                            : 'bg-surface-2 hover:bg-surface-3 text-success border border-success/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>بله، می‌آیم</span>
                      </Button>

                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'maybe')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'maybe'
                            ? 'bg-accent text-on-accent shadow-md ring-2 ring-accent/40'
                            : 'bg-surface-2 hover:bg-surface-3 text-accent-hover border border-accent/30'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>شاید</span>
                      </Button>

                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleVoteSubmit(tally.optionId, 'no')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          myVote === 'no'
                            ? 'bg-danger text-on-danger shadow-md ring-2 ring-danger/40'
                            : 'bg-surface-2 hover:bg-surface-3 text-danger border border-danger/30'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>نمی‌توانم</span>
                      </Button>
                    </div>
                  )}

                  {/* DM Confirm this Option */}
                  {isDm && onConfirmPollOption && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => onConfirmPollOption(session.id, tally.optionId)}
                        className="px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent text-accent-hover hover:text-on-accent border border-accent/40 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تأیید و نهایی‌سازی این تاریخ</span>
                      </Button>
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
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">وضعیت حضور شما:</span>
              {currentRsvp === 'yes' && (
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حاضر می‌شوید
                </span>
              )}
              {currentRsvp === 'maybe' && (
                <span className="text-xs font-bold text-accent-hover flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  شاید حضور پیدا کنید
                </span>
              )}
              {currentRsvp === 'no' && (
                <span className="text-xs font-bold text-danger flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  نمی‌توانید حضور داشته باشید
                </span>
              )}
              {!currentRsvp && (
                <span className="text-xs text-text-muted">هنوز ثبت نشده است</span>
              )}
            </div>

            {/* Total Counters */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-success font-bold" title="حاضران">
                {yesCount} بله
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-accent-hover font-bold" title="شاید">
                {maybeCount} شاید
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-danger font-bold" title="غایبان">
                {noCount} نه
              </span>
            </div>
          </div>

          {/* 1-Tap RSVP Buttons (Player & DM) */}
          {userCanRsvp ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('yes')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'yes'
                      ? 'bg-success text-on-accent shadow-lg ring-2 ring-success/50'
                      : 'bg-success/10 hover:bg-success/20 text-success border border-success/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>بله، می‌آیم</span>
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('maybe')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'maybe'
                      ? 'bg-accent text-on-accent shadow-lg ring-2 ring-accent/50'
                      : 'bg-accent/10 hover:bg-accent/20 text-accent-hover border border-accent/30'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>شاید</span>
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRsvpSubmit('no')}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    currentRsvp === 'no'
                      ? 'bg-danger text-on-danger shadow-lg ring-2 ring-danger/50'
                      : 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>نمی‌توانم</span>
                </Button>
              </div>

              {/* Optional note expander */}
              <div className="pt-1">
                {!noteOpen ? (
                  <Button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>افزودن یادداشت برای دانجن مستر...</span>
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input noWrapper
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="مثال: شاید نیم‌ساعت تاخیر داشته باشم"
                      className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                    />
                    <Button
                      type="button"
                      onClick={() => handleRsvpSubmit(currentRsvp || 'yes')}
                      className="px-3 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold"
                    >
                      ثبت
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setNoteOpen(false)}
                      className="p-2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-text-muted italic bg-surface-2 p-2.5 rounded-xl text-center">
              تماشاچیان مجاز به ثبت حضور نیستند.
            </div>
          )}
        </div>
      )}

      {/* DM Footer Actions */}
      {isDm && (
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {session.status !== 'done' && onOpenAttendance && (
              <Button
                type="button"
                onClick={() => onOpenAttendance(session)}
                className="px-3.5 py-2 rounded-xl bg-success/20 hover:bg-success text-success hover:text-on-accent border border-success/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm min-h-[40px]"
              >
                <UserCheck className="w-4 h-4" />
                <span>پایان جلسه و حضور و غیاب</span>
              </Button>
            )}

            {onOpenClosingSheet && (
              <Button
                type="button"
                onClick={() => onOpenClosingSheet(session)}
                className="px-3.5 py-2 rounded-xl bg-accent/20 hover:bg-accent text-accent-hover hover:text-on-accent border border-accent/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm min-h-[40px]"
                title="ثبت خلاصه، پاداش‌های XP/Milestone و نکات برجسته"
              >
                <BookOpen className="w-4 h-4" />
                <span>خلاصه و پاداش‌ها</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mr-auto">
            {onOpenCreateSession && (
              <Button
                type="button"
                onClick={onOpenCreateSession}
                className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-text-primary transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>جلسه جدید</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
