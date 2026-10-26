-- Zorvania TTRPG - Cloudflare D1 Database Schema
-- Production SQLite schema for Cloudflare D1 (timestamps = integer unix ms)

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('player', 'dm')) DEFAULT 'player',
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  must_change_password INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  deleted_at INTEGER,
  active_character_id TEXT,
  avatar_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Sessions table
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

-- Invites table
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

-- Password resets table
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

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);

-- Rate-limiting and abuse tracking table
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  success INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_key_time ON login_attempts(key, created_at);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Characters table (optimistic concurrency with revision)
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

-- Player notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  character_id TEXT,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  shared_with_dm INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_char ON notes(character_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner ON notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_shared ON notes(shared_with_dm);

-- NPCs and Monsters table
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  location_tag TEXT,
  session_tag TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_npcs_revealed ON npcs(is_revealed);

-- Item and Artifact Library table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_revealed ON items(is_revealed);

-- Weapon Templates table
CREATE TABLE IF NOT EXISTS weapon_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Class Templates table
CREATE TABLE IF NOT EXISTS class_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Locations table (world locations & points of interest)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_locations_revealed ON locations(revealed);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);

-- Encounters table (live, player-visible combat encounters)
CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_location ON encounters(location_id);

-- Encounter Participants table (instances of monsters, NPCs, and linked characters)
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

-- Encounter Events table (live combat log & player-visible combat feed)
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

-- Reward Packages table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- DM Campaign Notes table (DM only)
CREATE TABLE IF NOT EXISTS campaign_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  session_number TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Zorvania Calendar table
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

-- Campaign Ending Tracker table
CREATE TABLE IF NOT EXISTS campaign_endings (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-endings',
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Shanshin Random Encounters table (DM editable)
CREATE TABLE IF NOT EXISTS shanshin_encounters (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanics_note TEXT,
  dm_advice TEXT,
  updated_at INTEGER NOT NULL
);
