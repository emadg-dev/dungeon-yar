/**
 * DM-ONLY SHEET CONTROL — Single Source of Truth
 * Pure TypeScript policy rules used by both Server (Functions + LocalApi) and Client UI.
 */

export type PolicyGroup = 'dm_only' | 'grant_dm_only' | 'player_free' | 'request';

export type EditGrantPreset = 'respec' | 'level_up' | 'ability_scores' | 'spell_swap' | 'inventory_add' | 'full';

export interface PolicyRule {
  group: PolicyGroup;
  fields: string[];
  requiresGrant?: boolean;
}

export const SHEET_POLICY_DEFAULT: Record<string, PolicyGroup> = {
  // Core stat block (dm_only)
  level: 'dm_only',
  xp: 'dm_only',
  class: 'dm_only',
  className: 'dm_only',
  class_name: 'dm_only',
  classId: 'dm_only',
  class_id: 'dm_only',
  subclass: 'dm_only',
  subclassName: 'dm_only',
  subclass_name: 'dm_only',
  lineage: 'dm_only',
  race: 'dm_only',
  background: 'dm_only',
  abilities: 'dm_only',
  abilityScores: 'dm_only',
  ability_scores: 'dm_only',
  proficiencies: 'dm_only',
  expertise: 'dm_only',
  saves: 'dm_only',
  tools: 'dm_only',
  languages: 'dm_only',
  maxHp: 'dm_only',
  max_hp: 'dm_only',
  hitDiceMax: 'dm_only',
  'hitDice.max': 'dm_only',
  baseAc: 'dm_only',
  ac: 'dm_only',
  speed: 'dm_only',
  senses: 'dm_only',
  resistances: 'dm_only',
  classFeatures: 'dm_only',
  features: 'dm_only',
  feats: 'dm_only',
  asi: 'dm_only',
  spellSlotsMax: 'dm_only',
  spellsKnown: 'dm_only',
  classResourceMax: 'dm_only',
  companionStats: 'dm_only',
  skillPointsBalance: 'dm_only',
  weaponStatsGranted: 'dm_only',
  armorStatsGranted: 'dm_only',
  derivedStats: 'dm_only',

  // Grants / DM-only modifications (grant_dm_only)
  addItem: 'grant_dm_only',
  add_item: 'grant_dm_only',
  inventoryQuantity: 'grant_dm_only',
  currencyBalance: 'grant_dm_only',
  addFeature: 'grant_dm_only',
  add_feature: 'grant_dm_only',
  addCompanion: 'grant_dm_only',
  add_companion: 'grant_dm_only',
  grantLoot: 'grant_dm_only',
  grantCurrency: 'grant_dm_only',
  grantXp: 'grant_dm_only',
  grantSkillPoints: 'grant_dm_only',

  // Player free edits (player_free)
  identityBackstory: 'player_free',
  identity: 'player_free',
  backstory: 'player_free',
  appearance: 'player_free',
  personality: 'player_free',
  currentHp: 'player_free',
  current_hp: 'player_free',
  tempHp: 'player_free',
  temp_hp: 'player_free',
  deathSaves: 'player_free',
  death_saves: 'player_free',
  conditions: 'player_free',
  concentration: 'player_free',
  resourceUsed: 'player_free',
  useResource: 'player_free',
  equipStatus: 'player_free',
  reorder: 'player_free',
  consumeItem: 'player_free',
  spendCurrency: 'player_free',
  decreaseCurrency: 'player_free',
  decreaseItemQuantity: 'player_free',
  notes: 'player_free',
  companionCurrentHp: 'player_free',

  // Request flow (request)
  addMundaneItem: 'request',
  swapSpell: 'request',
  spellsPrepared: 'request',
  transferToParty: 'request',
  transferToPlayer: 'request',
  spendSkillPoints: 'request',
  respecWindow: 'request',
  respec: 'request'
};

export const PRESET_FIELDS_MAP: Record<EditGrantPreset, string[]> = {
  respec: [
    'level', 'xp', 'class', 'className', 'classId', 'subclass', 'subclassName',
    'lineage', 'race', 'background', 'abilities', 'abilityScores', 'proficiencies',
    'features', 'spellsKnown', 'spellsPrepared', 'spellSlotsMax', 'maxHp', 'hitDiceMax'
  ],
  level_up: [
    'level', 'xp', 'maxHp', 'max_hp', 'hitDiceMax', 'spellSlotsMax', 'features',
    'asi', 'spellsKnown', 'subclass', 'subclassName'
  ],
  ability_scores: ['abilities', 'abilityScores', 'asi'],
  spell_swap: ['spellsKnown', 'spellsPrepared', 'swapSpell'],
  inventory_add: ['addItem', 'add_item', 'inventoryQuantity', 'currencyBalance', 'grantCurrency', 'grantLoot'],
  full: ['*']
};

