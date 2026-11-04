import React, { useState, startTransition, useRef, useEffect } from 'react';
import { Campaign, MasterCharacter, CampaignInvite, User, CharacterParticipation } from '../../types';
import { APP_NAME_FA } from '../../config/app';
import { 
  Plus, Compass, Users, Scroll, CheckCircle2, Shield, Sparkles, 
  ChevronLeft, Award, Clock, ArrowRight, UserCheck, Wand2, History,
  Archive, AlertCircle, Eye
} from 'lucide-react';
import { toPersianDigits, partitionCampaigns, calculateCountdown } from '../../../shared/rules/historyEngine';
import { ScrollableRow } from '../ui/ScrollableRow';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface HomeScreenProps {
  currentUser: User | null;
  myCampaigns: Campaign[];
  myCharacters: MasterCharacter[];
  pendingInvites: CampaignInvite[];
  pendingApprovals: any[];
  draftParticipations?: CharacterParticipation[];
  isLoading?: boolean;
  initialInviteCode?: string;
  onSelectCampaign: (campaignId: string) => void;
  onOpenCreateCampaign: () => void;
  onOpenCharacterMaster: (characterId: string) => void;
  onOpenCreateCharacter: () => void;
  onOpenCharacterWizard?: (campaignId?: string) => void;
  onResumeDraft?: (draft: CharacterParticipation) => void;
  onOpenApprovals: () => void;
  onAcceptInvite: (code: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  myCampaigns,
  myCharacters,
  pendingInvites,
  pendingApprovals,
  draftParticipations = [],
  isLoading = false,
  initialInviteCode = '',
  onSelectCampaign,
  onOpenCreateCampaign,
  onOpenCharacterMaster,
  onOpenCreateCharacter,
  onOpenCharacterWizard,
  onResumeDraft,
  onOpenApprovals,
  onAcceptInvite
}) => {
  const [inviteInput, setInviteInput] = useState(initialInviteCode);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [campaignTab, setCampaignTab] = useState<'current' | 'past'>('current');

  useEffect(() => {
    if (initialInviteCode) {
      setInviteInput(initialInviteCode);
    }
  }, [initialInviteCode]);

  // Partition campaigns into active/current and past/archived
  const { current: currentCampaigns, past: pastCampaigns } = partitionCampaigns(myCampaigns);
  const draftCampaigns = currentCampaigns.filter(c => c.status === 'draft');
  const activeCampaigns = currentCampaigns.filter(c => c.status !== 'draft');

  const displayedCampaigns = campaignTab === 'current' ? activeCampaigns : pastCampaigns;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent-hover border border-accent/30 font-medium">مالک کمپین</span>;
      case 'co_dm':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-role-codm/20 text-role-codm border border-role-codm/30 font-medium">دستیار دانجن مستر</span>;
      case 'spectator':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-surface-2 text-text-primary border border-border-strong font-medium">تماشاچی</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-success/20 text-success border border-success/30 font-medium">ماجراجو</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="w-2.5 h-2.5 rounded-full bg-success shadow-glow-heal animate-pulse shrink-0" title="کمپین فعال" />;
      case 'paused':
        return <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" title="متوقف شده" />;
      case 'archived':
        return <span className="w-2.5 h-2.5 rounded-full bg-surface-3 shrink-0" title="بایگانی شده" />;
      default:
        return null;
    }
  };

  const getCharacterStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-success/15 text-success border border-success/30 font-bold">فعال</span>;
      case 'retired':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">بازنشسته</span>;
      case 'dead':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-danger/15 text-danger border border-danger/30 font-bold">درگذشته</span>;
      case 'archived':
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-surface-2 text-text-muted border border-border font-bold">بایگانی</span>;
    }
  };

  return (
    <div className="space-y-6 pb-4 text-start" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-surface-2/40 via-surface to-bg border border-accent/20 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-hover border border-accent/30">
                پلتفرم چندکمپینی {APP_NAME_FA} ۵e
              </span>
              {currentUser?.platformRole === 'admin' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-role-codm/20 text-role-codm border border-role-codm/30">
                  مدیر سیستم
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-accent-hover mt-2">
              خوش آمدید، {currentUser?.displayName || currentUser?.name || 'ماجراجو'}
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-lg leading-relaxed">
              پلتفرم مدیریت بازی رومیزی، شناسنامه و پیشینه مشترک شخصیت‌ها، و ورود به جهان‌های مستقل ماجراجویی.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center text-accent-hover shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
        </div>

        {/* DM Pending Approvals Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-accent/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-hover animate-ping" />
              <span className="text-sm font-semibold text-accent-hover">
                {toPersianDigits(pendingApprovals.length)} درخواست تأیید در انتظار بررسی دانجن مستر
              </span>
            </div>
            <Button
              onClick={onOpenApprovals}
              className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1 shadow"
            >
              بررسی صف تأیید
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-surface-2 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-36 bg-surface rounded-2xl border border-border" />
            <div className="h-36 bg-surface rounded-2xl border border-border" />
          </div>
        </div>
      )}

      {/* Draft Campaigns Section (Phase 2 Wizard Drafts) */}
      {!isLoading && draftCampaigns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-hover" />
            <h2 className="text-lg font-bold text-text-primary">پیش‌نویس‌ها (در حال ساخت)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-hover border border-accent/30 font-bold">
              {toPersianDigits(draftCampaigns.length)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftCampaigns.map(draft => {
              const completedCount = draft.wizardState?.completed?.length || 1;
              const percent = Math.round((completedCount / 8) * 100);
              return (
                <div
                  key={draft.id}
                  className="rounded-2xl bg-surface border border-accent/30 p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-text-primary truncate">{draft.name}</h3>
                      <span className="text-xs text-accent font-bold">گام {toPersianDigits(completedCount)} از ۸</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {draft.description || 'کمپین در حال طراحی و تنظیم جهان بازی...'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-text-muted">{toPersianDigits(percent)}٪ تکمیل شده</span>
                    <Button
                      onClick={() => onSelectCampaign(draft.id)}
                      className="px-3 py-1 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-colors"
                    >
                      ادامه ویزارد
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaigns Section with Current / Past Tabs */}
      {!isLoading && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-hover" />
              <h2 className="text-lg font-bold text-text-primary">کمپین‌های من</h2>
            </div>

            <ScrollableRow activeKey={campaignTab} className="gap-2 shrink-0">
              {/* Current vs Past Tabs */}
              <div className="flex items-center p-1 bg-bg border border-border rounded-xl text-xs shrink-0">
                <Button
                  type="button"
                  data-key="current"
                  onClick={() => {
                    startTransition(() => {
                      setCampaignTab('current');
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 min-h-[44px] whitespace-nowrap shrink-0 snap-start ${
                    campaignTab === 'current'
                      ? 'bg-accent/15 text-accent-hover border border-accent/40 shadow-sm'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap shrink-0">جاری</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full shrink-0 ${campaignTab === 'current' ? 'bg-accent/25 text-accent-hover' : 'bg-surface-2 text-text-muted'}`}>
                    {toPersianDigits(activeCampaigns.length)}
                  </span>
                </Button>
                <Button
                  type="button"
                  data-key="past"
                  onClick={() => {
                    startTransition(() => {
                      setCampaignTab('past');
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 min-h-[44px] whitespace-nowrap shrink-0 snap-start ${
                    campaignTab === 'past'
                      ? 'bg-accent/15 text-accent-hover border border-accent/40 shadow-sm'
                      : 'text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap shrink-0">گذشته / بایگانی</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full shrink-0 ${campaignTab === 'past' ? 'bg-accent/25 text-accent-hover' : 'bg-surface-2 text-text-muted'}`}>
                    {toPersianDigits(pastCampaigns.length)}
                  </span>
                </Button>
              </div>

              <Button
                type="button"
                onClick={onOpenCreateCampaign}
                className="px-3.5 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent-hover text-xs font-bold hover:bg-accent/25 transition-colors flex items-center gap-1.5 min-h-[44px] whitespace-nowrap shrink-0 snap-start"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap shrink-0">کمپین جدید</span>
              </Button>
            </ScrollableRow>
          </div>

          {displayedCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg/60 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent-hover flex items-center justify-center mx-auto">
                {campaignTab === 'current' ? <Compass className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                {campaignTab === 'current' ? 'شما هنوز عضو هیچ کمپین فعالی نیستید' : 'هیچ کمپین بایگانی‌شده یا خاتمه‌یافته‌ای وجود ندارد'}
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                {campaignTab === 'current' 
                  ? 'می‌توانید یک کمپین جدید بر پایه قوانین زروانیا یا D&D 5e بسازید یا با کد دعوتی که دانجن مستر داده وارد شوید.'
                  : 'کمپین‌هایی که بایگانی شده یا از آن‌ها خارج شده‌اید در این بخش به عنوان تاریخچه فقط خواندنی نمایش داده می‌شوند.'}
              </p>
              {campaignTab === 'current' && (
                <Button
                  onClick={onOpenCreateCampaign}
                  className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-sm hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
                >
                  ساخت اولین کمپین
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedCampaigns.map(camp => {
                const isPast = campaignTab === 'past' || camp.isReadOnly || camp.status === 'archived';
                const countdown = camp.nextSession?.scheduledAt 
                  ? calculateCountdown(camp.nextSession.scheduledAt) 
                  : camp.nextSession?.countdown;

                return (
                  <div
                    key={camp.id}
                    onClick={() => onSelectCampaign(camp.id)}
                    className="group relative overflow-hidden rounded-2xl bg-surface border border-border hover:border-accent/40 p-5 transition-all cursor-pointer shadow-lg hover:shadow-surface-2/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="mt-1 shrink-0">{getStatusBadge(camp.status)}</span>
                          <h3 className="text-base font-bold text-text-primary group-hover:text-accent-hover transition-colors line-clamp-2 leading-snug">
                            {camp.name}
                          </h3>
                        </div>
                        {typeof camp.unreadCount === 'number' && camp.unreadCount > 0 && (
                          <div className="shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-danger/20 text-danger border border-danger/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping" />
                              {toPersianDigits(camp.unreadCount)} تازه
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                        {camp.description || 'ماجراجویی در آستانه زمان و رازهای اساطیری زروانیا.'}
                      </p>

                      {/* Next Session Countdown (Active campaigns) */}
                      {!isPast && camp.nextSession && (
                        <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 gap-2 px-3 py-1.5 rounded-xl text-xs border ${
                          countdown?.isImminent
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-surface-2 border-border text-accent-hover'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${countdown?.isImminent ? 'text-primary animate-spin' : 'text-accent'}`} />
                            <span className="truncate font-medium">
                              جلسه {toPersianDigits(camp.nextSession.number)}: {countdown?.text || new Date(camp.nextSession.scheduledAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          {countdown?.isImminent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-on-accent font-black shrink-0">
                              به‌زودی!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Character Final State (Past / Archived campaigns) */}
                      {isPast && camp.finalCharacterState && (
                        <div className="mt-3 p-3 rounded-xl bg-bg border border-border text-xs space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-text-primary">
                              {camp.finalCharacterState.characterName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-accent-hover border border-border">
                              سطح {toPersianDigits(camp.finalCharacterState.level)} • {camp.finalCharacterState.className}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted pt-1">
                            <span>وضعیت: {camp.finalCharacterState.status === 'dead' ? 'درگذشته' : camp.finalCharacterState.status === 'retired' ? 'بازنشسته' : 'فعال'}</span>
                            <span>{toPersianDigits(camp.finalCharacterState.sessionsAttended)} جلسه حضور</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {isPast ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-surface-2 text-text-muted border border-border">
                            فقط خواندنی
                          </span>
                        ) : (
                          getRoleBadge(camp.myRole)
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-text-muted" />
                          {toPersianDigits(camp.memberCount || 1)} عضو
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-text-muted" />
                          {toPersianDigits(camp.characterCount || 0)} شخصیت
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-accent-hover font-medium group-hover:translate-x-[-2px] transition-transform">
                        <span>{isPast ? 'مشاهده سوابق کمپین' : 'ورود به میز بازی'}</span>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Draft Character Participations Section (Step 3.3 Wizard Drafts) */}
      {!isLoading && draftParticipations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-hover" />
            <h2 className="text-lg font-bold text-text-primary">پیش‌نویس کاراکترها (در حال ساخت)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-hover border border-accent/30 font-bold">
              {toPersianDigits(draftParticipations.length)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftParticipations.map(draft => {
              const camp = myCampaigns.find(c => c.id === draft.campaignId);
              const char = myCharacters.find(c => c.id === draft.characterId);
              const step = draft.build?.step || 1;
              const percent = Math.round((step / 8) * 100);
              const displayName = char?.name || draft.build?.masterData?.name || 'کاراکتر در حال ساخت';
              const displayClass = draft.className || 'کلاس مشخص‌نشده';

              return (
                <div
                  key={draft.id}
                  className="rounded-2xl bg-surface border border-accent/30 p-4 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-accent/20 text-accent-hover border border-accent/30 font-bold shrink-0">
                          پیش‌نویس کاراکتر
                        </span>
                        <h3 className="text-sm font-bold text-text-primary truncate">
                          {displayName}
                        </h3>
                      </div>
                      <p className="text-xs text-text-muted mt-1 truncate">
                        {displayClass} • کمپین: {camp?.name || 'نامشخص'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-bg border border-border text-xs font-bold text-accent-hover">
                      <span>گام {toPersianDigits(step)} از ۸</span>
                    </div>
                  </div>

                  <div className="w-full bg-surface-2 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-accent h-full rounded-full transition-all duration-300" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-text-muted">سطح: {toPersianDigits(draft.level || 1)}</span>
                    <Button
                      type="button"
                      onClick={() => onResumeDraft && onResumeDraft(draft)}
                      className="px-3.5 py-1.5 rounded-xl btn-primary text-xs font-bold shadow-md flex items-center gap-1 min-h-[44px]"
                    >
                      <span>ادامه (Resume)</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Master Characters Section with Status, Campaigns Count, Sessions & Highest Level */}
      {!isLoading && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scroll className="w-5 h-5 text-accent-hover" />
              <h2 className="text-lg font-bold text-text-primary">شخصیت‌های من (شناسنامه کلان)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
                {toPersianDigits(myCharacters.length)}
              </span>
            </div>
            <ScrollableRow className="gap-2 shrink-0">
              {onOpenCharacterWizard && (
                <Button
                  type="button"
                  onClick={() => onOpenCharacterWizard()}
                  className="px-3 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition-colors flex items-center gap-1.5 min-h-[44px] shadow-sm whitespace-nowrap shrink-0 snap-start"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap shrink-0">ساخت کاراکتر با ویزارد</span>
                </Button>
              )}
              <Button
                type="button"
                onClick={onOpenCreateCharacter}
                className="px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent-hover text-xs font-bold hover:bg-accent/25 transition-colors flex items-center gap-1.5 min-h-[44px] whitespace-nowrap shrink-0 snap-start"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap shrink-0">شناسنامه ساده</span>
              </Button>
            </ScrollableRow>
          </div>

          {myCharacters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg/60 p-6 text-center space-y-2">
              <p className="text-xs text-text-muted leading-relaxed">
                شما هنوز هیچ شخصیت کلانی ثبت نکرده‌اید. با ایجاد شناسنامه کلان می‌توانید یک شخصیت را به چند کمپین ببرید.
              </p>
              <Button
                onClick={onOpenCreateCharacter}
                className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-2 text-accent-hover text-xs font-bold transition-all"
              >
                ایجاد اولین شخصیت
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myCharacters.map(char => {
                const campaignsCount = char.campaignsCount ?? char.participations?.length ?? 0;
                const sessionsTotal = char.sessionsAttendedTotal ?? 0;
                const highestLevel = char.highestLevel ?? 1;

                return (
                  <div
                    key={char.id}
                    onClick={() => onOpenCharacterMaster(char.id)}
                    className="rounded-2xl bg-surface border border-border hover:border-accent/40 p-4 transition-all cursor-pointer shadow-md flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                        alt={char.name}
                        loading="lazy"
                        decoding="async"
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-xl object-cover border border-accent/30 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 gap-1">
                          <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-accent-hover transition-colors">
                            {char.name}
                          </h4>
                          {getCharacterStatusBadge(char.status)}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          نژاد: {char.race}
                        </p>
                      </div>
                    </div>

                    {/* Stats Footer on Character Card */}
                    <div className="mt-3 pt-2.5 border-t border-border grid grid-cols-3 gap-1 text-center text-xs text-text-muted">
                      <div className="p-1 rounded bg-bg/60">
                        <span className="block text-xs text-text-muted">کمپین‌ها</span>
                        <span className="font-bold text-text-primary">{toPersianDigits(campaignsCount)}</span>
                      </div>
                      <div className="p-1 rounded bg-bg/60">
                        <span className="block text-xs text-text-muted">جلسات</span>
                        <span className="font-bold text-text-primary">{toPersianDigits(sessionsTotal)}</span>
                      </div>
                      <div className="p-1 rounded bg-bg/60">
                        <span className="block text-xs text-text-muted">بیشترین سطح</span>
                        <span className="font-bold text-accent-hover">سطح {toPersianDigits(highestLevel)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Invite Code Quick Join Section */}
      <section id="invite-section" className="rounded-2xl bg-bg border border-border p-4 space-y-3 scroll-mt-24">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-accent-hover" />
          پیوستن به کمپین با کد دعوت
        </h3>
        <div className="flex gap-2">
          <Input noWrapper 
            ref={inviteInputRef}
            id="invite-code-input"
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="کد دعوت کمپین را اینجا وارد کنید..."
            className="flex-1 bg-bg/80 border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <Button
            onClick={() => {
              if (inviteInput.trim()) {
                onAcceptInvite(inviteInput.trim());
                setInviteInput('');
              }
            }}
            disabled={!inviteInput.trim()}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors min-h-[44px]"
          >
            پیوستن
          </Button>
        </div>
      </section>
    </div>
  );
};