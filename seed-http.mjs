// seed-http.mjs — import the demo seed (src/data/seed.ts) into the live D1
// using the legacy contract that functions/api/[[route]].ts expects.
//
// Usage:
//   node seed-http.mjs            # apply to local D1
//   node seed-http.mjs --remote   # apply to remote D1
//   node seed-http.mjs --dry-run  # print the SQL, don't run
//
// Passwords: Zorvania@123 (PBKDF2-SHA256, 100k iterations, base64url salt+hash)
// All seed users receive this same password.

import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname);
const remote = process.argv.includes('--remote');
const dryRun = process.argv.includes('--dry-run');

const BUNDLE_PATH = resolve(ROOT, 'tmp/seed-bundle.mjs');
const seed = await import(`file:///${BUNDLE_PATH.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '$1')}`);

// ---------------------------------------------------------------- helpers
function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const saltB64 = b64url(salt);
  const hashB64 = b64url(derived);
  return `pbkdf2$sha256$100000$${saltB64}$${hashB64}`;
}
const NOW = Date.now();

function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------- users
const USER_PASSWORD = 'Zorvania@123';
const userRows = seed.SEED_USERS.map((u) => ({
  id: u.id,
  email: u.email,
  display_name: u.displayName || u.name,
  password_hash: hashPassword(USER_PASSWORD),
  role: u.role === 'dm' ? 'dm' : 'player',
  platform_role: u.platformRole === 'admin' ? 'admin' : 'user',
  status: u.status === 'disabled' ? 'disabled' : 'active',
  must_change_password: 0,
  created_at: Math.floor(u.createdAt || NOW),
  last_login_at: Math.floor(u.lastLoginAt || NOW),
  active_character_id: u.activeCharacterId || null,
  avatar_url: u.avatarUrl || null,
}));

// ---------------------------------------------------------------- characters
const masterChars = seed.SEED_MASTER_CHARACTERS.map((c) => ({
  id: c.id,
  owner_id: c.ownerId,
  name: c.name,
  class_name: c.className || '',
  level: c.level || 1,
  data: JSON.stringify(c),
  revision: c.revision || 1,
  updated_at: Math.floor(c.updatedAt || NOW),
}));

const playChars = seed.SEED_CHARACTERS.map((c) => ({
  id: c.id,
  owner_id: c.ownerId,
  name: c.name,
  class_name: c.className || '',
  level: c.level || 1,
  data: JSON.stringify(c),
  revision: c.revision || 1,
  updated_at: Math.floor(c.updatedAt || NOW),
}));

// ---------------------------------------------------------------- campaigns
const campaigns = seed.SEED_CAMPAIGNS.map((c) => ({
  id: c.id,
  name: c.name,
  description: c.description || '',
  tone: c.tone || null,
  status: c.status,
  owner_id: c.ownerId,
  source_pack_id: c.sourcePackId || null,
  settings: JSON.stringify(c.settings || {}),
  wizard_state: JSON.stringify(c.wizardState || null),
  created_at: Math.floor(c.createdAt || NOW),
  updated_at: Math.floor(c.updatedAt || NOW),
}));

