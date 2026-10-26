export type Role = 'dm' | 'player';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  role: Role;
  status?: UserStatus;
  mustChangePassword?: boolean;
  createdAt?: number;
  lastLoginAt?: number | null;
  activeCharacterId?: string | null;
  avatarUrl?: string;
  activeSessionCount?: number;
  characterNames?: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  absoluteExpiresAt?: number;
  userAgent?: string;
  isCurrent?: boolean;
  ipHash?: string;
}

export interface Invite {
  id: string;
  code?: string;
  label?: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  maxUses: number;
  usedCount: number;
  assignCharacterId?: string | null;
  revokedAt?: number | null;
  inviteLink?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  action: string;
  targetId?: string | null;
  meta?: any;
  createdAt: number;
}

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScoreMap {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SkillDefinition {
  id: string;
  nameFa: string;
  nameEn: string;
  ability: AbilityName;
  proficient: boolean;
  expertise: boolean;
  custom?: boolean;
}

export type RechargeType = 'none' | 'short' | 'long' | 'session' | 'season' | 'day';

export interface SpecialAbilityDef {
  name: string;
  description: string;
  usesPerRest: number;
  restType: RechargeType;
}

export interface WeaponTemplate {
  id: string;
  name: string;
  damageDice: string;
  damageType: string;
  range: string;
  properties: string;
  kind: 'special' | 'showy';
  specialAbility?: SpecialAbilityDef;
  description: string;
  secretNotes: string;
}

export interface Weapon {
  id: string;
  templateId?: string;
  name: string;
  damageDice: string;
  damageType: string;
  range: string;
  properties: string;
  kind: 'special' | 'showy';
  isSpecial?: boolean;
  isShowy?: boolean;
  specialAbility?: SpecialAbilityDef;
  abilityName?: string;
  abilityDesc?: string;
  abilityMaxUses?: number;
  abilityUsed?: number;
  abilityReset?: RechargeType;
}

export interface FeatureTemplate {
  id: string;
  name: string;
  description: string;
  source: string;
  usageType: RechargeType;
  maxUses?: number;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  source: string;
  usageType: RechargeType;
  maxUses?: number;
  usedCount: number;
}

export interface AcFormula {
  base: number;
  abilityMods: AbilityName[];
  unarmored: boolean; // Hamoun and Mist-Familiar lose it if armor/shield equipped
  note?: string;
}

export interface SpellcastingDef {
  ability: AbilityName;
  saveDCFormula: string; // e.g. "8 + prof + mod"
  slotsByLevel: Record<number, number[]>; // 1..20 -> array of slots by spell level
  cantripsByLevel?: Record<number, number>;
  spellList?: { level: number; spells: string[] }[];
}

export interface ClassSubclass {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  featuresByLevel: Record<number, { name: string; description: string; usage?: RechargeType }[]>;
}

export interface ClassResourceDef {
  id: string;
  name: string;
  description: string;
  resetType: RechargeType;
  maxUsesFormula?: string;
  maxUsesByLevel?: Record<number, number>;
  diceByLevel?: Record<number, string>; // e.g. 1d4, 1d6 or 2d8..6d8
}

export interface ClassFeatureByLevel {
  name: string;
  description: string;
  usage?: RechargeType;
}

export interface ClassTemplate {
  id: string;
  name: string;
  title?: string;
  description?: string;
  hitDie: string | number;
  saves?: string[];
  savingThrowProficiencies?: AbilityName[];
  skillChoices: { count: number; options: string[] };
  weaponProf?: string;
  weaponProficiencies?: string[];
  armorProf?: string;
  armorProficiencies?: string[];
  startingEquipment: string | string[];
  acFormula: string | AcFormula;
  spellcasting?: any;
  extraAttackLevel?: number | null;
  asiLevels: number[];
  fixedHpByLevel: number[] | Record<number, number>;
  hpFormula?: string;
  baseAbilities?: { STR: number; DEX: number; CON: number; WIS: number; INT: number; CHA: number };
  baseAbilityScores?: AbilityScoreMap;
  companion?: { name: string; fromLevel: number; ac?: number | null; hp: string };
  resources?: any[];
  classResources?: ClassResourceDef[];
  subclasses: any[];
  notes?: string;
  features?: Record<number | string, string>;
  featuresByLevel?: Record<number, ClassFeatureByLevel[]>;
  martialArtsDie?: Record<string, string>;
  startingFeatures?: FeatureTemplate[];
  level2Options?: string[];
  starterWeaponOptions?: string[];
  updatedAt?: string;
}

export type ItemCategory = 
  | 'weapon' 
  | 'armor' 
  | 'consumable' 
  | 'quest' 
  | 'treasure' 
  | 'artifact' 
  | 'loot'
  | 'misc';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description: string;
  category: ItemCategory;
  equipped?: boolean;
  isEquipped?: boolean;
  isQuestItem?: boolean;
  isQuest?: boolean;
  isArtifact?: boolean;
  isNewBadge?: boolean;
  isNew?: boolean;
  mechanicalEffect?: string;
  secretNotes?: string;
  whoItsFor?: string;
  weaponData?: WeaponTemplate;
  resetType?: RechargeType;
  maxUses?: number;
  usedCount?: number;
}

