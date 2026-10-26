-- Zorvania TTRPG - Cloudflare D1 Database Schema
-- Production SQLite schema for Cloudflare D1

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player', -- 'dm' or 'player'
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Characters table (optimistic concurrency with revision)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT,
  level INTEGER DEFAULT 1,
  data TEXT NOT NULL, -- Full JSON payload of Character
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_characters_owner ON characters(owner_id);

-- Player notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  shared_with_dm INTEGER NOT NULL DEFAULT 0, -- 0 for private, 1 for shared
  data TEXT NOT NULL, -- Full JSON payload of CharacterNote
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_char ON notes(character_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner ON notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_shared ON notes(shared_with_dm);

-- NPCs and Monsters table
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0, -- 1 = visible to players, 0 = DM only
  location_tag TEXT,
  session_tag TEXT,
  data TEXT NOT NULL, -- Full JSON payload of NPC
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_npcs_revealed ON npcs(is_revealed);

-- Item and Artifact Library table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0, -- 1 = visible to players, 0 = DM only
  data TEXT NOT NULL, -- Full JSON payload of ItemLibraryEntry
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_items_revealed ON items(is_revealed);

-- Weapon Templates table
CREATE TABLE IF NOT EXISTS weapon_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON WeaponTemplate
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Class Templates table
CREATE TABLE IF NOT EXISTS class_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON ClassTemplate
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Encounters table (persisted combat state)
CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  session_tag TEXT,
  data TEXT NOT NULL, -- JSON Encounter with combatants, round, notes
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reward Packages table
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON RewardPackage
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- DM Campaign Notes table (DM only)
CREATE TABLE IF NOT EXISTS campaign_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  session_number TEXT,
  data TEXT NOT NULL, -- JSON CampaignNote
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Campaign Ending Tracker table
CREATE TABLE IF NOT EXISTS campaign_endings (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-endings',
  data TEXT NOT NULL, -- JSON CampaignEndingState
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shanshin Random Encounters table (DM editable)
CREATE TABLE IF NOT EXISTS shanshin_encounters (
  id INTEGER PRIMARY KEY, -- 1 to 8
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanics_note TEXT,
  dm_advice TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
