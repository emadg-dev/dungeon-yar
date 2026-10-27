import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync('tmp/seed-http.sql', 'utf8');
// Split into 5 sections by "-- N)" markers
const sections = s.split(/^-- [0-9]+\)/m).filter(Boolean);
// Keep first section as header
console.log(`Total statements: ${s.match(/\nINSERT INTO/g).length}, sections: ${sections.length}`);
const outPath = `tmp/seed-${sections.length - 1}.sql`;
writeFileSync(outPath, sections.join('\n'), 'utf8');
console.log(`Wrote section file (${sections.length} sections to ${(outPath))}`);
