import React, { useState, useEffect } from 'react';
import { Session, Campaign, WorldCalendar, SessionStatus } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { validatePollOptions } from '../../../shared/rules/sessionEngine';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Video, Plus, 
  Trash2, AlertTriangle, Sparkles, Hourglass, Save 
} from 'lucide-react';

interface SessionEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: Session | null;
  campaignId: string;
  calendar?: WorldCalendar | null;
  onSave: (data: {
    sessionId?: string;
    title: string;
    number?: number;
    scheduledAt?: string | null;
    durationMinutes?: number;
    placeText?: string;
    onlineUrl?: string;
    status?: SessionStatus;
    inWorldDate?: string | null;
    dmNotes?: string;
    pollOptions?: Array<{ startsAt: string }>;
  }) => Promise<void>;
}

export const SessionEditorSheet: React.FC<SessionEditorSheetProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  campaignId,
  calendar,
  onSave
}) => {
  const isEditing = Boolean(sessionToEdit);

  const [mode, setMode] = useState<'fixed' | 'poll'>('fixed');
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [placeText, setPlaceText] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [inWorldDate, setInWorldDate] = useState('');
  const [dmNotes, setDmNotes] = useState('');
  const [status, setStatus] = useState<SessionStatus>('planned');

  // Poll options (2 to 5 dates)
  const [pollOptions, setPollOptions] = useState<Array<{ date: string; time: string }>>([
    { date: '', time: '18:00' },
    { date: '', time: '18:00' }
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionToEdit) {
      setTitle(sessionToEdit.title || '');
      setNumber(sessionToEdit.number || 1);
      setDurationMinutes(sessionToEdit.durationMinutes || 240);
      setPlaceText(sessionToEdit.placeText || '');
      setOnlineUrl(sessionToEdit.onlineUrl || '');
      setInWorldDate(sessionToEdit.inWorldDate || '');
      setDmNotes(sessionToEdit.dmNotes || '');
      setStatus(sessionToEdit.status || 'planned');

      if (sessionToEdit.scheduledAt) {
        const d = new Date(sessionToEdit.scheduledAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setScheduledDate(`${yyyy}-${mm}-${dd}`);
        setScheduledTime(`${hh}:${min}`);
        setMode('fixed');
      } else if (sessionToEdit.poll && sessionToEdit.poll.options?.length > 0) {
        setMode('poll');
        setPollOptions(
          sessionToEdit.poll.options.map(opt => {
            const d = new Date(opt.startsAt);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
          })
        );
      } else {
        setMode('fixed');
      }
    } else {
      // Default new session in 3 days
      const inThreeDays = new Date(Date.now() + 3 * 86400000);
      const yyyy = inThreeDays.getFullYear();
      const mm = String(inThreeDays.getMonth() + 1).padStart(2, '0');
      const dd = String(inThreeDays.getDate()).padStart(2, '0');
      setTitle('جلسه ماجراجویی');
      setNumber(1);
      setScheduledDate(`${yyyy}-${mm}-${dd}`);
      setScheduledTime('18:00');
      setDurationMinutes(240);
      setPlaceText('');
      setOnlineUrl('');
      setInWorldDate('');
      setDmNotes('');
      setStatus('planned');
      setMode('fixed');
      setPollOptions([
        { date: `${yyyy}-${mm}-${dd}`, time: '18:00' },
        { date: `${yyyy}-${mm}-${String(inThreeDays.getDate() + 1).padStart(2, '0')}`, time: '18:00' }
      ]);
    }
    setErrorMsg(null);
  }, [sessionToEdit, isOpen]);

  const handleAddPollOption = () => {
    if (pollOptions.length >= 5) {
      setErrorMsg('حداکثر ۵ گزینه برای نظرسنجی تاریخ مجاز است.');
      return;
    }
    const lastDate = pollOptions[pollOptions.length - 1]?.date || '';
    setPollOptions(prev => [...prev, { date: lastDate, time: '18:00' }]);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      setErrorMsg('نظرسنجی تاریخ باید حداقل ۲ گزینه داشته باشد.');
      return;
    }
    setPollOptions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('عنوان جلسه الزامی است.');
      return;
    }

    let finalScheduledAt: string | null = null;
    let finalPollOptions: Array<{ startsAt: string }> | undefined = undefined;

    if (mode === 'fixed') {
      if (scheduledDate) {
        const iso = new Date(`${scheduledDate}T${scheduledTime || '18:00'}:00`).toISOString();
        finalScheduledAt = iso;
      }
    } else {
      // Poll mode
      const rawOpts = pollOptions.map(p => {
        if (!p.date) return null;
        return { startsAt: new Date(`${p.date}T${p.time || '18:00'}:00`).toISOString() };
      }).filter(Boolean) as Array<{ startsAt: string }>;

      const val = validatePollOptions(rawOpts);
      if (!val.valid) {
        setErrorMsg(val.error || 'گزینه‌های تاریخ نامعتبر هستند.');
        return;
      }
      finalPollOptions = rawOpts;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        sessionId: sessionToEdit?.id,
        title: trimmedTitle,
        number: Number(number) || 1,
        scheduledAt: finalScheduledAt,
        durationMinutes: Number(durationMinutes) || 240,
        placeText: placeText.trim() || undefined,
        onlineUrl: onlineUrl.trim() || undefined,
        status: status,
        inWorldDate: inWorldDate.trim() || undefined,
        dmNotes: dmNotes.trim() || undefined,
        pollOptions: finalPollOptions
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ذخیره جلسه.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ویرایش مشخصات جلسه' : 'ایجاد جلسه جدید'}
      subtitle={isEditing ? `جلسه شماره ${sessionToEdit?.number}` : 'برنامه‌ریزی زمان، نظرسنجی و هماهنگی بازیکنان'}
      fullHeight
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-20 text-right" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Selector */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-2 bg-[#12100E] p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('fixed');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                mode === 'fixed'
                  ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>تاریخ قطعی مشخص</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('poll');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                mode === 'poll'
                  ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Hourglass className="w-4 h-4" />
              <span>نظرسنجی تاریخ (۲ تا ۵ گزینه)</span>
            </button>
          </div>
        )}

        {/* Title & Number */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1 space-y-1">
            <label className="text-xs font-bold text-[#A39A89]">شماره جلسه</label>
            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] font-bold text-center focus:outline-none focus:border-[#E0A030] min-h-[44px]"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-xs font-bold text-[#A39A89]">عنوان جلسه *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: گذر از دروازه ساعت‌ساز"
              className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] font-bold focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Fixed Date Mode */}
        {mode === 'fixed' && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#171310] border border-white/5">
            <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>زمان‌بندی جلسه</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#A39A89]">تاریخ جلسه</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[#A39A89]">ساعت شروع</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#A39A89]">مدت زمان پیش‌بینی‌شده (دقیقه)</label>
              <input
                type="number"
                step={30}
                min={30}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(30, parseInt(e.target.value, 10) || 240))}
                className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Poll Mode (2 to 5 date options) */}
        {mode === 'poll' && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-[#171310] border border-white/5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F2C265] flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" />
                <span>گزینه‌های نظرسنجی تاریخ (۲ تا ۵ گزینه)</span>
              </h4>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="px-2.5 py-1 rounded-lg bg-[#E0A030]/20 hover:bg-[#E0A030] text-[#F2C265] hover:text-[#0E0D0C] text-[11px] font-bold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>افزودن گزینه</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#12100E] p-2 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-[#A39A89] w-6 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="date"
                    value={opt.date}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx].date = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="flex-1 bg-transparent border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                    required
                  />
                  <input
                    type="time"
                    value={opt.time}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx].time = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="w-24 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
                      title="حذف این گزینه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In-world Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 text-[#E0A030]" />
            <span>تاریخ در جهان بازی (In-world date)</span>
          </label>
          <input
            type="text"
            value={inWorldDate}
            onChange={(e) => setInWorldDate(e.target.value)}
            placeholder="مثال: ۱۲ سایه‌باد ۱۱۷۸"
            className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
          />
        </div>

        {/* Place & Online URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E0A030]" />
              <span>محل برگزاری فیزیکی</span>
            </label>
            <input
              type="text"
              value={placeText}
              onChange={(e) => setPlaceText(e.target.value)}
              placeholder="مثال: کافه ماجراجویان یا منزل سامان"
              className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A39A89] flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#9B72CF]" />
              <span>لینک جلسه آنلاین (گوگل میت، دیسکورد)</span>
            </label>
            <input
              type="url"
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
            />
          </div>
        </div>

        {/* Status (If editing) */}
        {isEditing && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A39A89]">وضعیت جلسه</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SessionStatus)}
              className="w-full bg-[#12100E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
            >
              <option value="planned">برنامه‌ریزی اولیه</option>
              <option value="confirmed">تأیید شده و قطعی</option>
              <option value="done">برگزار شده (پایان‌یافته)</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>
        )}

        {/* DM Secret Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#E0A030] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>یادداشت محرمانه دانجن مستر (فقط برای شما و دستیاران قابل مشاهده است)</span>
          </label>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            rows={3}
            placeholder="نکات روایی، هیولاها، تله‌ها و سورپرایزهای این جلسه..."
            className="w-full bg-[#12100E] border border-[#E0A030]/20 rounded-xl p-3 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg min-h-[48px]"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'ذخیره تغییرات جلسه' : 'ایجاد و ثبت جلسه'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
