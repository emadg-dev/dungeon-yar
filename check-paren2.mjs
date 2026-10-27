import { readFileSync } from 'node:fs';
const s = readFileSync('seed-http.mjs', 'utf8');
let p = 0;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '(') p++;
  if (ch === ')') {
    p--;
    if (p < 0) {
      const start = s.lastIndexOf('\n', i);
      const end = s.indexOf('\n', i);
      const line = s.slice(start + 1, end);
      const lineNum = s.slice(0, i).split('\n').length;
      console.log(`NEG paren at line ${lineNum}: ${line}`);
      console.log(`context: ...${s.slice(Math.max(0, i - 80), i + 40)}...`);
      break;
    }
  }
}
console.log('done, final paren:', p);