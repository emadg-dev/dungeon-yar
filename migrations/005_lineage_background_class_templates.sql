-- Migration 005: Lineage & Background Templates, Extended Class Templates
-- D1 SQLite migration with unix-ms timestamps (Persian RTL D&D 5e Platform)

PRAGMA foreign_keys = OFF;

-- 1. Create Lineage Templates table
CREATE TABLE IF NOT EXISTS lineage_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL,
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  tags TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT 'متوسط (Medium)',
  speed INTEGER NOT NULL DEFAULT 30,
  ability_bonuses TEXT NOT NULL DEFAULT '{"mode":"fixed","fixed":{},"chooseCount":0,"chooseValue":1}',
  traits TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '["مشترک"]',
  proficiencies TEXT NOT NULL DEFAULT '{"skills":[],"weapons":[],"armor":[],"tools":[]}',
  resistances TEXT NOT NULL DEFAULT '[]',
  senses TEXT NOT NULL DEFAULT '{"darkvision":0}',
  sublineages TEXT NOT NULL DEFAULT '[]',
  name_suggestions TEXT NOT NULL DEFAULT '[]',
  backstory_prompts TEXT NOT NULL DEFAULT '[]',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lineage_templates_scope ON lineage_templates(scope_type, scope_id, updated_at);

-- 2. Create Background Templates table
CREATE TABLE IF NOT EXISTS background_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL,
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  tags TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  skill_proficiencies TEXT NOT NULL DEFAULT '[]',
  tool_proficiencies TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '[]',
  starting_equipment TEXT NOT NULL DEFAULT '[]',
  feature_name TEXT NOT NULL DEFAULT '',
  feature_description TEXT NOT NULL DEFAULT '',
  personality_tables TEXT NOT NULL DEFAULT '{"traits":[],"ideals":[],"bonds":[],"flaws":[]}',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_background_templates_scope ON background_templates(scope_type, scope_id, updated_at);

-- 3. Extend Class Templates table with structured fields
ALTER TABLE class_templates ADD COLUMN starting_equipment_choices TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN starter_weapon_options TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN ac_formula_struct TEXT;
ALTER TABLE class_templates ADD COLUMN spellcasting_struct TEXT;
ALTER TABLE class_templates ADD COLUMN extra_attack_level INTEGER;
ALTER TABLE class_templates ADD COLUMN asi_levels TEXT DEFAULT '[4,8,12,16,19]';
ALTER TABLE class_templates ADD COLUMN fixed_hp_by_level TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN base_abilities_struct TEXT;
ALTER TABLE class_templates ADD COLUMN features_by_level TEXT DEFAULT '{}';
ALTER TABLE class_templates ADD COLUMN subclasses_struct TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN class_resources_struct TEXT DEFAULT '[]';
ALTER TABLE class_templates ADD COLUMN companions_struct TEXT DEFAULT '[]';

PRAGMA foreign_keys = ON;