// ---------------------------------------------------------------- participations
const participations = seed.SEED_CHARACTER_PARTICIPATIONS.map((p) => ({
  id: p.id,
  character_id: p.characterId,
  campaign_id: p.campaignId,
  status: p.status,
  class_id: p.classId || null,
  class_name: p.className || '',
  subclass_name: p.subclassName || null,
  level: p.level || 1,
  xp: p.xp || 0,
  ability_scores: JSON.stringify(p.abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
  current_hp: p.currentHp || 0,
  max_hp: p.maxHp || 0,
  temp_hp: p.tempHp || 0,
  hit_dice: JSON.stringify(p.hitDice || { current: 0, max: 0, die: 'd8' }),
  ac_override: p.acOverride ?? null,
  speed_override: p.speedOverride ?? null,
  death_saves: JSON.stringify(p.deathSaves || { successes: 0, failures: 0 }),
  conditions: JSON.stringify(p.conditions || []),
  inventory: JSON.stringify(p.inventory || []),
  weapons: JSON.stringify(p.weapons || []),
  currency: JSON.stringify(p.currency || { gold: 0, silver: 0, copper: 0 }),
  custom_resources: JSON.stringify(p.customResources || []),
  spells_known_prepared: JSON.stringify(p.spellsKnownPrepared || null),
  spell_slots: JSON.stringify(p.spellSlots || null),
  features: JSON.stringify(p.features || []),
  notes: p.notes || '',
  dm_notes: p.dmNotes || '',
  pending_level_up: JSON.stringify(p.pendingLevelUp || null),
  joined_at: Math.floor(p.joinedAt || NOW),
  updated_at: Math.floor(p.updatedAt || NOW),
}));

// ---------------------------------------------------------------- history
const history = seed.SEED_HISTORY_EVENTS.map((h) => ({
  id: h.id,
  character_id: h.characterId,
  campaign_id: h.campaignId || null,
  event_type: h.eventType,
  payload: JSON.stringify(h.payload || {}),
  timestamp: Math.floor(h.timestamp || NOW),
}));

// ---------------------------------------------------------------- dice
const dice = seed.SEED_CAMPAIGN_DICE_ROLLS.map((d) => ({
  id: d.id,
  campaign_id: d.campaignId,
  user_id: d.userId,
  character_id: d.characterId || null,
  user_name: d.userName || '',
  character_name: d.characterName || null,
  roll_type: d.rollType || 'dice_roll',
  dice_expression: d.diceExpression || '',
  total: d.total || 0,
  details: JSON.stringify(d.details || {}),
  visibility: d.visibility || 'table',
  created_at: Math.floor(d.createdAt || NOW),
}));

// ---------------------------------------------------------------- campaign docs
const docs = seed.SEED_CAMPAIGN_DOCS.map((d) => ({
  id: d.id,
  campaign_id: d.campaignId,
  kind: d.kind,
  title: d.title,
  body: d.body || '',
  visibility: d.visibility || 'party',
  sort_index: d.sortIndex || 0,
  created_at: Math.floor(d.createdAt || NOW),
  updated_at: Math.floor(d.updatedAt || NOW),
}));

// ---------------------------------------------------------------- content packs
const packs = seed.SEED_CONTENT_PACKS.map((p) => ({
  id: p.id,
  owner_id: p.ownerId,
  name: p.name,
  description: p.description || '',
  version: p.version || '1.0.0',
  visibility: p.visibility || 'instance',
  kind: p.kind || 'pack',
  tags: JSON.stringify(p.tags || []),
  is_default_library: p.isDefaultLibrary ? 1 : 0,
  created_at: Math.floor(p.createdAt || NOW),
  updated_at: Math.floor(p.updatedAt || NOW),
}));

// ---------------------------------------------------------------- items
const items = seed.SEED_ITEM_LIBRARY.map((i) => ({
  id: i.id,
  scope_type: 'pack',
  scope_id: i.id,
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  name: i.name,
  category: i.category,
  is_revealed: i.isRevealed ? 1 : 0,
  data: JSON.stringify(i),
  updated_at: Math.floor(i.updatedAt || NOW),
}));

// ---------------------------------------------------------------- weapon templates
const weapons = seed.SEED_WEAPON_TEMPLATES.map((w) => ({
  id: w.id,
  scope_type: 'pack',
  scope_id: w.id,
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  name: w.name,
  kind: w.kind || 'normal',
  data: JSON.stringify(w),
  updated_at: Math.floor(w.updatedAt || NOW),
}));

// ---------------------------------------------------------------- class templates
const classes = seed.SEED_CLASS_TEMPLATES.map((c) => ({
  id: c.id,
  scope_type: 'pack',
  scope_id: c.id,
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  name: c.name,
  data: JSON.stringify(c),
  updated_at: Math.floor(c.updatedAt || NOW),
}));

// ---------------------------------------------------------------- rewards
const rewards = seed.SEED_REWARD_PACKAGES.map((r) => ({
  id: r.id,
  scope_type: 'campaign',
  scope_id: 'zorvania-c1',
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  title: r.title,
  data: JSON.stringify(r),
  created_at: Math.floor(r.createdAt || NOW),
}));

// ---------------------------------------------------------------- campaign notes
const campNotes = seed.SEED_CAMPAIGN_NOTES.map((n) => ({
  id: n.id,
  scope_type: 'campaign',
  scope_id: 'zorvania-c1',
  title: n.title,
  category: n.category || 'session',
  session_number: n.sessionNumber || null,
  data: JSON.stringify(n),
  updated_at: Math.floor(n.updatedAt || NOW),
}));

// ---------------------------------------------------------------- npcs
const npcs = seed.SEED_NPCS.map((n) => ({
  id: n.id,
  scope_type: 'pack',
  scope_id: n.id,
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  name: n.name,
  type: n.type || 'human',
  is_revealed: n.isRevealed ? 1 : 0,
  location_tag: n.locationTag || '',
  session_tag: n.sessionTag || '',
  data: JSON.stringify(n),
  updated_at: Math.floor(n.updatedAt || NOW),
}));

// ---------------------------------------------------------------- locations
const locations = seed.SEED_LOCATIONS.map((l) => ({
  id: l.id,
  scope_type: 'pack',
  scope_id: l.id,
  source_id: null,
  source_mode: 'copy',
  created_by: null,
  name: l.name,
  region: l.region || '',
  description: l.description || '',
  image_url: l.imageUrl || null,
  dm_notes: l.dmNotes || '',
  revealed: l.revealed ? 1 : 0,
  parent_id: l.parentId || null,
  created_at: Math.floor(l.createdAt || NOW),
  updated_at: Math.floor(l.updatedAt || NOW),
}));

// ---------------------------------------------------------------- factions
const factions = seed.SEED_FACTIONS.map((f) => ({
  id: f.id,
  scope_type: f.scopeType || 'campaign',
  scope_id: f.scopeId || 'zorvania-c1',
  source_id: f.sourceId || null,
  source_mode: f.sourceMode || 'copy',
  created_by: null,
  name: f.name,
  description: f.description || '',
  attitude: f.attitude || null,
  region: f.region || null,
  revealed: f.revealed ? 1 : 0,
  dm_notes: f.dmNotes || '',
  tags: JSON.stringify(f.tags || []),
  created_at: Math.floor(f.createdAt || NOW),
  updated_at: Math.floor(f.updatedAt || NOW),
}));

// ---------------------------------------------------------------- rule sets
const ruleSets = seed.SEED_RULE_SETS.map((r) => ({
  id: r.id,
  scope_type: r.scopeType || 'campaign',
  scope_id: r.scopeId || 'zorvania-c1',
  abilities: JSON.stringify(r.abilities || []),
  skills: JSON.stringify(r.skills || []),
  saves: JSON.stringify(r.saves || []),
  currencies: JSON.stringify(r.currencies || []),
  resources: JSON.stringify(r.resources || []),
  conditions: JSON.stringify(r.conditions || []),
  damage_types: JSON.stringify(r.damageTypes || []),
  proficiency_bonus_table: JSON.stringify(r.proficiencyBonusTable || {}),
  created_at: Math.floor(r.createdAt || NOW),
  updated_at: Math.floor(r.updatedAt || NOW),
}));

// ---------------------------------------------------------------- calendars
const cal = seed.SEED_GENERIC_CALENDAR;
const calendarRow = {
  id: 'cal-zorvania',
  scope_type: 'campaign',
  scope_id: 'zorvania-c1',
  source_id: null,
  name: cal.name || 'گاه‌شمار شاه‌روزان (زروانیا)',
  months: JSON.stringify(cal.months || []),
  off_days: JSON.stringify(cal.offDays || []),
  weekdays: JSON.stringify(cal.weekdays || []),
  data: JSON.stringify(cal),
  updated_at: NOW,
};

// ---------------------------------------------------------------- character notes
const charNotes = seed.SEED_CHARACTER_NOTES.map((n) => ({
  id: n.id,
  character_id: n.characterId,
  owner_id: n.ownerId,
  campaign_id: null,
  title: n.title,
  shared_with_dm: n.sharedWithDm ? 1 : 0,
  data: JSON.stringify(n),
  updated_at: Math.floor(n.updatedAt || NOW),
}));

// ---------------------------------------------------------------- encounters
const encounters = seed.SEED_ENCOUNTERS.map((e) => {
  const settings = JSON.stringify({
    showExactHp: false,
    showAc: false,
    showConditions: true,
    showDefeated: true,
    playerInitiativeRolls: true,
  });
  const combatants = (e.combatants || []).map((c, idx) => ({
    id: c.id,
    kind: c.isNpc ? 'npc' : 'character',
    npc_template_id: c.npcId || null,
    character_id: c.characterId || null,
    instance_name: c.name,
    display_name_for_players: c.name,
    max_hp: c.hpMax || 0,
    hp: c.hpCurrent || 0,
    ac: String(c.ac || '10'),
    ac_state: null,
    conditions: JSON.stringify(c.conditions || []),
    initiative: c.initiative || 0,
    initiative_status: 'set',
    visibility: 'revealed',
    status: 'active',
    phase: null,
    group_id: null,
    sort_index: idx,
    added_at_round: e.round || 0,
    revision: 1,
    notes: c.notes || '',
    created_at: NOW,
  }));
  return {
    id: e.id,
    scope_type: 'campaign',
    scope_id: 'zorvania-c1',
    name: e.name,
    location_id: null,
    status: 'draft',
    round: e.round || 0,
    current_participant_id: null,
    session_tag: e.sessionTag || '',
    settings,
    version: 1,
    dm_notes: e.notes || '',
    started_at: null,
    ended_at: null,
    created_by: 'user-dm',
    created_at: Math.floor(e.updatedAt || NOW),
    updated_at: Math.floor(e.updatedAt || NOW),
    combatants,
  };
});

// ---------------------------------------------------------------- build SQL
const stmts = [];
stmts.push(`-- ===========================================================`);
stmts.push(`-- Seed import from src/data/seed.ts into the live D1 (legacy contract)`);
stmts.push(`-- Generated: ${new Date().toISOString()}`);
stmts.push(`-- ===========================================================`);
stmts.push(``);

// users
const userCols = ['id', 'email', 'display_name', 'password_hash', 'role', 'platform_role', 'status', 'must_change_password', 'created_at', 'last_login_at', 'active_character_id', 'avatar_url'];
const userSql = userRows.map((u) => `INSERT INTO users (${userCols.join(', ')}) VALUES (${userCols.map((c) => lit(u[c])).join(', ')});`);
stmts.push(`-- 1) USERS`);
stmts.push(userSql.join(`\n`));

// characters
stmts.push(`-- 2) CHARACTERS (master + play, legacy blob)`);
stmts.push(
  playChars
    .map((c) => `INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (${[c.id, c.owner_id, c.name, c.class_name, c.level, c.data, c.revision, c.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// campaigns
stmts.push(`-- 3) CAMPAIGNS`);
stmts.push(
  campaigns.map((c) => `INSERT INTO campaigns (id, name, description, tone, status, owner_id, source_pack_id, settings, wizard_state, created_at, updated_at) VALUES (${[c.id, c.name, c.description, c.tone, c.status, c.owner_id, c.source_pack_id, c.settings, c.wizard_state, c.created_at, c.updated_at].map(lit).join(', ')});`).join(`\n`)
);

// campaign members
stmts.push(`-- 4) CAMPAIGN MEMBERS`);
stmts.push(
  seed.SEED_CAMPAIGN_MEMBERS.map((m) => `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (${[m.campaignId, m.userId, m.role, m.status, m.joinedAt].map(lit).join(', ')});`).join(`\n`)
);

// participations
stmts.push(`-- 5) CHARACTER PARTICIPATIONS`);
stmts.push(
  participations
    .map((p) => `INSERT INTO character_participations (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp, ability_scores, current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override, death_saves, conditions, inventory, weapons, currency, custom_resources, spells_known_prepared, spell_slots, features, notes, dm_notes, pending_level_up, joined_at, updated_at) VALUES (${[
      p.id, p.character_id, p.campaign_id, p.status, p.class_id, p.class_name, p.subclass_name, p.level, p.xp, p.ability_scores, p.current_hp, p.max_hp, p.temp_hp, p.hit_dice, p.ac_override, p.speed_override, p.death_saves, p.conditions, p.inventory, p.weapons, p.currency, p.custom_resources, p.spells_known_prepared, p.spell_slots, p.features, p.notes, p.dm_notes, p.pending_level_up, p.joined_at, p.updated_at,
    ].map(lit).join(', ')});`).join(`\n`)
);

// history
stmts.push(`-- 6) CHARACTER HISTORY EVENTS`);
stmts.push(
  history
    .map((h) => `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (${[h.id, h.character_id, h.campaign_id, h.event_type, h.payload, h.timestamp].map(lit).join(', ')});`)
    .join(`\n`)
);

// dice
stmts.push(`-- 7) CAMPAIGN DICE ROLLS`);
stmts.push(
  dice
    .map((d) => `INSERT INTO dice_rolls (id, campaign_id, user_id, character_id, user_name, character_name, roll_type, dice_expression, total, details, visibility, created_at) VALUES (${[d.id, d.campaign_id, d.user_id, d.character_id, d.user_name, d.character_name, d.roll_type, d.dice_expression, d.total, d.details, d.visibility, d.created_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// docs
stmts.push(`-- 8) CAMPAIGN DOCS`);
stmts.push(
  docs
    .map((d) => `INSERT INTO campaign_docs (id, campaign_id, kind, title, body, visibility, sort_index, created_at, updated_at) VALUES (${[d.id, d.campaign_id, d.kind, d.title, d.body, d.visibility, d.sort_index, d.created_at, d.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// packs
stmts.push(`-- 9) CONTENT PACKS`);
stmts.push(
  packs
    .map((p) => `INSERT INTO content_packs (id, owner_id, name, description, version, visibility, kind, tags, is_default_library, created_at, updated_at) VALUES (${[p.id, p.owner_id, p.name, p.description, p.version, p.visibility, p.kind, p.tags, p.is_default_library, p.created_at, p.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// items
stmts.push(`-- 10) ITEMS (library)`);
stmts.push(
  items
    .map((i) => `INSERT INTO items (id, scope_type, scope_id, source_id, source_mode, created_by, name, category, is_revealed, data, updated_at) VALUES (${[i.id, i.scope_type, i.scope_id, i.source_id, i.source_mode, i.created_by, i.name, i.category, i.is_revealed, i.data, i.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// weapons
stmts.push(`-- 11) WEAPON TEMPLATES`);
stmts.push(
  weapons
    .map((w) => `INSERT INTO weapon_templates (id, scope_type, scope_id, source_id, source_mode, created_by, name, kind, data, updated_at) VALUES (${[w.id, w.scope_type, w.scope_id, w.source_id, w.source_mode, w.created_by, w.name, w.kind, w.data, w.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// classes
stmts.push(`-- 12) CLASS TEMPLATES`);
stmts.push(
  classes
    .map((c) => `INSERT INTO class_templates (id, scope_type, scope_id, source_id, source_mode, created_by, name, data, updated_at) VALUES (${[c.id, c.scope_type, c.scope_id, c.source_id, c.source_mode, c.created_by, c.name, c.data, c.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// rewards
stmts.push(`-- 13) REWARDS`);
stmts.push(
  rewards
    .map((r) => `INSERT INTO rewards (id, scope_type, scope_id, source_id, source_mode, created_by, title, data, created_at) VALUES (${[r.id, r.scope_type, r.scope_id, r.source_id, r.source_mode, r.created_by, r.title, r.data, r.created_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// campaign notes
stmts.push(`-- 14) CAMPAIGN NOTES`);
stmts.push(
  campNotes
    .map((n) => `INSERT INTO campaign_notes (id, scope_type, scope_id, title, category, session_number, data, updated_at) VALUES (${[n.id, n.scope_type, n.scope_id, n.title, n.category, n.session_number, n.data, n.updated_at].map(lit).join(', ')});`)
    .join(`\n`)
);

// npcs
stmts.push(`-- 15) NPCS`);
stmts.push(
  npcs
    .map((n) => `INSERT INTO npcs (id, scope_type, scope_id, source_id, source_mode, created_by, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (${[n.id, n.scope_type, n.scope_id, n.source_id, n.source_mode, n.created_by, n.name, n.type, n.is_revealed, n.location_tag, n.session_tag, n.data, n.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// locations
stmts.push(`-- 16) LOCATIONS`);
stmts.push(
  locations
    .map((l) => `INSERT INTO locations (id, scope_type, scope_id, source_id, source_mode, created_by, name, region, description, image_url, dm_notes, revealed, parent_id, created_at, updated_at) VALUES (${[l.id, l.scope_type, l.scope_id, l.source_id, l.source_mode, l.created_by, l.name, l.region, l.description, l.image_url, l.dm_notes, l.revealed, l.parent_id, l.created_at, l.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// factions
stmts.push(`-- 17) FACTIONS`);
stmts.push(
  factions
    .map((f) => `INSERT INTO factions (id, scope_type, scope_id, source_id, source_mode, created_by, name, description, attitude, region, revealed, dm_notes, tags, created_at, updated_at) VALUES (${[f.id, f.scope_type, f.scope_id, f.source_id, f.source_mode, f.created_by, f.name, f.description, f.attitude, f.region, f.revealed, f.dm_notes, f.tags, f.created_at, f.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// rule sets
stmts.push(`-- 18) RULE SETS`);
stmts.push(
  ruleSets
    .map((r) => `INSERT INTO rule_sets (id, scope_type, scope_id, abilities, skills, saves, currencies, resources, conditions, damage_types, proficiency_bonus_table, created_at, updated_at) VALUES (${[r.id, r.scope_type, r.scope_id, r.abilities, r.skills, r.saves, r.currencies, r.resources, r.conditions, r.damage_types, r.proficiency_bonus_table, r.created_at, r.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// calendar
stmts.push(`-- 19) CALENDAR (single row)`);
stmts.push(
  `INSERT INTO calendars (id, scope_type, scope_id, source_id, name, months, off_days, weekdays, data, updated_at) VALUES (${[calendarRow.id, calendarRow.scope_type, calendarRow.scope_id, calendarRow.source_id, calendarRow.name, calendarRow.months, calendarRow.off_days, calendarRow.weekdays, calendarRow.data, calendarRow.updated_at].map(lit).join(', ')});`
);

// character notes
stmts.push(`-- 20) CHARACTER NOTES`);
stmts.push(
  charNotes
    .map((n) => `INSERT INTO notes (id, character_id, owner_id, campaign_id, title, shared_with_dm, data, updated_at) VALUES (${[n.id, n.character_id, n.owner_id, n.campaign_id, n.title, n.shared_with_dm, n.data, n.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// encounters
stmts.push(`-- 21) ENCOUNTERS`);
stmts.push(
  encounters
    .map((e) => `INSERT INTO encounters (id, scope_type, scope_id, name, location_id, status, round, current_participant_id, session_tag, settings, version, dm_notes, started_at, ended_at, created_by, created_at, updated_at) VALUES (${[e.id, e.scope_type, e.scope_id, e.name, e.location_id, e.status, e.round, e.current_participant_id, e.session_tag, e.settings, e.version, e.dm_notes, e.started_at, e.ended_at, e.created_by, e.created_at, e.updated_at].map(lit).join(', ')};`)
    .join(`\n`)
);

// encounter participants
stmts.push(`-- 22) ENCOUNTER PARTICIPANTS`);
stmts.push(
  encounters
    .flatMap((e) => (e.combatants || []).map((c) => ({
      id: c.id,
      encounter_id: e.id,
      kind: c.kind,
      npc_template_id: c.npc_template_id,
      character_id: c.character_id,
      instance_name: c.instance_name,
      display_name_for_players: c.display_name_for_players,
      max_hp: c.max_hp,
      hp: c.hp,
      ac: c.ac,
      ac_state: c.ac_state,
      conditions: c.conditions,
      initiative: c.initiative,
      initiative_status: c.initiative_status,
      visibility: c.visibility,
      status: c.status,
      phase: c.phase,
      group_id: c.group_id,
      sort_index: c.sort_index,
      added_at_round: c.added_at_round,
      revision: c.revision,
      notes: c.notes,
      created_at: c.created_at,
    })))
    .map((p) => `INSERT INTO encounter_participants (id, encounter_id, kind, npc_template_id, character_id, instance_name, display_name_for_players, max_hp, hp, ac, ac_state, conditions, initiative, initiative_status, visibility, status, phase, group_id, sort_index, added_at_round, revision, notes, created_at) VALUES (${[
      p.id, p.encounter_id, p.kind, p.npc_template_id, p.character_id, p.instance_name, p.display_name_for_players, p.max_hp, p.hp, p.ac, p.ac_state, p.conditions, p.initiative, p.initiative_status, p.visibility, p.status, p.phase, p.group_id, p.sort_index, p.added_at_round, p.revision, p.notes, p.created_at,
    ].map(lit).join(', ')};`)
    .join(`\n`)
);

stmts.push(`-- 23) SHANSHIN ENCOUNTERS: skipped (no seed data)`);
stmts.push(`-- 24) CAMPAIGN CALENDAR: skipped (function defaults when no row exists)`);
stmts.push(`-- 25) CAMPAIGN ENDINGS: skipped (function defaults when no row exists)`);
stmts.push(`-- 26) INVITES / PASSWORD RESETS: not part of the demo seed`);

const sql = stmts.join(`\n`);
const outPath = resolve(ROOT, 'tmp/seed-http.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${outPath} (${sql.length} bytes, ${stmts.length} statements)`);

if (dryRun) {
  console.log(`--- DRY RUN (${remote ? 'REMOTE' : 'LOCAL'} mode) ---`);
  console.log(sql.slice(0, 3000));
  process.exit(0);
}

// ---------------------------------------------------------------- apply
const args = ['npx', 'wrangler', 'd1', 'execute', 'zorvania-db', remote ? '--remote' : '--local', '--file=' + outPath];
console.log(`Running: ${args.join(' ')}`);
const r = spawnSync(args[0], args.slice(1), { cwd: ROOT, stdio: 'inherit', encoding: 'utf8' });
if (r.status !== 0) {
  console.error(`wrangler exited with ${r.status}`);
  process.exit(r.status || 1);
}
console.log(`Seed applied successfully to ${remote ? 'REMOTE' : 'LOCAL'} D1.`);