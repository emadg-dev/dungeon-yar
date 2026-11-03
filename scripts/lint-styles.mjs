#!/usr/bin/env node

/**
 * Style Guardrails Linter for DungeonYar
 * Enforces centralized design tokens, logical RTL properties,
 * no raw hex/rgb classes outside theme.css, and explicit allowlist for dynamic math.
 */

import fs from 'fs';
import path from 'path';

let errors = 0;

// Allowlist for valid runtime dynamic styles
const INLINE_STYLE_ALLOWLIST = [
  'src/components/common/VirtualList.tsx', // Virtualization math (totalHeight, itemHeight)
  'src/components/common/SafeImage.tsx',   // Dynamic aspect-ratio and dimensions
  'src/components/common/EntityCard.tsx',  // Dynamic database lore color (regionAccent, rarityBorderColor)
  'src/components/ui/Skeleton.tsx',        // Dynamic width/height skeleton props
  'src/components/ui/ScrollableRow.tsx',   // Dynamic scroll mask gradients
  'src/components/ui/NumberStepper.tsx',   // unicode-bidi isolate
  'src/components/ui/Card.tsx',            // dynamic touchAction
  'src/components/ui/ListRow.tsx',         // dynamic touchAction
  'src/components/ui/PipTracker.tsx',      // dynamic touchAction
  'src/components/ui/SectionAccordion.tsx',// dynamic touchAction
  'src/components/ui/Switch.tsx',          // dynamic touchAction
  'src/components/ui/Checkbox.tsx',        // dynamic touchAction
  'src/components/ui/TabStrip.tsx',        // dynamic touchAction
];

function walk(dir) {
  let res = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((f) => {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler', 'build'].includes(f)) {
          res = res.concat(walk(p));
        }
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        res.push(p);
      }
    });
  } catch {}
  return res;
}

const allSrcFiles = walk('src');
console.log(`Checking ${allSrcFiles.length} source files across src/ for style guardrails...`);

allSrcFiles.forEach((file) => {
  // Normalize path
  const normalizedFile = file.replace(/\\/g, '/');
  const isAllowedInline = INLINE_STYLE_ALLOWLIST.some((a) => normalizedFile.endsWith(a));

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Check for physical properties breaking RTL
    const physicalMatches = line.match(/\b(text-right|text-left|ml-\d+|mr-\d+|pl-\d+|pr-\d+)\b/);
    if (physicalMatches && !line.includes('dir="ltr"') && !line.includes('tabular-nums') && !line.includes('num-ltr') && !line.includes('dice-ltr')) {
      console.error(
        `[ERROR] ${file}:${lineNum} - Found physical direction property "${physicalMatches[0]}". Use logical RTL equivalents (text-start, ms-*, me-*, ps-*, pe-*).`
      );
      errors++;
    }

    // 2. Check for arbitrary hex/rgb/rgba/hsl classes outside theme.css
    const arbitraryMatches = line.match(/(?:bg|text|border|ring|fill|stroke|shadow|from|to|via)-\[(?:#|rgba?|hsla?)[^\]]+\]/);
    if (arbitraryMatches) {
      console.error(
        `[ERROR] ${file}:${lineNum} - Found arbitrary color class "${arbitraryMatches[0]}". Use centralized semantic tokens from theme.css.`
      );
      errors++;
    }

    // 3. Check for hardcoded hex colors outside comments/SVG paths
    const rawHexMatches = line.match(/#[0-9a-fA-F]{3,8}\b/);
    if (rawHexMatches && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
      console.error(
        `[ERROR] ${file}:${lineNum} - Found raw hex color "${rawHexMatches[0]}". All colors must be centralized in theme.css.`
      );
      errors++;
    }

    // 4. Check for font-family declared outside theme.css
    if (line.includes('font-family:') && !file.includes('theme.css')) {
      console.error(
        `[ERROR] ${file}:${lineNum} - Found font-family declaration. All font families must be defined exclusively in theme.css.`
      );
      errors++;
    }

    // 5. Check for non-allowlisted inline style with color
    if (!isAllowedInline && line.includes('style={{') && (line.includes('color:') || line.includes('backgroundColor:'))) {
      if (!line.includes('--') && !line.includes('dynamic') && !line.includes('regionAccent') && !line.includes('rarityBorderColor')) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found non-allowlisted inline style with hardcoded color. Use tokens or CSS variables.`
        );
        errors++;
      }
    }
  });
});

console.log(`\nStyle Lint Summary:`);
if (errors > 0) {
  console.error(`FAIL: Found ${errors} style guardrail violations across src/.`);
  process.exit(1);
} else {
  console.log(`PASS: All style guardrails passed with 0 errors across ${allSrcFiles.length} files.`);
}
