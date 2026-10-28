/**
 * Session and Scheduling Rules Engine (Step 4.1)
 * Pure domain logic for D&D 5e campaign sessions, poll voting, RSVPs,
 * permission filters, timezone calculations, and attendance tracking.
 */

import type {
  CampaignRole,
  Session,
  SessionPoll,
  SessionPollOption,
  SessionPollVote,
  SessionRsvpChoice,
  WorldCalendar
} from '../../src/types';
import { formatWorldDate } from '../../src/data/calendar';

export interface PollOptionTally {
  optionId: string;
  startsAt: string;
  yes: number;
  maybe: number;
  no: number;
  totalVotes: number;
  score: number; // yes * 2 + maybe * 1
  voters: Array<{ userId: string; userName?: string; choice: SessionRsvpChoice }>;
}

/**
 * Strips DM notes if the viewer is not a campaign owner or co-DM.
 * Guarantees player/spectator confidentiality.
 */
export function filterSessionForViewer<T extends { dmNotes?: string | null }>(
  session: T,
  role?: CampaignRole | 'dm' | null
): T {
  const isDm = role === 'owner' || role === 'co_dm' || role === 'dm';
  if (isDm) return session;

  const clone = { ...session };
  delete clone.dmNotes;
  return clone;
}

/**
 * Only campaign members with owner, co_dm, or player role can RSVP.
 * Spectators and non-members are explicitly forbidden.
 */
export function canUserRsvp(role?: CampaignRole | 'dm' | null): boolean {
  return role === 'owner' || role === 'co_dm' || role === 'player' || role === 'dm';
}

/**
 * Only campaign members with owner, co_dm, or player role can vote on session polls.
 * Spectators and non-members are forbidden.
 */
export function canUserVote(role?: CampaignRole | 'dm' | null): boolean {
  return role === 'owner' || role === 'co_dm' || role === 'player' || role === 'dm';
}

/**
 * Only campaign owner or co_dm can create, edit, cancel, propose dates, confirm, or mark sessions done.
 */
export function canManageSessions(role?: CampaignRole | 'dm' | null): boolean {
  return role === 'owner' || role === 'co_dm' || role === 'dm';
}

/**
 * Validates date proposal options for a poll (2 to 5 options required).
 */
export function validatePollOptions(
  options: Array<{ id?: string; startsAt: string }>
): { valid: boolean; error?: string; normalized?: SessionPollOption[] } {
  if (!Array.isArray(options) || options.length < 2) {
    return { valid: false, error: 'برای نظرسنجی تاریخ حداقل ۲ گزینه الزامی است.' };
  }
  if (options.length > 5) {
    return { valid: false, error: 'حداکثر می‌توانید ۵ گزینه تاریخ پیشنهاد دهید.' };
  }

  const normalized: SessionPollOption[] = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!opt || !opt.startsAt) {
      return { valid: false, error: `گزینه شماره ${i + 1} تاریخ معتبری ندارد.` };
    }
    const date = new Date(opt.startsAt);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `قالب تاریخ گزینه شماره ${i + 1} نامعتبر است.` };
    }
    normalized.push({
      id: opt.id && opt.id.trim() ? opt.id.trim() : `opt-${Date.now()}-${i + 1}`,
      startsAt: date.toISOString()
    });
  }

  return { valid: true, normalized };
}

/**
 * Computes tallies and breakdown per poll option.
 */
export function calculatePollTally(
  poll: SessionPoll,
  votes: SessionPollVote[] = []
): Record<string, PollOptionTally> {
  const result: Record<string, PollOptionTally> = {};

  for (const opt of poll.options || []) {
    result[opt.id] = {
      optionId: opt.id,
      startsAt: opt.startsAt,
      yes: 0,
      maybe: 0,
      no: 0,
      totalVotes: 0,
      score: 0,
      voters: []
    };
  }

  for (const vote of votes) {
    if (vote.pollId !== poll.id) continue;
    const tally = result[vote.optionId];
    if (!tally) continue;

    tally.voters.push({
      userId: vote.userId,
      userName: vote.userName,
      choice: vote.choice
    });
    tally.totalVotes += 1;

    if (vote.choice === 'yes') {
      tally.yes += 1;
      tally.score += 2;
    } else if (vote.choice === 'maybe') {
      tally.maybe += 1;
      tally.score += 1;
    } else if (vote.choice === 'no') {
      tally.no += 1;
    }
  }

  return result;
}

/**
 * Picks the optimal poll option based on tally scores (yes*2 + maybe*1).
 */
