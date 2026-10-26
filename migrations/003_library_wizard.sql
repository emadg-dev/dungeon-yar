-- Migration 003: Campaign Wizard, DM Library, Clone Engine & Content Entities
-- Idempotent SQL migration for Cloudflare D1 (timestamps = unix-ms)

PRAGMA foreign_keys = OFF;

-- 1. Extend content_packs with kind, tags, is_default_library
ALTER TABLE content_packs ADD COLUMN kind TEXT CHECK (kind IN ('library', 'pack', 'campaign_template')) DEFAULT 'pack';
ALTER TABLE content_packs ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE content_packs ADD COLUMN is_default_library INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_packs_kind ON content_packs(kind);
CREATE INDEX IF NOT EXISTS idx_content_packs_default ON content_packs(owner_id, is_default_library);

-- 2. Extend campaigns for draft status and wizard_state
-- In SQLite, we can add wizard_state column to campaigns
ALTER TABLE campaigns ADD COLUMN wizard_state TEXT;

-- 3. Extend existing content entity tables with tags, copied_at, and updated_at
ALTER TABLE class_templates ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN copied_at INTEGER;

ALTER TABLE feature_templates ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE feature_templates ADD COLUMN copied_at INTEGER;

ALTER TABLE weapon_templates ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE weapon_templates ADD COLUMN copied_at INTEGER;

ALTER TABLE items ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE items ADD COLUMN copied_at INTEGER;

ALTER TABLE rewards ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE rewards ADD COLUMN copied_at INTEGER;
ALTER TABLE rewards ADD COLUMN updated_at INTEGER;
UPDATE rewards SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE npcs ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE npcs ADD COLUMN copied_at INTEGER;

ALTER TABLE locations ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE locations ADD COLUMN copied_at INTEGER;

ALTER TABLE calendars ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE calendars ADD COLUMN copied_at INTEGER;
ALTER TABLE calendars ADD COLUMN era_label TEXT DEFAULT 'پ.ر.ن';
ALTER TABLE calendars ADD COLUMN start_year INTEGER DEFAULT 1500;
ALTER TABLE calendars ADD COLUMN weekdays TEXT DEFAULT '["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"]';

ALTER TABLE rule_sets ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE rule_sets ADD COLUMN copied_at INTEGER;

ALTER TABLE codex_docs ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE codex_docs ADD COLUMN copied_at INTEGER;

ALTER TABLE encounters ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE encounters ADD COLUMN copied_at INTEGER;

-- 4. Create Factions table
CREATE TABLE IF NOT EXISTS factions (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL,
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

-- 5. Create Campaign Docs table (Session Zero, House Rules, Handouts)
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

-- 6. Create Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, entity_type, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, entity_type);

-- 7. Create Clone Jobs table
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

-- 8. Composite indexes on (scope_type, scope_id, updated_at) for fast library and sync queries
CREATE INDEX IF NOT EXISTS idx_class_templates_scope_time ON class_templates(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_feature_templates_scope_time ON feature_templates(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_weapon_templates_scope_time ON weapon_templates(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_items_scope_time ON items(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_npcs_scope_time ON npcs(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_locations_scope_time ON locations(scope_type, scope_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_encounters_scope_time ON encounters(scope_type, scope_id, updated_at);

PRAGMA foreign_keys = ON;
