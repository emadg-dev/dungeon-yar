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

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">مالک کمپین</span>;
      case 'co_dm':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">دستیار دانجن مستر</span>;
      case 'spectator':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300 border border-slate-600">تماشاچی</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ماجراجو</span>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>;
      case 'paused':
        return <span className="w-2 h-2 rounded-full bg-amber-500"></span>;
      case 'archived':
        return <span className="w-2 h-2 rounded-full bg-slate-500"></span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-950/40 via-[#1C1814] to-[#12100E] border border-amber-500/20 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                پلتفرم چندکمپینی زروانیا ۵e
              </span>
              {currentUser?.platformRole === 'admin' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  مدیر سیستم
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-amber-100 mt-2">
              خوش آمدید، {currentUser?.displayName || currentUser?.name || 'ماجراجو'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
              پلتفرم مدیریت بازی رومیزی، شناسنامه و پیشینه مشترک شخصیت‌ها، و ورود به جهان‌های مستقل ماجراجویی.
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400">
            <Compass className="w-7 h-7" />
          </div>
        </div>

        {/* DM Pending Approvals Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
              <span className="text-sm font-semibold text-amber-200">
                {pendingApprovals.length} درخواست تأیید در انتظار بررسی دانجن مستر
              </span>
            </div>
            <button
              onClick={onOpenApprovals}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1"
            >
              بررسی صف تأیید
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Campaign Cards Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">کمپین‌های من</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {myCampaigns.length}
            </span>
          </div>
          <button
            onClick={onOpenCreateCampaign}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            کمپین جدید
          </button>
        </div>

        {myCampaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#141210]/60 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">شما هنوز عضو هیچ کمپینی نیستید</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              می‌توانید یک کمپین جدید بر پایه قوانین زروانیا یا D&D 5e بسازید یا با کد دعوتی که دانجن مستر داده وارد شوید.
            </p>
            <button
              onClick={onOpenCreateCampaign}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              ساخت اولین کمپین
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCampaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => onSelectCampaign(camp.id)}
                className="group relative overflow-hidden rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-amber-500/40 p-5 transition-all cursor-pointer shadow-lg hover:shadow-amber-950/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(camp.status)}
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {camp.name}
                      </h3>
                    </div>
                    {getRoleBadge(camp.myRole)}
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {camp.description || 'ماجراجویی در آستانه زمان و رازهای اساطیری زروانیا.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2F2A23]/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {camp.memberCount || 1} عضو
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-500" />
                      {camp.characterCount || 0} شخصیت
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-medium group-hover:translate-x-[-2px] transition-transform">
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
            <Scroll className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">شخصیت‌های من (شناسنامه کلان)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {myCharacters.length}
            </span>
          </div>
          <button
            onClick={onOpenCreateCharacter}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            شخصیت جدید
          </button>
        </div>

        {myCharacters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#141210]/60 p-6 text-center space-y-2">
            <p className="text-xs text-slate-400">
              شما هنوز هیچ شخصیت کلانی ثبت نکرده‌اید. با ایجاد شناسنامه کلان می‌توانید یک شخصیت را به چند کمپین ببرید.
            </p>
            <button
              onClick={onOpenCreateCharacter}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all"
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
                  className="rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-amber-500/40 p-4 transition-all cursor-pointer shadow-md flex items-center gap-3.5 group"
                >
                  <img
                    src={char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80'}
                    alt={char.name}
                    className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                        {char.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {char.race}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>حضور در {activeCount} کمپین</span>
                      {char.status !== 'active' && (
                        <span className="text-rose-400 font-medium">({char.status === 'dead' ? 'درگذشته' : 'بازنشسته'})</span>
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
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400" />
          پیوستن به کمپین با کد دعوت
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteInput}
            onChange={e => setInviteInput(e.target.value)}
            placeholder="کد دعوت کمپین را اینجا وارد کنید..."
            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => {
              if (inviteInput.trim()) {
                onAcceptInvite(inviteInput.trim());
                setInviteInput('');
              }
            }}
            disabled={!inviteInput.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            پیوستن
          </button>
        </div>
      </section>
    </div>
  );
};
