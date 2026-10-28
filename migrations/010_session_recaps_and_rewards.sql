-- Migration 010: Step 4.2 Session Recaps and Rewards (Migration 005 part 2)
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Session Recaps
CREATE TABLE IF NOT EXISTS session_recaps (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('party', 'dm_only')) DEFAULT 'party',
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  linked_npcs TEXT DEFAULT '[]',
  linked_locations TEXT DEFAULT '[]',
  linked_quests TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_recaps_session ON session_recaps(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recaps_campaign ON session_recaps(campaign_id, status, visibility);

-- 2. Session Highlights (per-character notable deeds, generates milestone history events)
CREATE TABLE IF NOT EXISTS session_highlights (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  participation_id TEXT,
  character_id TEXT,
  text TEXT NOT NULL,
  visible_to_player INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_highlights_session ON session_highlights(session_id);
CREATE INDEX IF NOT EXISTS idx_session_highlights_part ON session_highlights(participation_id);
