-- Migration 018: Final QA Pass — Stability Indexes, Instance Settings Update, Clean-up
-- Step 5.6

-- Ensure instance_settings exists with latest default (already in 017; safe-idempotent)
CREATE INDEX IF NOT EXISTS idx_instance_settings_key ON instance_settings(key);

-- Final QA: index on dice_rolls visibility + campaign for shared feed performance
CREATE INDEX IF NOT EXISTS idx_dice_rolls_campaign_vis ON dice_rolls(campaign_id, visibility, created_at DESC);

-- Final QA: index on notification preferences for mute checks
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_prefs(user_id, campaign_id);

-- Final QA: cleanup old soft-deleted users / sessions for storage stats accuracy
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON auth_sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Final QA seed/default if instance_settings missing
INSERT OR IGNORE INTO instance_settings (key, value, updated_at) VALUES 
  ('qa_final_pass', 'true', 1700000000000),
  ('live_sync_channel', 'dy_live_sync', 1700000000000);
