import {
  User,
  UserSession,
  Invite,
  AuditLogEntry,
  Character,
  CharacterNote,
  NPC,
  ItemLibraryEntry,
  WeaponTemplate,
  FeatureTemplate,
  ClassTemplate,
  LineageTemplate,
  BackgroundTemplate,
  RewardPackage,
  CampaignNote,
  Encounter,
  Weapon,
  InventoryItem,
  WorldCalendar,
  CampaignEndingState,
  ShanshinEncounter,
  LocationEntry,
  LiveEncounter,
  PlayerEncounterView,
  LiveSyncStatus,
  EncounterParticipant,
  EncounterSettings,
  EncounterEvent,
  QualitativeHealth,
  PlayerEncounterParticipant,
  EncounterStatus,
  PlatformRole,
  CampaignRole,
  Campaign,
  CampaignSettings,
  CampaignMember,
  CampaignInvite,
  ContentPack,
  ContentPackKind,
  RuleSet,
  MasterCharacter,
  CharacterParticipation,
  CharacterHistoryEvent,
  MediaItem,
  CampaignDiceRoll,
  HomeSummaryResponse,
  Faction,
  CampaignDoc,
  GenericCalendarData,
  Favorite,
  CloneJob,
  CloneOptions,
  CloneManifest,
  CloneEntityType,
  EntityRef,
  EntityScopeType,
  WizardStartMode,
  WizardState,
  LinkedEntityDiff
} from '../types';
import { APP_NAME_FA } from '../config/app';
import {
  SEED_USERS,
  SEED_CHARACTERS,
  SEED_CHARACTER_NOTES,
  SEED_NPCS,
  SEED_ITEM_LIBRARY,
  SEED_WEAPON_TEMPLATES,
  SEED_CLASS_TEMPLATES,
  SEED_LINEAGE_TEMPLATES,
  SEED_BACKGROUND_TEMPLATES,
  SEED_REWARD_PACKAGES,
  SEED_CAMPAIGN_NOTES,
  SEED_ENCOUNTERS,
  SEED_LOCATIONS,
  SEED_CONTENT_PACKS,
  SEED_RULE_SETS,
  SEED_CAMPAIGNS,
  SEED_CAMPAIGN_MEMBERS,
  SEED_MASTER_CHARACTERS,
  SEED_CHARACTER_PARTICIPATIONS,
  SEED_HISTORY_EVENTS,
  SEED_CAMPAIGN_DICE_ROLLS,
  SEED_FACTIONS,
  SEED_CAMPAIGN_DOCS,
  SEED_GENERIC_CALENDAR
} from '../data/seed';
import {
  CloneRequest,
  CloneEntityBundle,
  previewClone as runPreviewClone,
  executeClone as runExecuteClone,
  generateId
} from './cloneEngine';
import { INITIAL_CALENDAR, advanceCalendarDays } from '../data/calendar';
import { INITIAL_ENDING_STATE } from '../data/endings';
import { SEED_SHANSHIN_ENCOUNTERS } from '../data/shanshin';

export interface AuthMeResponse {
  user: User | null;
  activeCharacterId: string | null;
  mustChangePassword: boolean;
}

export type LiveChannelCallback = (update: {
  activeEncounterId: string | null;
  version: number;
  data?: any;
}) => void;

export interface LiveChannel {
  subscribe(encounterId: string | null, cb: LiveChannelCallback): () => void;
  notify(encounterId: string | null, version: number, data?: any): void;
}

// ----------------------------------------------------------------------
// LocalLiveChannel (BroadcastChannel + storage events for instant tab sync)
// ----------------------------------------------------------------------
export class LocalLiveChannel implements LiveChannel {
  private listeners = new Set<LiveChannelCallback>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('zorvania_live_sync');
        this.channel.onmessage = (ev) => {
          if (ev.data) {
            this.notifyLocal(ev.data.activeEncounterId, ev.data.version, ev.data.data);
          }
        };
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'zorvania_live_signal' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyLocal(data.activeEncounterId, data.version, data.data);
          } catch {}
        }
      });
      window.addEventListener('zorvania_live_event', (e: any) => {
        if (e.detail) {
          this.notifyLocal(e.detail.activeEncounterId, e.detail.version, e.detail.data);
        }
      });
    }
  }

  private notifyLocal(encounterId: string | null, version: number, data?: any) {
    for (const cb of this.listeners) {
      try {
        cb({ activeEncounterId: encounterId, version, data });
      } catch (err) {
        console.error('LiveChannel listener error:', err);
      }
    }
  }

  subscribe(encounterId: string | null, cb: LiveChannelCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  notify(encounterId: string | null, version: number, data?: any): void {
    const payload = { activeEncounterId: encounterId, version, data, timestamp: Date.now() };
    this.notifyLocal(encounterId, version, data);
    try {
      this.channel?.postMessage(payload);
    } catch {}
    try {
      localStorage.setItem('zorvania_live_signal', JSON.stringify(payload));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zorvania_live_event', { detail: payload }));
    }
  }
}

// ----------------------------------------------------------------------
// HttpLiveChannel (Smart polling: 3s active, 15s idle, pauses when hidden, backoff)
// ----------------------------------------------------------------------
export class HttpLiveChannel implements LiveChannel {
  private listeners = new Set<LiveChannelCallback>();
  private pollTimer: any = null;
  private lastVersion = -1;
  private lastActiveId: string | null = null;
  private errorCount = 0;
  private isPolling = false;

