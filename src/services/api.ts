import {
  User,
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
  ShanshinEncounter
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
  SEED_ENCOUNTERS
} from '../data/seed';
import { INITIAL_CALENDAR, advanceCalendarDays } from '../data/calendar';
import { INITIAL_ENDING_STATE } from '../data/endings';
import { SEED_SHANSHIN_ENCOUNTERS } from '../data/shanshin';

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ApiClient {
  // Auth
  login(email: string, password?: string): Promise<User>;
  register(email: string, password?: string, name?: string, campaignCode?: string): Promise<User>;
  logout(): Promise<void>;
  getMe(): Promise<User | null>;
  switchUser(userId: string): Promise<User>; // Dev switcher
  listUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: 'dm' | 'player'): Promise<User>;

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
// LocalApi Adapter (localStorage-based with full multi-user simulation)
// ----------------------------------------------------------------------
const STORAGE_PREFIX = 'zorvania_';

export class LocalApi implements ApiClient {
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
    // If users not present, seed everything
    const users = this.getItem<User[]>('users', []);
    if (!users || users.length === 0) {
      this.seedDatabase(true);
    }

    // Restore active user session
    const activeUserId = this.getItem<string | null>('active_user_id', null);
    const allUsers = this.getItem<User[]>('users', SEED_USERS);
    if (activeUserId) {
      this.currentUser = allUsers.find(u => u.id === activeUserId) || allUsers[0];
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
    this.setItem('active_user_id', SEED_USERS[0].id);
    this.currentUser = SEED_USERS[0];

    return { success: true, message: 'داده‌های زروانیا با موفقیت در دیتابیس محلی بارگذاری شدند.' };
  }

