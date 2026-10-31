import React, { useState } from 'react';
import { Quest, QuestStatus, QuestObjective, QuestRewardRef, NPC, LocationEntry, Character } from '../../types';
import { 
  X, Plus, Trash2, Eye, EyeOff, CheckCircle2, Circle, 
  Sparkles, Award, MapPin, Users, HelpCircle, Save 
} from 'lucide-react';

interface DmQuestEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest?: Quest | null;
  npcs?: NPC[];
  locations?: LocationEntry[];
  partyCharacters?: { id: string; name: string }[];
  onSave: (questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
}

export const DmQuestEditorModal: React.FC<DmQuestEditorModalProps> = ({
  isOpen,
  onClose,
  quest,
  npcs = [],
  locations = [],
  partyCharacters = [],
  onSave,
}) => {
  const isEditing = Boolean(quest && quest.id);

  const [title, setTitle] = useState(quest?.title || '');
  const [description, setDescription] = useState(quest?.description || '');
  const [status, setStatus] = useState<QuestStatus>(quest?.status || 'active');
  const [giverNpcId, setGiverNpcId] = useState<string>(quest?.giverNpcId || '');
  const [locationId, setLocationId] = useState<string>(quest?.locationId || '');
  const [dmNotes, setDmNotes] = useState(quest?.dmNotes || '');
  const [sortIndex, setSortIndex] = useState<number>(quest?.sortIndex || 0);

  // Objectives
  const [objectives, setObjectives] = useState<QuestObjective[]>(
    quest?.objectives && quest.objectives.length > 0
      ? quest.objectives
      : [{ id: 'obj-1', text: '', done: false, visible: true }]
  );

  // Participants: empty array means party-wide (all)
  const [participantIds, setParticipantIds] = useState<string[]>(quest?.participantIds || []);
  const [isPartyWide, setIsPartyWide] = useState<boolean>(!quest?.participantIds || quest.participantIds.length === 0);

  // Rewards
  const [rewardXp, setRewardXp] = useState<number>(quest?.rewardRef?.xp || 0);
  const [rewardNotes, setRewardNotes] = useState<string>(
    quest?.rewardRef?.packageId || (quest?.rewardRef?.itemIds?.join('، ') || '')
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddObjective = () => {
    const nextId = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setObjectives(prev => [...prev, { id: nextId, text: '', done: false, visible: true }]);
  };

  const handleUpdateObjective = (id: string, updates: Partial<QuestObjective>) => {
    setObjectives(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleRemoveObjective = (id: string) => {
    if (objectives.length <= 1) return;
    setObjectives(prev => prev.filter(o => o.id !== id));
  };

  const toggleParticipant = (pId: string) => {
    if (participantIds.includes(pId)) {
      setParticipantIds(prev => prev.filter(id => id !== pId));
    } else {
      setParticipantIds(prev => [...prev, pId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('عنوان مأموریت الزامی است.');
      return;
    }

    const filteredObjectives = objectives
      .map(o => ({ ...o, text: o.text.trim() }))
      .filter(o => o.text.length > 0);

    if (filteredObjectives.length === 0) {
      setErrorMessage('حداقل یک هدف برای مأموریت باید تعیین گردد.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const rewardRef: QuestRewardRef | null = (rewardXp > 0 || rewardNotes.trim()) ? {
        xp: rewardXp > 0 ? Number(rewardXp) : undefined,
        packageId: rewardNotes.trim() ? rewardNotes.trim() : undefined
      } : null;

      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        giverNpcId: giverNpcId || null,
        locationId: locationId || null,
        objectives: filteredObjectives,
        rewardRef,
        dmNotes: dmNotes.trim() || null,
        sortIndex: Number(sortIndex || 0),
        participantIds: isPartyWide ? [] : participantIds
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ذخیره‌سازی مأموریت.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" dir="rtl">
      <div 
        className="w-full sm:max-w-xl bg-[#14120E] border border-[#2F2A23] rounded-t-[20px] sm:rounded-[18px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2F2A23] flex items-center justify-between bg-[#1A1713]">
          <div>
            <h2 className="text-sm font-black text-[#EDE6D8]">
              {isEditing ? 'ویرایش مأموریت' : 'ثبت مأموریت تازه'}
            </h2>
            <p className="text-[11px] text-[#A39A89]">
              ثبت اهداف، اعطاکننده، پاداش‌ها و یادداشت‌های محرمانه دانجن مستر
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] flex items-center justify-center transition touch-target"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#EDE6D8] block">
              عنوان مأموریت <span className="text-[#E0A030]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: یافتن ردپای فرقه نوژان در ویرانه‌ها"
              className="w-full py-2.5 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#A39A89]/60 focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              required
            />
          </div>

          {/* Status & Sort Index */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] block">وضعیت مأموریت</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestStatus)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              >
                <option value="active">در جریان (فعال)</option>
                <option value="hidden">پنهان از بازیکنان (پیش‌نویس)</option>
                <option value="completed">تکمیل شده</option>
                <option value="failed">شکست‌خورده</option>
                <option value="abandoned">رها شده</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] block">اولویت نمایش (ترتیب)</label>
              <input
                type="number"
                value={sortIndex}
                onChange={(e) => setSortIndex(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#EDE6D8] block">شرح مأموریت (برای بازیکنان)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحاتی که پس از آشکارسازی در طومار مأموریت‌ها نمایش داده می‌شود..."
              rows={3}
              className="w-full p-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] placeholder-[#A39A89]/60 focus:outline-none focus:border-[#E0A030] resize-none"
            />
          </div>

          {/* Objectives List */}
          <div className="space-y-2 pt-1 border-t border-[#2F2A23]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#EDE6D8] flex items-center gap-1.5">
                <span>اهداف مأموریت</span>
                <span className="text-[10px] text-[#A39A89]">({objectives.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddObjective}
                className="text-xs font-bold text-[#E0A030] hover:text-[#F2C265] flex items-center gap-1 touch-target py-1 px-2 rounded-[8px] hover:bg-[#E0A030]/10 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>هدف جدید</span>
              </button>
            </div>

            <div className="space-y-2">
              {objectives.map((obj, idx) => (
                <div
                  key={obj.id}
                  className="p-2.5 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {/* Done toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateObjective(obj.id, { done: !obj.done })}
                      className="touch-target p-1 text-[#A39A89] hover:text-[#6F9E78] transition shrink-0"
                      title={obj.done ? 'تکمیل‌شده' : 'ناتمام'}
                    >
                      {obj.done ? (
                        <CheckCircle2 className="w-4 h-4 text-[#6F9E78]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#A39A89]" />
                      )}
                    </button>

                    {/* Objective text */}
                    <input
                      type="text"
                      value={obj.text}
                      onChange={(e) => handleUpdateObjective(obj.id, { text: e.target.value })}
                      placeholder={`هدف شماره ${idx + 1}...`}
                      className="flex-1 py-1 px-2 bg-transparent border-b border-[#2F2A23] focus:border-[#E0A030] text-xs text-[#EDE6D8] focus:outline-none"
                    />

                    {/* Visibility toggle for player */}
                    <button
                      type="button"
                      onClick={() => handleUpdateObjective(obj.id, { visible: !obj.visible })}
                      className={`touch-target p-1 rounded-[6px] transition shrink-0 ${
                        obj.visible ? 'text-[#7FB4D6] hover:bg-[#7FB4D6]/10' : 'text-[#6F675A] hover:bg-[#201D19]'
                      }`}
                      title={obj.visible ? 'آشکار برای بازیکنان' : 'پنهان از دید بازیکنان'}
                    >
                      {obj.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Remove objective */}
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(obj.id)}
                        className="touch-target p-1 text-rose-400 hover:text-rose-300 transition shrink-0"
                        title="حذف هدف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#A39A89] px-1">
                    <span>
                      {obj.visible ? '👁 برای بازیکنان نمایش داده می‌شود' : '🔒 تا زمان کشف مخفی است'}
                    </span>
                    <span>{obj.done ? '✓ محقق شده' : '— در انتظار اقدام'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Giver NPC & Location Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2F2A23]">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#E0A030]" />
                <span>اعطاکننده مأموریت (شخصیت / NPC)</span>
              </label>
              <select
                value={giverNpcId}
                onChange={(e) => setGiverNpcId(e.target.value)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              >
                <option value="">بدون اعطاکننده مشخص</option>
                {npcs.map(npc => (
                  <option key={npc.id} value={npc.id}>
                    {npc.name} ({npc.region || 'زروانیا'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7FB4D6]" />
                <span>مکان مرتبط</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              >
                <option value="">بدون مکان مشخص</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.revealed ? '(آشکار)' : '(پنهان)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Participant Scope: Party-wide vs Character specific */}
          <div className="space-y-2 pt-1 border-t border-[#2F2A23]">
            <label className="text-xs font-black text-[#EDE6D8] block">دامنه مأموریت</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer touch-target py-1">
                <input
                  type="radio"
                  checked={isPartyWide}
                  onChange={() => {
                    setIsPartyWide(true);
                    setParticipantIds([]);
                  }}
                  className="accent-[#E0A030]"
                />
                <span className="text-xs text-[#EDE6D8] font-bold">مأموریت سراسری کل گروه</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer touch-target py-1">
                <input
                  type="radio"
                  checked={!isPartyWide}
                  onChange={() => setIsPartyWide(false)}
                  className="accent-[#E0A030]"
                />
                <span className="text-xs text-[#EDE6D8] font-bold">مختص شخصیت‌های خاص</span>
              </label>
            </div>

            {!isPartyWide && (
              <div className="p-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] space-y-2">
                <p className="text-[11px] text-[#A39A89]">شخصیت‌هایی که این مأموریت برای آنها نمایان خواهد شد:</p>
                <div className="flex flex-wrap gap-2">
                  {partyCharacters.length === 0 ? (
                    <span className="text-xs text-[#6F675A]">شخصیت فعالی در کمپین یافت نشد.</span>
                  ) : (
                    partyCharacters.map(char => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => toggleParticipant(char.id)}
                        className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                          participantIds.includes(char.id)
                            ? 'bg-[#E0A030] text-[#0E0D0C]'
                            : 'bg-[#201D19] text-[#A39A89] border border-[#2F2A23]'
                        }`}
                      >
                        <span>{char.name}</span>
                        {participantIds.includes(char.id) && <span>✓</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reward Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2F2A23]">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#6F9E78]" />
                <span>پاداش تجربه (XP)</span>
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={rewardXp}
                onChange={(e) => setRewardXp(Number(e.target.value))}
                placeholder="مثال: 500"
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#E0A030]" />
                <span>شرح پاداش تکمیلی یا اشیاء</span>
              </label>
              <input
                type="text"
                value={rewardNotes}
                onChange={(e) => setRewardNotes(e.target.value)}
                placeholder="مثال: قطب‌نمای کهن + ۵۰ سکه طلا"
                className="w-full py-2 px-3 rounded-[10px] bg-[#1A1713] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              />
            </div>
          </div>

          {/* DM Secret Notes */}
          <div className="space-y-1.5 pt-1 border-t border-[#2F2A23]">
            <label className="text-xs font-black text-[#E0A030] flex items-center gap-1.5">
              <span>یادداشت محرمانه دانجن مستر (DM Notes)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#E0A030]/20 text-[#E0A030] font-normal">
                هرگز به بازیکنان ارسال نمی‌شود
              </span>
            </label>
            <textarea
              value={dmNotes}
              onChange={(e) => setDmNotes(e.target.value)}
              placeholder="نکات پشت پرده داستان، شروط مخفی پیروزی، سرنخ‌های بعدی، تله‌ها و نکات اجرای مأموریت..."
              rows={3}
              className="w-full p-3 rounded-[10px] bg-[#1A1713] border border-[#E0A030]/30 text-xs text-[#EDE6D8] placeholder-[#A39A89]/60 focus:outline-none focus:border-[#E0A030] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2F2A23] flex items-center justify-end gap-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-2.5 px-4 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs font-bold text-[#A39A89] hover:text-[#EDE6D8] transition touch-target min-h-[44px]"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 rounded-[12px] bg-gradient-to-l from-[#C97B4A] to-[#E0A030] text-[#0E0D0C] text-xs font-black shadow-lg hover:brightness-110 transition flex items-center gap-1.5 touch-target min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'در حال ذخیره‌سازی...' : (isEditing ? 'ذخیره تغییرات' : 'ثبت مأموریت')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
