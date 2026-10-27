# DungeonYar (دانجن‌یار) Multi-Campaign Platform Roadmap — From Phase 3 to the End

> This file continues Phases 1 (multi-campaign core) and 2 (campaign builder and library).
> Each step has one small prompt for Google AI Studio. Every prompt needs the "shared preamble" (section 1).
> Items that come from the world book or from your own decisions are marked "Current / Your decision"; everything else is my suggestion and is not final until you approve it.
>
> **Translator's note:** Persian class names (فره‌دار, موبد آذرین, دیوان‌زاد, پیمان‌بان, سایه‌خوان, مه‌آشنا) and in-app Persian UI strings are kept in Persian because they are data/UI text the app must actually use. English glosses are added in parentheses where helpful.

---

## 0. Fixed Decisions (from you)

| Topic | Decision |
|---|---|
| Character across multiple campaigns | Shared identity and backstory; level, HP, backpack and notes are separate per campaign; join with the same level or a new level |
| Rules system | D&D 5e only; abilities, skills, currencies and resources are configurable |
| Content | SRD and your own content only; DMs create content packs |
| Scale | For now, only you and your friends |
| Files | D1 only (no R2); expand later |
| DM approval for character creation/upgrade | Per-campaign setting |
| Language | Persian only |
| Chat | Existing messengers; only the shared dice roller lives inside the app |
| Deployment | Cloudflare Pages + Functions + D1 |
| Platform name | DungeonYar / دانجن‌یار (config constants in `src/config/app.ts`); «زروانیا» stays the name of the first world/pack/campaign; DB tables, API paths and cookie name are not renamed |

---

## 1. Shared Preamble (paste at the start of every prompt)

```
CONTEXT (do not change anything outside this step): DungeonYar (دانجن‌یار) multi-campaign D&D 5e platform; its first world/pack/campaign is «زروانیا» (Zorvania) — that name is lore, not the app name. Never hardcode the app name: import APP_NAME_FA / APP_NAME_LATIN / APP_TAGLINE from src/config/app.ts. Stack: Vite + React + TypeScript + Tailwind; Cloudflare Pages Functions + D1 only (no R2, no Firebase); an `ApiClient` interface with `LocalApi` (localStorage, preview) and `HttpApi` (fetch /api/*) adapters. Persian only, RTL, mobile-first (320–430px, 44px touch targets, bottom sheets, safe areas, keyboard-safe, no horizontal scroll), using the existing design tokens. Roles are PER CAMPAIGN (owner / co_dm / player / spectator). All campaign data is scoped by campaign_id and authorized on the SERVER: non-members get 404, players never receive DM-only or hidden fields. Characters = shared identity (character) + per-campaign play state (character_participation). Content entities use scope_type/scope_id/source_id and can be cloned by the clone engine. Add a new numbered migration file and update schema.sql, ApiClient, LocalApi, HttpApi and Functions together. Put pure logic in /shared and add Vitest tests. At the end output: (1) changed files, (2) PASS/FAIL for every acceptance test listed below, (3) anything you could not finish.
```

---

## 2. Working Method (for each step)

1. Create a branch on GitHub named like `step-3-1-rules-engine`.
2. **Before any step that has a migration**, back up D1: `wrangler d1 export`.
3. Give AI Studio the shared preamble + the step's prompt.
4. Test the output against that step's "acceptance criteria" in the preview (LocalApi).
5. If everything PASSES, merge. If not, fix that same step and do not move on to the next.
6. After deploying to Cloudflare, repeat the security tests (404 for non-members, no DM fields in player responses) on HttpApi as well.

Suggested migration numbering: `004` character builder, `005` sessions, `006` handouts and maps, `007` quests, reputation and treasury, `008` notifications.

---

# Phase 3 — Character Builder and Level-Up

Dependency: Phases 1 and 2 must be complete.

## Step 3.1 — Rules Engine

Goal: all calculations in one pure, tested module shared between client and server.

