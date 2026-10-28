import React, { useState, useEffect } from 'react';
import { SessionRecap, Session, Campaign, SessionRecapVisibility, SessionRecapStatus, NPC, LocationEntry, CampaignNote } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { Feather, Save, AlertTriangle, MapPin, User as UserIcon, Scroll, Eye } from 'lucide-react';

interface RecapEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recapToEdit?: SessionRecap | null;
  sessions: Session[];
  campaign: Campaign | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
  onSave: (data: Partial<SessionRecap>) => Promise<void>;
}

export const RecapEditorSheet: React.FC<RecapEditorSheetProps> = ({
  isOpen,
  onClose,
  recapToEdit,
  sessions,
  campaign,
  npcs = [],
  locations = [],
  campaignNotes = [],
  onSave
}) => {
  const [sessionId, setSessionId] = useState(recapToEdit?.sessionId || (sessions[0]?.id || ''));
  const [title, setTitle] = useState(recapToEdit?.title || '');
  const [body, setBody] = useState(recapToEdit?.body || '');
  const [visibility, setVisibility] = useState<SessionRecapVisibility>(recapToEdit?.visibility || 'party');
  const [status, setStatus] = useState<SessionRecapStatus>(recapToEdit?.status || 'published');
  const [linkedNpcIds, setLinkedNpcIds] = useState<string[]>(recapToEdit?.linkedNpcIds || []);
  const [linkedLocIds, setLinkedLocIds] = useState<string[]>(recapToEdit?.linkedLocationIds || []);
  const [linkedQuestIds, setLinkedQuestIds] = useState<string[]>(recapToEdit?.linkedQuestIds || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (recapToEdit) {
      setSessionId(recapToEdit.sessionId);
      setTitle(recapToEdit.title);
      setBody(recapToEdit.body);
      setVisibility(recapToEdit.visibility);
      setStatus(recapToEdit.status);
      setLinkedNpcIds(recapToEdit.linkedNpcIds || []);
      setLinkedLocIds(recapToEdit.linkedLocationIds || []);
      setLinkedQuestIds(recapToEdit.linkedQuestIds || []);
    } else {
      const pastSessions = sessions.filter(s => s.status === 'done');
      const targetSession = pastSessions[pastSessions.length - 1] || sessions[0];
      setSessionId(targetSession?.id || '');
      setTitle(targetSession ? `خلاصه جلسه ${targetSession.number}: ${targetSession.title}` : '');
      setBody('');
      setVisibility('party');
      setStatus('published');
      setLinkedNpcIds([]);
      setLinkedLocIds([]);
      setLinkedQuestIds([]);
    }
  }, [recapToEdit, sessions, isOpen]);

  const toggleNpc = (id: string) => {
    setLinkedNpcIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleLocation = (id: string) => {
    setLinkedLocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleQuest = (id: string) => {
    setLinkedQuestIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('عنوان خلاصه جلسه الزامی است.');
      return;
    }
    if (!body.trim()) {
      setErrorMsg('متن خلاصه جلسه الزامی است.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const targetSess = sessions.find(s => s.id === sessionId);
      await onSave({
        sessionId,
        sessionNumber: targetSess?.number,
        sessionTitle: targetSess?.title,
        title: title.trim(),
        body: body.trim(),
        visibility,
        status,
        linkedNpcIds,
        linkedLocationIds: linkedLocIds,
        linkedQuestIds
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره خلاصه.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={recapToEdit ? 'ویرایش خلاصه جلسه' : 'نگارش خلاصه جلسه'}
      subtitle={`ثبت وقایع در کمپین «${campaign?.name || ''}»`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-[12px] bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#A39A89]">جلسه مربوطه</label>
          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              const found = sessions.find(s => s.id === e.target.value);
              if (found && !title) {
                setTitle(`خلاصه جلسه ${found.number}: ${found.title}`);
              }
            }}
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8]"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                جلسه {s.number}: {s.title} ({s.status === 'done' ? 'برگزارشده' : s.status === 'confirmed' ? 'تأییدشده' : 'برنامه‌ریزی‌شده'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#A39A89]">عنوان سرگذشت</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: نبرد بر فراز برج عقربه‌ها"
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#A39A89]">متن و شرح وقایع</label>
          <textarea
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="رویدادها، پیروزی‌ها، تصمیمات کلیدی و رازهای فاش شده در جلسه را شرح دهید..."
            className="w-full p-3 rounded-[10px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-[#A39A89] block mb-1">محدوده نمایش</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-[8px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8]"
            >
              <option value="party">نمایش برای همه گروه (Party)</option>
              <option value="dm_only">محرمانه دانجن مستر (DM Only)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#A39A89] block mb-1">وضعیت انتشار</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-[8px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8]"
            >
              <option value="published">انتشار در کمپین</option>
              <option value="draft">ذخیره به عنوان پیش‌نویس</option>
            </select>
          </div>
        </div>

        {/* Link Entities */}
        {(locations.length > 0 || npcs.length > 0 || campaignNotes.length > 0) && (
          <div className="p-3 rounded-[10px] bg-[#171310] border border-[#2F2A23] space-y-2">
            <span className="text-[10px] font-bold text-[#A39A89] block">پیوند با مکان‌ها و شخصیت‌ها:</span>
            <div className="flex flex-wrap gap-1.5">
              {locations.slice(0, 8).map(loc => {
                const sel = linkedLocIds.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
                      sel ? 'bg-[#93C48B]/20 text-[#93C48B] border-[#93C48B]' : 'bg-[#120F0D] text-[#A39A89] border-[#2F2A23]'
                    }`}
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{loc.name}</span>
                  </button>
                );
              })}
              {npcs.slice(0, 8).map(npc => {
                const sel = linkedNpcIds.includes(npc.id);
                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => toggleNpc(npc.id)}
                    className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
                      sel ? 'bg-[#C48BC0]/20 text-[#C48BC0] border-[#C48BC0]' : 'bg-[#120F0D] text-[#A39A89] border-[#2F2A23]'
                    }`}
                  >
                    <UserIcon className="w-2.5 h-2.5" />
                    <span>{npc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 min-h-[48px] touch-target"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره خلاصه جلسه'}</span>
        </button>
      </form>
    </BottomSheet>
  );
};