export interface Currencies {
  gold: number;
  silver: number;
  copper: number;
  customCurrencyName?: string;
  customCurrencyAmount?: number;
}

export interface TrackedResource {
  id: string;
  name: string;
  current: number;
  max: number;
  resetType?: RechargeType;
  diceNote?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
}

export type NoteCategory = 'journal' | 'npcs' | 'locations' | 'quests' | 'clues';

export interface CharacterNote {
  id: string;
  characterId: string;
  ownerId: string;
  title: string;
  body: string;
  sessionTag?: string;
  category: NoteCategory;
  pinned: boolean;
  sharedWithDm: boolean;
  updatedAt: string;
}

export interface RestLogEntry {
  id: string;
  date: string;
  type: 'short' | 'long' | 'special';
  notes: string;
}

export interface Companion {
  id: string;
  name: string;
  type: 'construct' | 'forest' | 'custom';
  portraitUrl?: string;
  ac: number;
  hp: {
    max: number;
    current: number;
  };
  attack: {
    name: string;
    toHit: string;
    damage: string;
    description?: string;
  };
  description: string;
}

export interface Character {
  id: string;
  ownerId: string;
  name: string;
  race: string;
  className: string;
  classTemplateId?: string;
  subclassName?: string;
  level: number;
  background: string;
  appearance: string;
  personality: string;
  portraitUrl: string;
  abilities: AbilityScoreMap;
  savingThrows: Record<AbilityName, boolean>;
  skills: SkillDefinition[];
  hp: {
    max: number;
    current: number;
    temp: number;
  };
  ac: number;
  acManualOverride?: number | null;
  speed: number;
  initiativeBonus: number;
  hitDice: {
    total?: string;
    spent?: number;
    current?: number;
    max?: number;
    die?: string;
  };
  exhaustion: number; // 0 to 6
  skillPoints: number; // Zorvania mechanic
  weapons: Weapon[];
  features: Feature[];
  spells: Spell[];
  inventory: InventoryItem[];
  currencies: Currencies;
  rations: number;
  lanternOil: number;
  customResources: TrackedResource[];
  classResourceTrackers?: Record<string, { current: number; max: number; currentDice?: string }>;
  companions?: Companion[];
  restLog: RestLogEntry[];
  revision: number;
  updatedAt: string;
}

export type NpcType = 
  | 'boss' 
  | 'guardian'
  | 'elite' 
  | 'minion' 
  | 'hazard'
  | 'neutral' 
  | 'ally' 
  | 'merchant' 
  | 'quest-giver' 
  | 'guardian-construct' 
  | 'other';

export type NpcKind = 'Minion' | 'Goon' | 'Boss';

export interface NpcAttack {
  id: string;
  name: string;
  toHit: string;
  damage: string;
  dc?: string;
  notes?: string;
}

export interface NpcSpecialAbility {
  id: string;
  name: string;
  trigger?: string;
  description: string;
}

export interface NpcActionItem {
  name: string;
  description: string;
  attackBonus?: number;
  damageDice?: string;
  damageType?: string;
  isMultiattack?: boolean;
}

export interface NpcTraitItem {
  name: string;
  description: string;
}

export interface NpcLegendaryActionItem {
  name: string;
  description: string;
  cost: number;
}

export interface NpcRechargeItem {
  name: string;
  description: string;
  rechargeMin: number;
  isReady: boolean;
}

export interface NpcSpellcastingBlock {
  ability: string;
  saveDC: number;
  attackBonus: number;
  spells: { level: number; list: string[] }[];
}

