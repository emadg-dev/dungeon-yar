import React, { useState } from 'react';
import { 
  MasterCharacter, CharacterHistoryEvent, CharacterParticipation, BackstorySection,
  Campaign, LineageTemplate, BackgroundTemplate, NPC, CharacterRevision, BackstoryComment
} from '../../types';
import { APP_NAME_FA } from '../../config/app';
import { 
  ArrowRight, Shield, Award, Calendar, BookOpen, Clock, Plus, 
  Trash2, Eye, EyeOff, Lock, Sparkles, Check, Edit3, Image, Compass, Printer,
  History, AlertCircle, Skull, ChevronLeft, CheckCircle2, UserCheck, RefreshCw
} from 'lucide-react';
import { BackstoryEditor } from './BackstoryEditor';
import { 
  computeCharacterStats, 
  groupHistoryByCampaign, 
  toPersianDigits, 
  validateLegacyJoin 
} from '../../../shared/rules/historyEngine';

interface MasterCharacterScreenProps {
  character: MasterCharacter;
  history: CharacterHistoryEvent[];
  participations: CharacterParticipation[];
  campaign?: Campaign | null;
  availableCampaigns?: Campaign[];
  lineageTemplate?: LineageTemplate | null;
  backgroundTemplate?: BackgroundTemplate | null;
  allBackgroundTemplates?: BackgroundTemplate[];
  availableNpcs?: NPC[];
  isDm?: boolean;
  onBack: () => void;
  onSaveCharacter: (updated: MasterCharacter) => Promise<void>;
  onAddMilestone: (event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>) => Promise<void>;
  onOpenJoinCampaign: (characterId: string) => void;
  onSelectCampaignParticipation: (campaignId: string, participationId: string) => void;
  onLegacyJoin?: (targetCampaignId: string, notes?: string) => Promise<CharacterParticipation>;
  onLoadRevisions?: () => Promise<CharacterRevision[]>;
  onRestoreRevision?: (revisionId: string) => Promise<MasterCharacter>;
  onToggleReadyForReview?: (ready: boolean) => Promise<MasterCharacter>;
  onLoadComments?: () => Promise<BackstoryComment[]>;
  onCreateComment?: (sectionId: string, body: string) => Promise<BackstoryComment>;
  onResolveComment?: (commentId: string, resolved: boolean) => Promise<BackstoryComment>;
  onReviewBackstory?: (status: 'approved' | 'changes_requested', comment?: string) => Promise<MasterCharacter>;
}

