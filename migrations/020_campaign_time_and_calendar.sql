-- Migration 020: Multi-calendar and Campaign Time
-- Adds campaign_time table, optional in_game_epoch_day to sessions,
-- festivals and weekday_index columns to calendars, and backfills Zorvania.

CREATE TABLE IF NOT EXISTS campaign_time (
  campaign_id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  epoch_day INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_time_cal ON campaign_time(calendar_id);

-- Add optional in_game_epoch_day to sessions if not already present
-- SQLite allows ALTER TABLE ADD COLUMN
ALTER TABLE sessions ADD COLUMN in_game_epoch_day INTEGER;

-- Add festivals and weekday_index to calendars
ALTER TABLE calendars ADD COLUMN festivals TEXT DEFAULT '[]';
ALTER TABLE calendars ADD COLUMN weekday_index INTEGER DEFAULT 0;

-- Backfill existing campaign_calendar into campaign_time for zorvania-c1
-- Preserve precise date: epochDay = (year - 1500) * 365 + (is_off_day ? 360 + (off_day_index - 1) : (month - 1) * 30 + (day - 1))
INSERT OR IGNORE INTO campaign_time (campaign_id, calendar_id, epoch_day, updated_at)
SELECT
  'zorvania-c1',
  'cal-zorvania',
  CASE
    WHEN is_off_day = 1 THEN (year - 1500) * 365 + 360 + MAX(0, off_day_index - 1)
    ELSE (year - 1500) * 365 + (month - 1) * 30 + MAX(0, day - 1)
  END,
  updated_at
FROM campaign_calendar
WHERE id = 'zorvania-calendar' OR id = 'zorvania-c1';

-- Fallback default if campaign_calendar was empty
INSERT OR IGNORE INTO campaign_time (campaign_id, calendar_id, epoch_day, updated_at)
VALUES ('zorvania-c1', 'cal-zorvania', 0, 1714000000000);

-- Ensure seed calendar has festivals and weekday_index populated
INSERT OR IGNORE INTO calendars (
  id, scope_type, scope_id, source_id, name, months, off_days, festivals, weekday_index, data, tags, era_label, start_year, weekdays, updated_at
) VALUES (
  'cal-zorvania',
  'campaign',
  'zorvania-c1',
  NULL,
  'گاه‌شمار شاه‌روزان (زروانیا)',
  '[{"name":"فرورداد","days":30,"season":"بهار"},{"name":"اردی‌مهر","days":30,"season":"بهار"},{"name":"خورداد","days":30,"season":"بهار"},{"name":"تیرآذر","days":30,"season":"تابستان"},{"name":"امرداد","days":30,"season":"تابستان"},{"name":"شهریور","days":30,"season":"تابستان"},{"name":"مهرآیین","days":30,"season":"پاییز"},{"name":"آبان‌داد","days":30,"season":"پاییز"},{"name":"آذرپژواک","days":30,"season":"پاییز"},{"name":"دی‌مهر","days":30,"season":"زمستان"},{"name":"بهمن‌یار","days":30,"season":"زمستان"},{"name":"اسفندارمذ","days":30,"season":"زمستان"}]',
  '[{"id":"off-1","name":"گاه اول: اهنود","note":"روز اول بیرون از تقویم - سکوت میان زمان‌ها"},{"id":"off-2","name":"گاه دوم: اشتود","note":"روز دوم بیرون از تقویم - یادبود دیوان نیک‌نهاد"},{"id":"off-3","name":"گاه سوم: سپنتمد","note":"روز سوم بیرون از تقویم - نذر آب و ریشه"},{"id":"off-4","name":"گاه چهارم: وهوخشتر","note":"روز چهارم بیرون از تقویم - درخشش آسمان سرخ"},{"id":"off-5","name":"گاه پنجم: وهیشتوآیشت","note":"روز پنجم بیرون از تقویم - باززایی زمان"}]',
  '[{"name":"جشن روز نخست (نوروز کهن)","monthIndex":1,"day":1,"note":"آغاز تقویم و برافروختن اخگر"},{"name":"مهرگان زروانیا","monthIndex":7,"day":16,"note":"پیمان میان قبایل"},{"name":"جشن آذرخش","monthIndex":9,"day":9,"note":"پالایش آتشکده‌ها"}]',
  0,
  '{}',
  '["زروانیا","گاه‌شمار","شاه‌روزان"]',
  'پ.ر.ن',
  1500,
  '["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"]',
  1714000000000
);
