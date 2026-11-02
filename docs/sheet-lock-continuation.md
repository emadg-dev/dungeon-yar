# DM-ONLY SHEET CONTROL — Continuation (post-step 5.6)

## What exists (verified by grep/read)
- `CharacterParticipation.sheetLocked?: boolean`
- `CampaignSettings.sheetLock?: 'locked_core' | 'free'`
- `CharacterParticipation.pendingChange?: { type: 'level_up' | 'sheet_change', ... }`
- `SheetChangeRequest` interface + `LocalApi` methods (`create`, `list`, `review`)
- `dmOverrideParticipation` (writes audit event `ویرایش DM`)
- `toggleRespecWindow` (sets `sheetLocked`)

## What was added in this continuation
- `docs/sheet-lock-existing.md`
- `shared/rules/sheetPolicy.ts` + `.test.ts` (PASS 5/5)
- `migrations/019_sheet_lock.sql` + `schema.sql` appended (PASS: new `edit_grants`, `change_requests` tables)
- `LocalApi` extended: `createEditGrant`, `revokeEditGrant`, `enforceLock` (stub)
- `LocalApi.updateParticipation`: basic enforcement call added
- `vite.config.ts`: PWA icons now point to `icon.svg` / `icon-maskable.svg` (PASS)
- Build/deploy/DB updates completed (PASS)

## What remains (explicitly not finished in this run)
- Full `enforceLock` integration on all inventory/currency/feature/weapon/tracker endpoints
- `HttpApi` server-side enforcement (Functions `functions/api/[[route]].ts`)
- `edit_grant` lifecycle: `consumeGrant`, `expireGrant`, `useGrant` in `HttpApi`
- `change_requests` atomic apply/reject with snapshot (`createParticipationSnapshot` reuse) in `HttpApi`
- Audit feed `تغییرات DM` for every locked change (already exists in `dmOverrideParticipation`; needs to be triggered by `enforceLock`)
- UI primitives: lock icon, read-only fields, `درخواست تغییر به DM` button, DM queue `درخواست‌ها`, `اجازه‌ی ویرایش` action, `حالت ویرایش DM` toggle, `تغییرات DM` feed, `اجازه‌ی ویرایش دارید تا ...` banner
- Notification/badge on request decision
- Mobile verification at 320–430 px (dark/light)
- Full test suite for criteria a–i (only `policy` tests done)

## PASS / FAIL
- Policy logic + test: PASS (5/5)
- Migration + schema: PASS
- Build + deploy: PASS (`https://d68f66ab.dungeon-yar.pages.dev`)
- Remote DB: PASS (67 tables + 2 new)
- Existing audit/code verification: PASS
- Full enforcement / UI / device: NOT FINISHED
