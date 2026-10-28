export type Role = 'dm' | 'player';
export type PlatformRole = 'admin' | 'user';
export type CampaignRole = 'owner' | 'co_dm' | 'player' | 'spectator';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  role: Role;
  platformRole?: PlatformRole;
  status?: UserStatus;
  mustChangePassword?: boolean;
  createdAt?: number;
  lastLoginAt?: number | null;
  activeCharacterId?: string | null;
  avatarUrl?: string;
  avatarMediaId?: string | null;
  activeSessionCount?: number;
  characterNames?: string[];
}

export interface CampaignSettings {
  units: 'feet' | 'meters';
  startingLevel: number;
  maxEntryLevel: number;
  abilityScoreMethods: ('standard_array' | 'point_buy' | 'roll' | 'class_base' | 'manual')[];
  levelingMode?: 'milestone' | 'xp';
  xpThresholds?: Record<number, number>;
  hpMode?: 'fixed' | 'roll' | 'manual';
  conAdjustFixedTable?: boolean;
  allowCustomLineage?: boolean;
  sheetLock?: 'locked_core' | 'free';
  approval: {
    onCreate: boolean;
    onLevelUp: boolean;
  };
  backstoryVisibility: 'dm_only' | 'party';
  diceVisibility: 'table' | 'dm_only';
  allowPlayerRollPrivate: boolean;
  restRules?: {
    shortRestHours?: number;
    longRestHours?: number;
    grittyRealism?: boolean;
  };
  exhaustion?: {
    levels?: number;
    customRules?: string;
  };
  rations?: {
    trackRations?: boolean;
    trackWater?: boolean;
  };
  houseRules?: string;
  allowPlayerCreateCharacter: boolean;
  encounterDefaults: {
    showExactHp: boolean;
    showAc: boolean;
    showConditions: boolean;
    showDefeated: boolean;
    playerInitiativeRolls: boolean;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  coverMediaId?: string | null;
  coverUrl?: string;
  tone?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  ownerId: string;
  ownerName?: string;
  sourcePackId?: string | null;
  settings: CampaignSettings;
  wizardState?: WizardState | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  myRole?: CampaignRole;
  memberCount?: number;
  characterCount?: number;
  activeEncounter?: boolean;
}

export interface CampaignMember {
  campaignId: string;
  userId: string;
  role: CampaignRole;
  status: 'invited' | 'active' | 'left' | 'removed';
  joinedAt: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  characterId?: string;
  characterName?: string;
  participationId?: string;
}

export interface CampaignInvite {
  id: string;
  campaignId?: string | null;
  codeHash?: string;
  code?: string;
  role: CampaignRole;
  label?: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  maxUses: number;
  usedCount: number;
  assignParticipationId?: string | null;
  revokedAt?: number | null;
  inviteLink?: string;
}

export type ContentPackKind = 'library' | 'pack' | 'campaign_template';

export interface ContentPack {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  version: string;
  visibility: 'private' | 'instance';
  kind: ContentPackKind;
  tags?: string[];
  isDefaultLibrary?: boolean;
  createdAt: number;
  updatedAt: number;
  entityCounts?: {
    classes: number;
    weapons: number;
    items: number;
    npcs: number;
    locations: number;
    encounters?: number;
    factions?: number;
  };
}

export interface RuleSet {
  id: string;
  scopeType: 'pack' | 'campaign';
  scopeId: string;
  abilities: { key: string; labelFa: string; short: string }[];
  skills: { key: string; nameFa: string; nameEn?: string; ability: string; custom?: boolean }[];
  saves: { key: string; labelFa: string }[];
  currencies: { key: string; labelFa: string; conversionRate?: number }[];
  resources: { key: string; labelFa: string; defaultMax?: number; resetOn?: string }[];
  conditions: { key: string; labelFa: string; descriptionFa?: string }[];
  damageTypes: { key: string; labelFa: string }[];
  proficiencyBonusTable: Record<number, number>;
}

export interface BackstorySection {
  id: string;
  title: string;
  text: string;
  shareWithParty: boolean;
}

export interface MasterBackstory {
  summary: string;
  origin: string;
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  goals: string;
  relationships: {
    name: string;
    npcRef?: string;
    note: string;
  }[];
  timeline: {
    label: string;
    text: string;
  }[];
  sections: BackstorySection[];
  dmOnly: {
    secrets: string;
    hooks: string;
  };
}

export interface MasterCharacter {
  id: string;
  ownerId: string;
  name: string;
  portraitMediaId?: string | null;
  portraitUrl?: string;
  race: string;
  appearance: string;
  backstory: MasterBackstory;
  status: 'active' | 'retired' | 'dead' | 'archived';
  statusNote?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  participations?: CharacterParticipation[];
  history?: CharacterHistoryEvent[];
}

export type AbilityMethod = 'standard_array' | 'point_buy' | 'roll' | 'class_base' | 'manual';
export type HpMode = 'fixed' | 'roll' | 'manual';

export interface CharacterBuild {
  abilityMethod: AbilityMethod;
  rolls?: {
    dice: number[][]; // 6 groups of 4d6
    scores: number[]; // 6 scores
    assigned?: Record<string, number>; // ability key -> score
  };
  pointBuy?: {
    scores: Record<string, number>;
    cost?: number;
  };
  lineageId?: string | null;
  sublineageName?: string | null;
  lineageAbilityChoices?: Record<string, number>;
  backgroundId?: string | null;
  backgroundCustomFeature?: string | null;
  skillChoices: {
    fromClass?: string[];
    fromBackground?: string[];
    fromLineage?: string[];
    all?: string[];
  };
  equipmentChoices: {
    groups?: Record<string, string>;
    starterWeaponId?: string | null;
    starterWeaponChoice?: 'standard' | 'special_showy';
    items?: string[];
  };
  subclassId?: string | null;
  asiHistory?: Array<{
    level: number;
    type: 'asi' | 'feat';
    abilities?: Record<string, number>;
    featName?: string;
  }>;
  hpHistory?: Array<{
    level: number;
    hpIncrease: number;
    mode: 'fixed' | 'roll' | 'manual';
    roll?: number;
  }>;
  spellChoices?: {
    cantrips?: string[];
    spellsKnown?: string[];
  };
  wizardStep?: number;
  step?: number;
  masterData?: Partial<MasterCharacter>;
  className?: string;
  [key: string]: any;
}

export interface ParticipationSnapshot {
  id: string;
  participationId: string;
  label: string;
  state: any;
  build: CharacterBuild;
  level: number;
  createdBy: string;
  createdAt: number;
}

export interface CharacterParticipation {
  id: string;
  characterId: string;
  campaignId: string;
  campaignName?: string;
  status: 'draft' | 'pending_approval' | 'active' | 'rejected' | 'retired' | 'dead';
  classId?: string | null;
  className: string;
  subclassName?: string;
  level: number;
  xp: number;
  abilityScores: AbilityScoreMap;
  savingThrows?: Record<AbilityName, boolean>;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  hitDice: {
    current: number;
    max: number;
    die: string;
  };
  acOverride?: number | null;
  speedOverride?: number | null;
  deathSaves: {
    successes: number;
    failures: number;
  };
  conditions: string[];
  inventory: InventoryItem[];
  weapons: Weapon[];
  currency: Currencies;
  customResources: TrackedResource[];
  spellsKnownPrepared?: any;
  spellSlots?: any;
  features: Feature[];
  notes: string;
  dmNotes?: string;
  build?: CharacterBuild | null;
  sheetLocked?: boolean;
  levelUpAvailable?: boolean;
  joinedAt: number;
  updatedAt: number;
  pendingLevelUp?: {
    targetLevel: number;
    diff: any;
    requestedAt: number;
  } | null;
  pendingChange?: {
    type?: 'level_up' | 'sheet_change';
    fromLevel?: number;
    toLevel?: number;
    diff?: any;
    payload?: any;
    requestedAt?: number;
    field?: string;
    proposedValue?: any;
    reason?: string;
  } | null;
  characterName?: string;
  characterRace?: string;
  characterPortraitUrl?: string;
  characterAppearance?: string;
  characterBackstory?: MasterBackstory;
}

export interface XpAward {
  id: string;
  campaignId: string;
  participationId?: string | null;
  amount: number;
  reason?: string;
  createdBy: string;
  createdAt: number;
}

export interface SheetChangeRequest {
  id: string;
  campaignId: string;
  participationId: string;
  userId: string;
  requestedChanges: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  createdAt: number;
  updatedAt: number;
  characterName?: string;
  playerName?: string;
}

export interface LevelUpPayload {
  hpMode: 'fixed' | 'roll' | 'manual';
  hpRoll?: number;
  asiMode?: 'plus2' | 'plus1plus1' | 'feat';
  asiChoices?: {
    stat1?: AbilityName;
    stat2?: AbilityName;
    featName?: string;
  };
  chosenSubclass?: string;
  subclassName?: string;
  newSpells?: {
    cantrips?: string[];
    spells?: string[];
  };
  newCompanionName?: string;
}

export interface LevelUpDiff {
  fromLevel: number;
  toLevel: number;
  hpGain: number;
  newMaxHp: number;
  oldMaxHp: number;
  hpBreakdown: string; // e.g. "تاس (۶) + بنیه (+۲) = +۸"
  abilityChanges?: Partial<Record<AbilityName, { before: number; after: number }>>;
  newFeatures: Array<{ name: string; description: string }>;
  unlockedSubclass?: string;
  newSpells?: { cantrips: string[]; spells: string[] };
  newCompanion?: { name: string; type?: string };
  newProfBonus: number;
  oldProfBonus: number;
}

export interface CharacterHistoryEvent {
  id: string;
  characterId: string;
  campaignId?: string | null;
  campaignName?: string;
  eventType: 'joined' | 'level_up' | 'death' | 'major_deed' | 'retired' | 'custom';
  payload: {
    title?: string;
    description?: string;
    level?: number;
    campaignName?: string;
    oldLevel?: number;
    newLevel?: number;
    notes?: string;
    [key: string]: any;
  };
  timestamp: number;
}

export interface MediaItem {
  id: string;
  ownerId: string;
  campaignId?: string | null;
  kind?: 'portrait' | 'cover' | 'handout';
  mimeType: string;
  sizeBytes: number;
  dataBase64?: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface CampaignDiceRoll {
  id: string;
  campaignId: string;
  userId: string;
  userName: string;
  characterId?: string | null;
  characterName?: string | null;
  rollType: string;
  diceExpression: string;
  total: number;
  details: {
    rolls: number[];
    modifier: number;
    advantage?: 'adv' | 'dis';
    isCritical?: boolean;
    isFumble?: boolean;
    label?: string;
  };
  visibility: 'table' | 'dm_only';
  createdAt: number;
}

export interface HomeSummaryResponse {
  user: User;
  myCampaigns: Campaign[];
  myCharacters: MasterCharacter[];
  pendingInvites: CampaignInvite[];
  pendingApprovals: {
    campaignId: string;
    campaignName: string;
    type: 'create' | 'level_up';
    participationId: string;
    characterId: string;
    characterName: string;
    playerName: string;
    level: number;
    requestedAt: number;
    details?: any;
  }[];
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  name: string;
  damageDice: string;
  damageType: string;
  range: string;
  properties: string;
  kind: 'special' | 'showy';
  specialAbility?: SpecialAbilityDef;
  description: string;
  secretNotes: string;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  name: string;
  description: string;
  source: string;
  usageType: RechargeType;
  maxUses?: number;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
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
  unarmored?: boolean; // Hamoun and Mist-Familiar lose it if armor/shield equipped
  maxDexMod?: number | null;
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

export interface LineageTrait {
  name: string;
  description: string;
  usage?: RechargeType | string;
}

export interface SublineageDef {
  name: string;
  description: string;
  traits: LineageTrait[];
}

export interface LineageTemplate {
  id: string;
  scopeType?: EntityScopeType;
  scopeId?: string;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  tags?: string[];
  name: string;
  description?: string;
  size: string; // e.g. "متوسط (Medium)" or "کوچک (Small)"
  speed: number; // e.g. 30
  abilityBonuses: {
    mode: 'fixed' | 'choose';
    fixed?: Partial<Record<AbilityName, number>>;
    chooseCount?: number;
    chooseValue?: number;
  };
  traits: LineageTrait[];
  languages: string[];
  proficiencies: {
    skills: string[];
    weapons: string[];
    armor: string[];
    tools: string[];
  };
  resistances?: string[];
  senses?: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    [key: string]: any;
  };
  sublineages?: SublineageDef[];
  nameSuggestions?: string[];
  backstoryPrompts?: string[];
  copiedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface BackgroundPersonalityTables {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export interface BackgroundTemplate {
  id: string;
  scopeType?: EntityScopeType;
  scopeId?: string;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  tags?: string[];
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  startingEquipment: string[] | string | { label: string; items: string[] }[];
  featureName: string;
  featureDescription: string;
  personalityTables: BackgroundPersonalityTables;
  copiedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface EquipmentChoiceOption {
  label: string;
  items: string[];
}

export interface EquipmentChoiceGroup {
  id: string;
  label: string;
  options: EquipmentChoiceOption[];
}

export interface CompanionDef {
  name: string;
  type?: string;
  acFormula?: string | AcFormula | null;
  hpFormula?: string | null;
  featuresByLevel?: Record<number, { name: string; description: string; usage?: string }[]>;
}

export interface ClassTemplate {
  id: string;
  name: string;
  title?: string;
  description?: string;
  hitDie: string | number;
  saves?: string[];
  savingThrows?: string[];
  savingThrowProficiencies?: AbilityName[];
  skillChoices: { count: number; options?: string[]; from?: string[] };
  weaponProf?: string | string[];
  weaponProficiencies?: string[];
  armorProf?: string | string[];
  armorProficiencies?: string[];
  startingEquipment: string | string[] | EquipmentChoiceGroup[];
  startingEquipmentChoices?: EquipmentChoiceGroup[];
  acFormula: string | AcFormula;
  spellcasting?: {
    ability: AbilityName;
    saveDCFormula?: string;
    slotsTable?: Record<number, number[]> | string;
    slotsByLevel?: Record<number, number[]>;
    cantripsKnownByLevel?: Record<number, number>;
    spellsKnownByLevel?: Record<number, number>;
    spellList?: { level: number; spells: string[] }[];
    note?: string;
  } | any;
  extraAttackLevel?: number | null;
  asiLevels: number[];
  fixedHpByLevel: number[] | Record<number, number>;
  hpFormula?: string;
  baseAbilities?: { STR: number; DEX: number; CON: number; WIS: number; INT: number; CHA: number } | AbilityScoreMap | Record<string, number>;
  baseAbilityScores?: AbilityScoreMap;
  companion?: { name: string; fromLevel: number; ac?: number | null; hp: string } | null;
  companions?: CompanionDef[];
  resources?: any[];
  classResources?: {
    name: string;
    type?: string;
    formulaOrDiceByLevel?: string | Record<number, string | number>;
    maxUsesFormula?: string;
    maxUsesByLevel?: Record<number, number>;
    diceByLevel?: Record<number, string>;
    resetType?: RechargeType | 'short' | 'long';
    description?: string;
    id?: string;
  }[];
  subclasses: {
    id?: string;
    name: string;
    unlockLevel: number;
    description?: string;
    featuresByLevel?: Record<number, any[]>;
  }[];
  notes?: string;
  features?: Record<number | string, string>;
  featuresByLevel?: Record<number, ClassFeatureByLevel[]>;
  martialArtsDie?: Record<string, string>;
  startingFeatures?: FeatureTemplate[];
  level2Options?: string[];
  starterWeapons?: { name: string; kind: 'showy' | 'special'; description?: string }[] | string[];
  starterWeaponOptions?: string[] | { name: string; kind: 'showy' | 'special'; description?: string }[];
  scopeType?: EntityScopeType;
  scopeId?: string;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
  createdAt?: number;
  updatedAt?: number | string;
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
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
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
  updatedAt: string;
}

export interface RewardPackage {
  id: string;
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  title: string;
  description: string;
  gold: number;
  silver: number;
  skillPoints: number;
  items: InventoryItem[];
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
  name: string;
  region: LocationRegion;
  description: string;
  imageUrl?: string;
  dmNotes?: string;
  revealed: boolean;
  parentId?: string | null;
  tags?: string[];
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
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
  scopeType?: 'pack' | 'campaign';
  scopeId?: string;
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
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  tags?: string[];
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

/* ==============================================================
   PHASE 2: WIZARD, LIBRARY, CLONE ENGINE, AND LINKED COPIES TYPES
   ============================================================== */

export type WizardStartMode = 'empty' | 'pack' | 'campaign' | 'template';

export interface WizardAnswers {
  // Step 1: Specs
  name?: string;
  description?: string;
  premise?: string;
  toneTags?: string[];
  coverMediaId?: string | null;
  coverUrl?: string;

  // Step 2: Rules
  units?: 'feet' | 'meters';
  startingLevel?: number;
  maxEntryLevel?: number;
  abilityScoreMethods?: ('standard_array' | 'point_buy' | 'roll' | 'manual')[];
  approvalOnCreate?: boolean;
  approvalOnLevelUp?: boolean;
  backstoryVisibility?: 'dm_only' | 'party';
  diceVisibility?: 'table' | 'dm_only';
  allowPlayerRollPrivate?: boolean;
  allowPlayerCreateCharacter?: boolean;
  restRules?: {
    shortRestHours?: number;
    longRestHours?: number;
    grittyRealism?: boolean;
  };
  exhaustionRules?: string;
  trackRations?: boolean;
  trackWater?: boolean;
  houseRules?: string;
  allowedClassIds?: string[];

  // Step 3: World
  calendarId?: string;
  calendarSource?: 'library' | 'scratch' | 'campaign';
  calendarData?: any;
  locationIds?: string[];
  factionIds?: string[];

  // Step 4: Cast
  npcIds?: string[];

  // Step 5: Loot
  itemIds?: string[];
  rewardIds?: string[];

  // Step 6: Session Zero
  sessionZeroDoc?: {
    title: string;
    expectations: string;
    schedule: string;
    linesAndVeils: string;
    xCardEnabled: boolean;
    houseRulesText: string;
  };

  // Step 7: Invites
  invitesList?: {
    label: string;
    role: CampaignRole;
    maxUses?: number;
    note?: string;
  }[];
}

export interface WizardState {
  step: number; // 1 to 8
  completed: number[];
  startMode: WizardStartMode;
  sourceId?: string | null;
  answers: WizardAnswers;
}

export interface Faction {
  id: string;
  scopeType: 'pack' | 'campaign';
  scopeId: string;
  name: string;
  description: string;
  attitude?: string;
  region?: string;
  revealed: boolean;
  dmNotes?: string;
  tags: string[];
  sourceId?: string | null;
  sourceMode?: 'copy' | 'linked';
  copiedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export type CampaignDocKind = 'session_zero' | 'house_rules' | 'handout_text' | 'custom';

export interface CampaignDoc {
  id: string;
  campaignId: string;
  kind: CampaignDocKind;
  title: string;
  body: string;
  visibility: 'dm_only' | 'party';
  sortIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarMonth {
  name: string;
  days: number;
  season?: string;
}

export interface CalendarFestival {
  monthIndex: number;
  day: number;
  name: string;
  note?: string;
}

export interface CalendarOffDay {
  name: string;
  note?: string;
}

export interface GenericCalendarData {
  id?: string;
  name: string;
  eraLabel: string;
  startYear: number;
  months: CalendarMonth[];
  festivals: CalendarFestival[];
  offDays: CalendarOffDay[];
  weekdays?: string[];
  tags?: string[];
}

export interface CalendarState {
  campaignId: string;
  calendarId: string;
  year: number;
  month: number;
  day: number;
  isOffDay: boolean;
  offDayIndex?: number;
  currentFestival?: string;
  updatedAt: number;
}

export interface Favorite {
  userId: string;
  entityType: string;
  entityId: string;
  createdAt: number;
}

export type EntityScopeType = 'pack' | 'campaign';

export type CloneEntityType = 
  | 'class_template' 
  | 'lineage_template'
  | 'background_template'
  | 'feature_template' 
  | 'weapon_template' 
  | 'item' 
  | 'reward' 
  | 'npc' 
  | 'location' 
  | 'encounter' 
  | 'calendar' 
  | 'rule_set' 
  | 'codex_doc' 
  | 'faction' 
  | 'campaign_doc';

export interface EntityRef {
  type: CloneEntityType;
  id: string;
}

export interface CloneOptions {
  includeDependencies?: 'auto' | 'ask' | 'none';
  includeChildren?: boolean;
  stripDmSecrets?: boolean;
  resetState?: boolean;
  visibility?: 'hidden' | 'keep' | 'revealed';
  nameConflict?: 'rename' | 'skip';
  keepLink?: 'copy' | 'linked';
  nameSuffix?: string;
  tagAdd?: string[];
  regionOverride?: string;
}

export interface CloneWarning {
  code: string;
  entityId: string;
  entityName?: string;
  message: string;
}

export interface CloneManifestItem {
  type: CloneEntityType;
  originalId: string;
  name: string;
  hasConflict: boolean;
  action: 'create' | 'skip' | 'rename';
  dependencies: EntityRef[];
  warnings?: string[];
  overrides?: any;
}

export interface CloneManifest {
  totalCount: number;
  countsByType: Record<string, number>;
  items: CloneManifestItem[];
  dependencyTree: Record<string, EntityRef[]>;
  conflicts: { type: CloneEntityType; originalId: string; name: string; targetId?: string }[];
  warnings: CloneWarning[];
  idMap?: Record<string, string>;
  createdIds?: Record<string, string[]>;
}

export interface CloneJob {
  id: string;
  userId: string;
  source: {
    scopeType: EntityScopeType;
    scopeId: string;
    entityRefs?: EntityRef[];
  };
  targetScopeType: EntityScopeType;
  targetScopeId: string;
  options: CloneOptions;
  status: 'preview' | 'running' | 'done' | 'failed' | 'undone';
  manifest: CloneManifest;
  warnings: CloneWarning[];
  createdAt: number;
  finishedAt?: number | null;
  undoneAt?: number | null;
}

// Part B (Linked Copies)
export interface FieldDiff {
  field: string;
  labelFa: string;
  sourceValue: any;
  localValue: any;
  chosenValue: 'local' | 'source';
}

export interface LinkedEntityDiff {
  entityType: CloneEntityType;
  entityId: string;
  sourceId: string;
  sourceName: string;
  sourceUpdatedAt: number;
  copiedAt: number;
  sourceAvailable: boolean;
  hasUpdates: boolean;
  diffs: FieldDiff[];
}