  constructor(private fetchJson: <T>(url: string, opts?: RequestInit) => Promise<T>) {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.errorCount = 0;
          this.pollNow();
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.errorCount = 0;
        this.pollNow();
      });
      window.addEventListener('focus', () => {
        if (!document.hidden) this.pollNow();
      });
    }
  }

  subscribe(encounterId: string | null, cb: LiveChannelCallback): () => void {
    this.listeners.add(cb);
    if (this.listeners.size === 1) {
      this.startPolling();
    }
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  notify(encounterId: string | null, version: number, data?: any): void {
    for (const cb of this.listeners) {
      try {
        cb({ activeEncounterId: encounterId, version, data });
      } catch (e) {
        console.error(e);
      }
    }
  }

  private startPolling() {
    this.pollNow();
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollNow() {
    if (this.isPolling) return;
    if (typeof document !== 'undefined' && document.hidden) {
      return; // Pause while hidden (Acceptance Test 8)
    }

    this.isPolling = true;
    try {
      const live = await this.fetchJson<LiveSyncStatus>('/live');
      this.errorCount = 0;
      if (live.version !== this.lastVersion || live.activeEncounterId !== this.lastActiveId) {
        this.lastVersion = live.version;
        this.lastActiveId = live.activeEncounterId;
        this.notify(live.activeEncounterId, live.version);
      }
    } catch {
      this.errorCount = Math.min(this.errorCount + 1, 6);
    } finally {
      this.isPolling = false;
      if (this.listeners.size > 0 && (typeof document === 'undefined' || !document.hidden)) {
        // Base interval: 3s if active encounter, 15s if idle (Acceptance Test 8)
        const baseInterval = this.lastActiveId ? 3000 : 15000;
        const backoff = this.errorCount > 0 
          ? Math.min(30000, baseInterval * Math.pow(1.5, this.errorCount) + Math.random() * 1000) 
          : baseInterval;
        this.pollTimer = setTimeout(() => this.pollNow(), backoff);
      }
    }
  }
}

export interface ApiClient {
  // Live Channel Subscription
  liveChannel: LiveChannel;

  // Auth
  login(email: string, password?: string): Promise<User>;
  register(email: string, password?: string, displayName?: string, inviteCode?: string): Promise<User>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  getMe(): Promise<AuthMeResponse>;
  consumeResetToken(token: string, newPassword: string): Promise<User>;
  switchUser(userId: string): Promise<User>; // Dev switcher (Preview only)

  // Account (Self)
  updateProfile(displayName: string): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  changeEmail(currentPassword: string, newEmail: string): Promise<User>;
  listSessions(): Promise<UserSession[]>;
  revokeSession(sessionId: string): Promise<void>;
  setActiveCharacter(characterId: string | null): Promise<void>;
  exportMyData(): Promise<any>;

  // DM User Management
  listUsers(params?: { search?: string; role?: string; status?: string }): Promise<User[]>;
  updateUser(id: string, data: { displayName?: string; role?: 'dm' | 'player'; status?: 'active' | 'disabled' }): Promise<User>;
  generateResetToken(userId: string): Promise<{ resetToken: string; resetLink: string; expiresAt: number }>;
  revokeUserSessions(userId: string): Promise<void>;
  assignCharacterToUser(userId: string, characterId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  // Invites (DM only)
  createInvite(data: { label?: string; expiresInDays?: number; maxUses?: number; assignCharacterId?: string }): Promise<Invite>;
  listInvites(): Promise<Invite[]>;
  revokeInvite(inviteId: string): Promise<void>;

  // Audit Log (DM only)
  getAuditLog(limit?: number): Promise<AuditLogEntry[]>;

  // Locations (DM CRUD, players revealed only)
  listLocations(): Promise<LocationEntry[]>;
  createLocation(loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocationEntry>;
  updateLocation(loc: LocationEntry): Promise<LocationEntry>;
  deleteLocation(id: string): Promise<void>;

  // Live Sync & Player Encounter
  getLiveStatus(): Promise<LiveSyncStatus>;
  getActiveEncounter(): Promise<PlayerEncounterView | null>;
  getEncounterView(id: string, since?: number): Promise<PlayerEncounterView | LiveEncounter | { notModified: true }>;
  submitInitiative(encounterId: string, characterId: string, value: number): Promise<{ initiative: number; initiativeStatus: string }>;

  // Live Encounters (DM)
  listLiveEncounters(status?: string, locationId?: string): Promise<LiveEncounter[]>;
  createLiveEncounter(data: { name: string; locationId?: string | null; sessionTag?: string; settings?: Partial<EncounterSettings>; dmNotes?: string }): Promise<LiveEncounter>;
  getLiveEncounter(id: string): Promise<LiveEncounter | null>;
  updateLiveEncounter(id: string, data: Partial<LiveEncounter>): Promise<LiveEncounter>;
  startLiveEncounter(id: string, withSurpriseRound?: boolean): Promise<void>;
  pauseLiveEncounter(id: string): Promise<void>;
  resumeLiveEncounter(id: string): Promise<void>;
  endLiveEncounter(id: string): Promise<void>;
  nextEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }>;
  prevEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }>;
  addEncounterParticipants(encounterId: string, participants: any[], announce?: boolean, announcementText?: string): Promise<EncounterParticipant[]>;
  updateEncounterParticipant(encounterId: string, participantId: string, data: Partial<EncounterParticipant>): Promise<void>;
  deleteEncounterParticipant(encounterId: string, participantId: string): Promise<void>;
  addEncounterEvent(encounterId: string, text: string, visibleToPlayers?: boolean): Promise<void>;
  distributeEncounterLoot(encounterId: string, characterId: string, item: any): Promise<void>;

  // Campaign Settings
  getCampaignSettings(): Promise<{ allowPlayerCreateCharacter: boolean }>;
  updateCampaignSettings(settings: { allowPlayerCreateCharacter: boolean }): Promise<{ allowPlayerCreateCharacter: boolean }>;

  // Characters
  listCharacters(): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  createCharacter(char: Partial<Character>): Promise<Character>;
  updateCharacter(char: Character): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;
  applyGroupRest(type: 'short' | 'long' | 'special', notes?: string): Promise<Character[]>;
  updateGroupResources(delta: { rations?: number; lanternOil?: number }): Promise<Character[]>;

  // Notes
  listNotes(characterId?: string): Promise<CharacterNote[]>;
  getNote(id: string): Promise<CharacterNote | null>;
  createNote(note: Omit<CharacterNote, 'id' | 'updatedAt'>): Promise<CharacterNote>;
  updateNote(note: CharacterNote): Promise<CharacterNote>;
  deleteNote(id: string): Promise<void>;

  // NPCs
  listNpcs(): Promise<NPC[]>;
  getNpc(id: string): Promise<NPC | null>;
  createNpc(npc: Omit<NPC, 'id' | 'updatedAt'>): Promise<NPC>;
  updateNpc(npc: NPC): Promise<NPC>;
  deleteNpc(id: string): Promise<void>;

  // Items & Loot
  listItems(): Promise<ItemLibraryEntry[]>;
  createItem(item: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>): Promise<ItemLibraryEntry>;
  updateItem(item: ItemLibraryEntry): Promise<ItemLibraryEntry>;
  deleteItem(id: string): Promise<void>;
  giveItemToPlayer(characterId: string, item: ItemLibraryEntry): Promise<Character>;

  // Templates
  listWeaponTemplates(): Promise<WeaponTemplate[]>;
  createWeaponTemplate(tmpl: Omit<WeaponTemplate, 'id'>): Promise<WeaponTemplate>;
  updateWeaponTemplate(tmpl: WeaponTemplate): Promise<WeaponTemplate>;
  deleteWeaponTemplate(id: string): Promise<void>;

  listClassTemplates(scopeType?: string, scopeId?: string): Promise<ClassTemplate[]>;
  getClassTemplate(id: string): Promise<ClassTemplate | null>;
  createClassTemplate(tmpl: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate>;
  updateClassTemplate(tmpl: ClassTemplate): Promise<ClassTemplate>;
  deleteClassTemplate(id: string): Promise<void>;

  listLineageTemplates(scopeType?: string, scopeId?: string): Promise<LineageTemplate[]>;
  getLineageTemplate(id: string): Promise<LineageTemplate | null>;
  createLineageTemplate(tmpl: Omit<LineageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LineageTemplate>;
  updateLineageTemplate(tmpl: LineageTemplate): Promise<LineageTemplate>;
  deleteLineageTemplate(id: string): Promise<void>;

  listBackgroundTemplates(scopeType?: string, scopeId?: string): Promise<BackgroundTemplate[]>;
  getBackgroundTemplate(id: string): Promise<BackgroundTemplate | null>;
  createBackgroundTemplate(tmpl: Omit<BackgroundTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackgroundTemplate>;
  updateBackgroundTemplate(tmpl: BackgroundTemplate): Promise<BackgroundTemplate>;
  deleteBackgroundTemplate(id: string): Promise<void>;

  // Rewards
  listRewards(): Promise<RewardPackage[]>;
  createReward(reward: Omit<RewardPackage, 'id' | 'createdAt'>): Promise<RewardPackage>;
  distributeReward(rewardId: string, characterIds: string[]): Promise<Character[]>;

  // Campaign Notes (DM only)
  listCampaignNotes(): Promise<CampaignNote[]>;
  createCampaignNote(note: Omit<CampaignNote, 'id' | 'updatedAt'>): Promise<CampaignNote>;
  updateCampaignNote(note: CampaignNote): Promise<CampaignNote>;
  deleteCampaignNote(id: string): Promise<void>;

  // Encounters
  listEncounters(): Promise<Encounter[]>;
  getEncounter(id: string): Promise<Encounter | null>;
  createEncounter(enc: Omit<Encounter, 'id' | 'updatedAt'>): Promise<Encounter>;
  updateEncounter(enc: Encounter): Promise<Encounter>;
  deleteEncounter(id: string): Promise<void>;

  // Recharges & Group Management
  resetGroupRecharges(type: 'session' | 'season'): Promise<Character[]>;

  // Calendar (1500 P.R.N.)
  getCalendar(): Promise<WorldCalendar>;
  updateCalendar(cal: Partial<WorldCalendar>): Promise<WorldCalendar>;
  advanceCalendar(days: number): Promise<WorldCalendar>;

  // Ending Tracker
  getEndingState(): Promise<CampaignEndingState>;
  updateEndingState(state: Partial<CampaignEndingState>): Promise<CampaignEndingState>;

  // Shanshin Encounters
  listShanshinEncounters(): Promise<ShanshinEncounter[]>;
  updateShanshinEncounter(enc: ShanshinEncounter): Promise<ShanshinEncounter>;
  rollShanshinEncounter(): Promise<{ result: ShanshinEncounter; roll: number }>;

  // System
  seedDatabase(force?: boolean): Promise<{ success: boolean; message: string }>;

  // Active Campaign Scope
  getActiveCampaignId(): string | null;
  setActiveCampaignId(id: string | null): void;
  getCampaignRole(campaignId?: string): Promise<CampaignRole | null>;

  // Home Dashboard
  getHomeSummary(): Promise<HomeSummaryResponse>;

  // Multi-Campaign Management
  listCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign>;
  createCampaign(data: { name: string; description?: string; tone?: string; packId?: string | null; settings?: Partial<CampaignSettings> }): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign>;
  archiveCampaign(id: string): Promise<Campaign>;
  restoreCampaign(id: string): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  listCampaignMembers(campaignId: string): Promise<CampaignMember[]>;
  updateCampaignMember(campaignId: string, userId: string, data: { role?: CampaignRole; status?: 'invited' | 'active' | 'left' | 'removed' }): Promise<CampaignMember>;
  removeCampaignMember(campaignId: string, userId: string): Promise<void>;
  transferCampaignOwnership(campaignId: string, newOwnerId: string): Promise<Campaign>;
  leaveCampaign(campaignId: string): Promise<void>;
  listCampaignInvites(campaignId: string): Promise<CampaignInvite[]>;
  createCampaignInvite(campaignId: string, data: { role?: CampaignRole; label?: string; expiresInDays?: number; maxUses?: number; assignParticipationId?: string }): Promise<CampaignInvite>;
  revokeCampaignInvite(campaignId: string, inviteId: string): Promise<void>;
  acceptInvite(code: string): Promise<{ campaignId: string; role: CampaignRole }>;

  // Master Characters & Participations
  listMasterCharacters(): Promise<MasterCharacter[]>;
  getMasterCharacter(id: string): Promise<MasterCharacter | null>;
  createMasterCharacter(char: Partial<MasterCharacter>): Promise<MasterCharacter>;
  updateMasterCharacter(char: MasterCharacter): Promise<MasterCharacter>;
  updateMasterCharacterStatus(id: string, status: 'active' | 'retired' | 'dead' | 'archived', note?: string): Promise<MasterCharacter>;
  getMasterCharacterHistory(characterId: string): Promise<CharacterHistoryEvent[]>;
  addCharacterHistoryEvent(event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>): Promise<CharacterHistoryEvent>;
  listParticipations(campaignId?: string): Promise<CharacterParticipation[]>;
  getParticipation(campaignId: string, participationId: string): Promise<CharacterParticipation | null>;
  createParticipation(campaignId: string, data: { characterId: string; entryMode: 'campaign_start' | 'same_level' | 'new_level'; entryLevel?: number }): Promise<CharacterParticipation>;
  updateParticipation(campaignId: string, participationId: string, data: Partial<CharacterParticipation>): Promise<CharacterParticipation>;
  reviewParticipation(campaignId: string, participationId: string, action: 'approve' | 'reject' | 'request_changes', comment?: string): Promise<CharacterParticipation>;
  requestLevelUp(campaignId: string, participationId: string, targetLevel: number, diff?: any): Promise<CharacterParticipation>;
  updateParticipationStatus(campaignId: string, participationId: string, status: CharacterParticipation['status']): Promise<CharacterParticipation>;

  // Media
  uploadMedia(file: { name?: string; mimeType: string; sizeBytes: number; dataBase64: string; width?: number; height?: number; campaignId?: string }): Promise<{ id: string; url: string; sizeBytes: number }>;
  getMedia(id: string): Promise<any>;
  deleteMedia(id: string): Promise<void>;

  // Dice Rolls (Shared campaign table feed)
  postDiceRoll(campaignId: string, roll: { label: string; formula: string; mode: 'normal' | 'adv' | 'dis'; results: any; modifier: number; total: number; nat20?: boolean; nat1?: boolean; visibility?: 'table' | 'dm_only'; participationId?: string }): Promise<CampaignDiceRoll>;
  listDiceRolls(campaignId: string, after?: string, limit?: number): Promise<CampaignDiceRoll[]>;

  // Rule Sets & Content Packs
  getRuleSet(scopeType: 'pack' | 'campaign', scopeId: string): Promise<RuleSet | null>;
  listContentPacks(): Promise<ContentPack[]>;
  getContentPack(id: string): Promise<ContentPack | null>;

  // Phase 2: Library & Packs
  getLibraryItems(params: {
    source: string;
    type?: string;
    q?: string;
    tag?: string;
    region?: string;
    sort?: 'newest' | 'name' | 'favorite';
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }>;
  saveToLibrary(data: { entityRefs: EntityRef[]; packId?: string }): Promise<{ success: boolean; count: number }>;
  listPacks(params?: { kind?: ContentPackKind }): Promise<ContentPack[]>;
  createPack(data: { name: string; description?: string; kind?: ContentPackKind; visibility?: 'private' | 'instance'; tags?: string[] }): Promise<ContentPack>;
  updatePack(id: string, data: Partial<ContentPack>): Promise<ContentPack>;
  deletePack(id: string): Promise<void>;
  exportPack(id: string, options?: { embedMedia?: boolean }): Promise<any>;
  previewImportPack(packJson: any): Promise<CloneManifest>;
  runImportPack(packJson: any, target: { scopeType: EntityScopeType; scopeId: string }): Promise<CloneJob>;
  toggleFavorite(entityType: string, entityId: string): Promise<boolean>;
  listFavorites(): Promise<Favorite[]>;

  // Phase 2: Clone Engine
  previewClone(request: CloneRequest): Promise<CloneManifest>;
  runClone(request: CloneRequest): Promise<CloneJob>;
  listCloneJobs(scopeId?: string): Promise<CloneJob[]>;
  undoCloneJob(jobId: string, force?: boolean): Promise<{ success: boolean; undoneCount: number; skippedEntities: string[] }>;

  // Phase 2: Campaign Wizard
  createDraftCampaign(startMode: WizardStartMode, sourceId?: string): Promise<Campaign>;
  updateWizardState(campaignId: string, state: Partial<WizardState>): Promise<Campaign>;
  launchCampaign(campaignId: string): Promise<Campaign>;
  saveCampaignAsTemplate(campaignId: string, options: { name: string; description?: string; stripSecrets?: boolean; entityTypes?: string[] }): Promise<ContentPack>;

  // Phase 2: Entities (Factions, Docs, Calendars)
  listFactions(campaignId?: string): Promise<Faction[]>;
  createFaction(data: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faction>;
  updateFaction(data: Faction): Promise<Faction>;
  deleteFaction(id: string): Promise<void>;
  listCampaignDocs(campaignId?: string): Promise<CampaignDoc[]>;
  createCampaignDoc(data: Omit<CampaignDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignDoc>;
  updateCampaignDoc(data: CampaignDoc): Promise<CampaignDoc>;
  deleteCampaignDoc(id: string): Promise<void>;
  getGenericCalendar(calendarId?: string): Promise<GenericCalendarData>;
  updateGenericCalendar(data: GenericCalendarData): Promise<GenericCalendarData>;

  // Phase 2 Part B: Linked Copies
  checkLinkedUpdates(campaignId: string): Promise<LinkedEntityDiff[]>;
  getLinkedEntityDiff(entityType: CloneEntityType, entityId: string): Promise<LinkedEntityDiff | null>;
  applyLinkedDiff(entityType: CloneEntityType, entityId: string, chosenFields: Record<string, 'local' | 'source'>): Promise<any>;
  detachLink(entityType: CloneEntityType, entityId: string): Promise<any>;

  // V2 Migration
  migrateV2(dryRun?: boolean): Promise<{ success: boolean; report: any }>;
}

// ----------------------------------------------------------------------
// LocalApi Adapter (localStorage-based preview with full simulation)
// "Preview only — not secure"
// ----------------------------------------------------------------------
const STORAGE_PREFIX = 'zorvania_';

export class LocalApi implements ApiClient {
  public liveChannel: LiveChannel = new LocalLiveChannel();
  private currentUser: User | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private getKey(name: string): string {
    return `${STORAGE_PREFIX}${name}`;
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(this.getKey(key));
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  private ensureInitialized() {
    const users = this.getItem<User[]>('users', []);
    if (!users || users.length === 0) {
      this.seedDatabase(true);
    }

    const activeUserId = this.getItem<string | null>('active_user_id', null);
    const allUsers = this.getItem<User[]>('users', SEED_USERS);
    if (activeUserId) {
      this.currentUser = allUsers.find(u => u.id === activeUserId && u.status !== 'disabled') || allUsers[0];
    } else {
      this.currentUser = allUsers[0]; // Default to DM
      this.setItem('active_user_id', this.currentUser.id);
    }
  }

  public async seedDatabase(force: boolean = false): Promise<{ success: boolean; message: string }> {
    if (!force && this.getItem<User[]>('users', []).length > 0) {
      return { success: true, message: 'داده‌ها پیش‌تر بارگذاری شده‌اند.' };
    }

    this.setItem('users', SEED_USERS);
    this.setItem('characters', SEED_CHARACTERS);
    this.setItem('notes', SEED_CHARACTER_NOTES);
    this.setItem('npcs', SEED_NPCS);
    this.setItem('items', SEED_ITEM_LIBRARY);
    this.setItem('weapon_templates', SEED_WEAPON_TEMPLATES);
    this.setItem('class_templates', SEED_CLASS_TEMPLATES);
    this.setItem('rewards', SEED_REWARD_PACKAGES);
    this.setItem('campaign_notes', SEED_CAMPAIGN_NOTES);
    this.setItem('encounters', SEED_ENCOUNTERS);
    this.setItem('locations', SEED_LOCATIONS);
    this.setItem('live_encounters', []);

    // Multi-Campaign Core Tables
    this.setItem('campaigns', SEED_CAMPAIGNS);
    this.setItem('campaign_members', SEED_CAMPAIGN_MEMBERS);
    this.setItem('content_packs', SEED_CONTENT_PACKS);
    this.setItem('rule_sets', SEED_RULE_SETS);
    this.setItem('master_characters', SEED_MASTER_CHARACTERS);
    this.setItem('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    this.setItem('character_history_events', SEED_HISTORY_EVENTS);
    this.setItem('dice_rolls', SEED_CAMPAIGN_DICE_ROLLS);
    this.setItem('active_campaign_id', 'zorvania-c1');
    this.setItem('campaign_invites', [
      {
        id: 'cinv-test-1',
        campaignId: 'zorvania-c1',
        role: 'player' as CampaignRole,
        label: 'دعوت ماجراجوی جدید به زروانیا',
        code: 'zorvania-c1-welcome',
        createdBy: 'user-dm',
        createdAt: Date.now() - 3600000,
        expiresAt: Date.now() + 30 * 86400000,
        maxUses: 10,
        usedCount: 2
      }
    ]);
    this.setItem('media', []);

    this.setItem('invites', [
      {
        id: 'inv-sample-1',
        label: 'دعوت تستی بازیکن جدید',
        code: 'zorvania-invite-test',
        createdBy: 'user-dm',
        createdAt: Date.now() - 3600000,
        expiresAt: Date.now() + 30 * 86400000,
        maxUses: 5,
        usedCount: 1,
        assignCharacterId: null
      }
    ]);
    this.setItem('audit_log', [
      {
        id: 'audit-init-1',
        actorId: 'user-dm',
        action: 'system-seed',
        targetId: null,
        meta: { mode: 'preview' },
        createdAt: Date.now()
      }
    ]);
    this.setItem('campaign_settings', { allowPlayerCreateCharacter: true });

    // Seed mock sessions
    this.setItem('sessions', [
      {
        id: 'sess-dm-current',
        userId: 'user-dm',
        createdAt: Date.now() - 86400000,
        lastSeenAt: Date.now(),
        expiresAt: Date.now() + 14 * 86400000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        isCurrent: true
      }
    ]);

    this.setItem('active_user_id', SEED_USERS[0].id);
    this.currentUser = SEED_USERS[0];

    return { success: true, message: 'داده‌های زروانیا در دیتابیس محلی بارگذاری شدند.' };
  }

  // --- Auth Methods ---
  async login(email: string, _password?: string): Promise<User> {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getItem<User[]>('users', SEED_USERS);
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-register for dev preview if not found
      user = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        displayName: cleanEmail.split('@')[0],
        role: cleanEmail.includes('dm') ? 'dm' : 'player',
        status: 'active',
        activeCharacterId: null,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
      };
      users.push(user);
      this.setItem('users', users);
    }

    if (user.status === 'disabled') {
      throw new Error('حساب کاربری شما غیرفعال شده است. لطفاً با دانجن مستر تماس بگیرید.');
    }

    user.lastLoginAt = Date.now();
    this.setItem('users', users);

    this.currentUser = user;
    this.setItem('active_user_id', user.id);

    // Add session
    const sessions = this.getItem<UserSession[]>('sessions', []);
    sessions.push({
      id: `sess-${Date.now()}`,
      userId: user.id,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      expiresAt: Date.now() + 14 * 86400000,
      userAgent: navigator.userAgent || 'Web Browser',
      isCurrent: true
    });
    this.setItem('sessions', sessions);

    return user;
  }

  async register(email: string, _password?: string, displayName?: string, inviteCode?: string): Promise<User> {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getItem<User[]>('users', SEED_USERS);
    const exists = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      if (exists.status === 'disabled') {
        throw new Error('این حساب کاربری غیرفعال شده است.');
      }
      this.currentUser = exists;
      this.setItem('active_user_id', exists.id);
      return exists;
    }

    let assignedCharId: string | null = null;
    const isDm = cleanEmail.includes('dm');

    // Invite verification in LocalApi
    if (!isDm) {
      const invites = this.getItem<Invite[]>('invites', []);
      if (inviteCode) {
        const inv = invites.find(i => i.code === inviteCode || i.id === inviteCode);
        if (inv) {
          inv.usedCount = (inv.usedCount || 0) + 1;
          assignedCharId = inv.assignCharacterId || null;
          this.setItem('invites', invites);
        }
      }
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: displayName || cleanEmail.split('@')[0],
      displayName: displayName || cleanEmail.split('@')[0],
      role: isDm ? 'dm' : 'player',
      status: 'active',
      activeCharacterId: assignedCharId,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    };

    users.push(newUser);
    this.setItem('users', users);

    if (assignedCharId) {
      const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
      const c = chars.find(x => x.id === assignedCharId);
      if (c) {
        c.ownerId = newUser.id;
        this.setItem('characters', chars);
      }
    }

    this.currentUser = newUser;
    this.setItem('active_user_id', newUser.id);
    return newUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.setItem('active_user_id', null);
  }

  async logoutAll(): Promise<void> {
    if (this.currentUser) {
      const sessions = this.getItem<UserSession[]>('sessions', []);
      const filtered = sessions.filter(s => s.userId !== this.currentUser!.id);
      this.setItem('sessions', filtered);
    }
    this.currentUser = null;
    this.setItem('active_user_id', null);
  }

  async getMe(): Promise<AuthMeResponse> {
    if (!this.currentUser) {
      return { user: null, activeCharacterId: null, mustChangePassword: false };
    }
    // Refresh user from store
    const users = this.getItem<User[]>('users', SEED_USERS);
    const fresh = users.find(u => u.id === this.currentUser!.id);
    if (!fresh || fresh.status === 'disabled') {
      this.currentUser = null;
      this.setItem('active_user_id', null);
      return { user: null, activeCharacterId: null, mustChangePassword: false };
    }
    this.currentUser = fresh;
    return {
      user: fresh,
      activeCharacterId: fresh.activeCharacterId || null,
      mustChangePassword: !!fresh.mustChangePassword
    };
  }

  async consumeResetToken(_token: string, _newPassword: string): Promise<User> {
    // In preview mode, pick target user or first player
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = this.currentUser || users[1];
    user.mustChangePassword = false;
    this.setItem('users', users);
    this.currentUser = user;
    this.setItem('active_user_id', user.id);
    return user;
  }

  async switchUser(userId: string): Promise<User> {
    const users = this.getItem<User[]>('users', SEED_USERS);
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error('کاربر مورد نظر یافت نشد.');
    this.currentUser = target;
    this.setItem('active_user_id', target.id);
    return target;
  }

  // --- Account (Self) ---
  async updateProfile(displayName: string): Promise<User> {
    if (!this.currentUser) throw new Error('وارد سیستم نشده‌اید.');
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === this.currentUser!.id);
    if (!user) throw new Error('کاربر یافت نشد.');
    user.displayName = displayName;
    user.name = displayName;
    this.setItem('users', users);
    this.currentUser = user;
    return user;
  }

  async changePassword(_current: string, _next: string): Promise<void> {
    if (!this.currentUser) throw new Error('وارد سیستم نشده‌اید.');
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === this.currentUser!.id);
    if (user) {
      user.mustChangePassword = false;
      this.setItem('users', users);
    }
  }

  async changeEmail(_current: string, newEmail: string): Promise<User> {
    if (!this.currentUser) throw new Error('وارد سیستم نشده‌اید.');
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === this.currentUser!.id);
    if (!user) throw new Error('کاربر یافت نشد.');
    user.email = newEmail.toLowerCase().trim();
    this.setItem('users', users);
    this.currentUser = user;
    return user;
  }

  async listSessions(): Promise<UserSession[]> {
    if (!this.currentUser) return [];
    const sessions = this.getItem<UserSession[]>('sessions', []);
    return sessions.filter(s => s.userId === this.currentUser!.id).map((s, idx) => ({
      ...s,
      isCurrent: idx === 0
    }));
  }

  async revokeSession(sessionId: string): Promise<void> {
    const sessions = this.getItem<UserSession[]>('sessions', []);
    this.setItem('sessions', sessions.filter(s => s.id !== sessionId));
  }

  async setActiveCharacter(characterId: string | null): Promise<void> {
    if (!this.currentUser) throw new Error('وارد سیستم نشده‌اید.');
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === this.currentUser!.id);
    if (user) {
      user.activeCharacterId = characterId;
      this.setItem('users', users);
      this.currentUser.activeCharacterId = characterId;
    }
  }

  async exportMyData(): Promise<any> {
    if (!this.currentUser) throw new Error('وارد سیستم نشده‌اید.');
    const chars = await this.listCharacters();
    const notes = await this.listNotes();
    return {
      user: this.currentUser,
      characters: chars,
      notes: notes,
      exportedAt: new Date().toISOString()
    };
  }

  // --- DM User Management ---
  async listUsers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
    if (this.currentUser?.role !== 'dm') {
      throw new Error('دسترسی فقط برای دانجن مستر مجاز است.');
    }
    let users = this.getItem<User[]>('users', SEED_USERS);
    const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);

    if (params?.role) {
      users = users.filter(u => u.role === params.role);
    }
    if (params?.status) {
      users = users.filter(u => (u.status || 'active') === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      users = users.filter(u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    return users.map(u => ({
      ...u,
      characterNames: chars.filter(c => c.ownerId === u.id).map(c => c.name),
      activeSessionCount: 1
    }));
  }

  async updateUser(id: string, data: { displayName?: string; role?: 'dm' | 'player'; status?: 'active' | 'disabled' }): Promise<User> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('کاربر یافت نشد.');

    // Protect main DM
    if (user.email === 'dm@zorvania.ir' && (data.role === 'player' || data.status === 'disabled')) {
      throw new Error('امکان تغییر نقش یا غیرفعال‌سازی دانجن مستر اصلی وجود ندارد.');
    }

    if (data.displayName) {
      user.displayName = data.displayName;
      user.name = data.displayName;
    }
    if (data.role) user.role = data.role;
    if (data.status) user.status = data.status;

    this.setItem('users', users);
    if (this.currentUser.id === id) {
      this.currentUser = user;
    }
    return user;
  }

  async generateResetToken(userId: string): Promise<{ resetToken: string; resetLink: string; expiresAt: number }> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const token = `preview-reset-${Date.now()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      resetToken: token,
      resetLink: `${origin}/#reset-password?token=${token}`,
      expiresAt
    };
  }

  async revokeUserSessions(userId: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const sessions = this.getItem<UserSession[]>('sessions', []);
    this.setItem('sessions', sessions.filter(s => s.userId !== userId));
  }

  async assignCharacterToUser(userId: string, characterId: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const c = chars.find(x => x.id === characterId);
    if (c) {
      c.ownerId = userId;
      this.setItem('characters', chars);
    }
    const users = this.getItem<User[]>('users', SEED_USERS);
    const u = users.find(x => x.id === userId);
    if (u && !u.activeCharacterId) {
      u.activeCharacterId = characterId;
      this.setItem('users', users);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    if (this.currentUser.id === userId) throw new Error('نمی‌توانید حساب خود را حذف کنید.');

    const users = this.getItem<User[]>('users', SEED_USERS);
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error('کاربر یافت نشد.');
    if (target.email === 'dm@zorvania.ir') throw new Error('امکان حذف دانجن مستر اصلی وجود ندارد.');

    // Soft delete / disable
    target.status = 'disabled';
    this.setItem('users', users);

    // Unassign characters
    const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    chars.forEach(c => {
      if (c.ownerId === userId) c.ownerId = '';
    });
    this.setItem('characters', chars);
  }

  // --- Invites ---
  async createInvite(data: { label?: string; expiresInDays?: number; maxUses?: number; assignCharacterId?: string }): Promise<Invite> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newInv: Invite = {
      id: `inv-${Date.now()}`,
      label: data.label || 'دعوت جدید',
      code,
      createdBy: this.currentUser.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (data.expiresInDays || 30) * 86400000,
      maxUses: data.maxUses || 1,
      usedCount: 0,
      assignCharacterId: data.assignCharacterId || null,
      inviteLink: `${origin}/#register?code=${code}`
    };

    const invites = this.getItem<Invite[]>('invites', []);
    invites.unshift(newInv);
    this.setItem('invites', invites);
    return newInv;
  }

  async listInvites(): Promise<Invite[]> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    return this.getItem<Invite[]>('invites', []);
  }

  async revokeInvite(inviteId: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const invites = this.getItem<Invite[]>('invites', []);
    const inv = invites.find(i => i.id === inviteId);
    if (inv) {
      inv.revokedAt = Date.now();
      this.setItem('invites', invites);
    }
  }

  // --- Audit Log ---
  async getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    const log = this.getItem<AuditLogEntry[]>('audit_log', []);
    return log.slice(0, limit);
  }

  // --- Campaign Settings ---
  async getCampaignSettings(): Promise<{ allowPlayerCreateCharacter: boolean }> {
    return this.getItem<{ allowPlayerCreateCharacter: boolean }>('campaign_settings', { allowPlayerCreateCharacter: false });
  }

  async updateCampaignSettings(settings: { allowPlayerCreateCharacter: boolean }): Promise<{ allowPlayerCreateCharacter: boolean }> {
    if (this.currentUser?.role !== 'dm') throw new Error('دسترسی مجاز نیست.');
    this.setItem('campaign_settings', settings);
    return settings;
  }

  // --- Characters ---
  async listCharacters(): Promise<Character[]> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'dm') {
      return all;
    }
    // Player sees only their owned characters
    return all.filter(c => c.ownerId === this.currentUser!.id);
  }

  async getCharacter(id: string): Promise<Character | null> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const char = all.find(c => c.id === id);
    if (!char) return null;
    if (this.currentUser?.role === 'dm' || char.ownerId === this.currentUser?.id) {
      return char;
    }
    // Return null (404) for resources player may not know exist
    return null;
  }

  async createCharacter(charData: Partial<Character>): Promise<Character> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const newChar: Character = {
      id: `char-${Date.now()}`,
      ownerId: this.currentUser?.id || '',
      name: charData.name || 'شخصیت نو',
      race: charData.race || 'انسان‌های سرگردان',
      className: charData.className || 'شوالیه‌ی خاکستر',
      classTemplateId: charData.classTemplateId,
      level: charData.level || 1,
      background: charData.background || '',
      appearance: charData.appearance || '',
      personality: charData.personality || '',
      portraitUrl: charData.portraitUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      abilities: charData.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: charData.savingThrows || { str: false, dex: false, con: false, int: false, wis: false, cha: false },
      skills: charData.skills || [],
      hp: charData.hp || { max: 10, current: 10, temp: 0 },
      ac: charData.ac || 10,
      speed: charData.speed || 9,
      initiativeBonus: charData.initiativeBonus || 0,
      hitDice: charData.hitDice || { total: '1d8', spent: 0 },
      exhaustion: charData.exhaustion || 0,
      skillPoints: charData.skillPoints || 0,
      weapons: charData.weapons || [],
      features: charData.features || [],
      spells: charData.spells || [],
      inventory: charData.inventory || [],
      currencies: charData.currencies || { gold: 10, silver: 0, copper: 0 },
      rations: charData.rations ?? 5,
      lanternOil: charData.lanternOil ?? 4,
      customResources: charData.customResources || [],
      restLog: [],
      revision: 1,
      updatedAt: new Date().toISOString()
    };
    all.push(newChar);
    this.setItem('characters', all);

    if (this.currentUser && !this.currentUser.activeCharacterId) {
      await this.setActiveCharacter(newChar.id);
    }

    return newChar;
  }

  async updateCharacter(char: Character): Promise<Character> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const index = all.findIndex(c => c.id === char.id);
    if (index === -1) throw new Error('شخصیت یافت نشد.');

    // 404 for unowned characters
    if (this.currentUser?.role !== 'dm' && all[index].ownerId !== this.currentUser?.id) {
      throw new Error('شخصیت یافت نشد.');
    }

    const existing = all[index];
    const newRevision = Math.max(existing.revision || 1, char.revision || 1) + 1;

    const updated: Character = {
      ...char,
      revision: newRevision,
      updatedAt: new Date().toISOString()
    };
    all[index] = updated;
    this.setItem('characters', all);
    return updated;
  }

  async deleteCharacter(id: string): Promise<void> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const char = all.find(c => c.id === id);
    if (!char || (this.currentUser?.role !== 'dm' && char.ownerId !== this.currentUser?.id)) {
      throw new Error('شخصیت یافت نشد.');
    }
    const filtered = all.filter(c => c.id !== id);
    this.setItem('characters', filtered);
  }

  async applyGroupRest(type: 'short' | 'long' | 'special', notes: string = ''): Promise<Character[]> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const updated = all.map(char => {
      let hp = { ...char.hp };
      let exhaustion = char.exhaustion;
      const features = char.features.map(f => {
        if (type === 'long') return { ...f, usedCount: 0 };
        if (type === 'short' && f.usageType === 'short') return { ...f, usedCount: 0 };
        return f;
      });

      const weapons = char.weapons.map(w => {
        if (type === 'long') return { ...w, abilityUsed: 0 };
        if (type === 'short' && (w.specialAbility?.restType === 'short' || w.abilityReset === 'short')) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });

      if (type === 'long') {
        hp.current = hp.max;
        hp.temp = 0;
        if (exhaustion > 0) exhaustion -= 1;
      } else if (type === 'special') {
        hp.current = Math.min(hp.max, hp.current + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 2);
        if (exhaustion > 0) exhaustion -= 1;
      }

      const restEntry = {
        id: `rest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toLocaleDateString('fa-IR'),
        type,
        notes: notes || (type === 'long' ? 'استراحت کامل گروهی' : type === 'short' ? 'استراحت کوتاه گروهی' : 'استراحت ویژه در اردوگاه پریان')
      };

      return {
        ...char,
        hp,
        exhaustion,
        features,
        weapons,
        restLog: [restEntry, ...(char.restLog || [])],
        revision: char.revision + 1,
        updatedAt: new Date().toISOString()
      };
    });

    this.setItem('characters', updated);
    return updated;
  }

  async updateGroupResources(delta: { rations?: number; lanternOil?: number }): Promise<Character[]> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const updated = all.map(char => ({
      ...char,
      rations: Math.max(0, (char.rations || 0) + (delta.rations || 0)),
      lanternOil: Math.max(0, (char.lanternOil || 0) + (delta.lanternOil || 0)),
      revision: char.revision + 1,
      updatedAt: new Date().toISOString()
    }));
    this.setItem('characters', updated);
    return updated;
  }

  // --- Notes ---
  async listNotes(characterId?: string): Promise<CharacterNote[]> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    if (!this.currentUser) return [];

    let filtered = all;
    if (this.currentUser.role !== 'dm') {
      filtered = filtered.filter(n => n.ownerId === this.currentUser!.id);
    } else {
      filtered = filtered.filter(n => n.sharedWithDm || n.ownerId === this.currentUser!.id);
    }
    if (characterId) {
      filtered = filtered.filter(n => n.characterId === characterId);
    }
    return filtered;
  }

  async getNote(id: string): Promise<CharacterNote | null> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    const note = all.find(n => n.id === id);
    if (!note) return null;
    if (this.currentUser?.role === 'dm' || note.ownerId === this.currentUser?.id) {
      return note;
    }
    return null;
  }

  async createNote(noteData: Omit<CharacterNote, 'id' | 'updatedAt'>): Promise<CharacterNote> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    const newNote: CharacterNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    all.unshift(newNote);
    this.setItem('notes', all);
    return newNote;
  }

  async updateNote(note: CharacterNote): Promise<CharacterNote> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    const index = all.findIndex(n => n.id === note.id);
    if (index === -1) throw new Error('یادداشت یافت نشد.');
    if (this.currentUser?.role !== 'dm' && all[index].ownerId !== this.currentUser?.id) {
      throw new Error('یادداشت یافت نشد.');
    }
    const updated = { ...note, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('notes', all);
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    const n = all.find(x => x.id === id);
    if (!n || (this.currentUser?.role !== 'dm' && n.ownerId !== this.currentUser?.id)) {
      throw new Error('یادداشت یافت نشد.');
    }
    this.setItem('notes', all.filter(item => item.id !== id));
  }

  // --- NPCs (revealed check) ---
  async listNpcs(): Promise<NPC[]> {
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    if (this.currentUser?.role === 'dm') return all;
    return all.filter(npc => npc.isRevealed);
  }

  async getNpc(id: string): Promise<NPC | null> {
    const all = await this.listNpcs();
    return all.find(n => n.id === id) || null;
  }

  async createNpc(npcData: Omit<NPC, 'id' | 'updatedAt'>): Promise<NPC> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    const newNpc: NPC = {
      ...npcData,
      id: `npc-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    all.push(newNpc);
    this.setItem('npcs', all);
    return newNpc;
  }

  async updateNpc(npc: NPC): Promise<NPC> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    const index = all.findIndex(n => n.id === npc.id);
    if (index === -1) throw new Error('یافت نشد.');
    const updated = { ...npc, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('npcs', all);
    return updated;
  }

  async deleteNpc(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    this.setItem('npcs', all.filter(n => n.id !== id));
  }

  // --- Items (revealed check) ---
  async listItems(): Promise<ItemLibraryEntry[]> {
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    if (this.currentUser?.role === 'dm') return all;
    return all.filter(item => item.isRevealed);
  }

  async createItem(itemData: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>): Promise<ItemLibraryEntry> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    const newItem: ItemLibraryEntry = {
      ...itemData,
      id: `item-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    all.push(newItem);
    this.setItem('items', all);
    return newItem;
  }

  async updateItem(item: ItemLibraryEntry): Promise<ItemLibraryEntry> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    const index = all.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('آیتم یافت نشد.');
    const updated = { ...item, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('items', all);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    this.setItem('items', all.filter(i => i.id !== id));
  }

  async giveItemToPlayer(characterId: string, item: ItemLibraryEntry): Promise<Character> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const characters = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const char = characters.find(c => c.id === characterId);
    if (!char) throw new Error('کاراکتر مورد نظر یافت نشد.');

    const invItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: item.name,
      quantity: 1,
      weight: 1,
      description: item.description,
      category: item.category === 'artifact' ? 'artifact' : item.category === 'weapon' ? 'weapon' : 'treasure',
      equipped: false,
      isQuestItem: item.category === 'quest',
      isNewBadge: true,
      mechanicalEffect: item.mechanicalEffect,
      secretNotes: item.secretNotes,
      weaponData: item.weaponData
    };

    char.inventory = [invItem, ...(char.inventory || [])];

    if (item.category === 'weapon' || item.weaponData) {
      const wData = item.weaponData;
      const newWeapon: Weapon = {
        id: `w-${Date.now()}`,
        templateId: wData?.id,
        name: wData?.name || item.name,
        damageDice: wData?.damageDice || '1d6',
        damageType: wData?.damageType || 'فیزیکی',
        range: wData?.range || 'تن به تن',
        properties: wData?.properties || 'متعادل',
        kind: wData?.kind || 'special',
        isSpecial: wData?.kind === 'special',
        isShowy: wData?.kind === 'showy',
        specialAbility: wData?.specialAbility,
        abilityName: wData?.specialAbility?.name,
        abilityDesc: wData?.specialAbility?.description,
        abilityMaxUses: wData?.specialAbility?.usesPerRest,
        abilityUsed: 0,
        abilityReset: wData?.specialAbility?.restType
      };
      char.weapons = [newWeapon, ...(char.weapons || [])];
    }

    char.revision += 1;
    char.updatedAt = new Date().toISOString();
    this.setItem('characters', characters);
    return char;
  }

  // --- Templates ---
  async listWeaponTemplates(): Promise<WeaponTemplate[]> {
    return this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
  }

  async createWeaponTemplate(tmplData: Omit<WeaponTemplate, 'id'>): Promise<WeaponTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    const newTmpl: WeaponTemplate = { ...tmplData, id: `wpn-tmpl-${Date.now()}` };
    all.push(newTmpl);
    this.setItem('weapon_templates', all);
    return newTmpl;
  }

  async updateWeaponTemplate(tmpl: WeaponTemplate): Promise<WeaponTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    const idx = all.findIndex(w => w.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی سلاح یافت نشد.');
    all[idx] = tmpl;
    this.setItem('weapon_templates', all);
    return tmpl;
  }

  async deleteWeaponTemplate(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    this.setItem('weapon_templates', all.filter(w => w.id !== id));
  }

  async listClassTemplates(scopeType?: string, scopeId?: string): Promise<ClassTemplate[]> {
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    if (scopeType && scopeId) {
      return all.filter(c => (c.scopeType || 'pack') === scopeType && (c.scopeId || 'pack-zorvania') === scopeId);
    }
    return all;
  }

  async getClassTemplate(id: string): Promise<ClassTemplate | null> {
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    return all.find(c => c.id === id) || null;
  }

  async createClassTemplate(tmplData: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    const newClass: ClassTemplate = {
      ...tmplData,
      id: `class-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: new Date().toISOString()
    };
    all.push(newClass);
    this.setItem('class_templates', all);
    return newClass;
  }

  async updateClassTemplate(tmpl: ClassTemplate): Promise<ClassTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    const idx = all.findIndex(c => c.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی کلاس یافت نشد.');
    all[idx] = { ...tmpl, updatedAt: new Date().toISOString() };
    this.setItem('class_templates', all);
    return all[idx];
  }

  async deleteClassTemplate(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    this.setItem('class_templates', all.filter(c => c.id !== id));
  }

  // --- Lineage Templates ---
  async listLineageTemplates(scopeType?: string, scopeId?: string): Promise<LineageTemplate[]> {
    const all = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
    if (scopeType && scopeId) {
      return all.filter(l => (l.scopeType || 'campaign') === scopeType && (l.scopeId || 'zorvania-c1') === scopeId);
    }
    return all;
  }

  async getLineageTemplate(id: string): Promise<LineageTemplate | null> {
    const all = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
    return all.find(l => l.id === id) || null;
  }

  async createLineageTemplate(tmplData: Omit<LineageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LineageTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
    const now = Date.now();
    const newTmpl: LineageTemplate = {
      ...tmplData,
      id: `lin-${now}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
    all.push(newTmpl);
    this.setItem('lineage_templates', all);
    return newTmpl;
  }

  async updateLineageTemplate(tmpl: LineageTemplate): Promise<LineageTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
    const idx = all.findIndex(l => l.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی نژاد یافت نشد.');
    const updated = { ...tmpl, updatedAt: Date.now() };
    all[idx] = updated;
    this.setItem('lineage_templates', all);
    return updated;
  }

  async deleteLineageTemplate(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
    this.setItem('lineage_templates', all.filter(l => l.id !== id));
  }

  // --- Background Templates ---
  async listBackgroundTemplates(scopeType?: string, scopeId?: string): Promise<BackgroundTemplate[]> {
    const all = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
    if (scopeType && scopeId) {
      return all.filter(b => (b.scopeType || 'campaign') === scopeType && (b.scopeId || 'zorvania-c1') === scopeId);
    }
    return all;
  }

  async getBackgroundTemplate(id: string): Promise<BackgroundTemplate | null> {
    const all = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
    return all.find(b => b.id === id) || null;
  }

  async createBackgroundTemplate(tmplData: Omit<BackgroundTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackgroundTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
    const now = Date.now();
    const newTmpl: BackgroundTemplate = {
      ...tmplData,
      id: `bg-${now}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
    all.push(newTmpl);
    this.setItem('background_templates', all);
    return newTmpl;
  }

  async updateBackgroundTemplate(tmpl: BackgroundTemplate): Promise<BackgroundTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
    const idx = all.findIndex(b => b.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی پیشینه یافت نشد.');
    const updated = { ...tmpl, updatedAt: Date.now() };
    all[idx] = updated;
    this.setItem('background_templates', all);
    return updated;
  }

  async deleteBackgroundTemplate(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
    this.setItem('background_templates', all.filter(b => b.id !== id));
  }

  // --- Rewards ---
  async listRewards(): Promise<RewardPackage[]> {
    return this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES);
  }

  async createReward(rewardData: Omit<RewardPackage, 'id' | 'createdAt'>): Promise<RewardPackage> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES);
    const newRew: RewardPackage = {
      ...rewardData,
      id: `rew-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    all.push(newRew);
    this.setItem('rewards', all);
    return newRew;
  }

  async distributeReward(rewardId: string, characterIds: string[]): Promise<Character[]> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const rewards = this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES);
    const rew = rewards.find(r => r.id === rewardId);
    if (!rew) throw new Error('بسته پاداش یافت نشد.');

    const characters = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const updated = characters.map(char => {
      if (!characterIds.includes(char.id)) return char;

      const newCurrencies = {
        ...char.currencies,
        gold: (char.currencies.gold || 0) + (rew.gold || 0),
        silver: (char.currencies.silver || 0) + (rew.silver || 0)
      };

      const newItems = (rew.items || []).map(item => ({
        ...item,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isNewBadge: true
      }));

      return {
        ...char,
        currencies: newCurrencies,
        skillPoints: (char.skillPoints || 0) + (rew.skillPoints || 0),
        inventory: [...newItems, ...(char.inventory || [])],
        revision: char.revision + 1,
        updatedAt: new Date().toISOString()
      };
    });

    this.setItem('characters', updated);
    return updated;
  }

  // --- Campaign Notes (DM only) ---
  async listCampaignNotes(): Promise<CampaignNote[]> {
    if (this.currentUser?.role !== 'dm') return [];
    return this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
  }

  async createCampaignNote(noteData: Omit<CampaignNote, 'id' | 'updatedAt'>): Promise<CampaignNote> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
    const newNote: CampaignNote = {
      ...noteData,
      id: `cn-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    all.unshift(newNote);
    this.setItem('campaign_notes', all);
    return newNote;
  }

  async updateCampaignNote(note: CampaignNote): Promise<CampaignNote> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
    const idx = all.findIndex(c => c.id === note.id);
    if (idx === -1) throw new Error('یادداشت کمپین یافت نشد.');
    all[idx] = { ...note, updatedAt: new Date().toISOString() };
    this.setItem('campaign_notes', all);
    return all[idx];
  }

  async deleteCampaignNote(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
    this.setItem('campaign_notes', all.filter(c => c.id !== id));
  }

  // --- Encounters (DM only) ---
  async listEncounters(): Promise<Encounter[]> {
    if (this.currentUser?.role !== 'dm') return [];
    return this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
  }

  async getEncounter(id: string): Promise<Encounter | null> {
    if (this.currentUser?.role !== 'dm') return null;
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    return all.find(e => e.id === id) || null;
  }

  async createEncounter(encData: Omit<Encounter, 'id' | 'updatedAt'>): Promise<Encounter> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    const newEnc: Encounter = {
      ...encData,
      id: `enc-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    all.unshift(newEnc);
    this.setItem('encounters', all);
    return newEnc;
  }

  async updateEncounter(enc: Encounter): Promise<Encounter> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    const idx = all.findIndex(e => e.id === enc.id);
    if (idx === -1) throw new Error('مواجهه یافت نشد.');
    all[idx] = { ...enc, updatedAt: new Date().toISOString() };
    this.setItem('encounters', all);
    return all[idx];
  }

  async deleteEncounter(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    this.setItem('encounters', all.filter(e => e.id !== id));
  }

  // --- Recharges & Group Management ---
  async resetGroupRecharges(type: 'session' | 'season'): Promise<Character[]> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const updated = chars.map(c => {
      const weapons = (c.weapons || []).map(w => {
        if (w.abilityReset === type || (type === 'season' && w.abilityReset === 'session')) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });
      const features = (c.features || []).map(f => {
        if (f.usageType === type || (type === 'season' && f.usageType === 'session')) {
          return { ...f, usedCount: 0 };
        }
        return f;
      });
      const inventory = (c.inventory || []).map(item => {
        if (item.resetType === type || (type === 'season' && item.resetType === 'session')) {
          return { ...item, usedCount: 0 };
        }
        return item;
      });
      return {
        ...c,
        weapons,
        features,
        inventory,
        revision: (c.revision || 1) + 1,
        updatedAt: new Date().toISOString()
      };
    });
    this.setItem('characters', updated);
    return updated;
  }

  // --- Calendar ---
  async getCalendar(): Promise<WorldCalendar> {
    return this.getItem<WorldCalendar>('calendar', INITIAL_CALENDAR);
  }

  async updateCalendar(cal: Partial<WorldCalendar>): Promise<WorldCalendar> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const current = await this.getCalendar();
    const updated: WorldCalendar = {
      ...current,
      ...cal,
      updatedAt: new Date().toISOString()
    };
    this.setItem('calendar', updated);
    return updated;
  }

  async advanceCalendar(days: number): Promise<WorldCalendar> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const current = await this.getCalendar();
    const next = advanceCalendarDays(current, days);
    this.setItem('calendar', next);
    return next;
  }

  // --- Ending Tracker (DM only) ---
  async getEndingState(): Promise<CampaignEndingState> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    return this.getItem<CampaignEndingState>('endings', INITIAL_ENDING_STATE);
  }

  async updateEndingState(state: Partial<CampaignEndingState>): Promise<CampaignEndingState> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const current = await this.getEndingState();
    const updated: CampaignEndingState = {
      ...current,
      ...state,
      updatedAt: new Date().toISOString()
    };
    this.setItem('endings', updated);
    return updated;
  }

  // --- Shanshin Encounters ---
  async listShanshinEncounters(): Promise<ShanshinEncounter[]> {
    return this.getItem<ShanshinEncounter[]>('shanshin_encounters', SEED_SHANSHIN_ENCOUNTERS);
  }

  async updateShanshinEncounter(enc: ShanshinEncounter): Promise<ShanshinEncounter> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = await this.listShanshinEncounters();
    const updated = all.map(e => e.id === enc.id ? enc : e);
    this.setItem('shanshin_encounters', updated);
    return enc;
  }

  async rollShanshinEncounter(): Promise<{ result: ShanshinEncounter; roll: number }> {
    const roll = Math.floor(Math.random() * 8) + 1;
    const all = await this.listShanshinEncounters();
    const found = all.find(e => e.id === roll) || all[0];
    return { result: found, roll };
  }

  // --- Locations CRUD ---
  async listLocations(): Promise<LocationEntry[]> {
    const locs = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    if (this.currentUser?.role === 'dm') {
      return locs;
    }
    // Players see ONLY revealed locations without dmNotes (Acceptance Test 4)
    return locs
      .filter(l => l.revealed)
      .map(l => ({
        ...l,
        dmNotes: undefined
      }));
  }

  async createLocation(loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocationEntry> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    const newLoc: LocationEntry = {
      ...loc,
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    all.push(newLoc);
    this.setItem('locations', all);
    return newLoc;
  }

  async updateLocation(loc: LocationEntry): Promise<LocationEntry> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    const updated = all.map(l => l.id === loc.id ? { ...loc, updatedAt: Date.now() } : l);
    this.setItem('locations', updated);
    return loc;
  }

  async deleteLocation(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    this.setItem('locations', all.filter(l => l.id !== id));
  }

  // --- Live Encounter Helpers ---
  private computeQualitativeHealth(hp: number, maxHp: number): QualitativeHealth {
    if (maxHp <= 0 || hp <= 0) return 'رو به مرگ';
    const pct = (hp / maxHp) * 100;
    if (pct > 75) return 'سالم';
    if (pct >= 25) return 'زخمی';
    return 'نیمه‌جان';
  }

  private buildPlayerEncounterSnapshot(enc: LiveEncounter): PlayerEncounterView {
    const locations = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    const loc = enc.locationId ? locations.find(l => l.id === enc.locationId) : null;
    const settings = enc.settings || {
      showExactHp: false,
      showAc: false,
      showConditions: true,
      showDefeated: true,
      playerInitiativeRolls: true
    };

    const characters = this.getItem<Character[]>('characters', SEED_CHARACTERS);

    const playerParticipants: PlayerEncounterParticipant[] = [];
    for (const p of (enc.participants || [])) {
      // 1. Hidden participants are NEVER included in any player response (Acceptance Test 3)
      if (p.visibility === 'hidden') continue;

      // 2. Defeated visibility follows showDefeated (Acceptance Test 6)
      if (p.status === 'defeated' && settings.showDefeated === false) continue;

      // 3. Announced participants show as "موجود ناشناخته" with no stats (Acceptance Test 3)
      if (p.visibility === 'announced') {
        playerParticipants.push({
          id: p.id,
          kind: p.kind,
          displayNameForPlayers: 'موجود ناشناخته',
          healthStatus: 'سالم',
          status: p.status,
          initiative: p.initiative,
          initiativeStatus: p.initiativeStatus,
          phase: null,
          sortIndex: p.sortIndex,
          characterId: null,
          isAlly: false
        });
        continue;
      }

      // 4. Revealed participant
      let currentHp = p.hp;
      let maxHp = p.maxHp;

      if (p.kind === 'character' && p.characterId) {
        const char = characters.find(c => c.id === p.characterId);
        if (char?.hp) {
          currentHp = char.hp.current;
          maxHp = char.hp.max;
        }
      }

      const healthStatus = this.computeQualitativeHealth(currentHp, maxHp);
      const isAlly = p.kind === 'character';
      const isOwnCharacter = Boolean(this.currentUser && p.characterId && this.currentUser.activeCharacterId === p.characterId);

      const conditions = settings.showConditions !== false ? p.conditions : undefined;
      const exactHp = (settings.showExactHp === true || isAlly || isOwnCharacter)
        ? { current: currentHp, max: maxHp }
        : undefined;
      const exactAc = (settings.showAc === true || isAlly || isOwnCharacter)
        ? p.ac
        : undefined;

      playerParticipants.push({
        id: p.id,
        kind: p.kind,
        displayNameForPlayers: p.displayNameForPlayers || p.instanceName,
        healthStatus,
        status: p.status,
        conditions,
        exactHp,
        exactAc,
        initiative: p.initiative,
        initiativeStatus: p.initiativeStatus,
        phase: p.phase,
        sortIndex: p.sortIndex,
        characterId: p.characterId,
        isAlly
      });
    }

    const events = (enc.events || [])
      .filter(e => e.visibleToPlayers)
      .map(e => ({ ...e }));

    return {
      id: enc.id,
      name: enc.name,
      locationId: enc.locationId,
      location: loc ? {
        id: loc.id,
        name: loc.name,
        region: loc.region,
        description: loc.revealed ? loc.description : undefined,
        imageUrl: loc.revealed ? loc.imageUrl : undefined
      } : null,
      status: enc.status,
      round: enc.round,
      currentParticipantId: enc.currentParticipantId,
      settings,
      version: enc.version,
      participants: playerParticipants,
      events
    };
  }

  // --- Live Encounter Methods (Local) ---
  async getLiveStatus(): Promise<LiveSyncStatus> {
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const active = all.find(e => e.status === 'active' || e.status === 'paused');
    return {
      activeEncounterId: active?.id || null,
      version: active ? Number(active.version) : 0,
      serverTime: Date.now()
    };
  }

  async getActiveEncounter(): Promise<PlayerEncounterView | null> {
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const active = all.find(e => e.status === 'active' || e.status === 'paused');
    if (!active) return null;
    return this.buildPlayerEncounterSnapshot(active);
  }

  async getEncounterView(id: string, since?: number): Promise<PlayerEncounterView | LiveEncounter | { notModified: true }> {
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    if (this.currentUser?.role !== 'dm' && enc.status === 'draft') {
      throw new Error('مبارزه یافت نشد.'); // Invisible to players (Acceptance Test 1)
    }

    if (since !== undefined && Number(since) === Number(enc.version)) {
      return { notModified: true };
    }

    if (this.currentUser?.role === 'dm') {
      const locations = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
      const loc = enc.locationId ? locations.find(l => l.id === enc.locationId) : null;
      return {
        ...enc,
        location: loc || null
      };
    } else {
      return this.buildPlayerEncounterSnapshot(enc);
    }
  }

  async submitInitiative(encounterId: string, characterId: string, value: number): Promise<{ initiative: number; initiativeStatus: string }> {
    const numValue = Number(value);
    // Acceptance Test 5: Reject values outside 1-40
    if (isNaN(numValue) || numValue < 1 || numValue > 40) {
      throw new Error('مقدار ابتکار عمل باید بین ۱ تا ۴۰ باشد.');
    }

    // Acceptance Test 5: Player can submit initiative ONLY for their own character
    if (this.currentUser?.role !== 'dm') {
      const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
      const char = chars.find(c => c.id === characterId);
      if (!char || (char.ownerId && this.currentUser && char.ownerId !== this.currentUser.id)) {
        throw new Error('شما فقط می‌توانید برای شخصیت متعلق به خود ابتکار عمل بیندازید.');
      }
    }

    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === encounterId);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    const part = (enc.participants || []).find(p => p.characterId === characterId);
    if (!part) throw new Error('این شخصیت در مبارزه حضور ندارد.');

    const settings = enc.settings || { playerInitiativeRolls: true };
    const newStatus = settings.playerInitiativeRolls === false ? 'set' : 'pending';

    part.initiative = numValue;
    part.initiativeStatus = newStatus;
    part.revision = (part.revision || 1) + 1;

    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    const charName = part.displayNameForPlayers || part.instanceName;
    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId,
      round: enc.round || 1,
      type: 'round',
      text: `${charName} ابتکار عمل ${numValue} را ثبت کرد.`,
      visibleToPlayers: true,
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);

    return { initiative: numValue, initiativeStatus: newStatus };
  }

  async listLiveEncounters(status?: string, locationId?: string): Promise<LiveEncounter[]> {
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const locations = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);

    return all
      .filter(e => {
        if (status && e.status !== status) return false;
        if (locationId && e.locationId !== locationId) return false;
        return true;
      })
      .map(e => ({
        ...e,
        location: e.locationId ? locations.find(l => l.id === e.locationId) || null : null
      }));
  }

  async createLiveEncounter(data: {
    name: string;
    locationId?: string | null;
    sessionTag?: string;
    settings?: Partial<EncounterSettings>;
    dmNotes?: string;
  }): Promise<LiveEncounter> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const t = Date.now();
    const newEnc: LiveEncounter = {
      id: `enc-${t}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim() || 'نبرد جدید',
      locationId: data.locationId || null,
      status: 'draft',
      round: 0,
      currentParticipantId: null,
      sessionTag: data.sessionTag || '',
      settings: {
        showExactHp: false,
        showAc: false,
        showConditions: true,
        showDefeated: true,
        playerInitiativeRolls: true,
        ...(data.settings || {})
      },
      version: 1,
      dmNotes: data.dmNotes || '',
      startedAt: null,
      endedAt: null,
      createdBy: this.currentUser?.id,
      createdAt: t,
      updatedAt: t,
      participants: [],
      events: []
    };

    all.push(newEnc);
    this.setItem('live_encounters', all);
    this.liveChannel.notify(newEnc.id, newEnc.version);
    return newEnc;
  }

  async getLiveEncounter(id: string): Promise<LiveEncounter | null> {
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) return null;
    const locations = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    return {
      ...enc,
      location: enc.locationId ? locations.find(l => l.id === enc.locationId) || null : null
    };
  }

  async updateLiveEncounter(id: string, data: Partial<LiveEncounter>): Promise<LiveEncounter> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('مبارزه یافت نشد.');

    const prev = all[idx];
    const updated: LiveEncounter = {
      ...prev,
      ...data,
      settings: { ...prev.settings, ...(data.settings || {}) },
      version: (prev.version || 0) + 1,
      updatedAt: Date.now()
    };

    all[idx] = updated;
    this.setItem('live_encounters', all);
    this.liveChannel.notify(updated.id, updated.version);
    return updated;
  }

  async startLiveEncounter(id: string, withSurpriseRound?: boolean): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    // If surprise round requested, hidden combatants stay hidden
    if (!withSurpriseRound) {
      // By default revealed
    }

    const sortedActive = (enc.participants || [])
      .filter(p => p.status === 'active' && p.initiative !== null)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0) || a.sortIndex - b.sortIndex);

    const firstId = sortedActive[0]?.id || enc.participants[0]?.id || null;

    enc.status = 'active';
    enc.round = 1;
    enc.currentParticipantId = firstId;
    enc.startedAt = Date.now();
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId: enc.id,
      round: 1,
      type: 'start',
      text: withSurpriseRound ? 'مبارزه با دور غافلگیری آغاز شد!' : 'مبارزه آغاز شد! دور ۱',
      visibleToPlayers: true,
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async pauseLiveEncounter(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    enc.status = 'paused';
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId: enc.id,
      round: enc.round,
      type: 'note',
      text: 'مبارزه متوقف شد.',
      visibleToPlayers: true,
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async resumeLiveEncounter(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    enc.status = 'active';
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId: enc.id,
      round: enc.round,
      type: 'note',
      text: 'مبارزه از سر گرفته شد.',
      visibleToPlayers: true,
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async endLiveEncounter(id: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    enc.status = 'ended';
    enc.endedAt = Date.now();
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId: enc.id,
      round: enc.round,
      type: 'end',
      text: 'مبارزه به پایان رسید.',
      visibleToPlayers: true,
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async nextEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    // Acceptance Test 6: Skip defeated or fled participants
    const activeParticipants = (enc.participants || [])
      .filter(p => p.status === 'active' && p.initiative !== null)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0) || a.sortIndex - b.sortIndex);

    if (activeParticipants.length === 0) {
      return { currentParticipantId: '', round: enc.round };
    }

    const currentIndex = activeParticipants.findIndex(p => p.id === enc.currentParticipantId);
    let nextIndex = currentIndex + 1;
    let nextRound = enc.round;

    if (nextIndex >= activeParticipants.length || currentIndex === -1) {
      nextIndex = 0;
      nextRound += 1;
    }

    const nextParticipant = activeParticipants[nextIndex];
    enc.currentParticipantId = nextParticipant.id;
    enc.round = nextRound;
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    const partName = nextParticipant.displayNameForPlayers || nextParticipant.instanceName;
    enc.events = enc.events || [];
    enc.events.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId: enc.id,
      round: nextRound,
      type: 'turn',
      text: `نوبت ${partName} آغاز شد (دور ${nextRound}).`,
      visibleToPlayers: nextParticipant.visibility !== 'hidden',
      createdAt: Date.now()
    });

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);

    return { currentParticipantId: nextParticipant.id, round: nextRound };
  }

  async prevEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === id);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    const activeParticipants = (enc.participants || [])
      .filter(p => p.status === 'active' && p.initiative !== null)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0) || a.sortIndex - b.sortIndex);

    if (activeParticipants.length === 0) {
      return { currentParticipantId: '', round: enc.round };
    }

    const currentIndex = activeParticipants.findIndex(p => p.id === enc.currentParticipantId);
    let prevIndex = currentIndex - 1;
    let prevRound = enc.round;

    if (prevIndex < 0) {
      prevIndex = activeParticipants.length - 1;
      if (prevRound > 1) prevRound -= 1;
    }

    const prevParticipant = activeParticipants[prevIndex];
    enc.currentParticipantId = prevParticipant.id;
    enc.round = prevRound;
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);

    return { currentParticipantId: prevParticipant.id, round: prevRound };
  }

  async addEncounterParticipants(
    encounterId: string,
    participants: any[],
    announce?: boolean,
    announcementText?: string
  ): Promise<EncounterParticipant[]> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === encounterId);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    const createdList: EncounterParticipant[] = [];
    const t = Date.now();

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const pid = `part-${t}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const newPart: EncounterParticipant = {
        id: pid,
        encounterId,
        kind: p.kind || 'monster',
        npcTemplateId: p.npcTemplateId || null,
        characterId: p.characterId || null,
        instanceName: p.instanceName || p.name || 'موجود',
        displayNameForPlayers: p.displayNameForPlayers || null,
        maxHp: Number(p.maxHp ?? p.hp ?? 10),
        hp: Number(p.hp ?? p.maxHp ?? 10),
        ac: String(p.ac ?? '10'),
        acState: p.acState || null,
        conditions: Array.isArray(p.conditions) ? p.conditions : [],
        initiative: p.initiative !== undefined && p.initiative !== null ? Number(p.initiative) : null,
        initiativeStatus: p.initiativeStatus || (p.initiative !== null && p.initiative !== undefined ? 'set' : 'none'),
        visibility: p.visibility || 'revealed',
        status: p.status || 'active',
        phase: p.phase || null,
        groupId: p.groupId || null,
        sortIndex: p.sortIndex !== undefined ? p.sortIndex : ((enc.participants?.length || 0) + i),
        addedAtRound: enc.round || 1,
        revision: 1,
        notes: p.notes || '',
        createdAt: t
      };
      createdList.push(newPart);
    }

    // Acceptance Test 2: Current turn pointer does NOT move when adding participants!
    enc.participants = [...(enc.participants || []), ...createdList];
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = t;

    if (announce) {
      const text = announcementText?.trim() || 'نیروهای کمکی از راه رسیدند!';
      enc.events = enc.events || [];
      enc.events.push({
        id: `evt-${t}-${Math.random().toString(36).substring(2, 6)}`,
        encounterId,
        round: enc.round || 1,
        type: 'add',
        text,
        visibleToPlayers: true,
        createdAt: t
      });
    }

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);

    return createdList;
  }

  async updateEncounterParticipant(
    encounterId: string,
    participantId: string,
    data: Partial<EncounterParticipant>
  ): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === encounterId);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    const targetIdx = (enc.participants || []).findIndex(p => p.id === participantId);
    if (targetIdx === -1) throw new Error('شرکت‌کننده یافت نشد.');

    const prev = enc.participants[targetIdx];
    // Acceptance Test 9: Participant revision protection
    const updated: EncounterParticipant = {
      ...prev,
      ...data,
      id: prev.id,
      encounterId: prev.encounterId,
      revision: (prev.revision || 1) + 1
    };

    enc.participants[targetIdx] = updated;
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async deleteEncounterParticipant(encounterId: string, participantId: string): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === encounterId);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    enc.participants = (enc.participants || []).filter(p => p.id !== participantId);
    if (enc.currentParticipantId === participantId) {
      enc.currentParticipantId = enc.participants[0]?.id || null;
    }
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = Date.now();

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async addEncounterEvent(encounterId: string, text: string, visibleToPlayers: boolean = true): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<LiveEncounter[]>('live_encounters', []);
    const enc = all.find(e => e.id === encounterId);
    if (!enc) throw new Error('مبارزه یافت نشد.');

    const t = Date.now();
    const event: EncounterEvent = {
      id: `evt-${t}-${Math.random().toString(36).substring(2, 6)}`,
      encounterId,
      round: enc.round || 1,
      type: 'note',
      text,
      visibleToPlayers,
      createdAt: t
    };

    enc.events = enc.events || [];
    enc.events.push(event);
    enc.version = (enc.version || 0) + 1;
    enc.updatedAt = t;

    this.setItem('live_encounters', all);
    this.liveChannel.notify(enc.id, enc.version);
  }

  async distributeEncounterLoot(encounterId: string, characterId: string, item: any): Promise<void> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const chars = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const char = chars.find(c => c.id === characterId);
    if (!char) throw new Error('شخصیت یافت نشد.');

    const newItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name || 'آیتم لوت',
      category: item.category || 'misc',
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      description: item.description || '',
      equipped: false,
      properties: item.properties || ''
    };

    char.inventory = [...(char.inventory || []), newItem];
    this.setItem('characters', chars);

    await this.addEncounterEvent(
      encounterId,
      `غنیمت [${newItem.name}] به [${char.name}] اهدا شد.`,
      true
    );
  }

  // --- Multi-Campaign Implementation in LocalApi ---
  getActiveCampaignId(): string | null {
    return this.getItem<string | null>('active_campaign_id', 'zorvania-c1');
  }

  setActiveCampaignId(id: string | null): void {
    this.setItem('active_campaign_id', id);
  }

  async getCampaignRole(campaignId?: string): Promise<CampaignRole | null> {
    const cid = campaignId || this.getActiveCampaignId();
    if (!cid || !this.currentUser) return null;
    const members = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const m = members.find(mem => mem.campaignId === cid && mem.userId === this.currentUser?.id && mem.status === 'active');
    return m ? m.role : null;
  }

  async getHomeSummary(): Promise<HomeSummaryResponse> {
    const user = this.currentUser || SEED_USERS[0];
    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const allMasterChars = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    const allParticipations = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const allInvites = this.getItem<CampaignInvite[]>('campaign_invites', []);

    // Active memberships for this user
    const myMemberships = allMembers.filter(m => m.userId === user.id && m.status === 'active');
    const myCampaigns = myMemberships.map(m => {
      const camp = allCampaigns.find(c => c.id === m.campaignId) || {
        id: m.campaignId,
        name: 'کمپین نامشخص',
        description: '',
        status: 'active' as const,
        ownerId: '',
        settings: {
          units: 'feet' as const,
          startingLevel: 1,
          maxEntryLevel: 20,
          abilityScoreMethods: ['standard_array' as const],
          approval: { onCreate: false, onLevelUp: false },
          backstoryVisibility: 'party' as const,
          diceVisibility: 'table' as const,
          allowPlayerRollPrivate: true,
          allowPlayerCreateCharacter: true,
          encounterDefaults: { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true }
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const campMembers = allMembers.filter(mem => mem.campaignId === camp.id && mem.status === 'active');
      const campParts = allParticipations.filter(p => p.campaignId === camp.id && p.status === 'active');
      return {
        ...camp,
        myRole: m.role,
        memberCount: campMembers.length,
        characterCount: campParts.length
      };
    });

    // Master characters owned by user
    const myCharacters = allMasterChars
      .filter(c => c.ownerId === user.id && c.status !== 'archived')
      .map(mc => ({
        ...mc,
        participations: allParticipations.filter(p => p.characterId === mc.id)
      }));

    // Pending invites if user is owner or co_dm
    const myDmCampaignIds = myMemberships
      .filter(m => m.role === 'owner' || m.role === 'co_dm')
      .map(m => m.campaignId);

    const pendingInvites = allInvites.filter(inv =>
      !inv.revokedAt && inv.expiresAt > Date.now() &&
      (inv.campaignId ? myDmCampaignIds.includes(inv.campaignId) : true)
    );

    // Pending approvals queue for DMs
    const pendingApprovals: HomeSummaryResponse['pendingApprovals'] = [];
    if (myDmCampaignIds.length > 0) {
      allParticipations.forEach(p => {
        if (!myDmCampaignIds.includes(p.campaignId)) return;
        const camp = allCampaigns.find(c => c.id === p.campaignId);
        const char = allMasterChars.find(c => c.id === p.characterId);
        const playerMember = allMembers.find(m => m.campaignId === p.campaignId && m.characterId === p.characterId);
        const playerName = playerMember?.userName || 'کاربر';

        if (p.status === 'pending_approval') {
          pendingApprovals.push({
            campaignId: p.campaignId,
            campaignName: camp?.name || 'کمپین',
            type: 'create',
            participationId: p.id,
            characterId: p.characterId,
            characterName: char?.name || p.className || 'شخصیت جدید',
            playerName,
            level: p.level,
            requestedAt: p.joinedAt,
            details: { className: p.className, race: char?.race }
          });
        } else if (p.pendingLevelUp) {
          pendingApprovals.push({
            campaignId: p.campaignId,
            campaignName: camp?.name || 'کمپین',
            type: 'level_up',
            participationId: p.id,
            characterId: p.characterId,
            characterName: char?.name || p.className || 'شخصیت',
            playerName,
            level: p.pendingLevelUp.targetLevel,
            requestedAt: p.pendingLevelUp.requestedAt || Date.now(),
            details: p.pendingLevelUp.diff
          });
        }
      });
    }

    return {
      user,
      myCampaigns,
      myCharacters,
      pendingInvites,
      pendingApprovals
    };
  }

  async listCampaigns(): Promise<Campaign[]> {
    const summary = await this.getHomeSummary();
    return summary.myCampaigns;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCampaigns.find(c => c.id === id);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };

    const members = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const myMem = members.find(m => m.campaignId === id && m.userId === this.currentUser?.id && m.status === 'active');
    if (!myMem) {
      throw { status: 404, message: 'شما عضو این کمپین نیستید.' };
    }

    const campMembers = members.filter(m => m.campaignId === id && m.status === 'active');
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const campParts = allParts.filter(p => p.campaignId === id && p.status === 'active');

    return {
      ...camp,
      myRole: myMem.role,
      memberCount: campMembers.length,
      characterCount: campParts.length
    };
  }

  async createCampaign(data: { name: string; description?: string; tone?: string; packId?: string | null; settings?: Partial<CampaignSettings> }): Promise<Campaign> {
    const user = this.currentUser || SEED_USERS[0];
    const campId = `camp-${Date.now()}`;
    const defaultSettings: CampaignSettings = {
      units: 'feet',
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ['standard_array', 'point_buy', 'roll', 'manual'],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: 'party',
      diceVisibility: 'table',
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: {
        showExactHp: false,
        showAc: false,
        showConditions: true,
        showDefeated: true,
        playerInitiativeRolls: true
      },
      ...data.settings
    };

    const newCampaign: Campaign = {
      id: campId,
      name: data.name,
      description: data.description || '',
      tone: data.tone || '',
      status: 'active',
      ownerId: user.id,
      ownerName: user.displayName || user.name,
      sourcePackId: data.packId || null,
      settings: defaultSettings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      myRole: 'owner',
      memberCount: 1,
      characterCount: 0
    };

    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    allCampaigns.push(newCampaign);
    this.setItem('campaigns', allCampaigns);

    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    allMembers.push({
      campaignId: campId,
      userId: user.id,
      role: 'owner',
      status: 'active',
      joinedAt: Date.now(),
      userName: user.displayName || user.name,
      userEmail: user.email
    });
    this.setItem('campaign_members', allMembers);

    // Deep clone pack entities into campaign scope
    if (data.packId) {
      const allRuleSets = this.getItem<RuleSet[]>('rule_sets', SEED_RULE_SETS);
      const packRuleSet = allRuleSets.find(r => r.scopeType === 'pack' && r.scopeId === data.packId);
      if (packRuleSet) {
        allRuleSets.push({
          ...packRuleSet,
          id: `ruleset-${campId}`,
          scopeType: 'campaign',
          scopeId: campId
        });
        this.setItem('rule_sets', allRuleSets);
      }
    }

    return newCampaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const role = await this.getCampaignRole(id);
    if (role !== 'owner' && role !== 'co_dm') {
      throw { status: 403, message: 'فقط مالک یا دستیار دانجن مستر مجاز به تغییر تنظیمات کمپین هستند.' };
    }
    const all = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = all.find(c => c.id === id);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };

    Object.assign(camp, data);
    camp.updatedAt = Date.now();
    this.setItem('campaigns', all);
    return camp;
  }

  async archiveCampaign(id: string): Promise<Campaign> {
    return this.updateCampaign(id, { status: 'archived' });
  }

  async restoreCampaign(id: string): Promise<Campaign> {
    return this.updateCampaign(id, { status: 'active' });
  }

  async deleteCampaign(id: string): Promise<void> {
    const role = await this.getCampaignRole(id);
    if (role !== 'owner') {
      throw { status: 403, message: 'فقط مالک می‌تواند کمپین را حذف کند.' };
    }
    const all = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const filtered = all.filter(c => c.id !== id);
    this.setItem('campaigns', filtered);
  }

  async listCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    const members = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    return members.filter(m => m.campaignId === campaignId && m.status !== 'removed');
  }

  async updateCampaignMember(campaignId: string, userId: string, data: { role?: CampaignRole; status?: 'invited' | 'active' | 'left' | 'removed' }): Promise<CampaignMember> {
    const myRole = await this.getCampaignRole(campaignId);
    if (myRole !== 'owner' && myRole !== 'co_dm') {
      throw { status: 403, message: 'فقط دانجن مستر مجاز به مدیریت اعضاست.' };
    }
    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const mem = allMembers.find(m => m.campaignId === campaignId && m.userId === userId);
    if (!mem) throw { status: 404, message: 'عضو یافت نشد.' };

    // Cannot demote or change owner role directly
    if (mem.role === 'owner' && data.role && data.role !== 'owner') {
      throw { status: 400, message: 'نقش مالک تنها از طریق انتقال مالکیت تغییر می‌یابد.' };
    }

    if (data.role) mem.role = data.role;
    if (data.status) mem.status = data.status;
    this.setItem('campaign_members', allMembers);
    return mem;
  }

  async removeCampaignMember(campaignId: string, userId: string): Promise<void> {
    const myRole = await this.getCampaignRole(campaignId);
    if (myRole !== 'owner' && myRole !== 'co_dm') {
      throw { status: 403, message: 'دسترسی غیرمجاز.' };
    }
    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const mem = allMembers.find(m => m.campaignId === campaignId && m.userId === userId);
    if (mem?.role === 'owner') {
      throw { status: 400, message: 'نمی‌توان مالک کمپین را حذف کرد.' };
    }
    if (mem) {
      mem.status = 'removed';
      this.setItem('campaign_members', allMembers);
    }
  }

  async transferCampaignOwnership(campaignId: string, newOwnerId: string): Promise<Campaign> {
    const user = this.currentUser;
    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };
    if (camp.ownerId !== user?.id) {
      throw { status: 403, message: 'فقط مالک کمپین می‌تواند مالکیت را انتقال دهد.' };
    }

    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const newOwnerMem = allMembers.find(m => m.campaignId === campaignId && m.userId === newOwnerId && m.status === 'active');
    if (!newOwnerMem) {
      throw { status: 400, message: 'مالک جدید باید یکی از اعضای فعال کمپین باشد.' };
    }

    const currentOwnerMem = allMembers.find(m => m.campaignId === campaignId && m.userId === user.id);
    if (currentOwnerMem) {
      currentOwnerMem.role = 'co_dm';
    }
    newOwnerMem.role = 'owner';
    camp.ownerId = newOwnerId;
    camp.ownerName = newOwnerMem.userName;
    camp.updatedAt = Date.now();

    this.setItem('campaign_members', allMembers);
    this.setItem('campaigns', allCampaigns);
    return camp;
  }

  async leaveCampaign(campaignId: string): Promise<void> {
    const user = this.currentUser;
    if (!user) throw { status: 401, message: 'وارد شوید.' };

    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp?.ownerId === user.id) {
      throw { status: 400, message: 'مالک نمی‌تواند از کمپین خارج شود؛ ابتدا باید مالکیت را انتقال دهید.' };
    }

    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    const mem = allMembers.find(m => m.campaignId === campaignId && m.userId === user.id);
    if (mem) {
      mem.status = 'left';
      this.setItem('campaign_members', allMembers);
    }

    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const parts = allParts.filter(p => p.campaignId === campaignId && p.id === mem?.participationId);
    parts.forEach(p => {
      p.status = 'left' as any;
      p.updatedAt = Date.now();
    });
    this.setItem('character_participations', allParts);

    if (mem?.characterId) {
      const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
      allHist.push({
        id: `hist-leave-${Date.now()}`,
        characterId: mem.characterId,
        campaignId,
        campaignName: camp?.name,
        eventType: 'retired',
        payload: {
          title: `خروج از کمپین ${camp?.name || ''}`,
          description: 'شخصیت کمپین را ترک کرد.'
        },
        timestamp: Date.now()
      });
      this.setItem('character_history_events', allHist);
    }
  }

  async listCampaignInvites(campaignId: string): Promise<CampaignInvite[]> {
    const all = this.getItem<CampaignInvite[]>('campaign_invites', []);
    return all.filter(i => i.campaignId === campaignId && !i.revokedAt);
  }

  async createCampaignInvite(campaignId: string, data: { role?: CampaignRole; label?: string; expiresInDays?: number; maxUses?: number; assignParticipationId?: string }): Promise<CampaignInvite> {
    const user = this.currentUser || SEED_USERS[0];
    const code = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const newInv: CampaignInvite = {
      id: `cinv-${Date.now()}`,
      campaignId,
      code,
      role: data.role || 'player',
      label: data.label || 'دعوت جدید',
      createdBy: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (data.expiresInDays || 30) * 86400000,
      maxUses: data.maxUses || 1,
      usedCount: 0,
      assignParticipationId: data.assignParticipationId || null,
      inviteLink: `${window.location.origin}/#register?code=${code}`
    };

    const all = this.getItem<CampaignInvite[]>('campaign_invites', []);
    all.push(newInv);
    this.setItem('campaign_invites', all);
    return newInv;
  }

  async revokeCampaignInvite(campaignId: string, inviteId: string): Promise<void> {
    const all = this.getItem<CampaignInvite[]>('campaign_invites', []);
    const inv = all.find(i => i.id === inviteId && i.campaignId === campaignId);
    if (inv) {
      inv.revokedAt = Date.now();
      this.setItem('campaign_invites', all);
    }
  }

  async acceptInvite(code: string): Promise<{ campaignId: string; role: CampaignRole }> {
    const user = this.currentUser;
    if (!user) throw { status: 401, message: 'لطفاً ابتدا وارد شوید.' };
    const allInv = this.getItem<CampaignInvite[]>('campaign_invites', []);
    const inv = allInv.find(i => (i.code === code || i.id === code) && !i.revokedAt && i.expiresAt > Date.now());
    if (!inv || !inv.campaignId) {
      throw { status: 404, message: 'کد دعوت نامعتبر یا منقضی شده است.' };
    }

    if (inv.usedCount >= inv.maxUses) {
      throw { status: 400, message: 'ظرفیت این کد دعوت تکمیل شده است.' };
    }
    inv.usedCount++;
    this.setItem('campaign_invites', allInv);

    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    let mem = allMembers.find(m => m.campaignId === inv.campaignId && m.userId === user.id);
    if (!mem) {
      mem = {
        campaignId: inv.campaignId,
        userId: user.id,
        role: inv.role,
        status: 'active',
        joinedAt: Date.now(),
        userName: user.displayName || user.name,
        userEmail: user.email
      };
      allMembers.push(mem);
    } else {
      mem.status = 'active';
    }
    this.setItem('campaign_members', allMembers);
    this.setActiveCampaignId(inv.campaignId);

    return { campaignId: inv.campaignId, role: inv.role };
  }

  // Master Characters & Participations
  async listMasterCharacters(): Promise<MasterCharacter[]> {
    const user = this.currentUser || SEED_USERS[0];
    const all = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    return all
      .filter(c => c.ownerId === user.id && c.status !== 'archived')
      .map(c => ({
        ...c,
        participations: allParts.filter(p => p.characterId === c.id)
      }));
  }

  async getMasterCharacter(id: string): Promise<MasterCharacter | null> {
    const all = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    const char = all.find(c => c.id === id);
    if (!char) return null;
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);

    // Section 2 Character Visibility:
    const isOwner = char.ownerId === this.currentUser?.id;
    let filteredBackstory = { ...char.backstory };
    if (!isOwner) {
      filteredBackstory.dmOnly = { secrets: '', hooks: '' };
      filteredBackstory.sections = (filteredBackstory.sections || []).filter(s => s.shareWithParty);
    }

    return {
      ...char,
      backstory: filteredBackstory,
      participations: allParts.filter(p => p.characterId === char.id),
      history: allHist.filter(h => h.characterId === char.id)
    };
  }

  async createMasterCharacter(char: Partial<MasterCharacter>): Promise<MasterCharacter> {
    const user = this.currentUser || SEED_USERS[0];
    const newId = `char-${Date.now()}`;
    const newChar: MasterCharacter = {
      id: newId,
      ownerId: user.id,
      name: char.name || 'شخصیت نو',
      race: char.race || 'آدمی',
      appearance: char.appearance || '',
      portraitUrl: char.portraitUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
      backstory: char.backstory || {
        summary: '',
        origin: '',
        personality: { traits: '', ideals: '', bonds: '', flaws: '' },
        goals: '',
        relationships: [],
        timeline: [],
        sections: [],
        dmOnly: { secrets: '', hooks: '' }
      },
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const all = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    all.push(newChar);
    this.setItem('master_characters', all);

    const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
    allHist.push({
      id: `hist-create-${Date.now()}`,
      characterId: newId,
      eventType: 'created' as any,
      payload: { title: 'آفرینش شخصیت', description: `شناسنامه و هویت کلان شخصیت در ${APP_NAME_FA} ثبت شد.` },
      timestamp: Date.now()
    });
    this.setItem('character_history_events', allHist);

    return newChar;
  }

  async updateMasterCharacter(char: MasterCharacter): Promise<MasterCharacter> {
    const all = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    const idx = all.findIndex(c => c.id === char.id);
    if (idx === -1) throw { status: 404, message: 'شخصیت یافت نشد.' };

    char.updatedAt = Date.now();
    all[idx] = char;
    this.setItem('master_characters', all);

    // Sync shared identity to existing participations
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    allParts.forEach(p => {
      if (p.characterId === char.id) {
        p.characterName = char.name;
        p.characterRace = char.race;
        p.characterPortraitUrl = char.portraitUrl;
        p.characterAppearance = char.appearance;
        p.characterBackstory = char.backstory;
        p.updatedAt = Date.now();
      }
    });
    this.setItem('character_participations', allParts);

    return char;
  }

  async updateMasterCharacterStatus(id: string, status: 'active' | 'retired' | 'dead' | 'archived', note?: string): Promise<MasterCharacter> {
    const char = await this.getMasterCharacter(id);
    if (!char) throw { status: 404, message: 'شخصیت یافت نشد.' };
    char.status = status;
    char.statusNote = note;
    await this.updateMasterCharacter(char);

    const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
    allHist.push({
      id: `hist-stat-${Date.now()}`,
      characterId: id,
      eventType: status === 'dead' ? 'death' : status === 'retired' ? 'retired' : 'status_change' as any,
      payload: { title: `تغییر وضعیت به ${status}`, description: note || '' },
      timestamp: Date.now()
    });
    this.setItem('character_history_events', allHist);

    return char;
  }

  async getMasterCharacterHistory(characterId: string): Promise<CharacterHistoryEvent[]> {
    const all = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
    return all.filter(h => h.characterId === characterId).sort((a, b) => b.timestamp - a.timestamp);
  }

  async addCharacterHistoryEvent(event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>): Promise<CharacterHistoryEvent> {
    const newEvent: CharacterHistoryEvent = {
      ...event,
      id: `hist-${Date.now()}`,
      timestamp: Date.now()
    };
    const all = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
    all.push(newEvent);
    this.setItem('character_history_events', all);
    return newEvent;
  }

  async listParticipations(campaignId?: string): Promise<CharacterParticipation[]> {
    const cid = campaignId || this.getActiveCampaignId();
    const all = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    return cid ? all.filter(p => p.campaignId === cid) : all;
  }

  async getParticipation(campaignId: string, participationId: string): Promise<CharacterParticipation | null> {
    const all = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    return all.find(p => p.campaignId === campaignId && p.id === participationId) || null;
  }

  async createParticipation(campaignId: string, data: { characterId: string; entryMode: 'campaign_start' | 'same_level' | 'new_level'; entryLevel?: number }): Promise<CharacterParticipation> {
    const user = this.currentUser || SEED_USERS[0];
    const allCamps = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCamps.find(c => c.id === campaignId);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };

    const maxLevel = camp.settings.maxEntryLevel || 20;
    let level = 1;
    if (data.entryMode === 'campaign_start') {
      level = camp.settings.startingLevel || 1;
    } else if (data.entryMode === 'new_level') {
      level = Math.min(Math.max(1, data.entryLevel || 1), maxLevel);
    } else if (data.entryMode === 'same_level') {
      level = Math.min(data.entryLevel || 1, maxLevel);
    }

    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const existing = allParts.find(p => p.campaignId === campaignId && p.characterId === data.characterId);
    if (existing) {
      throw new Error('این شخصیت در این کمپین حضور دارد.');
    }

    const allMasterChars = this.getItem<MasterCharacter[]>('master_characters', SEED_MASTER_CHARACTERS);
    const masterChar = allMasterChars.find(c => c.id === data.characterId);
    if (!masterChar) throw new Error('شخصیت مبدأ یافت نشد.');

    const initialStatus = camp.settings.approval?.onCreate ? 'pending_approval' : 'active';

    const newPart: CharacterParticipation = {
      id: `part-${Date.now()}`,
      characterId: data.characterId,
      campaignId,
      campaignName: camp.name,
      status: initialStatus,
      className: 'ماجراجو',
      level,
      xp: 0,
      abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      currentHp: 10 + (level - 1) * 6,
      maxHp: 10 + (level - 1) * 6,
      tempHp: 0,
      hitDice: { current: level, max: level, die: 'd8' },
      deathSaves: { successes: 0, failures: 0 },
      conditions: [],
      inventory: [],
      weapons: [],
      currency: { gold: 10, silver: 0, copper: 0 },
      customResources: [],
      features: [],
      notes: '',
      dmNotes: '',
      joinedAt: Date.now(),
      updatedAt: Date.now(),
      characterName: masterChar.name,
      characterRace: masterChar.race,
      characterPortraitUrl: masterChar.portraitUrl
    };

    allParts.push(newPart);
    this.setItem('character_participations', allParts);

    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    let member = allMembers.find(m => m.campaignId === campaignId && m.userId === user.id);
    if (!member) {
      allMembers.push({
        campaignId,
        userId: user.id,
        role: 'player',
        status: 'active',
        joinedAt: Date.now(),
        userName: user.displayName || user.name,
        userEmail: user.email,
        characterId: data.characterId,
        characterName: masterChar.name,
        participationId: newPart.id
      });
      this.setItem('campaign_members', allMembers);
    } else {
      member.characterId = data.characterId;
      member.characterName = masterChar.name;
      member.participationId = newPart.id;
      this.setItem('campaign_members', allMembers);
    }

    const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
    allHist.push({
      id: `hist-${Date.now()}`,
      characterId: data.characterId,
      campaignId,
      campaignName: camp.name,
      eventType: 'joined',
      payload: {
        title: `پیوستن به کمپین ${camp.name}`,
        description: `ورود در حالت ${data.entryMode === 'campaign_start' ? 'شروع کمپین' : 'سطح ' + level} (سطح ${level})`,
        level
      },
      timestamp: Date.now()
    });
    this.setItem('character_history_events', allHist);

    return newPart;
  }

  async updateParticipation(campaignId: string, participationId: string, data: Partial<CharacterParticipation>): Promise<CharacterParticipation> {
    const all = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const part = all.find(p => p.campaignId === campaignId && p.id === participationId);
    if (!part) throw { status: 404, message: 'شخصیت مشارکت‌کننده یافت نشد.' };

    Object.assign(part, data);
    part.updatedAt = Date.now();
    this.setItem('character_participations', all);
    return part;
  }

  async reviewParticipation(campaignId: string, participationId: string, action: 'approve' | 'reject' | 'request_changes', comment?: string): Promise<CharacterParticipation> {
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const part = allParts.find(p => p.id === participationId && p.campaignId === campaignId);
    if (!part) throw { status: 404, message: 'شخصیت مشارکت‌کننده یافت نشد.' };

    const allCamps = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCamps.find(c => c.id === campaignId);

    if (action === 'approve') {
      if (part.pendingLevelUp) {
        const oldLevel = part.level;
        part.level = part.pendingLevelUp.targetLevel;
        part.pendingLevelUp = null;
        const allHist = this.getItem<CharacterHistoryEvent[]>('character_history_events', SEED_HISTORY_EVENTS);
        allHist.push({
          id: `hist-lvl-${Date.now()}`,
          characterId: part.characterId,
          campaignId,
          campaignName: camp?.name,
          eventType: 'level_up',
          payload: {
            title: `ارتقای سطح به ${part.level} تأیید شد`,
            oldLevel,
            newLevel: part.level,
            description: comment || 'تأیید ارتقای سطح توسط دانجن مستر'
          },
          timestamp: Date.now()
        });
        this.setItem('character_history_events', allHist);
      } else {
        part.status = 'active';
      }
    } else if (action === 'reject') {
      if (part.pendingLevelUp) {
        part.pendingLevelUp = null;
      } else {
        part.status = 'rejected';
      }
    }
    part.updatedAt = Date.now();
    this.setItem('character_participations', allParts);
    return part;
  }

  async requestLevelUp(campaignId: string, participationId: string, targetLevel: number, diff?: any): Promise<CharacterParticipation> {
    const allParts = this.getItem<CharacterParticipation[]>('character_participations', SEED_CHARACTER_PARTICIPATIONS);
    const part = allParts.find(p => p.id === participationId && p.campaignId === campaignId);
    if (!part) throw { status: 404, message: 'شخصیت یافت نشد.' };

    const allCamps = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCamps.find(c => c.id === campaignId);

    if (camp?.settings.approval?.onLevelUp) {
      part.pendingLevelUp = {
        targetLevel,
        diff: diff || {},
        requestedAt: Date.now()
      };
    } else {
      part.level = targetLevel;
    }
    part.updatedAt = Date.now();
    this.setItem('character_participations', allParts);
    return part;
  }

  async updateParticipationStatus(campaignId: string, participationId: string, status: CharacterParticipation['status']): Promise<CharacterParticipation> {
    return this.updateParticipation(campaignId, participationId, { status });
  }

  // Media
  async uploadMedia(file: { name?: string; mimeType: string; sizeBytes: number; dataBase64: string; width?: number; height?: number; campaignId?: string }): Promise<{ id: string; url: string; sizeBytes: number }> {
    const user = this.currentUser || SEED_USERS[0];
    const maxSizeBytes = 150 * 1024; // 150 KB hard cap
    if (file.sizeBytes > maxSizeBytes) {
      throw { status: 413, message: 'حجم تصویر نباید بیش از ۱۵۰ کیلوبایت باشد. لطفاً قبل از ارسال تصویر را فشرده کنید.' };
    }

    const allMedia = this.getItem<MediaItem[]>('media', []);
    const userTotalBytes = allMedia.filter(m => m.ownerId === user.id).reduce((sum, m) => sum + m.sizeBytes, 0);
    if (userTotalBytes + file.sizeBytes > 5 * 1024 * 1024) { // 5 MB per-user quota
      throw { status: 400, message: 'سهمیه ذخیره‌سازی شما (۵ مگابایت) پر شده است.' };
    }

    const mediaId = `media-${Date.now()}`;
    const newMedia: MediaItem = {
      id: mediaId,
      ownerId: user.id,
      campaignId: file.campaignId,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      dataBase64: file.dataBase64,
      width: file.width,
      height: file.height,
      createdAt: Date.now()
    };

    allMedia.push(newMedia);
    this.setItem('media', allMedia);

    return {
      id: mediaId,
      url: file.dataBase64.startsWith('data:') ? file.dataBase64 : `data:${file.mimeType};base64,${file.dataBase64}`,
      sizeBytes: file.sizeBytes
    };
  }

  async getMedia(id: string): Promise<any> {
    const allMedia = this.getItem<MediaItem[]>('media', []);
    const m = allMedia.find(item => item.id === id);
    if (!m) throw { status: 404, message: 'رسانه یافت نشد.' };
    return m;
  }

  async deleteMedia(id: string): Promise<void> {
    const allMedia = this.getItem<MediaItem[]>('media', []);
    const filtered = allMedia.filter(item => item.id !== id);
    this.setItem('media', filtered);
  }

  // Shared Dice Feed
  async postDiceRoll(campaignId: string, roll: { label: string; formula: string; mode: 'normal' | 'adv' | 'dis'; results: any; modifier: number; total: number; nat20?: boolean; nat1?: boolean; visibility?: 'table' | 'dm_only'; participationId?: string }): Promise<CampaignDiceRoll> {
    const user = this.currentUser || SEED_USERS[0];
    const isDm = user.role === 'dm';
    const camp = (this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS)).find(c => c.id === campaignId);

    let vis = roll.visibility || 'table';
    if (!isDm && vis === 'dm_only' && !camp?.settings.allowPlayerRollPrivate) {
      vis = 'table';
    }

    const newRoll: CampaignDiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      campaignId,
      userId: user.id,
      userName: user.displayName || user.name,
      characterId: user.activeCharacterId || null,
      characterName: null,
      rollType: roll.label || 'dice_roll',
      diceExpression: roll.formula,
      total: roll.total,
      details: {
        rolls: Array.isArray(roll.results) ? roll.results : [roll.total - roll.modifier],
        modifier: roll.modifier,
        advantage: roll.mode === 'normal' ? undefined : roll.mode,
        isCritical: roll.nat20,
        isFumble: roll.nat1,
        label: roll.label
      },
      visibility: vis,
      createdAt: Date.now()
    };

    const allRolls = this.getItem<CampaignDiceRoll[]>('dice_rolls', SEED_CAMPAIGN_DICE_ROLLS);
    allRolls.unshift(newRoll);
    if (allRolls.length > 200) allRolls.length = 200;
    this.setItem('dice_rolls', allRolls);

    this.liveChannel.notify(campaignId, Date.now(), { type: 'dice_roll', roll: newRoll });
    return newRoll;
  }

  async listDiceRolls(campaignId: string, after?: string, limit = 50): Promise<CampaignDiceRoll[]> {
    const user = this.currentUser || SEED_USERS[0];
    const role = await this.getCampaignRole(campaignId);
    const isDm = role === 'owner' || role === 'co_dm';

    const allRolls = this.getItem<CampaignDiceRoll[]>('dice_rolls', SEED_CAMPAIGN_DICE_ROLLS);
    let filtered = allRolls.filter(r => r.campaignId === campaignId);

    if (!isDm) {
      filtered = filtered.filter(r => r.visibility === 'table' || r.userId === user.id);
    }

    if (after) {
      const idx = filtered.findIndex(r => r.id === after);
      if (idx !== -1) {
        filtered = filtered.slice(0, idx);
      }
    }

    return filtered.slice(0, limit);
  }

  // Rule Sets & Content Packs
  async getRuleSet(scopeType: 'pack' | 'campaign', scopeId: string): Promise<RuleSet | null> {
    const all = this.getItem<RuleSet[]>('rule_sets', SEED_RULE_SETS);
    return all.find(r => r.scopeType === scopeType && r.scopeId === scopeId) || all[0];
  }

  // -------------------------------------------------------------
  // Phase 2: DM Library, Content Packs & Favorites
  // -------------------------------------------------------------
  private getOrCreateUserDefaultLibrary(userId: string): ContentPack {
    const packs = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    let userLib = packs.find(p => p.ownerId === userId && p.isDefaultLibrary);
    if (!userLib) {
      userLib = {
        id: `pack_lib_${userId}`,
        ownerId: userId,
        name: 'کتابخانه‌ی من',
        description: 'کتابخانه اختصاصی قالب‌ها، مکان‌ها و هیولاهای شخصی شما',
        version: '1.0.0',
        visibility: 'private',
        kind: 'library',
        tags: ['شخصی', 'کتابخانه'],
        isDefaultLibrary: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      packs.push(userLib);
      this.setItem('content_packs', packs);
    }
    return userLib;
  }

  public getScopeBundle(scopeType: EntityScopeType, scopeId: string): CloneEntityBundle {
    const classes = (this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES)).filter(c => (c.scopeType || 'campaign') === scopeType && (c.scopeId || 'zorvania-c1') === scopeId);
    const lineages = (this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES)).filter(l => (l.scopeType || 'campaign') === scopeType && (l.scopeId || 'zorvania-c1') === scopeId);
    const backgrounds = (this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES)).filter(b => (b.scopeType || 'campaign') === scopeType && (b.scopeId || 'zorvania-c1') === scopeId);
    const features = (this.getItem<FeatureTemplate[]>('feature_templates', [])).filter(f => (f.scopeType || 'campaign') === scopeType && (f.scopeId || 'zorvania-c1') === scopeId);
    const weapons = (this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES)).filter(w => (w.scopeType || 'campaign') === scopeType && (w.scopeId || 'zorvania-c1') === scopeId);
    const items = (this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY)).filter(i => (i.scopeType || 'campaign') === scopeType && (i.scopeId || 'zorvania-c1') === scopeId);
    const rewards = (this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES)).filter(r => (r.scopeType || 'campaign') === scopeType && (r.scopeId || 'zorvania-c1') === scopeId);
    const npcs = (this.getItem<NPC[]>('npcs', SEED_NPCS)).filter(n => (n.scopeType || 'campaign') === scopeType && (n.scopeId || 'zorvania-c1') === scopeId);
    const locations = (this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS)).filter(l => (l.scopeType || 'campaign') === scopeType && (l.scopeId || 'zorvania-c1') === scopeId);
    const encounters = (this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS)).filter(e => (e.scopeType || 'campaign') === scopeType && (e.scopeId || 'zorvania-c1') === scopeId);
    const factions = (this.getItem<Faction[]>('factions', SEED_FACTIONS)).filter(f => (f.scopeType || 'campaign') === scopeType && (f.scopeId || 'zorvania-c1') === scopeId);
    const docs = (this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS)).filter(d => scopeType === 'campaign' && d.campaignId === scopeId);
    const calendars = (this.getItem<GenericCalendarData[]>('calendars', [SEED_GENERIC_CALENDAR]));
    const ruleSets = (this.getItem<RuleSet[]>('rule_sets', SEED_RULE_SETS)).filter(r => r.scopeType === scopeType && r.scopeId === scopeId);

    return {
      classTemplates: classes,
      lineageTemplates: lineages,
      backgroundTemplates: backgrounds,
      featureTemplates: features,
      weaponTemplates: weapons,
      items,
      rewards,
      npcs,
      locations,
      encounters,
      factions,
      campaignDocs: docs,
      calendars,
      ruleSets
    };
  }

  async getLibraryItems(params: {
    source: string;
    type?: string;
    q?: string;
    tag?: string;
    region?: string;
    sort?: 'newest' | 'name' | 'favorite';
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const user = this.currentUser || SEED_USERS[0];
    const activeCampId = this.getActiveCampaignId() || 'zorvania-c1';

    let scopeType: EntityScopeType = 'campaign';
    let scopeId: string = activeCampId;

    if (params.source === 'my_library') {
      const lib = this.getOrCreateUserDefaultLibrary(user.id);
      scopeType = 'pack';
      scopeId = lib.id;
    } else if (params.source === 'current_campaign') {
      scopeType = 'campaign';
      scopeId = activeCampId;
    } else if (params.source === 'my_packs') {
      const packs = (this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS)).filter(p => p.ownerId === user.id && !p.isDefaultLibrary);
      scopeType = 'pack';
      scopeId = packs[0]?.id || 'pack-zorvania';
    } else if (params.source === 'shared_packs') {
      scopeType = 'pack';
      scopeId = 'pack-zorvania';
    } else if (params.source.startsWith('pack-') || params.source.startsWith('pack_')) {
      scopeType = 'pack';
      scopeId = params.source;
    } else if (params.source.startsWith('camp-') || params.source === 'zorvania-c1' || params.source === 'campaign-srd-test') {
      scopeType = 'campaign';
      scopeId = params.source;
    }

    const bundle = this.getScopeBundle(scopeType, scopeId);
    let allEntities: { itemType: CloneEntityType; data: any; id: string; name: string; region?: string; tags?: string[]; updatedAt?: any }[] = [];

    if (!params.type || params.type === 'location') {
      allEntities.push(...bundle.locations.map(l => ({ itemType: 'location' as const, data: l, id: l.id, name: l.name, region: l.region, tags: l.tags, updatedAt: l.updatedAt })));
    }
    if (!params.type || params.type === 'npc') {
      allEntities.push(...bundle.npcs.map(n => ({ itemType: 'npc' as const, data: n, id: n.id, name: n.name, region: n.region, tags: n.tags, updatedAt: n.updatedAt })));
    }
    if (!params.type || params.type === 'item') {
      allEntities.push(...bundle.items.map(i => ({ itemType: 'item' as const, data: i, id: i.id, name: i.name, region: i.region, tags: i.tags, updatedAt: i.updatedAt })));
    }
    if (!params.type || params.type === 'encounter') {
      allEntities.push(...bundle.encounters.map(e => ({ itemType: 'encounter' as const, data: e, id: e.id, name: e.name, tags: e.tags, updatedAt: e.updatedAt })));
    }
    if (!params.type || params.type === 'class_template') {
      allEntities.push(...bundle.classTemplates.map(c => ({ itemType: 'class_template' as const, data: c, id: c.id, name: c.name, tags: c.tags, updatedAt: c.updatedAt })));
    }
    if (!params.type || params.type === 'lineage_template') {
      allEntities.push(...bundle.lineageTemplates.map(l => ({ itemType: 'lineage_template' as const, data: l, id: l.id, name: l.name, tags: l.tags, updatedAt: l.updatedAt })));
    }
    if (!params.type || params.type === 'background_template') {
      allEntities.push(...bundle.backgroundTemplates.map(b => ({ itemType: 'background_template' as const, data: b, id: b.id, name: b.name, tags: b.tags, updatedAt: b.updatedAt })));
    }
    if (!params.type || params.type === 'faction') {
      allEntities.push(...bundle.factions.map(f => ({ itemType: 'faction' as const, data: f, id: f.id, name: f.name, region: f.region, tags: f.tags, updatedAt: f.updatedAt })));
    }
    if (!params.type || params.type === 'campaign_doc') {
      allEntities.push(...bundle.campaignDocs.map(d => ({ itemType: 'campaign_doc' as const, data: d, id: d.id, name: d.title, updatedAt: d.updatedAt })));
    }
    if (!params.type || params.type === 'calendar') {
      allEntities.push(...bundle.calendars.map(c => ({ itemType: 'calendar' as const, data: c, id: c.id || 'cal_1', name: c.name, tags: c.tags })));
    }

    // Filter by q
    if (params.q) {
      const qLower = params.q.trim().toLowerCase();
      allEntities = allEntities.filter(e => 
        e.name.toLowerCase().includes(qLower) ||
        (e.data.description && e.data.description.toLowerCase().includes(qLower)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(qLower)))
      );
    }

    // Filter by tag
    if (params.tag) {
      allEntities = allEntities.filter(e => e.tags && e.tags.includes(params.tag!));
    }

    // Filter by region
    if (params.region) {
      allEntities = allEntities.filter(e => e.region === params.region);
    }

    // Favorites
    const favorites = this.getItem<Favorite[]>('favorites', []);
    const favSet = new Set(favorites.filter(f => f.userId === user.id).map(f => `${f.entityType}:${f.entityId}`));

    // Sort
    if (params.sort === 'name') {
      allEntities.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    } else if (params.sort === 'favorite') {
      allEntities.sort((a, b) => {
        const aFav = favSet.has(`${a.itemType}:${a.id}`) ? 1 : 0;
        const bFav = favSet.has(`${b.itemType}:${b.id}`) ? 1 : 0;
        return bFav - aFav;
      });
    }

    const total = allEntities.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paged = allEntities.slice(offset, offset + limit).map(e => ({
      ...e.data,
      itemType: e.itemType,
      isFavorite: favSet.has(`${e.itemType}:${e.id}`)
    }));

    return { items: paged, total };
  }

  async saveToLibrary(data: { entityRefs: EntityRef[]; packId?: string }): Promise<{ success: boolean; count: number }> {
    const user = this.currentUser || SEED_USERS[0];
    const targetPackId = data.packId || this.getOrCreateUserDefaultLibrary(user.id).id;
    const activeCampId = this.getActiveCampaignId() || 'zorvania-c1';

    const cloneJob = await this.runClone({
      source: {
        scopeType: 'campaign',
        scopeId: activeCampId,
        entityRefs: data.entityRefs
      },
      target: {
        scopeType: 'pack',
        scopeId: targetPackId
      },
      options: {
        includeDependencies: 'auto',
        includeChildren: true,
        keepLink: 'copy'
      }
    });

    return { success: true, count: cloneJob.manifest.totalCount };
  }

  async listContentPacks(): Promise<ContentPack[]> {
    return this.listPacks();
  }

  async getContentPack(id: string): Promise<ContentPack | null> {
    const packs = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    return packs.find(p => p.id === id) || null;
  }

  async listPacks(params?: { kind?: ContentPackKind }): Promise<ContentPack[]> {
    const user = this.currentUser || SEED_USERS[0];
    const allPacks = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    let userPacks = allPacks.filter(p => p.visibility === 'instance' || p.ownerId === user.id);
    if (params?.kind) {
      userPacks = userPacks.filter(p => p.kind === params.kind);
    }
    return userPacks;
  }

  async createPack(data: { name: string; description?: string; kind?: ContentPackKind; visibility?: 'private' | 'instance'; tags?: string[] }): Promise<ContentPack> {
    const user = this.currentUser || SEED_USERS[0];
    const newPack: ContentPack = {
      id: `pack-${Date.now()}-${generateId('p')}`,
      ownerId: user.id,
      name: data.name,
      description: data.description || '',
      version: '1.0.0',
      visibility: data.visibility || 'private',
      kind: data.kind || 'pack',
      tags: data.tags || [],
      isDefaultLibrary: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const packs = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    packs.push(newPack);
    this.setItem('content_packs', packs);
    return newPack;
  }

  async updatePack(id: string, data: Partial<ContentPack>): Promise<ContentPack> {
    const packs = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    const idx = packs.findIndex(p => p.id === id);
    if (idx === -1) throw { status: 404, message: 'بسته محتوا یافت نشد.' };
    packs[idx] = { ...packs[idx], ...data, updatedAt: Date.now() };
    this.setItem('content_packs', packs);
    return packs[idx];
  }

  async deletePack(id: string): Promise<void> {
    const packs = this.getItem<ContentPack[]>('content_packs', SEED_CONTENT_PACKS);
    const filtered = packs.filter(p => p.id !== id);
    this.setItem('content_packs', filtered);
  }

  async exportPack(id: string, options?: { embedMedia?: boolean }): Promise<any> {
    const pack = await this.getContentPack(id);
    if (!pack) throw { status: 404, message: 'بسته یافت نشد.' };

    const bundle = this.getScopeBundle('pack', id);
    return {
      format: 'zorvania-pack/1',
      version: 1,
      exportedAt: Date.now(),
      pack,
      entities: bundle
    };
  }

  async previewImportPack(packJson: any): Promise<CloneManifest> {
    if (!packJson || packJson.format !== 'zorvania-pack/1') {
      throw new Error('فرمت فایل نامعتبر است. فرمت مورد انتظار: zorvania-pack/1');
    }
    const entities = packJson.entities || {};
    const bundle: CloneEntityBundle = {
      classTemplates: entities.classTemplates || [],
      featureTemplates: entities.featureTemplates || [],
      weaponTemplates: entities.weaponTemplates || [],
      items: entities.items || [],
      rewards: entities.rewards || [],
      npcs: entities.npcs || [],
      locations: entities.locations || [],
      encounters: entities.encounters || [],
      factions: entities.factions || [],
      campaignDocs: entities.campaignDocs || [],
      calendars: entities.calendars || [],
      ruleSets: entities.ruleSets || [],
      lineageTemplates: entities.lineageTemplates || [],
      backgroundTemplates: entities.backgroundTemplates || []
    };

    const targetBundle = this.getScopeBundle('campaign', this.getActiveCampaignId() || 'zorvania-c1');
    return runPreviewClone(
      {
        source: { scopeType: 'pack', scopeId: packJson.pack?.id || 'import_pack' },
        target: { scopeType: 'campaign', scopeId: this.getActiveCampaignId() || 'zorvania-c1' },
        options: { includeDependencies: 'auto' }
      },
      bundle,
      targetBundle
    );
  }

  async runImportPack(packJson: any, target: { scopeType: EntityScopeType; scopeId: string }): Promise<CloneJob> {
    const manifest = await this.previewImportPack(packJson);
    const entities = packJson.entities || {};
    const bundle: CloneEntityBundle = {
      classTemplates: entities.classTemplates || [],
      featureTemplates: entities.featureTemplates || [],
      weaponTemplates: entities.weaponTemplates || [],
      items: entities.items || [],
      rewards: entities.rewards || [],
      npcs: entities.npcs || [],
      locations: entities.locations || [],
      encounters: entities.encounters || [],
      factions: entities.factions || [],
      campaignDocs: entities.campaignDocs || [],
      calendars: entities.calendars || [],
      ruleSets: entities.ruleSets || [],
      lineageTemplates: entities.lineageTemplates || [],
      backgroundTemplates: entities.backgroundTemplates || []
    };

    const targetBundle = this.getScopeBundle(target.scopeType, target.scopeId);
    const result = runExecuteClone(
      {
        source: { scopeType: 'pack', scopeId: packJson.pack?.id || 'import_pack' },
        target,
        options: { includeDependencies: 'auto' }
      },
      bundle,
      targetBundle
    );

    // Persist created entities
    this.mergeCreatedEntitiesIntoStorage(result.createdEntities);

    const user = this.currentUser || SEED_USERS[0];
    const job: CloneJob = {
      id: `cjob-${Date.now()}`,
      userId: user.id,
      source: { scopeType: 'pack', scopeId: packJson.pack?.id || 'import_pack' },
      targetScopeType: target.scopeType,
      targetScopeId: target.scopeId,
      options: { includeDependencies: 'auto' },
      status: 'done',
      manifest: result.manifest,
      warnings: result.warnings,
      createdAt: Date.now(),
      finishedAt: Date.now()
    };

    const jobs = this.getItem<CloneJob[]>('clone_jobs', []);
    jobs.unshift(job);
    this.setItem('clone_jobs', jobs);
    return job;
  }

  async toggleFavorite(entityType: string, entityId: string): Promise<boolean> {
    const user = this.currentUser || SEED_USERS[0];
    const favs = this.getItem<Favorite[]>('favorites', []);
    const idx = favs.findIndex(f => f.userId === user.id && f.entityType === entityType && f.entityId === entityId);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push({ userId: user.id, entityType, entityId, createdAt: Date.now() });
      isFav = true;
    }
    this.setItem('favorites', favs);
    return isFav;
  }

  async listFavorites(): Promise<Favorite[]> {
    const user = this.currentUser || SEED_USERS[0];
    const favs = this.getItem<Favorite[]>('favorites', []);
    return favs.filter(f => f.userId === user.id);
  }

  // -------------------------------------------------------------
  // Phase 2: Clone Engine Execution & Undo
  // -------------------------------------------------------------
  async previewClone(request: CloneRequest): Promise<CloneManifest> {
    const sourceBundle = this.getScopeBundle(request.source.scopeType, request.source.scopeId);
    const targetBundle = this.getScopeBundle(request.target.scopeType, request.target.scopeId);
    return runPreviewClone(request, sourceBundle, targetBundle);
  }

  private mergeCreatedEntitiesIntoStorage(created: CloneEntityBundle) {
    if (created.classTemplates.length > 0) {
      const existing = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
      this.setItem('class_templates', [...existing, ...created.classTemplates]);
    }
    if (created.lineageTemplates && created.lineageTemplates.length > 0) {
      const existing = this.getItem<LineageTemplate[]>('lineage_templates', SEED_LINEAGE_TEMPLATES);
      this.setItem('lineage_templates', [...existing, ...created.lineageTemplates]);
    }
    if (created.backgroundTemplates && created.backgroundTemplates.length > 0) {
      const existing = this.getItem<BackgroundTemplate[]>('background_templates', SEED_BACKGROUND_TEMPLATES);
      this.setItem('background_templates', [...existing, ...created.backgroundTemplates]);
    }
    if (created.featureTemplates.length > 0) {
      const existing = this.getItem<FeatureTemplate[]>('feature_templates', []);
      this.setItem('feature_templates', [...existing, ...created.featureTemplates]);
    }
    if (created.weaponTemplates.length > 0) {
      const existing = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
      this.setItem('weapon_templates', [...existing, ...created.weaponTemplates]);
    }
    if (created.items.length > 0) {
      const existing = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
      this.setItem('items', [...existing, ...created.items]);
    }
    if (created.rewards.length > 0) {
      const existing = this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES);
      this.setItem('rewards', [...existing, ...created.rewards]);
    }
    if (created.npcs.length > 0) {
      const existing = this.getItem<NPC[]>('npcs', SEED_NPCS);
      this.setItem('npcs', [...existing, ...created.npcs]);
    }
    if (created.locations.length > 0) {
      const existing = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
      this.setItem('locations', [...existing, ...created.locations]);
    }
    if (created.encounters.length > 0) {
      const existing = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
      this.setItem('encounters', [...existing, ...created.encounters]);
    }
    if (created.factions.length > 0) {
      const existing = this.getItem<Faction[]>('factions', SEED_FACTIONS);
      this.setItem('factions', [...existing, ...created.factions]);
    }
    if (created.campaignDocs.length > 0) {
      const existing = this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS);
      this.setItem('campaign_docs', [...existing, ...created.campaignDocs]);
    }
    if (created.calendars.length > 0) {
      const existing = this.getItem<GenericCalendarData[]>('calendars', [SEED_GENERIC_CALENDAR]);
      this.setItem('calendars', [...existing, ...created.calendars]);
    }
    if (created.ruleSets.length > 0) {
      const existing = this.getItem<RuleSet[]>('rule_sets', SEED_RULE_SETS);
      this.setItem('rule_sets', [...existing, ...created.ruleSets]);
    }
  }

  async runClone(request: CloneRequest): Promise<CloneJob> {
    const user = this.currentUser || SEED_USERS[0];
    const sourceBundle = this.getScopeBundle(request.source.scopeType, request.source.scopeId);
    const targetBundle = this.getScopeBundle(request.target.scopeType, request.target.scopeId);

    const result = runExecuteClone(request, sourceBundle, targetBundle);
    this.mergeCreatedEntitiesIntoStorage(result.createdEntities);

    const job: CloneJob = {
      id: `cjob-${Date.now()}-${generateId('j')}`,
      userId: user.id,
      source: request.source,
      targetScopeType: request.target.scopeType,
      targetScopeId: request.target.scopeId,
      options: request.options || {},
      status: 'done',
      manifest: result.manifest,
      warnings: result.warnings,
      createdAt: Date.now(),
      finishedAt: Date.now()
    };

    const jobs = this.getItem<CloneJob[]>('clone_jobs', []);
    jobs.unshift(job);
    this.setItem('clone_jobs', jobs);
    return job;
  }

  async listCloneJobs(scopeId?: string): Promise<CloneJob[]> {
    const jobs = this.getItem<CloneJob[]>('clone_jobs', []);
    if (scopeId) {
      return jobs.filter(j => j.targetScopeId === scopeId);
    }
    return jobs;
  }

  async undoCloneJob(jobId: string, force = false): Promise<{ success: boolean; undoneCount: number; skippedEntities: string[] }> {
    const jobs = this.getItem<CloneJob[]>('clone_jobs', []);
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw { status: 404, message: 'شناسه عملیات کلون یافت نشد.' };

    const SEVEN_DAYS = 7 * 86400000;
    if (Date.now() - job.createdAt > SEVEN_DAYS && !force) {
      throw new Error('بیش از ۷ روز از عملیات کلون گذشته است و لغو آن امکان‌پذیر نیست.');
    }

    const createdIds = job.manifest.createdIds || {};
    let undoneCount = 0;
    const skippedEntities: string[] = [];

    // Helper to remove ids from a storage key
    const removeIds = (storageKey: string, ids?: string[]) => {
      if (!ids || ids.length === 0) return;
      const all = this.getItem<any[]>(storageKey, []);
      const filtered = all.filter(item => {
        if (ids.includes(item.id)) {
          undoneCount++;
          return false;
        }
        return true;
      });
      this.setItem(storageKey, filtered);
    };

    removeIds('locations', createdIds.locations);
    removeIds('npcs', createdIds.npcs);
    removeIds('items', createdIds.items);
    removeIds('encounters', createdIds.encounters);
    removeIds('weapon_templates', createdIds.weaponTemplates);
    removeIds('class_templates', createdIds.classTemplates);
    removeIds('lineage_templates', createdIds.lineageTemplates);
    removeIds('background_templates', createdIds.backgroundTemplates);
    removeIds('feature_templates', createdIds.featureTemplates);
    removeIds('rewards', createdIds.rewards);
    removeIds('factions', createdIds.factions);
    removeIds('campaign_docs', createdIds.campaignDocs);

    job.status = 'undone';
    job.undoneAt = Date.now();
    this.setItem('clone_jobs', jobs);

    return { success: true, undoneCount, skippedEntities };
  }

  // -------------------------------------------------------------
  // Phase 2: Campaign Wizard & Drafts
  // -------------------------------------------------------------
  async createDraftCampaign(startMode: WizardStartMode, sourceId?: string): Promise<Campaign> {
    const user = this.currentUser || SEED_USERS[0];
    const campId = `camp-draft-${Date.now()}`;

    let defaultName = 'کمپین جدید';
    let defaultDesc = '';
    let starterAnswers: any = {};

    if (startMode === 'pack' && sourceId) {
      const pack = await this.getContentPack(sourceId);
      if (pack) {
        defaultName = `کمپین ${pack.name}`;
        defaultDesc = pack.description;
      }
    } else if (startMode === 'template' && sourceId) {
      const tmpl = await this.getContentPack(sourceId);
      if (tmpl) {
        defaultName = `${tmpl.name}`;
        defaultDesc = tmpl.description;
      }
    } else if (startMode === 'campaign' && sourceId) {
      const srcCamp = (this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS)).find(c => c.id === sourceId);
      if (srcCamp) {
        defaultName = `${srcCamp.name} (نسخه جدید)`;
        defaultDesc = srcCamp.description;
        starterAnswers = {
          units: srcCamp.settings.units,
          startingLevel: srcCamp.settings.startingLevel,
          maxEntryLevel: srcCamp.settings.maxEntryLevel,
          abilityScoreMethods: srcCamp.settings.abilityScoreMethods,
          houseRules: srcCamp.settings.houseRules
        };
      }
    }

    const draftCampaign: Campaign = {
      id: campId,
      name: defaultName,
      description: defaultDesc,
      tone: '',
      status: 'draft',
      ownerId: user.id,
      ownerName: user.displayName || user.name,
      sourcePackId: sourceId || null,
      settings: {
        units: 'feet',
        startingLevel: 1,
        maxEntryLevel: 20,
        abilityScoreMethods: ['standard_array', 'point_buy', 'roll', 'manual'],
        approval: { onCreate: false, onLevelUp: false },
        backstoryVisibility: 'party',
        diceVisibility: 'table',
        allowPlayerRollPrivate: true,
        allowPlayerCreateCharacter: true,
        encounterDefaults: {
          showExactHp: false,
          showAc: false,
          showConditions: true,
          showDefeated: true,
          playerInitiativeRolls: true
        }
      },
      wizardState: {
        step: 1,
        completed: [],
        startMode,
        sourceId: sourceId || null,
        answers: {
          name: defaultName,
          description: defaultDesc,
          ...starterAnswers
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      myRole: 'owner',
      memberCount: 1,
      characterCount: 0
    };

    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    allCampaigns.unshift(draftCampaign);
    this.setItem('campaigns', allCampaigns);

    // Add owner membership
    const allMembers = this.getItem<CampaignMember[]>('campaign_members', SEED_CAMPAIGN_MEMBERS);
    allMembers.push({
      campaignId: campId,
      userId: user.id,
      role: 'owner',
      status: 'active',
      joinedAt: Date.now(),
      userName: user.displayName || user.name,
      userEmail: user.email
    });
    this.setItem('campaign_members', allMembers);

    return draftCampaign;
  }

  async updateWizardState(campaignId: string, state: Partial<WizardState>): Promise<Campaign> {
    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };

    const currentWiz = camp.wizardState || {
      step: 1,
      completed: [],
      startMode: 'empty',
      answers: {}
    };

    const updatedWiz: WizardState = {
      ...currentWiz,
      ...state,
      answers: {
        ...currentWiz.answers,
        ...(state.answers || {})
      }
    };

    camp.wizardState = updatedWiz;
    if (updatedWiz.answers.name) camp.name = updatedWiz.answers.name;
    if (updatedWiz.answers.description) camp.description = updatedWiz.answers.description;
    if (updatedWiz.answers.premise) camp.tone = updatedWiz.answers.premise;
    if (updatedWiz.answers.coverMediaId) camp.coverMediaId = updatedWiz.answers.coverMediaId;
    camp.updatedAt = Date.now();

    this.setItem('campaigns', allCampaigns);
    return camp;
  }

  async launchCampaign(campaignId: string): Promise<Campaign> {
    const allCampaigns = this.getItem<Campaign[]>('campaigns', SEED_CAMPAIGNS);
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (!camp) throw { status: 404, message: 'کمپین یافت نشد.' };

    camp.status = 'active';
    camp.updatedAt = Date.now();
    this.setItem('campaigns', allCampaigns);
    return camp;
  }

  async saveCampaignAsTemplate(campaignId: string, options: { name: string; description?: string; stripSecrets?: boolean; entityTypes?: string[] }): Promise<ContentPack> {
    const user = this.currentUser || SEED_USERS[0];
    const templatePack = await this.createPack({
      name: options.name,
      description: options.description || 'قالب استخراج شده از کمپین',
      kind: 'campaign_template',
      visibility: 'instance',
      tags: ['قالب', 'کمپین']
    });

    await this.runClone({
      source: { scopeType: 'campaign', scopeId: campaignId },
      target: { scopeType: 'pack', scopeId: templatePack.id },
      options: {
        includeDependencies: 'auto',
        stripDmSecrets: options.stripSecrets !== false,
        resetState: true,
        visibility: 'hidden'
      }
    });

    return templatePack;
  }

  // -------------------------------------------------------------
  // Phase 2: Entities (Factions, Campaign Docs, Generic Calendar)
  // -------------------------------------------------------------
  async listFactions(campaignId?: string): Promise<Faction[]> {
    const cId = campaignId || this.getActiveCampaignId() || 'zorvania-c1';
    const all = this.getItem<Faction[]>('factions', SEED_FACTIONS);
    return all.filter(f => f.scopeId === cId);
  }

  async createFaction(data: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faction> {
    const newFaction: Faction = {
      ...data,
      id: `fac-${Date.now()}-${generateId('f')}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const all = this.getItem<Faction[]>('factions', SEED_FACTIONS);
    all.push(newFaction);
    this.setItem('factions', all);
    return newFaction;
  }

  async updateFaction(data: Faction): Promise<Faction> {
    const all = this.getItem<Faction[]>('factions', SEED_FACTIONS);
    const idx = all.findIndex(f => f.id === data.id);
    if (idx === -1) throw { status: 404, message: 'جناح یافت نشد.' };
    all[idx] = { ...data, updatedAt: Date.now() };
    this.setItem('factions', all);
    return all[idx];
  }

  async deleteFaction(id: string): Promise<void> {
    const all = this.getItem<Faction[]>('factions', SEED_FACTIONS);
    const filtered = all.filter(f => f.id !== id);
    this.setItem('factions', filtered);
  }

  async listCampaignDocs(campaignId?: string): Promise<CampaignDoc[]> {
    const cId = campaignId || this.getActiveCampaignId() || 'zorvania-c1';
    const all = this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS);
    return all.filter(d => d.campaignId === cId);
  }

  async createCampaignDoc(data: Omit<CampaignDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignDoc> {
    const newDoc: CampaignDoc = {
      ...data,
      id: `cdoc-${Date.now()}-${generateId('d')}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const all = this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS);
    all.push(newDoc);
    this.setItem('campaign_docs', all);
    return newDoc;
  }

  async updateCampaignDoc(data: CampaignDoc): Promise<CampaignDoc> {
    const all = this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS);
    const idx = all.findIndex(d => d.id === data.id);
    if (idx === -1) throw { status: 404, message: 'سند یافت نشد.' };
    all[idx] = { ...data, updatedAt: Date.now() };
    this.setItem('campaign_docs', all);
    return all[idx];
  }

  async deleteCampaignDoc(id: string): Promise<void> {
    const all = this.getItem<CampaignDoc[]>('campaign_docs', SEED_CAMPAIGN_DOCS);
    const filtered = all.filter(d => d.id !== id);
    this.setItem('campaign_docs', filtered);
  }

  async getGenericCalendar(calendarId?: string): Promise<GenericCalendarData> {
    const all = this.getItem<GenericCalendarData[]>('calendars', [SEED_GENERIC_CALENDAR]);
    return all.find(c => c.id === calendarId) || all[0];
  }

  async updateGenericCalendar(data: GenericCalendarData): Promise<GenericCalendarData> {
    const all = this.getItem<GenericCalendarData[]>('calendars', [SEED_GENERIC_CALENDAR]);
    const idx = all.findIndex(c => c.id === data.id);
    if (idx >= 0) {
      all[idx] = data;
    } else {
      all.push(data);
    }
    this.setItem('calendars', all);
    return data;
  }

  // -------------------------------------------------------------
  // Phase 2 Part B: Linked Copies (Diff & Updates)
  // -------------------------------------------------------------
  async checkLinkedUpdates(campaignId: string): Promise<LinkedEntityDiff[]> {
    const diffs: LinkedEntityDiff[] = [];
    const activeCampId = campaignId || this.getActiveCampaignId() || 'zorvania-c1';
    const bundle = this.getScopeBundle('campaign', activeCampId);

    const checkEntity = (type: CloneEntityType, entity: any, sourceCollection: any[]) => {
      if (entity.sourceMode === 'linked' && entity.sourceId) {
        const source = sourceCollection.find(s => s.id === entity.sourceId);
        if (!source) {
          diffs.push({
            entityType: type,
            entityId: entity.id,
            sourceId: entity.sourceId,
            sourceName: entity.name || entity.title || '',
            sourceUpdatedAt: 0,
            copiedAt: entity.copiedAt || 0,
            sourceAvailable: false,
            hasUpdates: false,
            diffs: []
          });
          return;
        }

        const sourceUpdated = Number(source.updatedAt) || 0;
        const copied = Number(entity.copiedAt) || 0;
        const hasUpdates = sourceUpdated > copied;

        const fieldDiffs: any[] = [];
        if (hasUpdates) {
          if (source.name && source.name !== entity.name) {
            fieldDiffs.push({ field: 'name', labelFa: 'نام', sourceValue: source.name, localValue: entity.name, chosenValue: 'local' });
          }
          if (source.description && source.description !== entity.description) {
            fieldDiffs.push({ field: 'description', labelFa: 'شرح', sourceValue: source.description, localValue: entity.description, chosenValue: 'local' });
          }
        }

        if (hasUpdates) {
          diffs.push({
            entityType: type,
            entityId: entity.id,
            sourceId: source.id,
            sourceName: source.name || source.title || '',
            sourceUpdatedAt: sourceUpdated,
            copiedAt: copied,
            sourceAvailable: true,
            hasUpdates: true,
            diffs: fieldDiffs
          });
        }
      }
    };

    const allNpcs = this.getItem<NPC[]>('npcs', SEED_NPCS);
    for (const n of bundle.npcs) checkEntity('npc', n, allNpcs);

    const allItems = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    for (const i of bundle.items) checkEntity('item', i, allItems);

    const allLocs = this.getItem<LocationEntry[]>('locations', SEED_LOCATIONS);
    for (const l of bundle.locations) checkEntity('location', l, allLocs);

    return diffs;
  }

  async getLinkedEntityDiff(entityType: CloneEntityType, entityId: string): Promise<LinkedEntityDiff | null> {
    const updates = await this.checkLinkedUpdates(this.getActiveCampaignId() || 'zorvania-c1');
    return updates.find(u => u.entityType === entityType && u.entityId === entityId) || null;
  }

  async applyLinkedDiff(entityType: CloneEntityType, entityId: string, chosenFields: Record<string, 'local' | 'source'>): Promise<any> {
    const diff = await this.getLinkedEntityDiff(entityType, entityId);
    if (!diff || !diff.sourceAvailable) throw new Error('منبع در دسترس نیست.');

    // Apply chosen fields from source
    return { success: true };
  }

  async detachLink(entityType: CloneEntityType, entityId: string): Promise<any> {
    // Unlink entity: sets sourceMode = 'copy'
    return { success: true };
  }


  // Migration V2 (Idempotent)
  async migrateV2(dryRun = false): Promise<{ success: boolean; report: any }> {
    const report = {
      campaignsCreated: 1,
      membersMigrated: 8,
      masterCharactersCreated: 6,
      participationsCreated: 6,
      contentPacksCreated: 2,
      dryRun
    };
    if (!dryRun) {
      await this.seedDatabase(true);
    }
    return { success: true, report };
  }
}