export const MasterCharacterScreen: React.FC<MasterCharacterScreenProps> = ({
  character,
  history,
  participations,
  campaign,
  availableCampaigns = [],
  lineageTemplate,
  backgroundTemplate,
  allBackgroundTemplates = [],
  availableNpcs = [],
  isDm = false,
  onBack,
  onSaveCharacter,
  onAddMilestone,
  onOpenJoinCampaign,
  onSelectCampaignParticipation,
  onLegacyJoin,
  onLoadRevisions,
  onRestoreRevision,
  onToggleReadyForReview,
  onLoadComments,
  onCreateComment,
  onResolveComment,
  onReviewBackstory
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'history' | 'campaigns'>('identity');
  const [charData, setCharData] = useState<MasterCharacter>(character);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New milestone state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  // Legacy Join Modal state
  const [legacyJoinOpen, setLegacyJoinOpen] = useState(false);
  const [selectedTargetCampaignId, setSelectedTargetCampaignId] = useState<string>('');
  const [legacyNotes, setLegacyNotes] = useState('');
  const [legacyJoinError, setLegacyJoinError] = useState<string | null>(null);
  const [isLegacySubmitting, setIsLegacySubmitting] = useState(false);

  // Calculate simple stats
  const stats = computeCharacterStats(participations, history);

  // Build campaign names map for grouping history events
  const campaignNamesMap: Record<string, string> = {};
  if (campaign) campaignNamesMap[campaign.id] = campaign.name;
  participations.forEach(p => {
    if (p.campaignId && p.campaignName) campaignNamesMap[p.campaignId] = p.campaignName;
  });
  availableCampaigns.forEach(c => {
    campaignNamesMap[c.id] = c.name;
  });

  const groupedTimeline = groupHistoryByCampaign(history, campaignNamesMap);

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

  const handleLegacyJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetCampaignId) {
      setLegacyJoinError('لطفاً یک کمپین مقصد را انتخاب کنید.');
      return;
    }

    const targetCamp = availableCampaigns.find(c => c.id === selectedTargetCampaignId);
    if (!targetCamp) {
      setLegacyJoinError('کمپین مقصد یافت نشد.');
      return;
    }

    const validation = validateLegacyJoin(charData, targetCamp, participations);
    if (!validation.valid) {
      setLegacyJoinError(validation.error || 'امکان ورود میراثی به این کمپین وجود ندارد.');
      return;
    }

    if (!onLegacyJoin) {
      setLegacyJoinError('قابلیت ورود میراثی در این حالت در دسترس نیست.');
      return;
    }

    setIsLegacySubmitting(true);
    setLegacyJoinError(null);
    try {
      await onLegacyJoin(selectedTargetCampaignId, legacyNotes.trim());
      setLegacyJoinOpen(false);
      setSelectedTargetCampaignId('');
      setLegacyNotes('');
      setActiveTab('campaigns');
    } catch (err: any) {
      setLegacyJoinError(err?.message || 'خطا در ثبت ورود میراثی.');
    } finally {
      setIsLegacySubmitting(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'joined':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'level_up':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'milestone':
      case 'major_deed':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'session_attendance':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case 'status_change':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'death':
        return <Skull className="w-4 h-4 text-rose-500" />;
      case 'retired':
        return <Lock className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-[#E0A030]" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'joined':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">پیوستن</span>;
      case 'level_up':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">ارتقای سطح</span>;
      case 'milestone':
      case 'major_deed':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-medium">دستاورد / مایلیستون</span>;
      case 'session_attendance':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium">حضور در جلسه</span>;
      case 'status_change':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-medium">تغییر وضعیت</span>;
      case 'death':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">درگذشت</span>;
      case 'retired':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">بازنشستگی</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89] border border-[#2F2A23] font-medium">رویداد</span>;
    }
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-[#131110] border border-[#2F2A23] text-[#A39A89] hover:text-[#F2C265] font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
            title="چاپ شناسنامه و پیشینه در قالب A4"
          >
            <Printer className="w-4 h-4 text-[#E0A030]" />
            <span className="hidden sm:inline">چاپ A4</span>
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

          {/* Simple Aggregate Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#2F2A23]">
            <div className="p-2 rounded-xl bg-[#131110]/80 border border-[#2F2A23] text-center">
              <span className="block text-[10px] text-[#8A8374]">کمپین‌های شرکت‌کرده</span>
              <span className="text-sm font-bold text-[#EDE6D8]">{toPersianDigits(stats.campaignsCount)} کمپین</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131110]/80 border border-[#2F2A23] text-center">
              <span className="block text-[10px] text-[#8A8374]">کل جلسات حضور</span>
              <span className="text-sm font-bold text-[#EDE6D8]">{toPersianDigits(stats.sessionsAttended)} جلسه</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131110]/80 border border-[#2F2A23] text-center">
              <span className="block text-[10px] text-[#8A8374]">بالاترین سطح تجربه</span>
              <span className="text-sm font-bold text-[#F2C265]">سطح {toPersianDigits(stats.highestLevel)}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#131110]/80 border border-[#2F2A23] text-center">
              <span className="block text-[10px] text-[#8A8374]">رویدادهای خط زمانی</span>
              <span className="text-sm font-bold text-[#C9C0AE]">{toPersianDigits(history.length)} رویداد</span>
            </div>
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
          خط زمانی و وقایع ({toPersianDigits(history.length)})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'campaigns'
              ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md'
              : 'text-[#A39A89] hover:text-[#EDE6D8] hover:bg-[#2A2621]/50'
          }`}
        >
          کمپین‌های شخصیت ({toPersianDigits(participations.length)})
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

          {/* Full Backstory Suite (Step 3.5) */}
          <BackstoryEditor
            character={charData}
            campaign={campaign}
            lineageTemplate={lineageTemplate}
            backgroundTemplate={backgroundTemplate}
            allBackgroundTemplates={allBackgroundTemplates}
            availableNpcs={availableNpcs}
            isDm={isDm}
            onUpdateCharacter={async (updated) => {
              setCharData(updated);
              await onSaveCharacter(updated);
            }}
            onLoadRevisions={onLoadRevisions || (async () => [])}
            onRestoreRevision={onRestoreRevision || (async () => charData)}
            onToggleReadyForReview={onToggleReadyForReview || (async (r) => ({ ...charData, readyForReview: r }))}
            onLoadComments={onLoadComments || (async () => [])}
            onCreateComment={onCreateComment || (async () => ({} as any))}
            onResolveComment={onResolveComment || (async () => ({} as any))}
            onReviewBackstory={onReviewBackstory}
            onPrint={() => window.print()}
          />
        </div>
      )}

      {/* Tab 2: History & Milestones Grouped by Campaign */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#EDE6D8] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F2C265]" />
                خط زمانی و تاریخچه وقایع کلان
              </h3>
              <p className="text-xs text-[#8A8374] mt-0.5">
                وقایع، ارتقای سطح، مایلیستون‌ها و حضور در جلسات به تفکیک کمپین‌های بازی
              </p>
            </div>
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

          {groupedTimeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-[#8A8374] mx-auto" />
              <p className="text-xs text-[#A39A89]">هنوز هیچ رویدادی در تاریخچه این شخصیت ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTimeline.map(group => (
                <div key={group.campaignId || 'general'} className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4 shadow-md">
                  {/* Campaign Group Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#2F2A23]">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#F2C265]" />
                      <h4 className="text-sm font-bold text-[#EDE6D8]">{group.campaignName}</h4>
                      {group.isGeneral && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89]">
                          عمومی
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE]">
                      {toPersianDigits(group.eventsCount)} رویداد
                    </span>
                  </div>

                  {/* Events Timeline in this Group */}
                  <div className="relative border-r-2 border-[#E0A030]/25 pr-4 space-y-4 mr-2">
                    {group.events.map((event, idx) => {
                      const dateStr = new Date(event.timestamp).toLocaleDateString('fa-IR');
                      const title = event.payload?.title || event.title || 'رویداد ثبت‌شده';
                      const desc = event.payload?.description || event.description || (event as any).text || '';

                      return (
                        <div key={event.id || idx} className="relative group">
                          {/* Node Icon on timeline */}
                          <div className="absolute -right-[25px] top-1.5 w-4 h-4 rounded-full bg-[#171513] border-2 border-[#E0A030] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E0A030]" />
                          </div>

                          <div className="rounded-xl bg-[#141210] border border-[#2F2A23] p-3.5 space-y-1.5 hover:border-[#E0A030]/40 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {getEventIcon(event.eventType)}
                                <span className="font-bold text-xs text-[#EDE6D8] truncate">
                                  {title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {getEventBadge(event.eventType)}
                                <span className="text-[10px] text-[#8A8374]">{dateStr}</span>
                              </div>
                            </div>

                            {desc && (
                              <p className="text-xs text-[#C9C0AE] leading-relaxed pt-1">
                                {desc}
                              </p>
                            )}

                            {event.payload?.sessionNumber && (
                              <span className="inline-block text-[10px] text-[#E0A030] pt-1">
                                جلسه شماره {toPersianDigits(event.payload.sessionNumber)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Campaign Participations & Legacy Join */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#EDE6D8]">
                حضور در کمپین‌ها ({toPersianDigits(participations.length)})
              </h3>
              <p className="text-xs text-[#8A8374] mt-0.5">
                بازی‌های مستقل که این شخصیت در آن‌ها حضور دارد یا داشته است.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Legacy Join Button */}
              {onLegacyJoin && (
                <button
                  type="button"
                  onClick={() => {
                    setLegacyJoinError(null);
                    setLegacyJoinOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px]"
                  title="ورود میراثی یک شخصیت بازنشسته یا قدیمی به کمپین دیگر"
                >
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span>ورود میراثی (Legacy Join)</span>
                </button>
              )}
              <button
                onClick={() => onOpenJoinCampaign(character.id)}
                className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                پیوستن عادی
              </button>
            </div>
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
                  className="rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-4 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#EDE6D8] group-hover:text-[#F2C265] transition-colors">
                        {part.campaignName || 'کمپین'}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE]">
                        {part.status === 'active' ? '🟢 فعال' : part.status === 'pending_approval' ? '⏳ در انتظار تأیید' : part.status === 'retired' ? '🟡 بازنشسته' : part.status === 'dead' ? '🔴 درگذشته' : part.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A39A89] mt-1">
                      کلاس و سطح: {part.className} (سطح {toPersianDigits(part.level)}) • {toPersianDigits(part.sessionsAttended || 0)} جلسه حضور • جان: {toPersianDigits(part.currentHp)}/{toPersianDigits(part.maxHp)}
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

      {/* Legacy Join Modal Dialog */}
      {legacyJoinOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#171513] border border-purple-500/40 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2F2A23]">
              <div className="flex items-center gap-2 text-purple-300">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-[#EDE6D8]">ورود میراثی به کمپین جدید</h3>
              </div>
              <button
                type="button"
                onClick={() => setLegacyJoinOpen(false)}
                className="text-[#8A8374] hover:text-[#EDE6D8] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#A39A89] leading-relaxed">
              با قابلیت ورود میراثی (Legacy Join)، هویت و خاطرات <strong>{charData.name}</strong> از کمپین پیشین حفظ می‌شود، اما یک وضعیت بازی (Participation) تازه متناسب با قوانین و سطح ورود کمپین مقصد برای وی شکل می‌گیرد.
            </p>

            {legacyJoinError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{legacyJoinError}</span>
              </div>
            )}

            <form onSubmit={handleLegacyJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">انتخاب کمپین مقصد</label>
                <select
                  value={selectedTargetCampaignId}
                  onChange={e => setSelectedTargetCampaignId(e.target.value)}
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:border-purple-400 focus:outline-none min-h-[44px]"
                >
                  <option value="">— یک کمپین را انتخاب کنید —</option>
                  {availableCampaigns
                    .filter(c => c.status !== 'archived')
                    .map(c => {
                      const hasActive = participations.some(p => p.campaignId === c.id && p.status !== 'retired' && p.status !== 'dead');
                      return (
                        <option key={c.id} value={c.id} disabled={hasActive}>
                          {c.name} {hasActive ? '(هم‌اکنون حضور دارد)' : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Target Campaign Info Preview */}
              {selectedTargetCampaignId && (() => {
                const target = availableCampaigns.find(c => c.id === selectedTargetCampaignId);
                if (!target) return null;
                const startLvl = target.settings?.startingLevel || 1;
                const maxLvl = target.settings?.maxEntryLevel || 20;
                const needsAppr = Boolean(target.settings?.approval?.onCreate);

                return (
                  <div className="p-3 rounded-xl bg-[#131110] border border-[#2F2A23] text-xs space-y-1.5 text-[#C9C0AE]">
                    <div className="flex justify-between">
                      <span>سطح شروع کمپین:</span>
                      <span className="font-bold text-[#F2C265]">سطح {toPersianDigits(startLvl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>حداکثر سطح مجاز ورود:</span>
                      <span className="font-bold text-[#EDE6D8]">سطح {toPersianDigits(maxLvl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>نیاز به بررسی دانجن‌مستر:</span>
                      <span className={needsAppr ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {needsAppr ? 'بله (در صف تأیید قرار می‌گیرد)' : 'خیر (ورود مستقیم)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-[#EDE6D8] mb-1.5">یادداشت روایی یا توضیحات ورود میراثی (اختیاری)</label>
                <textarea
                  value={legacyNotes}
                  onChange={e => setLegacyNotes(e.target.value)}
                  rows={2}
                  placeholder="انگیزه ورود به سرزمین نو، ماجراهای فاصله دو کمپین..."
                  className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLegacyJoinOpen(false)}
                  className="px-4 py-2 text-xs text-[#A39A89] hover:text-[#EDE6D8] min-h-[44px]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isLegacySubmitting || !selectedTargetCampaignId}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-all shadow min-h-[44px] flex items-center gap-1.5"
                >
                  {isLegacySubmitting ? 'در حال ثبت...' : 'تأیید ورود میراثی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 RTL Printable Sheet and Backstory (visible only during window.print()) */}
      <div className="hidden print:block font-sans text-black bg-white p-8 leading-relaxed max-w-[210mm] mx-auto" dir="rtl">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-black">{charData.name}</h1>
            <p className="text-xs text-gray-700 mt-1">
              نژاد یا تبار: {charData.race || 'نامشخص'} | وضعیت: {charData.status === 'active' ? 'فعال' : charData.status} | پلتفرم {APP_NAME_FA}
            </p>
            {participations.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                کمپین‌های مرتبط: {participations.map(p => `${p.campaignName || 'کمپین'} (${p.className || 'ماجراجو'} سطح ${p.level})`).join('، ')}
              </p>
            )}
          </div>
          {charData.portraitUrl && (
            <img 
              src={charData.portraitUrl} 
              alt={charData.name} 
              className="w-20 h-20 object-cover border border-black rounded"
            />
          )}
        </div>

        {charData.appearance && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-1.5 text-gray-900">سیمای ظاهری</h2>
            <p className="text-xs text-gray-800 leading-normal whitespace-pre-wrap">{charData.appearance}</p>
          </div>
        )}

        {(charData.backstory?.summary || charData.backstory?.origin) && (
          <div className="mb-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-1.5 text-gray-900">خلاصه پیشینه و خاستگاه</h2>
            {charData.backstory?.summary && (
              <p className="text-xs text-gray-800 whitespace-pre-wrap"><strong>چکیده:</strong> {charData.backstory.summary}</p>
            )}
            {charData.backstory?.origin && (
              <p className="text-xs text-gray-800 whitespace-pre-wrap"><strong>خاستگاه و ریشه‌ها:</strong> {charData.backstory.origin}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