export const PERSIAN_FIELD_LABELS: Record<string, string> = {
  level: 'سطح (Level)',
  xp: 'امتیاز تجربه (XP)',
  class: 'کلاس شخصیت',
  className: 'نام کلاس',
  subclass: 'زیرکلاس',
  subclassName: 'نام زیرکلاس',
  lineage: 'تبار / نژاد',
  race: 'تبار',
  background: 'پیشینه',
  abilities: 'امتیازهای توانایی پایه',
  abilityScores: 'امتیازهای توانایی',
  proficiencies: 'مهارت‌ها و تسلط‌ها',
  expertise: 'تخصص‌ها',
  saves: 'پرتاب‌های نجات',
  tools: 'تسلط ابزارها',
  languages: 'زبان‌ها',
  maxHp: 'سقف جان (Max HP)',
  hitDiceMax: 'سقف تاس جان',
  baseAc: 'زره و دفاع پایه (AC)',
  ac: 'درجه سختی اصابت (AC)',
  speed: 'سرعت پایه',
  senses: 'حواس ویژه',
  resistances: 'مقاومت‌ها و مصونیت‌ها',
  classFeatures: 'ویژگی‌های کلاسی',
  features: 'ویژگی‌ها و قابلیت‌ها',
  feats: 'فیت‌ها (Feats)',
  asi: 'بهبود توانایی (ASI)',
  spellSlotsMax: 'سقف خانه‌های جادو',
  spellsKnown: 'جادوهای شناخته‌شده',
  classResourceMax: 'سقف منابع کلاسی',
  companionStats: 'مشخصات همراهان',
  skillPointsBalance: 'امتیازهای مهارت',
  weaponStatsGranted: 'مشخصات سلاح‌های رسمی',
  armorStatsGranted: 'مشخصات زره‌های رسمی',
  addItem: 'افزودن آیتم یا سلاح جدید',
  inventoryQuantity: 'افزایش تعداد موجودی',
  currencyBalance: 'افزایش موجودی سکه',
  addFeature: 'افزودن قابلیت یا ویژگی',
  addCompanion: 'افزودن همراه'
};

export function getPersianFieldLabel(field: string): string {
  return PERSIAN_FIELD_LABELS[field] || field;
}

export function getFieldGroup(
  field: string,
  overrides?: Partial<Record<string, 'dm_only' | 'request' | 'player'>>
): PolicyGroup {
  if (overrides && overrides[field]) {
    const o = overrides[field];
    if (o === 'player') return 'player_free';
    if (o === 'request') return 'request';
    if (o === 'dm_only') return 'dm_only';
  }
  return SHEET_POLICY_DEFAULT[field] || 'dm_only';
}

export function isLocked(
  group: PolicyGroup,
  state: 'draft' | 'pending_approval' | 'finalized' | 'active'
): boolean {
  if (state === 'draft' || state === 'pending_approval') return false;
  return group === 'dm_only' || group === 'grant_dm_only';
}

export function requiresGrant(group: PolicyGroup): boolean {
  return group === 'grant_dm_only';
}

export function isFree(group: PolicyGroup, state: string): boolean {
  return group === 'player_free' || (group === 'request' && state !== 'finalized' && state !== 'active');
}

/**
 * Checks whether an active edit grant covers a specific field or action.
 */
export function isFieldCoveredByGrant(field: string, grant: any): boolean {
  if (!grant || grant.status !== 'active') return false;
  if (grant.expires_at && grant.expires_at < Date.now()) return false;
  if (grant.expiresAt && grant.expiresAt < Date.now()) return false;
  const uses = grant.uses_left ?? grant.usesLeft ?? 1;
  if (uses <= 0) return false;

  if (grant.scope === 'preset') {
    const preset = (grant.preset || 'full') as EditGrantPreset;
    const allowed = PRESET_FIELDS_MAP[preset] || [];
    if (allowed.includes('*') || allowed.includes(field)) return true;
  } else if (grant.scope === 'fields') {
    let fieldsList: string[] = [];
    if (Array.isArray(grant.fields)) {
      fieldsList = grant.fields;
    } else if (typeof grant.fields === 'string') {
      try {
        fieldsList = JSON.parse(grant.fields);
      } catch {
        fieldsList = [grant.fields];
      }
    }
    if (fieldsList.includes('*') || fieldsList.includes(field)) return true;
  }
  return false;
}

/**
 * Main lock check: Returns true if player is blocked from modifying this field.
 */
