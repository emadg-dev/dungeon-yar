-- Migration 006: Character Creation Wizard, Snapshots & Build JSON
-- D1 SQLite migration with unix-ms timestamps (Persian RTL D&D 5e Platform)

PRAGMA foreign_keys = OFF;

-- 1. Extend character_participations table with build, sheet_locked
ALTER TABLE character_participations ADD COLUMN build TEXT DEFAULT '{}';
ALTER TABLE character_participations ADD COLUMN sheet_locked INTEGER DEFAULT 1;

-- 2. Create Participation Snapshots table (keeps last 10 snapshots per participation)
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

PRAGMA foreign_keys = ON;
