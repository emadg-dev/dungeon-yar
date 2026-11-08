PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('player', 'dm')) DEFAULT 'player',
  platform_role TEXT CHECK (platform_role IN ('admin', 'user')) DEFAULT 'user',
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  must_change_password INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  deleted_at INTEGER,
  active_character_id TEXT,
  avatar_url TEXT,
  avatar_media_id TEXT
);
CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  absolute_expires_at INTEGER NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  data BLOB NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE content_packs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  visibility TEXT CHECK (visibility IN ('private', 'instance')) DEFAULT 'instance',
  kind TEXT CHECK (kind IN ('library', 'pack', 'campaign_template')) DEFAULT 'pack',
  tags TEXT DEFAULT '[]',
  is_default_library INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_media_id TEXT,
  tone TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'active',
  owner_id TEXT NOT NULL,
  source_pack_id TEXT,
  settings TEXT NOT NULL,
  wizard_state TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_pack_id) REFERENCES content_packs(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
);
CREATE TABLE campaign_members (
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'co_dm', 'player', 'spectator')) NOT NULL,
  status TEXT CHECK (status IN ('invited', 'active', 'left', 'removed')) DEFAULT 'active',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, user_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE campaign_invites (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  code_hash TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'co_dm', 'player', 'spectator')) DEFAULT 'player',
  label TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  assign_participation_id TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE rule_sets (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL,
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  abilities TEXT NOT NULL,
  skills TEXT NOT NULL,
  saves TEXT NOT NULL,
  currencies TEXT NOT NULL,
  resources TEXT NOT NULL,
  conditions TEXT NOT NULL,
  damage_types TEXT NOT NULL,
  proficiency_bonus_table TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT NOT NULL,
  class_name TEXT,
  level INTEGER DEFAULT 1,
  data TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  ready_for_review INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE character_participations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'active', 'rejected', 'retired', 'dead')) DEFAULT 'active',
  class_id TEXT,
  class_name TEXT,
  subclass_name TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  ability_scores TEXT NOT NULL,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  temp_hp INTEGER DEFAULT 0,
  hit_dice TEXT NOT NULL,
  ac_override INTEGER,
  speed_override INTEGER,
  death_saves TEXT,
  conditions TEXT NOT NULL DEFAULT '[]',
  inventory TEXT NOT NULL DEFAULT '[]',
  weapons TEXT NOT NULL DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT '{"gold":0,"silver":0,"copper":0}',
  custom_resources TEXT NOT NULL DEFAULT '[]',
  spells_known_prepared TEXT,
  spell_slots TEXT,
  features TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  dm_notes TEXT,
  build TEXT DEFAULT '{}',
  sheet_locked INTEGER DEFAULT 1,
  sessions_attended INTEGER DEFAULT 0,
  level_up_available INTEGER DEFAULT 0,
  pending_level_up TEXT,
  pending_change TEXT,
  revision INTEGER DEFAULT 1,
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(character_id, campaign_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE participation_snapshots (
  id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL,
  label TEXT NOT NULL,
  state TEXT NOT NULL,
  build TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE xp_awards (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  participation_id TEXT,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE sheet_change_requests (
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
CREATE TABLE character_revisions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  backstory TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE backstory_comments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE character_history_events (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT,
  event_type TEXT CHECK (event_type IN ('joined', 'level_up', 'death', 'major_deed', 'retired', 'custom')) NOT NULL,
  payload TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);
CREATE TABLE dice_rolls (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  character_id TEXT,
  user_name TEXT NOT NULL,
  character_name TEXT,
  roll_type TEXT NOT NULL,
  dice_expression TEXT NOT NULL,
  total INTEGER NOT NULL,
  details TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('table', 'dm_only')) DEFAULT 'table',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE lineage_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
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
CREATE TABLE background_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
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
CREATE TABLE class_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  copied_at INTEGER,
  starting_equipment_choices TEXT DEFAULT '[]',
  starter_weapon_options TEXT DEFAULT '[]',
  ac_formula_struct TEXT,
  spellcasting_struct TEXT,
  extra_attack_level INTEGER,
  asi_levels TEXT DEFAULT '[4,8,12,16,19]',
  fixed_hp_by_level TEXT DEFAULT '[]',
  base_abilities_struct TEXT,
  features_by_level TEXT DEFAULT '{}',
  subclasses_struct TEXT DEFAULT '[]',
  class_resources_struct TEXT DEFAULT '[]',
  companions_struct TEXT DEFAULT '[]',
  updated_at INTEGER NOT NULL
);
CREATE TABLE feature_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE weapon_templates (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE rewards (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE npcs (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  location_tag TEXT,
  session_tag TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  created_by TEXT,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  dm_notes TEXT,
  revealed INTEGER DEFAULT 0,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
);
CREATE TABLE calendars (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  name TEXT NOT NULL,
  months TEXT NOT NULL,
  off_days TEXT NOT NULL,
  data TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  copied_at INTEGER,
  era_label TEXT DEFAULT 'پ.ر.ن',
  start_year INTEGER DEFAULT 1500,
  weekdays TEXT DEFAULT '["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"]',
  updated_at INTEGER NOT NULL
);
CREATE TABLE calendar_states (
  campaign_id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 1500,
  month INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  is_off_day INTEGER NOT NULL DEFAULT 0,
  off_day_index INTEGER DEFAULT 0,
  current_festival TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE codex_docs (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  is_revealed INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE campaign_notes (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  session_number TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE encounters (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  name TEXT NOT NULL,
  location_id TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'ended')) DEFAULT 'draft',
  round INTEGER DEFAULT 0,
  current_participant_id TEXT,
  session_tag TEXT,
  settings TEXT NOT NULL DEFAULT '{"showExactHp":false,"showAc":false,"showConditions":true,"showDefeated":true,"playerInitiativeRolls":true}',
  version INTEGER DEFAULT 0,
  dm_notes TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);
CREATE TABLE encounter_participants (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('monster', 'npc', 'character')) NOT NULL,
  npc_template_id TEXT,
  character_id TEXT,
  instance_name TEXT NOT NULL,
  display_name_for_players TEXT,
  max_hp INTEGER NOT NULL,
  hp INTEGER NOT NULL,
  ac TEXT NOT NULL,
  ac_state TEXT,
  conditions TEXT NOT NULL DEFAULT '[]',
  initiative INTEGER,
  initiative_status TEXT CHECK (initiative_status IN ('none', 'pending', 'set')) DEFAULT 'none',
  visibility TEXT CHECK (visibility IN ('hidden', 'announced', 'revealed')) DEFAULT 'revealed',
  status TEXT CHECK (status IN ('active', 'defeated', 'fled')) DEFAULT 'active',
  phase TEXT,
  group_id TEXT,
  sort_index INTEGER DEFAULT 0,
  added_at_round INTEGER DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);
CREATE TABLE encounter_events (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  visible_to_players INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE
);
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  character_id TEXT,
  owner_id TEXT NOT NULL,
  campaign_id TEXT,
  title TEXT NOT NULL,
  shared_with_dm INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  revision INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);
CREATE TABLE login_attempts (
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  success INTEGER NOT NULL
);
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE factions (
  id TEXT PRIMARY KEY,
  scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign',
  scope_id TEXT NOT NULL DEFAULT 'zorvania-c1',
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  attitude TEXT,
  region TEXT,
  revealed INTEGER DEFAULT 0,
  dm_notes TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  source_id TEXT,
  source_mode TEXT CHECK (source_mode IN ('copy', 'linked')) DEFAULT 'copy',
  copied_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE campaign_docs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('session_zero', 'house_rules', 'handout_text', 'custom')) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('dm_only', 'party')) DEFAULT 'party',
  sort_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE favorites (
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, entity_type, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE clone_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  target_scope_type TEXT NOT NULL,
  target_scope_id TEXT NOT NULL,
  options TEXT NOT NULL,
  status TEXT CHECK (status IN ('preview', 'running', 'done', 'failed', 'undone')) NOT NULL,
  manifest TEXT,
  warnings TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER,
  undone_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT UNIQUE NOT NULL,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  assign_character_id TEXT,
  revoked_at INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE campaign_calendar (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-calendar',
  year INTEGER NOT NULL DEFAULT 1500,
  month INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  is_off_day INTEGER NOT NULL DEFAULT 0,
  off_day_index INTEGER DEFAULT 0,
  current_festival TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE campaign_endings (
  id TEXT PRIMARY KEY DEFAULT 'zorvania-endings',
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE shanshin_encounters (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanics_note TEXT,
  dm_advice TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE sessions (
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
CREATE TABLE session_rsvps (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('yes', 'no', 'maybe')) NOT NULL,
  note TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE session_polls (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE TABLE session_poll_votes (
  poll_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  choice TEXT CHECK (choice IN ('yes', 'maybe', 'no')) NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (poll_id, option_id, user_id),
  FOREIGN KEY (poll_id) REFERENCES session_polls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE session_attendance (
  session_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  attended INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, participation_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);
CREATE TABLE session_recaps (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('party', 'dm_only')) DEFAULT 'party',
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  linked_npcs TEXT DEFAULT '[]',
  linked_locations TEXT DEFAULT '[]',
  linked_quests TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE session_highlights (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  participation_id TEXT,
  character_id TEXT,
  text TEXT NOT NULL,
  visible_to_player INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE SET NULL
);
CREATE TABLE handouts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('text', 'image', 'map')) NOT NULL,
  body TEXT,
  media_id TEXT,
  visibility TEXT CHECK (visibility IN ('hidden', 'revealed', 'selected')) DEFAULT 'hidden',
  revealed_at INTEGER,
  tags TEXT DEFAULT '[]',
  sort_index INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE handout_recipients (
  handout_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  PRIMARY KEY (handout_id, participation_id),
  FOREIGN KEY (handout_id) REFERENCES handouts(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);
CREATE TABLE map_pins (
  id TEXT PRIMARY KEY,
  handout_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  label TEXT NOT NULL,
  note TEXT,
  revealed INTEGER DEFAULT 1,
  FOREIGN KEY (handout_id) REFERENCES handouts(id) ON DELETE CASCADE
);
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('hidden', 'active', 'completed', 'failed', 'abandoned')) DEFAULT 'active',
  giver_npc_id TEXT,
  location_id TEXT,
  objectives TEXT DEFAULT '[]',
  reward_ref TEXT,
  session_started_id TEXT,
  session_ended_id TEXT,
  dm_notes TEXT DEFAULT '',
  sort_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (giver_npc_id) REFERENCES npcs(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (session_started_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (session_ended_id) REFERENCES sessions(id) ON DELETE SET NULL
);
CREATE TABLE quest_participants (
  quest_id TEXT NOT NULL,
  participation_id TEXT NOT NULL,
  PRIMARY KEY (quest_id, participation_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);
CREATE TABLE faction_reputation (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  participation_id TEXT,
  value INTEGER NOT NULL DEFAULT 0,
  min INTEGER NOT NULL DEFAULT -100,
  max INTEGER NOT NULL DEFAULT 100,
  labels TEXT NOT NULL DEFAULT '[{"threshold":-50,"label":"دشمن خونی"},{"threshold":-10,"label":"خصمانه"},{"threshold":0,"label":"بی‌طرف"},{"threshold":20,"label":"دوستانه"},{"threshold":60,"label":"متحد"}]',
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_id) REFERENCES character_participations(id) ON DELETE CASCADE
);
CREATE TABLE reputation_log (
  id TEXT PRIMARY KEY,
  reputation_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  session_id TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (reputation_id) REFERENCES faction_reputation(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE party_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'misc',
  notes TEXT DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE party_currency (
  campaign_id TEXT PRIMARY KEY,
  balances TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE treasury_log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  actor_participation_id TEXT,
  type TEXT CHECK (type IN ('add', 'remove', 'transfer_in', 'transfer_out', 'currency')) NOT NULL,
  item_ref TEXT,
  qty INTEGER,
  note TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_participation_id) REFERENCES character_participations(id) ON DELETE SET NULL
);
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
CREATE TABLE notification_prefs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT,
  types TEXT NOT NULL DEFAULT '{}',
  push_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(user_id, campaign_id)
);
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  keys TEXT NOT NULL,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE sync_conflicts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  participation_id TEXT,
  field TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  server_revision INTEGER NOT NULL,
  client_value TEXT NOT NULL,
  server_value TEXT NOT NULL,
  resolved INTEGER DEFAULT 0,
  resolution TEXT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE TABLE instance_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT INTO "instance_settings" ("key","value","updated_at") VALUES('qa_final_pass','true',1700000000000);
INSERT INTO "instance_settings" ("key","value","updated_at") VALUES('live_sync_channel','dy_live_sync',1700000000000);
CREATE TABLE edit_grants (
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
CREATE TABLE change_requests (
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_platform_role ON users(platform_role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX idx_media_owner ON media(owner_id);
CREATE INDEX idx_content_packs_owner ON content_packs(owner_id);
CREATE INDEX idx_content_packs_kind ON content_packs(kind);
CREATE INDEX idx_content_packs_default ON content_packs(owner_id, is_default_library);
CREATE INDEX idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id);
CREATE INDEX idx_campaign_members_role ON campaign_members(campaign_id, role);
CREATE INDEX idx_campaign_invites_code ON campaign_invites(code_hash);
CREATE INDEX idx_campaign_invites_campaign ON campaign_invites(campaign_id);
CREATE INDEX idx_rule_sets_scope ON rule_sets(scope_type, scope_id);
CREATE INDEX idx_characters_owner ON characters(owner_id);
CREATE INDEX idx_participations_campaign ON character_participations(campaign_id, status);
CREATE INDEX idx_participations_character ON character_participations(character_id);
CREATE INDEX idx_snapshots_participation ON participation_snapshots(participation_id, created_at DESC);
CREATE INDEX idx_xp_awards_campaign ON xp_awards(campaign_id, created_at DESC);
CREATE INDEX idx_xp_awards_participation ON xp_awards(participation_id);
CREATE INDEX idx_sheet_changes_campaign ON sheet_change_requests(campaign_id, status);
CREATE INDEX idx_sheet_changes_participation ON sheet_change_requests(participation_id);
CREATE INDEX idx_char_revisions_char ON character_revisions(character_id, created_at DESC);
CREATE INDEX idx_backstory_comments_char ON backstory_comments(character_id, section_id, created_at ASC);
CREATE INDEX idx_char_history_char ON character_history_events(character_id, timestamp);
CREATE INDEX idx_dice_rolls_campaign ON dice_rolls(campaign_id, created_at DESC);
CREATE INDEX idx_lineage_templates_scope ON lineage_templates(scope_type, scope_id, updated_at);
CREATE INDEX idx_background_templates_scope ON background_templates(scope_type, scope_id, updated_at);
CREATE INDEX idx_class_templates_scope ON class_templates(scope_type, scope_id, updated_at);
CREATE INDEX idx_feature_templates_scope ON feature_templates(scope_type, scope_id);
CREATE INDEX idx_weapon_templates_scope ON weapon_templates(scope_type, scope_id);
CREATE INDEX idx_items_scope ON items(scope_type, scope_id);
CREATE INDEX idx_items_revealed ON items(is_revealed);
CREATE INDEX idx_rewards_scope ON rewards(scope_type, scope_id);
CREATE INDEX idx_npcs_scope ON npcs(scope_type, scope_id);
CREATE INDEX idx_npcs_revealed ON npcs(is_revealed);
CREATE INDEX idx_locations_scope ON locations(scope_type, scope_id);
CREATE INDEX idx_locations_revealed ON locations(revealed);
CREATE INDEX idx_codex_scope ON codex_docs(scope_type, scope_id);
CREATE INDEX idx_campaign_notes_scope ON campaign_notes(scope_type, scope_id);
CREATE INDEX idx_encounters_scope ON encounters(scope_type, scope_id);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounter_participants_encounter ON encounter_participants(encounter_id);
CREATE INDEX idx_encounter_participants_sort ON encounter_participants(encounter_id, sort_index);
CREATE INDEX idx_encounter_events_encounter ON encounter_events(encounter_id, id);
CREATE INDEX idx_notes_owner ON notes(owner_id);
CREATE INDEX idx_notes_char ON notes(character_id);
CREATE INDEX idx_login_attempts_key_time ON login_attempts(key, created_at);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_campaign ON audit_log(campaign_id);
CREATE INDEX idx_factions_scope ON factions(scope_type, scope_id, updated_at);
CREATE INDEX idx_factions_revealed ON factions(revealed);
CREATE INDEX idx_campaign_docs_campaign ON campaign_docs(campaign_id, kind);
CREATE INDEX idx_favorites_user ON favorites(user_id, entity_type);
CREATE INDEX idx_clone_jobs_user ON clone_jobs(user_id);
CREATE INDEX idx_clone_jobs_target ON clone_jobs(target_scope_type, target_scope_id);
CREATE INDEX idx_invites_code_hash ON invites(code_hash);
CREATE INDEX idx_sessions_campaign ON sessions(campaign_id, status);
CREATE INDEX idx_sessions_scheduled ON sessions(campaign_id, scheduled_at);
CREATE INDEX idx_session_rsvps_session ON session_rsvps(session_id);
CREATE INDEX idx_session_rsvps_user ON session_rsvps(user_id);
CREATE INDEX idx_session_polls_session ON session_polls(session_id);
CREATE INDEX idx_session_poll_votes_poll ON session_poll_votes(poll_id);
CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_recaps_session ON session_recaps(session_id);
CREATE INDEX idx_session_recaps_campaign ON session_recaps(campaign_id, status, visibility);
CREATE INDEX idx_session_highlights_session ON session_highlights(session_id);
CREATE INDEX idx_session_highlights_part ON session_highlights(participation_id);
CREATE INDEX idx_handouts_campaign ON handouts(campaign_id, visibility, sort_index);
CREATE INDEX idx_handouts_media ON handouts(media_id);
CREATE INDEX idx_handout_recipients_part ON handout_recipients(participation_id);
CREATE INDEX idx_map_pins_handout ON map_pins(handout_id);
CREATE INDEX idx_quests_campaign ON quests(campaign_id, status, sort_index);
CREATE INDEX idx_quests_giver ON quests(giver_npc_id);
CREATE INDEX idx_quests_location ON quests(location_id);
CREATE INDEX idx_quests_session_started ON quests(session_started_id);
CREATE INDEX idx_quests_session_ended ON quests(session_ended_id);
CREATE INDEX idx_quest_participants_part ON quest_participants(participation_id);
CREATE INDEX idx_faction_reputation_campaign ON faction_reputation(campaign_id, visible);
CREATE INDEX idx_faction_reputation_faction ON faction_reputation(faction_id);
CREATE INDEX idx_faction_reputation_part ON faction_reputation(participation_id);
CREATE INDEX idx_reputation_log_rep ON reputation_log(reputation_id, created_at DESC);
CREATE INDEX idx_party_items_campaign ON party_items(campaign_id, category);
CREATE INDEX idx_treasury_log_campaign ON treasury_log(campaign_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_campaign ON notifications(campaign_id, created_at DESC);
CREATE INDEX idx_notification_prefs_user ON notification_prefs(user_id, campaign_id);
CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX idx_char_history_campaign_time ON character_history_events(campaign_id, timestamp DESC);
CREATE INDEX idx_participations_char_status ON character_participations(character_id, status);
CREATE INDEX idx_sessions_campaign_scheduled ON sessions(campaign_id, scheduled_at ASC);
CREATE INDEX idx_members_user_status ON campaign_members(user_id, status);
CREATE INDEX idx_sync_conflicts_campaign ON sync_conflicts(campaign_id, resolved);
CREATE INDEX idx_sync_conflicts_user ON sync_conflicts(user_id, resolved);
CREATE INDEX idx_audit_log_target_created ON audit_log(target_id, created_at DESC);
CREATE INDEX idx_audit_log_actor_created ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_instance_settings_key ON instance_settings(key);
CREATE INDEX idx_dice_rolls_campaign_vis ON dice_rolls(campaign_id, visibility, created_at DESC);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_sessions_revoked ON auth_sessions(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX idx_edit_grants_part ON edit_grants(participation_id);
CREATE INDEX idx_edit_grants_status ON edit_grants(status);
CREATE INDEX idx_change_requests_part ON change_requests(participation_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);