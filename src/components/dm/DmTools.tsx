import React, { useState } from 'react';
import { Character, CharacterNote, NPC, ItemLibraryEntry, RewardPackage, CampaignNote, Encounter, User, WeaponTemplate, LocationEntry, Campaign, CharacterParticipation, Session, SessionRsvpChoice, SessionRecap } from '../../types';
import { DmDashboard } from './DmDashboard';
import { DmEncounterRunner } from './DmEncounterRunner';
import { DmLibrary } from './DmLibrary';
import { DmNpcManager } from './DmNpcManager';
import { DmItemVault } from './DmItemVault';
import { DmLocationManager } from './DmLocationManager';
import { DmCampaignNotes } from './DmCampaignNotes';
import { DmEndingTracker } from './DmEndingTracker';
import { DmSettings } from './DmSettings';
import { DmUsers } from './DmUsers';
import { DmInvites } from './DmInvites';
import { DmAuditLog } from './DmAuditLog';
import { 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal, 
  Users, KeyRound, ShieldAlert, Sparkles, BookOpen, Compass, Award, Database, MapPin 
} from 'lucide-react';

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
  onEditRecap
}) => {
  const [internalDmTab, setInternalDmTab] = useState<'dashboard' | 'encounters' | 'library' | 'narrative' | 'more'>('dashboard');
  const [librarySubTab, setLibrarySubTab] = useState<'library_hub' | 'npcs' | 'items' | 'locations'>('library_hub');
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
      {/* Desktop / Tablet Sub-Navigation */}
      <div className="hidden sm:block surface-card rounded-[14px] p-1.5 border border-[#2F2A23]">
        <div className="flex items-center justify-between gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveDmTab(item.id)}
                className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                  isActive
                    ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                    : 'text-[#A39A89] hover:text-[#EDE6D8]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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
          <div className="surface-card rounded-[12px] p-1 border border-[#2F2A23] flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setLibrarySubTab('library_hub')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target whitespace-nowrap ${
                librarySubTab === 'library_hub'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>مخزن کلان کتابخانه</span>
            </button>
            <button
              type="button"
              onClick={() => setLibrarySubTab('npcs')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target whitespace-nowrap ${
                librarySubTab === 'npcs'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>موجودات ({npcs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLibrarySubTab('items')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target whitespace-nowrap ${
                librarySubTab === 'items'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>اشیاء ({items.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLibrarySubTab('locations')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target whitespace-nowrap ${
                librarySubTab === 'locations'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>مکان‌ها ({locations.length})</span>
            </button>
          </div>

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
        </div>
      )}

      {/* 4. Narrative (Notes & Endings) */}
      {activeTab === 'narrative' && (
        <div className="space-y-4">
          <div className="surface-card rounded-[12px] p-1 border border-[#2F2A23] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNarrativeSubTab('notes')}
              className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                narrativeSubTab === 'notes'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>یادداشت‌های کمپین ({campaignNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setNarrativeSubTab('endings')}
              className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                narrativeSubTab === 'endings'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>پایان‌بندی‌ها و سرنوشت</span>
            </button>
          </div>

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
          <div className="surface-card rounded-[12px] p-1 border border-[#2F2A23] flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setMoreSubTab('users')}
              className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                moreSubTab === 'users'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>کاربران</span>
            </button>
            <button
              type="button"
              onClick={() => setMoreSubTab('invites')}
              className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                moreSubTab === 'invites'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>کدهای دعوت</span>
            </button>
            <button
              type="button"
              onClick={() => setMoreSubTab('audit')}
              className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                moreSubTab === 'audit'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>گزارش وقایع</span>
            </button>
            <button
              type="button"
              onClick={() => setMoreSubTab('settings')}
              className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                moreSubTab === 'settings'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>پایگاه داده</span>
            </button>
          </div>

          {moreSubTab === 'users' && (
            <DmUsers characters={characters} onRefreshCharacters={onRefreshCharacters} />
          )}

          {moreSubTab === 'invites' && (
            <DmInvites characters={characters} />
          )}

          {moreSubTab === 'audit' && (
            <DmAuditLog />
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
