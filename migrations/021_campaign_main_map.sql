-- Migration 021: Campaign Main Map, Map Stamps, and Map Features
-- Cloudflare D1 (SQLite) with unix-ms timestamps and UTC dates.
-- Enforces ON DELETE CASCADE and unique partial index for one main map per campaign.

PRAGMA foreign_keys = OFF;

-- 1. Campaign Maps table
CREATE TABLE IF NOT EXISTS campaign_maps (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  media_id TEXT,
  width INTEGER NOT NULL DEFAULT 1000,
  height INTEGER NOT NULL DEFAULT 1000,
  is_main INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_maps_campaign ON campaign_maps(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_maps_main_unique ON campaign_maps(campaign_id) WHERE is_main = 1;

-- 2. Map Stamps table (Library of stamps: fortress, watchtower, custom drawings)
CREATE TABLE IF NOT EXISTS map_stamps (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  media_id TEXT,
  created_by TEXT,
  width INTEGER NOT NULL DEFAULT 128,
  height INTEGER NOT NULL DEFAULT 128,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_map_stamps_campaign ON map_stamps(campaign_id);

-- 3. Map Features table (Terrain polygons, region borders, markers, stamps placed on map)
CREATE TABLE IF NOT EXISTS map_features (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('terrain', 'region', 'marker', 'stamp')) NOT NULL,
  geometry TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  style TEXT NOT NULL DEFAULT '{}',
  link_type TEXT CHECK (link_type IN ('location', 'npc', 'participation') OR link_type IS NULL),
  link_id TEXT,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (map_id) REFERENCES campaign_maps(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_map_features_map ON map_features(map_id, is_revealed);
CREATE INDEX IF NOT EXISTS idx_map_features_campaign ON map_features(campaign_id);

-- 4. Seed Data for Zorvania Campaign (zorvania-c1)
INSERT OR IGNORE INTO campaign_maps (
  id, campaign_id, name, media_id, width, height, is_main, revision, created_at
) VALUES (
  'map-zorvania-main',
  'zorvania-c1',
  'نقشه جهان زروانیا',
  NULL,
  2000,
  1400,
  1,
  1,
  1714000000000
);

INSERT OR IGNORE INTO map_stamps (
  id, campaign_id, name, media_id, created_by, width, height, created_at
) VALUES (
  'stamp-fortress-1',
  'zorvania-c1',
  'دژ کهن کلاغ‌پر',
  NULL,
  'u1',
  64,
  64,
  1714000000000
);

-- Seed Features for Zorvania
INSERT OR IGNORE INTO map_features (
  id, map_id, campaign_id, kind, geometry, label, description, style, link_type, link_id, is_revealed, updated_at
) VALUES
(
  'feat-terrain-forest-1',
  'map-zorvania-main',
  'zorvania-c1',
  'terrain',
  '{"type":"Polygon","coordinates":[[200,300],[250,550],[420,600],[480,450],[350,280]]}',
  'بیشه سیاه ورنا',
  'جنگل کهن و مه‌گرفته در غرب زروانیا که پناهگاه ارواح سرگردان است.',
  '{"terrainType":"forest","fillOpacity":0.35}',
  NULL,
  NULL,
  1,
  1714000000000
),
(
  'feat-terrain-water-1',
  'map-zorvania-main',
  'zorvania-c1',
  'terrain',
  '{"type":"Polygon","coordinates":[[600,800],[620,1100],[780,1200],[850,950],[720,780]]}',
  'دریای خروشان زروان',
  'دریاچه‌ای ژرف و پرآشوب در مشرق که گذرگاه اصلی تجارت قبایل است.',
  '{"terrainType":"water","fillOpacity":0.4}',
  NULL,
  NULL,
  1,
  1714000000000
),
(
  'feat-region-verna',
  'map-zorvania-main',
  'zorvania-c1',
  'region',
  '{"type":"Polygon","coordinates":[[150,200],[180,700],[550,750],[600,250],[300,150]]}',
  'قلمرو ورنا و کوهپایه‌های زاگریا',
  'سرزمین قبیله‌های کهن و آتشکده‌های خاموش‌ناپذیر.',
  '{"strokeWidth":3,"strokeDasharray":"6, 6"}',
  NULL,
  NULL,
  1,
  1714000000000
),
(
  'feat-marker-capital',
  'map-zorvania-main',
  'zorvania-c1',
  'marker',
  '{"type":"Point","coordinates":[380,420]}',
  'آتشکده مرکزی زروان',
  'پایتخت معنوی زروانیا و کانون نگاهبانان آتش باستانی.',
  '{"markerType":"location"}',
  'location',
  'loc-fire-temple',
  1,
  1714000000000
),
(
  'feat-marker-npc-zohak',
  'map-zorvania-main',
  'zorvania-c1',
  'marker',
  '{"type":"Point","coordinates":[280,360]}',
  'اردوگاه فرستاده ضحاک',
  'جایگاه مذاکره با پیروان مار بر دوش.',
  '{"markerType":"npc"}',
  'npc',
  'npc-zohak-emissary',
  1,
  1714000000000
),
(
  'feat-marker-enemy-dragons',
  'map-zorvania-main',
  'zorvania-c1',
  'marker',
  '{"type":"Point","coordinates":[750,1050]}',
  'لانه اژدهایان استخوان',
  'سواحل صخره‌ای پر از هیولاهای باستانی.',
  '{"markerType":"enemy"}',
  NULL,
  NULL,
  1,
  1714000000000
),
(
  'feat-marker-hidden-vault',
  'map-zorvania-main',
  'zorvania-c1',
  'marker',
  '{"type":"Point","coordinates":[520,310]}',
  'سرداب مخفی منشور پیوند',
  'گنجینه‌ای پنهان که تنها دانجن مستر از مختصات دقیق آن باخبر است.',
  '{"markerType":"location"}',
  NULL,
  NULL,
  0,
  1714000000000
),
(
  'feat-stamp-fortress-1',
  'map-zorvania-main',
  'zorvania-c1',
  'stamp',
  '{"type":"Point","coordinates":[320,680]}',
  'دژ کلاغ‌پر',
  'قلعه استراتژیک دیده‌بانی که بر تنگه مشرف است.',
  '{"stampId":"stamp-fortress-1","scale":1.2}',
  NULL,
  NULL,
  1,
  1714000000000
);
