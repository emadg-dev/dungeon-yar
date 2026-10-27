import { describe, it, expect } from 'vitest';
import { buildPageTitle, isValidShortName, buildManifest } from './branding';
import { APP_NAME_FA, APP_NAME_LATIN, APP_SHORT_NAME, APP_TAGLINE, pageTitle, getAppManifest } from '../src/config/app';
import fs from 'fs';
import path from 'path';

describe('Branding and Acceptance Tests', () => {
  it('buildPageTitle formats default and page-specific titles correctly', () => {
    expect(buildPageTitle(APP_NAME_FA, APP_NAME_LATIN)).toBe(`${APP_NAME_FA} | ${APP_NAME_LATIN}`);
    expect(pageTitle()).toBe(`${APP_NAME_FA} | ${APP_NAME_LATIN}`);
    expect(pageTitle('خانه')).toBe(`خانه | ${APP_NAME_FA}`);
  });

  it('validates short_name length <= 12 characters', () => {
    expect(isValidShortName(APP_SHORT_NAME)).toBe(true);
    expect(APP_SHORT_NAME.length).toBeLessThanOrEqual(12);
    expect(isValidShortName('این_نام_بسیار_طولانی_است')).toBe(false);
  });

  it('manifest contains correct branding and short_name length <= 12', () => {
    const manifest = getAppManifest();
    expect(manifest.name).toBe(APP_NAME_FA);
    expect(manifest.short_name).toBe(APP_SHORT_NAME);
    expect(manifest.short_name!.length).toBeLessThanOrEqual(12);
    expect(manifest.description).toBe(APP_TAGLINE);
  });

  it('asserts that no source file outside src/config/app.ts contains the literal brand names', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const forbidden = [APP_NAME_FA, APP_NAME_LATIN];
    const offendingFiles: { file: string; line: number; match: string }[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(path.resolve(__dirname, '..'), fullPath);

        // Normalize separators
        const normalizedRel = relPath.replace(/\\/g, '/');

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          // Skip the single source of truth: src/config/app.ts
          if (normalizedRel === 'src/config/app.ts') {
            continue;
          }

          // Only scan source code files
          const ext = path.extname(entry.name).toLowerCase();
          if (!['.ts', '.tsx', '.js', '.jsx', '.css', '.html'].includes(ext)) {
            continue;
          }

          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');

          lines.forEach((lineText, idx) => {
            for (const word of forbidden) {
              if (lineText.includes(word)) {
                offendingFiles.push({
                  file: normalizedRel,
                  line: idx + 1,
                  match: word,
                });
              }
            }
          });
        }
      }
    }

    scanDir(srcDir);

    expect(offendingFiles).toEqual([]);
  });
});
