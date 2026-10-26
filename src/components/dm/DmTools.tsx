import React, { useState } from 'react';
import { Character, CharacterNote, NPC, ItemLibraryEntry, RewardPackage, CampaignNote, Encounter, User, WeaponTemplate } from '../../types';
import { DmDashboard } from './DmDashboard';
import { DmEncounterRunner } from './DmEncounterRunner';
import { DmNpcManager } from './DmNpcManager';
import { DmItemVault } from './DmItemVault';
import { DmCampaignNotes } from './DmCampaignNotes';
import { DmEndingTracker } from './DmEndingTracker';
import { DmSettings } from './DmSettings';
import { 
  LayoutDashboard, Swords, Library, Scroll, MoreHorizontal, 
  Users, Sparkles, BookOpen, Compass, Award 
} from 'lucide-react';

interface DmToolsProps {
  characters: Character[];
  sharedNotes: CharacterNote[];
  npcs: NPC[];
  items: ItemLibraryEntry[];
  rewards: RewardPackage[];
  campaignNotes: CampaignNote[];
  savedEncounters: Encounter[];
  users: User[];
  weaponTemplates: WeaponTemplate[];
  onUpdateCharacter: (char: Character) => void;
  onApplyGroupRest: (type: 'short' | 'long' | 'special') => void;
  onUpdateGroupResources: (delta: { rations?: number; lanternOil?: number }) => void;
  onInspectCharacter: (charId: string) => void;
  onSaveEncounter: (enc: Encounter) => void;
  onCreateNpc: (npc: Omit<NPC, 'id' | 'updatedAt'>) => void;
  onUpdateNpc: (npc: NPC) => void;
  onDeleteNpc: (id: string) => void;
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
}

export const DmTools: React.FC<DmToolsProps> = ({
  characters,
  sharedNotes,
  npcs,
  items,
  rewards,
  campaignNotes,
  savedEncounters,
  users,
  weaponTemplates,
  onUpdateCharacter,
  onApplyGroupRest,
  onUpdateGroupResources,
  onInspectCharacter,
  onSaveEncounter,
  onCreateNpc,
  onUpdateNpc,
  onDeleteNpc,
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
  onSelectDmTab
}) => {
  const [internalDmTab, setInternalDmTab] = useState<'dashboard' | 'encounters' | 'library' | 'narrative' | 'more'>('dashboard');
  const [librarySubTab, setLibrarySubTab] = useState<'npcs' | 'items' | 'rewards'>('npcs');
  const [narrativeSubTab, setNarrativeSubTab] = useState<'notes' | 'endings'>('notes');

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
    { id: 'more', label: 'بیشتر', icon: MoreHorizontal },
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
          sharedNotes={sharedNotes}
          onUpdateCharacter={onUpdateCharacter}
          onApplyGroupRest={onApplyGroupRest}
          onUpdateGroupResources={onUpdateGroupResources}
          onInspectCharacter={onInspectCharacter}
          onRollDice={onRollDice}
        />
      )}

      {/* 2. Encounters */}
      {activeTab === 'encounters' && (
        <DmEncounterRunner
          characters={characters}
          npcs={npcs}
          savedEncounters={savedEncounters}
          onSaveEncounter={onSaveEncounter}
          onRollDice={onRollDice}
        />
      )}

      {/* 3. Library (NPCs, Items, Rewards) */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="surface-card rounded-[14px] p-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLibrarySubTab('npcs')}
              className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                librarySubTab === 'npcs'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>هیولاها و NPCها ({npcs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLibrarySubTab('items')}
              className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                librarySubTab === 'items'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>گنجینه اشیاء و جوایز ({items.length})</span>
            </button>
          </div>

          {librarySubTab === 'npcs' && (
            <DmNpcManager
              npcs={npcs}
              onCreateNpc={onCreateNpc}
              onUpdateNpc={onUpdateNpc}
              onDeleteNpc={onDeleteNpc}
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
              onGiveItemToPlayer={onGiveItemToPlayer}
              onDistributeReward={onDistributeReward}
              onCreateReward={onCreateReward}
            />
          )}
        </div>
      )}

      {/* 4. Narrative (Campaign Notes, Endings) */}
      {activeTab === 'narrative' && (
        <div className="space-y-4">
          <div className="surface-card rounded-[14px] p-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNarrativeSubTab('notes')}
              className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
                narrativeSubTab === 'notes'
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                  : 'text-[#A39A89] hover:text-[#EDE6D8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>یادداشت‌های محرمانه کمپین ({campaignNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setNarrativeSubTab('endings')}
              className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
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

      {/* 5. More (Users, Settings, Seed import) */}
      {activeTab === 'more' && (
        <DmSettings
          users={users}
          onUpdateUserRole={onUpdateUserRole}
          onImportSeedIntoDb={onImportSeedIntoDb}
          isHttpMode={isHttpMode}
        />
      )}
    </div>
  );
};
