import { Button } from '../ui/Button';
import React, { useState, Suspense } from 'react';
import { Character, CharacterNote, NPC, ItemLibraryEntry, RewardPackage, CampaignNote, Encounter, User, WeaponTemplate, LocationEntry, Campaign, CharacterParticipation, Session, SessionRsvpChoice, SessionRecap } from '../../types';
import { 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal, 
  Users, KeyRound, ShieldAlert, Sparkles, BookOpen, Compass, Award, Database, MapPin, Map as MapIcon, Flag, Coins, Settings as SettingsIcon 
} from 'lucide-react';
import { Quest } from '../../types';
import { ScrollableRow } from '../ui/ScrollableRow';

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
const FactionReputationManager = React.lazy(() => import('../campaign/FactionReputationManager').then(m => ({ default: m.FactionReputationManager })));
const PartyTreasuryManager = React.lazy(() => import('../campaign/PartyTreasuryManager').then(m => ({ default: m.PartyTreasuryManager })));

const DmToolSkeleton: React.FC = () => (
  <div className="space-y-4 p-4 animate-pulse" dir="rtl">
    <div className="h-24 bg-surface rounded-xl border border-border" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-32 bg-surface rounded-xl border border-border" />
      <div className="h-32 bg-surface rounded-xl border border-border" />
    </div>
  </div>
);

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
  const [internalDmTab, setInternalDmTab] = useState<'dashboard' | 'encounters' | 'library' | 'narrative' | 'more'>('dashboard');
  const [librarySubTab, setLibrarySubTab] = useState<'library_hub' | 'npcs' | 'items' | 'locations' | 'handouts' | 'quests' | 'reputation' | 'treasury'>('library_hub');
  const [narrativeSubTab, setNarrativeSubTab] = useState<'notes' | 'endings'>('notes');
  const [moreSubTab, setMoreSubTab] = useState<'users' | 'invites' | 'audit' | 'settings'>('users');

  const rawTab = controlledDmTab || internalDmTab;
  // Normalize backwards compatibility
  const activeTab: 'dashboard' | 'encounters' | 'library' | 'narrative' | 'more' =
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

  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'encounters', label: 'مواجهه', icon: Swords },
    { id: 'library', label: 'کتابخانه', icon: Library },
    { id: 'narrative', label: 'روایت', icon: Scroll },
    { id: 'more', label: 'کاربران و تنظیمات', icon: MoreHorizontal },
  ] as const;

  return (
    <div className="space-y-4" dir="rtl">
      {/* DM Navigation Tab Bar */}
      <ScrollableRow
        activeKey={activeTab}
        wrapperClassName="surface-card rounded-[14px] p-1.5 border border-border"
        className="gap-1.5"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              type="button"
              key={item.id}
              data-key={item.id}
              onClick={() => setActiveDmTab(item.id)}
              className={`py-2 px-3.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                isActive
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap shrink-0">{item.label}</span>
            </Button>
          );
        })}
      </ScrollableRow>

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

      {/* 3. Library (DM Library Hub & Entity Managers) */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <ScrollableRow
            activeKey={librarySubTab}
            wrapperClassName="surface-card rounded-[12px] p-1 border border-border"
            className="gap-1"
          >
            <Button
              type="button"
              data-key="library_hub"
              onClick={() => setLibrarySubTab('library_hub')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'library_hub'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Library className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">مخزن کلان کتابخانه</span>
            </Button>
            <Button
              type="button"
              data-key="npcs"
              onClick={() => setLibrarySubTab('npcs')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'npcs'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">موجودات ({npcs.length})</span>
            </Button>
            <Button
              type="button"
              data-key="items"
              onClick={() => setLibrarySubTab('items')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'items'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">اشیاء ({items.length})</span>
            </Button>
            <Button
              type="button"
              data-key="locations"
              onClick={() => setLibrarySubTab('locations')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'locations'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">مکان‌ها ({locations.length})</span>
            </Button>
            <Button
              type="button"
              data-key="handouts"
              onClick={() => setLibrarySubTab('handouts')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'handouts'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">اسناد و نقشه‌ها</span>
            </Button>
            <Button
              type="button"
              data-key="quests"
              onClick={() => setLibrarySubTab('quests')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'quests'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">مأموریت‌ها ({quests.length})</span>
            </Button>
            <Button
              type="button"
              data-key="reputation"
              onClick={() => setLibrarySubTab('reputation')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'reputation'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Flag className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">شهرت جناح‌ها</span>
            </Button>
            <Button
              type="button"
              data-key="treasury"
              onClick={() => setLibrarySubTab('treasury')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
                librarySubTab === 'treasury'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">خزانه گروه</span>
            </Button>
          </ScrollableRow>

          {librarySubTab === 'library_hub' && (
            <DmLibrary
              currentCampaignId={activeCampaign?.id || 'zorvania-c1'}
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
              weaponTemplates={weaponTemplates}
              onCreateItem={onCreateItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onGiveItem={onGiveItemToPlayer}
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
              campaignId={activeCampaign?.id || 'zorvania-c1'}
              campaignCharacters={characters.map(c => ({ id: c.id, name: c.name }))}
            />
          )}

          {librarySubTab === 'quests' && (
            <DmQuestManager
              campaignId={activeCampaign?.id || 'zorvania-c1'}
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
              campaignId={activeCampaign?.id || 'zorvania-c1'}
              userRole="owner"
              participations={participations}
            />
          )}

          {librarySubTab === 'treasury' && (
            <PartyTreasuryManager
              campaignId={activeCampaign?.id || 'zorvania-c1'}
              userRole="owner"
              campaignSettings={activeCampaign?.settings}
            />
          )}
        </div>
      )}

      {/* 4. Narrative (Notes & Endings) */}
      {activeTab === 'narrative' && (
        <div className="space-y-4">
          <ScrollableRow
            activeKey={narrativeSubTab}
            wrapperClassName="surface-card rounded-[12px] p-1 border border-border"
            className="gap-1"
          >
            <Button
              type="button"
              data-key="notes"
              onClick={() => setNarrativeSubTab('notes')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                narrativeSubTab === 'notes'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">یادداشت‌های کمپین ({campaignNotes.length})</span>
            </Button>
            <Button
              type="button"
              data-key="endings"
              onClick={() => setNarrativeSubTab('endings')}
              className={`py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                narrativeSubTab === 'endings'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">پایان‌بندی‌ها و سرنوشت</span>
            </Button>
          </ScrollableRow>

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

      {/* 5. More: Users, Invites, Audit Log, Settings & Seed */}
      {activeTab === 'more' && (
        <div className="space-y-4">
          <ScrollableRow
            activeKey={moreSubTab}
            wrapperClassName="surface-card rounded-[12px] p-1 border border-border"
            className="gap-1"
          >
            <Button
              type="button"
              data-key="users"
              onClick={() => setMoreSubTab('users')}
              className={`py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                moreSubTab === 'users'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">کاربران</span>
            </Button>
            <Button
              type="button"
              data-key="invites"
              onClick={() => setMoreSubTab('invites')}
              className={`py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                moreSubTab === 'invites'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">کدهای دعوت</span>
            </Button>
            <Button
              type="button"
              data-key="audit"
              onClick={() => setMoreSubTab('audit')}
              className={`py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                moreSubTab === 'audit'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">گزارش وقایع</span>
            </Button>
            <Button
              type="button"
              data-key="settings"
              onClick={() => setMoreSubTab('settings')}
              className={`py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start sm:flex-1 ${
                moreSubTab === 'settings'
                  ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap shrink-0">تنظیمات</span>
            </Button>
          </ScrollableRow>

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
            />
          )}
        </div>
      )}
    </div>
  );
};
