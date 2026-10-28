import fs from 'fs';
let sql = fs.readFileSync('tmp/seed-fixed.sql', 'utf8');
const idx = sql.indexOf("INSERT INTO encounters (id, 'enc-time-wolf'");
if (idx > 0) sql = sql.slice(0, idx) + '-- encounters trimmed\n';
fs.writeFileSync('tmp/seed-trimmed2.sql', 'PRAGMA foreign_keys = OFF;\n' + sql + '\nPRAGMA foreign_keys = ON;\n');
console.log('trimmed2 at', idx);
