import React, { useState } from 'react';
import { 
  Session, Character, CharacterParticipation, NPC, LocationEntry, 
  CampaignNote, SessionRecapVisibility, SessionRecapStatus 
} from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { 
  BookOpen, Award, Sparkles, MapPin, User as UserIcon, 
  Scroll, Check, Plus, AlertTriangle, Shield, CheckCircle2 
} from 'lucide-react';

interface SessionClosingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  characters: Character[];
  participations: CharacterParticipation[];
  npcs?: NPC[];
  locations?: LocationEntry[];
  campaignNotes?: CampaignNote[];
  campaign?: any;
  currentUser?: any;
  userRole?: any;
  onCloseSession?: (data: any) => Promise<void>;
  onSubmitClosing?: (data: {
    recap?: {
      title: string;
      body: string;
      visibility?: SessionRecapVisibility;
      status?: SessionRecapStatus;
      linkedNpcIds?: string[];
      linkedLocationIds?: string[];
      linkedQuestIds?: string[];
    };
    xpAward?: {
      amount: number;
      reason?: string;
      isPartyWide?: boolean;
      participationId?: string;
    };
    milestoneLevelUps?: string[];
    highlights?: Array<{
      participationId?: string;
      characterId?: string;
      text: string;
      visibleToPlayer?: boolean;
    }>;
  }) => Promise<void>;
}

