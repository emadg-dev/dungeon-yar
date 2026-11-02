# Sheet-Lock Feature — Status Report (Branch `feature/sheet-lock`)

## PASS (this run)
| Item | Result |
|---|---|
| Existing audit (`docs/sheet-lock-existing.md`) | PASS |
| `shared/rules/sheetPolicy.ts` + test (5/5) | PASS |
| `migrations/019_sheet_lock.sql` + schema update | PASS |
| Build (`npx vite build`) | PASS |
| Deploy (`wrangler pages deploy`) — `https://d68f66ab.dungeon-yar.pages.dev` | PASS |
| Remote DB (`wrangler d1 execute` schema + 019) — 67+2 tables | PASS |
| `LocalApi` stub: `createEditGrant`, `revokeEditGrant`, `enforceLock`, enforcement call on `updateParticipation` | PASS (stub) |
| PWA icon fix (`vite.config.ts` → `icon.svg` / `icon-maskable.svg`) | PASS |

## NOT FINISHED
- Full enforcement on every write path (inventory, currency, weapons, features, companions, tracked resources) in both `LocalApi` and `HttpApi` Functions
- `edit_grant` lifecycle: consume/expire/revoke server-side
- Atomic `change_request` apply/reject with snapshot reuse + audit feed
- UI components (locked read-only fields, lock icon, bottom sheet, request button, DM queue, grants modal, DM mode toggle, changes feed, grant banner)
- Notifications on request decision
- Mobile verification at 320–430 px, dark + light themes
- Full Vitest suite for acceptance criteria a–i

## Next step (recommended)
Expand `enforceLock` to validate each field/action against `SHEET_POLICY_DEFAULT` groups, add the same enforcement to `HttpApi` Functions, and then implement the UI components. `shared/rules/sheetPolicy.ts` is the single source of truth to share between server and client.
