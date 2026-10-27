import React, { useState } from 'react';
import { MasterCharacter, CharacterHistoryEvent, CharacterParticipation, BackstorySection } from '../../types';
import { APP_NAME_FA } from '../../config/app';
import { 
  ArrowRight, Shield, Award, Calendar, BookOpen, Clock, Plus, 
  Trash2, Eye, EyeOff, Lock, Sparkles, Check, Edit3, Image, Compass 
} from 'lucide-react';

interface MasterCharacterScreenProps {
  character: MasterCharacter;
  history: CharacterHistoryEvent[];
  participations: CharacterParticipation[];
  onBack: () => void;
  onSaveCharacter: (updated: MasterCharacter) => Promise<void>;
  onAddMilestone: (event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>) => Promise<void>;
  onOpenJoinCampaign: (characterId: string) => void;
  onSelectCampaignParticipation: (campaignId: string, participationId: string) => void;
}

export const MasterCharacterScreen: React.FC<MasterCharacterScreenProps> = ({
  character,
  history,
  participations,
  onBack,
  onSaveCharacter,
  onAddMilestone,
  onOpenJoinCampaign,
  onSelectCampaignParticipation
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'history' | 'campaigns'>('identity');
  const [charData, setCharData] = useState<MasterCharacter>(character);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New milestone state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveCharacter(charData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    const newSection: BackstorySection = {
      id: `sec-${Date.now()}`,
      title: 'بخش جدید پیشینه',
      text: '',
      shareWithParty: false
    };
    setCharData(prev => ({
      ...prev,
      backstory: {
        ...prev.backstory,
        sections: [...(prev.backstory?.sections || []), newSection]
      }
    }));
  };

  const handleUpdateSection = (id: string, updates: Partial<BackstorySection>) => {
    setCharData(prev => ({
      ...prev,
      backstory: {
        ...prev.backstory,
        sections: (prev.backstory?.sections || []).map(sec => 
          sec.id === id ? { ...sec, ...updates } : sec
        )
      }
    }));
  };

  const handleDeleteSection = (id: string) => {
    setCharData(prev => ({
      ...prev,
      backstory: {
        ...prev.backstory,
        sections: (prev.backstory?.sections || []).filter(sec => sec.id !== id)
      }
    }));
  };

  const handleCreateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    await onAddMilestone({
      characterId: character.id,
      campaignId: null,
      eventType: 'major_deed',
      payload: {
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim()
      }
    });

    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setShowMilestoneForm(false);
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#A39A89] hover:text-[#F2C265] transition-colors p-2 rounded-xl bg-[#131110] border border-[#2F2A23] min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به خانه</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs hover:bg-[#F2C265] disabled:opacity-50 transition-colors flex items-center gap-1.5 min-h-[44px] shadow-lg shadow-[#E0A030]/20"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-[#0E0D0C]" />
              <span>ذخیره شد</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره شناسنامه'}</span>
            </>
          )}
        </button>
      </div>

      {/* Character Identity Hero Card */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 shadow-xl flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <img
            src={charData.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
            alt={charData.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#E0A030]/30 shadow-lg"
          />
        </div>

        <div className="flex-1 text-center sm:text-right space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F2C265]">{charData.name}</h1>
              <p className="text-xs text-[#A39A89] mt-0.5">{charData.race} | شناسنامه کلان پلتفرم {APP_NAME_FA}</p>
            </div>
            {/* Status Selector */}
            <select
              value={charData.status}
              onChange={e => setCharData({ ...charData, status: e.target.value as any })}
              className="bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#EDE6D8] self-center sm:self-auto min-h-[44px]"
            >
              <option value="active">🟢 وضعیت: فعال</option>
              <option value="retired">🟡 وضعیت: بازنشسته</option>
              <option value="dead">🔴 وضعیت: درگذشته</option>
              <option value="archived">⚪ وضعیت: بایگانی</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 border-t border-[#2F2A23]">
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#201D19]/80 text-[#C9C0AE]">
              حضور در {participations.length} کمپین
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#201D19]/80 text-[#C9C0AE]">
              {history.length} رویداد در تاریخچه
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Strip */}
      <div className="flex rounded-2xl bg-[#131110]/90 border border-[#2F2A23] p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'identity'
              ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
              : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621]/50'
          }`}
        >
          هویت و بک‌استوری
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'history'
              ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
              : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621]/50'
          }`}
        >
          تاریخچه و وقایع
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'campaigns'
              ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
              : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621]/50'
          }`}
        >
          کمپین‌های شخصیت
        </button>
      </div>

      {/* Tab 1: Identity & Backstory */}
      {activeTab === 'identity' && (
        <div className="space-y-5">
          {/* Basic Identity Details */}
          <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              شناسنامه پایه‌ای
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">نام شخصیت</label>
                <input
                  type="text"
                  value={charData.name}
                  onChange={e => setCharData({ ...charData, name: e.target.value })}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-2 text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">نژاد یا تبار</label>
                <input
                  type="text"
                  value={charData.race}
                  onChange={e => setCharData({ ...charData, race: e.target.value })}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-2 text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A39A89] mb-1">نشانی تصویر چهره (URL)</label>
              <input
                type="text"
                value={charData.portraitUrl || ''}
                onChange={e => setCharData({ ...charData, portraitUrl: e.target.value })}
                className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-[#A39A89] mb-1">توصیف ظاهری و سیمای ماجراجو</label>
              <textarea
                value={charData.appearance || ''}
                onChange={e => setCharData({ ...charData, appearance: e.target.value })}
                rows={2}
                className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none leading-relaxed"
                placeholder="قد، جثه، رنگ چشم، زخم‌ها، پوشش و سلاح‌های آویخته..."
              />
            </div>
          </div>

          {/* Personality & Pillars */}
          <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              ارکان شخصیتی و روحی
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">ویژگی‌های رفتاری (Personality Traits)</label>
                <textarea
                  value={charData.backstory?.personality?.traits || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      personality: { ...(charData.backstory?.personality || { traits: '', ideals: '', bonds: '', flaws: '' }), traits: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">آرمان‌ها و باورها (Ideals)</label>
                <textarea
                  value={charData.backstory?.personality?.ideals || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      personality: { ...(charData.backstory?.personality || { traits: '', ideals: '', bonds: '', flaws: '' }), ideals: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">پیمان‌ها و دلبستگی‌ها (Bonds)</label>
                <textarea
                  value={charData.backstory?.personality?.bonds || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      personality: { ...(charData.backstory?.personality || { traits: '', ideals: '', bonds: '', flaws: '' }), bonds: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A39A89] mb-1">نقایص و هراس‌ها (Flaws)</label>
                <textarea
                  value={charData.backstory?.personality?.flaws || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      personality: { ...(charData.backstory?.personality || { traits: '', ideals: '', bonds: '', flaws: '' }), flaws: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Structured Backstory Sections */}
          <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                بخش‌های ساختاریافته پیشینه
              </h3>
              <button
                onClick={handleAddSection}
                className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                افزودن بخش
              </button>
            </div>

            <div className="space-y-3">
              {(charData.backstory?.sections || []).length === 0 ? (
                <p className="text-xs text-[#8A8374] text-center py-4 border border-dashed border-[#2F2A23] rounded-xl">
                  هنوز بخشی برای پیشینه افزوده نشده است.
                </p>
              ) : (
                charData.backstory.sections.map(section => (
                  <div key={section.id} className="p-4 rounded-xl bg-[#131110]/80 border border-[#2F2A23] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => handleUpdateSection(section.id, { title: e.target.value })}
                        className="bg-transparent text-sm font-bold text-[#F2C265] focus:outline-none flex-1 border-b border-transparent focus:border-[#E0A030]"
                        placeholder="عنوان بخش (مثلاً دوران کودکی در ورنا)..."
                      />
                      <div className="flex items-center gap-2">
                        {/* Share with party toggle */}
                        <button
                          type="button"
                          onClick={() => handleUpdateSection(section.id, { shareWithParty: !section.shareWithParty })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors min-h-[36px] ${
                            section.shareWithParty
                              ? 'bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30'
                              : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                          }`}
                        >
                          {section.shareWithParty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{section.shareWithParty ? 'مشترک با یاران' : 'فقط دانجن مستر'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-[#D66138] hover:bg-[#C2512B]/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={section.text}
                      onChange={e => handleUpdateSection(section.id, { text: e.target.value })}
                      rows={3}
                      className="w-full bg-[#0E0D0C]/60 border border-[#2F2A23] rounded-lg p-2.5 text-xs text-[#C9C0AE] focus:outline-none focus:border-[#E0A030] leading-relaxed"
                      placeholder="متن رویدادها، جزئیات گذشته یا خاطرات..."
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DM-Only Secrets & Hooks */}
          <div className="rounded-2xl bg-[#1A1210] border border-[#C2512B]/20 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#E8836B] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D66138]" />
              رازها و قلاب‌های داستانی محرمانه (فقط دانجن مستر)
            </h3>
            <p className="text-xs text-[#E8836B]/60">
              این بخش هرگز به دیگر بازیکنان نشان داده نمی‌شود؛ سرور این فیلدها را برای بازیکنان سانسور می‌کند.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#E8836B]/80 mb-1">رازهای مگو (Secrets)</label>
                <textarea
                  value={charData.backstory?.dmOnly?.secrets || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      dmOnly: { ...(charData.backstory?.dmOnly || { secrets: '', hooks: '' }), secrets: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#C2512B]/60 rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#C2512B] focus:outline-none"
                  placeholder="رازی تاریک از گذشته یا اصل و نسب..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#E8836B]/80 mb-1">قلاب‌های داستانی (Plot Hooks)</label>
                <textarea
                  value={charData.backstory?.dmOnly?.hooks || ''}
                  onChange={e => setCharData({
                    ...charData,
                    backstory: {
                      ...charData.backstory,
                      dmOnly: { ...(charData.backstory?.dmOnly || { secrets: '', hooks: '' }), hooks: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full bg-[#131110] border border-[#C2512B]/60 rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#C2512B] focus:outline-none"
                  placeholder="انگیزه‌های شخصی که DM می‌تواند در ماجرا دخالت دهد..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: History & Milestones */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#EDE6D8] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F2C265]" />
              خط زمانی و وقایع ثبت‌شده در جهان‌ها
            </h3>
            <button
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              افزودن دستاورد شخصی
            </button>
          </div>

          {showMilestoneForm && (
            <form onSubmit={handleCreateMilestoneSubmit} className="p-4 rounded-2xl bg-[#171513] border border-[#E0A030]/30 space-y-3">
              <h4 className="text-xs font-bold text-[#F2C265]">ثبت دستاورد یا واقعه تاریخی جدید</h4>
              <div>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  placeholder="عنوان واقعه (مثلاً شکست دیو آتش در معبد)..."
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>
              <div>
                <textarea
                  value={newMilestoneDesc}
                  onChange={e => setNewMilestoneDesc(e.target.value)}
                  placeholder="شرح و پیامدهای این واقعه..."
                  rows={2}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="px-3 py-1.5 text-xs text-[#A39A89] hover:text-[#EDE6D8]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E0A030] text-[#0E0D0C] text-xs font-bold rounded-xl hover:bg-[#F2C265]"
                >
                  ثبت در خط زمانی
                </button>
              </div>
            </form>
          )}

          {/* Timeline List */}
          <div className="relative border-r-2 border-[#E0A030]/20 pr-4 space-y-6 mr-2">
            {history.length === 0 ? (
              <p className="text-xs text-[#8A8374] py-4">هنوز رویدادی در تاریخچه ثبت نشده است.</p>
            ) : (
              history.map((event, idx) => {
                const dateStr = new Date(event.timestamp).toLocaleDateString('fa-IR');
                return (
                  <div key={event.id || idx} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -right-[23px] top-1.5 w-3 h-3 rounded-full bg-[#E0A030] ring-4 ring-[#0E0D0C]" />
                    <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-4 space-y-1.5 hover:border-[#E0A030]/30 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#F2C265]">
                          {event.payload?.title || 'رویداد'}
                        </span>
                        <span className="text-[10px] text-[#8A8374]">{dateStr}</span>
                      </div>
                      {event.campaignName && (
                        <div className="text-[11px] text-[#A39A89] flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#E0A030]" />
                          <span>کمپین: {event.campaignName}</span>
                        </div>
                      )}
                      <p className="text-xs text-[#C9C0AE] leading-relaxed">
                        {event.payload?.description || (event as any).text || ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Campaign Participations */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#EDE6D8]">
              حضور در کمپین‌ها ({participations.length})
            </h3>
            <button
              onClick={() => onOpenJoinCampaign(character.id)}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              پیوستن به کمپین جدید
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {participations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-6 text-center space-y-2">
                <p className="text-xs text-[#A39A89]">
                  این شخصیت در حال حاضر در هیچ کمپینی شرکت نکرده است.
                </p>
                <button
                  onClick={() => onOpenJoinCampaign(character.id)}
                  className="px-4 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs"
                >
                  پیوستن به اولین کمپین
                </button>
              </div>
            ) : (
              participations.map(part => (
                <div
                  key={part.id}
                  onClick={() => onSelectCampaignParticipation(part.campaignId, part.id)}
                  className="rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-4 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#EDE6D8] group-hover:text-[#F2C265] transition-colors">
                        {part.campaignName || 'کمپین'}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE]">
                        {part.status === 'active' ? '🟢 فعال' : part.status === 'pending_approval' ? '⏳ در انتظار تأیید' : part.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A39A89] mt-1">
                      کلاس و سطح: {part.className} (سطح {part.level}) | جان: {part.currentHp}/{part.maxHp}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#F2C265] font-semibold group-hover:translate-x-[-2px] transition-transform">
                    <span>ورود به کاراکترشیت</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