```
STEP 3.1 — RULES ENGINE. No UI changes, no new tables.
Create /shared/rules/engine.ts (pure TypeScript, used by BOTH client and Cloudflare Functions) with these functions: abilityModifier, proficiencyBonus (from rule_set.proficiencyBonusTable, default standard 5e, add a comment "unverified against the world book"), computeSaves, computeSkills (proficiency/expertise), computeAC (evaluate a structured acFormula: base + ability mods, armor/shield/unarmored states), computeInitiative, computeMaxHp (hpMode 'fixed_table'|'average'|'roll'; with fixed_table add (CON mod − class base CON mod) × level when settings.conAdjustFixedTable is true), computeSpellDcAndAttack, computeSlots (shared tables), computeClassResources (dice by level; formulas like "INT mod + 1" and "= level"), computeCompanion (AC and HP formula), featuresUnlockedAtLevel, martialArtsDie, pointBuyCost/validatePointBuy, validateStandardArray, rollAbilityScores (4d6 drop lowest, takes a random function so the server can inject crypto randomness), and deriveSheet(input) that returns all derived stats at once.
Add Vitest unit tests with these REQUIRED fixtures (the build must fail if any is wrong): fixed HP at level 1 / level 20 → فره‌دار 12/164, موبد آذرین 9/123, دیوان‌زاد 11/163, پیمان‌بان 11/144, سایه‌خوان 7/102, مه‌آشنا 9/123; full-caster slots level 5 = [4,3,2] and level 20 = [4,3,3,3,3,2,2,1,1]; half-caster slots level 5 = [4,2] and level 17 = [4,4]; Divine Smite dice level 2 = 2d8, level 11 = 5d8, level 15 = 6d8; Martial Arts Die level 5 = 1d6 and level 17 = 1d10; دیوان‌زاد companion at level 3 with CON mod +3 → HP 12 and AC 15; موبد آذرین unarmored AC with DEX 10 and WIS 16 = 13; فره‌دار in heavy armor + shield = 18 regardless of DEX.
Make the existing character sheet read its derived numbers from deriveSheet instead of ad-hoc code, without changing how the sheet looks.
```

Acceptance criteria:
- [ ] All fixtures pass in Vitest.
- [ ] After the change, the current sheet shows exactly the same numbers as before.
- [ ] The module has no imports from React or the DOM (it also runs on Functions).

## Step 3.2 — Lineage, Background and Class Templates + Editors

Dependency: 3.1

```
STEP 3.2 — TEMPLATES AND EDITORS. Migration 004 (part 1).
Add tables lineage_templates and background_templates (scope-based like other content: scope_type, scope_id, source_id, source_mode, tags, created_at, updated_at). Lineage fields: name, description, size, speed, abilityBonuses {mode:'fixed'|'choose', fixed, chooseCount, chooseValue}, traits[{name,description,usage}], languages, proficiencies{skills,weapons,armor,tools}, resistances, senses, sublineages[{name,description,traits}], nameSuggestions[], backstoryPrompts[]. Background fields: name, description, skillProficiencies, toolProficiencies, languages, startingEquipment, featureName, featureDescription, personalityTables{traits,ideals,bonds,flaws}.
Extend class_templates (add only the missing fields): startingEquipment as choice groups [{id,label,options:[{label,items[]}]}], starterWeaponOptions (weapon template refs with kind special|showy), structured acFormula, spellcasting {ability, slotsTable, cantripsKnownByLevel?, spellsKnownByLevel?, spellList}, extraAttackLevel, asiLevels, fixedHpByLevel[1..20], baseAbilities, featuresByLevel{1..20}, subclasses[{name,unlockLevel,featuresByLevel}], classResources[{name,maxFormula,reset,diceByLevel?}], companions[{name,fromLevel,ac,hpFormula}]. Unknown numbers stay null (the DM fills them).
Build DM editors in the Library: lineage editor, background editor, class editor (tabs: Basics / Skills & Equipment / AC & Resources / Spells / Features by level 1–20 (edited one level at a time in a bottom sheet, with a read-only scrollable overview) / Subclasses / Companions / HP table). Add a "validation panel" that runs the rules engine on a sample character at levels 1, 5, 11 and 20 and shows computed HP, slots, resources and AC so mistakes are visible.
Register lineage and background in the clone engine (copy/import/export with dependencies). Seed: the "زروانیا" pack gets the six classes with the full tables already in seed.ts; its lineages and backgrounds stay EMPTY (do not invent lore). The "پایه ۵e" (Base 5e) pack gets empty lineage/background lists.
```

