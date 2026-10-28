import React, { useState, useEffect } from 'react';
import { Session, CharacterParticipation, Character } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { UserCheck, Check, AlertTriangle, Shield, Award } from 'lucide-react';

interface SessionAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  campaignId: string;
  participations: CharacterParticipation[];
  characters: Character[];
  onSubmitAttendance: (
    sessionId: string,
    attendance: Array<{ participationId: string; attended: boolean }>
  ) => Promise<void>;
  onProceedToClosingSheet?: (session: Session) => void;
}

export const SessionAttendanceModal: React.FC<SessionAttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  campaignId,
  participations,
  characters,
  onSubmitAttendance,
  onProceedToClosingSheet
}) => {
  const [attendedMap, setAttendedMap] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session && isOpen) {
      const initial: Record<string, boolean> = {};
      const existingAttendance = session.attendance || [];
      const existingRsvps = session.rsvps || [];

      participations.forEach(p => {
        const found = existingAttendance.find(a => a.participationId === p.id);
        if (found) {
          initial[p.id] = Boolean(found.attended);
        } else {
          // If RSVP was 'yes', default to true, otherwise true
          const rsvp = existingRsvps.find(r => r.userId === p.characterId); // or party
          initial[p.id] = rsvp?.status === 'no' ? false : true;
        }
      });

      setAttendedMap(initial);
      setErrorMsg(null);
    }
  }, [session, isOpen, participations]);

  if (!session) return null;

  const toggleAttendance = (partId: string) => {
    setAttendedMap(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  const handleSelectAll = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    participations.forEach(p => {
      updated[p.id] = val;
    });
    setAttendedMap(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const list = participations.map(p => ({
        participationId: p.id,
        attended: Boolean(attendedMap[p.id])
      }));

      await onSubmitAttendance(session.id, list);
      onClose();
      if (onProceedToClosingSheet) {
        onProceedToClosingSheet(session);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت حضور و غیاب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const attendedCount = Object.values(attendedMap).filter(Boolean).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت پایان جلسه و حضور و غیاب"
      subtitle={`جلسه شماره ${session.number}: ${session.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-20 text-right" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-[#2A1F13] border border-[#E0A030]/20 text-xs text-[#E8D4B0] leading-relaxed">
          با ثبت این فرم، وضعیت جلسه به «برگزار شده» تغییر یافته، به شمارنده جلسات کاراکترهای حاضر (+۱) افزوده می‌شود و یک رویداد افتخار با عنوان «حضور در جلسه {session.number}» در شناسنامه کاراکترها ثبت می‌گردد.
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-[#EDE6D8]">
            شخصیت‌های حاضر: <span className="text-[#F2C265]">{attendedCount} از {participations.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-[#6F9E78] hover:underline font-semibold"
            >
              انتخاب همه
            </button>
            <span className="text-[#8C8576]">·</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-rose-400 hover:underline font-semibold"
            >
              عدم انتخاب
            </button>
          </div>
        </div>

        {/* Participations Checklist */}
        <div className="space-y-2">
          {participations.map(p => {
            const char = characters.find(c => c.id === p.characterId);
            const isAttended = Boolean(attendedMap[p.id]);

            return (
              <div
                key={p.id}
                onClick={() => toggleAttendance(p.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[52px] ${
                  isAttended
                    ? 'bg-[#6F9E78]/10 border-[#6F9E78]/40 text-[#EDE6D8]'
                    : 'bg-[#171310] border-white/5 text-[#A39A89] opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isAttended
                        ? 'bg-[#6F9E78] text-[#0E0D0C]'
                        : 'border border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#EDE6D8] flex items-center gap-2">
                      <span>{char?.name || 'شخصیت ماجراجو'}</span>
                      <span className="text-[11px] font-normal text-[#8C8576]">
                        ({char?.className || 'کلاس'} · سطح {p.level})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A39A89] mt-0.5 flex items-center gap-1.5">
                      <Award className="w-3 h-3 text-[#E0A030]" />
                      <span>جلسات حضور یافته تا کنون: {p.sessionsAttended || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold">
                  {isAttended ? (
                    <span className="text-[#6F9E78]">حاضر</span>
                  ) : (
                    <span className="text-rose-400">غایب</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#6F9E78] hover:bg-[#82B38C] text-[#0E0D0C] font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg min-h-[48px]"
          >
            <UserCheck className="w-4 h-4" />
            <span>ثبت نهایی حضور و غیاب</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
