/**
 * DM-ONLY SHEET CONTROL — pure policy logic
 * Source of truth for field-level access per participation state.
 */

export type PolicyGroup = 'dm_only' | 'grant_dm_only' | 'player_free' | 'request';
export type FieldCategory = 'core_stat' | 'resource' | 'inventory' | 'spell' | 'feature' | 'identity' | 'derived';

export interface PolicyRule {
  group: PolicyGroup;
  fields: string[];
  requiresGrant?: boolean;
}

export const SHEET_POLICY_DEFAULT: Record<string, PolicyGroup> = {
  // core stat block
  level: 'dm_only',
  xp: 'dm_only',
  class: 'dm_only',
  subclass: 'dm_only',
  lineage: 'dm_only',
  background: 'dm_only',
  abilities: 'dm_only',
  proficiencies: 'dm_only',
  expertise: 'dm_only',
  saves: 'dm_only',
  tools: 'dm_only',
  languages: 'dm_only',
  maxHp: 'dm_only',
  hitDiceMax: 'dm_only',
  ac: 'dm_only',
  speed: 'dm_only',
  senses: 'dm_only',
  resistances: 'dm_only',
  classFeatures: 'dm_only',
  feats: 'dm_only',
  asi: 'dm_only',
  spellSlotsMax: 'dm_only',
  spellsKnown: 'dm_only',
  classResourceMax: 'dm_only',
  companionStats: 'dm_only',
  skillPointsBalance: 'dm_only',
  weaponStatsGranted: 'dm_only',
  armorStatsGranted: 'dm_only',
  currentHp: 'player_free',
  tempHp: 'player_free',
  deathSaves: 'player_free',
  conditions: 'player_free',
  concentration: 'player_free',
  inventoryQuantity: 'grant_dm_only',
  currencyBalance: 'grant_dm_only',
  resourceUsed: 'player_free',
  equipStatus: 'player_free',
  reorder: 'player_free',
  consumeItem: 'player_free',
  spendCurrency: 'player_free',
  identityBackstory: 'player_free',
  notes: 'player_free',
  addItem: 'grant_dm_only',
  addFeature: 'grant_dm_only',
  addCompanion: 'grant_dm_only',
  grantLoot: 'grant_dm_only',
  grantCurrency: 'grant_dm_only',
  grantXp: 'grant_dm_only',
  swapSpell: 'request',
  respecWindow: 'request',
  addMundaneItem: 'request',
  spendSkillPoints: 'request',
  transferToParty: 'request',
};

export function isLocked(group: PolicyGroup, state: 'draft' | 'pending_approval' | 'finalized'): boolean {
  if (state !== 'finalized') return false;
  return group === 'dm_only' || group === 'grant_dm_only';
}

export function requiresGrant(group: PolicyGroup): boolean {
  return group === 'grant_dm_only';
}

export function isFree(group: PolicyGroup, state: string): boolean {
  return group === 'player_free' || (group === 'request' && state !== 'finalized');
}
