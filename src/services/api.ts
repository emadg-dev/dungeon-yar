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
  ClassTemplate,
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
  EncounterStatus
} from '../types';
import {
  SEED_USERS,
  SEED_CHARACTERS,
  SEED_CHARACTER_NOTES,
  SEED_NPCS,
  SEED_ITEM_LIBRARY,
  SEED_WEAPON_TEMPLATES,
  SEED_CLASS_TEMPLATES,
  SEED_REWARD_PACKAGES,
  SEED_CAMPAIGN_NOTES,
  SEED_ENCOUNTERS,
  SEED_LOCATIONS
} from '../data/seed';
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

  listClassTemplates(): Promise<ClassTemplate[]>;
  createClassTemplate(tmpl: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate>;
  updateClassTemplate(tmpl: ClassTemplate): Promise<ClassTemplate>;
  deleteClassTemplate(id: string): Promise<void>;

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
    this.setItem('campaign_settings', { allowPlayerCreateCharacter: false });

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

  async listClassTemplates(): Promise<ClassTemplate[]> {
    return this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
  }

  async createClassTemplate(tmplData: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate> {
    if (this.currentUser?.role !== 'dm') throw new Error('فقط دانجن مستر مجاز است.');
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    const newClass: ClassTemplate = {
      ...tmplData,
      id: `class-${Date.now()}`,
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
      return await this.fetchJson<{ allowPlayerCreateCharacter: boolean }>('/settings/campaign');
    } catch {
      return { allowPlayerCreateCharacter: false };
    }
  }

  async updateCampaignSettings(settings: { allowPlayerCreateCharacter: boolean }): Promise<{ allowPlayerCreateCharacter: boolean }> {
    return this.fetchJson<{ allowPlayerCreateCharacter: boolean }>('/settings/campaign', {
      method: 'PUT',
      body: JSON.stringify(settings)
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

  async listClassTemplates(): Promise<ClassTemplate[]> {
    return this.fetchJson<ClassTemplate[]>('/class-templates');
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
}

// Global active Api instance: respects import.meta.env.VITE_API_MODE or runtime toggle
const isHttpMode = import.meta.env.VITE_API_MODE === 'http';
export const api: ApiClient = isHttpMode ? new HttpApi() : new LocalApi();