  // Auth Methods
  async login(email: string): Promise<User> {
    const users = this.getItem<User[]>('users', SEED_USERS);
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Auto-register for preview if not found
      user = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: email.toLowerCase().includes('dm') ? 'dm' : 'player',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
      };
      users.push(user);
      this.setItem('users', users);
    }
    this.currentUser = user;
    this.setItem('active_user_id', user.id);
    return user;
  }

  async register(email: string, _password?: string, name?: string, _campaignCode?: string): Promise<User> {
    const users = this.getItem<User[]>('users', SEED_USERS);
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      this.currentUser = exists;
      this.setItem('active_user_id', exists.id);
      return exists;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: email.toLowerCase().includes('dm') ? 'dm' : 'player',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    };
    users.push(newUser);
    this.setItem('users', users);
    this.currentUser = newUser;
    this.setItem('active_user_id', newUser.id);
    return newUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.setItem('active_user_id', null);
  }

  async getMe(): Promise<User | null> {
    return this.currentUser;
  }

  async switchUser(userId: string): Promise<User> {
    const users = this.getItem<User[]>('users', SEED_USERS);
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error('کاربر مورد نظر یافت نشد.');
    this.currentUser = target;
    this.setItem('active_user_id', target.id);
    return target;
  }

  async listUsers(): Promise<User[]> {
    return this.getItem<User[]>('users', SEED_USERS);
  }

  async updateUserRole(userId: string, role: 'dm' | 'player'): Promise<User> {
    const users = this.getItem<User[]>('users', SEED_USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('کاربر یافت نشد.');
    user.role = role;
    this.setItem('users', users);
    if (this.currentUser?.id === userId) {
      this.currentUser.role = role;
    }
    return user;
  }

  // Characters
  async listCharacters(): Promise<Character[]> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'dm') {
      return all;
    }
    // Player: their characters
    return all.filter(c => c.ownerId === this.currentUser!.id);
  }

  async getCharacter(id: string): Promise<Character | null> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const char = all.find(c => c.id === id);
    if (!char) return null;
    if (this.currentUser?.role === 'dm' || char.ownerId === this.currentUser?.id) {
      return char;
    }
    return null;
  }

  async createCharacter(charData: Partial<Character>): Promise<Character> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const newChar: Character = {
      id: `char-${Date.now()}`,
      ownerId: this.currentUser?.id || 'user-player1',
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
    return newChar;
  }

  async updateCharacter(char: Character): Promise<Character> {
    const all = this.getItem<Character[]>('characters', SEED_CHARACTERS);
    const index = all.findIndex(c => c.id === char.id);
    if (index === -1) throw new Error('شخصیت یافت نشد.');

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
        // Fairy camp rest (شهد بهار)
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

  // Notes
  async listNotes(characterId?: string): Promise<CharacterNote[]> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    if (!this.currentUser) return [];

    let filtered = all;
    if (this.currentUser.role !== 'dm') {
      filtered = filtered.filter(n => n.ownerId === this.currentUser!.id);
    }
    if (characterId) {
      filtered = filtered.filter(n => n.characterId === characterId);
    }
    return filtered;
  }

  async getNote(id: string): Promise<CharacterNote | null> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    return all.find(n => n.id === id) || null;
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
    const updated = { ...note, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('notes', all);
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    const all = this.getItem<CharacterNote[]>('notes', SEED_CHARACTER_NOTES);
    this.setItem('notes', all.filter(n => n.id !== id));
  }

  // NPCs
  async listNpcs(): Promise<NPC[]> {
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    if (this.currentUser?.role === 'dm') {
      return all;
    }
    // Player only gets revealed NPCs
    return all.filter(npc => npc.isRevealed);
  }

  async getNpc(id: string): Promise<NPC | null> {
    const all = await this.listNpcs();
    return all.find(n => n.id === id) || null;
  }

  async createNpc(npcData: Omit<NPC, 'id' | 'updatedAt'>): Promise<NPC> {
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
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    const index = all.findIndex(n => n.id === npc.id);
    if (index === -1) throw new Error('شخصیت غیربازیکن یافت نشد.');
    const updated = { ...npc, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('npcs', all);
    return updated;
  }

  async deleteNpc(id: string): Promise<void> {
    const all = this.getItem<NPC[]>('npcs', SEED_NPCS);
    this.setItem('npcs', all.filter(n => n.id !== id));
  }

  // Items
  async listItems(): Promise<ItemLibraryEntry[]> {
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    if (this.currentUser?.role === 'dm') {
      return all;
    }
    return all.filter(item => item.isRevealed);
  }

  async createItem(itemData: Omit<ItemLibraryEntry, 'id' | 'updatedAt'>): Promise<ItemLibraryEntry> {
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
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    const index = all.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('آیتم یافت نشد.');
    const updated = { ...item, updatedAt: new Date().toISOString() };
    all[index] = updated;
    this.setItem('items', all);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const all = this.getItem<ItemLibraryEntry[]>('items', SEED_ITEM_LIBRARY);
    this.setItem('items', all.filter(i => i.id !== id));
  }

  async giveItemToPlayer(characterId: string, item: ItemLibraryEntry): Promise<Character> {
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

    // If it's a weapon or has weaponData, also automatically create a corresponding Weapon on the Combat tab!
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

  // Templates
  async listWeaponTemplates(): Promise<WeaponTemplate[]> {
    return this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
  }

  async createWeaponTemplate(tmplData: Omit<WeaponTemplate, 'id'>): Promise<WeaponTemplate> {
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    const newTmpl: WeaponTemplate = { ...tmplData, id: `wpn-tmpl-${Date.now()}` };
    all.push(newTmpl);
    this.setItem('weapon_templates', all);
    return newTmpl;
  }

  async updateWeaponTemplate(tmpl: WeaponTemplate): Promise<WeaponTemplate> {
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    const idx = all.findIndex(w => w.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی سلاح یافت نشد.');
    all[idx] = tmpl;
    this.setItem('weapon_templates', all);
    return tmpl;
  }

  async deleteWeaponTemplate(id: string): Promise<void> {
    const all = this.getItem<WeaponTemplate[]>('weapon_templates', SEED_WEAPON_TEMPLATES);
    this.setItem('weapon_templates', all.filter(w => w.id !== id));
  }

  async listClassTemplates(): Promise<ClassTemplate[]> {
    return this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
  }

  async createClassTemplate(tmplData: Omit<ClassTemplate, 'id' | 'updatedAt'>): Promise<ClassTemplate> {
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
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    const idx = all.findIndex(c => c.id === tmpl.id);
    if (idx === -1) throw new Error('الگوی کلاس یافت نشد.');
    all[idx] = { ...tmpl, updatedAt: new Date().toISOString() };
    this.setItem('class_templates', all);
    return all[idx];
  }

  async deleteClassTemplate(id: string): Promise<void> {
    const all = this.getItem<ClassTemplate[]>('class_templates', SEED_CLASS_TEMPLATES);
    this.setItem('class_templates', all.filter(c => c.id !== id));
  }

  // Rewards
  async listRewards(): Promise<RewardPackage[]> {
    return this.getItem<RewardPackage[]>('rewards', SEED_REWARD_PACKAGES);
  }

  async createReward(rewardData: Omit<RewardPackage, 'id' | 'createdAt'>): Promise<RewardPackage> {
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

  // Campaign Notes
  async listCampaignNotes(): Promise<CampaignNote[]> {
    if (this.currentUser?.role !== 'dm') return [];
    return this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
  }

  async createCampaignNote(noteData: Omit<CampaignNote, 'id' | 'updatedAt'>): Promise<CampaignNote> {
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
    const all = this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
    const idx = all.findIndex(c => c.id === note.id);
    if (idx === -1) throw new Error('یادداشت کمپین یافت نشد.');
    all[idx] = { ...note, updatedAt: new Date().toISOString() };
    this.setItem('campaign_notes', all);
    return all[idx];
  }

  async deleteCampaignNote(id: string): Promise<void> {
    const all = this.getItem<CampaignNote[]>('campaign_notes', SEED_CAMPAIGN_NOTES);
    this.setItem('campaign_notes', all.filter(c => c.id !== id));
  }

  // Encounters
  async listEncounters(): Promise<Encounter[]> {
    return this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
  }

  async getEncounter(id: string): Promise<Encounter | null> {
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    return all.find(e => e.id === id) || null;
  }

  async createEncounter(encData: Omit<Encounter, 'id' | 'updatedAt'>): Promise<Encounter> {
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
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    const idx = all.findIndex(e => e.id === enc.id);
    if (idx === -1) throw new Error('مواجهه یافت نشد.');
    all[idx] = { ...enc, updatedAt: new Date().toISOString() };
    this.setItem('encounters', all);
    return all[idx];
  }

  async deleteEncounter(id: string): Promise<void> {
    const all = this.getItem<Encounter[]>('encounters', SEED_ENCOUNTERS);
    this.setItem('encounters', all.filter(e => e.id !== id));
  }

  // Recharges & Group Management
  async resetGroupRecharges(type: 'session' | 'season'): Promise<Character[]> {
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

  // Calendar
  async getCalendar(): Promise<WorldCalendar> {
    return this.getItem<WorldCalendar>('calendar', INITIAL_CALENDAR);
  }

  async updateCalendar(cal: Partial<WorldCalendar>): Promise<WorldCalendar> {
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
    const current = await this.getCalendar();
    const next = advanceCalendarDays(current, days);
    this.setItem('calendar', next);
    return next;
  }

  // Ending Tracker
  async getEndingState(): Promise<CampaignEndingState> {
    return this.getItem<CampaignEndingState>('endings', INITIAL_ENDING_STATE);
  }

  async updateEndingState(state: Partial<CampaignEndingState>): Promise<CampaignEndingState> {
    const current = await this.getEndingState();
    const updated: CampaignEndingState = {
      ...current,
      ...state,
      updatedAt: new Date().toISOString()
    };
    this.setItem('endings', updated);
    return updated;
  }

  // Shanshin Encounters
  async listShanshinEncounters(): Promise<ShanshinEncounter[]> {
    return this.getItem<ShanshinEncounter[]>('shanshin_encounters', SEED_SHANSHIN_ENCOUNTERS);
  }

  async updateShanshinEncounter(enc: ShanshinEncounter): Promise<ShanshinEncounter> {
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
}

// ----------------------------------------------------------------------
// HttpApi Adapter (Calls REST endpoints under /api/* with credentials: 'include')
// ----------------------------------------------------------------------
export class HttpApi implements ApiClient {
  private baseUrl = '/api';

  private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      let errText = 'خطا در ارتباط با سرور';
      try {
        const body = await res.json();
        errText = body.error || body.message || errText;
      } catch {
        errText = `HTTP Error ${res.status}`;
      }
      throw new Error(errText);
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

  async register(email: string, password?: string, name?: string, campaignCode?: string): Promise<User> {
    const res = await this.fetchJson<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, campaignCode })
    });
    return res.user;
  }

  async logout(): Promise<void> {
    await this.fetchJson('/auth/logout', { method: 'POST' });
  }

  async getMe(): Promise<User | null> {
    try {
      const res = await this.fetchJson<{ user: User }>('/auth/me');
      return res.user;
    } catch {
      return null;
    }
  }

  async switchUser(userId: string): Promise<User> {
    // In HTTP mode, dev switch can call a debug endpoint or re-login
    const res = await this.fetchJson<{ user: User }>('/admin/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return res.user;
  }

  async listUsers(): Promise<User[]> {
    return this.fetchJson<User[]>('/admin/users');
  }

  async updateUserRole(userId: string, role: 'dm' | 'player'): Promise<User> {
    return this.fetchJson<User>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

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

  async seedDatabase(force?: boolean): Promise<{ success: boolean; message: string }> {
    return this.fetchJson<{ success: boolean; message: string }>('/admin/seed', {
      method: 'POST',
      body: JSON.stringify({ force })
    });
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
}

// Global active Api instance: respects import.meta.env.VITE_API_MODE or runtime toggle
const isHttpMode = import.meta.env.VITE_API_MODE === 'http';
export const api: ApiClient = isHttpMode ? new HttpApi() : new LocalApi();
