import { readFileSync } from 'node:fs';
const s = readFileSync('seed-http.mjs', 'utf8');
let p = 0, b = 0, sq = 0;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '(') p++;
  if (ch === ')') { p--; if (p < 0) { console.log('NEG paren at pos', i, 'ctx:', s.slice(Math.max(0,i-40), i+40)); process.exit(0); } }
  if (ch === '{') b++;
  if (ch === '}') { b--; if (b < 0) { console.log('NEG brace at pos', i); process.exit(0); } }
  if (ch === '[') sq++;
  if (ch === ']') { sq--; if (sq < 0) { console.log('NEG bracket at pos', i); process.exit(0); } }
}
console.log('final paren', p, 'brace', b, 'bracket', sq);