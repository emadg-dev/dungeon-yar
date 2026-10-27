-- Zorvania Multi-Campaign D&D 5e Platform Schema
-- Production SQLite schema for Cloudflare D1 (timestamps = integer unix ms)

PRAGMA foreign_keys = ON;

-- 1. Users table (platform_role replaces role)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('player', 'dm')) DEFAULT 'player',
  platform_role TEXT CHECK (platform_role IN ('admin', 'user')) DEFAULT 'user',
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  must_change_password INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  deleted_at INTEGER,
  active_character_id TEXT,
  avatar_url TEXT,
  avatar_media_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  absolute_expires_at INTEGER NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- 3. Media table (Cloudflare D1 BLOB storage with ≤150KB size and per-user quota)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  data BLOB NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_id);

-- 4. Content Packs table (libraries of templates: Zorvania, 5e Base, custom)
CREATE TABLE IF NOT EXISTS content_packs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  visibility TEXT CHECK (visibility IN ('private', 'instance')) DEFAULT 'instance',
  kind TEXT CHECK (kind IN ('library', 'pack', 'campaign_template')) DEFAULT 'pack',
  tags TEXT DEFAULT '[]',
  is_default_library INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_packs_owner ON content_packs(owner_id);
CREATE INDEX IF NOT EXISTS idx_content_packs_kind ON content_packs(kind);
CREATE INDEX IF NOT EXISTS idx_content_packs_default ON content_packs(owner_id, is_default_library);

-- 5. Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_media_id TEXT,
  tone TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'active',
  owner_id TEXT NOT NULL,
  source_pack_id TEXT,
  settings TEXT NOT NULL,
  wizard_state TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_pack_id) REFERENCES content_packs(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 6. Campaign Members table (roles are per campaign)
CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'co_dm', 'player', 'spectator')) NOT NULL,
  status TEXT CHECK (status IN ('invited', 'active', 'left', 'removed')) DEFAULT 'active',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, user_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_role ON campaign_members(campaign_id, role);

-- 7. Campaign Invites table (replaces global invites)
CREATE TABLE IF NOT EXISTS campaign_invites (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  code_hash TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'co_dm', 'player', 'spectator')) DEFAULT 'player',
  label TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  assign_participation_id TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_invites_code ON campaign_invites(code_hash);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_campaign ON campaign_invites(campaign_id);

