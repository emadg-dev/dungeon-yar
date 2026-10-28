-- Migration 007: Level-Up, XP Awards, Approvals & Sheet Lock (Step 3.4)
-- D1 SQLite migration with unix-ms timestamps (Persian RTL D&D 5e Platform)

PRAGMA foreign_keys = OFF;

-- 1. Create XP Awards table
CREATE TABLE IF NOT EXISTS xp_awards (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  participation_id TEXT, -- NULL denotes party-wide award
  amount INTEGER NOT NULL,
  reason TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_xp_awards_campaign ON xp_awards(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_awards_participation ON xp_awards(participation_id);

-- 2. Create Sheet Change Requests table
CREATE TABLE IF NOT EXISTS sheet_change_requests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  requested_changes TEXT NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  review_comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sheet_changes_campaign ON sheet_change_requests(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_sheet_changes_participation ON sheet_change_requests(participation_id);

-- 3. Extend character_participations with level_up_available and pending_change
ALTER TABLE character_participations ADD COLUMN level_up_available INTEGER DEFAULT 0;
ALTER TABLE character_participations ADD COLUMN pending_change TEXT;

PRAGMA foreign_keys = ON;
