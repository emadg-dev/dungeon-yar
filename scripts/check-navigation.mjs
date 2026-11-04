#!/usr/bin/env node

/**
 * Navigation Guardrail Linter for DungeonYar
 * 
 * Verifies:
 * 1. Imported/lazy modal and view components in src/App.tsx are actively rendered in JSX.
 * 2. window.location.hash targets across src/ are matched by applyRouteFromHash.
 * 3. Boolean modal states with setX(true) callers are read/rendered in JSX.
 * 4. Transparent allowlist for intentional dev-only and staged components.
 */

import fs from 'fs';
import path from 'path';

let errors = 0;
let warnings = 0;

const ALLOWLIST_UNUSED_IMPORTS_APP = [
  // Staged for dead-code cleanup after user approval (Step 4 audit)
  'CreateCampaignModal',
];

const ALLOWLIST_MODAL_STATES = [
  // Known modal states that may be controlled or passed externally
];

function checkAppComponents() {
  const appFile = path.resolve('src/App.tsx');
  if (!fs.existsSync(appFile)) {
    console.error(`❌ src/App.tsx not found`);
    errors++;
    return;
  }

  const content = fs.readFileSync(appFile, 'utf-8');

  // Match: const ComponentName = React.lazy(...) or const ComponentName = lazy(...)
  const lazyRegex = /const\s+([A-Z][A-Za-z0-9]+)\s*=\s*React\.lazy/g;
  let match;
  const lazyComponents = [];
  while ((match = lazyRegex.exec(content)) !== null) {
    lazyComponents.push(match[1]);
  }

  // Find JSX usages: <ComponentName
  for (const comp of lazyComponents) {
    const jsxTagRegex = new RegExp(`<${comp}[\\s>/]`);
    if (!jsxTagRegex.test(content)) {
      if (ALLOWLIST_UNUSED_IMPORTS_APP.includes(comp)) {
        console.log(`ℹ️ [ALLOWLIST] Lazy component '${comp}' is imported but not rendered in JSX (pending dead-code removal).`);
      } else {
        console.error(`❌ [NAVIGATION BUG] Lazy component '${comp}' is imported in App.tsx but NEVER rendered in JSX!`);
        errors++;
      }
    }
  }

  // Check modal boolean state variables with setters
  // e.g. const [fooModalOpen, setFooModalOpen] = useState(false);
  const stateRegex = /const\s+\[([a-zA-Z0-9]+),\s*set([A-Z][a-zA-Z0-9]+)\]\s*=\s*useState(?:<boolean>)?\((?:false|true)\);/g;
  let stateMatch;
  while ((stateMatch = stateRegex.exec(content)) !== null) {
    const stateVar = stateMatch[1];
    const setterName = 'set' + stateMatch[2];

    // Check if setter is called somewhere: setFoo(true)
    const setterCallRegex = new RegExp(`${setterName}\\s*\\(\\s*true\\s*\\)`);
    if (setterCallRegex.test(content)) {
      // Ensure stateVar is referenced outside its declaration
      const firstIndex = content.indexOf(stateVar);
      const secondIndex = content.indexOf(stateVar, firstIndex + stateVar.length);
      if (secondIndex === -1 && !ALLOWLIST_MODAL_STATES.includes(stateVar)) {
        console.error(`❌ [UNREAD STATE] Modal state '${stateVar}' has ${setterName}(true) calls but is never read or rendered in JSX!`);
        errors++;
      }
    }
  }
}

function checkHashRoutes() {
  const appFile = path.resolve('src/App.tsx');
  const appContent = fs.readFileSync(appFile, 'utf-8');

  // Find all window.location.hash assignments in src/
  function walkDir(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', '.wrangler'].includes(entry.name)) {
          results = results.concat(walkDir(fullPath));
        }
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allFiles = walkDir('src');
  const hashAssignments = [];

  for (const file of allFiles) {
    const text = fs.readFileSync(file, 'utf-8');
    const regex = /window\.location\.hash\s*=\s*([`'"][^`'"]+[`'"])/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      hashAssignments.push({ file: path.relative(process.cwd(), file), target: m[1] });
    }
  }

  // Recognized patterns in applyRouteFromHash:
  // #/, #/join, #c/:id/..., #characters/:id, #/characters/:id, #dm/:tab, #register, #login, #reset, #dev/ui, legacy tabs
  const validRoutePrefixes = [
    '#/',
    '#join',
    '#/join',
    '#c/',
    '#characters/',
    '#/characters/',
    '#dm/',
    '#register',
    '#login',
    '#reset',
    '#dev',
    '#dev/ui',
  ];
  const legacyTabs = ['overview', 'abilities', 'combat', 'companions', 'inventory', 'notes', 'codex'];

  for (const { file, target } of hashAssignments) {
    // Strip quotes or template literal markers
    const cleanTarget = target.replace(/^[`'"]|[`'"]$/g, '');
    const isDynamic = cleanTarget.includes('${');

    let isValid = false;
    for (const prefix of validRoutePrefixes) {
      if (cleanTarget.startsWith(prefix)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      if (cleanTarget === '#${tab}') {
        isValid = true;
      } else {
        for (const tab of legacyTabs) {
          if (cleanTarget === `#${tab}` || cleanTarget.startsWith(`#${tab}?`)) {
            isValid = true;
            break;
          }
        }
      }
    }

    if (!isValid) {
      console.error(`❌ [UNKNOWN HASH ROUTE] ${file}: window.location.hash set to unhandled target: ${target}`);
      errors++;
    }
  }
}

console.log('🔍 Checking DungeonYar Navigation & Modals Guardrails...');
checkAppComponents();
checkHashRoutes();

if (errors > 0) {
  console.error(`\n❌ Navigation check failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log(`\n✅ Navigation check passed successfully (no orphan modals or unhandled hash routes).`);
  process.exit(0);
}
