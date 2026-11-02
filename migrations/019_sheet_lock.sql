-- Migration 019: Sheet Lock — edit_grants + change_requests
CREATE TABLE IF NOT EXISTS edit_grants (
  id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL,
  scope TEXT CHECK (scope IN ('preset','fields')) NOT NULL DEFAULT 'preset',
  preset TEXT CHECK (preset IN ('respec','level_up','ability_scores','spell_swap','inventory_add','full')),
  fields TEXT NOT NULL DEFAULT '[]',
  expires_at INTEGER,
  uses_left INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT CHECK (status IN ('active','consumed','expired','revoked')) DEFAULT 'active',
  granted_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_edit_grants_part ON edit_grants(participation_id);
CREATE INDEX IF NOT EXISTS idx_edit_grants_status ON edit_grants(status);

CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL,
  field_group TEXT NOT NULL,
  patch TEXT NOT NULL DEFAULT '{}',
  reason TEXT,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  comment TEXT,
  decided_by TEXT,
  decided_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_change_requests_part ON change_requests(participation_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