-- 8. Rule Sets table (dynamic rules for pack and campaign scopes)
CREATE TABLE IF NOT EXISTS rule_sets (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL,
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  abilities TEXT NOT NULL,
  skills TEXT NOT NULL,
  saves TEXT NOT NULL,
  currencies TEXT NOT NULL,
  resources TEXT NOT NULL,
  conditions TEXT NOT NULL,
  damage_types TEXT NOT NULL,
  proficiency_bonus_table TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rule_sets_scope ON rule_sets(scope_type, scope_id);

-- 9. Characters table (Master Identity) — legacy JSON-blob shape (contract with functions/api)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT NOT NULL,
  class_name TEXT,
  level INTEGER DEFAULT 1,
  data TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_owner ON characters(owner_id);

-- 10. Character Participations table (Play state per campaign)
CREATE TABLE IF NOT EXISTS character_participations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'active', 'rejected', 'retired', 'dead')) DEFAULT 'active',
  class_id TEXT,
  class_name TEXT,
  subclass_name TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  ability_scores TEXT NOT NULL,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  temp_hp INTEGER DEFAULT 0,
  hit_dice TEXT NOT NULL,
  ac_override INTEGER,
  speed_override INTEGER,
  death_saves TEXT,
  conditions TEXT NOT NULL DEFAULT '[]',
  inventory TEXT NOT NULL DEFAULT '[]',
  weapons TEXT NOT NULL DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT '{"gold":0,"silver":0,"copper":0}',
  custom_resources TEXT NOT NULL DEFAULT '[]',
  spells_known_prepared TEXT,
  spell_slots TEXT,
  features TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  dm_notes TEXT,
  build TEXT DEFAULT '{}',
  sheet_locked INTEGER DEFAULT 1,
  pending_level_up TEXT,
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(character_id, campaign_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participations_campaign ON character_participations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_character ON character_participations(character_id);

-- 10b. Participation Snapshots table (keeps last 10 snapshots per participation)
CREATE TABLE IF NOT EXISTS participation_snapshots (
  id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL,
  label TEXT NOT NULL,
  state TEXT NOT NULL,
  build TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_snapshots_participation ON participation_snapshots(participation_id, created_at DESC);

-- 11. Character History Events table (Cross-campaign deeds and progression)
CREATE TABLE IF NOT EXISTS character_history_events (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT,
  event_type TEXT CHECK (event_type IN ('joined', 'level_up', 'death', 'major_deed', 'retired', 'custom')) NOT NULL,
  payload TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_char_history_char ON character_history_events(character_id, timestamp);

-- 12. Dice Rolls table (Shared live feed per campaign, last 50)
CREATE TABLE IF NOT EXISTS dice_rolls (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  character_id TEXT,
  user_name TEXT NOT NULL,
  character_name TEXT,
  roll_type TEXT NOT NULL,
  dice_expression TEXT NOT NULL,
  total INTEGER NOT NULL,
  details TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('table', 'dm_only')) DEFAULT 'table',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dice_rolls_campaign ON dice_rolls(campaign_id, created_at DESC);

-- 13. Scoped Content Entities (scope_type IN ('pack', 'campaign'))
-- Lineage Templates (نژادها و تبارها)
CREATE TABLE IF NOT EXISTS lineage_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  tags TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT 'متوسط (Medium)',
  speed INTEGER NOT NULL DEFAULT 30,
  ability_bonuses TEXT NOT NULL DEFAULT '{"mode":"fixed","fixed":{},"chooseCount":0,"chooseValue":1}',
  traits TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '["مشترک"]',
  proficiencies TEXT NOT NULL DEFAULT '{"skills":[],"weapons":[],"armor":[],"tools":[]}',
  resistances TEXT NOT NULL DEFAULT '[]',
  senses TEXT NOT NULL DEFAULT '{"darkvision":0}',
  sublineages TEXT NOT NULL DEFAULT '[]',
  name_suggestions TEXT NOT NULL DEFAULT '[]',
  backstory_prompts TEXT NOT NULL DEFAULT '[]',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lineage_templates_scope ON lineage_templates(scope_type, scope_id, updated_at);

-- Background Templates (پیشینه‌ها)
CREATE TABLE IF NOT EXISTS background_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  tags TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  skill_proficiencies TEXT NOT NULL DEFAULT '[]',
  tool_proficiencies TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '[]',
  starting_equipment TEXT NOT NULL DEFAULT '[]',
  feature_name TEXT NOT NULL DEFAULT '',
  feature_description TEXT NOT NULL DEFAULT '',
  personality_tables TEXT NOT NULL DEFAULT '{"traits":[],"ideals":[],"bonds":[],"flaws":[]}',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_background_templates_scope ON background_templates(scope_type, scope_id, updated_at);

-- Class Templates (کلاس‌ها)
CREATE TABLE IF NOT EXISTS class_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  copied_at INTEGER,
  starting_equipment_choices TEXT DEFAULT '[]',
  starter_weapon_options TEXT DEFAULT '[]',
  ac_formula_struct TEXT,
  spellcasting_struct TEXT,
  extra_attack_level INTEGER,
  asi_levels TEXT DEFAULT '[4,8,12,16,19]',
  fixed_hp_by_level TEXT DEFAULT '[]',
  base_abilities_struct TEXT,
  features_by_level TEXT DEFAULT '{}',
  subclasses_struct TEXT DEFAULT '[]',
  class_resources_struct TEXT DEFAULT '[]',
  companions_struct TEXT DEFAULT '[]',
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_class_templates_scope ON class_templates(scope_type, scope_id, updated_at);

-- Feature Templates
CREATE TABLE IF NOT EXISTS feature_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_templates_scope ON feature_templates(scope_type, scope_id);

-- Weapon Templates
CREATE TABLE IF NOT EXISTS weapon_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weapon_templates_scope ON weapon_templates(scope_type, scope_id);

-- Items & Artifacts
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_scope ON items(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_items_revealed ON items(is_revealed);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rewards_scope ON rewards(scope_type, scope_id);

-- NPCs and Bestiary
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  location_tag TEXT,
  session_tag TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_npcs_scope ON npcs(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_npcs_revealed ON npcs(is_revealed);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  dm_notes TEXT,
  revealed INTEGER DEFAULT 0,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_scope ON locations(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_locations_revealed ON locations(revealed);

-- Calendars & Calendar States
CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  name TEXT NOT NULL,
  months TEXT NOT NULL,
  off_days TEXT NOT NULL,
  data TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  copied_at INTEGER,
  era_label TEXT DEFAULT 'پ.ر.ن',
  start_year INTEGER DEFAULT 1500,
  weekdays TEXT DEFAULT '["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"]',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_states (
  campaign_id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 1500,
  month INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  is_off_day INTEGER NOT NULL DEFAULT 0,
  off_day_index INTEGER DEFAULT 0,
  current_festival TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Codex / Rules docs
CREATE TABLE IF NOT EXISTS codex_docs (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_codex_scope ON codex_docs(scope_type, scope_id);

-- Campaign Notes (DM notes)
CREATE TABLE IF NOT EXISTS campaign_notes (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  session_number TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_notes_scope ON campaign_notes(scope_type, scope_id);

-- Encounters
CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  name TEXT NOT NULL,
  location_id TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'ended')) DEFAULT 'draft',
  round INTEGER DEFAULT 0,
  current_participant_id TEXT,
  session_tag TEXT,
  settings TEXT NOT NULL DEFAULT '{"showExactHp":false,"showAc":false,"showConditions":true,"showDefeated":true,"playerInitiativeRolls":true}',
  version INTEGER DEFAULT 0,
  dm_notes TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_encounters_scope ON encounters(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);

-- Encounter Participants
CREATE TABLE IF NOT EXISTS encounter_participants (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('monster', 'npc', 'character')) NOT NULL,
  npc_template_id TEXT,
  character_id TEXT,
  instance_name TEXT NOT NULL,
  display_name_for_players TEXT,
  max_hp INTEGER NOT NULL,
  hp INTEGER NOT NULL,
  ac TEXT NOT NULL,
  ac_state TEXT,
  conditions TEXT NOT NULL DEFAULT '[]',
  initiative INTEGER,
  initiative_status TEXT CHECK (initiative_status IN ('none', 'pending', 'set')) DEFAULT 'none',
  visibility TEXT CHECK (visibility IN ('hidden', 'announced', 'revealed')) DEFAULT 'revealed',
  status TEXT CHECK (status IN ('active', 'defeated', 'fled')) DEFAULT 'active',
  phase TEXT,
  group_id TEXT,
  sort_index INTEGER DEFAULT 0,
  added_at_round INTEGER DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_encounter_participants_encounter ON encounter_participants(encounter_id);
CREATE INDEX IF NOT EXISTS idx_encounter_participants_sort ON encounter_participants(encounter_id, sort_index);

-- Encounter Events
CREATE TABLE IF NOT EXISTS encounter_events (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  visible_to_players INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_encounter_events_encounter ON encounter_events(encounter_id, id);

-- Player notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  character_id TEXT,
  owner_id TEXT NOT NULL,
  campaign_id TEXT,
  title TEXT NOT NULL,
  shared_with_dm INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_owner ON notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_char ON notes(character_id);

-- Rate-limiting and audit log
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  success INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_key_time ON login_attempts(key, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_campaign ON audit_log(campaign_id);

-- 14. Factions table
CREATE TABLE IF NOT EXISTS factions (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  attitude TEXT,
  region TEXT,
  revealed INTEGER DEFAULT 0,
  dm_notes TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_factions_scope ON factions(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_factions_revealed ON factions(revealed);

-- 15. Campaign Docs table (Session zero, house rules, handouts)
CREATE TABLE IF NOT EXISTS campaign_docs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('session_zero', 'house_rules', 'handout_text', 'custom')) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('dm_only', 'party')) DEFAULT 'party',
  sort_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_docs_campaign ON campaign_docs(campaign_id, kind);

-- 16. Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, entity_type, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, entity_type);

-- 17. Clone Jobs table
CREATE TABLE IF NOT EXISTS clone_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  target_scope_type TEXT NOT NULL,
  target_scope_id TEXT NOT NULL,
  options TEXT NOT NULL,
  status TEXT CHECK (status IN ('preview', 'running', 'done', 'failed', 'undone')) NOT NULL,
  manifest TEXT,
  warnings TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER,
  undone_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clone_jobs_user ON clone_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_clone_jobs_target ON clone_jobs(target_scope_type, target_scope_id);

-- ---------------------------------------------------------
-- Legacy tables still queried by functions/api/[[route]].ts
-- (see migrations/004_restore_legacy_contract.sql)
-- ---------------------------------------------------------

-- 38. Account invites (global registration codes)
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT UNIQUE NOT NULL,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  assign_character_id TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invites_code_hash ON invites(code_hash);

-- 39. Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 40. Campaign calendar (single-row legacy calendar)
CREATE TABLE IF NOT EXISTS campaign_calendar (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-calendar',
  year INTEGER NOT NULL DEFAULT 1500,
  month INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  is_off_day INTEGER NOT NULL DEFAULT 0,
  off_day_index INTEGER DEFAULT 0,
  current_festival TEXT,
  updated_at INTEGER NOT NULL
);

-- 41. Campaign endings (single-row JSON)
CREATE TABLE IF NOT EXISTS campaign_endings (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-endings',
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 42. Shan Shin encounters (knowledge-domain encounters)
CREATE TABLE IF NOT EXISTS shanshin_encounters (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanics_note TEXT,
  dm_advice TEXT,
  updated_at INTEGER NOT NULL
);

