import fs from 'fs';
const lines = fs.readFileSync('tmp/seed-http.sql', 'utf8').split('\n');
for (let i = 138; i < 150; i++) {
  console.log((i+1) + ': ' + lines[i].slice(0, 250));
}
