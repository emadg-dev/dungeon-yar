import fs from 'fs';

// Read the freshly generated seed SQL
const sql = fs.readFileSync('tmp/seed-http.sql', 'utf8');

// Remove broken rows (encounters + encounter_participants)
const idx1 = sql.indexOf("INSERT INTO encounters (id, 'enc-time-wolf'");
const idx2 = sql.indexOf("INSERT INTO encounter_participants");
const cutIdx = Math.min(idx1, idx2);

// Also replace Persian semicolons inside remaining strings
let clean = sql.replace(/؛/g, ',');

if (cutIdx > 0 && cutIdx < clean.indexOf("INSERT INTO encounters", cutIdx)) {
  clean = clean.slice(0, clean.indexOf("INSERT INTO encounters"));
}

// Remove encounter_participants section entirely
clean = clean.replace(/INSERT INTO encounter_participants[\s\S]*?(?=-- 23)/, '-- encounter_participants skipped (source parse issue);\n');

// Also remove any standalone encounter rows (the two encounters)
clean = clean.replace(/INSERT INTO encounters[\s\S]*?(?=-- 22)/, '-- encounters skipped (source parse issue);\n');

const combined = "PRAGMA foreign_keys = OFF;\n" + clean + "\nPRAGMA foreign_keys = ON;\n";
fs.writeFileSync('tmp/seed-final.sql', combined);
console.log('wrote tmp/seed-final.sql, length:', combined.length);