Acceptance criteria:
- [ ] Every Zorvania class opens in the editor and the validation panel shows the book's correct numbers.
- [ ] Lineage/background templates are copied with the Phase 2 clone and export/import.
- [ ] Editing works on mobile at 320–430px with no horizontal scroll.

## Step 3.3 — Character Creation Wizard

Dependency: 3.1, 3.2

```
STEP 3.3 — CHARACTER CREATION WIZARD. Migration 004 (part 2).
participations: add xp, build JSON (abilityMethod, rolls, pointBuy, lineageId, backgroundId, skillChoices, equipmentChoices, subclassId, asiHistory[], hpHistory[]), sheet_locked INTEGER DEFAULT 1. Add participation_snapshots(id, participation_id, label, state, build, level, created_by, created_at), keeping the last 10. Campaign settings additions: hpMode, conAdjustFixedTable, abilityScoreMethods may include 'class_base', allowCustomLineage (false), sheetLock ('locked_core'|'free', default 'locked_core').
Build a full-screen wizard (stepper, sticky bottom bar: Back / Next / "ذخیره و ادامه بعداً" (Save and continue later)), reachable from Home, from the Join-campaign sheet and from the DM ("create for a player"). Steps: 1 Identity (name, portrait ≤150 KB, lineage cards, appearance; skip if the campaign has no lineages) → 2 Class (cards + compare sheet; only classes allowed by the campaign) → 3 Abilities (allowed methods: standard array, point buy, server-side 4d6 rolls recorded in build.rolls, class_base, manual if allowed; live modifiers) → 4 Background & skills (counts enforced, each proficiency tagged with its source) → 5 Equipment (starting choice groups, special-vs-showy starter weapon with the tradeoff, AC preview) → 6 Spells (only casters; limits set by the DM or free pick) → 7 Backstory (skippable; links to step 3.5 editor later) → 8 Review (full computed preview, warnings) and Submit.
Server: validate every step, RECOMPUTE all derived stats with the shared engine and reject mismatching client numbers. Drafts autosave as participation status 'draft' and are listed on Home with "ادامه" (Continue). Honor approval.onCreate (status 'pending_approval' vs 'active'), create the history event and a snapshot. For entry levels above 1, run the per-level loop from step 3.4 (leave a clearly marked hook if 3.4 is not built yet).
```

Acceptance criteria:
- [ ] All six Zorvania classes can be created at level 1 and HP/AC match the book.
- [ ] Ability rolls happen only on the server (the client cannot send a fake number).
- [ ] Manually submitting wrong HP/AC is rejected.
- [ ] A draft resumes from the same step after closing the browser.
- [ ] With approval turned on, the character cannot be played until the DM approves.

## Step 3.4 — Level-Up, XP, Approvals and Sheet Lock

Dependency: 3.3

```
STEP 3.4 — LEVEL-UP, XP, APPROVALS, SHEET LOCK. Migration 004 (part 3).
Add xp_awards(id, campaign_id, participation_id, amount, reason, created_by, created_at). Campaign settings: levelingMode ('milestone'|'xp'), xpThresholds.
DM actions: milestone → "ارتقای سطح" (Level up) for one/selected/all players sets level_up_available; xp → award XP (single or party, with a reason); when XP crosses the threshold show the "ارتقا آماده است" (Level-up ready) badge; the DM can force or deny.
Level-up wizard (per level, one compact screen each): new features from featuresByLevel → HP (hpMode; server-side roll with the engine, CON adjustment line shown) → ASI at asiLevels (+2 to one or +1/+1 to two, cap 20; feats hidden) → subclass at its unlock level → spells → resources/companions auto-recalculated (companion created at its fromLevel with an editable name) → diff review (before → after) → Confirm.
approval.onLevelUp: store pending_change {fromLevel,toLevel,diff}, keep the old level until the DM applies it (queue with Approve / Reject + comment / Request changes). Always take snapshots before/after and create a 'level_up' history event.
Sheet lock (default 'locked_core'): after approval, players cannot edit level, class, ability scores, max HP, proficiencies or derived stats via API; gameplay fields (current/temp HP, conditions, exhaustion, inventory, notes, resource uses, currency) stay editable. Add a lock indicator with a Persian explanation and a "درخواست تغییر به DM" (Request change from DM) button creating a short request in the DM queue.
DM tools: restore one of the last 10 snapshots, undo last level-up, DM override mode (every override audited and shown as "ویرایش DM" (DM edit) in history), optional respec window for one participation.
```

