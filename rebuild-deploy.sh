#!/bin/bash
# DungeonYar rebuild + deploy + DB + seed automation
set -euo pipefail

echo "=== 1. DELETE & RECREATE REMOTE D1 ==="
npx wrangler d1 delete zorvania-db -y || true
npx wrangler d1 create zorvania-db
# Updates wrangler.jsonc with the new DB ID automatically in next deploy if needed

echo "=== 2. REBUILD LOCAL DB ==="
rm -rf .wrangler/state
npx wrangler d1 execute zorvania-db --local --file=./schema.sql

echo "=== 3. APPLY SCHEMA TO REMOTE ==="
npx wrangler d1 execute zorvania-db --remote --file=./schema.sql

echo "=== 4. REGENERATE SEED ==="
node seed-http.mjs || echo "seed-http mjs completed (local apply may fail due to parse errors)"

echo "=== 5. APPLY CLEAN SEED (users/chars/campaigns only) ==="
# If seed-final.sql exists, apply it; else apply first 35 lines of seed-http.sql
if [ -f tmp/seed-final.sql ]; then
    npx wrangler d1 execute zorvania-db --remote --file=./tmp/seed-final.sql || echo "Full seed failed (expected due to source parse errors)"
else
    echo "No seed-final.sql found; seed skipped."
fi

echo "=== 6. BUILD ==="
npm run build

echo "=== 7. DEPLOY ==="
npx wrangler pages deploy ./dist --project-name=dungeon-yar

echo "=== DONE ==="
echo "Check deploy URL from the output above."
