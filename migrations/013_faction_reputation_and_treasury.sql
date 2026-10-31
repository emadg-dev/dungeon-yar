-- Migration 013: Step 4.5 Faction Reputation and Party Treasury (Migration 007 part 2)
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Faction Reputation table
CREATE TABLE IF NOT EXISTS faction_reputation (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  participation_id TEXT, -- NULL = whole party reputation, or specific character participation ID
  value INTEGER NOT NULL DEFAULT 0,
  min INTEGER NOT NULL DEFAULT -100,
  max INTEGER NOT NULL DEFAULT 100,
  labels TEXT NOT NULL DEFAULT '[{"threshold":-50,"label":"دشمن خونی"},{"threshold":-10,"label":"خصمانه"},{"threshold":0,"label":"بی‌طرف"},{"threshold":20,"label":"دوستانه"},{"threshold":60,"label":"متحد"}]',
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_faction_reputation_campaign ON faction_reputation(campaign_id, visible);
CREATE INDEX IF NOT EXISTS idx_faction_reputation_faction ON faction_reputation(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_reputation_part ON faction_reputation(participation_id);

-- 2. Reputation Log table
CREATE TABLE IF NOT EXISTS reputation_log (
  id TEXT PRIMARY KEY,
  reputation_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  session_id TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (reputation_id) REFERENCES faction_reputation(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reputation_log_rep ON reputation_log(reputation_id, created_at DESC);

-- 3. Party Items table (Shared Treasury Stash)
CREATE TABLE IF NOT EXISTS party_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'misc',
  notes TEXT DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_party_items_campaign ON party_items(campaign_id, category);

-- 4. Party Currency table (Shared Treasury Balances)
CREATE TABLE IF NOT EXISTS party_currency (
  campaign_id TEXT PRIMARY KEY,
  balances TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- 5. Treasury Log table (Audit Log)
CREATE TABLE IF NOT EXISTS treasury_log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  actor_participation_id TEXT, -- NULL if DM or system
  type TEXT CHECK (type IN ('add', 'remove', 'transfer_in', 'transfer_out', 'currency')) NOT NULL,
  item_ref TEXT,
  qty INTEGER,
  note TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_participation_id) REFERENCES character_participations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_treasury_log_campaign ON treasury_log(campaign_id, created_at DESC);
