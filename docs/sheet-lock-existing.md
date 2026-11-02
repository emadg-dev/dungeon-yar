# Existing Implementation Report (before extension)

## Found in repo (`grep` + read)

### Types (`src/types/index.ts`)
- `CampaignSettings.sheetLock?: 'locked_core' | 'free'` (line 34)
- `CharacterParticipation.sheetLocked?: boolean` (line 383)
- `CharacterParticipation.pendingChange?: { type: 'level_up' | 'sheet_change', ... }` (line 394)
- `SheetChangeRequest` interface (line 422): id, campaignId, participationId, userId, requestedChanges, reason?, status ('pending'|'approved'|'rejected'), reviewComment?, createdAt, updatedAt, characterName?, playerName?

### LocalApi / ApiClient (`src/services/api.ts`)
- `sheet_change_requests` storage key used in `LocalApi`
- `createSheetChangeRequest` (line 4490)
- `listSheetChangeRequests` (line 4515)
- `reviewSheetChangeRequest` (line 4520) — approves/rejects; on approve sets `part.sheetLocked = false`
- `dmOverrideParticipation` (line 4544) — writes audit event with title `ویرایش DM`
- `toggleRespecWindow` (line 4571) — toggles `part.sheetLocked`

### Schema / DB
- `sheet_change_requests` not present in `migrations/` individually; previously handled through seed/localStorage only
- `edit_grants`: NOT FOUND
- `locked_core`: NOT FOUND (only `sheetLocked` boolean and `sheetLock` setting exist)

### Shared pure logic
- `sheetPolicy.ts`: NOT FOUND

## Conclusion
There is a partial sheet-lock mechanism (`sheetLocked` bool, change-request interface, review flow, DM override audit). No `edit_grants`, no `locked_core`, no pure policy file, no server-side enforcement on every write path, no UI lock icons/bottom sheets, no snapshot-before-change mechanism.