export const SessionClosingSheet: React.FC<SessionClosingSheetProps> = ({
  isOpen,
  onClose,
  session,
  characters,
  participations,
  npcs = [],
  locations = [],
  campaignNotes = [],
  onSubmitClosing,
  onCloseSession
}) => {
  const submitHandler = onCloseSession || onSubmitClosing;
  // Step 1: Recap fields
  const [recapTitle, setRecapTitle] = useState(session ? `خلاصه وقایع جلسه ${session.number}: ${session.title}` : '');
  const [recapBody, setRecapBody] = useState('');
  const [visibility, setVisibility] = useState<SessionRecapVisibility>('party');
  const [status, setStatus] = useState<SessionRecapStatus>('published');

  // Step 2: Rewards fields (XP vs Milestone)
  const [rewardMode, setRewardMode] = useState<'xp' | 'milestone' | 'none'>('xp');
  const [xpAmount, setXpAmount] = useState<number>(300);
  const [xpReason, setXpReason] = useState(session ? `پایان جلسه ${session.number}: ${session.title}` : 'پاداش جلسه');
  const [selectedMilestoneParts, setSelectedMilestoneParts] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    participations.forEach(p => { map[p.id] = false; });
    return map;
  });

  // Step 3: Highlights per character
  const [characterHighlights, setCharacterHighlights] = useState<Record<string, { text: string; visible: boolean }>>(() => {
    const map: Record<string, { text: string; visible: boolean }> = {};
    characters.forEach(c => {
      map[c.id] = { text: '', visible: true };
    });
    return map;
  });

  // Step 4: Mentioned entities
  const [linkedNpcIds, setLinkedNpcIds] = useState<string[]>([]);
  const [linkedLocIds, setLinkedLocIds] = useState<string[]>([]);
  const [linkedQuestIds, setLinkedQuestIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleNpc = (id: string) => {
    setLinkedNpcIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleLocation = (id: string) => {
    setLinkedLocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleQuest = (id: string) => {
    setLinkedQuestIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleHighlightChange = (charId: string, text: string) => {
    setCharacterHighlights(prev => ({
      ...prev,
      [charId]: { ...prev[charId], text }
    }));
  };

  const toggleHighlightVisible = (charId: string) => {
    setCharacterHighlights(prev => ({
      ...prev,
      [charId]: { ...prev[charId], visible: !prev[charId]?.visible }
    }));
  };

  const toggleMilestonePart = (partId: string) => {
    setSelectedMilestoneParts(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);

    // Validate recap if title or body is present
    if (recapBody.trim() && !recapTitle.trim()) {
      setErrorMsg('لطفاً عنوان خلاصه جلسه را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {};

      if (recapTitle.trim() && recapBody.trim()) {
        payload.recap = {
          title: recapTitle.trim(),
          body: recapBody.trim(),
          visibility,
          status,
          linkedNpcIds,
          linkedLocationIds: linkedLocIds,
          linkedQuestIds
        };
      }

      if (rewardMode === 'xp' && xpAmount > 0) {
        payload.xpAward = {
          amount: xpAmount,
          reason: xpReason,
          isPartyWide: true
        };
      } else if (rewardMode === 'milestone') {
        const pIds = Object.keys(selectedMilestoneParts).filter(k => selectedMilestoneParts[k]);
        if (pIds.length > 0) {
          payload.milestoneLevelUps = pIds;
        }
      }

      const hlList: any[] = [];
      Object.entries(characterHighlights).forEach(([charId, data]) => {
        if (data.text && data.text.trim()) {
          const part = participations.find(p => p.characterId === charId);
          hlList.push({
            participationId: part?.id,
            characterId: charId,
            text: data.text.trim(),
            visibleToPlayer: data.visible
          });
        }
      });
      if (hlList.length > 0) {
        payload.highlights = hlList;
      }

      if (submitHandler) {
        await submitHandler(payload);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت پایانی جلسه.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="برگه پایانی جلسه (Session Closing Sheet)"
      subtitle={session ? `پایان جلسه ${session.number}: ${session.title}` : 'ثبت خلاصه و پاداش‌های جلسه'}
    >
      <div className="space-y-6 py-2" dir="rtl">
        {errorMsg && (
          <div className="p-3 rounded-[12px] bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: WRITE OR PASTE RECAP */}
        <div className="p-4 rounded-[14px] bg-[#171310] border border-[#2F2A23] space-y-3 card-gold-top">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#E0A030]/15 text-[#E0A030] flex items-center justify-center font-black text-xs">
              ۱
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#EDE6D8]">
              نگارش یا الصاق خلاصه وقایع (Recap)
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#A39A89]">عنوان سرگذشت</label>
            <input
              type="text"
              value={recapTitle}
              onChange={(e) => setRecapTitle(e.target.value)}
              placeholder="مثال: نبرد در دشت ساعت‌ها و کشف بلور زمان"
              className="w-full px-3 py-2.5 rounded-[10px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#A39A89]">شرح وقایع و ماجراها</label>
              <div className="flex items-center gap-1.5 text-[10px] text-[#A39A89]">
                <span>پشتیبانی از پاراگراف‌بندی و نشانه‌گذاری</span>
              </div>
            </div>
            <textarea
              rows={5}
              value={recapBody}
              onChange={(e) => setRecapBody(e.target.value)}
              placeholder="شرح ماجراجویی‌های این جلسه را اینجا بنویسید یا الصاق کنید..."
              className="w-full p-3 rounded-[10px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-[#A39A89] block mb-1">محدوده نمایش</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-[8px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8]"
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
                className="w-full px-2.5 py-2 rounded-[8px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8]"
              >
                <option value="published">انتشار عمومی در کمپین</option>
                <option value="draft">ذخیره به عنوان پیش‌نویس</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: AWARD XP OR MILESTONE LEVEL-UP FLAGS */}
        <div className="p-4 rounded-[14px] bg-[#171310] border border-[#2F2A23] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#E0A030]/15 text-[#E0A030] flex items-center justify-center font-black text-xs">
              ۲
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#EDE6D8]">
              اعطای پاداش پیشرفت (XP یا مایلیستون)
            </h3>
          </div>

          <div className="flex rounded-[10px] bg-[#120F0D] p-1 border border-[#2F2A23]">
            <button
              type="button"
              onClick={() => setRewardMode('xp')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition ${
                rewardMode === 'xp' ? 'bg-[#E0A030] text-[#120F0C]' : 'text-[#A39A89]'
              }`}
            >
              امتیاز تجربه (XP)
            </button>
            <button
              type="button"
              onClick={() => setRewardMode('milestone')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition ${
                rewardMode === 'milestone' ? 'bg-[#E0A030] text-[#120F0C]' : 'text-[#A39A89]'
              }`}
            >
              صعود مایلیستون
            </button>
            <button
              type="button"
              onClick={() => setRewardMode('none')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-[8px] transition ${
                rewardMode === 'none' ? 'bg-[#E0A030] text-[#120F0C]' : 'text-[#A39A89]'
              }`}
            >
              بدون پاداش
            </button>
          </div>

          {rewardMode === 'xp' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-[#A39A89] block mb-1">
                  میزان XP برای هر یک از اعضای گروه
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={xpAmount}
                    onChange={(e) => setXpAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="w-32 px-3 py-2 rounded-[8px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8] font-bold"
                  />
                  <div className="flex items-center gap-1">
                    {[100, 250, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setXpAmount(amt)}
                        className="px-2 py-1.5 rounded-[6px] bg-white/5 hover:bg-white/10 text-[10px] font-bold text-[#E0A030] transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A39A89] block mb-1">دلیل اعطا</label>
                <input
                  type="text"
                  value={xpReason}
                  onChange={(e) => setXpReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#120F0D] border border-[#2F2A23] text-xs text-[#EDE6D8]"
                />
              </div>
            </div>
          )}

          {rewardMode === 'milestone' && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-[#A39A89] block">
                کاراکترهایی که مجوز ارتقای سطح (Level-Up) به آن‌ها اعطا می‌شود را انتخاب کنید:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {participations.map(p => {
                  const char = characters.find(c => c.id === p.characterId);
                  const isChecked = Boolean(selectedMilestoneParts[p.id]);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleMilestonePart(p.id)}
                      className={`p-2.5 rounded-[10px] border flex items-center justify-between transition text-right ${
                        isChecked 
                          ? 'bg-[#E0A030]/15 border-[#E0A030] text-[#EDE6D8]' 
                          : 'bg-[#120F0D] border-[#2F2A23] text-[#A39A89]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                          isChecked ? 'bg-[#E0A030] text-[#120F0C]' : 'border border-[#736A5B]'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#EDE6D8]">{char?.name || p.characterName}</div>
                          <div className="text-[10px] text-[#736A5B]">سطح {p.level} {p.className}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#F2C265]">
                        {isChecked ? 'آماده ارتقا' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: HIGHLIGHTS PER CHARACTER */}
        <div className="p-4 rounded-[14px] bg-[#171310] border border-[#2F2A23] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#E0A030]/15 text-[#E0A030] flex items-center justify-center font-black text-xs">
                ۳
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#EDE6D8]">
                رویدادهای برجسته کاراکترها (Highlights)
              </h3>
            </div>
            <span className="text-[10px] text-[#736A5B]">ثبت خودکار در گاه‌شمار شخصیت</span>
          </div>

          <div className="space-y-3 pt-1">
            {characters.map(char => {
              const hl = characterHighlights[char.id] || { text: '', visible: true };
              return (
                <div key={char.id} className="p-3 rounded-[10px] bg-[#120F0D] border border-[#2F2A23] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#EDE6D8]">{char.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleHighlightVisible(char.id)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded transition ${
                        hl.visible ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {hl.visible ? 'نمایش برای بازیکن' : 'فقط دانجن مستر'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={hl.text}
                    onChange={(e) => handleHighlightChange(char.id, e.target.value)}
                    placeholder="اقدام شجاعانه، دیالوگ ماندگار یا دستاورد شاخص در این جلسه..."
                    className="w-full px-3 py-2 rounded-[8px] bg-[#171310] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: LINK REVEALED ENTITIES */}
        <div className="p-4 rounded-[14px] bg-[#171310] border border-[#2F2A23] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#E0A030]/15 text-[#E0A030] flex items-center justify-center font-black text-xs">
              ۴
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#EDE6D8]">
              پیوند با مکان‌ها، شخصیت‌ها و ماموریت‌ها
            </h3>
          </div>

          {locations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#A39A89] block">مکان‌های مورد بازدید:</span>
              <div className="flex flex-wrap gap-1.5">
                {locations.map(loc => {
                  const sel = linkedLocIds.includes(loc.id);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => toggleLocation(loc.id)}
                      className={`px-2.5 py-1 rounded-[8px] text-[11px] font-medium border flex items-center gap-1 transition ${
                        sel ? 'bg-[#93C48B]/20 text-[#93C48B] border-[#93C48B]' : 'bg-[#120F0D] text-[#A39A89] border-[#2F2A23]'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {npcs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-[#A39A89] block">شخصیت‌های غیربازیکن (NPC) ملاقات‌شده:</span>
              <div className="flex flex-wrap gap-1.5">
                {npcs.map(npc => {
                  const sel = linkedNpcIds.includes(npc.id);
                  return (
                    <button
                      key={npc.id}
                      type="button"
                      onClick={() => toggleNpc(npc.id)}
                      className={`px-2.5 py-1 rounded-[8px] text-[11px] font-medium border flex items-center gap-1 transition ${
                        sel ? 'bg-[#C48BC0]/20 text-[#C48BC0] border-[#C48BC0]' : 'bg-[#120F0D] text-[#A39A89] border-[#2F2A23]'
                      }`}
                    >
                      <UserIcon className="w-3 h-3" />
                      <span>{npc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {campaignNotes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-[#A39A89] block">یادداشت‌ها و خطوط داستانی:</span>
              <div className="flex flex-wrap gap-1.5">
                {campaignNotes.map(note => {
                  const sel = linkedQuestIds.includes(note.id);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => toggleQuest(note.id)}
                      className={`px-2.5 py-1 rounded-[8px] text-[11px] font-medium border flex items-center gap-1 transition ${
                        sel ? 'bg-[#E0A030]/20 text-[#F2C265] border-[#E0A030]' : 'bg-[#120F0D] text-[#A39A89] border-[#2F2A23]'
                      }`}
                    >
                      <Scroll className="w-3 h-3" />
                      <span>{note.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalSubmit}
            className="w-full py-3.5 rounded-[12px] btn-primary-amber font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 min-h-[48px] touch-target"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ثبت و بستن جلسه...' : 'ثبت خلاصه، پاداش‌ها و پایان قطعی جلسه'}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
