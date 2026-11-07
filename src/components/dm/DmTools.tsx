import { Button } from '../ui/Button';
import React, { useState, useEffect, Suspense } from 'react';
import { Character, CharacterNote, NPC, ItemLibraryEntry, RewardPackage, CampaignNote, Encounter, User, WeaponTemplate, LocationEntry, Campaign, CharacterParticipation, Session, SessionRsvpChoice, SessionRecap } from '../../types';
import { 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal, 
  Users, KeyRound, ShieldAlert, Sparkles, BookOpen, Compass, Award, Database, MapPin, Map as MapIcon, Flag, Coins, Settings as SettingsIcon, Calendar 
} from 'lucide-react';
import { Quest } from '../../types';

// Lazy-loaded DM Sub-Views for optimal code-splitting
const DmDashboard = React.lazy(() => import('./DmDashboard').then(m => ({ default: m.DmDashboard })));
const DmEncounterRunner = React.lazy(() => import('./DmEncounterRunner').then(m => ({ default: m.DmEncounterRunner })));
const DmLibrary = React.lazy(() => import('./DmLibrary').then(m => ({ default: m.DmLibrary })));
const DmNpcManager = React.lazy(() => import('./DmNpcManager').then(m => ({ default: m.DmNpcManager })));
const DmItemVault = React.lazy(() => import('./DmItemVault').then(m => ({ default: m.DmItemVault })));
const DmLocationManager = React.lazy(() => import('./DmLocationManager').then(m => ({ default: m.DmLocationManager })));
const DmCampaignNotes = React.lazy(() => import('./DmCampaignNotes').then(m => ({ default: m.DmCampaignNotes })));
const DmEndingTracker = React.lazy(() => import('./DmEndingTracker').then(m => ({ default: m.DmEndingTracker })));
const DmSettings = React.lazy(() => import('./DmSettings').then(m => ({ default: m.DmSettings })));
const DmUsers = React.lazy(() => import('./DmUsers').then(m => ({ default: m.DmUsers })));
const DmInvites = React.lazy(() => import('./DmInvites').then(m => ({ default: m.DmInvites })));
const DmAuditLog = React.lazy(() => import('./DmAuditLog').then(m => ({ default: m.DmAuditLog })));
const DmHandoutManager = React.lazy(() => import('./DmHandoutManager').then(m => ({ default: m.DmHandoutManager })));
const DmQuestManager = React.lazy(() => import('./DmQuestManager').then(m => ({ default: m.DmQuestManager })));
const DmCalendarTab = React.lazy(() => import('./DmCalendarTab').then(m => ({ default: m.DmCalendarTab })));
const FactionReputationManager = React.lazy(() => import('../campaign/FactionReputationManager').then(m => ({ default: m.FactionReputationManager })));
const PartyTreasuryManager = React.lazy(() => import('../campaign/PartyTreasuryManager').then(m => ({ default: m.PartyTreasuryManager })));

const DmToolSkeleton: React.FC = () => (
  <div className="space-y-4 p-4 motion-safe:animate-pulse" dir="rtl">
    <div className="h-24 bg-surface rounded-xl border border-border" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-32 bg-surface rounded-xl border border-border" />
      <div className="h-32 bg-surface rounded-xl border border-border" />
    </div>
  </div>
);

// ---------------------------------------------------------
// Navigation building blocks
// ---------------------------------------------------------

type DmTab = 'dashboard' | 'encounters' | 'library' | 'narrative' | 'more';
type LibrarySubTab = 'library_hub' | 'npcs' | 'items' | 'locations' | 'handouts' | 'calendar' | 'quests' | 'reputation' | 'treasury';
type NarrativeSubTab = 'notes' | 'endings';
type MoreSubTab = 'users' | 'invites' | 'audit' | 'settings';

interface SubTabItem<T extends string> {
  id: T;
  label: string;
  icon: typeof Library;
  count?: number;
}

/**
 * Second-level navigation. Items wrap instead of scrolling sideways,
 * so every option is visible without discovering a hidden scroller.
 */
