-- Migration 008: Backstory Tools, Revisions & Comments (Step 3.5)
-- D1 SQLite migration with unix-ms timestamps (Persian RTL D&D 5e Platform)

PRAGMA foreign_keys = OFF;

-- 1. Create character_revisions table (keeps last 10 revisions per character)
CREATE TABLE IF NOT EXISTS character_revisions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  backstory TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_char_revisions_char ON character_revisions(character_id, created_at DESC);

-- 2. Create backstory_comments table (per-section threaded resolvable feedback)
CREATE TABLE IF NOT EXISTS backstory_comments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backstory_comments_char ON backstory_comments(character_id, section_id, created_at ASC);

-- 3. Extend characters table with ready_for_review flag
ALTER TABLE characters ADD COLUMN ready_for_review INTEGER DEFAULT 0;

PRAGMA foreign_keys = ON;
