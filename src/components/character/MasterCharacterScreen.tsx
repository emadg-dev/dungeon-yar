import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, startTransition } from 'react';
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
import { ScrollableRow } from '../ui/ScrollableRow';
import { BottomSheet } from '../mobile/BottomSheet';
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
        return <Compass className="w-4 h-4 text-success" />;
      case 'level_up':
        return <Sparkles className="w-4 h-4 text-primary" />;
      case 'milestone':
      case 'major_deed':
        return <Award className="w-4 h-4 text-role-codm" />;
      case 'session_attendance':
        return <Calendar className="w-4 h-4 text-info" />;
      case 'status_change':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'death':
        return <Skull className="w-4 h-4 text-danger" />;
      case 'retired':
        return <Lock className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-accent" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'joined':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">پیوستن</span>;
      case 'level_up':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">ارتقای سطح</span>;
      case 'milestone':
      case 'major_deed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-role-codm/15 text-role-codm border border-role-codm/30 font-medium">دستاورد / مایلیستون</span>;
      case 'session_attendance':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-info/15 text-info border border-info/30 font-medium">حضور در جلسه</span>;
      case 'status_change':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 font-medium">تغییر وضعیت</span>;
      case 'death':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30 font-medium">درگذشت</span>;
      case 'retired':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">بازنشستگی</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border font-medium">رویداد</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 text-start" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-accent-hover transition-colors p-2 rounded-xl bg-bg border border-border min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به خانه</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-bg border border-border text-text-muted hover:text-accent-hover font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
            title="چاپ شناسنامه و پیشینه در قالب A4"
          >
            <Printer className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">چاپ A4</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1.5 min-h-[44px] shadow-lg shadow-accent/20"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-on-accent" />
                <span>ذخیره شد</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره شناسنامه'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Character Identity Hero Card */}
      <div className="rounded-2xl bg-surface border border-border p-5 shadow-xl flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <img
            src={charData.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
            alt={charData.name}
            loading="lazy"
            decoding="async"
            width={112}
            height={112}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-accent/30 shadow-lg"
          />
        </div>

        <div className="flex-1 text-center sm:text-start space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-accent-hover">{charData.name}</h1>
              <p className="text-xs text-text-muted mt-0.5">{charData.race} | شناسنامه کلان پلتفرم {APP_NAME_FA}</p>
            </div>
            {/* Status Selector */}
            <Select noWrapper
              value={charData.status}
              onChange={e => setCharData({ ...charData, status: e.target.value as any })}
              className="bg-bg border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text-primary self-center sm:self-auto min-h-[44px]"
            >
              <option value="active">🟢 وضعیت: فعال</option>
              <option value="retired">🟡 وضعیت: بازنشسته</option>
              <option value="dead">🔴 وضعیت: درگذشته</option>
              <option value="archived">⚪ وضعیت: بایگانی</option>
            </Select>
          </div>

          {/* Simple Aggregate Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
            <div className="p-2 rounded-xl bg-bg/80 border border-border text-center">
              <span className="block text-xs text-text-muted">کمپین‌های شرکت‌کرده</span>
              <span className="text-sm font-bold text-text-primary">{toPersianDigits(stats.campaignsCount)} کمپین</span>
            </div>
            <div className="p-2 rounded-xl bg-bg/80 border border-border text-center">
              <span className="block text-xs text-text-muted">کل جلسات حضور</span>
              <span className="text-sm font-bold text-text-primary">{toPersianDigits(stats.sessionsAttended)} جلسه</span>
            </div>
            <div className="p-2 rounded-xl bg-bg/80 border border-border text-center">
              <span className="block text-xs text-text-muted">بالاترین سطح تجربه</span>
              <span className="text-sm font-bold text-accent-hover">سطح {toPersianDigits(stats.highestLevel)}</span>
            </div>
            <div className="p-2 rounded-xl bg-bg/80 border border-border text-center">
              <span className="block text-xs text-text-muted">رویدادهای خط زمانی</span>
              <span className="text-sm font-bold text-text-primary">{toPersianDigits(history.length)} رویداد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Strip */}
      <ScrollableRow
        activeKey={activeTab}
        wrapperClassName="rounded-2xl bg-bg/90 border border-border p-1.5"
        className="gap-1.5"
      >
        <Button
          type="button"
          data-key="identity"
          onClick={() => {
            startTransition(() => {
              setActiveTab('identity');
            });
          }}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all min-h-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 flex items-center justify-center ${
            activeTab === 'identity'
              ? 'bg-accent text-on-accent shadow-md font-black'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-2/50'
          }`}
        >
          <span className="whitespace-nowrap shrink-0">هویت و بک‌استوری</span>
        </Button>
        <Button
          type="button"
          data-key="history"
          onClick={() => {
            startTransition(() => {
              setActiveTab('history');
            });
          }}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all min-h-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 flex items-center justify-center ${
            activeTab === 'history'
              ? 'bg-accent text-on-accent shadow-md font-black'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-2/50'
          }`}
        >
          <span className="whitespace-nowrap shrink-0">خط زمانی و وقایع ({toPersianDigits(history.length)})</span>
        </Button>
        <Button
          type="button"
          data-key="campaigns"
          onClick={() => {
            startTransition(() => {
              setActiveTab('campaigns');
            });
          }}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all min-h-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 flex items-center justify-center ${
            activeTab === 'campaigns'
              ? 'bg-accent text-on-accent shadow-md font-black'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-2/50'
          }`}
        >
          <span className="whitespace-nowrap shrink-0">کمپین‌های شخصیت ({toPersianDigits(participations.length)})</span>
        </Button>
      </ScrollableRow>

      {/* Tab 1: Identity & Backstory */}
      {activeTab === 'identity' && (
        <div className="space-y-5">
          {/* Basic Identity Details */}
          <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
            <h3 className="text-sm font-bold text-accent-hover flex items-center gap-2">
              <Shield className="w-4 h-4" />
              شناسنامه پایه‌ای
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">نام شخصیت</label>
                <Input noWrapper
                  type="text"
                  value={charData.name}
                  onChange={e => setCharData({ ...charData, name: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">نژاد یا تبار</label>
                <Input noWrapper
                  type="text"
                  value={charData.race}
                  onChange={e => setCharData({ ...charData, race: e.target.value })}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">نشانی تصویر چهره (URL)</label>
              <Input noWrapper
                type="text"
                value={charData.portraitUrl || ''}
                onChange={e => setCharData({ ...charData, portraitUrl: e.target.value })}
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">توصیف ظاهری و سیمای ماجراجو</label>
              <Textarea noWrapper
                value={charData.appearance || ''}
                onChange={e => setCharData({ ...charData, appearance: e.target.value })}
                rows={2}
                className="w-full bg-bg border border-border rounded-xl p-3 text-xs text-text-primary focus:border-accent focus:outline-none leading-relaxed"
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-hover" />
                خط زمانی و تاریخچه وقایع کلان
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                وقایع، ارتقای سطح، مایلیستون‌ها و حضور در جلسات به تفکیک کمپین‌های بازی
              </p>
            </div>
            <Button
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              className="px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent-hover text-xs font-bold hover:bg-accent/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              افزودن دستاورد شخصی
            </Button>
          </div>

          {showMilestoneForm && (
            <form onSubmit={handleCreateMilestoneSubmit} className="p-4 rounded-2xl bg-surface border border-accent/30 space-y-3">
              <h4 className="text-xs font-bold text-accent-hover">ثبت دستاورد یا واقعه تاریخی جدید</h4>
              <div>
                <Input noWrapper
                  type="text"
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  placeholder="عنوان واقعه (مثلاً شکست دیو آتش در معبد)..."
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <Textarea noWrapper
                  value={newMilestoneDesc}
                  onChange={e => setNewMilestoneDesc(e.target.value)}
                  placeholder="شرح و پیامدهای این واقعه..."
                  rows={2}
                  className="w-full bg-bg border border-border rounded-xl p-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-1.5 bg-accent text-on-accent text-xs font-bold rounded-xl hover:bg-accent-hover"
                >
                  ثبت در خط زمانی
                </Button>
              </div>
            </form>
          )}

          {groupedTimeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg/60 p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs text-text-muted">هنوز هیچ رویدادی در تاریخچه این شخصیت ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTimeline.map(group => (
                <div key={group.campaignId || 'general'} className="rounded-2xl bg-surface border border-border p-5 space-y-4 shadow-md">
                  {/* Campaign Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-accent-hover" />
                      <h4 className="text-sm font-bold text-text-primary">{group.campaignName}</h4>
                      {group.isGeneral && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
                          عمومی
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-2 text-text-primary">
                      {toPersianDigits(group.eventsCount)} رویداد
                    </span>
                  </div>

                  {/* Events Timeline in this Group */}
                  <div className="relative border-r-2 border-accent/25 pe-4 space-y-4 me-2">
                    {group.events.map((event, idx) => {
                      const dateStr = new Date(event.timestamp).toLocaleDateString('fa-IR-u-nu-latn');
                      const title = event.payload?.title || event.title || 'رویداد ثبت‌شده';
                      const desc = event.payload?.description || event.description || (event as any).text || '';

                      return (
                        <div key={event.id || idx} className="relative group">
                          {/* Node Icon on timeline */}
                          <div className="absolute -right-[25px] top-1.5 w-4 h-4 rounded-full bg-surface border-2 border-accent flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                          </div>

                          <div className="rounded-xl bg-bg border border-border p-3.5 space-y-1.5 hover:border-accent/40 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {getEventIcon(event.eventType)}
                                <span className="font-bold text-xs text-text-primary truncate">
                                  {title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {getEventBadge(event.eventType)}
                                <span className="text-xs text-text-muted">{dateStr}</span>
                              </div>
                            </div>

                            {desc && (
                              <p className="text-xs text-text-primary leading-relaxed pt-1">
                                {desc}
                              </p>
                            )}

                            {event.payload?.sessionNumber && (
                              <span className="inline-block text-xs text-accent pt-1">
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
              <h3 className="text-sm font-bold text-text-primary">
                حضور در کمپین‌ها ({toPersianDigits(participations.length)})
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                بازی‌های مستقل که این شخصیت در آن‌ها حضور دارد یا داشته است.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Legacy Join Button */}
              {onLegacyJoin && (
                <Button
                  type="button"
                  onClick={() => {
                    setLegacyJoinError(null);
                    setLegacyJoinOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-role-codm/20 border border-role-codm/40 text-role-codm hover:bg-role-codm/30 text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px]"
                  title="ورود میراثی یک شخصیت بازنشسته یا قدیمی به کمپین دیگر"
                >
                  <RefreshCw className="w-4 h-4 text-role-codm" />
                  <span>ورود میراثی (Legacy Join)</span>
                </Button>
              )}
              <Button
                onClick={() => onOpenJoinCampaign(character.id)}
                className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                پیوستن عادی
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {participations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-bg/60 p-6 text-center space-y-2">
                <p className="text-xs text-text-muted">
                  این شخصیت در حال حاضر در هیچ کمپینی شرکت نکرده است.
                </p>
                <Button
                  onClick={() => onOpenJoinCampaign(character.id)}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs"
                >
                  پیوستن به اولین کمپین
                </Button>
              </div>
            ) : (
              participations.map(part => (
                <div
                  key={part.id}
                  onClick={() => onSelectCampaignParticipation(part.campaignId, part.id)}
                  className="rounded-2xl bg-surface border border-border hover:border-accent/40 p-4 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-2 group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-hover transition-colors">
                        {part.campaignName || 'کمپین'}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-primary">
                        {part.status === 'active' ? '🟢 فعال' : part.status === 'pending_approval' ? '⏳ در انتظار تأیید' : part.status === 'retired' ? '🟡 بازنشسته' : part.status === 'dead' ? '🔴 درگذشته' : part.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      کلاس و سطح: {part.className} (سطح {toPersianDigits(part.level)}) • {toPersianDigits(part.sessionsAttended || 0)} جلسه حضور • جان: {toPersianDigits(part.currentHp)}/{toPersianDigits(part.maxHp)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-accent-hover font-semibold group-hover:translate-x-[-2px] transition-transform">
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
        <BottomSheet
          isOpen={true}
          onClose={() => setLegacyJoinOpen(false)}
          title={
            <div className="flex items-center gap-2 text-role-codm">
              <RefreshCw className="w-5 h-5 text-role-codm" />
              <span>ورود میراثی به کمپین جدید</span>
            </div>
          }
          subtitle={`انتقال کاراکتر ${charData.name} با حفظ هویت و ایجاد حضور تازه`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-start">
            <p className="text-xs text-text-muted leading-relaxed">
              با قابلیت ورود میراثی (Legacy Join)، هویت و خاطرات <strong>{charData.name}</strong> از کمپین پیشین حفظ می‌شود، اما یک وضعیت بازی (Participation) تازه متناسب با قوانین و سطح ورود کمپین مقصد برای وی شکل می‌گیرد.
            </p>

            {legacyJoinError && (
              <div className="p-3 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{legacyJoinError}</span>
              </div>
            )}

            <form onSubmit={handleLegacyJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">انتخاب کمپین مقصد</label>
                <Select noWrapper
                  value={selectedTargetCampaignId}
                  onChange={e => setSelectedTargetCampaignId(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:border-accent focus:outline-none min-h-[44px]"
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
                </Select>
              </div>

              {/* Target Campaign Info Preview */}
              {selectedTargetCampaignId && (() => {
                const target = availableCampaigns.find(c => c.id === selectedTargetCampaignId);
                if (!target) return null;
                const startLvl = target.settings?.startingLevel || 1;
                const maxLvl = target.settings?.maxEntryLevel || 20;
                const needsAppr = Boolean(target.settings?.approval?.onCreate);

                return (
                  <div className="p-3 rounded-xl bg-bg border border-border text-xs space-y-1.5 text-text-primary">
                    <div className="flex justify-between">
                      <span>سطح شروع کمپین:</span>
                      <span className="font-bold text-accent-hover">سطح {toPersianDigits(startLvl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>حداکثر سطح مجاز ورود:</span>
                      <span className="font-bold text-text-primary">سطح {toPersianDigits(maxLvl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>نیاز به بررسی دانجن‌مستر:</span>
                      <span className={needsAppr ? 'text-warning font-bold' : 'text-success'}>
                        {needsAppr ? 'بله (در صف تأیید قرار می‌گیرد)' : 'خیر (ورود مستقیم)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">یادداشت روایی یا توضیحات ورود میراثی (اختیاری)</label>
                <Textarea noWrapper
                  value={legacyNotes}
                  onChange={e => setLegacyNotes(e.target.value)}
                  rows={2}
                  placeholder="انگیزه ورود به سرزمین نو، ماجراهای فاصله دو کمپین..."
                  className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  onClick={() => setLegacyJoinOpen(false)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-text-primary min-h-[44px]"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={isLegacySubmitting || !selectedTargetCampaignId}
                  className="px-5 py-2 rounded-xl bg-role-codm hover:brightness-110 text-on-accent font-bold text-xs disabled:opacity-50 transition-all shadow min-h-[44px] flex items-center gap-1.5"
                >
                  {isLegacySubmitting ? 'در حال ثبت...' : 'تأیید ورود میراثی'}
                </Button>
              </div>
            </form>
          </div>
        </BottomSheet>
      )}

      {/* A4 RTL Printable Sheet and Backstory (visible only during window.print()) */}
      <div className="hidden print:block font-sans text-black bg-white p-8 leading-relaxed max-w-[210mm] mx-auto" dir="rtl">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-text-primary">{charData.name}</h1>
            <p className="text-xs text-text-muted mt-1">
              نژاد یا تبار: {charData.race || 'نامشخص'} | وضعیت: {charData.status === 'active' ? 'فعال' : charData.status} | پلتفرم {APP_NAME_FA}
            </p>
            {participations.length > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                کمپین‌های مرتبط: {participations.map(p => `${p.campaignName || 'کمپین'} (${p.className || 'ماجراجو'} سطح ${p.level})`).join('، ')}
              </p>
            )}
          </div>
          {charData.portraitUrl && (
            <img 
              src={charData.portraitUrl} 
              alt={charData.name} 
              width={80}
              height={80}
              className="w-20 h-20 object-cover border border-border rounded"
            />
          )}
        </div>

        {charData.appearance && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-1.5 text-text-primary">سیمای ظاهری</h2>
            <p className="text-xs text-text-primary leading-normal whitespace-pre-wrap">{charData.appearance}</p>
          </div>
        )}

        {(charData.backstory?.summary || charData.backstory?.origin) && (
          <div className="mb-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-border pb-1 mb-1.5 text-text-primary">خلاصه پیشینه و خاستگاه</h2>
            {charData.backstory?.summary && (
              <p className="text-xs text-text-primary whitespace-pre-wrap"><strong>چکیده:</strong> {charData.backstory.summary}</p>
            )}
            {charData.backstory?.origin && (
              <p className="text-xs text-text-primary whitespace-pre-wrap"><strong>خاستگاه و ریشه‌ها:</strong> {charData.backstory.origin}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
