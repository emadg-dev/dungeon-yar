-- Migration 002: Refactor to Multi-Campaign D&D 5e Platform
-- Idempotent SQL migration for Cloudflare D1

PRAGMA foreign_keys = OFF;

-- 1. Ensure platform_role and avatar_media_id on users
ALTER TABLE users ADD COLUMN platform_role TEXT CHECK (platform_role IN ('admin', 'user')) DEFAULT 'user';
ALTER TABLE users ADD COLUMN avatar_media_id TEXT;

-- Update existing dm role to admin
UPDATE users SET platform_role = 'admin' WHERE role = 'dm' OR platform_role IS NULL;

-- 2. Create Media table
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

-- 3. Create Content Packs table
CREATE TABLE IF NOT EXISTS content_packs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  visibility TEXT CHECK (visibility IN ('private', 'instance')) DEFAULT 'instance',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_packs_owner ON content_packs(owner_id);

-- 4. Create Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_media_id TEXT,
  tone TEXT,
  status TEXT CHECK (status IN ('active', 'paused', 'archived')) DEFAULT 'active',
  owner_id TEXT NOT NULL,
  source_pack_id TEXT,
  settings TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_pack_id) REFERENCES content_packs(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 5. Create Campaign Members table
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

-- 6. Create Campaign Invites table
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

-- 7. Create Rule Sets table
CREATE TABLE IF NOT EXISTS rule_sets (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL,
  scope_id TEXT NOT NULL,
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

-- 8. Create Character Participations table
CREATE TABLE IF NOT EXISTS character_participations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending_approval', 'active', 'rejected', 'retired', 'dead')) DEFAULT 'active',
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
  pending_level_up TEXT,
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(character_id, campaign_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participations_campaign ON character_participations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_character ON character_participations(character_id);

-- 9. Create Character History Events table
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

-- 10. Create Dice Rolls table
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

-- 11. Add scope columns to existing tables if missing
ALTER TABLE class_templates ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE class_templates ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE class_templates ADD COLUMN source_id TEXT;
ALTER TABLE class_templates ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE class_templates ADD COLUMN created_by TEXT;

ALTER TABLE weapon_templates ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE weapon_templates ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE weapon_templates ADD COLUMN source_id TEXT;
ALTER TABLE weapon_templates ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE weapon_templates ADD COLUMN created_by TEXT;

ALTER TABLE items ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE items ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE items ADD COLUMN source_id TEXT;
ALTER TABLE items ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE items ADD COLUMN created_by TEXT;

ALTER TABLE rewards ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE rewards ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE rewards ADD COLUMN source_id TEXT;
ALTER TABLE rewards ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE rewards ADD COLUMN created_by TEXT;

ALTER TABLE npcs ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE npcs ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE npcs ADD COLUMN source_id TEXT;
ALTER TABLE npcs ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE npcs ADD COLUMN created_by TEXT;

ALTER TABLE locations ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE locations ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';
ALTER TABLE locations ADD COLUMN source_id TEXT;
ALTER TABLE locations ADD COLUMN source_mode TEXT DEFAULT 'copy';
ALTER TABLE locations ADD COLUMN created_by TEXT;

ALTER TABLE campaign_notes ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE campaign_notes ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';

ALTER TABLE encounters ADD COLUMN scope_type TEXT DEFAULT 'campaign';
ALTER TABLE encounters ADD COLUMN scope_id TEXT DEFAULT 'zorvania-c1';

-- 12. Verification queries
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_campaigns FROM campaigns;
SELECT COUNT(*) AS total_members FROM campaign_members;
SELECT COUNT(*) AS total_characters FROM characters;
SELECT COUNT(*) AS total_participations FROM character_participations;

PRAGMA foreign_keys = ON;
