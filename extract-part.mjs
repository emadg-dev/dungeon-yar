import fs from 'fs';
const all = fs.readFileSync('tmp/seed-http.sql', 'utf8').split('\n');
// Keep up to line 30 (users + characters + campaigns + members start)
const part = all.slice(0, 30).join('\n');
fs.writeFileSync('tmp/seed-part1.sql', part);
console.log('wrote', part.length);
