#!/usr/bin/env node

/**
 * Style Guardrails Linter for DungeonYar
 * Stage A4: Enforces RTL logical properties, token usage, no !important in components,
 * and no raw hardcoded colors in UI primitives.
 */

import fs from 'fs';
import path from 'path';

let errors = 0;
let warnings = 0;

function walk(dir) {
  let res = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((f) => {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler'].includes(f)) {
          res = res.concat(walk(p));
        }
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        res.push(p);
      }
    });
  } catch {}
  return res;
}

const uiFiles = walk('src/components/ui');
console.log(`Checking ${uiFiles.length} UI primitives in src/components/ui...`);

uiFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Check for !important in UI primitives
    if (line.includes('!important')) {
      console.error(`[ERROR] ${file}:${lineNum} - Found "!important". Use semantic tokens or specificity.`);
      errors++;
    }

    // 2. Check for physical properties breaking RTL in UI primitives
    const physicalMatches = line.match(/\b(text-right|text-left|ml-\d+|mr-\d+|pl-\d+|pr-\d+)\b/);
    if (physicalMatches && !line.includes('dir="ltr"') && !line.includes('tabular-nums')) {
      console.error(
        `[ERROR] ${file}:${lineNum} - Found physical direction property "${physicalMatches[0]}". Use logical RTL equivalents (text-start, ms-*, me-*, ps-*, pe-*).`
      );
      errors++;
    }

    // 3. Check for inline style with color in UI primitives
    if (line.includes('style={{') && (line.includes('color:') || line.includes('backgroundColor:'))) {
      if (!line.includes('--') && !line.includes('dynamic') && !line.includes('regionAccent') && !line.includes('rarityBorderColor')) {
        console.error(`[ERROR] ${file}:${lineNum} - Found inline style with hardcoded color. Use tokens or CSS variables.`);
        errors++;
      }
    }
  });
});

console.log(`\nStyle Lint Summary:`);
if (errors > 0) {
  console.error(`FAIL: Found ${errors} style guardrail violations.`);
  process.exit(1);
} else {
  console.log(`PASS: All style guardrails passed with 0 errors.`);
}