export interface NPC {
  id: string;
  name: string;
  type: NpcType;
  kind?: NpcKind;
  cr?: string;
  xp?: number;
  hpFormula?: string;
  speedMeters?: number;
  speedFeet?: number;
  region?: string;
  regionTag?: string;
  senses?: string;
  languages?: string;
  skillsList?: string;
  savesList?: string;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  traitsList?: NpcTraitItem[];
  actionsList?: NpcActionItem[];
  bonusActions?: NpcTraitItem[];
  reactionsList?: NpcTraitItem[];
  legendaryResistances?: { max: number; used: number };
  legendaryActions?: { pointsMax: number; pointsUsed: number; actions: NpcLegendaryActionItem[] };
  rechargeAbilities?: NpcRechargeItem[];
  spellcastingBlock?: NpcSpellcastingBlock;
  groupSizeHint?: string;
  portraitUrl: string;
  description: string;
  locationTag: string;
  sessionTag: string;
  ac: string;
  hp: {
    current: number;
    max: number;
  };
  speed: string;
  abilities: AbilityScoreMap;
  savingThrows: string;
  resistances: string;
  vulnerabilities: string;
  immunities: string;
  attacks: NpcAttack[];
  specialAbilities: NpcSpecialAbility[];
  tacticsTips: string;
  lootDrops: string;
  dialogueLines: string[];
  isRevealed: boolean;
  notes?: string;
  updatedAt: string;
}

export type ItemLibraryCategory = 
  | 'artifact' 
  | 'loot' 
  | 'consumable' 
  | 'weapon' 
  | 'quest' 
  | 'treasure';

export interface ItemLibraryEntry {
  id: string;
  name: string;
  category: ItemLibraryCategory;
  rarity: 'معمولی' | 'کمیاب' | 'بسیار کمیاب' | 'افسانه‌ای' | 'باستانی و ممنوعه';
  description: string;
  mechanicalEffect: string;
  secretNotes: string;
  whoItsFor: string;
  isRevealed: boolean;
  region?: string;
  resetType?: RechargeType;
  maxUses?: number;
  weaponData?: WeaponTemplate;
  updatedAt: string;
}

export interface RewardPackage {
  id: string;
  title: string;
  description: string;
  gold: number;
  silver: number;
  skillPoints: number;
  items: InventoryItem[];
  createdAt: string;
}

export type CampaignNoteCategory = 'session' | 'plot' | 'secret' | 'lore';

export interface CampaignNote {
  id: string;
  title: string;
  sessionNumber?: string;
  inWorldDate?: string;
  category: CampaignNoteCategory;
  content: string;
  tags: string[];
  updatedAt: string;
}

/* Location and World Points of Interest */
export type LocationRegion = 'ورنا' | 'کویر خاموش' | 'سپیدارون' | 'مهستان' | 'شانشین' | 'مشترک' | string;

export interface LocationEntry {
  id: string;
  name: string;
  region: LocationRegion;
  description: string;
  imageUrl?: string;
  dmNotes?: string;
  revealed: boolean;
  parentId?: string | null;
  createdAt: number;
  updatedAt: number;
}

/* Live Encounter Types */
export type EncounterStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface EncounterSettings {
  showExactHp: boolean;
  showAc: boolean;
  showConditions: boolean;
  showDefeated: boolean;
  playerInitiativeRolls: boolean;
}

export type ParticipantKind = 'monster' | 'npc' | 'character';
export type ParticipantVisibility = 'hidden' | 'announced' | 'revealed';
export type ParticipantStatus = 'active' | 'defeated' | 'fled';
export type InitiativeStatus = 'none' | 'pending' | 'set';
export type QualitativeHealth = 'سالم' | 'زخمی' | 'نیمه‌جان' | 'رو به مرگ';

export interface EncounterParticipant {
  id: string;
  encounterId: string;
  kind: ParticipantKind;
  npcTemplateId?: string | null;
  characterId?: string | null;
  instanceName: string;
  displayNameForPlayers?: string | null;
  maxHp: number;
  hp: number;
  ac: string;
  acState?: string | null;
  conditions: string[];
  initiative: number | null;
  initiativeStatus: InitiativeStatus;
  visibility: ParticipantVisibility;
  status: ParticipantStatus;
  phase?: string | null;
  groupId?: string | null;
  sortIndex: number;
  addedAtRound: number;
  revision: number;
  notes?: string;
  createdAt: number;
}

export interface PlayerEncounterParticipant {
  id: string;
  kind: ParticipantKind;
  displayNameForPlayers: string;
  healthStatus: QualitativeHealth;
  status: ParticipantStatus;
  conditions?: string[];
  exactHp?: { current: number; max: number };
  exactAc?: string;
  initiative: number | null;
  initiativeStatus: InitiativeStatus;
  phase?: string | null;
  sortIndex: number;
  characterId?: string | null;
  isAlly?: boolean;
}

export type EncounterEventType = 
  | 'start' 
  | 'round' 
  | 'turn' 
  | 'add' 
  | 'remove' 
  | 'defeat' 
  | 'reveal' 
  | 'damage' 
  | 'heal' 
  | 'condition' 
  | 'end' 
  | 'note';

export interface EncounterEvent {
  id: string;
  encounterId: string;
  round: number;
  type: EncounterEventType;
  text: string;
  visibleToPlayers: boolean;
  createdAt: number;
}

