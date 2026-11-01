import fs from 'fs';

const s = fs.readFileSync('tmp/seed-fixed-clean.sql', 'utf8');
const lines = s.split(/\r?\n/);
const chunks = [];
let current = '';
let count = 0;
for (const line of lines) {
  current += line + '\n';
  count++;
  if (line.trim().startsWith('INSERT INTO') || line.trim().startsWith('--')) {
    if (count >= 50 || current.length > 8000) {
      chunks.push(current);
      current = '';
      count = 0;
    }
  }
}
if (current.trim()) chunks.push(current);
for (let i = 0; i < chunks.length; i++) {
  fs.writeFileSync('tmp/cmd/seed-' + String(i+1).padStart(3, '0') + '.sql', chunks[i]);
}
console.log('Created', chunks.length, 'chunks');