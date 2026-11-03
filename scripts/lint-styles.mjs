#!/usr/bin/env node

/**
 * Style Guardrails Linter for DungeonYar
 * Enforces centralized design tokens, logical RTL properties,
 * no raw hex/rgb classes outside theme.css, explicit allowlist for dynamic math,
 * no raw <button>/<input>/<select>/<textarea> outside UI primitives/technical allowlist,
 * and no hardcoded SVG fill/stroke colors outside brand allowlist.
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

// Allowlist for brand SVG colors (Google logo, OAuth providers)
const SVG_BRAND_ALLOWLIST = [
  '#4285f4', '#4285F4', // Google Blue
  '#34a853', '#34A853', // Google Green
  '#fbbc05', '#FBBC05', // Google Yellow
  '#ea4335', '#EA4335', // Google Red
  '#00acc1', '#00ACC1', // Cyan brand
  'none', 'currentColor', 'transparent', 'inherit'
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
  const isUiComponent = normalizedFile.startsWith('src/components/ui/');

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
      // Check if this hex is an allowed SVG brand color
      const isBrandSvgColor = SVG_BRAND_ALLOWLIST.some((c) => line.includes(c));
      if (!isBrandSvgColor) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found raw hex color "${rawHexMatches[0]}". All colors must be centralized in theme.css.`
        );
        errors++;
      }
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

    // 6. Check for raw HTML button/input/select/textarea outside src/components/ui/
    if (!isUiComponent && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
      // Check raw <button>
      if (/<button[\s>]/.test(line)) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found raw <button> tag. Use <Button> or <IconButton> from src/components/ui/.`
        );
        errors++;
      }

      // Check raw <input> (exception: type="file")
      if (/<input[\s>]/.test(line)) {
        const isFileInput = line.includes('type="file"') || (index > 0 && lines[index - 1].includes('type="file"')) || (index < lines.length - 1 && lines[index + 1].includes('type="file"'));
        if (!isFileInput) {
          console.error(
            `[ERROR] ${file}:${lineNum} - Found raw <input> tag. Use <Input>, <Checkbox>, or <Radio> from src/components/ui/ (only type="file" is allowed as technical exception).`
          );
          errors++;
        }
      }

      // Check raw <select>
      if (/<select[\s>]/.test(line)) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found raw <select> tag. Use <Select> from src/components/ui/.`
        );
        errors++;
      }

      // Check raw <textarea>
      if (/<textarea[\s>]/.test(line)) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found raw <textarea> tag. Use <Textarea> from src/components/ui/.`
        );
        errors++;
      }
    }

    // 7. Check for hardcoded SVG fill and stroke outside brand allowlist
    const svgColorMatch = line.match(/(?:fill|stroke)=["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))["']/);
    if (svgColorMatch) {
      const colorVal = svgColorMatch[1];
      const isAllowedBrandColor = SVG_BRAND_ALLOWLIST.includes(colorVal);
      if (!isAllowedBrandColor) {
        console.error(
          `[ERROR] ${file}:${lineNum} - Found hardcoded SVG ${svgColorMatch[0]}. Use currentColor or semantic theme tokens (only external brand logos in allowlist are permitted).`
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