export function findBestPollOption(
  poll: SessionPoll,
  votes: SessionPollVote[] = []
): SessionPollOption | null {
  if (!poll.options || poll.options.length === 0) return null;
  const tallies = calculatePollTally(poll, votes);

  let best: SessionPollOption | null = null;
  let bestScore = -1;

  for (const opt of poll.options) {
    const tally = tallies[opt.id];
    const score = tally ? tally.score : 0;
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }

  return best || poll.options[0] || null;
}

/**
 * Formats a UTC ISO timestamp according to a specific timezone (default: Asia/Tehran).
 * Formats into readable Persian date, time, and weekday.
 */
export function formatSessionDateTime(
  utcIsoOrMs: string | number | Date,
  timeZone: string = 'Asia/Tehran',
  locale: string = 'fa-IR'
): {
  date: string;
  time: string;
  weekday: string;
  full: string;
  relative: string;
} {
  const dateObj = new Date(utcIsoOrMs);
  if (isNaN(dateObj.getTime())) {
    return {
      date: 'نامشخص',
      time: '--:--',
      weekday: '',
      full: 'تاریخ نامشخص',
      relative: ''
    };
  }

  try {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const weekdayFormatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'long'
    });

    const formattedDate = dateFormatter.format(dateObj);
    const formattedTime = timeFormatter.format(dateObj);
    const formattedWeekday = weekdayFormatter.format(dateObj);

    // Relative calculation
    const now = Date.now();
    const diffMs = dateObj.getTime() - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    let relative = '';
    if (Math.abs(diffMs) < 1000 * 60 * 60 * 3) {
      relative = diffMs > 0 ? 'به‌زودی' : 'هم‌اکنون یا به‌تازگی';
    } else if (diffDays === 0) {
      relative = 'امروز';
    } else if (diffDays === 1) {
      relative = 'فردا';
    } else if (diffDays === -1) {
      relative = 'دیروز';
    } else if (diffDays > 1) {
      relative = `${diffDays} روز دیگر`;
    } else {
      relative = `${Math.abs(diffDays)} روز پیش`;
    }

    return {
      date: formattedDate,
      time: formattedTime,
      weekday: formattedWeekday,
      full: `${formattedWeekday}، ${formattedDate} ساعت ${formattedTime}`,
      relative
    };
  } catch {
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weekday: '',
      full: dateObj.toLocaleString(),
      relative: ''
    };
  }
}

/**
 * Renders the in-world date string or parses it against a world calendar if provided.
 */
export function displayInWorldDate(
  inWorldDate: string | null | undefined,
  calendar?: WorldCalendar | null
): string | null {
  if (!inWorldDate || !inWorldDate.trim()) return null;
  const raw = inWorldDate.trim();
  if (calendar && raw === calendar.id) {
    return formatWorldDate(calendar);
  }
  return raw;
}

/**
 * Builds the canonical milestone event recorded when a session is completed.
 * Required event title: "حضور در جلسه N"
 */
export function buildAttendanceHistoryEvent(
  sessionNumber: number,
  sessionTitle: string,
  sessionId: string,
  campaignId: string
): {
  id: string;
  eventType: 'major_deed';
  payload: {
    title: string;
    description: string;
    sessionNumber: number;
    sessionId: string;
    campaignId: string;
  };
} {
  return {
    id: `hist-ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType: 'major_deed',
    payload: {
      title: `حضور در جلسه ${sessionNumber}`,
      description: sessionTitle ? `شرکت در جلسه «${sessionTitle}»` : `حضور و مشارکت در جلسه ${sessionNumber}`,
      sessionNumber,
      sessionId,
      campaignId
    }
  };
}

/**
 * Partitions sessions into upcoming vs past/archived groups.
 */
export function partitionSessions(sessions: Session[]): {
  upcoming: Session[];
  past: Session[];
  nextSession: Session | null;
} {
  const upcoming: Session[] = [];
  const past: Session[] = [];

  for (const s of sessions) {
    if (s.status === 'done' || s.status === 'cancelled') {
      past.push(s);
    } else {
      upcoming.push(s);
    }
  }

  // Sort upcoming: confirmed sessions with earlier scheduledAt first, then planned sessions
  upcoming.sort((a, b) => {
    if (a.scheduledAt && b.scheduledAt) {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    }
    if (a.scheduledAt) return -1;
    if (b.scheduledAt) return 1;
    return a.number - b.number;
  });

  // Sort past: most recent first
  past.sort((a, b) => {
    if (a.scheduledAt && b.scheduledAt) {
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    }
    return b.number - a.number;
  });

  const nextSession = upcoming.length > 0 ? upcoming[0] : null;

  return { upcoming, past, nextSession };
}
