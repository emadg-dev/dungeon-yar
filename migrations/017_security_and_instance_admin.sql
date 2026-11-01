-- Migration 017: Security Hardening, Instance Settings, and Platform Admin Console
-- Step 5.3 & Step 5.4

CREATE TABLE IF NOT EXISTS instance_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Seed default instance settings if missing
INSERT OR IGNORE INTO instance_settings (key, value, updated_at) VALUES 
  ('allow_campaign_creation', 'true', 1700000000000),
  ('registration_mode', 'invite', 1700000000000),
  ('per_user_media_quota_bytes', '5242880', 1700000000000),
  ('per_campaign_media_quota_bytes', '52428800', 1700000000000),
  ('storage_warning_threshold_bytes', '419430400', 1700000000000);

-- Extra audit log indexing for campaign-scoped fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_target_created ON audit_log(target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created ON audit_log(actor_id, created_at DESC);
