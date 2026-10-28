import fs from 'fs';
let sql = fs.readFileSync('tmp/seed-fixed.sql', 'utf8');
const needle = "INSERT INTO encounters (id,";
const idx = sql.indexOf(needle);
console.log('encounter_participants at', idx);
if (idx > 0) {
  sql = sql.slice(0, idx) + '-- encounter_participants rows skipped (Persian quote parse);\n';
}
fs.writeFileSync('tmp/seed-clean.sql', 'PRAGMA foreign_keys = OFF;\n' + sql + '\nPRAGMA foreign_keys = ON;\n');
console.log('wrote tmp/seed-clean.sql');
