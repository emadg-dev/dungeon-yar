-- Migration 012: Step 4.4 Quest Log (Migration 007 part 1)
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Quests table
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('hidden', 'active', 'completed', 'failed', 'abandoned')) DEFAULT 'active',
  giver_npc_id TEXT,
  location_id TEXT,
  objectives TEXT DEFAULT '[]',
  reward_ref TEXT,
  session_started_id TEXT,
  session_ended_id TEXT,
  dm_notes TEXT DEFAULT '',
  sort_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (giver_npc_id) REFERENCES npcs(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (session_started_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (session_ended_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quests_campaign ON quests(campaign_id, status, sort_index);
CREATE INDEX IF NOT EXISTS idx_quests_giver ON quests(giver_npc_id);
CREATE INDEX IF NOT EXISTS idx_quests_location ON quests(location_id);
CREATE INDEX IF NOT EXISTS idx_quests_session_started ON quests(session_started_id);
CREATE INDEX IF NOT EXISTS idx_quests_session_ended ON quests(session_ended_id);

-- 2. Quest Participants table (For selective/personal character quests)
CREATE TABLE IF NOT EXISTS quest_participants (
  quest_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  PRIMARY KEY (quest_id, participation_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quest_participants_part ON quest_participants(participation_id);
