import fs from 'fs';

const s = fs.readFileSync('tmp/seed-http.sql', 'utf8');
let out = '';
let inString = false;
let quoteChar = null;
let escaped = false;

for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (escaped) { out += ch; escaped = false; continue; }
  if (ch === '\\' && inString) { out += ch; escaped = true; continue; }
  
  if (!inString) {
    if (ch === "'") { inString = true; quoteChar = "'"; out += ch; continue; }
    out += ch; continue;
  }
  
  if (ch === quoteChar) {
    // Check for doubled single quote (SQL escape)
    if (s[i + 1] === quoteChar) {
      out += ch; out += s[++i]; continue;
    }
    inString = false; quoteChar = null; out += ch; continue;
  }
  
  // Inside string: replace ; with Persian comma to prevent SQL statement splitting
  if (ch === ';') {
    out += '،';
  } else {
    out += ch;
  }
}

fs.writeFileSync('tmp/seed-fixed-clean.sql', out);
console.log('Cleaned seed:', out.length, 'bytes');
console.log('Remaining semicolons outside strings: ', (out.split("'").filter((_, i) => i % 2 === 0).join("'").match(/;/g) || []).length);