export interface LiveEncounter {
  id: string;
  name: string;
  locationId?: string | null;
  location?: LocationEntry | null;
  status: EncounterStatus;
  round: number;
  currentParticipantId?: string | null;
  sessionTag?: string;
  settings: EncounterSettings;
  version: number;
  dmNotes?: string;
  startedAt?: number | null;
  endedAt?: number | null;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  participants: EncounterParticipant[];
  events: EncounterEvent[];
}

export interface PlayerEncounterView {
  id: string;
  name: string;
  locationId?: string | null;
  location?: {
    id: string;
    name: string;
    region: string;
    description?: string;
    imageUrl?: string;
  } | null;
  status: EncounterStatus;
  round: number;
  currentParticipantId?: string | null;
  settings: EncounterSettings;
  version: number;
  participants: PlayerEncounterParticipant[];
  events: EncounterEvent[];
}

export interface LiveSyncStatus {
  activeEncounterId: string | null;
  version: number;
  serverTime: number;
}

// Backward compatibility types
export interface EncounterCombatant {
  id: string;
  name: string;
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  ac: string;
  isNpc: boolean;
  npcId?: string;
  characterId?: string;
  conditions: string[];
  notes: string;
  isMinionGroup?: boolean;
  minionCount?: number;
  legendaryActionPoints?: { max: number; used: number };
}

export interface Encounter {
  id: string;
  name: string;
  sessionTag?: string;
  round?: number;
  activeCombatantIndex?: number;
  combatants?: EncounterCombatant[];
  notes?: string;
  updatedAt?: string;
  locationId?: string | null;
  status?: EncounterStatus;
  settings?: EncounterSettings;
  version?: number;
  participants?: EncounterParticipant[];
  events?: EncounterEvent[];
}

export interface DiceRollResult {
  id: string;
  timestamp: string;
  label: string;
  diceCount: number;
  diceSides: number;
  rolls: number[];
  modifier: number;
  advantage?: 'adv' | 'dis';
  total: number;
  isCritical?: boolean;
  isFumble?: boolean;
}

export interface CampaignRule {
  id: string;
  title: string;
  category: 'resources' | 'rest' | 'vision' | 'progression';
  summary: string;
  details: string;
  description?: string;
}

/* Zorvania In-World Calendar */
export interface MonthDef {
  id: number;
  name: string;
  season: 'بهار' | 'تابستان' | 'پاییز' | 'زمستان';
  festival: string;
}

export interface OffDayDef {
  id: number;
  name: string;
  folkBelief: string;
}

export interface WorldCalendar {
  id: string;
  year: number; // 1500
  month: number; // 1 to 12, or 13 for off-days
  day: number; // 1 to 30, or 1 to 5 if month === 13
  isOffDay: boolean;
  offDayIndex?: number;
  currentFestival?: string;
  updatedAt: string;
}

/* Ending Tracker Models */
export interface TruthSources {
  fairies: boolean; // پریان
  divs: boolean; // دیوان
  kandavaran: boolean; // کنداوران
  mehzedegan: boolean; // مهزادگان
  mobads: boolean; // موبدان
  documents: boolean; // اسناد
}

export type AryamanDerivedState = 'returned' | 'hesitant' | 'locked';

export interface AryamanTriggers {
  shahbazFriendOrHigher: boolean; // شهباز "دوست" یا بالاتر
  farrehMarkRevealed: boolean; // نشان فره آشکار در برابر او
  divanzadPresent: boolean; // حضور دیوانزاد
  emptyCrownOnFarrehDar: boolean; // تاج خالی بر سر فره‌دار
  motherEmberMemory: boolean; // خاطره‌ی اخگر مادر
}

export interface ChaosTracker {
  brokenKeySeals: number; // +1 each, max 3
  mainAlliesDead: number; // +1 each, max 3
  ordersTurnedEnemy: number; // +1 each, max 3
  unrestrainedThreshold: boolean; // +1 for unrestrained سنگ‌خواب or وردان
  reconciledOrdersOrSavedAllies: number; // -1 each
}

export interface CampaignEndingState {
  id: string;
  truthSources: TruthSources;
  aryamanTriggers: AryamanTriggers;
  embersPercentage: number;
  motherEmberObtained: boolean;
  emberSources: { name: string; percentage: number; collected: boolean }[];
  chaos: ChaosTracker;
  secondHalfSealObtained: boolean;
  secondHalfSealMethod: 'given' | 'defeat' | 'stolen_by_shahbaz' | 'none';
  notes?: string;
  updatedAt: string;
}

/* Shanshin Random Encounters */
export interface ShanshinEncounter {
  id: number; // 1 to 8
  title: string;
  description: string;
  mechanicsNote: string;
  dmAdvice: string;
}
