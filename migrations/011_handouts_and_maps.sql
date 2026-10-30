-- Migration 011: Step 4.3 Handouts and Maps (Migration 006)
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Handouts table (Text scrolls, images, interactive maps)
CREATE TABLE IF NOT EXISTS handouts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('text', 'image', 'map')) NOT NULL,
  body TEXT,
  media_id TEXT,
  visibility TEXT CHECK (visibility IN ('hidden', 'revealed', 'selected')) DEFAULT 'hidden',
  revealed_at INTEGER,
  tags TEXT DEFAULT '[]',
  sort_index INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_handouts_campaign ON handouts(campaign_id, visibility, sort_index);
CREATE INDEX IF NOT EXISTS idx_handouts_media ON handouts(media_id);

-- 2. Handout Recipients table (Selective reveals to specific character participations)
CREATE TABLE IF NOT EXISTS handout_recipients (
  handout_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  PRIMARY KEY (handout_id, participation_id),
  FOREIGN KEY (handout_id) REFERENCES handouts(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_handout_recipients_part ON handout_recipients(participation_id);

-- 3. Map Pins table (Pins on map handouts with percentage coords and revealed flags)
CREATE TABLE IF NOT EXISTS map_pins (
  id TEXT PRIMARY KEY,
  handout_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  revealed INTEGER DEFAULT 1,
  FOREIGN KEY (handout_id) REFERENCES handouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_map_pins_handout ON map_pins(handout_id);