Acceptance criteria:
- [ ] Leveling from 3 to 4 grants an ASI; HP is correct with the fixed table + CON adjustment.
- [ ] With approval on, the level does not change until the DM approves; rejection returns with the comment.
- [ ] A player cannot change level/ability/max HP by calling the API directly.
- [ ] Reverting to a snapshot and undoing the last level-up work.
- [ ] Both XP and milestone modes are tested.

## Step 3.5 — Backstory Tools and Print View

Dependency: 3.3 (only needs the character identity)

```
STEP 3.5 — BACKSTORY TOOLS. Migration 004 (part 4).
Add character_revisions(id, character_id, backstory JSON, changed_by, created_at) keeping the last 10, and backstory_comments(id, character_id, section_id, author_id, body, resolved, created_at). Add characters.ready_for_review and campaign setting backstoryRequiredForApproval (default false).
Backstory editor on the character master screen: structured sections with guided Persian prompts (lineage backstoryPrompts + defaults): summary, origin, personality (traits/ideals/bonds/flaws with an optional "roll from background table"), goals, relationships (name + note + optional link to a REVEALED campaign NPC; DMs can link hidden NPCs without revealing them), timeline, custom sections. Each section has a "share with party" toggle. DM-only fields: secrets and hooks. Simple rich text (paragraphs, bold, italic, lists), plain RTL textarea on small screens, autosave, revision history with restore.
"آماده‌ی بازبینی" (Ready for review) toggle puts the backstory in the DM queue; DMs can comment per section (threaded, resolvable) and approve or request changes (a status, not a lock). Comments are visible only to the author and DMs of campaigns where the character participates. Enforce all visibility on the server.
Print view: an A4 RTL print stylesheet for sheet + backstory (black on white), opened from the character menu with window.print() — no PDF library.
```

Acceptance criteria:
- [ ] Unshared sections and DM-only fields never appear in other players' responses.
- [ ] A link to a hidden NPC reveals nothing to the player.
- [ ] The print view is correct on A4 and right-to-left.
- [ ] With `backstoryRequiredForApproval` on, submitting without a backstory is blocked.

---

# Phase 4 — Session Tools

Dependency: Phase 3 (it does not all need to be finished; only 3.4 for the XP link).

## Step 4.1 — Sessions, Scheduling and Attendance

```
STEP 4.1 — SESSIONS AND SCHEDULING. Migration 005 (part 1).
Tables: sessions(id, campaign_id, number, title, scheduled_at, duration_minutes, place_text, online_url, status 'planned'|'confirmed'|'done'|'cancelled', in_world_date TEXT NULL, dm_notes, created_by, created_at, updated_at), session_rsvps(session_id, user_id, status 'yes'|'no'|'maybe', note, updated_at), session_polls(id, session_id, options JSON [{id, startsAt}], status 'open'|'closed') and session_poll_votes(poll_id, option_id, user_id, choice 'yes'|'maybe'|'no'), session_attendance(session_id, participation_id, attended INTEGER).
DM screens: create session (or "propose dates" with 2–5 options to open a poll), confirm a poll option (sets scheduled_at and status 'confirmed'), edit/cancel, mark done with an attendance checklist (increments participation.sessions_attended and writes a history event "حضور در جلسه N" (Attended session N)). Players: next-session card on the campaign home with one-tap RSVP (بله/شاید/نه (yes/maybe/no) + optional note), poll voting with large buttons, session list (upcoming/past). Use the campaign's calendar to show the in-world date when set. Show times in the user's local timezone (store UTC; the campaign has a default timezone setting).
Server enforces membership and roles; spectators can see sessions but not RSVP.
```

Acceptance criteria:
- [ ] The DM creates a poll, players vote, the DM confirms one option.
- [ ] One-tap RSVP works on mobile.
- [ ] Marking "done" records attendance and updates the character's history.
- [ ] Times are displayed with the correct timezone.

## Step 4.2 — Session Recaps and XP/Achievement Awards

Dependency: 4.1 (and 3.4 for XP)

