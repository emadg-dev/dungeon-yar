import fs from 'fs';
let s = fs.readFileSync('tmp/seed-final.sql', 'utf8');
let out = '';
let inString = false;
let quoteChar = null;
let escaped = false;

for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (escaped) { out += ch; escaped = false; continue; }
  if (ch === '\\' && inString) { out += ch; escaped = true; continue; }
  
  if (!inString) {
    if (ch === "'" || ch === '"') { inString = true; quoteChar = ch; out += ch; continue; }
    out += ch; continue;
  }
  
  // Inside string
  if (ch === quoteChar) {
    if (s[i+1] === quoteChar) {
      out += ch; out += s[++i]; continue;
    }
    inString = false; quoteChar = null; out += ch; continue;
  }
  
  if (ch === ';') {
    out += ',';
  } else {
    out += ch;
  }
}

fs.writeFileSync('tmp/seed-fixed.sql', out);
console.log('Fixed SQL:', out.length, 'chars');
console.log('Remaining ; inside strings:', (out.match(/;[^']/g) || []).length);