export function isFieldLockedForPlayer(
  field: string,
  participation: {
    status?: string;
    sheetLocked?: boolean | number;
    sheet_locked?: boolean | number;
    creationFinalizedAt?: number;
    creation_finalized_at?: number;
  },
  activeGrants: any[] = [],
  overrides?: Partial<Record<string, 'dm_only' | 'request' | 'player'>>
): boolean {
  // If participation is still draft or pending approval, everything is editable
  const status = participation?.status;
  if (status === 'draft' || status === 'pending_approval') {
    return false;
  }

  // If DM explicitly unlocked this sheet (sheetLocked === false / 0)
  const isSheetLocked = participation?.sheetLocked !== false && participation?.sheet_locked !== 0;
  if (!isSheetLocked) {
    return false;
  }

  // Check policy group
  const group = getFieldGroup(field, overrides);
  if (group === 'player_free') {
    return false;
  }

  // Check if an active grant covers this field
  const covered = activeGrants.some(g => isFieldCoveredByGrant(field, g));
  if (covered) {
    return false;
  }

  // Otherwise, if dm_only or grant_dm_only or request (without DM approval), it is locked
  return true;
}

/**
 * Finds all locked fields inside a patch dictionary.
 */
export function getLockedFieldsInPatch(
  patch: Record<string, any>,
  participation: {
    status?: string;
    sheetLocked?: boolean | number;
    sheet_locked?: boolean | number;
    creationFinalizedAt?: number;
    creation_finalized_at?: number;
  },
  activeGrants: any[] = [],
  overrides?: Partial<Record<string, 'dm_only' | 'request' | 'player'>>
): string[] {
  const lockedFields: string[] = [];
  for (const key of Object.keys(patch)) {
    if (isFieldLockedForPlayer(key, participation, activeGrants, overrides)) {
      lockedFields.push(key);
    }
  }
  return lockedFields;
}

/**
 * Generates an explanatory Persian message when one or more fields are locked.
 */
export function getPersianLockedMessage(lockedFields: string[]): string {
  const labels = lockedFields.map(f => `«${getPersianFieldLabel(f)}»`).join('، ');
  return `فیلدهای ${labels} قفل شده‌اند و فقط توسط دانجن‌مستر قابل تغییر هستند. لطفاً درخواست تغییر ثبت نمایید یا اجازه موقت دریافت کنید.`;
}

/**
 * Validates a resource pip toggle.
 * RULE: Clearing a used pip is allowed only via Short/Long Rest, DM, or within a 30-second undo window.
 */
export function validateResourcePipChange(
  previousUsed: number,
  newUsed: number,
  lastPipsChangeAt?: number,
  isDm: boolean = false,
  isRest: boolean = false,
  undoWindowMs: number = 30000
): { allowed: boolean; reason?: string } {
  if (isDm || isRest) return { allowed: true };

  // Marking as used (previousUsed < newUsed) is always allowed for player
  if (newUsed >= previousUsed) {
    return { allowed: true };
  }

  // Clearing / replenishing used pips (newUsed < previousUsed):
  // Allowed only if within 30-second undo window!
  const now = Date.now();
  if (lastPipsChangeAt && (now - lastPipsChangeAt) <= undoWindowMs) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'بازیابی مصرف منابع فقط از طریق استراحت کوتاه/بلند یا توسط دانجن‌مستر امکان‌پذیر است (مهلت بازگشت اشتباه ۳۰ ثانیه بود).'
  };
}

/**
 * Validates quantity changes (e.g. inventory items).
 * RULE: Players can only DECREASE quantities (consume/drop); increasing requires DM grant or flow.
 */
export function validateQuantityChange(
  oldQty: number,
  newQty: number,
  isDm: boolean = false,
  activeGrants: any[] = []
): { allowed: boolean; reason?: string } {
  if (isDm) return { allowed: true };
  if (newQty <= oldQty) return { allowed: true };

  const hasGrant = activeGrants.some(g => isFieldCoveredByGrant('inventoryQuantity', g) || isFieldCoveredByGrant('addItem', g));
  if (hasGrant) return { allowed: true };

  return {
    allowed: false,
    reason: 'افزایش تعداد آیتم یا دریافت تجهیزات جدید فقط توسط دانجن‌مستر یا از طریق پاداش مجاز است.'
  };
}

/**
 * Validates currency changes.
 * RULE: Players can only DECREASE currency (spending); increasing requires DM grant.
 */
export function validateCurrencyChange(
  oldCurr: { gold?: number; silver?: number; copper?: number },
  newCurr: { gold?: number; silver?: number; copper?: number },
  isDm: boolean = false,
  activeGrants: any[] = []
): { allowed: boolean; reason?: string } {
  if (isDm) return { allowed: true };

  const goldUp = (newCurr.gold ?? 0) > (oldCurr.gold ?? 0);
  const silverUp = (newCurr.silver ?? 0) > (oldCurr.silver ?? 0);
  const copperUp = (newCurr.copper ?? 0) > (oldCurr.copper ?? 0);

  if (!goldUp && !silverUp && !copperUp) {
    return { allowed: true };
  }

  const hasGrant = activeGrants.some(g => isFieldCoveredByGrant('currencyBalance', g) || isFieldCoveredByGrant('grantCurrency', g));
  if (hasGrant) return { allowed: true };

  return {
    allowed: false,
    reason: 'افزایش موجودی سکه‌ها فقط توسط دانجن‌مستر یا پاداش بازی امکان‌پذیر است.'
  };
}
