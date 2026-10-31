-- Migration 014: Step 4.6 Notifications (Step 4.6 in roadmap, In-App Inbox & Push Notifications)
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.

PRAGMA foreign_keys = OFF;

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT,
  type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON containing title, body, deep links, target IDs (NO DM secrets)
  read_at INTEGER, -- NULL = unread, unix-ms timestamp when read
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_campaign ON notifications(campaign_id, created_at DESC);

-- 2. Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_prefs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT, -- NULL for global defaults, or specific campaign
  types TEXT NOT NULL DEFAULT '{}', -- JSON map of NotificationType -> boolean (enabled/muted)
  push_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_prefs(user_id, campaign_id);

-- 3. Web Push Subscriptions table (VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  keys TEXT NOT NULL, -- JSON { p256dh, auth }
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
