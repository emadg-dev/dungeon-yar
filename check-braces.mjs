import { readFileSync } from 'node:fs';
const lines = readFileSync('seed-http.mjs', 'utf8').split('\n');
let b = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (const ch of l) {
    if (ch === '{') b++;
    if (ch === '}') b--;
    if (b < 0) {
      console.log('NEGATIVE at line', i + 1, l);
      process.exit(0);
    }
  }
}
console.log('final depth', b);