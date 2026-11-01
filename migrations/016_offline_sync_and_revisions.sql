-- Migration 016: Step 5.2 PWA, Offline Sync and Revisions
-- Adds revision tracking for character participations and notes to support optimistic offline editing with revision-based conflict detection.
-- Adds sync_conflicts table to audit and resolve concurrent offline edits.
-- Cloudflare D1 (SQLite) with unix-ms timestamps.

PRAGMA foreign_keys = OFF;

-- 1. Ensure revision column on character_participations
ALTER TABLE character_participations ADD COLUMN revision INTEGER DEFAULT 1;

-- 2. Ensure revision column on character_notes
ALTER TABLE character_notes ADD COLUMN revision INTEGER DEFAULT 1;

-- 3. Sync Conflicts table (audits conflict events and their resolutions)
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  participation_id TEXT,
  field TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  server_revision INTEGER NOT NULL,
  client_value TEXT NOT NULL,
  server_value TEXT NOT NULL,
  resolved INTEGER DEFAULT 0,
  resolution TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_campaign ON sync_conflicts(campaign_id, resolved);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts(user_id, resolved);
