import React, { useState, startTransition, useRef, useEffect } from 'react';
import { Campaign, MasterCharacter, CampaignInvite, User, CharacterParticipation } from '../../types';
import { Plus, ChevronLeft, Clock } from 'lucide-react';
import { toPersianDigits, partitionCampaigns, calculateCountdown } from '../../../shared/rules/historyEngine';
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

/* ------------------------------------------------------------------
   Page order follows what the person most likely needs next:
   1. something waiting for them (approvals, unfinished drafts)
   2. their campaigns   3. their characters   4. join with a code
   Each block has one heading and at most one primary button.
   ------------------------------------------------------------------ */
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
const primaryBtn = `inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-accent text-on-accent text-sm font-bold hover:bg-accent-hover transition disabled:opacity-50 ${focusRing}`;
const secondaryBtn = `inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg border border-border bg-surface-2 text-text-primary text-sm font-medium hover:border-accent transition ${focusRing}`;
const cardBase = `rounded-xl bg-surface border border-border hover:border-accent/50 transition cursor-pointer ${focusRing}`;

const ROLE_LABEL: Record<string, string> = {
  owner: 'مالک کمپین',
  co_dm: 'دستیار دانجن مستر',
  spectator: 'تماشاچی',
};
const roleLabel = (role?: string) => ROLE_LABEL[role || ''] || 'ماجراجو';
const roleTone = (role?: string) =>
  role === 'owner' ? 'text-accent-hover'
  : role === 'co_dm' ? 'text-role-codm'
  : role === 'spectator' ? 'text-text-muted'
  : 'text-info';

