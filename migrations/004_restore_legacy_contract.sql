-- Migration 004: restore the legacy auth & data contract used by
-- functions/api/[[route]].ts (the deployed Pages Function).
--
-- Background: the consolidated schema.sql (commit 0620e70) dropped the
-- users.role column, the JSON-blob characters model, and 5 legacy tables that
-- the Pages Function still queries. Without them:
--   * /auth/register fails with "no such column: role"
--   * every session lookup (/auth/me) returns null -> "not logged in"
--
-- NOTE: `characters` is dropped and rebuilt, so run this against a fresh /
-- empty database (or after backing up character rows and re-inserting them
-- into the rebuilt table).

-- 1. users.role — guarded; schema.sql already defines role (line 12)
-- If role missing, add; else skip safely.
SELECT CASE WHEN (SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='role') = 0 THEN 'yes' ELSE 'no' END AS needs_role;
-- Only execute if needed (manual guard; SQLite has no IF NOT EXISTS for ALTER)
-- 1. users.role — handled by schema.sql (line 12); skip destructive ALTER
-- (LEGACY GUARD: role column already exists in schema.sql for all fresh installs)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. characters — preserved from schema.sql (line 161); do NOT drop/rebuild
-- (LEGACY GUARD: drop destroyed live data; use schema.sql definition instead)
-- CREATE TABLE IF NOT EXISTS characters (...); -- not needed if schema.sql applied
CREATE INDEX IF NOT EXISTS idx_characters_owner ON characters(owner_id);

-- 3. Legacy tables still queried by the function
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

CREATE TABLE IF NOT EXISTS campaign_endings (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-endings',
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shanshin_encounters (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanics_note TEXT,
  dm_advice TEXT,
  updated_at INTEGER NOT NULL
);