```
STEP 4.2 — SESSION RECAPS AND REWARDS. Migration 005 (part 2).
Tables: session_recaps(id, session_id, author_id, title, body, visibility 'party'|'dm_only', status 'draft'|'published', created_at, updated_at) and session_highlights(id, session_id, participation_id NULL, text, visible_to_player, created_at).
When a session is marked done show a "closing sheet": (1) write or paste the recap (DM, and optionally players if the campaign allows player recaps), (2) award XP or milestone level-up flags (reusing the 3.4 actions), (3) add highlights per character (these also create character_history_events of type 'milestone'), (4) optionally link revealed NPCs/locations/quests mentioned. The campaign home shows a "قبلاً در …" (Previously on…) card with the latest published recap and a recap archive with search. Recaps support simple rich text and are visible by the visibility setting; dm_only drafts never reach players.
```

Acceptance criteria:
- [ ] A draft or dm_only recap never reaches a player.
- [ ] A character highlight is visible in the character's history and timeline.
- [ ] Searching the recap archive works.

## Step 4.3 — Handouts and Maps

```
STEP 4.3 — HANDOUTS AND MAPS. Migration 006.
Tables: handouts(id, campaign_id, title, kind 'text'|'image'|'map', body, media_id NULL, visibility 'hidden'|'revealed'|'selected', revealed_at, tags JSON, sort_index, created_by, created_at, updated_at), handout_recipients(handout_id, participation_id) and map_pins(id, handout_id, x REAL, y REAL, label, note, revealed INTEGER). Media remains in D1 only: client-side compress to webp; handouts/maps cap 400 KB each, per-campaign quota 20 MB (setting); server rejects larger and serves via /api/media/:id with authorization and private caching. No base64 in list responses.
DM: create/edit handouts, reveal to everyone or to selected players with one tap (also during a live encounter), hide again, reorder, tag. Players: a Handouts tab with revealed items only (new ones marked), a mobile image viewer with pinch-zoom, pan and double-tap-to-fit, and a map viewer showing revealed pins (tap = note). Revealing creates a notification event (wired in step 4.6).
```

Acceptance criteria:
- [ ] A hidden or selected handout returns 404 to an unrelated player, and its media is also inaccessible.
- [ ] Zooming and panning the map is smooth on mobile.
- [ ] An image larger than the cap is rejected.

## Step 4.4 — Quest Log

```
STEP 4.4 — QUEST LOG. Migration 007 (part 1).
Table quests(id, campaign_id, title, description, status 'hidden'|'active'|'completed'|'failed'|'abandoned', giver_npc_id NULL, location_id NULL, objectives JSON [{id,text,done,visible}], reward_ref JSON NULL (item/reward ids), session_started_id NULL, session_ended_id NULL, dm_notes, sort_index, created_at, updated_at) and quest_participants(quest_id, participation_id) for optional per-character quests.
DM: create/edit quests, reveal a quest or individual objectives separately, tick objectives, complete/fail with a note, link to NPC/location/rewards. When a quest is completed offer to grant its linked reward package (reuse the existing rewards flow). Players: Quest tab with Active / Completed / Failed, objectives checklist (only visible ones; players cannot tick them unless the campaign setting allows), tap to see the giver and location when revealed. Hidden quests/objectives/dm_notes are stripped server-side.
```

Acceptance criteria:
- [ ] A hidden objective of an active quest does not reach the player.
- [ ] Completing a quest grants the linked reward with DM approval.

## Step 4.5 — Faction Reputation and Party Treasury

```
STEP 4.5 — FACTION REPUTATION AND PARTY TREASURY. Migration 007 (part 2).
Tables: faction_reputation(id, campaign_id, faction_id, participation_id NULL (null = whole party), value INTEGER, min INTEGER, max INTEGER, labels JSON (thresholds → Persian labels), visible INTEGER, updated_at), reputation_log(id, reputation_id, delta, reason, session_id NULL, created_by, created_at), party_items(id, campaign_id, name, quantity, description, category, notes, created_at), party_currency(campaign_id, balances JSON), treasury_log(id, campaign_id, actor_participation_id, type 'add'|'remove'|'transfer_in'|'transfer_out'|'currency', item_ref, qty, note, created_at).
DM: track reputation per faction (party or per-character) with an editable scale and Persian threshold labels, adjust with reasons, choose visibility. Players: see only visible tracks. Treasury: shared stash all members can add to and transfer from/to their own inventory (with a log of who did what); the DM can lock it or require approval per campaign setting. Currency uses the campaign rule_set currencies. All writes use revisions to avoid double-spend on concurrent taps.
```

