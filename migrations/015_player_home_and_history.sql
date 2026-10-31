-- Migration 015: Step 5.1 Player Home and History Polish
-- Optimizations and indexing for player home, past campaigns, next-session countdown, and scoped history timeline.
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- Index for querying character history events by campaign and timestamp (for DM-scoped filtering)
CREATE INDEX IF NOT EXISTS idx_char_history_campaign_time ON character_history_events(campaign_id, timestamp DESC);

-- Index for fast lookup of character participations by character and status
CREATE INDEX IF NOT EXISTS idx_participations_char_status ON character_participations(character_id, status);

-- Index for fast lookup of upcoming sessions by campaign
CREATE INDEX IF NOT EXISTS idx_sessions_campaign_scheduled ON sessions(campaign_id, scheduled_at ASC);

-- Index for fast membership lookup by user and status
CREATE INDEX IF NOT EXISTS idx_members_user_status ON campaign_members(user_id, status);
