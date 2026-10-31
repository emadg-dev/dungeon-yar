import React, { useState } from 'react';
import { Campaign, MasterCharacter, CampaignInvite, User, CharacterParticipation } from '../../types';
import { APP_NAME_FA } from '../../config/app';
import { 
  Plus, Compass, Users, Scroll, CheckCircle2, Shield, Sparkles, 
  ChevronLeft, Award, Clock, ArrowRight, UserCheck, Wand2, History,
  Archive, AlertCircle, Eye
} from 'lucide-react';
import { toPersianDigits, partitionCampaigns, calculateCountdown } from '../../../shared/rules/historyEngine';

interface HomeScreenProps {
  currentUser: User | null;
  myCampaigns: Campaign[];
  myCharacters: MasterCharacter[];
  pendingInvites: CampaignInvite[];
  pendingApprovals: any[];
  draftParticipations?: CharacterParticipation[];
  isLoading?: boolean;
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
  onSelectCampaign,
  onOpenCreateCampaign,
  onOpenCharacterMaster,
  onOpenCreateCharacter,
  onOpenCharacterWizard,
  onResumeDraft,
  onOpenApprovals,
  onAcceptInvite
}) => {
  const [inviteInput, setInviteInput] = useState('');
  const [campaignTab, setCampaignTab] = useState<'current' | 'past'>('current');

  // Partition campaigns into active/current and past/archived
  const { current: currentCampaigns, past: pastCampaigns } = partitionCampaigns(myCampaigns);
  const draftCampaigns = currentCampaigns.filter(c => c.status === 'draft');
  const activeCampaigns = currentCampaigns.filter(c => c.status !== 'draft');

  const displayedCampaigns = campaignTab === 'current' ? activeCampaigns : pastCampaigns;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 font-medium">مالک کمپین</span>;
      case 'co_dm':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30 font-medium">دستیار دانجن مستر</span>;
      case 'spectator':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#2A2621] text-[#C9C0AE] border border-[#3A342B] font-medium">تماشاچی</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30 font-medium">ماجراجو</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="w-2.5 h-2.5 rounded-full bg-[#6F9E78] shadow-[0_0_8px_#6F9E78] animate-pulse shrink-0" title="کمپین فعال" />;
      case 'paused':
        return <span className="w-2.5 h-2.5 rounded-full bg-[#E0A030] shrink-0" title="متوقف شده" />;
      case 'archived':
        return <span className="w-2.5 h-2.5 rounded-full bg-[#8C8576] shrink-0" title="بایگانی شده" />;
      default:
        return null;
    }
  };

  const getCharacterStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">فعال</span>;
      case 'retired':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">بازنشسته</span>;
      case 'dead':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold">درگذشته</span>;
      case 'archived':
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-stone-500/15 text-stone-300 border border-stone-500/30 font-bold">بایگانی</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#2A1A0D]/40 via-[#1C1814] to-[#12100E] border border-[#E0A030]/20 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">
                پلتفرم چندکمپینی {APP_NAME_FA} ۵e
              </span>
              {currentUser?.platformRole === 'admin' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30">
                  مدیر سیستم
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#F2C265] mt-2">
              خوش آمدید، {currentUser?.displayName || currentUser?.name || 'ماجراجو'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A39A89] mt-1 max-w-lg leading-relaxed">
              پلتفرم مدیریت بازی رومیزی، شناسنامه و پیشینه مشترک شخصیت‌ها، و ورود به جهان‌های مستقل ماجراجویی.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-[#E0A030]/10 border border-[#E0A030]/20 items-center justify-center text-[#F2C265] shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
        </div>

        {/* DM Pending Approvals Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E0A030]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F2C265] animate-ping" />
              <span className="text-sm font-semibold text-[#F2C265]">
                {toPersianDigits(pendingApprovals.length)} درخواست تأیید در انتظار بررسی دانجن مستر
              </span>
            </div>
            <button
              onClick={onOpenApprovals}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors flex items-center gap-1 shadow"
            >
              بررسی صف تأیید
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-[#201D19] rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-36 bg-[#171513] rounded-2xl border border-[#2F2A23]" />
            <div className="h-36 bg-[#171513] rounded-2xl border border-[#2F2A23]" />
          </div>
        </div>
      )}

      {/* Draft Campaigns Section (Phase 2 Wizard Drafts) */}
      {!isLoading && draftCampaigns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-lg font-bold text-[#EDE6D8]">پیش‌نویس‌ها (در حال ساخت)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 font-bold">
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
                  className="rounded-2xl bg-[#171513] border border-[#E0A030]/30 p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-[#EDE6D8] truncate">{draft.name}</h3>
                      <span className="text-xs text-[#E0A030] font-bold">گام {toPersianDigits(completedCount)} از ۸</span>
                    </div>
                    <p className="text-xs text-[#A39A89] mt-1 line-clamp-2 leading-relaxed">
                      {draft.description || 'کمپین در حال طراحی و تنظیم جهان بازی...'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#2F2A23] flex items-center justify-between">
                    <span className="text-xs text-[#8A8374]">{toPersianDigits(percent)}٪ تکمیل شده</span>
                    <button
                      onClick={() => onSelectCampaign(draft.id)}
                      className="px-3 py-1 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors"
                    >
                      ادامه ویزارد
                    </button>
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
              <Shield className="w-5 h-5 text-[#F2C265]" />
              <h2 className="text-lg font-bold text-[#EDE6D8]">کمپین‌های من</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Current vs Past Tabs */}
              <div className="flex items-center p-1 bg-[#141210] border border-[#2F2A23] rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setCampaignTab('current')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                    campaignTab === 'current'
                      ? 'bg-[#E0A030] text-[#0E0D0C] shadow'
                      : 'text-[#A39A89] hover:text-[#EDE6D8]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>جاری</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${campaignTab === 'current' ? 'bg-[#0E0D0C]/20 text-[#0E0D0C]' : 'bg-[#201D19] text-[#A39A89]'}`}>
                    {toPersianDigits(activeCampaigns.length)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignTab('past')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                    campaignTab === 'past'
                      ? 'bg-[#E0A030] text-[#0E0D0C] shadow'
                      : 'text-[#A39A89] hover:text-[#EDE6D8]'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>گذشته / بایگانی</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${campaignTab === 'past' ? 'bg-[#0E0D0C]/20 text-[#0E0D0C]' : 'bg-[#201D19] text-[#A39A89]'}`}>
                    {toPersianDigits(pastCampaigns.length)}
                  </span>
                </button>
              </div>

              <button
                onClick={onOpenCreateCampaign}
                className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                کمپین جدید
              </button>
            </div>
          </div>

          {displayedCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E0A030]/10 text-[#F2C265] flex items-center justify-center mx-auto">
                {campaignTab === 'current' ? <Compass className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-semibold text-[#EDE6D8]">
                {campaignTab === 'current' ? 'شما هنوز عضو هیچ کمپین فعالی نیستید' : 'هیچ کمپین بایگانی‌شده یا خاتمه‌یافته‌ای وجود ندارد'}
              </h3>
              <p className="text-xs text-[#A39A89] max-w-sm mx-auto leading-relaxed">
                {campaignTab === 'current' 
                  ? 'می‌توانید یک کمپین جدید بر پایه قوانین زروانیا یا D&D 5e بسازید یا با کد دعوتی که دانجن مستر داده وارد شوید.'
                  : 'کمپین‌هایی که بایگانی شده یا از آن‌ها خارج شده‌اید در این بخش به عنوان تاریخچه فقط خواندنی نمایش داده می‌شوند.'}
              </p>
              {campaignTab === 'current' && (
                <button
                  onClick={onOpenCreateCampaign}
                  className="px-4 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-sm hover:bg-[#F2C265] transition-all shadow-lg shadow-[#E0A030]/20"
                >
                  ساخت اولین کمپین
                </button>
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
                    className="group relative overflow-hidden rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-5 transition-all cursor-pointer shadow-lg hover:shadow-[#2A1A0D]/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusBadge(camp.status)}
                          <h3 className="text-base font-bold text-[#EDE6D8] group-hover:text-[#F2C265] transition-colors truncate">
                            {camp.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Unread Notifications Badge */}
                          {typeof camp.unreadCount === 'number' && camp.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                              {toPersianDigits(camp.unreadCount)} تازه
                            </span>
                          )}
                          {isPast ? (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-[#201D19] text-[#8A8374] border border-[#2F2A23]">
                              فقط خواندنی
                            </span>
                          ) : (
                            getRoleBadge(camp.myRole)
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#A39A89] mt-2 line-clamp-2 leading-relaxed">
                        {camp.description || 'ماجراجویی در آستانه زمان و رازهای اساطیری زروانیا.'}
                      </p>

                      {/* Next Session Countdown (Active campaigns) */}
                      {!isPast && camp.nextSession && (
                        <div className={`mt-3 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs border ${
                          countdown?.isImminent
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-[#201D19] border-[#2F2A23] text-[#F2C265]'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${countdown?.isImminent ? 'text-amber-400 animate-spin' : 'text-[#E0A030]'}`} />
                            <span className="truncate font-medium">
                              جلسه {toPersianDigits(camp.nextSession.number)}: {countdown?.text || new Date(camp.nextSession.scheduledAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          {countdown?.isImminent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-black shrink-0">
                              به‌زودی!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Character Final State (Past / Archived campaigns) */}
                      {isPast && camp.finalCharacterState && (
                        <div className="mt-3 p-3 rounded-xl bg-[#141210] border border-[#2F2A23] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#EDE6D8]">
                              {camp.finalCharacterState.characterName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#F2C265] border border-[#2F2A23]">
                              سطح {toPersianDigits(camp.finalCharacterState.level)} • {camp.finalCharacterState.className}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#8A8374] pt-1">
                            <span>وضعیت: {camp.finalCharacterState.status === 'dead' ? 'درگذشته' : camp.finalCharacterState.status === 'retired' ? 'بازنشسته' : 'فعال'}</span>
                            <span>{toPersianDigits(camp.finalCharacterState.sessionsAttended)} جلسه حضور</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#2F2A23]/60 flex items-center justify-between text-xs text-[#A39A89]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#8A8374]" />
                          {toPersianDigits(camp.memberCount || 1)} عضو
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#8A8374]" />
                          {toPersianDigits(camp.characterCount || 0)} شخصیت
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#F2C265] font-medium group-hover:translate-x-[-2px] transition-transform">
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
            <Sparkles className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-lg font-bold text-[#EDE6D8]">پیش‌نویس کاراکترها (در حال ساخت)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 font-bold">
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
                  className="rounded-2xl bg-[#171513] border border-[#E0A030]/30 p-4 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 font-bold shrink-0">
                          پیش‌نویس کاراکتر
                        </span>
                        <h3 className="text-sm font-bold text-[#EDE6D8] truncate">
                          {displayName}
                        </h3>
                      </div>
                      <p className="text-xs text-[#A39A89] mt-1 truncate">
                        {displayClass} • کمپین: {camp?.name || 'نامشخص'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-[#131110] border border-[#2F2A23] text-xs font-bold text-[#F2C265]">
                      <span>گام {toPersianDigits(step)} از ۸</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#201D19] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#E0A030] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#2F2A23] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8374]">سطح: {toPersianDigits(draft.level || 1)}</span>
                    <button
                      type="button"
                      onClick={() => onResumeDraft && onResumeDraft(draft)}
                      className="px-3.5 py-1.5 rounded-xl btn-primary-amber text-xs font-bold shadow-md flex items-center gap-1 min-h-[36px]"
                    >
                      <span>ادامه (Resume)</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scroll className="w-5 h-5 text-[#F2C265]" />
              <h2 className="text-lg font-bold text-[#EDE6D8]">شخصیت‌های من (شناسنامه کلان)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89]">
                {toPersianDigits(myCharacters.length)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenCharacterWizard && (
                <button
                  onClick={() => onOpenCharacterWizard()}
                  className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors flex items-center gap-1.5 min-h-[44px] shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  ساخت کاراکتر با ویزارد
                </button>
              )}
              <button
                onClick={onOpenCreateCharacter}
                className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                شناسنامه ساده
              </button>
            </div>
          </div>

          {myCharacters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-6 text-center space-y-2">
              <p className="text-xs text-[#A39A89] leading-relaxed">
                شما هنوز هیچ شخصیت کلانی ثبت نکرده‌اید. با ایجاد شناسنامه کلان می‌توانید یک شخصیت را به چند کمپین ببرید.
              </p>
              <button
                onClick={onOpenCreateCharacter}
                className="px-4 py-2 rounded-xl bg-[#201D19] hover:bg-[#2A2621] text-[#F2C265] text-xs font-bold transition-all"
              >
                ایجاد اولین شخصیت
              </button>
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
                    className="rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-4 transition-all cursor-pointer shadow-md flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                        alt={char.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#E0A030]/30 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-[#EDE6D8] truncate group-hover:text-[#F2C265] transition-colors">
                            {char.name}
                          </h4>
                          {getCharacterStatusBadge(char.status)}
                        </div>
                        <p className="text-xs text-[#A39A89] mt-0.5 truncate">
                          نژاد: {char.race}
                        </p>
                      </div>
                    </div>

                    {/* Stats Footer on Character Card */}
                    <div className="mt-3 pt-2.5 border-t border-[#2F2A23] grid grid-cols-3 gap-1 text-center text-[11px] text-[#A39A89]">
                      <div className="p-1 rounded bg-[#131110]/60">
                        <span className="block text-[10px] text-[#8A8374]">کمپین‌ها</span>
                        <span className="font-bold text-[#EDE6D8]">{toPersianDigits(campaignsCount)}</span>
                      </div>
                      <div className="p-1 rounded bg-[#131110]/60">
                        <span className="block text-[10px] text-[#8A8374]">جلسات</span>
                        <span className="font-bold text-[#EDE6D8]">{toPersianDigits(sessionsTotal)}</span>
                      </div>
                      <div className="p-1 rounded bg-[#131110]/60">
                        <span className="block text-[10px] text-[#8A8374]">بیشترین سطح</span>
                        <span className="font-bold text-[#F2C265]">سطح {toPersianDigits(highestLevel)}</span>
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
      <section className="rounded-2xl bg-[#141210] border border-[#2F2A23] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#EDE6D8] flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#F2C265]" />
          پیوستن به کمپین با کد دعوت
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteInput}
            onChange={e => setInviteInput(e.target.value)}
            placeholder="کد دعوت کمپین را اینجا وارد کنید..."
            className="flex-1 bg-[#131110]/80 border border-[#2F2A23] rounded-xl px-3 py-2 text-sm text-[#EDE6D8] placeholder:text-[#8A8374] focus:outline-none focus:border-[#E0A030]"
          />
          <button
            onClick={() => {
              if (inviteInput.trim()) {
                onAcceptInvite(inviteInput.trim());
                setInviteInput('');
              }
            }}
            disabled={!inviteInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs hover:bg-[#F2C265] disabled:opacity-50 transition-colors min-h-[44px]"
          >
            پیوستن
          </button>
        </div>
      </section>
    </div>
  );
};