-- Migration 009: Step 4.1 Sessions and Scheduling
-- Persian only, Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Rename existing auth sessions table to auth_sessions to avoid name collision
ALTER TABLE sessions RENAME TO auth_sessions;

-- 2. Create game sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TEXT,
  duration_minutes INTEGER DEFAULT 180,
  place_text TEXT,
  online_url TEXT,
  status TEXT CHECK (status IN ('planned', 'confirmed', 'done', 'cancelled')) DEFAULT 'planned',
  in_world_date TEXT,
  dm_notes TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON sessions(campaign_id, scheduled_at);

-- 3. Session RSVPs
CREATE TABLE IF NOT EXISTS session_rsvps (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('yes', 'no', 'maybe')) NOT NULL,
  note TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_rsvps_session ON session_rsvps(session_id);
CREATE INDEX IF NOT EXISTS idx_session_rsvps_user ON session_rsvps(user_id);

-- 4. Session Polls (Propose Dates)
CREATE TABLE IF NOT EXISTS session_polls (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_polls_session ON session_polls(session_id);

-- 5. Session Poll Votes
CREATE TABLE IF NOT EXISTS session_poll_votes (
  poll_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  choice TEXT CHECK (choice IN ('yes', 'maybe', 'no')) NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (poll_id, option_id, user_id),
  FOREIGN KEY (poll_id) REFERENCES session_polls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_poll_votes_poll ON session_poll_votes(poll_id);

-- 6. Session Attendance
CREATE TABLE IF NOT EXISTS session_attendance (
  session_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  attended INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, participation_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);

-- 7. Add sessions_attended to character_participations
ALTER TABLE character_participations ADD COLUMN sessions_attended INTEGER DEFAULT 0;

PRAGMA foreign_keys = ON;