const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const SectionHeading: React.FC<{ title: string; count?: number; actions?: React.ReactNode }> = ({ title, count, actions }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-baseline gap-2">
      <h2 className="text-base font-bold text-text-primary">{title}</h2>
      {count !== undefined && count > 0 && <span className="text-sm text-text-muted">{toPersianDigits(count)}</span>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

const EmptyState: React.FC<{ title: string; body: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
    <h3 className="text-base font-bold text-text-primary">{title}</h3>
    <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">{body}</p>
    {action}
  </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  myCampaigns,
  myCharacters,
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
  onAcceptInvite,
}) => {
  const [inviteInput, setInviteInput] = useState(initialInviteCode);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const [campaignTab, setCampaignTab] = useState<'current' | 'past'>('current');

  const { current: currentCampaigns, past: pastCampaigns } = partitionCampaigns(myCampaigns);
  const draftCampaigns = currentCampaigns.filter(c => c.status === 'draft');
  const activeCampaigns = currentCampaigns.filter(c => c.status !== 'draft');

  // The "past" tab only exists once there is something in it.
  const hasPast = pastCampaigns.length > 0;
  const tab = hasPast ? campaignTab : 'current';
  const displayedCampaigns = tab === 'current' ? activeCampaigns : pastCampaigns;

  const displayName = currentUser?.displayName || currentUser?.name || 'ماجراجو';
  const hasDrafts = draftCampaigns.length > 0 || draftParticipations.length > 0;
  const startCharacter = onOpenCharacterWizard ? () => onOpenCharacterWizard() : onOpenCreateCharacter;

  const submitInvite = () => {
    const code = inviteInput.trim();
    if (!code) return;
    onAcceptInvite(code);
    setInviteInput('');
  };

  return (
    <div className="space-y-8 pb-4 text-start" dir="rtl">
      {/* Greeting: one line, no marketing copy */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-text-primary">سلام، {displayName}</h1>
        {!isLoading && myCampaigns.length === 0 && myCharacters.length === 0 && (
          <p className="text-sm text-text-muted leading-relaxed max-w-lg">
            با ساخت کمپین یا شخصیت شروع کنید، یا با کد دعوت وارد کمپین دوستانتان شوید.
          </p>
        )}
      </div>

      {/* Waiting on you */}
      {pendingApprovals.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5">
          <span className="text-sm text-text-primary">
            {toPersianDigits(pendingApprovals.length)} درخواست منتظر تأیید شماست
          </span>
          <Button onClick={onOpenApprovals} className={`${primaryBtn} shrink-0`}>
            بررسی
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          <div className="h-5 w-32 bg-surface-2 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-28 bg-surface rounded-xl border border-border" />
            <div className="h-28 bg-surface rounded-xl border border-border" />
          </div>
        </div>
      )}

      {/* Unfinished: campaign drafts and character drafts together */}
      {!isLoading && hasDrafts && (
        <section className="space-y-3" aria-label="کارهای نیمه‌تمام">
          <SectionHeading title="کارهای نیمه‌تمام" count={draftCampaigns.length + draftParticipations.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {draftCampaigns.map(draft => {
              const completedCount = draft.wizardState?.completed?.length || 1;
              const percent = Math.round((completedCount / 8) * 100);
              return (
                <div key={draft.id} className="rounded-xl bg-surface border border-border p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-text-primary truncate">{draft.name}</h3>
                      <p className="text-xs text-text-muted">
                        پیش‌نویس کمپین، گام {toPersianDigits(completedCount)} از ۸
                      </p>
                    </div>
                    <Button onClick={() => onSelectCampaign(draft.id)} className={`${secondaryBtn} shrink-0`}>
                      ادامه
                    </Button>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}

            {draftParticipations.map(draft => {
              const camp = myCampaigns.find(c => c.id === draft.campaignId);
              const char = myCharacters.find(c => c.id === draft.characterId);
              const step = draft.build?.step || 1;
              const percent = Math.round((step / 8) * 100);
              const name = char?.name || draft.build?.masterData?.name || 'شخصیت در حال ساخت';
              return (
                <div key={draft.id} className="rounded-xl bg-surface border border-border p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-text-primary truncate">{name}</h3>
                      <p className="text-xs text-text-muted truncate">
                        پیش‌نویس شخصیت، گام {toPersianDigits(step)} از ۸{camp?.name ? `، کمپین ${camp.name}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => onResumeDraft && onResumeDraft(draft)}
                      className={`${secondaryBtn} shrink-0`}
                    >
                      ادامه
                    </Button>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Campaigns */}
      {!isLoading && (
        <section id="home-campaigns" className="space-y-3 scroll-mt-4" aria-label="کمپین‌های من">
          <SectionHeading
            title="کمپین‌های من"
            actions={
              <Button type="button" onClick={onOpenCreateCampaign} className={primaryBtn}>
                <Plus className="w-4 h-4" />
                <span>کمپین جدید</span>
              </Button>
            }
          />

          {hasPast && (
            <div className="inline-flex p-1 rounded-lg bg-surface-2 border border-border" role="group" aria-label="نوع کمپین‌ها">
              {([
                { id: 'current', label: 'جاری', count: activeCampaigns.length },
                { id: 'past', label: 'بایگانی', count: pastCampaigns.length },
              ] as const).map(t => (
                <Button
                  key={t.id}
                  type="button"
                  aria-pressed={tab === t.id}
                  onClick={() => startTransition(() => setCampaignTab(t.id))}
                  className={`h-9 px-4 rounded-md text-sm transition ${focusRing} ${
                    tab === t.id ? 'bg-surface text-text-primary font-bold shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {t.label} {toPersianDigits(t.count)}
                </Button>
              ))}
            </div>
          )}

          {displayedCampaigns.length === 0 ? (
            <EmptyState
              title={tab === 'current' ? 'هنوز در هیچ کمپینی نیستید' : 'کمپین بایگانی‌شده‌ای ندارید'}
              body={
                tab === 'current'
                  ? 'یک کمپین بسازید یا با کد دعوتی که دانجن مستر به شما داده وارد شوید.'
                  : 'کمپین‌های بایگانی‌شده اینجا به‌صورت فقط‌خواندنی نمایش داده می‌شوند.'
              }
              action={
                tab === 'current' ? (
                  <Button onClick={onOpenCreateCampaign} className={primaryBtn}>
                    ساخت اولین کمپین
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedCampaigns.map(camp => {
                const isPast = tab === 'past' || camp.isReadOnly || camp.status === 'archived';
                const countdown = camp.nextSession?.scheduledAt
                  ? calculateCountdown(camp.nextSession.scheduledAt)
                  : camp.nextSession?.countdown;
                const open = () => onSelectCampaign(camp.id);
                const unread = typeof camp.unreadCount === 'number' ? camp.unreadCount : 0;

                return (
                  <div
                    key={camp.id}
                    role="link"
                    tabIndex={0}
                    aria-label={camp.name}
                    onClick={open}
                    onKeyDown={onActivate(open)}
                    className={`${cardBase} p-4 flex flex-col gap-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-text-primary line-clamp-2 leading-snug">{camp.name}</h3>
                      {unread > 0 && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-accent text-on-accent">
                          {toPersianDigits(unread)} تازه
                        </span>
                      )}
                    </div>

                    {camp.description && (
                      <p className="text-sm text-text-muted line-clamp-1">{camp.description}</p>
                    )}

                    {!isPast && camp.nextSession && (
                      <p className={`flex items-center gap-1.5 text-sm ${countdown?.isImminent ? 'text-accent-hover font-bold' : 'text-text-primary'}`}>
                        <Clock className="w-4 h-4 shrink-0 text-text-muted" />
                        <span className="truncate">
                          جلسه {toPersianDigits(camp.nextSession.number)}:{' '}
                          {countdown?.text || new Date(camp.nextSession.scheduledAt).toLocaleDateString('fa-IR')}
                        </span>
                      </p>
                    )}

                    {isPast && camp.finalCharacterState && (
                      <p className="text-sm text-text-muted truncate">
                        {camp.finalCharacterState.characterName}، سطح {toPersianDigits(camp.finalCharacterState.level)} {camp.finalCharacterState.className}
                        {camp.finalCharacterState.status === 'dead' ? '، درگذشته' : camp.finalCharacterState.status === 'retired' ? '، بازنشسته' : ''}
                      </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs text-text-muted">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                        <span className={`font-bold ${isPast ? 'text-text-muted' : roleTone(camp.myRole)}`}>
                          {isPast ? 'فقط خواندنی' : roleLabel(camp.myRole)}
                        </span>
                        <span>{toPersianDigits(camp.memberCount || 1)} عضو</span>
                        <span>{toPersianDigits(camp.characterCount || 0)} شخصیت</span>
                        {camp.status === 'paused' && <span className="text-warning">متوقف</span>}
                      </div>
                      <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Characters */}
      {!isLoading && (
        <section id="home-characters" className="space-y-3 scroll-mt-4" aria-label="شخصیت‌های من">
          <SectionHeading
            title="شخصیت‌های من"
            count={myCharacters.length}
            actions={
              <>
                {onOpenCharacterWizard && (
                  <Button type="button" onClick={onOpenCreateCharacter} className={secondaryBtn}>
                    شناسنامه ساده
                  </Button>
                )}
                <Button type="button" onClick={startCharacter} className={primaryBtn}>
                  <Plus className="w-4 h-4" />
                  <span>شخصیت جدید</span>
                </Button>
              </>
            }
          />

          {myCharacters.length === 0 ? (
            <EmptyState
              title="هنوز شخصیتی نساخته‌اید"
              body="یک شخصیت را می‌توانید به چند کمپین ببرید و پیشینه و سطحش را نگه دارید."
              action={
                <Button onClick={startCharacter} className={primaryBtn}>
                  ساخت اولین شخصیت
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myCharacters.map(char => {
                const campaignsCount = char.campaignsCount ?? char.participations?.length ?? 0;
                const sessionsTotal = char.sessionsAttendedTotal ?? 0;
                const highestLevel = char.highestLevel ?? 1;
                const open = () => onOpenCharacterMaster(char.id);
                const statusLabel =
                  char.status === 'dead' ? 'درگذشته'
                  : char.status === 'retired' ? 'بازنشسته'
                  : char.status === 'archived' ? 'بایگانی'
                  : '';

                return (
                  <div
                    key={char.id}
                    role="link"
                    tabIndex={0}
                    aria-label={char.name}
                    onClick={open}
                    onKeyDown={onActivate(open)}
                    className={`${cardBase} p-3 flex flex-col gap-2.5`}
                  >
                    <div className="flex items-center gap-3">
                      {char.portraitUrl ? (
                        <img
                          src={char.portraitUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-lg bg-surface-2 border border-border text-lg font-bold text-accent flex items-center justify-center shrink-0" aria-hidden="true">
                          {char.name?.[0] || '؟'}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-text-primary truncate">{char.name}</h3>
                        <p className="text-xs text-text-muted truncate">{char.race}</p>
                      </div>
                      {statusLabel && (
                        <span className={`shrink-0 text-xs font-bold ${char.status === 'dead' ? 'text-danger' : 'text-text-muted'}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span>{toPersianDigits(campaignsCount)} کمپین</span>
                      <span>{toPersianDigits(sessionsTotal)} جلسه</span>
                      <span>بالاترین سطح {toPersianDigits(highestLevel)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Join with a code */}
      <section id="home-invites" className="space-y-2 scroll-mt-4" aria-label="پیوستن با کد دعوت">
        <h2 className="text-base font-bold text-text-primary">کد دعوت دارید؟</h2>
        <div className="flex gap-2">
          <Input
            noWrapper
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') submitInvite();
            }}
            placeholder="کد دعوت را وارد کنید"
            aria-label="کد دعوت کمپین"
            className="flex-1 min-w-0 h-11 bg-surface border border-border rounded-lg px-3 text-text-primary placeholder:text-text-muted"
          />
          <Button onClick={submitInvite} disabled={!inviteInput.trim()} className={`${primaryBtn} shrink-0`}>
            پیوستن
          </Button>
        </div>
      </section>
    </div>
  );
};