Acceptance criteria:
- [ ] Two players cannot take the same item simultaneously (revision / clear error).
- [ ] Hidden reputation is never in a player's response.

## Step 4.6 — Notifications (In-App Inbox + Optional Push)

```
STEP 4.6 — NOTIFICATIONS. Migration 008.
Tables: notifications(id, user_id, campaign_id NULL, type, payload JSON, read_at NULL, created_at), notification_prefs(user_id, campaign_id NULL, types JSON, push_enabled INTEGER), push_subscriptions(id, user_id, endpoint, keys JSON, user_agent, created_at). Emit events (server-side, one helper `notify(userIds, type, payload)`): invite received, joined campaign, session scheduled/changed/cancelled, RSVP reminder, poll opened/closed, handout revealed, quest updated, encounter started, approval decided, level-up available, new DM comment on backstory. In-app: bell with unread badge, inbox grouped by campaign, tap navigates to the target (deep links), mark all read, per-type mute in settings. Reminders: compute lazily when a user opens the app or calls /live (no cron), de-duplicated per session; leave a documented extension point for a separate Cloudflare Worker with a Cron Trigger. Web Push (VAPID) is OPTIONAL behind a feature flag: service worker handler, subscribe/unsubscribe UI, server send using WebCrypto; show an honest note that on iPhone push only works for an installed PWA. Never include DM-only text in any notification payload sent to players.
```

Acceptance criteria:
- [ ] Each event creates the correct notification for the right users and not for others.
- [ ] The RSVP reminder does not arrive twice for one session.
- [ ] After muting a type, notifications of that type no longer arrive.

---

# Phase 5 — Completion, Security and Launch

## Step 5.1 — Player Home and Full History

```
STEP 5.1 — PLAYER HOME AND HISTORY POLISH. No new core tables (use existing history/sessions).
Improve Home: "کمپین‌های من" (My campaigns) with current/past tabs (archived/left campaigns are read-only and show my character's final state), next-session countdown per campaign, unread badges; "شخصیت‌های من" (My characters) cards with status and campaigns count; per-character page with a full timeline (joined, level-ups, milestones, session attendance, status changes, deaths/retirement) grouped by campaign, simple stats (campaigns, sessions attended, highest level), and "legacy join": start a new participation from a retired character in another campaign (entry mode rules and DM approval still apply). A DM sees only the history of THEIR campaign for a character. Empty states and skeletons everywhere.
```

- [ ] A DM never sees the history of another campaign.
- [ ] An archived campaign is read-only.

## Step 5.2 — PWA, Offline and Performance

```
STEP 5.2 — PWA, OFFLINE AND PERFORMANCE.
Platform-wide pass: web app manifest (name and short_name generated from APP_NAME_FA, short_name ≤ 12 chars, lang fa, dir rtl, standalone, theme #0E0D0C, 192/512 + maskable icons), service worker caching the app shell and Vazirmatn (woff2), stale-while-revalidate for GET data, an offline edit queue for gameplay fields (current HP, notes, inventory, resource uses) with `revision` conflict dialogs, a visible saving/saved/offline/conflict indicator. Route-level code splitting, virtualized long lists, initial JS ≤ 200 KB gzip, fonts preloaded, images lazy with fixed dimensions (CLS < 0.1), animations on transform/opacity only. Add a Lighthouse CI script or documented manual steps. Do not cache authorization-sensitive API responses across users (clear caches on logout).
```

- [ ] The app opens offline and the sheet is readable.
- [ ] Offline edits sync after reconnecting or show a conflict dialog.
- [ ] After logout, the previous user's data is not accessible from the cache.

## Step 5.3 — Security Hardening and Automated Authorization Tests

```
STEP 5.3 — SECURITY HARDENING AND AUTHORIZATION TESTS.
Write an automated authorization test suite (Vitest + a script hitting the Functions locally) with seeded users: platform admin, campaign-A owner, co_dm, two players, spectator, a non-member, and a second campaign B. For EVERY endpoint family (campaigns, members, invites, content entities, characters, participations, notes, encounters, dice, library/clone, sessions, handouts, quests, reputation, treasury, notifications, media) test: non-member → 404; wrong role → 403; player never receives DM-only fields, hidden entities or other players' private data; cross-campaign ID guessing returns 404; cloning from a campaign where the caller is only a player → 404. Review and fix: rate limits (login, register, invite accept, clone, media upload), CSRF header + Origin check on all writes, CSP and security headers, input validation/length limits, prepared statements only, secure media access, audit log coverage. Add: account data export (all my characters/notes as JSON), account deletion with clear rules (characters anonymized or removed per user choice), and an audit-log viewer for owners (campaign-scoped).
```