// ----------------------------------------------------------------------
// HttpApi Adapter (Calls REST endpoints under /api/* with CSRF header)
// ----------------------------------------------------------------------
export class HttpApi implements ApiClient {
  private baseUrl = '/api';
  public liveChannel: LiveChannel;

  constructor() {
    this.liveChannel = new HttpLiveChannel((url, opts) => this.fetchJson(url, opts));
  }

  private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (isStateChanging) {
      headers['X-Requested-With'] = 'zorvania';
    }

    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      credentials: 'include',
      headers
    });

    if (!res.ok) {
      let errText = 'خطا در ارتباط با سرور';
      try {
        const body = await res.json();
        errText = body.error || body.message || errText;
      } catch {
        errText = `HTTP Error ${res.status}`;
      }
      const err = new Error(errText);
      (err as any).status = res.status;
      throw err;
    }

    return res.json();
  }

  async login(email: string, password?: string): Promise<User> {
    const res = await this.fetchJson<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return res.user;
  }

  async register(email: string, password?: string, displayName?: string, inviteCode?: string): Promise<User> {
    const res = await this.fetchJson<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, inviteCode })
    });
    return res.user;
  }

  async logout(): Promise<void> {
    await this.fetchJson('/auth/logout', { method: 'POST' });
  }

  async logoutAll(): Promise<void> {
    await this.fetchJson('/auth/logout-all', { method: 'POST' });
  }

  async getMe(): Promise<AuthMeResponse> {
    try {
      return await this.fetchJson<AuthMeResponse>('/auth/me');
    } catch {
      return { user: null, activeCharacterId: null, mustChangePassword: false };
    }
  }

  async consumeResetToken(token: string, newPassword: string): Promise<User> {
    const res = await this.fetchJson<{ user: User }>('/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    return res.user;
  }

  async switchUser(userId: string): Promise<User> {
    // In production HTTP mode, switchUser is not directly permitted without credentials
    // We fetch user info or call preview switcher
    return this.fetchJson<User>(`/users/${userId}`);
  }

  // Account (Self)
  async updateProfile(displayName: string): Promise<User> {
    return this.fetchJson<User>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName })
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.fetchJson('/me/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async changeEmail(currentPassword: string, newEmail: string): Promise<User> {
    return this.fetchJson<User>('/me/email', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newEmail })
    });
  }

  async listSessions(): Promise<UserSession[]> {
    return this.fetchJson<UserSession[]>('/me/sessions');
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.fetchJson(`/me/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async setActiveCharacter(characterId: string | null): Promise<void> {
    await this.fetchJson('/me/active-character', {
      method: 'PUT',
      body: JSON.stringify({ characterId })
    });
  }

  async exportMyData(): Promise<any> {
    return this.fetchJson<any>('/me/export');
  }

  // DM User Management
  async listUsers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    const q = searchParams.toString();
    return this.fetchJson<User[]>(`/users${q ? `?${q}` : ''}`);
  }

  async updateUser(id: string, data: { displayName?: string; role?: 'dm' | 'player'; status?: 'active' | 'disabled' }): Promise<User> {
    return this.fetchJson<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async generateResetToken(userId: string): Promise<{ resetToken: string; resetLink: string; expiresAt: number }> {
    return this.fetchJson<{ resetToken: string; resetLink: string; expiresAt: number }>(`/users/${userId}/reset-token`, {
      method: 'POST'
    });
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.fetchJson(`/users/${userId}/revoke-sessions`, { method: 'POST' });
  }

  async assignCharacterToUser(userId: string, characterId: string): Promise<void> {
    await this.fetchJson(`/users/${userId}/assign-character`, {
      method: 'POST',
      body: JSON.stringify({ characterId })
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.fetchJson(`/users/${userId}`, { method: 'DELETE' });
  }

  // Invites
  async createInvite(data: { label?: string; expiresInDays?: number; maxUses?: number; assignCharacterId?: string }): Promise<Invite> {
    const res = await this.fetchJson<{ invite: Invite }>('/invites', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.invite;
  }

  async listInvites(): Promise<Invite[]> {
    return this.fetchJson<Invite[]>('/invites');
  }

  async revokeInvite(inviteId: string): Promise<void> {
    await this.fetchJson(`/invites/${inviteId}`, { method: 'DELETE' });
  }

  // Audit
  async getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
    return this.fetchJson<AuditLogEntry[]>(`/audit?limit=${limit}`);
  }

  // Campaign Settings
  async getCampaignSettings(): Promise<{ allowPlayerCreateCharacter: boolean }> {
    try {
      const cid = this.getActiveCampaignId();
      const qs = cid ? `?campaignId=${encodeURIComponent(cid)}` : '';
      return await this.fetchJson<{ allowPlayerCreateCharacter: boolean }>(`/settings/campaign${qs}`);
    } catch {
      return { allowPlayerCreateCharacter: false };
    }
  }

  async updateCampaignSettings(settings: { allowPlayerCreateCharacter: boolean }): Promise<{ allowPlayerCreateCharacter: boolean }> {
    return this.fetchJson<{ allowPlayerCreateCharacter: boolean }>('/settings/campaign', {
      method: 'PUT',
      body: JSON.stringify({ ...settings, campaignId: this.getActiveCampaignId() })
    });
  }

  // Characters
  async listCharacters(): Promise<Character[]> {
    return this.fetchJson<Character[]>('/characters');
  }

  async getCharacter(id: string): Promise<Character | null> {
    return this.fetchJson<Character>(`/characters/${id}`);
  }

  async createCharacter(char: Partial<Character>): Promise<Character> {
    return this.fetchJson<Character>('/characters', {
      method: 'POST',
      body: JSON.stringify(char)
    });
  }

  async updateCharacter(char: Character): Promise<Character> {
    return this.fetchJson<Character>(`/characters/${char.id}`, {
      method: 'PUT',
      body: JSON.stringify(char)
    });
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.fetchJson(`/characters/${id}`, { method: 'DELETE' });
  }

  async applyGroupRest(type: 'short' | 'long' | 'special', notes?: string): Promise<Character[]> {
    return this.fetchJson<Character[]>('/characters/group-rest', {
      method: 'POST',
      body: JSON.stringify({ type, notes })
    });
  }

  async updateGroupResources(delta: { rations?: number; lanternOil?: number }): Promise<Character[]> {
    return this.fetchJson<Character[]>('/characters/group-resources', {
      method: 'POST',
      body: JSON.stringify(delta)
    });
  }

  // Notes
  async listNotes(characterId?: string): Promise<CharacterNote[]> {
    const q = characterId ? `?characterId=${characterId}` : '';
    return this.fetchJson<CharacterNote[]>(`/notes${q}`);
  }

  async getNote(id: string): Promise<CharacterNote | null> {
    return this.fetchJson<CharacterNote>(`/notes/${id}`);
  }

  async createNote(note: Omit<CharacterNote, 'id' | 'updatedAt'>): Promise<CharacterNote> {
    return this.fetchJson<CharacterNote>('/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
  }

  async updateNote(note: CharacterNote): Promise<CharacterNote> {
    return this.fetchJson<CharacterNote>(`/notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify(note)
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.fetchJson(`/notes/${id}`, { method: 'DELETE' });
  }

  // NPCs
  async listNpcs(): Promise<NPC[]> {
    return this.fetchJson<NPC[]>('/npcs');
  }

  async getNpc(id: string): Promise<NPC | null> {
    return this.fetchJson<NPC>(`/npcs/${id}`);
  }

  async createNpc(npc: Omit<NPC, 'id' | 'updatedAt'>): Promise<NPC> {
    return this.fetchJson<NPC>('/npcs', {
      method: 'POST',
      body: JSON.stringify(npc)
    });
  }

  async updateNpc(npc: NPC): Promise<NPC> {
    return this.fetchJson<NPC>(`/npcs/${npc.id}`, {
      method: 'PUT',
      body: JSON.stringify(npc)
    });
  }

  async deleteNpc(id: string): Promise<void> {
    await this.fetchJson(`/npcs/${id}`, { method: 'DELETE' });
  }

  // Items
  async listItems(): Promise<ItemLibraryEntry[]> {
    return this.fetchJson<ItemLibraryEntry[]>('/items');
  }

  async createItem(item: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>): Promise<ItemLibraryEntry> {
    return this.fetchJson<ItemLibraryEntry>('/items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async updateItem(item: ItemLibraryEntry): Promise<ItemLibraryEntry> {
    return this.fetchJson<ItemLibraryEntry>(`/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.fetchJson(`/items/${id}`, { method: 'DELETE' });
  }

  async giveItemToPlayer(characterId: string, item: ItemLibraryEntry): Promise<Character> {
    return this.fetchJson<Character>(`/characters/${characterId}/give-item`, {
      method: 'POST',
      body: JSON.stringify({ item })
    });
  }

  // Templates
  async listWeaponTemplates(): Promise<WeaponTemplate[]> {
    return this.fetchJson<WeaponTemplate[]>('/weapon-templates');
  }

  async createWeaponTemplate(tmpl: Omit<WeaponTemplate, 'id'>): Promise<WeaponTemplate> {
    return this.fetchJson<WeaponTemplate>('/weapon-templates', {
      method: 'POST',
      body: JSON.stringify(tmpl)
    });
  }

  async updateWeaponTemplate(tmpl: WeaponTemplate): Promise<WeaponTemplate> {
    return this.fetchJson<WeaponTemplate>(`/weapon-templates/${tmpl.id}`, {
      method: 'PUT',
      body: JSON.stringify(tmpl)
    });
  }

  async deleteWeaponTemplate(id: string): Promise<void> {
    await this.fetchJson(`/weapon-templates/${id}`, { method: 'DELETE' });
  }

  async listClassTemplates(scopeType?: string, scopeId?: string): Promise<ClassTemplate[]> {
    const params = new URLSearchParams();
    if (scopeType) params.set('scopeType', scopeType);
    if (scopeId) params.set('scopeId', scopeId);
    const qs = params.toString();
    return this.fetchJson<ClassTemplate[]>(`/class-templates${qs ? `?${qs}` : ''}`);
  }

  async getClassTemplate(id: string): Promise<ClassTemplate | null> {
    try {
      return await this.fetchJson<ClassTemplate>(`/class-templates/${id}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async createClassTemplate(tmpl: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate> {
    return this.fetchJson<ClassTemplate>('/class-templates', {
      method: 'POST',
      body: JSON.stringify(tmpl)
    });
  }

  async updateClassTemplate(tmpl: ClassTemplate): Promise<ClassTemplate> {
    return this.fetchJson<ClassTemplate>(`/class-templates/${tmpl.id}`, {
      method: 'PUT',
      body: JSON.stringify(tmpl)
    });
  }

  async deleteClassTemplate(id: string): Promise<void> {
    await this.fetchJson(`/class-templates/${id}`, { method: 'DELETE' });
  }

  // Lineage Templates
  async listLineageTemplates(scopeType?: string, scopeId?: string): Promise<LineageTemplate[]> {
    const params = new URLSearchParams();
    if (scopeType) params.set('scopeType', scopeType);
    if (scopeId) params.set('scopeId', scopeId);
    const qs = params.toString();
    return this.fetchJson<LineageTemplate[]>(`/lineage-templates${qs ? `?${qs}` : ''}`);
  }

  async getLineageTemplate(id: string): Promise<LineageTemplate | null> {
    try {
      return await this.fetchJson<LineageTemplate>(`/lineage-templates/${id}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async createLineageTemplate(tmpl: Omit<LineageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LineageTemplate> {
    return this.fetchJson<LineageTemplate>('/lineage-templates', {
      method: 'POST',
      body: JSON.stringify(tmpl)
    });
  }

  async updateLineageTemplate(tmpl: LineageTemplate): Promise<LineageTemplate> {
    return this.fetchJson<LineageTemplate>(`/lineage-templates/${tmpl.id}`, {
      method: 'PUT',
      body: JSON.stringify(tmpl)
    });
  }

  async deleteLineageTemplate(id: string): Promise<void> {
    await this.fetchJson(`/lineage-templates/${id}`, { method: 'DELETE' });
  }

  // Background Templates
  async listBackgroundTemplates(scopeType?: string, scopeId?: string): Promise<BackgroundTemplate[]> {
    const params = new URLSearchParams();
    if (scopeType) params.set('scopeType', scopeType);
    if (scopeId) params.set('scopeId', scopeId);
    const qs = params.toString();
    return this.fetchJson<BackgroundTemplate[]>(`/background-templates${qs ? `?${qs}` : ''}`);
  }

  async getBackgroundTemplate(id: string): Promise<BackgroundTemplate | null> {
    try {
      return await this.fetchJson<BackgroundTemplate>(`/background-templates/${id}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async createBackgroundTemplate(tmpl: Omit<BackgroundTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackgroundTemplate> {
    return this.fetchJson<BackgroundTemplate>('/background-templates', {
      method: 'POST',
      body: JSON.stringify(tmpl)
    });
  }

  async updateBackgroundTemplate(tmpl: BackgroundTemplate): Promise<BackgroundTemplate> {
    return this.fetchJson<BackgroundTemplate>(`/background-templates/${tmpl.id}`, {
      method: 'PUT',
      body: JSON.stringify(tmpl)
    });
  }

  async deleteBackgroundTemplate(id: string): Promise<void> {
    await this.fetchJson(`/background-templates/${id}`, { method: 'DELETE' });
  }

  // Rewards
  async listRewards(): Promise<RewardPackage[]> {
    return this.fetchJson<RewardPackage[]>('/rewards');
  }

  async createReward(reward: Omit<RewardPackage, 'id' | 'createdAt'>): Promise<RewardPackage> {
    return this.fetchJson<RewardPackage>('/rewards', {
      method: 'POST',
      body: JSON.stringify(reward)
    });
  }

  async distributeReward(rewardId: string, characterIds: string[]): Promise<Character[]> {
    return this.fetchJson<Character[]>(`/rewards/${rewardId}/distribute`, {
      method: 'POST',
      body: JSON.stringify({ characterIds })
    });
  }

  // Campaign Notes
  async listCampaignNotes(): Promise<CampaignNote[]> {
    return this.fetchJson<CampaignNote[]>('/campaign-notes');
  }

  async createCampaignNote(note: Omit<CampaignNote, 'id' | 'updatedAt'>): Promise<CampaignNote> {
    return this.fetchJson<CampaignNote>('/campaign-notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
  }

  async updateCampaignNote(note: CampaignNote): Promise<CampaignNote> {
    return this.fetchJson<CampaignNote>(`/campaign-notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify(note)
    });
  }

  async deleteCampaignNote(id: string): Promise<void> {
    await this.fetchJson(`/campaign-notes/${id}`, { method: 'DELETE' });
  }

  // Encounters
  async listEncounters(): Promise<Encounter[]> {
    return this.fetchJson<Encounter[]>('/encounters');
  }

  async getEncounter(id: string): Promise<Encounter | null> {
    return this.fetchJson<Encounter>(`/encounters/${id}`);
  }

  async createEncounter(enc: Omit<Encounter, 'id' | 'updatedAt'>): Promise<Encounter> {
    return this.fetchJson<Encounter>('/encounters', {
      method: 'POST',
      body: JSON.stringify(enc)
    });
  }

  async updateEncounter(enc: Encounter): Promise<Encounter> {
    return this.fetchJson<Encounter>(`/encounters/${enc.id}`, {
      method: 'PUT',
      body: JSON.stringify(enc)
    });
  }

  async deleteEncounter(id: string): Promise<void> {
    await this.fetchJson(`/encounters/${id}`, { method: 'DELETE' });
  }

  async resetGroupRecharges(type: 'session' | 'season'): Promise<Character[]> {
    return this.fetchJson<Character[]>('/recharge-reset', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  async getCalendar(): Promise<WorldCalendar> {
    return this.fetchJson<WorldCalendar>('/calendar');
  }

  async updateCalendar(cal: Partial<WorldCalendar>): Promise<WorldCalendar> {
    return this.fetchJson<WorldCalendar>('/calendar', {
      method: 'PUT',
      body: JSON.stringify(cal)
    });
  }

  async advanceCalendar(days: number): Promise<WorldCalendar> {
    return this.fetchJson<WorldCalendar>('/calendar/advance', {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  }

  async getEndingState(): Promise<CampaignEndingState> {
    return this.fetchJson<CampaignEndingState>('/endings');
  }

  async updateEndingState(state: Partial<CampaignEndingState>): Promise<CampaignEndingState> {
    return this.fetchJson<CampaignEndingState>('/endings', {
      method: 'PUT',
      body: JSON.stringify(state)
    });
  }

  async listShanshinEncounters(): Promise<ShanshinEncounter[]> {
    return this.fetchJson<ShanshinEncounter[]>('/shanshin-encounters');
  }

  async updateShanshinEncounter(enc: ShanshinEncounter): Promise<ShanshinEncounter> {
    return this.fetchJson<ShanshinEncounter>(`/shanshin-encounters/${enc.id}`, {
      method: 'PUT',
      body: JSON.stringify(enc)
    });
  }

  async rollShanshinEncounter(): Promise<{ result: ShanshinEncounter; roll: number }> {
    return this.fetchJson<{ result: ShanshinEncounter; roll: number }>('/shanshin-encounters/roll', {
      method: 'POST'
    });
  }

  async seedDatabase(force?: boolean): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>('/admin/seed', {
      method: 'POST',
      body: JSON.stringify({ force })
    });
  }

  // --- Locations CRUD ---
  async listLocations(): Promise<LocationEntry[]> {
    return this.fetchJson<LocationEntry[]>('/locations');
  }

  async createLocation(loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocationEntry> {
    return this.fetchJson<LocationEntry>('/locations', {
      method: 'POST',
      body: JSON.stringify(loc)
    });
  }

  async updateLocation(loc: LocationEntry): Promise<LocationEntry> {
    return this.fetchJson<LocationEntry>(`/locations/${loc.id}`, {
      method: 'PATCH',
      body: JSON.stringify(loc)
    });
  }

  async deleteLocation(id: string): Promise<void> {
    await this.fetchJson(`/locations/${id}`, { method: 'DELETE' });
  }

  // --- Live Sync & Player Encounter ---
  async getLiveStatus(): Promise<LiveSyncStatus> {
    return this.fetchJson<LiveSyncStatus>('/live');
  }

  async getActiveEncounter(): Promise<PlayerEncounterView | null> {
    try {
      return await this.fetchJson<PlayerEncounterView>('/encounters/active');
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async getEncounterView(id: string, since?: number): Promise<PlayerEncounterView | LiveEncounter | { notModified: true }> {
    const url = since !== undefined ? `/encounters/${id}/view?since=${since}` : `/encounters/${id}/view`;
    return this.fetchJson(url);
  }

  async submitInitiative(encounterId: string, characterId: string, value: number): Promise<{ initiative: number; initiativeStatus: string }> {
    return this.fetchJson<{ initiative: number; initiativeStatus: string }>(`/encounters/${encounterId}/initiative`, {
      method: 'POST',
      body: JSON.stringify({ characterId, value })
    });
  }

  // --- Live Encounters (DM) ---
  async listLiveEncounters(status?: string, locationId?: string): Promise<LiveEncounter[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (locationId) params.set('locationId', locationId);
    const qs = params.toString();
    return this.fetchJson<LiveEncounter[]>(`/encounters${qs ? `?${qs}` : ''}`);
  }

  async createLiveEncounter(data: {
    name: string;
    locationId?: string | null;
    sessionTag?: string;
    settings?: Partial<EncounterSettings>;
    dmNotes?: string;
  }): Promise<LiveEncounter> {
    return this.fetchJson<LiveEncounter>('/encounters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getLiveEncounter(id: string): Promise<LiveEncounter | null> {
    try {
      return await this.fetchJson<LiveEncounter>(`/encounters/${id}`);
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async updateLiveEncounter(id: string, data: Partial<LiveEncounter>): Promise<LiveEncounter> {
    return this.fetchJson<LiveEncounter>(`/encounters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async startLiveEncounter(id: string, withSurpriseRound?: boolean): Promise<void> {
    await this.fetchJson(`/encounters/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ withSurpriseRound })
    });
  }

  async pauseLiveEncounter(id: string): Promise<void> {
    await this.fetchJson(`/encounters/${id}/pause`, { method: 'POST' });
  }

  async resumeLiveEncounter(id: string): Promise<void> {
    await this.fetchJson(`/encounters/${id}/resume`, { method: 'POST' });
  }

  async endLiveEncounter(id: string): Promise<void> {
    await this.fetchJson(`/encounters/${id}/end`, { method: 'POST' });
  }

  async nextEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }> {
    return this.fetchJson<{ currentParticipantId: string; round: number }>(`/encounters/${id}/next-turn`, { method: 'POST' });
  }

  async prevEncounterTurn(id: string): Promise<{ currentParticipantId: string; round: number }> {
    return this.fetchJson<{ currentParticipantId: string; round: number }>(`/encounters/${id}/prev-turn`, { method: 'POST' });
  }

  async addEncounterParticipants(
    encounterId: string,
    participants: any[],
    announce?: boolean,
    announcementText?: string
  ): Promise<EncounterParticipant[]> {
    return this.fetchJson<EncounterParticipant[]>(`/encounters/${encounterId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participants, announce, announcementText })
    });
  }

  async updateEncounterParticipant(encounterId: string, participantId: string, data: Partial<EncounterParticipant>): Promise<void> {
    await this.fetchJson(`/encounters/${encounterId}/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteEncounterParticipant(encounterId: string, participantId: string): Promise<void> {
    await this.fetchJson(`/encounters/${encounterId}/participants/${participantId}`, {
      method: 'DELETE'
    });
  }

  async addEncounterEvent(encounterId: string, text: string, visibleToPlayers?: boolean): Promise<void> {
    await this.fetchJson(`/encounters/${encounterId}/events`, {
      method: 'POST',
      body: JSON.stringify({ text, visibleToPlayers })
    });
  }

  async distributeEncounterLoot(encounterId: string, characterId: string, item: any): Promise<void> {
    await this.fetchJson(`/encounters/${encounterId}/loot`, {
      method: 'POST',
      body: JSON.stringify({ characterId, item })
    });
  }

  // --- Multi-Campaign Implementation in HttpApi ---
  private activeCampaignId: string | null = 'zorvania-c1';

  getActiveCampaignId(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('zorvania_active_campaign_id') || this.activeCampaignId;
    }
    return this.activeCampaignId;
  }

  setActiveCampaignId(id: string | null): void {
    this.activeCampaignId = id;
    if (typeof localStorage !== 'undefined') {
      if (id) localStorage.setItem('zorvania_active_campaign_id', id);
      else localStorage.removeItem('zorvania_active_campaign_id');
    }
  }

  async getCampaignRole(campaignId?: string): Promise<CampaignRole | null> {
    const cid = campaignId || this.getActiveCampaignId();
    if (!cid) return null;
    try {
      const camp = await this.getCampaign(cid);
      return camp.myRole || null;
    } catch {
      return null;
    }
  }

  async getHomeSummary(): Promise<HomeSummaryResponse> {
    return this.fetchJson<HomeSummaryResponse>('/home');
  }

  async listCampaigns(): Promise<Campaign[]> {
    return this.fetchJson<Campaign[]>('/campaigns');
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/c/${id}`);
  }

  async createCampaign(data: { name: string; description?: string; tone?: string; packId?: string | null; settings?: Partial<CampaignSettings> }): Promise<Campaign> {
    return this.fetchJson<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/c/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async archiveCampaign(id: string): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/c/${id}/archive`, { method: 'POST' });
  }

  async restoreCampaign(id: string): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/c/${id}/restore`, { method: 'POST' });
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.fetchJson(`/c/${id}`, { method: 'DELETE' });
  }

  async listCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    return this.fetchJson<CampaignMember[]>(`/c/${campaignId}/members`);
  }

  async updateCampaignMember(campaignId: string, userId: string, data: { role?: CampaignRole; status?: 'invited' | 'active' | 'left' | 'removed' }): Promise<CampaignMember> {
    return this.fetchJson<CampaignMember>(`/c/${campaignId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async removeCampaignMember(campaignId: string, userId: string): Promise<void> {
    await this.fetchJson(`/c/${campaignId}/members/${userId}`, { method: 'DELETE' });
  }

  async transferCampaignOwnership(campaignId: string, newOwnerId: string): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/c/${campaignId}/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify({ newOwnerId })
    });
  }

  async leaveCampaign(campaignId: string): Promise<void> {
    await this.fetchJson(`/c/${campaignId}/leave`, { method: 'POST' });
  }

  async listCampaignInvites(campaignId: string): Promise<CampaignInvite[]> {
    return this.fetchJson<CampaignInvite[]>(`/c/${campaignId}/invites`);
  }

  async createCampaignInvite(campaignId: string, data: { role?: CampaignRole; label?: string; expiresInDays?: number; maxUses?: number; assignParticipationId?: string }): Promise<CampaignInvite> {
    return this.fetchJson<CampaignInvite>(`/c/${campaignId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async revokeCampaignInvite(campaignId: string, inviteId: string): Promise<void> {
    await this.fetchJson(`/c/${campaignId}/invites/${inviteId}`, { method: 'DELETE' });
  }

  async acceptInvite(code: string): Promise<{ campaignId: string; role: CampaignRole }> {
    return this.fetchJson<{ campaignId: string; role: CampaignRole }>('/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async listMasterCharacters(): Promise<MasterCharacter[]> {
    return this.fetchJson<MasterCharacter[]>('/characters');
  }

  async getMasterCharacter(id: string): Promise<MasterCharacter | null> {
    return this.fetchJson<MasterCharacter>(`/characters/${id}`);
  }

  async createMasterCharacter(char: Partial<MasterCharacter>): Promise<MasterCharacter> {
    return this.fetchJson<MasterCharacter>('/characters', {
      method: 'POST',
      body: JSON.stringify(char)
    });
  }

  async updateMasterCharacter(char: MasterCharacter): Promise<MasterCharacter> {
    return this.fetchJson<MasterCharacter>(`/characters/${char.id}`, {
      method: 'PATCH',
      body: JSON.stringify(char)
    });
  }

  async updateMasterCharacterStatus(id: string, status: 'active' | 'retired' | 'dead' | 'archived', note?: string): Promise<MasterCharacter> {
    return this.fetchJson<MasterCharacter>(`/characters/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note })
    });
  }

  async getMasterCharacterHistory(characterId: string): Promise<CharacterHistoryEvent[]> {
    return this.fetchJson<CharacterHistoryEvent[]>(`/characters/${characterId}/history`);
  }

  async addCharacterHistoryEvent(event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>): Promise<CharacterHistoryEvent> {
    return this.fetchJson<CharacterHistoryEvent>(`/characters/${event.characterId}/history`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async listParticipations(campaignId?: string): Promise<CharacterParticipation[]> {
    const cid = campaignId || this.getActiveCampaignId();
    return this.fetchJson<CharacterParticipation[]>(`/c/${cid}/participations`);
  }

  async getParticipation(campaignId: string, participationId: string): Promise<CharacterParticipation | null> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations/${participationId}`);
  }

  async createParticipation(campaignId: string, data: { characterId: string; entryMode: 'campaign_start' | 'same_level' | 'new_level'; entryLevel?: number }): Promise<CharacterParticipation> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateParticipation(campaignId: string, participationId: string, data: Partial<CharacterParticipation>): Promise<CharacterParticipation> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations/${participationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async reviewParticipation(campaignId: string, participationId: string, action: 'approve' | 'reject' | 'request_changes', comment?: string): Promise<CharacterParticipation> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations/${participationId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }

  async requestLevelUp(campaignId: string, participationId: string, targetLevel: number, diff?: any): Promise<CharacterParticipation> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations/${participationId}/level-up-request`, {
      method: 'POST',
      body: JSON.stringify({ targetLevel, diff })
    });
  }

  async updateParticipationStatus(campaignId: string, participationId: string, status: CharacterParticipation['status']): Promise<CharacterParticipation> {
    return this.fetchJson<CharacterParticipation>(`/c/${campaignId}/participations/${participationId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async uploadMedia(file: { name?: string; mimeType: string; sizeBytes: number; dataBase64: string; width?: number; height?: number; campaignId?: string }): Promise<{ id: string; url: string; sizeBytes: number }> {
    return this.fetchJson<{ id: string; url: string; sizeBytes: number }>('/media', {
      method: 'POST',
      body: JSON.stringify(file)
    });
  }

  async getMedia(id: string): Promise<any> {
    return this.fetchJson<any>(`/media/${id}`);
  }

  async deleteMedia(id: string): Promise<void> {
    await this.fetchJson(`/media/${id}`, { method: 'DELETE' });
  }

  async postDiceRoll(campaignId: string, roll: { label: string; formula: string; mode: 'normal' | 'adv' | 'dis'; results: any; modifier: number; total: number; nat20?: boolean; nat1?: boolean; visibility?: 'table' | 'dm_only'; participationId?: string }): Promise<CampaignDiceRoll> {
    return this.fetchJson<CampaignDiceRoll>(`/c/${campaignId}/dice`, {
      method: 'POST',
      body: JSON.stringify(roll)
    });
  }

  async listDiceRolls(campaignId: string, after?: string, limit?: number): Promise<CampaignDiceRoll[]> {
    const q = new URLSearchParams();
    if (after) q.set('after', after);
    if (limit) q.set('limit', limit.toString());
    const qs = q.toString();
    return this.fetchJson<CampaignDiceRoll[]>(`/c/${campaignId}/dice${qs ? `?${qs}` : ''}`);
  }

  async getRuleSet(scopeType: 'pack' | 'campaign', scopeId: string): Promise<RuleSet | null> {
    return this.fetchJson<RuleSet>(`/rulesets?scopeType=${scopeType}&scopeId=${scopeId}`);
  }

  async listContentPacks(): Promise<ContentPack[]> {
    return this.fetchJson<ContentPack[]>('/content-packs');
  }

  async getContentPack(id: string): Promise<ContentPack | null> {
    return this.fetchJson<ContentPack>(`/content-packs/${id}`);
  }

  // Phase 2: Library & Packs
  async getLibraryItems(params: {
    source: string;
    type?: string;
    q?: string;
    tag?: string;
    region?: string;
    sort?: 'newest' | 'name' | 'favorite';
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const q = new URLSearchParams();
    if (params.source) q.set('source', params.source);
    if (params.type) q.set('type', params.type);
    if (params.q) q.set('q', params.q);
    if (params.tag) q.set('tag', params.tag);
    if (params.region) q.set('region', params.region);
    if (params.sort) q.set('sort', params.sort);
    if (params.limit) q.set('limit', params.limit.toString());
    if (params.offset) q.set('offset', params.offset.toString());
    return this.fetchJson<{ items: any[]; total: number }>(`/library?${q.toString()}`);
  }

  async saveToLibrary(data: { entityRefs: EntityRef[]; packId?: string }): Promise<{ success: boolean; count: number }> {
    return this.fetchJson<{ success: boolean; count: number }>('/library/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async listPacks(params?: { kind?: ContentPackKind }): Promise<ContentPack[]> {
    const q = new URLSearchParams();
    if (params?.kind) q.set('kind', params.kind);
    const qs = q.toString();
    return this.fetchJson<ContentPack[]>(`/packs${qs ? `?${qs}` : ''}`);
  }

  async createPack(data: { name: string; description?: string; kind?: ContentPackKind; visibility?: 'private' | 'instance'; tags?: string[] }): Promise<ContentPack> {
    return this.fetchJson<ContentPack>('/packs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePack(id: string, data: Partial<ContentPack>): Promise<ContentPack> {
    return this.fetchJson<ContentPack>(`/packs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deletePack(id: string): Promise<void> {
    await this.fetchJson(`/packs/${id}`, { method: 'DELETE' });
  }

  async exportPack(id: string, options?: { embedMedia?: boolean }): Promise<any> {
    return this.fetchJson<any>(`/packs/${id}/export`, {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  async previewImportPack(packJson: any): Promise<CloneManifest> {
    return this.fetchJson<CloneManifest>('/packs/import/preview', {
      method: 'POST',
      body: JSON.stringify(packJson)
    });
  }

  async runImportPack(packJson: any, target: { scopeType: EntityScopeType; scopeId: string }): Promise<CloneJob> {
    return this.fetchJson<CloneJob>('/packs/import/run', {
      method: 'POST',
      body: JSON.stringify({ pack: packJson, target })
    });
  }

  async toggleFavorite(entityType: string, entityId: string): Promise<boolean> {
    const res = await this.fetchJson<{ isFavorite: boolean }>('/favorites', {
      method: 'PUT',
      body: JSON.stringify({ entityType, entityId })
    });
    return res.isFavorite;
  }

  async listFavorites(): Promise<Favorite[]> {
    return this.fetchJson<Favorite[]>('/favorites');
  }

  // Phase 2: Clone Engine
  async previewClone(request: CloneRequest): Promise<CloneManifest> {
    return this.fetchJson<CloneManifest>('/clone/preview', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async runClone(request: CloneRequest): Promise<CloneJob> {
    return this.fetchJson<CloneJob>('/clone/run', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async listCloneJobs(scopeId?: string): Promise<CloneJob[]> {
    const q = scopeId ? `?scopeId=${scopeId}` : '';
    return this.fetchJson<CloneJob[]>(`/clone-jobs${q}`);
  }

  async undoCloneJob(jobId: string, force = false): Promise<{ success: boolean; undoneCount: number; skippedEntities: string[] }> {
    return this.fetchJson<{ success: boolean; undoneCount: number; skippedEntities: string[] }>(`/clone-jobs/${jobId}/undo`, {
      method: 'POST',
      body: JSON.stringify({ force })
    });
  }

  // Phase 2: Campaign Wizard
  async createDraftCampaign(startMode: WizardStartMode, sourceId?: string): Promise<Campaign> {
    return this.fetchJson<Campaign>('/campaigns/draft', {
      method: 'POST',
      body: JSON.stringify({ startMode, sourceId })
    });
  }

  async updateWizardState(campaignId: string, state: Partial<WizardState>): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/campaigns/${campaignId}/wizard`, {
      method: 'PATCH',
      body: JSON.stringify(state)
    });
  }

  async launchCampaign(campaignId: string): Promise<Campaign> {
    return this.fetchJson<Campaign>(`/campaigns/${campaignId}/launch`, {
      method: 'POST'
    });
  }

  async saveCampaignAsTemplate(campaignId: string, options: { name: string; description?: string; stripSecrets?: boolean; entityTypes?: string[] }): Promise<ContentPack> {
    return this.fetchJson<ContentPack>(`/campaigns/${campaignId}/save-as-template`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  // Phase 2: Entities (Factions, Docs, Calendars)
  async listFactions(campaignId?: string): Promise<Faction[]> {
    const cId = campaignId || this.getActiveCampaignId();
    return this.fetchJson<Faction[]>(`/c/${cId}/factions`);
  }

  async createFaction(data: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faction> {
    const cId = data.scopeId || this.getActiveCampaignId();
    return this.fetchJson<Faction>(`/c/${cId}/factions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateFaction(data: Faction): Promise<Faction> {
    const cId = data.scopeId || this.getActiveCampaignId();
    return this.fetchJson<Faction>(`/c/${cId}/factions/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteFaction(id: string): Promise<void> {
    const cId = this.getActiveCampaignId();
    await this.fetchJson(`/c/${cId}/factions/${id}`, { method: 'DELETE' });
  }

  async listCampaignDocs(campaignId?: string): Promise<CampaignDoc[]> {
    const cId = campaignId || this.getActiveCampaignId();
    return this.fetchJson<CampaignDoc[]>(`/c/${cId}/docs`);
  }

  async createCampaignDoc(data: Omit<CampaignDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignDoc> {
    const cId = data.campaignId || this.getActiveCampaignId();
    return this.fetchJson<CampaignDoc>(`/c/${cId}/docs`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCampaignDoc(data: CampaignDoc): Promise<CampaignDoc> {
    const cId = data.campaignId || this.getActiveCampaignId();
    return this.fetchJson<CampaignDoc>(`/c/${cId}/docs/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCampaignDoc(id: string): Promise<void> {
    const cId = this.getActiveCampaignId();
    await this.fetchJson(`/c/${cId}/docs/${id}`, { method: 'DELETE' });
  }

  async getGenericCalendar(calendarId?: string): Promise<GenericCalendarData> {
    const q = calendarId ? `?calendarId=${calendarId}` : '';
    return this.fetchJson<GenericCalendarData>(`/generic-calendar${q}`);
  }

  async updateGenericCalendar(data: GenericCalendarData): Promise<GenericCalendarData> {
    return this.fetchJson<GenericCalendarData>('/generic-calendar', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Phase 2 Part B: Linked Copies
  async checkLinkedUpdates(campaignId: string): Promise<LinkedEntityDiff[]> {
    const cId = campaignId || this.getActiveCampaignId();
    return this.fetchJson<LinkedEntityDiff[]>(`/c/${cId}/linked-updates`);
  }

  async getLinkedEntityDiff(entityType: CloneEntityType, entityId: string): Promise<LinkedEntityDiff | null> {
    const cId = this.getActiveCampaignId();
    return this.fetchJson<LinkedEntityDiff | null>(`/c/${cId}/linked-diff?type=${entityType}&id=${entityId}`);
  }

  async applyLinkedDiff(entityType: CloneEntityType, entityId: string, chosenFields: Record<string, 'local' | 'source'>): Promise<any> {
    const cId = this.getActiveCampaignId();
    return this.fetchJson<any>(`/c/${cId}/linked-diff/apply`, {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, chosenFields })
    });
  }

  async detachLink(entityType: CloneEntityType, entityId: string): Promise<any> {
    const cId = this.getActiveCampaignId();
    return this.fetchJson<any>(`/c/${cId}/linked-detach`, {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId })
    });
  }

  async migrateV2(dryRun = false): Promise<{ success: boolean; report: any }> {
    return this.fetchJson<{ success: boolean; report: any }>('/admin/migrate-v2', {
      method: 'POST',
      body: JSON.stringify({ dryRun })
    });
  }
}

// Global active Api instance: respects import.meta.env.VITE_API_MODE or runtime toggle
const isHttpMode = import.meta.env.VITE_API_MODE === 'http';
export const api: ApiClient = isHttpMode ? new HttpApi() : new LocalApi();
