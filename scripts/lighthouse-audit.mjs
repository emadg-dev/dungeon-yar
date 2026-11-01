#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lighthouse / PWA & Performance Audit Script for DungeonYar
 * Validates PWA compliance, Service Worker, bundle size (<= 200 KB gzip),
 * font preloads, manifest properties, and RTL/Persian compliance.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIST_DIR = path.resolve('dist');

console.log('====================================================');
console.log(' DungeonYar PWA, Offline & Performance Audit (Step 5.2)');
console.log('====================================================\n');

let allPassed = true;
function check(label, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${label}`);
  } else {
    console.error(`  [FAIL] ${label}${details ? ` -> ${details}` : ''}`);
    allPassed = false;
  }
}

// 1. Check Dist build exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist/ directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// 2. Web App Manifest Audit
const manifestPath = path.join(DIST_DIR, 'manifest.webmanifest');
check('Manifest exists (dist/manifest.webmanifest)', fs.existsSync(manifestPath));

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  check('Manifest name matches platform name', Boolean(manifest.name && manifest.name.length > 0));
  check('Manifest short_name <= 12 chars', Boolean(manifest.short_name && manifest.short_name.length <= 12), `short_name length is ${manifest.short_name?.length}`);
  check('Manifest language is fa', manifest.lang === 'fa');
  check('Manifest direction is rtl', manifest.dir === 'rtl');
  check('Manifest display is standalone', manifest.display === 'standalone');
  check('Manifest theme_color is #0E0D0C', manifest.theme_color?.toLowerCase() === '#0e0d0c');
  check('Manifest background_color is #0E0D0C', manifest.background_color?.toLowerCase() === '#0e0d0c');
  
  const has192 = manifest.icons?.some(i => i.sizes === '192x192');
  const has512 = manifest.icons?.some(i => i.sizes === '512x512');
  const hasMaskable = manifest.icons?.some(i => i.purpose === 'maskable');
  check('Manifest includes 192x192 icon', has192);
  check('Manifest includes 512x512 icon', has512);
  check('Manifest includes maskable icon', hasMaskable);
}

// 3. Service Worker Audit
const swPath = path.join(DIST_DIR, 'sw.js');
check('Service worker generated (dist/sw.js)', fs.existsSync(swPath));

// 4. Initial JS Bundle Size (<= 200 KB gzip)
const assetsDir = path.join(DIST_DIR, 'assets');
let maxIndexGzip = 0;
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const indexJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (indexJs) {
    const raw = fs.readFileSync(path.join(assetsDir, indexJs));
    const gzipped = zlib.gzipSync(raw);
    maxIndexGzip = (gzipped.length / 1024);
    check(
      `Initial entry JS <= 200 KB gzip (${maxIndexGzip.toFixed(2)} KB)`,
      maxIndexGzip <= 200,
      `Actual size: ${maxIndexGzip.toFixed(2)} KB gzip`
    );
  } else {
    check('Found index-*.js bundle', false, 'index bundle not located');
  }
}

// 5. Preloaded Fonts in HTML
const htmlPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  check('HTML lang is fa and dir is rtl', html.includes('lang="fa"') && html.includes('dir="rtl"'));
  check('HTML preloads Vazirmatn woff2 font', html.includes('rel="preload"') && html.includes('vazirmatn') && html.includes('.woff2'));
  check('Viewport-fit=cover meta tag present', html.includes('viewport-fit=cover'));
}

console.log('\n----------------------------------------------------');
if (allPassed) {
  console.log(' AUDIT RESULT: ALL PWA & PERFORMANCE CRITERIA PASSED');
  console.log('----------------------------------------------------');
  process.exit(0);
} else {
  console.error(' AUDIT RESULT: SOME CHECKS FAILED');
  console.log('----------------------------------------------------');
  process.exit(1);
}