- [ ] The automated test suite PASSES on all endpoint families.
- [ ] No endpoint exists without membership/role middleware (automated report).

## Step 5.4 — Instance Admin Console and Usage Monitor

```
STEP 5.4 — INSTANCE ADMIN CONSOLE AND USAGE MONITOR.
Admin-only screens (platform_role 'admin'; no access to campaign content): users list (status, last login, campaigns count, storage used), disable/enable, reset-link generation, sessions revoke; campaigns list (name, owner, member count, status, storage used, last activity) with archive/restore only; instance settings (ALLOW_CAMPAIGN_CREATION, registration mode, per-user media quota, per-campaign media quota); storage monitor estimating D1 usage per table/entity type with a warning threshold; "orphan cleanup" tool (media without references, expired invites/sessions/resets, old login attempts) with a dry-run preview.
```

- [ ] The instance admin cannot read campaign content.
- [ ] The cleanup preview deletes nothing until confirmed.

## Step 5.5 — Deployment, Environments and Backups

```
STEP 5.5 — DEPLOYMENT, ENVIRONMENTS AND BACKUPS (documentation + small scripts, no feature changes).
Write /docs/DEPLOY.md and scripts: two environments (staging and production) with separate D1 databases and secrets; the migration order and a `scripts/migrate.sh` using `wrangler d1 migrations apply`; required env vars/secrets (ADMIN_EMAILS, IP_HASH_SALT, REGISTRATION_MODE, ALLOW_CAMPAIGN_CREATION, quotas); GitHub → Cloudflare Pages build settings; a CI workflow (GitHub Actions) that runs Vitest and the authorization tests on every push and blocks merge on failure; backup scripts (wrangler d1 export with timestamp + restore instructions) and a monthly backup checklist; a "first launch" runbook (register admin, create the Zorvania campaign from the pack, create invites, assign characters); a "rotate secrets / revoke all sessions" runbook; and a rollback plan for a failed migration.
```

- [ ] Someone else can bring the project up using only DEPLOY.md.
- [ ] Backup and restore have actually been tested on staging.

## Step 5.6 — Final QA and Trial Session

```
STEP 5.6 — FINAL QA PASS.
Create /docs/QA.md with a role × device checklist (DM, co-DM, player, spectator × iPhone Safari, Android Chrome, desktop) covering: onboarding via invite, character creation and level-up with approvals on and off, joining a second campaign, live encounter with hidden/revealed monsters, shared dice feed, sessions/RSVP, handouts reveal, quests, treasury, notifications, offline edit and re-sync, export/delete account. Then fix every bug you find while walking the checklist in the LocalApi preview and list the fixes. Include a 90-minute "dry-run session" script for the DM with timed tasks so real friends can test before the first live game.
```

- [ ] A real trial session with 2–3 friends has been run with no blocking errors.

---

# Phase 6 — Future Backlog (write the prompt when needed)

| Idea | When |
|---|---|
| Move media to R2 | When D1 nears its size limit or you want larger images (only the `data` column changes) |
| Real-time sync with Durable Objects/WebSocket | If the 3-second polling delay becomes annoying |
| Content-pack marketplace between DMs | When it expands beyond friends |
| English / multilingual | When a non-Persian-speaking user arrives |
| Systems other than 5e | Only if truly needed |
| Fog of war and tokens on the map | If you want map-based combat |
| Multiclass and Feats | If they enter your campaign's rules |
| Real email for password recovery | With Resend or Cloudflare Email |

---

## Order and Dependency Summary

```
Phase 3:  3.1 → 3.2 → 3.3 → 3.4        3.5 (after 3.3)
Phase 4:  4.1 → 4.2 (depends on 3.4 for XP)
          4.3, 4.4, 4.5 independent (after 4.1)      4.6 last (all events)
Phase 5:  5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
```

After each step: acceptance test, backup (if it had a migration), commit, and only then the next step.