function SubTabBar<T extends string>({
  items,
  active,
  onChange,
  label
}: {
  items: SubTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <Button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`flex-1 min-h-[44px] px-3 rounded-lg text-sm transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isActive
                ? 'bg-accent/15 text-accent-hover font-bold border border-accent'
                : 'bg-surface-2 text-text-muted font-medium border border-border hover:text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="text-xs tabular-nums opacity-75">{item.count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// The library area used to be eight tabs in one sideways scroller. Grouped by purpose instead.
const LIBRARY_GROUPS: { id: string; label: string; tabs: LibrarySubTab[] }[] = [
  { id: 'content', label: 'محتوا', tabs: ['library_hub', 'npcs', 'items'] },
  { id: 'world', label: 'دنیا', tabs: ['locations', 'handouts', 'calendar'] },
  { id: 'campaign', label: 'پیگیری کمپین', tabs: ['quests', 'reputation', 'treasury'] }
];

interface DmToolsProps {
  characters: Character[];
  participations?: CharacterParticipation[];
  sharedNotes: CharacterNote[];
  npcs: NPC[];
  items: ItemLibraryEntry[];
  locations: LocationEntry[];
  rewards: RewardPackage[];
  campaignNotes: CampaignNote[];
  savedEncounters: Encounter[];
  users: User[];
  weaponTemplates: WeaponTemplate[];
  activeCampaign?: Campaign | null;
  currentUser?: User | null;
  myCampaigns?: Campaign[];
  onOpenSetupChecklist?: () => void;
  onUpdateCharacter: (char: Character) => void;
  onApplyGroupRest: (type: 'short' | 'long' | 'special') => void;
  onUpdateGroupResources: (delta: { rations?: number; lanternOil?: number }) => void;
  onInspectCharacter: (charId: string) => void;
  onSaveEncounter: (enc: Encounter) => void;
  onCreateNpc: (npc: Omit<NPC, 'id' | 'updatedAt'>) => void;
  onUpdateNpc: (npc: NPC) => void;
  onDeleteNpc: (id: string) => void;
  onCreateLocation?: (loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateLocation?: (loc: LocationEntry) => Promise<any>;
  onDeleteLocation?: (id: string) => Promise<any>;
  onCreateItem: (item: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>) => void;
  onUpdateItem: (item: ItemLibraryEntry) => void;
  onDeleteItem: (id: string) => void;
  onGiveItemToPlayer: (characterId: string, item: ItemLibraryEntry) => void;
  onDistributeReward: (rewardId: string, characterIds: string[]) => void;
  onCreateReward: (reward: Omit<RewardPackage, 'id' | 'createdAt'>) => void;
  onCreateCampaignNote: (note: Omit<CampaignNote, 'id' | 'updatedAt'>) => void;
  onUpdateCampaignNote: (note: CampaignNote) => void;
  onDeleteCampaignNote: (id: string) => void;
  onUpdateUserRole: (userId: string, role: 'dm' | 'player') => void;
  onImportSeedIntoDb: () => Promise<void>;
  onRollDice: (sides: number, count: number, modifier: number, label: string) => void;
  isHttpMode: boolean;
  activeDmTab?: any;
  onSelectDmTab?: (tab: any) => void;
  onRefreshCharacters?: () => void;
  onCreateCharacterForPlayer?: () => void;
  onAwardXp?: (data: any) => Promise<void>;
  onToggleMilestoneLevelUp?: (participationId: string, available: boolean) => Promise<void>;
  onUndoLevelUp?: (participationId: string) => Promise<void>;
  onToggleRespecWindow?: (participationId: string, open: boolean) => Promise<void>;
  onDmOverride?: (participationId: string, updates: any, reason: string) => Promise<void>;
  sessions?: Session[];
  onRsvpSession?: (sessionId: string, status: SessionRsvpChoice, note?: string) => Promise<void>;
  onVoteSessionPoll?: (sessionId: string, optionId: string, choice: SessionRsvpChoice) => Promise<void>;
  onConfirmPollOption?: (sessionId: string, optionId: string) => Promise<void>;
  onOpenSessionList?: () => void;
  onOpenCreateSession?: () => void;
  onOpenAttendance?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  onOpenClosingSheet?: (session: Session) => void;
  latestRecap?: SessionRecap | null;
  onOpenRecapArchive?: () => void;
  onOpenCreateRecap?: () => void;
  onEditRecap?: (recap: SessionRecap) => void;
  // Step 4.4: Quests
  quests?: Quest[];
  onToggleQuestObjective?: (questId: string, objectiveId: string, done: boolean) => Promise<void>;
  onCreateQuest?: (questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onUpdateQuest?: (questId: string, questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onDeleteQuest?: (questId: string) => Promise<void>;
  onCompleteQuest?: (questId: string, options?: { grantRewards?: boolean }) => Promise<void>;
}

export const DmTools: React.FC<DmToolsProps> = ({
  characters,
  sharedNotes,
  npcs,
  items,
  locations,
  rewards,
  campaignNotes,
  savedEncounters,
  users,
  weaponTemplates,
  activeCampaign,
  currentUser,
  myCampaigns = [],
  onOpenSetupChecklist,
  onUpdateCharacter,
  onApplyGroupRest,
  onUpdateGroupResources,
  onInspectCharacter,
  onSaveEncounter,
  onCreateNpc,
  onUpdateNpc,
  onDeleteNpc,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onGiveItemToPlayer,
  onDistributeReward,
  onCreateReward,
  onCreateCampaignNote,
  onUpdateCampaignNote,
  onDeleteCampaignNote,
  onUpdateUserRole,
  onImportSeedIntoDb,
  onRollDice,
  isHttpMode,
  activeDmTab: controlledDmTab,
  onSelectDmTab,
  onRefreshCharacters,
  onCreateCharacterForPlayer,
  participations = [],
  onAwardXp,
  onToggleMilestoneLevelUp,
  onUndoLevelUp,
  onToggleRespecWindow,
  onDmOverride,
  sessions,
  onRsvpSession,
  onVoteSessionPoll,
  onConfirmPollOption,
  onOpenSessionList,
  onOpenCreateSession,
  onOpenAttendance,
  onEditSession,
  onOpenClosingSheet,
  latestRecap,
  onOpenRecapArchive,
  onOpenCreateRecap,
  onEditRecap,
  quests = [],
  onToggleQuestObjective,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
  onCompleteQuest,
}) => {
  const [internalDmTab, setInternalDmTab] = useState<DmTab>('dashboard');
  const [librarySubTab, setLibrarySubTab] = useState<LibrarySubTab>('library_hub');
  const [narrativeSubTab, setNarrativeSubTab] = useState<NarrativeSubTab>('notes');
  const [moreSubTab, setMoreSubTab] = useState<MoreSubTab>('users');

  const campaignId = activeCampaign?.id || 'zorvania-c1';

  const rawTab = controlledDmTab || internalDmTab;
  // Normalize backwards compatibility
  const activeTab: DmTab =
    rawTab === 'npcs' || rawTab === 'items'
      ? 'library'
      : rawTab === 'notes'
      ? 'narrative'
      : rawTab === 'settings'
      ? 'more'
      : rawTab;

  const setActiveDmTab = (tab: any) => {
    if (onSelectDmTab) onSelectDmTab(tab);
    setInternalDmTab(tab);
  };

  // Legacy ids used to land on the right top-level tab but always on that tab's default sub-tab
  // (e.g. 'npcs' opened the library hub, not the NPC list). Select the matching sub-tab too.
  useEffect(() => {
    if (rawTab === 'npcs' || rawTab === 'items') setLibrarySubTab(rawTab);
    else if (rawTab === 'notes') setNarrativeSubTab('notes');
    else if (rawTab === 'settings') setMoreSubTab('settings');
  }, [rawTab]);

  // Primary navigation: five items always fit as icon-over-label, so nothing scrolls sideways.
  // The last tab was "کاربران و تنظیمات" (too long for a tab); it holds users, invites, log and settings.
  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'encounters', label: 'مواجهه', icon: Swords },
    { id: 'library', label: 'کتابخانه', icon: Library },
    { id: 'narrative', label: 'روایت', icon: Scroll },
    { id: 'more', label: 'مدیریت', icon: SettingsIcon },
  ] as const;

  const libraryTabs: Record<LibrarySubTab, SubTabItem<LibrarySubTab>> = {
    library_hub: { id: 'library_hub', label: 'قالب‌ها و بسته‌ها', icon: Library },
    npcs: { id: 'npcs', label: 'موجودات', icon: Users, count: npcs.length },
    items: { id: 'items', label: 'اشیاء', icon: Sparkles, count: items.length },
    locations: { id: 'locations', label: 'مکان‌ها', icon: MapPin, count: locations.length },
    handouts: { id: 'handouts', label: 'اسناد و نقشه‌ها', icon: MapIcon },
    calendar: { id: 'calendar', label: 'گاه‌شمار کمپین', icon: Calendar },
    quests: { id: 'quests', label: 'مأموریت‌ها', icon: Scroll, count: quests.length },
    reputation: { id: 'reputation', label: 'شهرت جناح‌ها', icon: Flag },
    treasury: { id: 'treasury', label: 'خزانه گروه', icon: Coins }
  };
  const activeLibraryGroup =
    LIBRARY_GROUPS.find(g => g.tabs.includes(librarySubTab)) || LIBRARY_GROUPS[0];

  const narrativeTabs: SubTabItem<NarrativeSubTab>[] = [
    { id: 'notes', label: 'یادداشت‌های کمپین', icon: BookOpen, count: campaignNotes.length },
    { id: 'endings', label: 'پایان‌بندی‌ها و سرنوشت', icon: Compass }
  ];

  const moreTabs: SubTabItem<MoreSubTab>[] = [
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'invites', label: 'کدهای دعوت', icon: KeyRound },
    { id: 'audit', label: 'گزارش وقایع', icon: Scroll },
    { id: 'settings', label: 'تنظیمات', icon: SettingsIcon }
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Primary navigation */}
      <nav
        role="tablist"
        aria-label="بخش‌های ابزار مستر"
        className="surface-card rounded-xl p-1.5 border border-border grid grid-cols-5 gap-1"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              type="button"
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveDmTab(item.id)}
              className={`min-h-[56px] rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                isActive
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`text-xs leading-none whitespace-nowrap ${isActive ? 'font-extrabold' : 'font-bold'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </nav>

      {/* The sub-views are lazy; without Suspense they would have nothing to show while loading */}
      <Suspense fallback={<DmToolSkeleton />}>
        {/* 1. Dashboard */}
        {activeTab === 'dashboard' && (
          <DmDashboard
            characters={characters}
            participations={participations}
            activeCampaign={activeCampaign}
            onOpenSetupChecklist={onOpenSetupChecklist}
            onUpdateCharacter={onUpdateCharacter}
            onApplyGroupRest={onApplyGroupRest}
            onUpdateGroupResources={onUpdateGroupResources}
            onInspectCharacter={onInspectCharacter}
            onRollDice={onRollDice}
            onCreateForPlayer={onCreateCharacterForPlayer}
            onAwardXp={onAwardXp}
            onToggleMilestoneLevelUp={onToggleMilestoneLevelUp}
            onUndoLevelUp={onUndoLevelUp}
            onToggleRespecWindow={onToggleRespecWindow}
            onDmOverride={onDmOverride}
            onRefreshCampaign={onRefreshCharacters}
            sessions={sessions}
            currentUser={currentUser}
            onRsvpSession={onRsvpSession}
            onVoteSessionPoll={onVoteSessionPoll}
            onConfirmPollOption={onConfirmPollOption}
            onOpenSessionList={onOpenSessionList}
            onOpenCreateSession={onOpenCreateSession}
            onOpenAttendance={onOpenAttendance}
            onEditSession={onEditSession}
            onOpenClosingSheet={onOpenClosingSheet}
            latestRecap={latestRecap}
            onOpenRecapArchive={onOpenRecapArchive}
            onOpenCreateRecap={onOpenCreateRecap}
            onEditRecap={onEditRecap}
            npcs={npcs}
            locations={locations}
            campaignNotes={campaignNotes}
          />
        )}

        {/* 2. Encounters */}
        {activeTab === 'encounters' && (
          <DmEncounterRunner
            characters={characters}
            npcs={npcs}
            locations={locations}
            savedEncounters={savedEncounters}
            onSaveEncounter={onSaveEncounter}
            onRollDice={onRollDice}
            onCreateLocation={onCreateLocation}
          />
        )}

        {/* 3. Library: grouped navigation + entity managers */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="surface-card rounded-xl p-2 border border-border space-y-2">
              <div
                role="tablist"
                aria-label="گروه‌های کتابخانه"
                className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface-2"
              >
                {LIBRARY_GROUPS.map(group => {
                  const isActive = activeLibraryGroup.id === group.id;
                  return (
                    <Button
                      type="button"
                      key={group.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        if (!isActive) setLibrarySubTab(group.tabs[0]);
                      }}
                      className={`min-h-[44px] rounded-lg text-sm transition ${
                        isActive
                          ? 'bg-accent/15 text-accent-hover font-bold border border-accent'
                          : 'text-text-muted font-medium hover:text-text-primary border border-transparent'
                      }`}
                    >
                      {group.label}
                    </Button>
                  );
                })}
              </div>

              <SubTabBar
                label={activeLibraryGroup.label}
                items={activeLibraryGroup.tabs.map(t => libraryTabs[t])}
                active={librarySubTab}
                onChange={setLibrarySubTab}
              />
            </div>

            {librarySubTab === 'library_hub' && (
              <DmLibrary
                currentCampaignId={campaignId}
                currentUser={currentUser || null}
                myCampaigns={myCampaigns}
                onRollDice={onRollDice}
                onRefreshCampaignData={onRefreshCharacters}
              />
            )}

            {librarySubTab === 'npcs' && (
              <DmNpcManager
                npcs={npcs}
                onCreateNpc={onCreateNpc}
                onUpdateNpc={onUpdateNpc}
                onDeleteNpc={onDeleteNpc}
                onRollDice={onRollDice}
              />
            )}

            {librarySubTab === 'items' && (
              <DmItemVault
                items={items}
                characters={characters}
                rewards={rewards}
                weaponTemplates={weaponTemplates}
                onCreateItem={onCreateItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onGiveItem={onGiveItemToPlayer}
                onDistributeReward={onDistributeReward}
                onCreateReward={onCreateReward}
              />
            )}

            {librarySubTab === 'locations' && (
              <DmLocationManager
                locations={locations}
                onCreateLocation={async (loc) => { if (onCreateLocation) await onCreateLocation(loc); }}
                onUpdateLocation={async (loc) => { if (onUpdateLocation) await onUpdateLocation(loc); }}
                onDeleteLocation={async (id) => { if (onDeleteLocation) await onDeleteLocation(id); }}
              />
            )}

            {librarySubTab === 'handouts' && (
              <DmHandoutManager
                campaignId={campaignId}
                campaignCharacters={characters.map(c => ({ id: c.id, name: c.name }))}
              />
            )}

            {librarySubTab === 'calendar' && (
              <DmCalendarTab
                campaignId={campaignId}
                userRole="owner"
              />
            )}

            {librarySubTab === 'quests' && (
              <DmQuestManager
                campaignId={campaignId}
                quests={quests}
                npcs={npcs}
                locations={locations}
                partyCharacters={characters.map(c => ({ id: c.id, name: c.name }))}
                onToggleObjective={async (qId, objId, done) => {
                  if (onToggleQuestObjective) {
                    await onToggleQuestObjective(qId, objId, done);
                  }
                }}
                onCreateQuest={async (data) => {
                  if (onCreateQuest) {
                    await onCreateQuest(data);
                  }
                }}
                onUpdateQuest={async (qId, data) => {
                  if (onUpdateQuest) {
                    await onUpdateQuest(qId, data);
                  }
                }}
                onDeleteQuest={async (qId) => {
                  if (onDeleteQuest) {
                    await onDeleteQuest(qId);
                  }
                }}
                onCompleteQuest={async (qId, opts) => {
                  if (onCompleteQuest) {
                    await onCompleteQuest(qId, opts);
                  }
                }}
              />
            )}

            {librarySubTab === 'reputation' && (
              <FactionReputationManager
                campaignId={campaignId}
                userRole="owner"
                participations={participations}
              />
            )}

            {librarySubTab === 'treasury' && (
              <PartyTreasuryManager
                campaignId={campaignId}
                userRole="owner"
                campaignSettings={activeCampaign?.settings}
              />
            )}
          </div>
        )}

        {/* 4. Narrative (Notes & Endings) */}
        {activeTab === 'narrative' && (
          <div className="space-y-4">
            <SubTabBar
              label="بخش‌های روایت"
              items={narrativeTabs}
              active={narrativeSubTab}
              onChange={setNarrativeSubTab}
            />

            {narrativeSubTab === 'notes' && (
              <DmCampaignNotes
                campaignNotes={campaignNotes}
                onCreateNote={onCreateCampaignNote}
                onUpdateNote={onUpdateCampaignNote}
                onDeleteNote={onDeleteCampaignNote}
              />
            )}

            {narrativeSubTab === 'endings' && (
              <DmEndingTracker />
            )}
          </div>
        )}

        {/* 5. Management: Users, Invites, Audit Log, Settings & Seed */}
        {activeTab === 'more' && (
          <div className="space-y-4">
            <SubTabBar
              label="بخش‌های مدیریت"
              items={moreTabs}
              active={moreSubTab}
              onChange={setMoreSubTab}
            />

            {moreSubTab === 'users' && (
              <DmUsers characters={characters} onRefreshCharacters={onRefreshCharacters} />
            )}

            {moreSubTab === 'invites' && (
              <DmInvites characters={characters} />
            )}

            {moreSubTab === 'audit' && (
              <DmAuditLog campaignId={activeCampaign?.id} />
            )}

            {moreSubTab === 'settings' && (
              <DmSettings
                users={users}
                onUpdateUserRole={onUpdateUserRole}
                onImportSeedIntoDb={onImportSeedIntoDb}
                isHttpMode={isHttpMode}
                campaignId={campaignId}
              />
            )}
          </div>
        )}
      </Suspense>
    </div>
  );
};