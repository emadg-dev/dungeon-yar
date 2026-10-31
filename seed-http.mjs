import fs from 'fs';
import { SEED_USERS, SEED_CHARACTERS, SEED_CAMPAIGNS, SEED_MEMBERS, SEED_LOCATIONS, SEED_ITEMS } from './src/data/seed.ts';

// Function to hash passwords (simplified for demo)
function hashPassword(password) {
  // In production, use bcrypt or argon2
  return `hash:${password}`;
}

function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  // Escape single quotes and replace Persian semicolon with Arabic comma to prevent SQL parsing issues
  const cleaned = String(v).replace(/'/g, "''").replace(/؛/g, "،");
  return `'${cleaned}'`;
}

// ---------------------------------------------------------------- users
const USER_PASSWORD = 'Zorvania@123';
const userRows = SEED_USERS.map((u) => ({
  id: u.id,
  email: u.email,
  display_name: u.displayName || u.name,
  password_hash: hashPassword(USER_PASSWORD),
  role: u.role === 'dm' ? 'dm' : 'player',
  is_verified: true,
  last_login: null,
  created_at: new Date().toISOString(),
}));

// ---------------------------------------------------------------- characters
const characterRows = SEED_CHARACTERS.map((c) => ({
  id: c.id,
  user_id: c.userId,
  name: c.name,
  bio: c.bio || null,
  portrait: c.portrait || null,
  level: c.level || 1,
  experience: c.experience || 0,
  alignment: c.alignment || 'neutral',
  ac: c.ac,
  hp_current: c.hpCurrent,
  hp_max: c.hpMax,
  initiative: c.initiative,
  initiative_mod: 0,
  race: c.race || 'human',
  class: c.class,
  sub_class: c.subClass || null,
  background: c.background || null,
  born: c.born || null,
  death: c.death || null,
  languages: c.languages || null,
  deity: c.deity || null,
  gender: c.gender || null,
  age: c.age || null,
  height: c.height || null,
  weight: c.weight || null,
  eyes: c.eyes || null,
  skin: c.skin || null,
  hair: c.hair || null,
  features_traits: c.featuresTraits || null,
  personality: c.personality || null,
  ideal: c.ideal || null,
  bond: c.bond || null,
  flaw: c.flaw || null,
  spells: c.spells || null,
  equipment: c.equipment || null,
  personal_notes: c.personalNotes || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// ---------------------------------------------------------------- campaigns
const campaignRows = SEED_CAMPAIGNS.map((c) => ({
  id: c.id,
  dm_id: c.dmId || null,
  name: c.name,
  description: c.description || null,
  story: c.story || null,
  image: c.image || null,
  status: c.status || 'active',
  start_date: c.startDate || new Date().toISOString(),
  end_date: c.endDate || null,
  system: c.system || 'dnd5e',
  notes: c.notes,
  member_limit: c.memberLimit || 10,
  current_members: c.currentMembers || 0,
  cover_art: c.coverArt || null,
  tags: c.tags || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// ---------------------------------------------------------------- members
const memberRows = SEED_MEMBERS.map((m) => ({
  id: m.id,
  campaign_id: m.campaignId,
  user_id: m.userId || null,
  character_id: m.characterId || null,
  joined_at: new Date().toISOString(),
  status: m.status || 'active',
  role: m.role || 'member',
}));

// ---------------------------------------------------------------- locations
const locationRows = SEED_LOCATIONS.map((l) => ({
  id: l.id,
  campaign_id: l.campaignId || null,
  name: l.name,
  description: l.description || null,
  region: l.region || null,
  image_url: l.imageUrl || null,
  coordinates: l.coordinates || null,
  dm_notes: l.dmNotes || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// ---------------------------------------------------------------- items
const itemRows = SEED_ITEMS.map((i) => ({
  id: i.id,
  name: i.name,
  description: i.description || null,
  type: i.type || 'misc',
  rarity: i.rarity || 'common',
  weight: i.weight || 0,
  value: i.value || 0,
  requires_attunement: i.requiresAttunement || false,
  properties: i.properties || null,
  effect: i.effect || null,
  charges: i.charges || null,
  dm_notes: i.dmNotes || null,
  campaign_id: i.campaignId || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

function generateSQL() {
  const statements = [];
  
  // users
  statements.push('-- ' + (userRows.length * 7) + ' users');
  statements.push('BEGIN TRANSACTION;');
  userRows.forEach((row) => {
    statements.push(
      `INSERT INTO users (id, email, display_name, password_hash, role, is_verified, last_login, created_at) VALUES (` +
      [row.id, row.email, row.display_name, row.password_hash, row.role, row.is_verified, row.last_login, row.created_at]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  // characters
  statements.push('-- ' + (characterRows.length * 38) + ' characters');
  statements.push('BEGIN TRANSACTION;');
  characterRows.forEach((row) => {
    statements.push(
      `INSERT INTO characters (id, user_id, name, bio, portrait, level, experience, alignment, ac, hp_current, hp_max, initiative, initiative_mod, race, class, sub_class, background, born, death, languages, deity, gender, age, height, weight, eyes, skin, hair, features_traits, personality, ideal, bond, flaw, spells, equipment, personal_notes, created_at, updated_at) VALUES (` +
      [row.id, row.user_id, row.name, row.bio, row.portrait, row.level, row.experience, row.alignment, row.ac, row.hp_current, row.hp_max, row.initiative, row.initiative_mod, row.race, row.class, row.sub_class, row.background, row.born, row.death, row.languages, row.deity, row.gender, row.age, row.height, row.weight, row.eyes, row.skin, row.hair, row.features_traits, row.personality, row.ideal, row.bond, row.flaw, row.spells, row.equipment, row.personal_notes, row.created_at, row.updated_at]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  // campaigns
  statements.push('-- ' + (campaignRows.length * 20) + ' campaigns');
  statements.push('BEGIN TRANSACTION;');
  campaignRows.forEach((row) => {
    statements.push(
      `INSERT INTO campaigns (id, dm_id, name, description, story, image, status, start_date, end_date, system, notes, member_limit, current_members, cover_art, tags, created_at, updated_at) VALUES (` +
      [row.id, row.dm_id, row.name, row.description, row.story, row.image, row.status, row.start_date, row.end_date, row.system, row.notes, row.member_limit, row.current_members, row.cover_art, row.tags, row.created_at, row.updated_at]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  // members
  statements.push('-- ' + (memberRows.length * 8) + ' campaign members');
  statements.push('BEGIN TRANSACTION;');
  memberRows.forEach((row) => {
    statements.push(
      `INSERT INTO campaign_members (id, campaign_id, user_id, character_id, joined_at, status, role) VALUES (` +
      [row.id, row.campaign_id, row.user_id, row.character_id, row.joined_at, row.status, row.role]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  // locations
  statements.push('-- ' + (locationRows.length * 11) + ' locations');
  statements.push('BEGIN TRANSACTION;');
  locationRows.forEach((row) => {
    statements.push(
      `INSERT INTO locations (id, campaign_id, name, description, region, image_url, coordinates, dm_notes, created_at, updated_at) VALUES (` +
      [row.id, row.campaign_id, row.name, row.description, row.region, row.image_url, row.coordinates, row.dm_notes, row.created_at, row.updated_at]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  // items
  statements.push('-- ' + (itemRows.length * 17) + ' items');
  statements.push('BEGIN TRANSACTION;');
  itemRows.forEach((row) => {
    statements.push(
      `INSERT INTO items (id, name, description, type, rarity, weight, value, requires_attunement, properties, effect, charges, dm_notes, campaign_id, created_at, updated_at) VALUES (` +
      [row.id, row.name, row.description, row.type, row.rarity, row.weight, row.value, row.requires_attunement, row.properties, row.effect, row.charges, row.dm_notes, row.campaign_id, row.created_at, row.updated_at]
        .map(lit)
        .join(',') + ');'
    );
  });
  statements.push('COMMIT;');
  
  return statements.join('\n') + '\n';
}

const sql = generateSQL();
fs.writeFileSync('tmp/seed-http.sql', sql);
console.log('Wrote tmp/seed-http.sql (' + sql.length + ' bytes, ' + (sql.match(/\n/g) || []).length + ' statements)');

// Execute locally if needed (optional)
// const client = createClient({ url: 'file:./zorvania-db.sqlite' });
// await client.execute(sql);
// console.log('Seed applied locally');