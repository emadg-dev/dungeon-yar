# DungeonYar — rebuild, deploy, DB rebuild & seed (one-shot)

# 1. Rebuild remote DB (delete + create + schema)
npx wrangler d1 delete zorvania-db -y || true
npx wrangler d1 create zorvania-db
npx wrangler d1 execute zorvania-db --remote --file=./schema.sql

# 2. Rebuild local DB
rm -rf .wrangler/state
npx wrangler d1 execute zorvania-db --local --file=./schema.sql

# 3. Regenerate seed SQL (from seed.ts)
node seed-http.mjs

# 4. Apply clean seed (users/chars/campaigns/members) to both
# Note: full seed (encounter_participants) may fail due to source parse errors
# Apply manually if needed:
# npx wrangler d1 execute zorvania-db --remote --file=./tmp/seed-final.sql

# 5. Build
npm run build

# 6. Deploy
npx wrangler pages deploy ./dist --project-name=dungeon-yar
