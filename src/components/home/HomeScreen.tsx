import React from 'react';
import { Campaign, MasterCharacter, CampaignInvite, User } from '../../types';
import { 
  Plus, Compass, Users, Scroll, CheckCircle2, Shield, Sparkles, 
  ChevronLeft, Award, Clock, ArrowRight, UserCheck 
} from 'lucide-react';

interface HomeScreenProps {
  currentUser: User | null;
  myCampaigns: Campaign[];
  myCharacters: MasterCharacter[];
  pendingInvites: CampaignInvite[];
  pendingApprovals: any[];
  onSelectCampaign: (campaignId: string) => void;
  onOpenCreateCampaign: () => void;
  onOpenCharacterMaster: (characterId: string) => void;
  onOpenCreateCharacter: () => void;
  onOpenApprovals: () => void;
  onAcceptInvite: (code: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  myCampaigns,
  myCharacters,
  pendingInvites,
  pendingApprovals,
  onSelectCampaign,
  onOpenCreateCampaign,
  onOpenCharacterMaster,
  onOpenCreateCharacter,
  onOpenApprovals,
  onAcceptInvite
}) => {
  const [inviteInput, setInviteInput] = React.useState('');

  const draftCampaigns = myCampaigns.filter(c => c.status === 'draft');
  const activeCampaigns = myCampaigns.filter(c => c.status !== 'draft');

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">مالک کمپین</span>;
      case 'co_dm':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30">دستیار دانجن مستر</span>;
      case 'spectator':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#2A2621] text-[#C9C0AE] border border-[#3A342B]">تماشاچی</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30">ماجراجو</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="w-2 h-2 rounded-full bg-[#6F9E78] animate-pulse"></span>;
      case 'paused':
        return <span className="w-2 h-2 rounded-full bg-[#E0A030]"></span>;
      case 'archived':
        return <span className="w-2 h-2 rounded-full bg-[#8C8576]"></span>;
      default:
        return null;
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
                پلتفرم چندکمپینی زروانیا ۵e
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
            <p className="text-xs sm:text-sm text-[#A39A89] mt-1 max-w-lg">
              پلتفرم مدیریت بازی رومیزی، شناسنامه و پیشینه مشترک شخصیت‌ها، و ورود به جهان‌های مستقل ماجراجویی.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-[#E0A030]/10 border border-[#E0A030]/20 items-center justify-center text-[#F2C265]">
            <Compass className="w-7 h-7" />
          </div>
        </div>

        {/* DM Pending Approvals Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E0A030]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F2C265] animate-ping"></div>
              <span className="text-sm font-semibold text-[#F2C265]">
                {pendingApprovals.length} درخواست تأیید در انتظار بررسی دانجن مستر
              </span>
            </div>
            <button
              onClick={onOpenApprovals}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] transition-colors flex items-center gap-1"
            >
              بررسی صف تأیید
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Draft Campaigns Section (Phase 2 Wizard Drafts) */}
      {draftCampaigns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-lg font-bold text-[#EDE6D8]">پیش‌نویس‌ها (در حال ساخت)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">
              {draftCampaigns.length}
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30 font-bold">
                          پیش‌نویس ویزارد
                        </span>
                        <h3 className="text-sm font-bold text-[#EDE6D8]">
                          {draft.name || 'کمپین در حال ساخت'}
                        </h3>
                      </div>
                      <p className="text-xs text-[#A39A89] mt-1 line-clamp-1">
                        {draft.description || 'ادامه راه‌اندازی و تکمیل تنظیمات دنیا و قوانین'}
                      </p>
                    </div>

                    {/* Progress Circle / Badge */}
                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-[#131110] border border-[#2F2A23] text-xs font-bold text-[#F2C265]">
                      <span>{percent}%</span>
                      <span className="text-[10px] text-[#8A8374]">({completedCount}/۸)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#201D19] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#E0A030] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#2F2A23] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8374]">گام فعلی: {draft.wizardState?.step || 1}</span>
                    <button
                      type="button"
                      onClick={() => onSelectCampaign(draft.id)}
                      className="px-3.5 py-1.5 rounded-xl btn-primary-amber text-xs font-bold shadow-md flex items-center gap-1 min-h-[36px]"
                    >
                      <span>ادامه پیش‌نویس (Resume)</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaign Cards Section (Active Campaigns) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-lg font-bold text-[#EDE6D8]">کمپین‌های من</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89]">
              {activeCampaigns.length}
            </span>
          </div>
          <button
            onClick={onOpenCreateCampaign}
            className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            کمپین جدید
          </button>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E0A030]/10 text-[#F2C265] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#EDE6D8]">شما هنوز عضو هیچ کمپین فعالی نیستید</h3>
            <p className="text-xs text-[#A39A89] max-w-sm mx-auto">
              می‌توانید یک کمپین جدید بر پایه قوانین زروانیا یا D&D 5e بسازید یا با کد دعوتی که دانجن مستر داده وارد شوید.
            </p>
            <button
              onClick={onOpenCreateCampaign}
              className="px-4 py-2 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-sm hover:bg-[#F2C265] transition-all shadow-lg shadow-[#E0A030]/20"
            >
              ساخت اولین کمپین
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeCampaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => onSelectCampaign(camp.id)}
                className="group relative overflow-hidden rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-5 transition-all cursor-pointer shadow-lg hover:shadow-[#2A1A0D]/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(camp.status)}
                      <h3 className="text-base font-bold text-[#EDE6D8] group-hover:text-[#F2C265] transition-colors">
                        {camp.name}
                      </h3>
                    </div>
                    {getRoleBadge(camp.myRole)}
                  </div>

                  <p className="text-xs text-[#A39A89] mt-2 line-clamp-2 leading-relaxed">
                    {camp.description || 'ماجراجویی در آستانه زمان و رازهای اساطیری زروانیا.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2F2A23]/60 flex items-center justify-between text-xs text-[#A39A89]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#8A8374]" />
                      {camp.memberCount || 1} عضو
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#8A8374]" />
                      {camp.characterCount || 0} شخصیت
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#F2C265] font-medium group-hover:translate-x-[-2px] transition-transform">
                    <span>ورود به میز بازی</span>
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Master Characters Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-lg font-bold text-[#EDE6D8]">شخصیت‌های من (شناسنامه کلان)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89]">
              {myCharacters.length}
            </span>
          </div>
          <button
            onClick={onOpenCreateCharacter}
            className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            شخصیت جدید
          </button>
        </div>

        {myCharacters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2F2A23] bg-[#141210]/60 p-6 text-center space-y-2">
            <p className="text-xs text-[#A39A89]">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {myCharacters.map(char => {
              const activeCount = char.participations?.length || 0;
              return (
                <div
                  key={char.id}
                  onClick={() => onOpenCharacterMaster(char.id)}
                  className="rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/40 p-4 transition-all cursor-pointer shadow-md flex items-center gap-3.5 group"
                >
                  <img
                    src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                    alt={char.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E0A030]/30 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#EDE6D8] truncate group-hover:text-[#F2C265] transition-colors">
                        {char.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#C9C0AE]">
                        {char.race}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#A39A89]">
                      <span>حضور در {activeCount} کمپین</span>
                      {char.status !== 'active' && (
                        <span className="text-[#D66138] font-medium">({char.status === 'dead' ? 'درگذشته' : 'بازنشسته'})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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