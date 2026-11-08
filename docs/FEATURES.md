# DungeonYar (دانجنیار) — Comprehensive Feature Inventory & System Audit

---

## 1. Overview

**DungeonYar (دانجنیار)** is a Persian-first, RTL, mobile-first companion web application and Progressive Web App (PWA) tailored for D&D 5th Edition (5e) tabletop roleplaying campaigns. It is designed for small gaming groups, independent Dungeon Masters (DMs), and players to manage persistent characters across multiple simultaneous campaigns, conduct live encounters, schedule sessions, and explore shared lore.

* **Target Users:** Tabletop RPG players, co-DMs, campaign owners, and platform administrators.
* **Frontend Architecture:** React 19 (SPA with hash-based routing: `#/`, `#/c/:campaignId/...`, `#/characters/:id`, `#/dev/ui`), TypeScript, Vite, Tailwind CSS v4 design tokens, self-hosted Vazirmatn fonts, Lucide React icons, and PWA capabilities (`vite-plugin-pwa`).
* **Backend Architecture:** Cloudflare Pages Functions (`functions/api/[[route]].ts`) using server-side PBKDF2 WebCrypto (100,000 iterations), strict RBAC authorization, custom CSRF protection (`X-Requested-With: zorvania`), and Cloudflare D1 (SQLite) relational database (`DB` binding).
* **Media & Assets:** In-database SQLite BLOB storage with Base64/binary conversion (table `media`), eliminating external S3/R2 dependencies.
* **Dual Execution Modes:**
  * **LocalApi (Offline/Preview Mode):** Client-side localStorage simulation (`dy_*` keys) with full mock seed data (`src/data/seed.ts`), enabling offline testing and AI Studio preview execution.
  * **HttpApi (Production Backend Mode):** Active when `VITE_API_MODE=http`, dispatching requests to `/api/*` Pages Functions with HTTP-only, secure session cookies (`dy_session`).

---

## 2. Legend & Status Conventions

Every feature in the catalog is evaluated against the current state of the codebase using the following classifications:

| Status | Definition |
| :--- | :--- |
| **Complete** | End-to-end functionality verified: UI controls, client API integration, backend routes (or LocalApi parity), and database persistence exist and function cleanly. |
| **Partial** | Core functionality is present and usable, but specific sub-actions, validation edges, or auxiliary UI dialogs are missing or incomplete. |
| **Backend-only** | API endpoint and database table exist and operate on the server, but there is no direct UI entry point or screen in the client interface. |
| **UI-only** | Component or user interface is visible to users, but its state is purely local, mocked, or lacks backing API persistence in production `HttpApi`. |
| **Stub / Dead** | Code or database structures exist in the repository but are unreferenced, unreachable by hash routing, or shadowed by newer architectural layers. |
| **Dev-only** | Tools, debug panels, or routes specifically reserved for development, testing, or UI gallery inspection (e.g., `#/dev/ui`, dev user switcher). |

---

## 3. Roles & Permissions Matrix

DungeonYar enforces a two-tier authorization model: **Platform Roles** (global account permission) and **Campaign Roles** (per-campaign membership stored in `campaign_members`). Platform administrators do not automatically bypass campaign security unless explicitly added as members.

### 3.1 Role Hierarchy
* **Platform Layer:**
  * `guest`: Unauthenticated visitor (can only register, log in, or consume reset tokens).
  * `user`: Standard authenticated player or GM account.
  * `admin`: Platform instance administrator (`users.platform_role = 'admin'`).
* **Campaign Layer (`campaign_members.role`):**
  * `owner`: Creator or primary Dungeon Master; full administrative authority over the campaign.
  * `co_dm`: Assistant DM; can run encounters, manage NPCs, award XP, approve level-ups, and edit content, but cannot delete or transfer the campaign.
  * `player`: Participant with an active or pending character sheet; can update personal play state, make rolls, view revealed world items, and vote in polls.
  * `spectator`: Read-only observer; can view public campaign feeds and characters, but cannot roll, edit, or vote.

### 3.2 Feature Permissions Matrix

| Functional Area / Action | Guest | User | Admin (Platform) | Spectator | Player | Co-DM | Owner | Evidence & Authority |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Register / Login / Reset Password** | Yes | — | — | — | — | — | — | `functions/api/[[route]].ts:622-865` |
| **Create Campaign** | No | Yes* | Yes | — | — | — | — | `shared/permissions.ts:133` (*if allowed by instance) |
| **Instance Admin Console** | No | No | Yes | No | No | No | No | `functions/api/[[route]].ts:10200` |
| **Campaign Settings & Config** | No | No | No | No | No | No | Yes | `shared/permissions.ts:147` (`campaign:edit_settings`) |
| **Delete or Archive Campaign** | No | No | No | No | No | No | Yes | `shared/permissions.ts:151` (`campaign:delete_archive`) |
| **Transfer Ownership** | No | No | No | No | No | No | Yes | `shared/permissions.ts:149` (`campaign:transfer_ownership`) |
| **Invite Members / Manage Invites** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:153` (`campaign:invite_members`) |
| **Change Member Roles** | No | No | No | No | No | Limited* | Yes | `shared/permissions.ts:157` (*cannot alter owner/co-dm) |
| **Kick Member** | No | No | No | No | No | Limited* | Yes | `shared/permissions.ts:166` (*cannot kick owner/co-dm) |
| **Leave Campaign** | No | No | No | Yes | Yes | Yes | No* | `shared/permissions.ts:173` (*owner must transfer first) |
| **View Character Sheet** | No | No | No | Public | Public | All | All | `shared/permissions.ts:177` (secrets stripped for players) |
| **Edit Character Core / Build** | No | No | No | No | No* | Yes | Yes | `shared/permissions.ts:179` (*player needs Edit Grant) |
| **Edit Character Live State (HP, Slots)** | No | No | No | No | Own | All | All | `shared/permissions.ts:181` (`character:edit_live_state`) |
| **Level Up Request** | No | No | No | No | Own | Yes | Yes | `shared/permissions.ts:189` (`character:level_up`) |
| **Approve / Reject Level Up & Joins** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:155` |
| **DM Override Sheet State** | No | No | No | No | No | Yes | Yes | `functions/api/[[route]].ts:3246` |
| **Roll Dice (Table Visibility)** | No | No | No | No | Yes | Yes | Yes | `shared/permissions.ts:197` (`dice:roll_table`) |
| **Roll Secret Dice (DM Only)** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:221` (`dice:roll_secret`) |
| **View Dice Feed** | No | No | No | Yes | Yes | Yes | Yes | `shared/permissions.ts:223` (secret rolls stripped) |
| **Clear Dice Feed** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:225` (`dice:clear_log`) |
| **Run Live Encounters & Turn Tracker** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:228` (`dm_tools:run_encounters`) |
| **Submit Encounter Initiative** | No | No | No | No | Own | Yes | Yes | `functions/api/[[route]].ts:5440` |
| **Bestiary & NPC Management** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:230` (`dm_tools:bestiary`) |
| **Item Vault & Reward Distribution** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:232` (`dm_tools:items_loot`) |
| **Handouts & Maps Management** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:234` (`dm_tools:handouts_maps`) |
| **View Handouts & Maps** | No | No | No | Revealed | Revealed | All | All | `functions/api/[[route]].ts:8187` |
| **Quests Management** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:236` (`dm_tools:quests`) |
| **Toggle Assigned Quest Objectives** | No | No | No | No | Assigned | Yes | Yes | `functions/api/[[route]].ts:8801` |
| **Sessions & Scheduling** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:238` (`dm_tools:sessions_scheduling`) |
| **RSVP & Date Poll Voting** | No | No | No | No | Yes | Yes | Yes | `functions/api/[[route]].ts:7470` |
| **Session Recaps & Highlights** | No | No | No | Published| Published| Yes | Yes | `shared/permissions.ts:240` (`dm_tools:recaps`) |
| **Party Shared Treasury Management** | No | No | No | View | Member | Yes | Yes | `functions/api/[[route]].ts:9252-9487` |
| **Campaign Notes & Plot Secrets** | No | No | No | No | No | Yes | Yes | `shared/permissions.ts:242` (`dm_tools:campaign_notes`) |
| **Multi-Calendar & World Clock** | No | No | No | View | View | Yes | Yes | `functions/api/[[route]].ts:6000-6300` |

---

## 4. Feature Catalog by Domain

### Domain 1: Authentication, Accounts & Platform Administration

#### AUTH-01: User Registration with Invite Code ("عضویت در کارزار با کد دعوت دانجن مستر")
- **Status:** Complete
- **What it does:** Allows new users to create an account by entering their email, password, display name, and an optional campaign/platform invite code. If instance settings require an invite code (`REGISTRATION_MODE=invite`), registration fails without a valid unexpired code.
- **Who can use it:** Guest (unauthenticated visitors).
- **How to reach it in the UI:** Header → "ورود / عضویت" button → switch tab to "عضویت در بازی" (or open deep link `#/register?code=...`).
- **Key files:**
  - Component: `src/components/AuthModal.tsx:21,120`
  - Client API: `src/services/api.ts:484` (`api.register`)
  - Server Route: `functions/api/[[route]].ts:622` (`POST /api/auth/register`)
  - Database Tables: `users`, `invites`, `campaign_invites`, `auth_sessions`, `audit_log`
- **Notes/limits:** Password strength meter is enforced in the UI. Passwords are hash-verified using PBKDF2-SHA-256 with 100,000 iterations on the server. Rate limited per IP hash.

#### AUTH-02: User Authentication & Login ("ورود ماجراجویان و دانجن مستر به گاهشمار وقایع")
- **Status:** Complete
- **What it does:** Authenticates an existing user via email and password, establishing an HTTP-only secure cookie session (`dy_session`) in production or updating `active_user_id` in localStorage preview mode. Enforces exponential backoff and lockouts on repeated failed login attempts.
- **Who can use it:** Guest (unauthenticated visitors).
- **How to reach it in the UI:** Header → "ورود / عضویت" button → "ورود به بازی" tab (or navigate to `#/login`).
- **Key files:**
  - Component: `src/components/AuthModal.tsx:21,118`
  - Client API: `src/services/api.ts:483` (`api.login`)
  - Server Route: `functions/api/[[route]].ts:742` (`POST /api/auth/login`)
  - Database Tables: `users`, `auth_sessions`, `login_attempts`, `audit_log`
- **Notes/limits:** Requires `X-Requested-With: zorvania` CSRF header on state-changing requests. Returns detailed Persian error messages for invalid credentials, locked accounts, or disabled statuses.

#### AUTH-03: Single & Global Logout ("خروج از حساب / خروج از تمام نشست‌ها")
- **Status:** Complete
- **What it does:** Terminates the current session by invalidating the active session cookie/record, or revokes all active session tokens across all devices belonging to the user.
- **Who can use it:** Authenticated User, Admin, Campaign Members.
- **How to reach it in the UI:**
  - Current session: Header → Menu (Hamburger/Avatar) → "خروج از حساب" (or BottomNav → "بیشتر" → "خروج از حساب").
  - All sessions: Header → Menu → "حساب کاربری و نشست‌ها" → "نشست‌های فعال" → "خروج از تمام نشست‌ها".
- **Key files:**
  - Components: `src/components/Header.tsx:691`, `src/components/AccountModal.tsx:189`, `src/components/mobile/CampaignMoreSheet.tsx:48`
  - Client API: `src/services/api.ts:485,486` (`api.logout`, `api.logoutAll`)
  - Server Routes: `functions/api/[[route]].ts:825` (`POST /api/auth/logout`), `functions/api/[[route]].ts:834` (`POST /api/auth/logout-all`)
  - Database Tables: `auth_sessions`, `audit_log`
- **Notes/limits:** Clears local storage caches and redirects user directly to the public home state.

#### AUTH-04: Password Reset via Admin Token ("تنظیم رمز عبور جدید از طریق پیوند اختصاصی")
- **Status:** Complete
- **What it does:** Allows a user to submit a new password using a single-use cryptographically hashed token generated by a platform administrator.
- **Who can use it:** Guest / User in possession of a valid reset token.
- **How to reach it in the UI:** Open direct deep link with token parameter: `#/reset-password?token=...` (triggers `AuthModal` in reset mode).
- **Key files:**
  - Component: `src/components/AuthModal.tsx:93,122`
  - Client API: `src/services/api.ts:488` (`api.consumeResetToken`)
  - Server Route: `functions/api/[[route]].ts:865` (`POST /api/auth/reset`)
  - Database Tables: `password_resets`, `users`, `auth_sessions`, `audit_log`
- **Notes/limits:** The token is invalidated immediately upon use. All previous active sessions for the user are automatically revoked for security.

#### AUTH-05: Profile Display Name Update ("ویرایش مشخصات فردی")
- **Status:** Complete
- **What it does:** Allows an authenticated user to update their publicly visible display name across campaigns, character sheets, and dice feeds.
- **Who can use it:** Authenticated User, Admin.
- **How to reach it in the UI:** Header → Menu → "حساب کاربری و نشست‌ها" → "مشخصات فردی" tab → edit "نام نمایشی" → click "ذخیره تغییرات".
- **Key files:**
  - Component: `src/components/AccountModal.tsx:105,113`
  - Client API: `src/services/api.ts:492` (`api.updateProfile`)
  - Server Route: `functions/api/[[route]].ts:4057` (`PATCH /api/me`)
  - Database Tables: `users`
- **Notes/limits:** Input validated for non-empty string and sanitized against script tags.

#### AUTH-06: Self Password & Email Change ("تغییر گذرواژه و ایمیل")
- **Status:** Complete
- **What it does:** Enables the user to change their account login password or update their login email address by confirming their current password.
- **Who can use it:** Authenticated User, Admin.
- **How to reach it in the UI:** Header → Menu → "حساب کاربری و نشست‌ها" → "امنیت و گذرواژه" tab → enter current password and new credentials → submit.
- **Key files:**
  - Component: `src/components/AccountModal.tsx:123,152`
  - Client API: `src/services/api.ts:493,494` (`api.changePassword`, `api.changeEmail`)
  - Server Routes: `functions/api/[[route]].ts:4077` (`POST /api/me/password`), `functions/api/[[route]].ts:4103` (`POST /api/me/email`)
  - Database Tables: `users`, `audit_log`
- **Notes/limits:** Re-verifies existing password with constant-time comparison before applying modifications.

#### AUTH-07: Active User Sessions Audit & Revocation ("نشست‌های فعال و لغو دسترسی")
- **Status:** Complete
- **What it does:** Lists all active browser and device sessions for the authenticated account, displaying IP hash, device/user-agent summary, and last access time, with the ability to selectively revoke individual sessions.
- **Who can use it:** Authenticated User, Admin.
- **How to reach it in the UI:** Header → Menu → "حساب کاربری و نشست‌ها" → "نشست‌های فعال" tab → view session cards → click "لغو این نشست".
- **Key files:**
  - Component: `src/components/AccountModal.tsx:77,176`
  - Client API: `src/services/api.ts:495,498` (`api.listSessions`, `api.revokeSession`)
  - Server Routes: `functions/api/[[route]].ts:4135` (`GET /api/me/sessions`), `functions/api/[[route]].ts:4154` (`DELETE /api/me/sessions/:id`)
  - Database Tables: `auth_sessions`
- **Notes/limits:** Current session is explicitly highlighted with a "این نشست (فعلی)" chip to prevent accidental self-lockout.

#### AUTH-08: Self Data Export & GDPR Account Deletion ("دریافت داده‌های حساب و حذف کاربری")
- **Status:** Complete
- **What it does:** Generates a downloadable JSON archive of all master characters, notes, campaign participations, and preferences. Also provides a destructive modal to permanently delete the user's account and reassign or prune owned campaigns.
- **Who can use it:** Authenticated User.
- **How to reach it in the UI:** Header → Menu → "حساب کاربری و نشست‌ها" → "داده‌ها و حریم خصوصی" tab → "دریافت نسخه پشتیبان داده‌ها" or "حذف حساب کاربری".
- **Key files:**
  - Component: `src/components/AccountModal.tsx:197,215`
  - Client API: `src/services/api.ts:1000+` (`api.exportAccountData`, `api.deleteAccount`)
  - Server Routes: `functions/api/[[route]].ts:10063` (`GET /api/account/export`), `functions/api/[[route]].ts:10117` (`POST /api/account/delete`)
  - Database Tables: `users`, `characters`, `character_participations`, `notes`, `audit_log`
- **Notes/limits:** Deletion requires typing the confirmation keyword `DELETE` / `حذف`. Cannot delete if owner of an active campaign without transferring ownership first.

#### AUTH-09: Dev User Switcher ("تعویض کاربر برای آزمایش")
- **Status:** Dev-only
- **What it does:** Allows quick switching between pre-seeded test accounts (e.g., Dungeon Master, various Player personas) with one click without entering passwords.
- **Who can use it:** Developers / Testers in local preview mode.
- **How to reach it in the UI:** Header → Menu → open expandable details block "تعویض کاربر (برای آزمایش)" → click target user.
- **Key files:**
  - Component: `src/components/Header.tsx:695-715`
  - Client API: `src/services/api.ts:489` (`api.switchUser` in `LocalApi`)
  - Server Route: No server route in `functions/api/[[route]].ts` (client-side preview simulation only).
- **Notes/limits:** Only rendered when multiple users exist in the active storage adapter and `VITE_API_MODE !== 'http'`.

#### AUTH-10: Instance Admin Console ("کنسول مدیریت سامانه")
- **Status:** Complete
- **What it does:** Provides platform-level administration across all users and campaigns. Features include toggling user status (`active` / `disabled`), generating single-use password reset links, revoking any user's sessions, archiving/restoring any campaign, and configuring platform settings (`REGISTRATION_MODE`, campaign creation policies).
- **Who can use it:** Platform Admin (`users.platform_role = 'admin'`).
- **How to reach it in the UI:** Header → Menu → "کنسول مدیریت سامانه" (visible only if `currentUser.platformRole === 'admin'`).
- **Key files:**
  - Component: `src/components/admin/AdminConsoleModal.tsx:24`
  - Client API: `src/services/api.ts:1000+` (`api.getAdminUsers`, `api.toggleAdminUserStatus`, `api.generateAdminResetLink`, `api.revokeAdminUserSessions`, `api.getAdminCampaigns`, `api.archiveAdminCampaign`, `api.restoreAdminCampaign`, `api.getInstanceSettings`, `api.updateInstanceSettings`)
  - Server Routes: `functions/api/[[route]].ts:10200-10370` (`GET/POST /api/admin/*`)
  - Database Tables: `users`, `campaigns`, `instance_settings`, `auth_sessions`, `audit_log`
- **Notes/limits:** Access strictly verified on server by examining `platform_role === 'admin'` from the authenticated session.

#### AUTH-11: Storage Monitor & Orphaned Media Cleanup ("پایش حافظه و پاکسازی داده‌های یتیم")
- **Status:** Complete
- **What it does:** Displays D1 database size metrics, individual table row counts, and SQLite BLOB media usage against a configurable warning threshold. Includes a dry-run and live maintenance tool to detect and purge orphaned media files, expired tokens, and stale drafts.
- **Who can use it:** Platform Admin.
- **How to reach it in the UI:** Header → Menu → "کنسول مدیریت سامانه" → "فضای ذخیره‌سازی" or "پاکسازی داده‌های یتیم" tabs.
- **Key files:**
  - Component: `src/components/admin/AdminConsoleModal.tsx:54-95,174`
  - Client API: `src/services/api.ts:1000+` (`api.getStorageStats`, `api.runOrphanCleanup`)
  - Server Routes: `functions/api/[[route]].ts:10372` (`GET /api/admin/storage`), `functions/api/[[route]].ts:10439` (`POST /api/admin/cleanup`)
  - Database Tables: `media`, `password_resets`, `login_attempts`, `participation_snapshots`
- **Notes/limits:** Dry-run preview executes first to detail the exact number and byte size of records slated for deletion.

#### PREF-01: Theme Toggle & Semantic Design Tokens ("حالت ظاهری: تاریک / روشن")
- **Status:** Complete
- **What it does:** Toggles the visual interface between default Dark theme and Day/Light theme, persisting the user choice in browser storage and dynamically updating `data-theme` and the HTML `<meta name="theme-color">` tag.
- **Who can use it:** All users and visitors.
- **How to reach it in the UI:** Header → Menu → "نمایش" group → click "حالت ظاهری" row (toggles between "تاریک" and "روشن").
- **Key files:**
  - Components: `src/components/Header.tsx:613`, `src/App.tsx:310-349`
  - Styles: `src/styles/tokens.css`, `src/styles/theme.css`, `src/index.css`
- **Notes/limits:** Zero raw hex colors in UI components; all styling derives from semantic CSS variables (`--bg`, `--surface`, `--accent`, `--border`). Meets WCAG AA contrast in both themes.

#### PREF-02: Font Scale Adjustment ("اندازه قلم: استاندارد / بزرگ / خیلی بزرگ")
- **Status:** Complete
- **What it does:** Adjusts the root typography scale of the application between Standard (100%), Large (112.5%), and Extra Large (125%) to ensure comfortable reading across mobile and tablet screens.
- **Who can use it:** All users.
- **How to reach it in the UI:** Header → Menu → "نمایش" group → click "اندازه قلم" row (cycles through standard, large, xlarge).
- **Key files:**
  - Components: `src/components/Header.tsx:624`, `src/App.tsx:297-308`
  - CSS: `src/index.css` (`.font-scale-large`, `.font-scale-xlarge`)
- **Notes/limits:** Persisted in `localStorage ('zorvania_font_scale')`. Preserves minimum tap targets (≥ 44px) regardless of font scale.

#### PREF-03: Screen Wake Lock ("روشن ماندن صفحه")
- **Status:** Complete
- **What it does:** Leverages the Screen Wake Lock API to prevent the mobile screen from dimming or locking during live gaming sessions.
- **Who can use it:** All users on supported mobile/desktop browsers.
- **How to reach it in the UI:** Header → Menu → "نمایش" group → click "روشن ماندن صفحه" (toggles on/off).
- **Key files:**
  - Component: `src/components/Header.tsx:637`
  - Hook: `src/hooks/useWakeLock.ts:1`
- **Notes/limits:** Automatically re-acquires lock when tab regains visibility; gracefully hides toggle if the browser does not support the Wake Lock API.

---

### Domain 2: Campaign Management & Membership

#### CAMP-01: Multi-Campaign Workspace & Switcher ("جابه‌جایی بین کمپین‌ها")
- **Status:** Complete
- **What it does:** Provides a bottom sheet allowing users to quickly switch their active campaign context, navigate back to the home dashboard, or start a new campaign. Updates the URL hash to `#c/:campaignId/overview`.
- **Who can use it:** Campaign Members, GMs, Players.
- **How to reach it in the UI:**
  - In campaign: Click campaign name button in top header bar (or Header → Menu → "جابه‌جایی بین کمپین‌ها").
  - On Home screen: Click any campaign card.
- **Key files:**
  - Components: `src/components/campaign/CampaignSwitcherModal.tsx:17`, `src/components/Header.tsx:316`
  - Client API: `src/services/api.ts:634` (`api.listCampaigns`, `api.setActiveCampaignId`)
  - Server Route: `functions/api/[[route]].ts:1264` (`GET /api/campaigns`)
  - Database Tables: `campaigns`, `campaign_members`
- **Notes/limits:** Displays current campaign indicator, member count, and user's specific role badge (`مالک`, `دستیار DM`, `ماجراجو`).

#### CAMP-02: Campaign Creation & 8-Step Setup Wizard ("ویزارد راه‌اندازی کمپین")
- **Status:** Complete
- **What it does:** Guides DMs through an 8-step wizard to initialize a complete campaign from scratch, from a template, or from a content pack. Steps: 1) Identity & cover art upload, 2) 5e rule configurations (ability methods, starting/max level), 3) World, calendar & factions, 4) NPCs & cast, 5) Loot & vault items, 6) Session zero agreement doc, 7) Player invite generation, 8) Review & launch.
- **Who can use it:** Authenticated Users with campaign creation permission (`platform:create_campaign`).
- **How to reach it in the UI:** Home screen → "کمپین جدید" button (or Campaign Switcher → "+ کمپین جدید").
- **Key files:**
  - Components: `src/components/campaign/CampaignWizardModal.tsx:39`, `src/components/campaign/CreateCampaignModal.tsx:21`
  - Client API: `src/services/api.ts:636,750` (`api.createDraftCampaign`, `api.updateWizardState`, `api.launchCampaign`)
  - Server Routes: `functions/api/[[route]].ts:6675` (`POST /api/campaigns/draft`), `functions/api/[[route]].ts:6720` (`PATCH /api/campaigns/:id/wizard`), `functions/api/[[route]].ts:6748` (`POST /api/campaigns/:id/launch`)
  - Database Tables: `campaigns`, `campaign_members`, `calendars`, `calendar_states`, `campaign_time`, `campaign_docs`, `campaign_invites`
- **Notes/limits:** Wizard saves progress incrementally to `campaigns.wizard_state`. Supports copy-on-use templates (Zorvania, Gathic, Scratch). Step 3 halts and rolls back if calendar initialization fails.

#### CAMP-03: Campaign Settings & Rule Configuration ("تنظیمات و قوانین کمپین")
- **Status:** Complete
- **What it does:** Allows the Campaign Owner to configure operational rules and preferences: approval policies (`onCreate`, `onLevelUp`, backstory required), level constraints (starting level, max entry level), measurement units (metric/imperial), dice visibility defaults (table feed vs secret), and encounter display modes (exact HP vs qualitative health bars, AC visibility).
- **Who can use it:** Campaign Owner only (`campaign:edit_settings`).
- **How to reach it in the UI:** In campaign → Header → Menu → "تنظیمات و قوانین کمپین" (or DM Tools → Settings tab).
- **Key files:**
  - Component: `src/components/campaign/CampaignSettingsModal.tsx:17`
  - Client API: `src/services/api.ts:637` (`api.updateCampaign`)
  - Server Route: `functions/api/[[route]].ts:1634` (`PATCH /api/c/:campaignId`)
  - Database Tables: `campaigns` (`settings` JSON column)
- **Notes/limits:** Stored as structured JSON in `campaigns.settings`. Server enforces that only the campaign owner can modify these settings.

#### CAMP-04: Membership Management & Role Assignment ("مدیریت اعضا و تعیین نقش‌ها")
- **Status:** Complete
- **What it does:** Displays all members joined to the campaign with their status and role badge (`مالک`, `دستیار DM`, `ماجراجو`, `تماشاچی`). Enables owners to promote/demote members, kick members, or transfer ownership. Co-DMs have restricted permissions (cannot kick or change roles of the owner or other co-DMs).
- **Who can use it:** Campaign Owner, Co-DM (`campaign:change_member_roles`, `campaign:kick_member`).
- **How to reach it in the UI:** In campaign → Header → Menu → "اعضا و نقش‌ها".
- **Key files:**
  - Component: `src/components/campaign/CampaignMembersModal.tsx:20`
  - Client API: `src/services/api.ts:641` (`api.listCampaignMembers`, `api.updateCampaignMember`, `api.removeCampaignMember`)
  - Server Routes: `functions/api/[[route]].ts:1295` (`GET /api/c/:id/members`), `functions/api/[[route]].ts:1662` (`PATCH /api/c/:id/members/:uid`), `functions/api/[[route]].ts:1704` (`DELETE /api/c/:id/members/:uid`)
  - Database Tables: `campaign_members`, `audit_log`
- **Notes/limits:** RBAC rules verified on server using `shared/permissions.ts:canChangeMemberRole` and `canKickMember`.

#### CAMP-05: Campaign Invites Generation ("کدهای دعوت کمپین")
- **Status:** Complete
- **What it does:** Generates unique, shareable invite links and alphanumeric codes tied to specific campaign roles (`player`, `co_dm`, `spectator`), expiration durations (in days), and usage limits. Includes a 1-tap copy link button.
- **Who can use it:** Campaign Owner, Co-DM (`campaign:invite_members`).
- **How to reach it in the UI:** In campaign → Header → Menu → "کدهای دعوت".
- **Key files:**
  - Component: `src/components/campaign/CampaignInvitesModal.tsx:24`
  - Client API: `src/services/api.ts:646` (`api.listCampaignInvites`, `api.createCampaignInvite`, `api.revokeCampaignInvite`)
  - Server Routes: `functions/api/[[route]].ts:1319` (`GET /api/c/:id/invites`), `functions/api/[[route]].ts:1345` (`POST /api/c/:id/invites`), `functions/api/[[route]].ts:1389` (`DELETE /api/c/:id/invites/:inviteId`)
  - Database Tables: `campaign_invites`, `audit_log`
- **Notes/limits:** Co-DMs cannot generate invites for the `owner` role. Expired or maxed-out codes are rejected automatically on the server.

#### CAMP-06: Campaign Join by Invite Code ("پیوستن به کمپین با کد دعوت")
- **Status:** Complete
- **What it does:** Validates an invite code entered by a player or received via deep link (`#/join?code=...`), assigns the user to `campaign_members` with the code's designated role, and redirects to the campaign workspace.
- **Who can use it:** Authenticated Users.
- **How to reach it in the UI:** Home screen → "کد دعوت دارید؟" input field → enter code → click "پیوستن به کمپین" (or open deep link `#/join?code=...`).
- **Key files:**
  - Components: `src/components/campaign/JoinCampaignModal.tsx:21`, `src/components/home/HomeScreen.tsx:105-115`
  - Client API: `src/services/api.ts:649` (`api.acceptInvite`)
  - Server Route: `functions/api/[[route]].ts:1408` (`POST /api/invites/accept`)
  - Database Tables: `campaign_invites`, `campaign_members`, `audit_log`
- **Notes/limits:** Atomically increments `used_count` in `campaign_invites`. Rejoining an existing campaign returns existing membership without duplicate entries.

#### CAMP-07: Campaign Ownership Transfer ("انتقال مالکیت کمپین")
- **Status:** Complete
- **What it does:** Irreversibly transfers campaign ownership from the current owner to another active member, downgrading the original owner to `co_dm`.
- **Who can use:** Campaign Owner only (`campaign:transfer_ownership`).
- **How to reach it in the UI:** In campaign → Header → Menu → "اعضا و نقش‌ها" → click "انتقال مالکیت" button next to eligible member → confirm in dialog.
- **Key files:**
  - Component: `src/components/campaign/CampaignMembersModal.tsx:38-81`
  - Client API: `src/services/api.ts:644` (`api.transferCampaignOwnership`)
  - Server Route: `functions/api/[[route]].ts:1730` (`POST /api/c/:campaignId/transfer-ownership`)
  - Database Tables: `campaigns`, `campaign_members`, `audit_log`
- **Notes/limits:** Requires explicit confirmation in a secondary dialog. Server verifies caller is the current `owner_id`.

#### CAMP-08: Campaign Archival, Restoration & Deletion ("بایگانی، بازگردانی و حذف کمپین")
- **Status:** Complete
- **What it does:** Allows owners (or platform admins via console) to archive a finished campaign into read-only mode, restore an archived campaign back to active status, or permanently delete a campaign workspace and its scoped records.
- **Who can use it:** Campaign Owner, Platform Admin.
- **How to reach it in the UI:**
  - Owner: Campaign Settings → Archival actions (or Home screen "بایگانی" tab).
  - Admin: Admin Console → "کمپین‌ها" tab → "بایگانی" or "بازگردانی".
- **Key files:**
  - Components: `src/components/home/HomeScreen.tsx:210`, `src/components/admin/AdminConsoleModal.tsx:137,148`
  - Client API: `src/services/api.ts:638,639,640` (`api.archiveCampaign`, `api.restoreCampaign`, `api.deleteCampaign`)
  - Server Routes: `functions/api/[[route]].ts:10310` (`POST /api/admin/campaigns/:id/archive`), `functions/api/[[route]].ts:10318` (`POST /api/admin/campaigns/:id/restore`)
  - Database Tables: `campaigns`, `audit_log`
- **Notes/limits:** Archived campaigns display a read-only spectator banner and block state-changing mutations across sheet and encounter tools.

#### CAMP-09: Campaign Approvals Queue ("صف تأیید شخصیت‌ها و ارتقای سطح")
- **Status:** Complete
- **What it does:** Centralized review dashboard for DMs to inspect, approve, reject, or request changes on pending character creation submissions and level-up payloads. Displays diff summaries (HP gain, new features, ability increases).
- **Who can use it:** Campaign Owner, Co-DM (`campaign:approve_reject_joins`).
- **How to reach it in the UI:** Header → Menu → "تأیید شخصیت‌ها و ارتقای سطح" (or notification banner on Home screen: "... درخواست منتظر تأیید شماست").
- **Key files:**
  - Component: `src/components/campaign/CampaignApprovalsModal.tsx:32`
  - Client API: `src/services/api.ts:672` (`api.reviewParticipation`)
  - Server Routes: `functions/api/[[route]].ts:2733` (`POST /api/c/:id/participations/:pid/approve|reject|request_changes`), `functions/api/[[route]].ts:3146` (`POST /api/c/:id/participations/:pid/approve-level-up`), `functions/api/[[route]].ts:3374` (`POST /api/c/:id/sheet-change-requests/:id/review`)
  - Database Tables: `character_participations`, `sheet_change_requests`, `participation_snapshots`, `audit_log`
- **Notes/limits:** Badges in Header and Home display live unread count of pending approvals.

#### CAMP-10: Campaign Audit Log ("تاریخچه امنیتی کمپین")
- **Status:** Complete
- **What it does:** Provides a tamper-evident audit log of sensitive campaign events: membership changes, role promotions, XP awards, DM sheet overrides, handout reveals, and setting updates.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** In campaign → Header → Menu → "ابزارهای مستر" → "گزارش رویدادها" (or DM Tools → Audit Log tab).
- **Key files:**
  - Component: `src/components/dm/DmAuditLogViewer.tsx:1` / `src/components/dm/DmAuditLog.tsx:1`
  - Client API: `src/services/api.ts:516,1015` (`api.getAuditLog`, `api.getCampaignAuditLog`)
  - Server Routes: `functions/api/[[route]].ts:4488` (`GET /api/audit`), `functions/api/[[route]].ts:10165` (`GET /api/c/:campaignId/audit-log`)
  - Database Tables: `audit_log`
- **Notes/limits:** Strips sensitive raw IP data; formats timestamps into Persian localized relative time.

#### HOME-01: Player & DM Unified Home Dashboard ("صفحه اصلی / داشبورد کمپین‌ها")
- **Status:** Complete
- **What it does:** The primary landing screen after login. Aggregates the user's active campaigns, past/archived campaigns, characters, pending approvals queue, unfinished campaign/character drafts with progress bars, and the invite-code entry box.
- **Who can use it:** Authenticated Users, DMs, Players.
- **How to reach it in the UI:** Top-left header logo/home icon (or navigate to `#/home` or `#/`).
- **Key files:**
  - Component: `src/components/home/HomeScreen.tsx:75`
  - Client API: `src/services/api.ts:632` (`api.getHomeSummary`)
  - Server Route: `functions/api/[[route]].ts:1008` (`GET /api/home`)
  - Database Tables: `campaigns`, `campaign_members`, `characters`, `character_participations`, `sessions`
- **Notes/limits:** Calculates session countdowns ("جلسه بعدی: ۲ روز دیگر"), unread notifications count, and draft completion percentages.

#### NOTIF-01: Notifications Drawer & Event Center ("کشو و فهرست رویدادها و اعلان‌ها")
- **Status:** Complete
- **What it does:** Slide-out drawer presenting in-app alerts categorized by session reminders, level-up approvals, DM announcements, quest updates, and loot awards. Supports filtering by unread/all, marking individual or all as read, and deleting notifications.
- **Who can use it:** Authenticated Users.
- **How to reach it in the UI:** Header → Bell icon (shows unread badge count) or Header → Menu → "اعلان‌ها و رویدادها".
- **Key files:**
  - Component: `src/components/notifications/NotificationsDrawer.tsx:38`
  - Client API: `src/services/api.ts:980` (`api.listNotifications`, `api.markNotificationRead`, `api.markAllNotificationsRead`, `api.deleteNotification`)
  - Server Routes: `functions/api/[[route]].ts:9689` (`GET /api/notifications`), `functions/api/[[route]].ts:9806` (`POST /api/notifications/:id/read`), `functions/api/[[route]].ts:9814` (`POST /api/notifications/read-all`), `functions/api/[[route]].ts:9830` (`DELETE /api/notifications/:id`)
  - Database Tables: `notifications`
- **Notes/limits:** Polled periodically during active sessions; clicking an item automatically marks it as read and jumps to the relevant campaign tab.

#### NOTIF-02: Granular Notification Preferences ("تنظیمات دسته‌بندی اعلان‌ها")
- **Status:** Complete
- **What it does:** Allows users to customize which alert categories they receive (session updates, level-up notifications, DM notes, combat alerts) on a global or per-campaign level.
- **Who can use it:** Authenticated Users.
- **How to reach it in the UI:** Notifications Drawer → Settings icon (cog) at top header → opens `NotificationPreferencesModal`.
- **Key files:**
  - Component: `src/components/notifications/NotificationPreferencesModal.tsx:27`
  - Client API: `src/services/api.ts:985` (`api.getNotificationPreferences`, `api.updateNotificationPreferences`)
  - Server Routes: `functions/api/[[route]].ts:9838` (`GET /api/notifications/preferences`), `functions/api/[[route]].ts:9864` (`PUT /api/notifications/preferences`)
  - Database Tables: `notification_prefs`
- **Notes/limits:** Settings take immediate effect and mute server-side notification generation for unchecked categories.

#### NOTIF-03: Web Push Subscription ("اشتراک اعلان‌های وب و مرورگر")
- **Status:** Complete
- **What it does:** Manages browser Web Push API registration (`PushSubscription`) using service worker push events, storing subscription keys on the server to dispatch background session and turn alerts.
- **Who can use it:** Authenticated Users on compatible browsers.
- **How to reach it in the UI:** Notifications Drawer → Settings icon → "اعلان‌های مرورگر (Web Push)" toggle switch.
- **Key files:**
  - Component: `src/components/notifications/NotificationPreferencesModal.tsx:35,55`
  - Client API: `src/services/api.ts:987` (`api.subscribePush`, `api.unsubscribePush`)
  - Server Routes: `functions/api/[[route]].ts:9891` (`POST /api/push/subscribe`), `functions/api/[[route]].ts:9914` (`POST /api/push/unsubscribe`)
  - Database Tables: `push_subscriptions`
- **Notes/limits:** Checks browser `Notification.permission` and service worker availability before requesting subscription.

---

### Domain 3: Master Characters & Participation Lifecycle

#### CHAR-01: Character Creation Wizard ("ویزارد ساخت شخصیت")
- **Status:** Complete
- **What it does:** Multi-step wizard guiding players through 5e character generation. Steps: 1) Identity, name, portrait upload, and lineage selection; 2) Class selection and hit die; 3) Ability score generation (Standard Array, Point Buy, 4d6 roll, Manual); 4) Background selection, skill & tool proficiencies; 5) Starting equipment choice packages; 6) Spellcasting setup (cantrips and 1st-level spells for casters); 7) Backstory & hooks (optional); 8) Review, server-authoritative stat derivation, and submission.
- **Who can use it:** Authenticated Users, Players.
- **How to reach it in the UI:** Home screen → "شخصیت‌ها" section → click "+ ساخت شخصیت جدید" (or Home screen drafts → "ادامه").
- **Key files:**
  - Component: `src/components/character-wizard/CharacterCreationWizardModal.tsx:91`
  - Engine: `shared/rules/wizardEngine.ts:1`, `shared/rules/engine.ts:1`
  - Client API: `src/services/api.ts:678-683` (`api.rollWizardAbilities`, `api.saveDraftParticipation`, `api.submitCharacterWizard`)
  - Server Routes: `functions/api/[[route]].ts:3575` (`POST /api/c/wizard/roll-abilities`), `functions/api/[[route]].ts:3601` (`POST /api/c/:id/participations/draft`), `functions/api/[[route]].ts:3674` (`POST /api/c/:id/participations/wizard-submit`)
  - Database Tables: `characters`, `character_participations`, `lineage_templates`, `class_templates`, `background_templates`, `items`
- **Notes/limits:** Supports auto-saving draft participations (`saveDraftParticipation`) so players can pause and resume creation anytime from the Home dashboard.

#### CHAR-02: Master Character Record & Identity ("پرونده جامع شخصیت")
- **Status:** Complete
- **What it does:** Displays and manages a character's core identity independent of any single campaign. Includes name, race, age, height, weight, physical appearance description, visual portrait, embedded backstory editor, and campaign participation status.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Home screen → "شخصیت‌های من" → click any character card (or navigate to `#/characters/:id`).
- **Key files:**
  - Component: `src/components/character/MasterCharacterScreen.tsx:52`
  - Client API: `src/services/api.ts:654-657` (`api.getMasterCharacter`, `api.updateMasterCharacter`)
  - Server Routes: `functions/api/[[route]].ts:4517` (`GET /api/characters/:id`), `functions/api/[[route]].ts:2001` (`PATCH /api/characters/:id`)
  - Database Tables: `characters`
- **Notes/limits:** Re-computes age/appearance changes and syncs across campaign participations where appropriate.

#### CHAR-03: Campaign Participation & Entry Mode ("حضور در کمپین و سطح ورود")
- **Status:** Complete
- **What it does:** Manages the distinct play state of a character inside a specific campaign (class, level, HP, current spell slots, inventory). Governs entry level modes: `campaign_start` (start at campaign base level), `same_level` (enter at current character level), or `new_level` (explicit custom level capped by `maxEntryLevel`).
- **Who can use it:** Players, Co-DM, Campaign Owner.
- **How to reach it in the UI:** Master Character Screen → "کمپین‌ها و حضور" tab → "پیوستن به کمپین" (or accepting a campaign invite).
- **Key files:**
  - Component: `src/components/character/MasterCharacterScreen.tsx:592`
  - Client API: `src/services/api.ts:668-671` (`api.listParticipations`, `api.getParticipation`, `api.createParticipation`, `api.updateParticipation`)
  - Server Routes: `functions/api/[[route]].ts:2495` (`GET /api/c/:id/participations`), `functions/api/[[route]].ts:2513` (`POST /api/c/:id/participations`), `functions/api/[[route]].ts:2670` (`PATCH /api/c/:id/participations/:pid`)
  - Database Tables: `character_participations`, `campaigns`
- **Notes/limits:** Enforces campaign settings `startingLevel` and `maxEntryLevel`. Initial participation status transitions through `draft` → `pending_approval` → `active`.

#### CHAR-04: Legacy Campaign Join ("انتقال شخصیت به کمپین دیگر")
- **Status:** Complete
- **What it does:** Allows migrating or cloning an existing character record from one campaign into another target campaign, preserving character identity while establishing fresh participation stats.
- **Who can use it:** Character Owner.
- **How to reach it in the UI:** Master Character Screen → "کمپین‌ها و حضور" tab → "پیوستن به کمپین دیگر" button → select campaign and entry mode.
- **Key files:**
  - Component: `src/components/character/MasterCharacterScreen.tsx:700`
  - Client API: `src/services/api.ts:663` (`api.legacyJoinCampaign`)
  - Server Route: `functions/api/[[route]].ts:2583` (`POST /api/characters/:id/legacy-join`)
  - Database Tables: `characters`, `character_participations`, `campaign_members`
- **Notes/limits:** Server verifies caller is a member of the target campaign and owns the source master character.

#### CHAR-05: Ability Scores Generation Methods ("روش‌های تعیین ویژگی‌های پایه")
- **Status:** Complete
- **What it does:** Implements the four canonical 5e ability generation methods: Standard Array (15, 14, 13, 12, 10, 8), Point Buy (27 points with racial modifier additions), Server-Authoritative 4d6 Drop Lowest rolls, and Manual Input.
- **Who can use it:** Players during character creation or respec.
- **How to reach it in the UI:** Character Creation Wizard → Step 3 ("ویژگی‌های پایه").
- **Key files:**
  - Components: `src/components/character-wizard/CharacterCreationWizardModal.tsx:808`, `src/components/character/AbilitiesTab.tsx:21`
  - Engine: `shared/rules/engine.ts:rollAbilityScores`, `shared/rules/wizardEngine.ts`
  - Client API: `src/services/api.ts:678` (`api.rollWizardAbilities`)
  - Server Route: `functions/api/[[route]].ts:3575` (`POST /api/c/wizard/roll-abilities`)
- **Notes/limits:** Server verifies Point Buy math (total spent ≤ 27 points, score limits 8–15 before lineage bonuses) and validates rolls.

#### CHAR-06: Character Backstory Section Builder & Hooks ("ویرایشگر پیشینه داستانی و قلاب‌ها")
- **Status:** Complete
- **What it does:** Modular backstory editor supporting distinct narrative blocks: Personality Traits, Ideals, Bonds, Flaws, Secrets, DM Hooks, NPC Relationships, Historical Timeline events, and Custom Sections with granular party visibility toggles.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Master Character Screen → "هویت و پیش‌داستان" tab → scroll to backstory blocks (or Character Sheet → Overview tab → "پیشینه").
- **Key files:**
  - Component: `src/components/character/BackstoryEditor.tsx:41`
  - Client API: `src/services/api.ts:655` (`api.updateMasterCharacter`)
  - Database Tables: `characters` (`backstory` JSON column)
- **Notes/limits:** DM hooks and secrets are marked with a lock icon and stripped from responses sent to other players. Includes random roll buttons from background personality tables.

#### CHAR-07: Backstory Revision History & Restore ("تاریخچه بازبینی‌ها و بازیابی پیشینه")
- **Status:** Complete
- **What it does:** Records timestamped snapshots of a character's backstory whenever significant edits are made. Allows players and DMs to browse previous versions and restore an earlier snapshot with one tap.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Backstory Editor → click "تاریخچه بازبینی‌ها" button (clock icon) → select revision → click "بازیابی این نسخه".
- **Key files:**
  - Component: `src/components/character/BackstoryEditor.tsx:73,117`
  - Client API: `src/services/api.ts:705-707` (`api.listCharacterRevisions`, `api.createCharacterRevision`, `api.restoreCharacterRevision`)
  - Server Routes: `functions/api/[[route]].ts:2051` (`GET /api/characters/:id/revisions`), `functions/api/[[route]].ts:2068` (`POST /api/characters/:id/revisions`), `functions/api/[[route]].ts:2081` (`POST /api/characters/:id/revisions/:revId/restore`)
  - Database Tables: `character_revisions`
- **Notes/limits:** Restoring an earlier revision automatically snapshots the pre-restore state so no data is permanently lost.

#### CHAR-08: Backstory DM Review & Inline Comments ("یادداشت‌ها و بررسی پیشینه داستانی توسط مستر")
- **Status:** Complete
- **What it does:** Allows players to toggle "آماده بررسی توسط دانجن مستر" status. DMs can add inline comments tied to specific backstory sections, and mark them as resolved. DMs can formally approve or request changes on the backstory.
- **Who can use it:** Character Owner, Co-DM, Campaign Owner.
- **How to reach it in the UI:** Backstory Editor → click comment speech bubble on any section → type feedback → submit (DM can click "تأیید پیشینه" / "درخواست اصلاح").
- **Key files:**
  - Component: `src/components/character/BackstoryEditor.tsx:77,272,296`
  - Client API: `src/services/api.ts:708-713` (`api.toggleCharacterReadyForReview`, `api.listBackstoryComments`, `api.createBackstoryComment`, `api.resolveBackstoryComment`, `api.reviewCharacterBackstory`)
  - Server Routes: `functions/api/[[route]].ts:2106` (`POST /api/characters/:id/ready-for-review`), `functions/api/[[route]].ts:2129` (`GET /api/characters/:id/backstory-comments`), `functions/api/[[route]].ts:2156` (`POST /api/characters/:id/backstory-comments`), `functions/api/[[route]].ts:2202` (`PATCH /api/characters/:id/backstory-comments/:cid`), `functions/api/[[route]].ts:2234` (`POST /api/characters/:id/backstory-review`)
  - Database Tables: `characters`, `backstory_comments`, `notifications`
- **Notes/limits:** Generates in-app notifications to the player when the DM leaves comments or approves the backstory.

#### CHAR-09: Character History Timeline & Milestones ("رویدادنگار تاریخچه و رویدادهای مهم")
- **Status:** Complete
- **What it does:** Chronological log documenting character life events across campaigns: joining campaigns, session attendances, level-ups, combat victories, near-death experiences, and custom narrative milestones added by the DM.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Master Character Screen → "گاهشمار و رویدادها" tab → view timeline cards → "+ ثبت رویداد تازه".
- **Key files:**
  - Component: `src/components/character/MasterCharacterScreen.tsx:455-477`
  - Client API: `src/services/api.ts:660,664` (`api.getMasterCharacterHistory`, `api.addCharacterHistoryEvent`)
  - Server Routes: `functions/api/[[route]].ts:2306` (`GET /api/characters/:id/history`), `functions/api/[[route]].ts:2363` (`POST /api/characters/:id/history`)
  - Database Tables: `character_history_events`
- **Notes/limits:** System automatically records milestone events when session attendance is logged or level-ups are approved.

#### CHAR-10: Level-Up Calculation & Request Engine ("محاسبه و درخواست ارتقای سطح")
- **Status:** Complete
- **What it does:** Computes level-up eligibility based on accumulated XP or milestone triggers. Presents an interactive modal to configure: HP increase (fixed average or die roll with Con modifier), new class features, spell choices, and Ability Score Improvements (ASI) or Feats. Computes payload diff and submits request to DM.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Header → "ارتقای سطح آماده است" button (or Character Sheet Overview → "ارتقای سطح").
- **Key files:**
  - Component: `src/components/character/LevelUpModal.tsx:37`
  - Engine: `shared/rules/levelUpEngine.ts:computeLevelUpDiff,isLevelUpReady`
  - Client API: `src/services/api.ts:673` (`api.requestLevelUp`)
  - Server Route: `functions/api/[[route]].ts:2905` (`POST /api/c/:id/participations/:pid/level-up`)
  - Database Tables: `character_participations`, `xp_awards`
- **Notes/limits:** If campaign setting `approval.onLevelUp` is disabled, level-ups apply immediately; otherwise, submissions enter the DM approval queue.

#### CHAR-11: Level-Up Approval, Rejection & Undo ("تأیید، رد و بازگردانی ارتقای سطح توسط مستر")
- **Status:** Complete (Backend Undo is Backend-only)
- **What it does:** Allows DMs to inspect proposed level-up diffs, approve them (committing new level, HP, spells, and features), or reject them with feedback. The server also exposes an undo endpoint to revert a level-up.
- **Who can use it:** Campaign Owner, Co-DM (`campaign:approve_reject_joins`).
- **How to reach it in the UI:** Header → Menu → "تأیید شخصیت‌ها و ارتقای سطح" (Approval Queue) → select level-up item → click "تأیید ارتقا" or "رد درخواست".
- **Key files:**
  - Component: `src/components/campaign/CampaignApprovalsModal.tsx:42,239`
  - Client API: `src/services/api.ts:672` (`api.reviewParticipation`)
  - Server Routes: `functions/api/[[route]].ts:3034` (`POST /api/c/:id/participations/:pid/approve-level-up`), `functions/api/[[route]].ts:3146` (`POST /api/c/:id/participations/:pid/reject-level-up`), `functions/api/[[route]].ts:3182` (`POST /api/c/:id/participations/:pid/undo-level-up`)
  - Database Tables: `character_participations`, `participation_snapshots`, `audit_log`, `notifications`
- **Notes/limits:** Server creates an automatic snapshot before committing approval. The `undo-level-up` endpoint is functional on the server, but the UI currently rolls back via Snapshot Restore rather than calling the direct undo route.

#### CHAR-12: XP Progression & Party XP Awards ("پیشرفت تجربه و اعطای گروهی XP")
- **Status:** Complete
- **What it does:** Tracks experience points against standard 5e thresholds. DMs can award XP individually or distribute party-wide XP evenly with customizable reason notes, automatically detecting level-up thresholds.
- **Who can use it:** Campaign Owner, Co-DM (`character:grant_rewards`).
- **How to reach it in the UI:** DM Dashboard / Session Closing → "اعطای تجربه (XP)" button opens `XpAwardModal`.
- **Key files:**
  - Component: `src/components/dm/XpAwardModal.tsx:25`
  - Engine: `shared/rules/levelUpEngine.ts:XP_THRESHOLDS`
  - Client API: `src/services/api.ts:850` (called in session closing and DM tools)
  - Server Routes: `functions/api/[[route]].ts:2809` (`POST /api/c/:id/xp-awards`), `functions/api/[[route]].ts:2862` (`GET /api/c/:id/xp-awards`)
  - Database Tables: `xp_awards`, `character_participations`, `audit_log`
- **Notes/limits:** Server verifies XP increments; prevents negative grants without explicit override.

#### CHAR-13: Milestone Level Up Dispatch ("ارتقای سطحی مستقیم با نقطه عطف")
- **Status:** Complete
- **What it does:** Allows DMs running milestone campaigns to instantly advance selected characters or the entire party to the next level without tracking numerical XP.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Session Closing Sheet → "ارتقای سطحی مایل‌استون" checkboxes → submit session close.
- **Key files:**
  - Component: `src/components/session/SessionClosingSheet.tsx:1`
  - Client API: `src/services/api.ts:850` (session close payload with `milestoneLevelUps`)
  - Server Route: `functions/api/[[route]].ts:2880` (`POST /api/c/:id/milestone-level-up`)
  - Database Tables: `character_participations`, `audit_log`
- **Notes/limits:** Updates `character_participations.pending_level_up` so players can configure their choices via `LevelUpModal`.

#### CHAR-14: Sheet Locking & Change Request Workflow ("قفل برگه و درخواست تغییر مشخصات")
- **Status:** Complete
- **What it does:** Enforces sheet locking on core character stats (ability scores, class, race, level, maximum HP). Players attempting to tap a locked field receive an informative bottom sheet allowing them to submit a change request with a justification note to the DM.
- **Who can use it:** Players (requesting changes), DMs (reviewing and approving).
- **How to reach it in the UI:** Character Sheet → tap any locked field with a lock badge (e.g. Ability Score) → `LockedFieldModal` opens → click "درخواست تغییر از دانجن مستر" → enter reason in `SheetChangeRequestModal` → submit.
- **Key files:**
  - Components: `src/components/character/LockedFieldModal.tsx:15`, `src/components/character/SheetChangeRequestModal.tsx:23`
  - Engine: `shared/rules/levelUpEngine.ts:isFieldLockedForPlayer`, `shared/rules/sheetPolicy.ts`
  - Client API: `src/services/api.ts:700-703` (`api.submitSheetChangeRequest`, `api.listSheetChangeRequests`, `api.reviewSheetChangeRequest`)
  - Server Routes: `functions/api/[[route]].ts:3319` (`POST /api/c/:id/participations/:pid/sheet-change-request`), `functions/api/[[route]].ts:3342` (`GET /api/c/:id/sheet-change-requests`), `functions/api/[[route]].ts:3374` (`POST /api/c/:id/sheet-change-requests/:id/review`)
  - Database Tables: `sheet_change_requests`, `character_participations`, `audit_log`
- **Notes/limits:** DMs review change requests in `CampaignApprovalsModal`. Approving automatically patches the target participation record.

#### CHAR-15: Temporary Edit Grants & Presets ("مجوزهای موقت ویرایش برگه")
- **Status:** Complete
- **What it does:** DMs can issue time-limited or use-limited edit grants to players. Supported presets: `respec` (full character reconfiguration), `level_up` (stats & spells), `ability_scores` (ASI adjustments), `spell_swap` (prepared spell changes), `inventory_add` (adding custom items), or `full` (unlock entire sheet).
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** In campaign → DM Tools → Characters tab → click character actions → "اعطای مجوز ویرایش" opens `EditGrantModal`.
- **Key files:**
  - Component: `src/components/dm/EditGrantModal.tsx:68`
  - Client API: `src/services/api.ts:704-706` (`api.listEditGrants`, `api.createEditGrant`, `api.revokeEditGrant`)
  - Server Routes: `functions/api/[[route]].ts:3450` (`GET /api/c/:id/edit-grants`), `functions/api/[[route]].ts:3483` (`POST /api/c/:id/edit-grants`), `functions/api/[[route]].ts:3541` (`POST /api/c/grants/:id/revoke`)
  - Database Tables: `edit_grants`, `audit_log`
- **Notes/limits:** The client checks active unexpired grants before displaying lock indicators, automatically bypassing locked modals when valid grants exist.

#### CHAR-16: Respec Window Toggle ("فعال‌سازی پنجره بازآرایی شخصیت")
- **Status:** Complete
- **What it does:** Opens or closes a temporary respec window for a player, granting them full permission to rewrite their build choices within a short timeframe (e.g. after level 1 or substantial DM rule changes).
- **Who can use it:** Campaign Owner, Co-DM (`character:respec`).
- **How to reach it in the UI:** DM Tools → Character Options → "فعال‌سازی پنجره بازآرایی" toggle switch.
- **Key files:**
  - Component: `src/components/dm/DmTools.tsx:1`
  - Client API: `src/services/api.ts:707` (`api.toggleRespecWindow`)
  - Server Route: `functions/api/[[route]].ts:3302` (`POST /api/c/:id/participations/:pid/respec-window`)
  - Database Tables: `character_participations`, `edit_grants`
- **Notes/limits:** Creates a grant record with `preset='respec'` and notifies the player.

#### CHAR-17: DM Sheet State Override ("بازنویسی مستقیم مقادیر توسط مستر")
- **Status:** Complete
- **What it does:** Allows DMs to directly edit any player's participation values (HP, maximum HP, ability scores, inventory, spells, level) bypassing client lock checks, accompanied by an audit reason.
- **Who can use it:** Campaign Owner, Co-DM (`character:edit_core`).
- **How to reach it in the UI:** DM Tools → Character Options → "ویرایش مستقیم توسط مستر" opens `DmOverrideModal`.
- **Key files:**
  - Component: `src/components/dm/DmOverrideModal.tsx:16`
  - Client API: `src/services/api.ts:706` (`api.dmOverrideParticipation`)
  - Server Route: `functions/api/[[route]].ts:3246` (`POST /api/c/:id/participations/:pid/dm-override`)
  - Database Tables: `character_participations`, `audit_log`
- **Notes/limits:** Every override logs an immutable entry in `audit_log` with before/after diffs and the DM's entered justification.

#### CHAR-18: Participation Snapshots & Rollback ("ایجاد و بازیابی نسخه‌های پشتیبان برگه")
- **Status:** Complete
- **What it does:** Generates and maintains timestamped point-in-time snapshots of character participation states. DMs can browse historical snapshots and restore a character to any prior snapshot.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** DM Tools → Characters tab → "نسخه‌های پشتیبان" opens `SnapshotRestoreModal` → click "بازیابی این نسخه".
- **Key files:**
  - Component: `src/components/dm/SnapshotRestoreModal.tsx:27`
  - Client API: `src/services/api.ts:684,685` (`api.listParticipationSnapshots`, `api.restoreSnapshot`)
  - Server Routes: `functions/api/[[route]].ts:3858` (`GET /api/c/:id/participations/:pid/snapshots`), `functions/api/[[route]].ts:3911` (`POST /api/c/:id/participations/:pid/snapshots/:sid/restore`)
  - Database Tables: `participation_snapshots`, `character_participations`, `audit_log`
- **Notes/limits:** Automatically pruned according to retention rules (keeps up to 10 latest snapshots per participation).

#### CHAR-19: Character Status & Mortality Management ("وضعیت حیات: فعال، بازنشسته، درگذشته")
- **Status:** Complete
- **What it does:** Manages character lifecycle status: `active` (currently playing), `retired` (peacefully stepped down), `dead` (slain in combat or story), and `archived`. Dead characters display mortality markers in lists and feeds.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Master Character Screen → "وضعیت شخصیت" dropdown / actions → select new status and optional memorial note.
- **Key files:**
  - Component: `src/components/character/MasterCharacterScreen.tsx:52`
  - Client API: `src/services/api.ts:658` (`api.updateMasterCharacterStatus`)
  - Server Route: `functions/api/[[route]].ts:2292` (`POST /api/characters/:id/status`)
  - Database Tables: `characters`, `character_history_events`
- **Notes/limits:** Setting status to `dead` automatically logs a death milestone in `character_history_events`.

---

### Domain 4: Character Sheet & Core Gameplay

#### SHEET-01: Sticky Vitals Header & Quick HP Stepper ("نوار چسبان علائم حیاتی و تغییر سریع جان")
- **Status:** Complete
- **What it does:** A sticky top bar anchored during scrolling displaying character portrait, name, class, level, and dynamic HP progress bar with color-coded health states (green > 50%, amber > 20%, red ≤ 20%). Features quick +/- increment steppers for current HP and temporary HP, plus direct buttons for short and long rests.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Present at top of screen in Campaign Workspace whenever viewing a character sheet.
- **Key files:**
  - Component: `src/components/common/StickyHeader.tsx:1`
  - Utility: `src/utils/dice.ts`
  - Client API: `src/services/api.ts:555` (`api.updateCharacter` / `updateParticipation`)
  - Database Tables: `character_participations`
- **Notes/limits:** Fully responsive; shrinks to a compact height on scroll while maintaining 44px tap targets. Prevents HP from exceeding max + temp HP.

#### SHEET-02: Overview Tab & Narrative Bio ("نمای کلی، مشخصات ظاهری و پیشینه")
- **Status:** Complete
- **What it does:** High-level dashboard tab featuring Armor Class, Initiative, Speed, Hit Dice pool, Passive Perception, Passive Insight, Death Saving Throws tracker (3 successes / 3 failures with skull animations), and summary bio cards (lineage, background, alignment, personality traits).
- **Who can use it:** Campaign Members, Spectators (read-only).
- **How to reach it in the UI:** In Campaign → Character Sheet → "نمای کلی" tab (or BottomNav → "برگه").
- **Key files:**
  - Component: `src/components/character/OverviewTab.tsx:67`
  - Engine: `shared/rules/engine.ts:deriveSheet`
  - Database Tables: `character_participations`, `characters`
- **Notes/limits:** Derived stats (passive perception, AC, hit dice) are calculated live by the rules engine.

#### SHEET-03: Abilities & Skills Inspection Tab ("ویژگی‌های اصلی، مهارت‌ها و نجات‌ها")
- **Status:** Complete
- **What it does:** Comprehensive breakdown of the six core ability scores (STR, DEX, CON, INT, WIS, CHA) with large modifier badges, saving throws with proficiency checkmarks, and the complete 18-skill 5e list. Supports toggling proficiency and expertise, searching skills, creating custom campaign skills, and 1-tap dice roll checks.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "ویژگی‌ها" tab.
- **Key files:**
  - Component: `src/components/character/AbilitiesTab.tsx:21`
  - Engine: `shared/rules/engine.ts`
  - Database Tables: `character_participations`
- **Notes/limits:** Tapping any skill or ability rolls `1d20 + modifier` directly into the table dice feed. Custom skills require name and linked ability score.

#### SHEET-04: Combat & Weapon Attacks Tab ("مبارزه، زره، ابتکار و حملات سلاح‌ها")
- **Status:** Complete
- **What it does:** Tactical combat management tab displaying equipped weapons, attack bonuses, damage formulas, and range. Allows players to roll attacks (to-hit and damage dice with advantage/disadvantage), manage custom weapons, track temporary HP, and monitor combat actions.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "مبارزه" tab.
- **Key files:**
  - Component: `src/components/character/CombatTab.tsx:28`
  - Engine: `shared/rules/engine.ts`
  - Database Tables: `character_participations`, `weapon_templates`
- **Notes/limits:** Supports creating custom weapons with damage types (slashing, piercing, bludgeoning, magical) and weapon properties (finesse, versatile, reach, heavy).

#### SHEET-05: Class Features & Subclasses Tab ("توانایی‌های رده، زیررده و نژادی")
- **Status:** Complete
- **What it does:** Lists all class features, subclass abilities, and racial traits unlocked for the character's current level. Includes expandable description accordions and pip trackers for limited-use features categorized by rest reset type.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "توانایی‌ها" tab.
- **Key files:**
  - Component: `src/components/character/AbilitiesTab.tsx:21` (rendered with `showFeaturesOnly`)
  - Template Engine: `src/data/classTemplates.ts`, `shared/rules/templates.ts`
  - Database Tables: `character_participations`, `class_templates`, `lineage_templates`
- **Notes/limits:** Features automatically populate from class templates upon leveling up.

#### SHEET-06: Companions & Familiar Tab ("یاران، حیوانات همراه و احضارها")
- **Status:** Complete
- **What it does:** Dedicated tab for beast companions, familiars, mounts, and construct homunculi. Displays companion stats, AC, dynamic HP bar with quick increment steppers, attack actions, and rules engine scaling based on master level and Con modifier.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "یاران" tab (tab appears dynamically when character has companions or is an eligible class like Diwanzad or Peymanban).
- **Key files:**
  - Component: `src/components/character/CompanionsTab.tsx:15`
  - Engine: `shared/rules/engine.ts:computeCompanion`
  - Database Tables: `character_participations` (`companions` JSON array)
- **Notes/limits:** Allows adding custom companions with custom AC, HP, and contact attack actions.

#### SHEET-07: Tracked Resources & Spell Slots Tab ("ردیاب منابع مصرفی و خانه‌های جادو")
- **Status:** Complete
- **What it does:** Displays interactive pip trackers for spell slots (levels 1 through 9) and class resources (e.g. Rage, Ki points, Sorcery points, Bardic Inspiration). Tapping pips toggles expended/available slots; includes auto-reset on short/long rests.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "منابع" tab.
- **Key files:**
  - Component: `src/components/character/ResourcesTab.tsx:12`
  - Common UI: `src/components/common/PipTracker.tsx`
  - Database Tables: `character_participations`
- **Notes/limits:** Automatically derived from class progression tables or custom resource additions.

#### SHEET-08: Personal Inventory & Encumbrance Tab ("کوله‌پشتی شخصی، بار و وزن اقلام")
- **Status:** Complete
- **What it does:** Personal equipment manager featuring item categorization (weapons, armor, potions, scrolls, adventuring gear, quest items), attunement slots (up to 3 attuned items), equipped states, and weight calculation with encumbrance warnings. Includes coin pouch (CP, SP, EP, GP, PP), survival trackers (rations, lantern oil), and a direct modal bridge to the Party Shared Treasury.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** In Campaign → Character Sheet → "کوله‌پشتی" (or BottomNav → "بیشتر" → "کوله‌پشتی").
- **Key files:**
  - Component: `src/components/character/InventoryTab.tsx:124`
  - Policy: `shared/rules/sheetPolicy.ts`
  - Database Tables: `character_participations`, `items`
- **Notes/limits:** Under standard sheet policy, players can freely decrement or consume items and coins, but adding new items or increasing balances requires an active DM edit grant or change request.

#### SHEET-09: Character Notes & Categories Tab ("یادداشت‌های اختصاصی شخصیت")
- **Status:** Complete
- **What it does:** Private note-taking suite for players to record campaign observations, categorized into Journal ("یادداشت‌های روزانه"), NPCs ("شخصیت‌ها"), Locations ("مکان‌ها"), Quests ("مأموریت‌ها"), and Clues ("سرنخ‌ها").
- **Who can use it:** Character Owner only.
- **How to reach it in the UI:** In Campaign → Character Sheet → "یادداشت" tab (or BottomNav → "یادداشت").
- **Key files:**
  - Component: `src/components/character/NotesTab.tsx:130`
  - Client API: `src/services/api.ts:561-565` (`api.listNotes`, `api.createNote`, `api.updateNote`, `api.deleteNote`)
  - Server Routes: `functions/api/[[route]].ts:4607` (`GET /api/notes`), `functions/api/[[route]].ts:4623` (`POST /api/notes`), `functions/api/[[route]].ts:4648` (`PUT /api/notes/:id`), `functions/api/[[route]].ts:4662` (`DELETE /api/notes/:id`)
  - Database Tables: `notes`
- **Notes/limits:** Player personal notes are strictly private and never leaked in DM dashboard feeds.

#### SHEET-10: Player Codex & In-World Lore Tab ("دانشنامه جهان و قوانین برای بازیکن")
- **Status:** Complete
- **What it does:** In-game lore encyclopedia presenting world history, regional codex articles, campaign rules, and the multi-calendar world clock, filtered to show only documents and regions that the DM has revealed to players.
- **Who can use it:** Campaign Members, Spectators.
- **How to reach it in the UI:** In Campaign → Character Sheet → "جهان" tab (or BottomNav → "جهان").
- **Key files:**
  - Component: `src/components/character/CodexTab.tsx:36`
  - Client API: `src/services/api.ts:6000+` (`api.getCampaignCalendars`, `api.getCampaignTime`)
  - Database Tables: `codex_docs`, `campaign_docs`, `calendars`, `calendar_states`, `campaign_time`
- **Notes/limits:** Unrevealed/secret DM docs are filtered out on the server before reaching the client bundle.

#### SHEET-11: Rest Engine: Short, Long & Custom Rests ("استراحت کوتاه، طولانی و تجدید منابع")
- **Status:** Complete
- **What it does:** Rest recovery modal implementing 5e rest mechanics. Short Rest allows spending available Hit Dice with Con modifiers to regain HP and reset short-rest abilities. Long Rest restores HP to maximum, regains half maximum Hit Dice, and resets spell slots and long-rest abilities. DMs can also trigger party-wide group rests.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Character Sheet Sticky Header → Rest button (Moon icon) opens `RestModal` (or BottomNav → "بیشتر" → "استراحت").
- **Key files:**
  - Component: `src/components/character/RestModal.tsx:14`
  - Client API: `src/services/api.ts:557` (`api.applyGroupRest`), `updateCharacter`
  - Server Route: `functions/api/[[route]].ts:1521` (`POST /api/characters/group-rest`)
  - Database Tables: `character_participations`
- **Notes/limits:** Automatically logs rest recovery events to `restLogs` inside the character participation record.

---

### Domain 5: Dice System & Live Roll Engine

#### DICE-01: Interactive Mobile Dice Roller ("تاس‌ریز شناور لمسی")
- **Status:** Complete
- **What it does:** Floating touch-friendly dice roller sheet accessible from anywhere in the campaign workspace. Supports all standard polyhedral dice (d4, d6, d8, d10, d12, d20, d100), custom multiplier and modifier steppers, and animated results display.
- **Who can use it:** Campaign Members, DMs, Players.
- **How to reach it in the UI:** Tap the prominent center Dice button on the BottomNav dock (or click the Dice icon in the top header).
- **Key files:**
  - Component: `src/components/DiceRollerModal.tsx:102`
  - Utility: `src/utils/dice.ts:rollDice,formatModifier`
  - Client API: `src/services/api.ts:720` (`api.postDiceRoll`)
  - Database Tables: `dice_rolls`
- **Notes/limits:** Optimized for mobile one-handed operation with large 48px tap targets and haptic vibration feedback on mobile devices (`src/utils/haptics.ts`).

#### DICE-02: Advantage & Disadvantage Mechanics ("پرتاب تاس با مزیت و نقص")
- **Status:** Complete
- **What it does:** Supports advantage and disadvantage modifiers on d20 rolls, rolling two d20s simultaneously, displaying both individual outcomes, and highlighting the chosen higher or lower roll.
- **Who can use it:** Campaign Members.
- **How to reach it in the UI:** Dice Roller Modal → select "مزیت (Advantage)" or "نقص (Disadvantage)" segmented chips.
- **Key files:**
  - Component: `src/components/DiceRollerModal.tsx:102`
  - Utility: `src/utils/dice.ts`
  - Server Route: `functions/api/[[route]].ts:1794` (`POST /api/c/:id/dice`)
  - Database Tables: `dice_rolls` (`mode` column)
- **Notes/limits:** Highlights natural 20s (green glow) and natural 1s (red glow) in both the roller modal and the shared campaign table feed.

#### DICE-03: Live Campaign Table Dice Feed ("فید زنده پرتاب‌های میز بازی")
- **Status:** Complete
- **What it does:** Shared, real-time campaign table feed broadcasting dice rolls made by any player or DM. Displays roller name, roll label (e.g. "حمله با شمشیر بلند"), formula, individual dice breakdown, and total score.
- **Who can use it:** Campaign Members, Spectators.
- **How to reach it in the UI:** Dice Roller Modal → "میز بازی" tab (or live toast notifications on roll broadcast).
- **Key files:**
  - Components: `src/components/DiceRollerModal.tsx:130`, `src/components/mobile/DiceToast.tsx:1`
  - Client API: `src/services/api.ts:721` (`api.listDiceRolls`, `api.liveChannel.subscribe`)
  - Server Routes: `functions/api/[[route]].ts:1776` (`GET /api/c/:id/dice`), `functions/api/[[route]].ts:1794` (`POST /api/c/:id/dice`)
  - Database Tables: `dice_rolls`
- **Notes/limits:** In production, updates via periodic short polling (3s cursor-based sync); in preview, dispatches via custom EventTarget channel.

#### DICE-04: Secret DM Rolls & Visibility Stripping ("پرتاب‌های مخفی مستر با حذف برای بازیکنان")
- **Status:** Complete
- **What it does:** Allows DMs (or players if enabled by campaign settings) to execute secret rolls with visibility set to `dm_only`. Secret rolls are permanently stripped by server query filters when regular players or spectators fetch the feed.
- **Who can use it:** Campaign Owner, Co-DM (and Players if `allowPlayerRollPrivate: true`).
- **How to reach it in the UI:** Dice Roller Modal → toggle "پرتاب مخفی (فقط مستر)" switch before rolling.
- **Key files:**
  - Component: `src/components/DiceRollerModal.tsx:159`
  - Filter: `shared/permissions.ts:filterDiceFeedForRole`
  - Server Route: `functions/api/[[route]].ts:1776` (`GET /api/c/:id/dice`)
  - Database Tables: `dice_rolls` (`visibility` column: `table` vs `dm_only`)
- **Notes/limits:** The server strictly strips `dm_only` rolls from SQL output before sending JSON responses to non-DM members, preventing client-side network inspection leaks.

#### DICE-05: Dice Notation Parser & Modifier Engine ("تحلیل‌گر فرمول‌های تاس و متغیرها")
- **Status:** Complete
- **What it does:** Robust parser evaluating complex standard RPG dice notation (e.g. `2d6+4`, `1d20-1`, `3d8+1d6+3`) with positive and negative modifiers, supporting roll execution from attack cards and macro buttons.
- **Who can use it:** All users.
- **How to reach it in the UI:** Dice Roller Modal → enter custom formula in formula input (or click attack formula chips on Combat Tab).
- **Key files:**
  - Utility: `src/utils/dice.ts:parseDiceFormula,rollFormula`
- **Notes/limits:** Formatted with `dir="ltr"` and `unicode-bidi: isolate` so Latin dice expressions render cleanly in the Persian RTL interface.

---

### Domain 6: Encounters & Tactical Combat Runner

#### ENC-01: Live Encounter Runner ("مدیریت مبارزه زنده")
- **Status:** Complete
- **What it does:** Real-time tactical combat suite for the DM to orchestrate battles. Features include drafting encounters, starting combat with an optional surprise round, cycling through turns and rounds, tracking participant states, and concluding battles with resolution logs.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:run_encounters`).
- **How to reach it in the UI:** In Campaign → Header → Menu → "رفتن به ابزارهای مستر" → "مواجهه‌ها" tab → select or create encounter → click "شروع مبارزه".
- **Key files:**
  - Component: `src/components/dm/DmEncounterRunner.tsx:163`
  - Client API: `src/services/api.ts:531-540` (`api.listLiveEncounters`, `api.createLiveEncounter`, `api.startLiveEncounter`, `api.pauseLiveEncounter`, `api.resumeLiveEncounter`, `api.endLiveEncounter`)
  - Server Routes: `functions/api/[[route]].ts:5128-5400` (`POST /api/encounters/:id/start`, `pause`, `resume`, `end`)
  - Database Tables: `encounters`, `encounter_participants`, `encounter_events`
- **Notes/limits:** State changes trigger live combat broadcasts to all connected campaign players.

#### ENC-02: Initiative Tracker & Turn/Round Order ("ردیاب ابتکار عمل و دورهای نبرد")
- **Status:** Complete
- **What it does:** Automatically sorts participants by initiative values, highlights the active combatant, and increments round counters upon completing full turn rotations. Supports stepping forward ("نوبت بعد") and stepping backward ("نوبت قبل").
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Live Encounter Runner → control toolbar at top → "نوبت بعد" (Next Turn) / "نوبت قبل" (Prev Turn).
- **Key files:**
  - Component: `src/components/dm/DmEncounterRunner.tsx:163`
  - Client API: `src/services/api.ts:539,540` (`api.nextEncounterTurn`, `api.prevEncounterTurn`)
  - Server Routes: `functions/api/[[route]].ts:5460` (`POST /api/encounters/:id/next-turn`), `functions/api/[[route]].ts:5485` (`POST /api/encounters/:id/prev-turn`)
  - Database Tables: `encounters`, `encounter_participants`
- **Notes/limits:** Maintains current participant ID and round count authoritatively in the database.

#### ENC-03: Participant Management & Combatant States ("مدیریت مبارزان، وضعیت‌ها و آسیب")
- **Status:** Complete
- **What it does:** DM tool to add monsters, NPCs, or party characters into active combat. Allows quick HP increments/decrements, applying conditions (e.g. Paralyzed, Stunned, Poisoned, Prone), and toggling participant visibility between `hidden` (fog of war), `announced`, and `revealed`.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Live Encounter Runner → participant card → HP stepper / Conditions button / Visibility eye icon.
- **Key files:**
  - Component: `src/components/dm/DmEncounterRunner.tsx:163`
  - Client API: `src/services/api.ts:541-543` (`api.addEncounterParticipants`, `api.updateEncounterParticipant`, `api.deleteEncounterParticipant`)
  - Server Routes: `functions/api/[[route]].ts:5508` (`POST /api/encounters/:id/participants`), `functions/api/[[route]].ts:5595` (`PATCH /api/encounters/:id/participants/:pid`), `functions/api/[[route]].ts:5673` (`DELETE /api/encounters/:id/participants/:pid`)
  - Database Tables: `encounter_participants`
- **Notes/limits:** Hidden participants are completely filtered from player responses by `shared/permissions.ts:filterEncounterForRole`.

#### ENC-04: Tactical Combat Events Log ("ثبت وقایع تاکتیکی و رویدادهای مبارزه")
- **Status:** Complete
- **What it does:** Records a chronological turn-by-turn combat log (e.g. damage dealt, spells cast, defeats, player initiative rolls) with optional `visible_to_players` flags.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Live Encounter Runner → "وقایع مبارزه" expandable bottom panel → type custom event or review auto-logged events.
- **Key files:**
  - Component: `src/components/dm/DmEncounterRunner.tsx:163`
  - Client API: `src/services/api.ts:544` (`api.addEncounterEvent`)
  - Server Route: `functions/api/[[route]].ts:5689` (`POST /api/encounters/:id/events`)
  - Database Tables: `encounter_events`
- **Notes/limits:** Non-visible events are hidden from player combat feeds.

#### ENC-05: Player Live Combat Banner & Encounter View ("نمای زنده مبارزه برای بازیکنان")
- **Status:** Complete
- **What it does:** When an encounter is marked active, a pulsing banner ("مبارزه زنده") appears in the player's header. Tapping it opens a live read-only modal displaying current round, active combatant, turn order, qualitative enemy health, and allied HP bars.
- **Who can use it:** Campaign Members, Players, Spectators.
- **How to reach it in the UI:** Header → click pulsing red "مبارزه زنده" banner button.
- **Key files:**
  - Component: `src/components/character/LiveEncounterModal.tsx:21`, `src/components/Header.tsx:399`
  - Client API: `src/services/api.ts:526,527` (`api.getActiveEncounter`, `api.getEncounterView`)
  - Server Routes: `functions/api/[[route]].ts:5128` (`GET /api/encounters/active`), `functions/api/[[route]].ts:5139` (`GET /api/encounters/:id/view`)
  - Database Tables: `encounters`, `encounter_participants`
- **Notes/limits:** Short polling synchronizes round changes and turn movements within 3 seconds.

#### ENC-06: Player Initiative Direct Submission ("ثبت مستقیم ابتکار عمل توسط بازیکن")
- **Status:** Complete
- **What it does:** When combat starts and player initiative rolls are enabled in campaign settings, players with pending initiative can roll d20 + modifier or enter a value directly from the Live Encounter Modal to update their position in the turn tracker.
- **Who can use it:** Character Owner, DM.
- **How to reach it in the UI:** Live Encounter Modal → "ثبت ابتکار عمل" prompt card → click "پرتاب تاس" or enter score → submit.
- **Key files:**
  - Component: `src/components/character/LiveEncounterModal.tsx:21`
  - Client API: `src/services/api.ts:528` (`api.submitInitiative`)
  - Server Route: `functions/api/[[route]].ts:5440` (`POST /api/encounters/:id/initiative`)
  - Database Tables: `encounter_participants`
- **Notes/limits:** Players can only submit initiative for their own active participation record.

#### ENC-07: Qualitative Health & Fog-of-War Status ("جان کیفی هیولاها برای بازیکنان")
- **Status:** Complete
- **What it does:** Obfuscates exact numeric HP and Armor Class of hostile creatures, displaying qualitative Persian status tags ("سالم" > 75%, "زخمی" > 50%, "نیمه‌جان" > 20%, "رو به مرگ" ≤ 20%) unless the DM explicitly enables `showExactHp` in campaign settings.
- **Who can use it:** Players, Spectators (viewing), DMs (controlling settings).
- **How to reach it in the UI:** Visible to players in Live Encounter Modal combatant list.
- **Key files:**
  - Component: `src/components/character/LiveEncounterModal.tsx:21`
  - Logic: `shared/permissions.ts:filterEncounterForRole`
  - Server Route: `functions/api/[[route]].ts:5139` (`GET /api/encounters/:id/view`)
- **Notes/limits:** Exact numbers are stripped server-side, preventing client inspecting network payloads.

#### ENC-08: Live Encounter Loot Distribution ("توزیع غنایم بلافاصله پس از مبارزه")
- **Status:** Complete
- **What it does:** Enables DMs to distribute monetary or magical items acquired from slain combatants directly to character inventories or the party treasury upon ending combat.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Live Encounter Runner → End Combat dialog → "توزیع غنایم" section.
- **Key files:**
  - Component: `src/components/dm/DmEncounterRunner.tsx:163`
  - Client API: `src/services/api.ts:545` (`api.distributeEncounterLoot`)
  - Server Route: `functions/api/[[route]].ts:5713` (`POST /api/encounters/:id/loot`)
  - Database Tables: `character_participations`, `party_items`, `audit_log`
- **Notes/limits:** Distributing items automatically creates an audit entry and updates recipient inventory revisions.

---

### Domain 7: DM Narrative, World Building & Library

#### DM-01: DM Control Dashboard ("میز مدیریت دانجن مستر")
- **Status:** Complete
- **What it does:** Operational command center for DMs inside a campaign. Displays active character vitals, quick XP awards, quick short/long rests, quick live encounter launcher, active session status, and direct shortcuts to the Bestiary, Item Vault, Atlas, and Campaign Settings.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** In Campaign → Header → Menu → "رفتن به ابزارهای مستر" (or BottomNav → "میز مستر").
- **Key files:**
  - Component: `src/components/dm/DmDashboard.tsx:104`, `src/components/dm/DmTools.tsx:178`
  - Client API: `src/services/api.ts:500+`
  - Database Tables: `campaigns`, `campaign_members`, `character_participations`, `encounters`, `sessions`
- **Notes/limits:** Only rendered when active user is a verified campaign `owner` or `co_dm`.

#### DM-02: Bestiary & NPC Manager ("کتاب هیولاها و شخصیت‌های غیربازیکن")
- **Status:** Complete
- **What it does:** Full NPC and monster catalog with stat blocks (AC, HP, speed, ability scores, challenge rating, actions, traits, legendary actions, spellcasting blocks). DMs can filter by kind (Minion, Goon, Boss) or region, create custom monsters, and toggle player reveal.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:bestiary`).
- **How to reach it in the UI:** DM Tools → Library → "محتوا" group → "NPCها و هیولاها" tab.
- **Key files:**
  - Component: `src/components/dm/DmNpcManager.tsx:138`
  - Client API: `src/services/api.ts:568-572` (`api.listNpcs`, `api.createNpc`, `api.updateNpc`, `api.deleteNpc`)
  - Server Routes: `functions/api/[[route]].ts:4675-4708` (`GET/POST/PUT/DELETE /api/npcs`)
  - Database Tables: `npcs`
- **Notes/limits:** Players only receive NPCs marked `is_revealed = 1`; secret DM notes on NPCs are stripped for players.

#### DM-03: Item Vault & Magical Equipment Vault ("گنجینه اقلام و تجهیزات")
- **Status:** Complete
- **What it does:** Item repository containing weapons, armor, magical items, potions, and artifacts. DMs can search, filter by rarity and category, create new items, and grant items directly to any player's inventory.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:items_loot`).
- **How to reach it in the UI:** DM Tools → Library → "محتوا" group → "گنجینه اقلام" tab.
- **Key files:**
  - Component: `src/components/dm/DmItemVault.tsx:49`
  - Client API: `src/services/api.ts:575-578,579` (`api.listItems`, `api.createItem`, `api.updateItem`, `api.deleteItem`, `api.giveItemToPlayer`)
  - Server Routes: `functions/api/[[route]].ts:4718-4729` (`GET/POST /api/items`), `functions/api/[[route]].ts:3944` (`PUT /api/items/:id`), `functions/api/[[route]].ts:2389` (`POST /api/characters/:id/give-item`)
  - Database Tables: `items`, `character_participations`
- **Notes/limits:** Items granted to players update the target participation's inventory array and log a history event.

#### DM-04: Atlas & Region Location Manager ("اطلس جغرافیا و مکان‌های جهان")
- **Status:** Complete
- **What it does:** World atlas mapping geographical points of interest across regions (e.g. Varna, Silent Desert, Sepidaroon, Mehestan, Shanshin). DMs can add coordinates, descriptions, secret notes, and selectively reveal locations to player codices.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:world_tools`).
- **How to reach it in the UI:** DM Tools → Library → "دنیا" group → "مکان‌ها و اطلس" tab.
- **Key files:**
  - Component: `src/components/dm/DmLocationManager.tsx:31`
  - Client API: `src/services/api.ts:519-522` (`api.listLocations`, `api.createLocation`, `api.updateLocation`, `api.deleteLocation`)
  - Server Routes: `functions/api/[[route]].ts:4766-4872` (`GET/POST/PATCH/DELETE /api/locations`)
  - Database Tables: `locations`
- **Notes/limits:** Unrevealed locations are hidden from player lists. Locations can be linked to interactive map pins.

#### DM-05: Lineage, Background & Class Template Editors ("ویرایشگر الگوهای نژاد، پیشینه و کلاس")
- **Status:** Complete
- **What it does:** Three bottom-sheet editors allowing DMs to define custom lineages (traits, speed, ability bonuses), backgrounds (proficiencies, equipment packages, personality roll tables), and classes (hit die, level-by-level feature progression, spellcasting definitions).
- **Who can use it:** Campaign Owner, Co-DM, Platform Admin.
- **How to reach it in the UI:** DM Tools → Library → "محتوا" group → "الگوها و قوانین" → click "ویرایش رده" / "ویرایش تبار" / "ویرایش پیشینه".
- **Key files:**
  - Components: `src/components/dm/LineageEditorSheet.tsx:54`, `src/components/dm/BackgroundEditorSheet.tsx:25`, `src/components/dm/ClassEditorSheet.tsx:33`
  - Client API: `src/services/api.ts:580-600` (`listClassTemplates`, `createClassTemplate`, `listLineageTemplates`, `listBackgroundTemplates`)
  - Server Routes: `functions/api/[[route]].ts:6922-7141` (`GET/POST/PUT/DELETE /api/*-templates`)
  - Database Tables: `lineage_templates`, `background_templates`, `class_templates`, `feature_templates`
- **Notes/limits:** Scoped by `scope_type ('pack' | 'campaign')` and `scope_id`, preserving template isolation across campaigns.

#### DM-06: Campaign Notes & Secret Plot Documents ("یادداشت‌ها و اسناد محرمانه کمپین")
- **Status:** Complete
- **What it does:** Private DM notebook for session prep, plot twists, secret factions, and world lore. Features category filtering (`session`, `plot`, `secret`, `lore`), tags, and full markdown support.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:campaign_notes`).
- **How to reach it in the UI:** DM Tools → "روایت" tab → "یادداشت‌های مستر".
- **Key files:**
  - Component: `src/components/dm/DmCampaignNotes.tsx:26`
  - Client API: `src/services/api.ts:605-608` (`api.listCampaignNotes`, `api.createCampaignNote`, `api.updateCampaignNote`, `api.deleteCampaignNote`)
  - Server Routes: `functions/api/[[route]].ts:1512`, `functions/api/[[route]].ts:4019-4043` (`GET/POST/PUT/DELETE /api/campaign-notes`)
  - Database Tables: `campaign_notes`
- **Notes/limits:** Stored with strict DM-only access; endpoints reject requests from players with 403.

#### DM-07: Ending Tracker & World Trajectory ("ردیاب سرنوشت جهان و متغیرهای پایان")
- **Status:** Complete
- **What it does:** World-state meter tracking cosmic variables, major narrative decisions, truth sources discovered, Aryaman triggers, and chaos meter increments that dictate which campaign ending is unlocked.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** DM Tools → "روایت" tab → "ردیاب سرنوشت و پایان‌ها".
- **Key files:**
  - Component: `src/components/dm/DmEndingTracker.tsx:83`
  - Client API: `src/services/api.ts:620-621` (`api.getEndingState`, `api.updateEndingState`)
  - Server Routes: `functions/api/[[route]].ts:6402-6411` (`GET/PUT /api/endings`)
  - Database Tables: `campaign_endings`
- **Notes/limits:** Endings data is currently stored in global table `campaign_endings` (known technical debt; migration to campaign-scoped ending state planned).

#### DM-08: Shanshin Regional Encounters Table ("جدول مواجهه‌های منطقه‌ای شانشین")
- **Status:** Complete
- **What it does:** Regional random encounter table with d100 dice rolling mechanics, threat level indicators, descriptions, and 1-tap conversion of rolled encounters into active live combat runner instances.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** DM Tools → "روایت" tab → "مواجهه‌های تصادفی شانشین".
- **Key files:**
  - Component: `src/components/dm/DmShanshinEncounters.tsx:15`
  - Client API: `src/services/api.ts:625-627` (`api.listShanshinEncounters`, `api.rollShanshinEncounter`)
  - Server Route: `functions/api/[[route]].ts:6423` (`GET /api/shanshin-encounters`)
  - Database Tables: `shanshin_encounters`
- **Notes/limits:** Table contains curated canon encounters for the Shanshin desert region.

#### DM-09: Content Pack Creation & Seed Engine ("بسته‌های محتوا و بارگذاری اولیه داده‌ها")
- **Status:** Complete
- **What it does:** Manages modular content packs (libraries, adventures, campaign templates). Allows exporting a campaign as a reusable template (with optional DM secret stripping) or importing external packs with dependency resolution. Also provides database seeding utilities.
- **Who can use it:** Campaign Owner, Platform Admin.
- **How to reach it in the UI:** DM Tools → Library → "محتوا" group → "بسته‌های محتوا" tab.
- **Key files:**
  - Components: `src/components/dm/DmLibrary.tsx:85`
  - Engine: `src/services/cloneEngine.ts`
  - Client API: `src/services/api.ts:730-745` (`api.listPacks`, `api.createPack`, `api.exportPack`, `api.runImportPack`, `api.seedDatabase`)
  - Server Routes: `functions/api/[[route]].ts:6627-6639` (`GET/POST /api/packs`)
  - Database Tables: `content_packs`
- **Notes/limits:** Packs enforce copy-on-use isolation: editing campaign content never mutates the underlying content pack.

#### DM-10: Clone Engine & Linked Entity Sync ("موتور شبیه‌سازی و همگام‌سازی نسخه‌های متصل")
- **Status:** Complete
- **What it does:** Advanced cloning architecture for copying entities (NPCs, items, quests, maps) across campaigns and packs. Performs dry-run manifest inspection, UUID remapping, foreign-key dependency tracking, and provides an undo token to rollback cloned imports.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** DM Tools → Library → select items → "افزودن به کمپین" (runs preview clone modal).
- **Key files:**
  - Engine: `src/services/cloneEngine.ts:1`
  - Client API: `src/services/api.ts:740-750` (`api.previewClone`, `api.runClone`, `api.listCloneJobs`, `api.undoCloneJob`)
  - Server Routes: `functions/api/[[route]].ts:6546-6622` (`POST /api/clone/preview`, `POST /api/clone/run`, `GET /api/clone-jobs`)
  - Database Tables: `clone_jobs`
- **Notes/limits:** Every clone job generates a cryptographically signed `undo_token` enabling clean rollback of all copied entities.

---

### Domain 8: Sessions, Scheduling, Recaps & Multi-Calendar

#### SESS-01: Session Scheduling & Calendar Events ("برنامه‌ریزی جلسات بازی و زمان‌بندی")
- **Status:** Complete
- **What it does:** Schedules campaign sessions with session numbers, titles, real-world timestamps, planned duration, physical meeting place or online voice/video URL, in-world calendar date, and secret DM prep notes.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:sessions_scheduling`).
- **How to reach it in the UI:** BottomNav → "بیشتر" → "جلسات" (opens `SessionListSheet`) → click "+ جلسه جدید" (opens `SessionEditorSheet`).
- **Key files:**
  - Components: `src/components/session/SessionListSheet.tsx:34`, `src/components/session/SessionEditorSheet.tsx:35`
  - Client API: `src/services/api.ts:800-805` (`api.listSessions`, `api.getSession`, `api.createSession`, `api.updateSession`, `api.deleteSession`)
  - Server Routes: `functions/api/[[route]].ts:7243-7450` (`GET/POST/PATCH/DELETE /api/c/:id/sessions`)
  - Database Tables: `sessions`
- **Notes/limits:** Validates scheduled times against ISO-8601 strings and links to active in-world campaign date.

#### SESS-02: Player RSVP & Availability Polling ("اعلام حضور و رأی‌گیری روز جلسه")
- **Status:** Complete
- **What it does:** Allows players to submit RSVP commitments (`بله`, `شاید`, `خیر`) with personal notes. DMs can also propose multiple potential meeting dates/times in an availability poll; players cast votes, and the DM locks in the winning slot.
- **Who can use it:** Campaign Members, Players.
- **How to reach it in the UI:** Session List Sheet → click upcoming session card → RSVP button row or Date Poll voting checkboxes.
- **Key files:**
  - Components: `src/components/session/SessionListSheet.tsx:34`, `src/components/session/NextSessionCard.tsx:35`
  - Engine: `shared/rules/sessionEngine.ts:calculatePollTally,canUserRsvp`
  - Client API: `src/services/api.ts:806-808` (`api.rsvpSession`, `api.voteSessionPoll`, `api.confirmSessionPoll`)
  - Server Routes: `functions/api/[[route]].ts:7470` (`POST /api/c/:id/sessions/:sid/rsvp`), `functions/api/[[route]].ts:7511` (`POST /api/c/:id/sessions/:sid/poll/vote`), `functions/api/[[route]].ts:7550` (`POST /api/c/:id/sessions/:sid/poll/confirm`)
  - Database Tables: `session_rsvps`, `session_polls`, `session_poll_votes`
- **Notes/limits:** Voting tallies update in real time with voter names displayed.

#### SESS-03: Session Attendance Verification ("ثبت حضور و غیاب بازیکنان در جلسه")
- **Status:** Complete
- **What it does:** Allows DMs to verify and record which characters were present during a session. Automatically appends session attendance events to character history timelines.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Session List Sheet → session actions → "ثبت حضور و غیاب" opens `SessionAttendanceModal`.
- **Key files:**
  - Component: `src/components/session/SessionAttendanceModal.tsx:21`
  - Engine: `shared/rules/sessionEngine.ts:buildAttendanceHistoryEvent`
  - Client API: `src/services/api.ts:809` (`api.recordSessionAttendance`)
  - Server Route: `functions/api/[[route]].ts:7601` (`POST /api/c/:id/sessions/:sid/attendance`)
  - Database Tables: `session_attendance`, `character_history_events`
- **Notes/limits:** Attendance records are verified against `character_participations`.

#### SESS-04: Session Closing & Automated Reward Pipeline ("پایان جلسه، توزیع تجربه و جوایز")
- **Status:** Complete
- **What it does:** Comprehensive end-of-session pipeline that bundles multiple post-game tasks: marks session status as `done`, drafts/publishes the story recap, distributes party or individual XP, marks milestone level-ups, logs memorable quotes, and updates in-world dates.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Session List Sheet → click "بستن و ثبت دستاوردهای جلسه" opens `SessionClosingSheet`.
- **Key files:**
  - Component: `src/components/session/SessionClosingSheet.tsx:55`
  - Client API: `src/services/api.ts:820` (`api.closeSession`)
  - Server Route: `functions/api/[[route]].ts:7984` (`POST /api/c/:id/sessions/:sid/close`)
  - Database Tables: `sessions`, `session_recaps`, `xp_awards`, `character_participations`, `session_highlights`
- **Notes/limits:** Atomic server transaction ensuring XP, recaps, and attendance commit simultaneously.

#### SESS-05: Session Recaps & Narrative Archive ("خلاصه‌های داستانی و آرشیو جلسات")
- **Status:** Complete
- **What it does:** Story chronicle archiving narrative recaps of past sessions with visibility flags (`party` vs `dm_only`), draft/published states, and relational tags connecting to mentioned NPCs, locations, and quests.
- **Who can use it:** Campaign Members (viewing published), DMs (drafting/editing).
- **How to reach it in the UI:** BottomNav → "بیشتر" → "خلاصه‌ها" (opens `RecapArchiveSheet` and `RecapEditorSheet`).
- **Key files:**
  - Components: `src/components/session/RecapArchiveSheet.tsx:29`, `src/components/session/RecapEditorSheet.tsx:26`
  - Engine: `shared/rules/recapEngine.ts:canUserCreateRecap,validateRecapPayload`
  - Client API: `src/services/api.ts:810-815` (`api.listRecaps`, `api.getLatestRecap`, `api.createRecap`, `api.updateRecap`, `api.deleteRecap`)
  - Server Routes: `functions/api/[[route]].ts:7684-7845` (`GET/POST/PATCH/DELETE /api/c/:id/recaps`)
  - Database Tables: `session_recaps`
- **Notes/limits:** Unpublished draft recaps and DM-only recaps are excluded from responses returned to players.

#### SESS-06: Session Highlights & Memorable Moments ("لحظات برجسته و رویدادهای جلسه")
- **Status:** Complete
- **What it does:** Allows players and DMs to log memorable character quotes, funny moments, and dramatic heroics tied to a session. Highlights appear on the session detail sheet and character history.
- **Who can use it:** Campaign Members, DMs, Players.
- **How to reach it in the UI:** Recap Archive Sheet → session card → "لحظات برجسته" section → "+ ثبت نقل‌قول / رویداد".
- **Key files:**
  - Components: `src/components/session/RecapArchiveSheet.tsx:29`, `src/components/session/SessionClosingSheet.tsx:55`
  - Engine: `shared/rules/recapEngine.ts:buildHighlightHistoryEvent`
  - Client API: `src/services/api.ts:816-818` (`api.listHighlights`, `api.createHighlight`, `api.deleteHighlight`)
  - Server Routes: `functions/api/[[route]].ts:7867-7972` (`GET/POST/DELETE /api/c/:id/highlights`)
  - Database Tables: `session_highlights`
- **Notes/limits:** Highlights credit both the author and the spoken character.

#### SESS-07: Multi-Calendar World Engine ("موتور چندتقویمی جهان فانتزی")
- **Status:** Complete
- **What it does:** Sophisticated fantasy calendar engine supporting arbitrary custom calendars with non-Gregorian month counts, custom month lengths, leap-year rules, intercalary festival days outside standard months, arbitrary weekday cycle lengths, and epoch conversions (`epochToDate`, `dateToEpoch`).
- **Who can use it:** Campaign Members, DMs, Players.
- **How to reach it in the UI:** Character Sheet → "جهان" tab → "گاه‌شمار جهان" button opens `CalendarModal` (or DM Tools → Calendar tab).
- **Key files:**
  - Components: `src/components/calendar/CalendarModal.tsx:23`, `src/components/dm/DmCalendarTab.tsx:15`
  - Engine: `shared/rules/calendar.ts:1`
  - Client API: `src/services/api.ts:610-618` (`api.getCampaignCalendars`, `api.getCampaignTime`)
  - Server Routes: `functions/api/[[route]].ts:6000-6179` (`GET/POST/PUT/DELETE /api/c/:id/calendars`)
  - Database Tables: `calendars`, `calendar_states`, `campaign_time`
- **Notes/limits:** Can configure multiple parallel calendars per campaign (e.g. Imperial Solar vs Elven Lunar).

#### SESS-08: Calendar Structure Editor & Custom Templates ("ویرایشگر ساختار تقویم و الگوها")
- **Status:** Complete
- **What it does:** Full visual editor for defining calendar structures: month names and lengths, festival off-days, weekday names, and leap cycle rules. Pre-loaded with three ready-to-use templates: Shahroozan Zorvania (360 days, 12 months of 30 days + 5 Gatha festival off-days), Gathic (Solar), and Simple Starter (standard 12-month calendar).
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** DM Tools → Library → "دنیا" group → "گاه‌شمار" → "ویرایش ساختار تقویم" opens `CalendarStructureModal`.
- **Key files:**
  - Components: `src/components/calendar/CalendarStructureModal.tsx:46`, `src/components/calendar/CalendarStructureForm.tsx:45`
  - Templates: `shared/rules/calendarTemplates.ts:1`
  - Reducer: `shared/rules/calendarStructureReducer.ts:1`
  - Client API: `src/services/api.ts:612-615` (`api.createCampaignCalendar`, `api.updateCampaignCalendar`, `api.getCalendarTemplates`)
  - Server Routes: `functions/api/[[route]].ts:6032,6089` (`POST/PUT /api/c/:id/calendars`), `functions/api/[[route]].ts:6323` (`GET /api/calendar-templates`)
  - Database Tables: `calendars`
- **Notes/limits:** Client and server share strict schema validation (`shared/rules/calendar.ts:validateCalendar`) preventing invalid day or month sequences.

#### SESS-09: Campaign In-World Time & Clock Advancement ("زمان جاری جهان و پیشبرد ساعت کمپین")
- **Status:** Complete
- **What it does:** Live campaign clock tracking in-world epoch days, hours, and minutes. DMs can explicitly jump to specific dates or advance time by set intervals (+1 hour, +1 day, +1 week, +1 month). Automatically computes current festivals and weather cues.
- **Who can use it:** Campaign Owner, Co-DM (editing), Players (viewing).
- **How to reach it in the UI:** DM Tools → Library → "دنیا" group → "گاه‌شمار" tab → "پیشبرد زمان جهان" control panel.
- **Key files:**
  - Component: `src/components/dm/DmCalendarTab.tsx:15`
  - Engine: `shared/rules/calendar.ts:advanceTime`
  - Client API: `src/services/api.ts:615-617` (`api.getCampaignTime`, `api.setCampaignTime`, `api.advanceCampaignTime`)
  - Server Routes: `functions/api/[[route]].ts:6208` (`GET /api/c/:id/time`), `functions/api/[[route]].ts:6223` (`PUT /api/c/:id/time`), `functions/api/[[route]].ts:6291` (`POST /api/c/:id/time/advance`)
  - Database Tables: `campaign_time`, `calendar_states`
- **Notes/limits:** Also maintains backwards compatibility with legacy single-calendar endpoints (`/api/calendar`, `/api/calendar/advance`, table `campaign_calendar`).

---

### Domain 9: Handouts & Interactive Maps

#### HAND-01: Handout Document & Lore Fragment Creator ("سازنده دست‌نوشته‌ها و اسناد")
- **Status:** Complete
- **What it does:** Creation and editing sheet for player-facing documents: letters, scrolls, book fragments, puzzles, illustrations, and tactical maps. Supports rich markdown formatting, image upload via SQLite BLOB storage, and secret DM notes.
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:handouts_maps`).
- **How to reach it in the UI:** DM Tools → Library → "دنیا" group → "دست‌نوشته‌ها و نقشه‌ها" tab → click "+ دست‌نوشته جدید" (opens `HandoutEditorSheet`).
- **Key files:**
  - Component: `src/components/handout/HandoutEditorSheet.tsx:29`, `src/components/dm/DmHandoutManager.tsx:61`
  - Engine: `shared/rules/handoutEngine.ts:validateHandoutPayload,checkMediaSize`
  - Client API: `src/services/api.ts:851-853` (`api.listHandouts`, `api.createHandout`, `api.updateHandout`, `api.deleteHandout`)
  - Server Routes: `functions/api/[[route]].ts:8250` (`POST /api/c/:id/handouts`), `functions/api/[[route]].ts:8316` (`PATCH /api/c/:id/handouts/:hid`), `functions/api/[[route]].ts:8385` (`DELETE /api/c/:id/handouts/:hid`)
  - Database Tables: `handouts`, `media`
- **Notes/limits:** Validates image payload sizes (≤ 150 KB default) and enforces per-campaign media storage quotas.

#### HAND-02: Handout Viewer & Selective Player Reveal ("نمایشگر دست‌نوشته با آشکارسازی گزینشی")
- **Status:** Complete
- **What it does:** Fullscreen modal for viewing text documents, high-res images, and letters. DMs can toggle handout visibility between `hidden` (DM only), `revealed` (all campaign players), or `selected` (disclosed only to chosen characters).
- **Who can use it:** Campaign Members (revealed items), DMs (all items).
- **How to reach it in the UI:** In Campaign → Character Sheet → "جهان" → "دست‌نوشته‌ها" tab → click any handout card (opens `HandoutViewerModal`).
- **Key files:**
  - Component: `src/components/handout/HandoutViewerModal.tsx:21`
  - Engine: `shared/rules/handoutEngine.ts:filterHandoutsForPlayer`
  - Client API: `src/services/api.ts:854` (`api.revealHandout`)
  - Server Route: `functions/api/[[route]].ts:8397` (`POST /api/c/:id/handouts/:hid/reveal`)
  - Database Tables: `handouts`, `handout_recipients`
- **Notes/limits:** When mode is `selected`, only users listed in `handout_recipients` receive the handout in API responses.

#### HAND-03: Interactive Map Viewer & Zoom Canvas ("نقشه تعاملی با بزرگنمایی و پیمایش")
- **Status:** Complete
- **What it does:** Touch-optimized interactive map canvas with pinch-to-zoom, pan navigation, and coordinate-anchored pins. Supports high-resolution battlemaps and regional world maps.
- **Who can use it:** Campaign Members.
- **How to reach it in the UI:** Handout Viewer Modal → when viewing a map handout, click "مشاهده نقشه تعاملی" (opens `MapViewer`).
- **Key files:**
  - Component: `src/components/handout/MapViewer.tsx:20`, `src/components/handout/MobileImageViewer.tsx:18`
  - Engine: `shared/rules/handoutEngine.ts:clampCoordinates`
- **Notes/limits:** Smooth CSS transform matrix gestures; coordinates are normalized to a 0–1000 integer grid for responsive display across screen sizes.

#### HAND-04: Map Pins Management & Entity Linking ("نشانه‌گذاری روی نقشه و اتصال به مکان‌ها")
- **Status:** Complete
- **What it does:** Allows DMs to place colored pins directly on maps with titles and descriptions, link pins to entities (Location, NPC, Quest, or Handout), and toggle individual pin visibility. Players can tap pins to open linked information cards.
- **Who can use it:** Campaign Owner, Co-DM (creating/editing), Players (inspecting revealed pins).
- **How to reach it in the UI:** In Map Viewer → DM mode: click anywhere on map canvas to drop pin → edit details in bottom sheet.
- **Key files:**
  - Component: `src/components/handout/MapViewer.tsx:20`
  - Engine: `shared/rules/handoutEngine.ts:filterPinsForPlayer`
  - Client API: `src/services/api.ts:855-857` (`api.addMapPin`, `api.updateMapPin`, `api.deleteMapPin`)
  - Server Routes: `functions/api/[[route]].ts:8483-8545` (`POST/PATCH/DELETE /api/c/:id/handouts/:hid/pins`)
  - Database Tables: `map_pins`
- **Notes/limits:** Pins marked hidden are stripped from player map view responses on the server.

---

### Domain 10: Quests & Party Shared Treasury

#### QST-01: Campaign Quest Log & Story Arcs ("دفترچه مأموریت‌ها و خطوط داستانی")
- **Status:** Complete
- **What it does:** Quest management suite tracking primary and side story arcs. Includes quest title, summary, step-by-step checklist objectives, rewards (XP, items, coins), assigned characters, and statuses: `hidden`, `active`, `completed`, `failed`, `abandoned`.
- **Who can use it:** Campaign Members (viewing active/assigned), DMs (all quests).
- **How to reach it in the UI:**
  - Player: Character Sheet → "یادداشت" → "مأموریت‌ها" tab (or Home screen `ActiveQuestsCard`).
  - DM: DM Tools → Library → "پیگیری کمپین" group → "مأموریت‌ها" tab.
- **Key files:**
  - Components: `src/components/quest/QuestsTab.tsx:37`, `src/components/quest/ActiveQuestsCard.tsx:14`, `src/components/dm/DmQuestManager.tsx:18`, `src/components/quest/DmQuestEditorModal.tsx:23`
  - Engine: `shared/rules/questEngine.ts:filterQuestsForViewer,validateQuestPayload`
  - Client API: `src/services/api.ts:870-874` (`api.listQuests`, `api.getQuest`, `api.createQuest`, `api.updateQuest`, `api.deleteQuest`)
  - Server Routes: `functions/api/[[route]].ts:8603-8788` (`GET/POST/PATCH/DELETE /api/c/:id/quests`)
  - Database Tables: `quests`, `quest_participants`
- **Notes/limits:** Unrevealed/hidden quests are excluded from player queries on the server.

#### QST-02: Quest Objective Check-offs & Player Visibility ("اهداف مأموریت و تیک زدن گام‌ها")
- **Status:** Complete
- **What it does:** Allows ticking off discrete objectives as the party accomplishes goals. If campaign setting `allowPlayerTickQuestObjectives` is enabled, assigned players can toggle completed objectives themselves; otherwise, checking off objectives is reserved for the DM.
- **Who can use it:** Campaign Owner, Co-DM, and Assigned Players (if allowed).
- **How to reach it in the UI:** Quests Tab → quest details accordion → click checkbox next to objective.
- **Key files:**
  - Component: `src/components/quest/QuestsTab.tsx:37`
  - Engine: `shared/rules/questEngine.ts:canUserToggleObjective`
  - Client API: `src/services/api.ts:875` (`api.toggleQuestObjective`)
  - Server Route: `functions/api/[[route]].ts:8801` (`POST /api/c/:id/quests/:qid/objectives/:oid/toggle`)
  - Database Tables: `quests`
- **Notes/limits:** Server verifies permissions against campaign settings before toggling objective state.

#### QST-03: Quest Completion & Automatic Reward Distribution ("اتمام مأموریت و اعطای پاداش")
- **Status:** Complete
- **What it does:** Marks a quest as completed and optionally distributes pre-configured rewards (party coins deposited to treasury, XP awarded to participating characters, items added to inventories).
- **Who can use it:** Campaign Owner, Co-DM (`dm_tools:quests`).
- **How to reach it in the UI:** DM Quest Manager → select quest → click "تکمیل مأموریت و اعطای پاداش‌ها" → confirm dialog.
- **Key files:**
  - Component: `src/components/dm/DmQuestManager.tsx:18`
  - Client API: `src/services/api.ts:876` (`api.completeQuest`)
  - Server Route: `functions/api/[[route]].ts:8845` (`POST /api/c/:id/quests/:qid/complete`)
  - Database Tables: `quests`, `party_currency`, `xp_awards`, `character_participations`, `audit_log`
- **Notes/limits:** Executes atomic server reward disbursements and logs completion events to character histories.

#### TRZ-01: Party Shared Treasury & Coin Balances ("صندوق مشترک گروه و موجودی سکه‌ها")
- **Status:** Complete
- **What it does:** Shared financial pool tracking collective party coins (Copper, Silver, Gold, Platinum). Supports depositing, spending, and coin conversion with optimistic concurrency revision tracking.
- **Who can use it:** Campaign Members, Players, DMs.
- **How to reach it in the UI:** Character Sheet → "کوله‌پشتی" tab → click "صندوق مشترک گروه" button opens `PartyTreasuryManager` (or DM Tools → Library → "پیگیری کمپین" → "صندوق مشترک").
- **Key files:**
  - Component: `src/components/campaign/PartyTreasuryManager.tsx:1`
  - Client API: `src/services/api.ts:900,901` (`api.getPartyTreasury`, `api.updatePartyCurrency`)
  - Server Routes: `functions/api/[[route]].ts:9252` (`GET /api/c/:id/treasury`), `functions/api/[[route]].ts:9301` (`PATCH /api/c/:id/treasury/currency`)
  - Database Tables: `party_currency`, `treasury_log`
- **Notes/limits:** Enforces concurrency check (`expectedRevision`); if another player updated coins simultaneously, server returns conflict error to prevent overwrites.

#### TRZ-02: Treasury Item Transfers & Allocation ("انتقال اقلام میان صندوق و کوله‌پشتی")
- **Status:** Complete
- **What it does:** Manages group-owned loot and quest items held in the shared treasury. Allows players to deposit personal items into the treasury, withdraw shared items into their personal inventory, or transfer items directly to other party members.
- **Who can use it:** Campaign Members.
- **How to reach it in the UI:** Party Treasury Manager → "اقلام مشترک" tab → click item actions → "انتقال به کوله‌پشتی من" or "انتقال به هم‌گروهی".
- **Key files:**
  - Component: `src/components/campaign/PartyTreasuryManager.tsx:1`
  - Client API: `src/services/api.ts:902-905` (`api.addPartyItem`, `api.updatePartyItem`, `api.removePartyItem`, `api.transferPartyItem`)
  - Server Routes: `functions/api/[[route]].ts:9354-9453` (`POST/PATCH/DELETE /api/c/:id/treasury/items`), `functions/api/[[route]].ts:9487` (`POST /api/c/:id/treasury/transfer`)
  - Database Tables: `party_items`, `character_participations`, `treasury_log`
- **Notes/limits:** Atomic item migration ensures items never duplicate or disappear between sheets during transfers.

#### TRZ-03: Treasury Transaction Audit Log ("گزارش تراکنش‌ها و جابه‌جایی‌های صندوق")
- **Status:** Complete
- **What it does:** Tamper-evident ledger detailing all treasury events: coin deposits/withdrawals, item additions, removals, and player-to-player transfers with timestamps, actor IDs, and reason notes.
- **Who can use it:** Campaign Members.
- **How to reach it in the UI:** Party Treasury Manager → "تاریخچه تراکنش‌ها" tab.
- **Key files:**
  - Component: `src/components/campaign/PartyTreasuryManager.tsx:1`
  - Client API: `src/services/api.ts:906` (`api.listTreasuryLogs`)
  - Server Route: `functions/api/[[route]].ts:9651` (`GET /api/c/:id/treasury/logs`)
  - Database Tables: `treasury_log`
- **Notes/limits:** Displayed in localized Persian digits and relative Persian time phrases.

#### REP-01: Faction Reputation & Standing Tracker ("میزان شهرت و روابط با جناح‌ها")
- **Status:** Complete
- **What it does:** Tracks political standing and moral reputation between the adventuring party and regional factions (e.g. guilds, city guards, rival cults). Automatically categorizes standings across five standard attitude tiers: Hostile (-100 to -50), Unfriendly (-49 to -10), Neutral (-9 to +9), Friendly (+10 to +49), and Allied (+50 to +100).
- **Who can use it:** Campaign Members (viewing revealed factions), DMs (managing all).
- **How to reach it in the UI:** DM Tools → Library → "پیگیری کمپین" group → "شهرت و جناح‌ها" opens `FactionReputationManager` (or Character Sheet → "جهان" → "جناح‌ها").
- **Key files:**
  - Component: `src/components/campaign/FactionReputationManager.tsx:1`
  - Client API: `src/services/api.ts:890-893` (`api.listFactionReputations`, `api.createFactionReputation`, `api.updateFactionReputation`, `api.deleteFactionReputation`)
  - Server Routes: `functions/api/[[route]].ts:8995-9199` (`GET/POST/PATCH/DELETE /api/c/:id/reputation`)
  - Database Tables: `factions`, `faction_reputation`
- **Notes/limits:** Factions marked hidden are excluded from player codex responses.

#### REP-02: Reputation Adjustments & Standing Logs ("تغییرات شهرت و تاریخچه روابط")
- **Status:** Complete
- **What it does:** Enables DMs to adjust faction reputation scores by positive or negative amounts accompanied by a mandatory reason and linked session reference. Logs all score adjustments to an immutable history.
- **Who can use it:** Campaign Owner, Co-DM.
- **How to reach it in the UI:** Faction Reputation Manager → faction card → "+/- تغییر امتیاز شهرت" button → enter delta and narrative reason → submit.
- **Key files:**
  - Component: `src/components/campaign/FactionReputationManager.tsx:1`
  - Client API: `src/services/api.ts:894,896` (`api.adjustFactionReputation`, `api.listReputationLogs`)
  - Server Routes: `functions/api/[[route]].ts:9145` (`POST /api/c/:id/reputation/:id/adjust`), `functions/api/[[route]].ts:9210` (`GET /api/c/:id/reputation-logs`)
  - Database Tables: `faction_reputation`, `reputation_log`, `audit_log`
- **Notes/limits:** Clamps reputation score to boundaries (-100 to +100) and displays audit logs in Persian.

---

### Domain 11: Cross-Cutting, Notifications, Sync & Offline Support

#### SYNC-01: Offline Queue & Stale-While-Revalidate Sync ("صف همگام‌سازی آفلاین و صف ارسال")
- **Status:** Complete
- **What it does:** Enqueues player gameplay edits (HP, temporary HP, character notes, inventory modifications, custom resource counters) in local storage when network connectivity is lost. Coalesces rapid sequential edits for the same field into a single queued item while preserving the original `baseRevision`. Automatically attempts to replay queued operations via `POST /api/sync/edits` upon network restoration or user trigger.
- **Who can use it:** Authenticated Players and DMs.
- **How to reach it in the UI:** Header connection pill (indicates offline state with queue counter e.g. "آفلاین، ۳ تغییر در صف ارسال") → Click to open Offline Queue modal / trigger manual retry.
- **Key files:**
  - UI Component: `src/components/Header.tsx:270`
  - Client Hook/Service: `src/services/offlineSync.ts:OfflineSyncManager`, `src/hooks/useOnlineStatus.ts`
  - Shared Engine: `shared/rules/offlineEngine.ts:enqueueEdit`, `dequeueEdits`
  - Server Route: `functions/api/[[route]].ts:1570` (`POST /api/sync/edits`)
  - Database Table: `sync_conflicts`
- **Notes/limits:** Scoped strictly to player-modifiable gameplay attributes (`currentHp`, `tempHp`, `notes`, `inventory`, `customResources`). Structural mutations (level progression, character creation, member removal) require active online connectivity.

#### SYNC-02: Revision-Based Conflict Resolution ("حل تعارض نسخه‌ها با بررسی تضاد")
- **Status:** Complete
- **What it does:** Intercepts optimistic concurrency conflicts when replaying an offline edit against a server entity whose revision has changed. Presents a dedicated Persian conflict resolution modal displaying the localized field label, client value, server value, and revisions, giving the user full autonomy to choose "نگه‌داشتن تغییر من (Client)" or "پذیرش تغییر سرور (Server)".
- **Who can use it:** Authenticated Players and DMs.
- **How to reach it in the UI:** Appears automatically when a sync response returns 409 Conflict, or via Header → Sync warning badge → Click conflicting item.
- **Key files:**
  - UI Component: `src/components/common/ConflictResolutionModal.tsx:ConflictResolutionModal`
  - Client Hook/Service: `src/services/offlineSync.ts:resolve`
  - Shared Engine: `shared/rules/offlineEngine.ts:ConflictDetails`, `getFieldLabelFa`
  - Server Route: `functions/api/[[route]].ts:1572` (`POST /api/sync/conflicts/:id/resolve`)
  - Database Table: `sync_conflicts`
- **Notes/limits:** Tracks unresolved conflicts in database table `sync_conflicts` until resolved by user intervention.

#### THEME-01: Dark/Light Theme & Design Tokens ("پوسته تاریک/روشن و توکن‌های طراحی")
- **Status:** Complete
- **What it does:** Provides a comprehensive dual-theme design system (dark default, day/light mode) controlled via `data-theme="light|dark"` attribute on `:root`. Enforces strict semantic design token discipline through CSS custom variables in `src/styles/theme.css` with zero raw hex colors, ensuring high contrast (WCAG AA), parchment elevation styles, and responsive fantasy styling.
- **Who can use it:** All Users (including Guests).
- **How to reach it in the UI:** Header → User Menu → "حساب کاربری" (Account Modal) → "پوسته نمایشی" (Dark/Light selector), or Bottom Nav → More sheet.
- **Key files:**
  - Stylesheet: `src/styles/theme.css`, `src/styles/tokens.css`
  - Lint Script: `scripts/lint-styles.mjs`
  - Component: `src/components/AccountModal.tsx:640`
  - Context/App: `src/App.tsx:theme`
- **Notes/limits:** Strict token guardrail is verified continuously by `npm run lint:styles`. No raw hex colors, Tailwind default colors, or `!important` color overrides are permitted.

#### ACC-01: Accessibility, Persian RTL & Screen Wake Lock ("دسترس‌پذیری، راست‌به‌چپ و روشن ماندن صفحه")
- **Status:** Complete
- **What it does:** Enforces Persian document direction (`dir="rtl"`, `lang="fa"`) with bidirectional numeric and dice notation isolation (`unicode-bidi: isolate; direction: ltr`). Complies with mobile touch accessibility standards (minimum 44px touch targets, visible `:focus-visible` styling, `prefers-reduced-motion` animation suppression). Provides an interactive Screen Wake Lock toggle to prevent mobile display sleep during live tabletop combat sessions. Character sheets include dedicated `@media print` CSS for tabletop paper handouts.
- **Who can use it:** All Users.
- **How to reach it in the UI:** Header → User Menu → "روشن ماندن صفحه هنگام بازی" (Wake Lock switch); print via browser print dialog (`Ctrl+P` / `Cmd+P`).
- **Key files:**
  - Hooks: `src/hooks/useWakeLock.ts`, `src/hooks/useVisualViewport.ts`
  - Stylesheet: `src/index.css:227` (dice-ltr, selectable-text, print media queries)
  - Helper: `shared/rules/historyEngine.ts:toPersianDigits`
  - UI Component: `src/components/Header.tsx:640`
- **Notes/limits:** Print stylesheet is built into CSS (`@media print` in `src/index.css`) for character and session sheets, though without a dedicated mobile print button. Wake Lock is browser-dependent (`navigator.wakeLock`).

---

## 5. Cross-Cutting Capabilities

### 5.1 Offline Architecture, Optimistic Sync & Concurrency Control
DungeonYar is engineered as an offline-first companion application tailored for tabletop RPG venues with erratic Wi-Fi or cellular coverage:
- **Local Edit Queue:** When offline, mutations to core gameplay fields (`currentHp`, `tempHp`, `notes`, `inventory`, `customResources`) are intercepted by `src/services/offlineSync.ts` and coalesced via `shared/rules/offlineEngine.ts:enqueueEdit`.
- **Edit Coalescence:** Multiple successive edits to the same field (e.g. taking 3 damage, then another 2 damage) are compressed into a single queue entry. The queue preserves the initial `baseRevision` so that server-side concurrency validation verifies against the original baseline state.
- **Optimistic Concurrency Control:** Every participation record carries a monotonic integer `revision`. Server mutation endpoints (`PATCH /api/c/:id/participations/:pid`) verify that the client's `baseRevision` matches the current database revision. If another player or DM modified the record in the interim, the server issues HTTP 409 Conflict and records an entry in `sync_conflicts`.
- **Interactive Conflict Resolver:** Collisions are surfaced to the user through `ConflictResolutionModal.tsx`, presenting field names in Persian (e.g., "جان فعلی (HP)", "کوله‌پشتی و تجهیزات") and offering side-by-side inspection of client vs. server values with explicit choose-winner actions.

### 5.2 PWA Lifecycle, Service Worker & Update Strategy
The progressive web application operates under `vite-plugin-pwa` with `registerType: 'prompt'`:
- **Asset Pre-caching:** The application shell, HTML, compiled JavaScript chunks, and self-hosted Vazirmatn and IranSans Web fonts are precached by Workbox (`src/hooks/usePWARefresh.tsx`).
- **Runtime Caching Policy:** Non-sensitive static assets and public icons are served stale-while-revalidate. Authorization-sensitive `/api/*` endpoints are never cached by the Service Worker.
- **Install Flow:** `src/hooks/usePWAInstall.ts` captures the `beforeinstallprompt` browser event, detects iOS Safari standalone requirements, and renders an in-app installation prompt toast and menu option.
- **Update Notification:** `usePWARefresh` monitors Service Worker `controllerchange` and polling events every 30 seconds. When a new app version is ready, a non-intrusive floating banner alerts the user to update ("نسخه جدید دانجن‌یار در دسترس است") and cleanly dispatches `SKIP_WAITING` followed by page reload.

### 5.3 Theme Engine, Design Tokens & WCAG Contrast Discipline
The visual design system is defined in `src/styles/theme.css` and referenced through `tokens.css`:
- **Dual Themes:** Supports both dark (default) and day/light modes, toggled via `:root[data-theme="dark"]` and `:root[data-theme="light"]`.
- **Semantic Token Abstraction:** Components never utilize raw hex codes (`#1a1a1a`), RGB values, or arbitrary Tailwind colors (`bg-red-500`). All styles consume semantic tokens: `--color-background`, `--color-surface`, `--color-surface-hover`, `--color-primary`, `--color-accent`, `--color-text-primary`, `--color-text-muted`, and `--color-border`.
- **WCAG AA Compliance:** Color pairings are calibrated to exceed 4.5:1 contrast ratios for normal text and 3:1 for large text across both light and dark palettes.
- **Automated Guardrail:** The custom linter `scripts/lint-styles.mjs` executes during `npm run lint:styles` and `npm run check`, failing the build if raw color literals, `!important` flags, or non-token utility classes are introduced.

### 5.4 Persian RTL, Bidirectional Number & Dice Formula Isolation
DungeonYar is authored natively for Persian speakers while handling mixed directional content:
- **Logical Flow:** The root document declares `<html lang="fa" dir="rtl">`. UI layout utilizes Tailwind logical utility classes exclusively (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `inset-inline-*`). Physical left/right styles are forbidden.
- **Bidirectional Isolation:** D&D dice notation (e.g. `1d20+5`, `2d6+3`), numerical formulas, and modifier stats are wrapped in `.dice-ltr` or `.num-ltr` classes with `unicode-bidi: isolate; direction: ltr; font-variant-numeric: tabular-nums`. This prevents RTL layout engines from mangling math expressions.
- **Persian Number Formatting:** All UI counters, levels, session numbers, gold sums, and dates are formatted into standard Persian numerals via `shared/rules/historyEngine.ts:toPersianDigits(n)`.

### 5.5 Multi-Tier Notifications & Web Push Integration
Alerts and tabletop events are routed through a multi-tier notification pipeline:
- **In-App Notification Drawer:** Real-time event notifications (`notifications` table) are accessed via the header bell icon. Notifications are categorized into: session invitations/reschedules, level-up and character approvals, DM announcements, quest updates, and loot distributions.
- **Granular Category Preferences:** Through `NotificationPrefsModal.tsx` (`notification_prefs` table), users can independently mute or enable alerts for specific event types (e.g., mute dice roll broadcasts while keeping session RSVP reminders active).
- **Web Push API:** Push subscriptions are managed through `src/hooks/usePushNotifications` and persisted in `push_subscriptions`. The backend sends standardized Web Push payloads via WebCrypto ECDSA encryption for off-session reminders.

### 5.6 Accessibility, Touch Ergonomics & Display Wake Lock
Engineered specifically for handheld mobile usage during tabletop gaming sessions:
- **Mobile Touch Targets:** All interactive controls (buttons, chips, checkboxes, tab selectors) adhere to a minimum physical bounding box of 44×44 pixels with at least 8px separation between actionable areas.
- **Keyboard & Viewport Protection:** Implements `100dvh` dynamic viewport height and leverages `src/hooks/useVisualViewport.ts` to reposition sticky action sheets above the software virtual keyboard on iOS Safari and Android Chrome.
- **Screen Wake Lock:** Mobile screens typically sleep after 30 seconds of inactivity. In `src/hooks/useWakeLock.ts`, the application hooks into the browser `navigator.wakeLock` API. When toggled on from the header menu, the screen remains illuminated throughout combat encounters and session play, automatically re-requesting the lock when the tab regains visibility.
- **Motion Reduction:** Media query `@media (prefers-reduced-motion: reduce)` in `src/index.css` suppresses CSS animations and transitions down to 0.01ms for users with vestibular sensitivities.

### 5.7 Print Stylesheet & Tabletop Paper Compatibility
For players and DMs who prefer physical handouts or paper backups:
- **Print Media Queries:** `src/index.css` provides dedicated `@media print` rules.
- **Style Stripping:** During browser print execution (`window.print()`), bottom navigation docks, floating action buttons, backdrops, modal headers, and theme background fills are hidden, rendering character sheets and session recaps with clean monochrome borders and high-legibility dark ink on white paper.

### 5.8 Content Cloning Engine & Deep Resource Remapping
To allow DMs to reuse worlds, monsters, items, and rules across multiple campaigns without pollution:
- **Copy-On-Use Semantics:** Content packs (such as the default Zorvania pack) serve as immutable source templates. When a pack or campaign is imported, items, NPCs, and templates are deep-copied into the target campaign with `scope_type = 'campaign'` and explicit `campaign_id`.
- **Dry-Run Preview:** `POST /api/clone/preview` validates entity dependencies, computes entity counts, and detects potential naming collisions without committing changes to D1.
- **ID Remapping Engine:** `POST /api/clone/run` performs topological dependency resolution (e.g. factions before NPCs, locations before encounters), generating fresh UUIDs and remapping all foreign key references within JSON metadata.
- **Undo Token:** Every clone operation writes a manifest to `clone_jobs` and returns an `undo_token`, permitting atomic rollbacks of cloned batches if the DM cancels the operation.

### 5.9 Security Hardening, Cryptography & Defense in Depth
The production Cloudflare Pages Functions backend enforces strict security boundaries:
- **Server-Side Authorization:** Roles are evaluated strictly per-campaign (`owner`, `co_dm`, `player`, `spectator`) via `shared/permissions.ts`. Client-side permissions only control UX visibility; any unauthorized API request returns HTTP 403 or 404.
- **Non-Member 404 Obfuscation:** Accessing a campaign resource without valid membership returns HTTP 404 Not Found rather than 403 Forbidden, preventing resource existence enumeration.
- **DM Secret Data Stripping:** Endpoints automatically sanitize responses before dispatching to players: DM notes, unrevealed NPCs/locations/quests, secret dice rolls, private backstory comments, and unshared notes are stripped server-side.
- **CSRF Protection:** All state-modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the custom header `X-Requested-With: zorvania` along with verified `Origin` header matching.
- **WebCrypto PBKDF2 Password Hashing:** User passwords are hashed using PBKDF2-SHA-256 with 100,000 iterations (the Cloudflare Workers WebCrypto execution limit) and a cryptographically secure 16-byte random salt.
- **Session Cookie Security:** Authentication tokens are stored in `__Host-` prefixed cookies configured with `HttpOnly`, `Secure`, and `SameSite=Lax`.
- **Brute-Force Rate Limiting:** Failed login attempts are recorded in `login_attempts` with IP hash salting (`IP_HASH_SALT`), enforcing exponential backoff and temporary IP lockouts.

### 5.10 Audit Trails & Immutable History Ledgers
Every sensitive campaign action is permanently recorded for transparency:
- **Campaign Security Audit Log:** Table `audit_log` tracks role promotions, member evictions, ownership transfers, DM overrides, and visibility reveals with actor user ID, client IP hash, timestamp, and details payload.
- **Treasury Ledger:** Table `treasury_log` logs every deposit, withdrawal, currency conversion, and loot distribution from the party coffer.
- **Faction Reputation History:** Table `reputation_log` records all score adjustments, reasons, and approving DM IDs.
- **Character Milestone Events:** Table `character_history_events` maintains a cross-campaign timeline for each master character, archiving session attendances, level milestones, titles, and combat honors.

---

## 6. API Surface Summary

The table below catalogs the server endpoints implemented in `functions/api/[[route]].ts`, their HTTP methods, required access roles, functional descriptions, and client integration status.

| Method | Endpoint Path | Role / Requirement | Purpose | Client Adapter Method & Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public (Invite required by default) | Register a new user account with optional invite code | `register()` — Active |
| `POST` | `/auth/login` | Public | Authenticate user with password, issue session cookie | `login()` — Active |
| `POST` | `/auth/logout` | Authenticated | Invalidate current user session cookie | `logout()` — Active |
| `POST` | `/auth/logout-all` | Authenticated | Revoke all active sessions for the authenticated user | `logoutAll()` — Active |
| `GET` | `/auth/me` | Authenticated | Fetch current user info, active character, and platform role | `getMe()` — Active |
| `POST` | `/auth/reset` | Public (Token required) | Consume one-time reset token to set new password | `consumeResetToken()` — Active |
| `GET` | `/home` | Authenticated | Fetch aggregated summary for the player home dashboard | `getHomeSummary()` — Active |
| `GET` | `/campaigns` | Authenticated | List all campaigns where user is a member | `listCampaigns()` — Active |
| `POST` | `/campaigns` | Authenticated (`platform:create_campaign`) | Create a new campaign workspace | `createCampaign()` — Active |
| `GET` | `/c/:campaignId` | Campaign Member | Get detailed campaign profile and configuration | `getCampaign()` — Active |
| `PATCH` | `/c/:campaignId` | Campaign Owner | Update campaign name, description, tone, or settings | `updateCampaign()` — Active |
| `GET` | `/c/:campaignId/members` | Campaign Member | List members and their assigned campaign roles | `listCampaignMembers()` — Active |
| `PATCH` | `/c/:campaignId/members/:userId` | Owner / Co-DM (hierarchical) | Change member campaign role or status | `updateCampaignMember()` — Active |
| `DELETE` | `/c/:campaignId/members/:userId` | Owner / Co-DM / Self (Leave) | Kick member or leave campaign | `removeCampaignMember()` / `leaveCampaign()` — Active |
| `POST` | `/c/:campaignId/transfer-ownership` | Campaign Owner | Transfer campaign ownership to another active member | `transferCampaignOwnership()` — Active |
| `GET` | `/c/:campaignId/invites` | Owner / Co-DM | List pending campaign invite codes | `listCampaignInvites()` — Active |
| `POST` | `/c/:campaignId/invites` | Owner / Co-DM | Generate a new campaign invite code | `createCampaignInvite()` — Active |
| `DELETE` | `/c/:campaignId/invites/:inviteId` | Owner / Co-DM | Revoke an existing campaign invite code | `revokeCampaignInvite()` — Active |
| `POST` | `/invites/accept` | Authenticated | Accept invite code to join a campaign | `acceptInvite()` — Active |
| `GET` | `/c/:campaignId/dice` | Campaign Member | Fetch campaign table dice feed (strips DM secrets) | `listDiceRolls()` — Active |
| `POST` | `/c/:campaignId/dice` | Campaign Member | Broadcast a new dice roll to the campaign table | `postDiceRoll()` — Active |
| `POST` | `/media` | Authenticated | Upload compressed image/media as SQLite BLOB | `uploadMedia()` — Active |
| `GET` | `/media/:mediaId` | Authenticated | Retrieve raw media BLOB binary stream | `getMedia()` — Active |
| `DELETE` | `/media/:mediaId` | Owner / Creator | Delete uploaded media entry from database | `deleteMedia()` — Active |
| `GET` | `/characters` | Authenticated | List all master characters belonging to user | `listMasterCharacters()` — Active |
| `GET` | `/characters/:id` | Authenticated | Fetch specific master character details | `getMasterCharacter()` — Active |
| `POST` | `/characters` | Authenticated | Create a new master character entry | `createMasterCharacter()` — Active |
| `PATCH` | `/characters/:id` | Character Owner | Update master character profile and details | `updateMasterCharacter()` — Active |
| `POST` | `/characters/:id/status` | Character Owner | Update life status (`active`, `retired`, `dead`) | `updateMasterCharacterStatus()` — Active |
| `GET` | `/characters/:id/history` | Authenticated | Retrieve history and timeline events | `getMasterCharacterHistory()` — Active |
| `POST` | `/characters/:id/history` | Owner / Co-DM | Append custom milestone or history event | `addCharacterHistoryEvent()` — Active |
| `GET` | `/characters/:id/revisions` | Character Owner | List backstory revisions | `listCharacterRevisions()` — Active |
| `POST` | `/characters/:id/revisions` | Character Owner | Snapshot current backstory as a new revision | `createCharacterRevision()` — Active |
| `POST` | `/characters/:id/revisions/:revId/restore` | Character Owner | Restore backstory to an earlier snapshot | `restoreCharacterRevision()` — Active |
| `POST` | `/characters/:id/ready-for-review` | Character Owner | Submit backstory to DM for review | `toggleCharacterReadyForReview()` — Active |
| `GET` | `/characters/:id/backstory-comments` | Member (DM + Owner) | List inline feedback comments on backstory | `listBackstoryComments()` — Active |
| `POST` | `/characters/:id/backstory-comments` | Owner / Co-DM | Post inline comment on backstory section | `createBackstoryComment()` — Active |
| `PATCH` | `/characters/:id/backstory-comments/:cId`| Owner / Co-DM | Mark backstory comment as resolved | `resolveBackstoryComment()` — Active |
| `POST` | `/characters/:id/backstory-review` | Owner / Co-DM | DM approves or requests changes on backstory | `reviewCharacterBackstory()` — Active |
| `GET` | `/c/:campaignId/participations` | Campaign Member | List character participations in campaign | `listParticipations()` — Active |
| `POST` | `/c/:campaignId/participations` | Campaign Member | Create new participation for character | `createParticipation()` — Active |
| `PATCH` | `/c/:campaignId/participations/:id` | Owner / Co-DM / Player | Update live gameplay state (HP, slots, notes) | `updateParticipation()` — Active |
| `POST` | `/c/:campaignId/participations/:id/approve` | Owner / Co-DM | Approve character entry into campaign | `reviewParticipation('approve')` — Active |
| `POST` | `/c/:campaignId/participations/:id/reject` | Owner / Co-DM | Reject character participation | `reviewParticipation('reject')` — Active |
| `POST` | `/c/:campaignId/participations/:id/request_changes` | Owner / Co-DM | Request character build modifications | `reviewParticipation('request_changes')` — Active |
| `POST` | `/c/:campaignId/participations/:id/level-up` | Character Owner / DM | Submit level-up payload for approval | `requestLevelUp()` — Active |
| `POST` | `/c/:campaignId/participations/:id/approve-level-up`| Owner / Co-DM | Commit pending level-up to character | `approveLevelUp()` — Active |
| `POST` | `/c/:campaignId/participations/:id/reject-level-up` | Owner / Co-DM | Reject level-up proposal | `rejectLevelUp()` — Active |
| `POST` | `/c/:campaignId/participations/:id/undo-level-up` | Owner / Co-DM | Revert character level-up to previous level | Uncalled in Client — Backend-only |
| `POST` | `/c/:campaignId/participations/:id/dm-override` | Owner / Co-DM | Forcibly overwrite participation values | `dmOverrideParticipation()` — Active |
| `POST` | `/c/:campaignId/participations/:id/respec-window` | Owner / Co-DM | Open/close respec window for player | `toggleRespecWindow()` — Active |
| `POST` | `/c/:campaignId/participations/:id/sheet-change-request` | Player | Request locked sheet modification | `submitSheetChangeRequest()` — Active |
| `GET` | `/c/:campaignId/sheet-change-requests` | Owner / Co-DM | View pending sheet change requests | `listSheetChangeRequests()` — Active |
| `POST` | `/c/:campaignId/sheet-change-requests/:id/review` | Owner / Co-DM | Approve or reject sheet change request | `reviewSheetChangeRequest()` — Active |
| `GET` | `/c/:campaignId/edit-grants` | Campaign Member | List active temporary edit grants | `listEditGrants()` — Active |
| `POST` | `/c/:campaignId/edit-grants` | Owner / Co-DM | Grant temporary edit access to locked fields | `createEditGrant()` — Active |
| `POST` | `/c/grants/:grantId/revoke` | Owner / Co-DM | Revoke an active edit grant immediately | `revokeEditGrant()` — Active |
| `POST` | `/c/wizard/roll-abilities` | Authenticated | Server-authoritative 4d6 drop-lowest rolls | `rollWizardAbilities()` — Active |
| `GET` | `/c/:campaignId/participations/drafts` | Campaign Member | List saved character creation wizard drafts | `listDraftParticipations()` — Active |
| `POST` | `/c/:campaignId/participations/draft` | Campaign Member | Save progress draft in creation wizard | `saveDraftParticipation()` — Active |
| `POST` | `/c/:campaignId/participations/wizard-submit`| Campaign Member | Finalize and submit wizard character | `submitCharacterWizard()` — Active |
| `GET` | `/c/:campaignId/participations/:id/snapshots`| Owner / Co-DM | View participation backup snapshots | `listParticipationSnapshots()` — Active |
| `POST` | `/c/:campaignId/participations/:id/snapshots/:sId/restore` | Owner / Co-DM | Restore participation from snapshot | `restoreSnapshot()` — Active |
| `POST` | `/characters/:id/give-item` | Owner / Co-DM | DM grants item directly to player sheet | `giveItemToPlayer()` — Active |
| `POST` | `/characters/group-rest` | Owner / Co-DM | Apply short/long rest to all active members | `applyGroupRest()` — Active |
| `POST` | `/characters/group-resources` | Owner / Co-DM | Batch adjust common party resources | `updateGroupResources()` — Active |
| `GET` | `/c/:campaignId/xp-awards` | Campaign Member | List logged campaign XP awards | Uncalled in Client — Backend-only |
| `POST` | `/c/:campaignId/xp-awards` | Owner / Co-DM | Award XP to one or all characters | `awardXp()` — Active |
| `POST` | `/c/:campaignId/milestone-level-up` | Owner / Co-DM | Trigger milestone level up for characters | `milestoneLevelUp()` — Active |
| `GET` | `/npcs` | Campaign Member | List NPCs (players receive only revealed) | `listNpcs()` — Active |
| `POST` | `/npcs` | Owner / Co-DM | Create NPC entry | `createNpc()` — Active |
| `PUT` | `/npcs/:id` | Owner / Co-DM | Update NPC stats, traits, or lore | `updateNpc()` — Active |
| `DELETE` | `/npcs/:id` | Owner / Co-DM | Delete NPC entry | `deleteNpc()` — Active |
| `GET` | `/items` | Campaign Member | List item vault catalog | `listItems()` — Active |
| `POST` | `/items` | Owner / Co-DM | Create new custom item definition | `createItem()` — Active |
| `PUT` | `/items/:id` | Owner / Co-DM | Update item attributes and description | `updateItem()` — Active |
| `DELETE` | `/items/:id` | Owner / Co-DM | Remove item from library | `deleteItem()` — Active |
| `GET` | `/rewards` | Owner / Co-DM | List pre-packaged reward bundles | `listRewards()` — Active |
| `POST` | `/rewards` | Owner / Co-DM | Create reward bundle | `createReward()` — Active |
| `POST` | `/rewards/:id/distribute` | Owner / Co-DM | Distribute bundle items to characters | `distributeReward()` — Active |
| `GET` | `/locations` | Campaign Member | List atlas locations (players see revealed) | `listLocations()` — Active |
| `POST` | `/locations` | Owner / Co-DM | Add location entry with coordinates | `createLocation()` — Active |
| `PATCH` | `/locations/:id` | Owner / Co-DM | Update location or reveal to players | `updateLocation()` — Active |
| `DELETE` | `/locations/:id` | Owner / Co-DM | Remove location from atlas | `deleteLocation()` — Active |
| `GET` | `/campaign-notes` | Owner / Co-DM | List secret DM notes and plot threads | `listCampaignNotes()` — Active |
| `POST` | `/campaign-notes` | Owner / Co-DM | Create private campaign note | `createCampaignNote()` — Active |
| `PUT` | `/campaign-notes/:id` | Owner / Co-DM | Update campaign note content | `updateCampaignNote()` — Active |
| `DELETE` | `/campaign-notes/:id` | Owner / Co-DM | Delete campaign note | `deleteCampaignNote()` — Active |
| `GET` | `/encounters/active` | Campaign Member | Fetch currently running live encounter | `getActiveEncounter()` — Active |
| `GET` | `/encounters/:id/view` | Campaign Member | Real-time participant state for battle view | `getEncounterView()` — Active |
| `POST` | `/encounters/:id/initiative` | Campaign Member | Player submits rolled initiative | `submitInitiative()` — Active |
| `POST` | `/encounters/:id/start` | Owner / Co-DM | Start encounter and roll NPC initiative | `startLiveEncounter()` — Active |
| `POST` | `/encounters/:id/pause` | Owner / Co-DM | Pause ongoing encounter | `pauseLiveEncounter()` — Active |
| `POST` | `/encounters/:id/resume` | Owner / Co-DM | Resume paused combat encounter | `resumeLiveEncounter()` — Active |
| `POST` | `/encounters/:id/end` | Owner / Co-DM | Complete combat and record resolution | `endLiveEncounter()` — Active |
| `POST` | `/encounters/:id/next-turn` | Owner / Co-DM | Advance combat to next active turn | `nextEncounterTurn()` — Active |
| `POST` | `/encounters/:id/prev-turn` | Owner / Co-DM | Step back combat to previous turn | `prevEncounterTurn()` — Active |
| `POST` | `/encounters/:id/participants` | Owner / Co-DM | Add monsters/PCs to live combat | `addEncounterParticipants()` — Active |
| `PATCH` | `/encounters/:id/participants/:pId`| Owner / Co-DM | Modify HP, status, or visibility of fighter | `updateEncounterParticipant()` — Active |
| `DELETE` | `/encounters/:id/participants/:pId`| Owner / Co-DM | Remove participant from encounter | `deleteEncounterParticipant()` — Active |
| `POST` | `/encounters/:id/events` | Owner / Co-DM | Log in-combat narrative or damage event | `addEncounterEvent()` — Active |
| `POST` | `/encounters/:id/loot` | Owner / Co-DM | Distribute combat loot to participants | `distributeEncounterLoot()` — Active |
| `GET` | `/c/:campaignId/sessions` | Campaign Member | List planned and completed sessions | `listSessions()` / `listCampaignSessions()` — Active |
| `POST` | `/c/:campaignId/sessions` | Owner / Co-DM | Schedule new session or date poll | `createSession()` — Active |
| `GET` | `/c/:campaignId/sessions/:id` | Campaign Member | Fetch single session details | `getSession()` — Active |
| `PATCH` | `/c/:campaignId/sessions/:id` | Owner / Co-DM | Update session schedule, location, or notes | `updateSession()` — Active |
| `DELETE` | `/c/:campaignId/sessions/:id` | Owner / Co-DM | Cancel and remove scheduled session | `deleteSession()` — Active |
| `POST` | `/c/:campaignId/sessions/:id/rsvp` | Campaign Member | Player submits attendance status (`yes`, `no`) | `rsvpSession()` — Active |
| `POST` | `/c/:campaignId/sessions/:id/poll/vote` | Campaign Member | Vote on proposed session meeting dates | `voteSessionPoll()` — Active |
| `POST` | `/c/:campaignId/sessions/:id/poll/confirm` | Owner / Co-DM | Lock in winning poll date as confirmed time | `confirmSessionPoll()` — Active |
| `POST` | `/c/:campaignId/sessions/:id/attendance` | Owner / Co-DM | Verify and commit attendee record | `recordSessionAttendance()` — Active |
| `POST` | `/c/:campaignId/sessions/:id/close` | Owner / Co-DM | Close session, log recap, and distribute XP | `closeSession()` — Active |
| `GET` | `/c/:campaignId/recaps` | Campaign Member | List session story recaps | `listRecaps()` — Active |
| `GET` | `/c/:campaignId/recaps/latest` | Campaign Member | Fetch most recent published session recap | `getLatestRecap()` — Active |
| `POST` | `/c/:campaignId/recaps` | Owner / Co-DM | Publish new session narrative recap | `createRecap()` — Active |
| `PATCH` | `/c/:campaignId/recaps/:id` | Owner / Co-DM | Edit recap text or linked quest IDs | `updateRecap()` — Active |
| `DELETE` | `/c/:campaignId/recaps/:id` | Owner / Co-DM | Delete session recap | `deleteRecap()` — Active |
| `GET` | `/c/:campaignId/highlights` | Campaign Member | List memorable session quotes & highlights | `listHighlights()` — Active |
| `POST` | `/c/:campaignId/highlights` | Campaign Member | Post new session highlight | `createHighlight()` — Active |
| `DELETE` | `/c/:campaignId/highlights/:id` | Owner / Co-DM | Remove session highlight | `deleteHighlight()` — Active |
| `GET` | `/c/:campaignId/handouts` | Campaign Member | List handouts (filtered by player visibility) | `listHandouts()` — Active |
| `GET` | `/c/:campaignId/handouts/:id` | Campaign Member | View handout document or map details | `getHandout()` — Active |
| `POST` | `/c/:campaignId/handouts` | Owner / Co-DM | Create text/image/map handout | `createHandout()` — Active |
| `PATCH` | `/c/:campaignId/handouts/:id` | Owner / Co-DM | Update handout contents or recipients | `updateHandout()` — Active |
| `DELETE` | `/c/:campaignId/handouts/:id` | Owner / Co-DM | Delete handout and associated map pins | `deleteHandout()` — Active |
| `POST` | `/c/:campaignId/handouts/:id/reveal` | Owner / Co-DM | Reveal handout to party or specific users | `revealHandout()` — Active |
| `POST` | `/c/:campaignId/handouts/:id/pins` | Owner / Co-DM | Place tactical pin on interactive map | `addMapPin()` / `createMapPin()` — Active |
| `PATCH` | `/c/:campaignId/handouts/:id/pins/:pId` | Owner / Co-DM | Update map pin coordinates or target link | `updateMapPin()` — Active |
| `DELETE` | `/c/:campaignId/handouts/:id/pins/:pId` | Owner / Co-DM | Delete map pin | `deleteMapPin()` — Active |
| `GET` | `/c/:campaignId/quests` | Campaign Member | List quests (players see active/assigned) | `listQuests()` — Active |
| `GET` | `/c/:campaignId/quests/:id` | Campaign Member | Fetch single quest details and steps | `getQuest()` — Active |
| `POST` | `/c/:campaignId/quests` | Owner / Co-DM | Create campaign quest with objectives | `createQuest()` — Active |
| `PATCH` | `/c/:campaignId/quests/:id` | Owner / Co-DM | Update quest description or objectives | `updateQuest()` — Active |
| `DELETE` | `/c/:campaignId/quests/:id` | Owner / Co-DM | Delete quest | `deleteQuest()` — Active |
| `POST` | `/c/:campaignId/quests/:id/objectives/:oId/toggle` | Member / DM | Toggle completion of quest step | `toggleQuestObjective()` — Active |
| `POST` | `/c/:campaignId/quests/:id/complete` | Owner / Co-DM | Complete quest and grant designated rewards | `completeQuest()` — Active |
| `GET` | `/c/:campaignId/reputation` | Campaign Member | List faction standings and attitudes | `listFactionReputations()` — Active |
| `POST` | `/c/:campaignId/reputation` | Owner / Co-DM | Track new faction reputation | `createFactionReputation()` — Active |
| `PATCH` | `/c/:campaignId/reputation/:id` | Owner / Co-DM | Update faction reputation thresholds | `updateFactionReputation()` — Active |
| `POST` | `/c/:campaignId/reputation/:id/adjust` | Owner / Co-DM | Adjust reputation score with audit log | `adjustFactionReputation()` — Active |
| `DELETE` | `/c/:campaignId/reputation/:id` | Owner / Co-DM | Delete tracked faction | `deleteFactionReputation()` — Active |
| `GET` | `/c/:campaignId/reputation-logs` | Campaign Member | View history of faction reputation changes | `listReputationLogs()` — Active |
| `GET` | `/c/:campaignId/treasury` | Campaign Member | View shared coins, items, and locked state | `getPartyTreasury()` — Active |
| `PATCH` | `/c/:campaignId/treasury/currency` | Campaign Member | Update party copper/silver/gold/platinum | `updatePartyCurrency()` — Active |
| `POST` | `/c/:campaignId/treasury/items` | Campaign Member | Deposit item into party treasury | `addPartyItem()` — Active |
| `PATCH` | `/c/:campaignId/treasury/items/:id` | Campaign Member | Modify quantity or properties of party item | `updatePartyItem()` — Active |
| `DELETE` | `/c/:campaignId/treasury/items/:id` | Campaign Member | Withdraw or remove item from party treasury | `removePartyItem()` — Active |
| `POST` | `/c/:campaignId/treasury/transfer` | Campaign Member | Move item between treasury and character sheet | `transferPartyItem()` — Active |
| `GET` | `/c/:campaignId/treasury/logs` | Campaign Member | Review party treasury transaction log | `listTreasuryLogs()` — Active |
| `GET` | `/c/:campaignId/calendars` | Campaign Member | List custom calendars configured in campaign | `getCampaignCalendars()` — Active |
| `POST` | `/c/:campaignId/calendars` | Owner / Co-DM | Create custom calendar structure | `createCampaignCalendar()` — Active |
| `PUT` | `/c/:campaignId/calendars/:id` | Owner / Co-DM | Update calendar months, festivals, and week | `updateCampaignCalendar()` — Active |
| `DELETE` | `/c/:campaignId/calendars/:id` | Owner / Co-DM | Delete custom calendar definition | `deleteCampaignCalendar()` — Active |
| `GET` | `/c/:campaignId/time` | Campaign Member | Fetch current in-world campaign date & time | `getCampaignTime()` — Active |
| `PUT` | `/c/:campaignId/time` | Owner / Co-DM | Explicitly set campaign date, time, and pace | `setCampaignTime()` — Active |
| `POST` | `/c/:campaignId/time/advance` | Owner / Co-DM | Advance campaign clock by hours/days/months | `advanceCampaignTime()` — Active |
| `GET` | `/calendar-templates` | Authenticated | List predefined calendar templates | `getCalendarTemplates()` — Active |
| `POST` | `/calendar-templates` | Platform Admin | Save new global calendar template | `createCalendarTemplate()` — Active |
| `GET` | `/calendar` | Campaign Member | Legacy single-calendar retrieval | `getCalendar()` — Deprecated / Active |
| `PUT` | `/calendar` | Owner / Co-DM | Legacy single-calendar update | `updateCalendar()` — Deprecated / Active |
| `POST` | `/calendar/advance` | Owner / Co-DM | Legacy single-calendar day advancement | `advanceCalendar()` — Deprecated / Active |
| `GET` | `/endings` | Campaign Member | Retrieve global world ending state | `getEndingState()` — Active |
| `PUT` | `/endings` | Owner / Co-DM | Update world ending meters and truth values | `updateEndingState()` — Active |
| `GET` | `/shanshin-encounters` | Owner / Co-DM | List Shanshin region random encounter table | `listShanshinEncounters()` — Active |
| `GET` | `/library` | Authenticated | Search shared library of monsters, items, spells | `getLibraryItems()` — Active |
| `POST` | `/clone/preview` | Owner / Co-DM | Dry-run preview of content pack clone job | `previewClone()` — Active |
| `POST` | `/clone/run` | Owner / Co-DM | Execute deep copy of content entities into campaign | `runClone()` — Active |
| `GET` | `/clone-jobs` | Owner / Co-DM | List historical clone jobs and undo tokens | `listCloneJobs()` — Active |
| `GET` | `/packs` | Authenticated | List available content packs and templates | `listPacks()` — Active |
| `POST` | `/packs` | Authenticated | Create new content pack definition | `createPack()` — Active |
| `GET` | `/favorites` | Authenticated | List pinned/favorited library items | `listFavorites()` — Active |
| `PUT` | `/favorites` | Authenticated | Toggle favorite status of library entity | `toggleFavorite()` — Active |
| `POST` | `/campaigns/draft` | Authenticated | Initialize draft campaign from template/pack | `createDraftCampaign()` — Active |
| `PATCH` | `/campaigns/:id/wizard` | Campaign Owner | Save multi-step wizard state | `updateWizardState()` — Active |
| `POST` | `/campaigns/:id/launch` | Campaign Owner | Finalize wizard and publish live campaign | `launchCampaign()` — Active |
| `GET` | `/c/:campaignId/factions` | Campaign Member | List world factions associated with campaign | `listFactions()` — Active |
| `POST` | `/c/:campaignId/factions` | Owner / Co-DM | Create campaign faction profile | `createFaction()` — Active |
| `GET` | `/c/:campaignId/docs` | Campaign Member | List campaign handouts and reference docs | `listCampaignDocs()` — Active |
| `POST` | `/c/:campaignId/docs` | Owner / Co-DM | Create campaign documentation entry | `createCampaignDoc()` — Active |
| `GET` | `/lineage-templates` | Authenticated | List available player lineage templates | `listLineageTemplates()` — Active |
| `POST` | `/lineage-templates` | Platform Admin / DM | Create new lineage template | `createLineageTemplate()` — Active |
| `GET` | `/background-templates` | Authenticated | List character background templates | `listBackgroundTemplates()` — Active |
| `POST` | `/background-templates` | Platform Admin / DM | Create new background template | `createBackgroundTemplate()` — Active |
| `GET` | `/class-templates` | Authenticated | List D&D class templates and feature tables | `listClassTemplates()` — Active |
| `POST` | `/class-templates` | Platform Admin / DM | Create custom class template | `createClassTemplate()` — Active |
| `GET` | `/weapon-templates` | Authenticated | List standard weapon statistics | `listWeaponTemplates()` — Active |
| `GET` | `/notifications` | Authenticated | List in-app notifications and event alerts | `listNotifications()` — Active |
| `POST` | `/notifications/:id/read` | Authenticated | Mark notification as read | `markNotificationRead()` — Active |
| `POST` | `/notifications/read-all` | Authenticated | Mark all notifications as read | `markAllNotificationsRead()` — Active |
| `DELETE` | `/notifications/:id` | Authenticated | Dismiss notification | `deleteNotification()` — Active |
| `GET` | `/notifications/preferences` | Authenticated | Retrieve notification category mutes | `getNotificationPreferences()` — Active |
| `PUT` | `/notifications/preferences` | Authenticated | Update notification category preferences | `updateNotificationPreferences()` — Active |
| `POST` | `/push/subscribe` | Authenticated | Register browser Web Push subscription | `subscribePush()` — Active |
| `POST` | `/push/unsubscribe` | Authenticated | Remove Web Push subscription | `unsubscribePush()` — Active |
| `POST` | `/sync/edits` | Authenticated | Batch replay offline edits with version checks | `syncOfflineEdits()` — Active |
| `GET` | `/sync/conflicts` | Authenticated | List unresolved offline edit collisions | `listSyncConflicts()` — Active |
| `POST` | `/sync/conflicts/:id/resolve` | Authenticated | Commit resolution for sync conflict | `resolveSyncConflict()` — Active |
| `GET` | `/account/export` | Authenticated | GDPR export of all user characters & notes | `exportAccountData()` — Active |
| `POST` | `/account/delete` | Authenticated | Permanently delete or anonymize user account | `deleteAccount()` — Active |
| `GET` | `/c/:campaignId/audit-log` | Owner / Co-DM | Fetch campaign-scoped security audit trail | `getCampaignAuditLog()` — Active |
| `GET` | `/admin/users` | Platform Admin | List all registered platform accounts | `getAdminUsers()` — Active |
| `POST` | `/admin/users/:id/toggle-status` | Platform Admin | Enable or disable user account | `toggleAdminUserStatus()` — Active |
| `POST` | `/admin/users/:id/reset-link` | Platform Admin | Generate one-time password reset URL | `generateAdminResetLink()` — Active |
| `POST` | `/admin/users/:id/revoke-sessions`| Platform Admin | Terminate all active sessions for a user | `revokeAdminUserSessions()` — Active |
| `GET` | `/admin/campaigns` | Platform Admin | List all campaigns on the instance | `getAdminCampaigns()` — Active |
| `POST` | `/admin/campaigns/:id/archive` | Platform Admin | Force archive campaign workspace | `archiveAdminCampaign()` — Active |
| `POST` | `/admin/campaigns/:id/restore` | Platform Admin | Restore archived campaign | `restoreAdminCampaign()` — Active |
| `GET` | `/admin/settings` | Platform Admin | Retrieve platform instance configuration | `getInstanceSettings()` — Active |
| `PUT` | `/admin/settings` | Platform Admin | Update instance settings (e.g. registration) | `updateInstanceSettings()` — Active |
| `GET` | `/admin/storage` | Platform Admin | Inspect D1 database table sizes & media counts| `getStorageStats()` — Active |
| `POST` | `/admin/cleanup` | Platform Admin | Scan and purge orphaned media and tokens | `runOrphanCleanup()` — Active |

### 6.1 Unmapped Endpoints & Client-Server Discrepancies
- **Server Routes with No Active UI Caller:**
  - `GET /api/c/:campaignId/xp-awards`: Implemented in `functions/api/[[route]].ts:2862` and mapped to `api.listXpAwards()` (`src/services/api.ts:706`). However, no frontend component currently invokes this endpoint; character XP progression and award logs are surfaced through `character_history_events` and session logs instead.
- **Client Simulator Methods with No Server Route (LocalApi Only):**
  - `LocalApi.switchUser`: Exists exclusively in `src/services/api.ts:250` for AI Studio preview role-switching without credentials. Intentionally omitted from production server endpoints to prevent authentication bypass.
  - `LocalApi.migrateV2`: Data migration helper in `src/services/api.ts:718` to upgrade local schema structures during preview testing.
- **Deprecated Legacy Endpoints Retained for Backwards Compatibility:**
  - `GET /api/calendar`, `PUT /api/calendar`, `POST /api/calendar/advance`: Single-calendar endpoints from early iterations (`migrations/001`); modern UI interacts exclusively with multi-calendar endpoints `/c/:campaignId/calendars` and `/c/:campaignId/time`.
  - `GET /api/endings`, `PUT /api/endings`: Global cosmic endings state; modern campaign pacing is managed via campaign time and private DM session notes.
  - `GET /api/shanshin-encounters`: Legacy static table for the Shanshin world; tactical combat uses dynamic `encounters` and `encounter_participants`.

---

## 7. Data Model Summary

DungeonYar uses Cloudflare D1 (SQLite). The complete relational schema is defined in `schema.sql` and updated through migrations `002` through `020`. Below are all 70 tables grouped by functional domain.

### 7.1 Platform & Identity
1. **`users`**: Platform user accounts (`id`, `email`, `display_name`, `password_hash`, `platform_role`, `status`, `must_change_password`, `created_at`). Legacy column `role` exists for backwards compatibility but is superseded by `platform_role`.
2. **`auth_sessions`**: Active login sessions storing SHA-256 hashed tokens (`token_hash`, `user_id`, `expires_at`, `user_agent`, `client_ip_hash`).
3. **`login_attempts`**: Security tracking for brute-force mitigation (`ip_hash`, `email`, `attempt_count`, `last_attempt_at`, `locked_until`).
4. **`password_resets`**: Single-use password reset tokens generated by admins (`token_hash`, `user_id`, `expires_at`, `used_at`).
5. **`instance_settings`**: Global instance configuration (`registration_mode`, `allow_campaign_creation`, `default_pack_id`, `max_media_bytes_per_user`).
6. **`audit_log`**: Global platform security log (`actor_id`, `action`, `target_type`, `target_id`, `ip_hash`, `details`).

### 7.2 Media & Storage
7. **`media`**: Self-contained SQLite BLOB storage for portraits, handouts, and maps (`id`, `uploader_id`, `campaign_id`, `mime_type`, `size_bytes`, `data_blob`, `width`, `height`).

### 7.3 Multi-Campaign & Membership
8. **`campaigns`**: Individual campaign workspaces (`id`, `name`, `description`, `tone`, `status`, `pack_id`, `owner_id`, `settings` JSON, `wizard_state` JSON, `version`).
9. **`campaign_members`**: Campaign membership and RBAC role (`campaign_id`, `user_id`, `role` enum: `owner`, `co_dm`, `player`, `spectator`, `status`).
10. **`campaign_invites`**: Campaign-scoped invite codes (`id`, `campaign_id`, `code`, `role`, `expires_at`, `max_uses`, `used_count`, `assign_participation_id`).
11. **`invites`**: Legacy platform-level invite codes (`id`, `code`, `creator_id`, `label`, `expires_at`, `max_uses`, `used_count`, `assign_character_id`).

### 7.4 Characters, Participations & Progression
12. **`characters`**: Master character records containing shared identity, appearance, and base backstory (`id`, `user_id`, `name`, `portrait_url`, `race`, `backstory` JSON, `status`).
13. **`character_participations`**: Campaign-specific gameplay states (`id`, `character_id`, `campaign_id`, `user_id`, `class_name`, `level`, `xp`, `hp_current`, `hp_max`, `hp_temp`, `ability_scores` JSON, `inventory` JSON, `spells` JSON, `features` JSON, `status`, `revision`).
14. **`participation_snapshots`**: Automated backup snapshots taken before major state changes like level-ups (`id`, `participation_id`, `campaign_id`, `level`, `data` JSON, `reason`).
15. **`xp_awards`**: History of granted experience points (`id`, `campaign_id`, `participation_id`, `amount`, `reason`, `awarded_by`).
16. **`sheet_change_requests`**: Player requests to edit locked sheet fields (`id`, `campaign_id`, `participation_id`, `user_id`, `field_group`, `requested_changes`, `status`, `review_comment`).
17. **`change_requests`**: Redundant change request table; retained for schema compatibility.
18. **`edit_grants`**: Time-limited or use-limited permissions granted to players to modify locked fields (`id`, `campaign_id`, `participation_id`, `scope`, `preset`, `fields` JSON, `expires_at`, `uses_left`).
19. **`character_revisions`**: Snapshots of character backstory over time (`id`, `character_id`, `user_id`, `backstory` JSON, `summary`).
20. **`backstory_comments`**: DM and player commentary on specific backstory paragraphs (`id`, `character_id`, `section_id`, `author_id`, `body`, `resolved`).
21. **`character_history_events`**: Chronological milestone log for characters across campaigns (`id`, `character_id`, `campaign_id`, `event_type`, `title`, `description`, `timestamp`).

### 7.5 Rules, Library & Content Packs
22. **`content_packs`**: Reusable modules containing templates, items, and NPCs (`id`, `name`, `description`, `kind`, `visibility`, `creator_id`, `tags` JSON).
23. **`rule_sets`**: Configurable game system rules (`scope_type`, `scope_id`, `abilities` JSON, `skills` JSON, `currencies` JSON, `conditions` JSON).
24. **`lineage_templates`**: Race and lineage templates (`id`, `scope_type`, `scope_id`, `name`, `speed`, `size`, `traits` JSON).
25. **`background_templates`**: Background templates (`id`, `scope_type`, `scope_id`, `name`, `skill_proficiencies` JSON, `tool_proficiencies` JSON, `equipment` JSON).
26. **`class_templates`**: Class definitions (`id`, `scope_type`, `scope_id`, `name`, `hit_die`, `features_by_level` JSON, `spellcasting` JSON).
27. **`feature_templates`**: Reusable feats and class abilities (`id`, `scope_type`, `scope_id`, `name`, `description`, `action_type`).
28. **`weapon_templates`**: Baseline weapons library (`id`, `name`, `category`, `damage_dice`, `damage_type`, `properties` JSON).
29. **`items`**: Catalog of items and equipment (`id`, `scope_type`, `scope_id`, `name`, `category`, `rarity`, `description`, `weight`, `cost`).
30. **`rewards`**: Pre-packaged loot bundles (`id`, `name`, `description`, `items` JSON, `xp`, `copper`, `silver`, `gold`, `platinum`).
31. **`favorites`**: User-pinned library items for quick reference (`user_id`, `entity_type`, `entity_id`).
32. **`clone_jobs`**: Tracking table for pack imports and campaign copying (`id`, `user_id`, `source_type`, `source_id`, `target_type`, `target_id`, `manifest` JSON, `undo_token`).

### 7.6 Encounters & Combat
33. **`encounters`**: Live combat encounters (`id`, `campaign_id`, `name`, `status`, `round`, `turn_index`, `location_id`, `settings` JSON, `dm_notes`).
34. **`encounter_participants`**: Combatants in an encounter (`id`, `encounter_id`, `participant_id`, `name`, `kind`, `initiative`, `hp_current`, `hp_max`, `ac`, `visibility`, `conditions` JSON).
35. **`encounter_events`**: Turn-by-turn combat log (`id`, `encounter_id`, `round`, `turn`, `event_type`, `text`, `visible_to_players`).
36. **`dice_rolls`**: Shared campaign table dice rolls feed (`id`, `campaign_id`, `sender_id`, `participation_id`, `label`, `formula`, `results` JSON, `total`, `visibility`).
37. **`shanshin_encounters`**: Legacy random encounter table for the Shanshin region (`id`, `roll_min`, `roll_max`, `title`, `description`, `threat_level`).

### 7.7 World, Lore & Factions
38. **`npcs`**: Non-player character stat blocks and narrative notes (`id`, `scope_type`, `scope_id`, `name`, `kind`, `hp_max`, `ac`, `stats` JSON, `is_revealed`, `dm_notes`).
39. **`locations`**: Atlas coordinates and regional notes (`id`, `scope_type`, `scope_id`, `name`, `region`, `description`, `coordinates` JSON, `is_revealed`).
40. **`factions`**: Political organizations and guilds (`id`, `campaign_id`, `name`, `description`, `leader_npc_id`, `is_revealed`).
41. **`faction_reputation`**: Reputation scores between party and factions (`id`, `campaign_id`, `faction_id`, `score`, `tier`, `notes`).
42. **`reputation_log`**: History of faction score adjustments (`id`, `campaign_id`, `reputation_id`, `delta`, `reason`, `author_id`).
43. **`campaign_notes`**: Private DM session notes and plot outlines (`id`, `campaign_id`, `title`, `category`, `content`, `tags` JSON).
44. **`codex_docs`**: In-world lore articles and rules references (`id`, `campaign_id`, `title`, `category`, `content_markdown`, `is_revealed`).
45. **`campaign_docs`**: Auxiliary documentation entries (`id`, `campaign_id`, `title`, `kind`, `content`, `is_revealed`).
46. **`campaign_endings`**: Legacy table tracking cosmic meters and world triggers (`id`, `truths` JSON, `aryaman` JSON, `chaos` JSON).

### 7.8 Calendar & Time
47. **`calendars`**: Custom multi-calendar definitions per campaign (`id`, `campaign_id`, `name`, `is_primary`, `data` JSON).
48. **`calendar_states`**: Active date progress for calendars (`id`, `campaign_id`, `calendar_id`, `current_year`, `current_month`, `current_day`, `epoch_day`).
49. **`campaign_time`**: In-world campaign clock (`campaign_id`, `epoch_seconds`, `time_of_day`, `is_running`, `pace`).
50. **`campaign_calendar`**: Legacy single-calendar storage (`id`, `current_day`, `current_month`, `current_year`, `events` JSON).

### 7.9 Sessions, Quests & Treasury
51. **`sessions`**: Scheduled game sessions and polls (`id`, `campaign_id`, `number`, `title`, `scheduled_at`, `duration_minutes`, `status`, `poll` JSON, `dm_notes`).
52. **`session_rsvps`**: Player attendance commitments (`id`, `session_id`, `user_id`, `participation_id`, `choice`, `note`).
53. **`session_polls`**: Availability polling options (`id`, `session_id`, `starts_at`, `status`).
54. **`session_poll_votes`**: Votes on session dates (`id`, `session_id`, `option_id`, `user_id`, `choice`).
55. **`session_attendance`**: Official attendance records (`id`, `session_id`, `participation_id`, `attended`).
56. **`session_recaps`**: Narrative recaps (`id`, `campaign_id`, `session_id`, `title`, `body`, `visibility`, `status`).
57. **`session_highlights`**: Memorable moments and quotes (`id`, `campaign_id`, `session_id`, `quote`, `character_id`, `author_id`).
58. **`handouts`**: Text, image, or map handouts (`id`, `campaign_id`, `title`, `kind`, `media_id`, `content_text`, `visibility`, `dm_notes`).
59. **`handout_recipients`**: Specific players granted access to selective handouts (`handout_id`, `user_id`).
60. **`map_pins`**: Interactive pins placed on map handouts (`id`, `handout_id`, `label`, `x`, `y`, `color`, `target_type`, `target_id`, `is_revealed`).
61. **`quests`**: Campaign quests and objectives (`id`, `campaign_id`, `title`, `status`, `description`, `objectives` JSON, `rewards` JSON, `is_revealed`).
62. **`quest_participants`**: Characters assigned to a quest (`quest_id`, `participation_id`).
63. **`party_currency`**: Shared party money pouch (`campaign_id`, `copper`, `silver`, `gold`, `platinum`, `revision`).
64. **`party_items`**: Shared group inventory items (`id`, `campaign_id`, `name`, `category`, `quantity`, `weight`, `notes`, `revision`).
65. **`treasury_log`**: Audit log for party currency and loot transactions (`id`, `campaign_id`, `action`, `details` JSON, `actor_id`).

### 7.10 Offline, Notifications & Sync
66. **`notifications`**: In-app notifications (`id`, `user_id`, `campaign_id`, `type`, `title`, `body`, `read_at`, `data` JSON).
67. **`notification_prefs`**: User preferences for notification delivery (`user_id`, `campaign_id`, `muted_types` JSON, `push_enabled`).
68. **`push_subscriptions`**: Web Push API endpoint records (`id`, `user_id`, `endpoint`, `keys` JSON, `user_agent`).
69. **`sync_conflicts`**: Collisions detected during offline edit reconciliation (`id`, `user_id`, `campaign_id`, `entity_type`, `entity_id`, `field_name`, `client_value` JSON, `server_value` JSON, `status`).
70. **`notes`**: Player-authored personal notes (`id`, `character_id`, `user_id`, `title`, `category`, `body`).
### 7.11 Legacy & Deprecated Tables
The following tables in `schema.sql` represent early structural designs that have been superseded by modern campaign-scoped tables. They remain in the database schema for backwards compatibility but should be safely retired in a future migration:
1. **`campaign_calendar`**: Replaced by the multi-calendar architecture (`calendars`, `calendar_states`, and `campaign_time`).
2. **`campaign_endings`**: Replaced by campaign-scoped calendar epochs and private DM notes.
3. **`shanshin_encounters`**: Static random encounter table from early Zorvania prototypes; superseded by dynamic campaign `encounters` and `encounter_participants`.
4. **`change_requests`**: Redundant table structure in `schema.sql:1248`; the active implementation utilizes `sheet_change_requests` (`schema.sql:1205`).

---

## 8. Feature Index Table

The table below catalogs all 106 functional features across the DungeonYar platform with standardized identifiers, English names, Persian UI labels, functional domains, implementation statuses, and permitted roles.

| Feature ID | Feature Name | Persian Label | Domain | Status | Permitted Roles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | User Registration with Invite Code | ثبت‌نام کاربر با کد دعوت | Domain 1: Accounts & Platform | Complete | Public (Invite required by default) |
| **AUTH-02** | Password-Based User Login | ورود با نام کاربری و گذرواژه | Domain 1: Accounts & Platform | Complete | Public |
| **AUTH-03** | Session Management & Single Logout | خروج از حساب کاربری | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **AUTH-04** | Revoke All Active Sessions | خروج از تمام دستگاه‌ها و نشست‌های فعال | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **AUTH-05** | Authenticated User Profile & Identity | احراز هویت و مشخصات حساب کاربری | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **AUTH-06** | Single-Use Password Reset | بازیابی گذرواژه با توکن یک‌بارمصرف | Domain 1: Accounts & Platform | Complete | Public (Token required) |
| **AUTH-07** | Platform User Administration | مدیریت حساب‌های کاربری پلتفرم | Domain 1: Accounts & Platform | Complete | Platform Admin |
| **AUTH-08** | Admin Session Revocation & Reset Link | تولید لینک بازیابی و ابطال نشست‌ها توسط مدیر | Domain 1: Accounts & Platform | Complete | Platform Admin |
| **AUTH-09** | Platform Campaign Workspace Admin | مدیریت و بایگانی کمپین‌های پلتفرم | Domain 1: Accounts & Platform | Complete | Platform Admin |
| **AUTH-10** | Instance Settings Configuration | تنظیمات سرور و پلتفرم دانجن‌یار | Domain 1: Accounts & Platform | Complete | Platform Admin |
| **AUTH-11** | Storage & Media Orphan Purge | پایش فضای ذخیره‌سازی و پاکسازی فایل‌های بدون استفاده | Domain 1: Accounts & Platform | Complete | Platform Admin |
| **PREF-01** | User Profile & Display Name Editor | ویرایش نمایه و نام نمایشی کاربر | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **PREF-02** | Password Change & Mandatory Reset Flow | تغییر گذرواژه و الزام تغییر پس از ریست | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **PREF-03** | GDPR Account Data Export & Self-Deletion | دریافت خروجی داده‌ها و حذف حساب کاربری | Domain 1: Accounts & Platform | Complete | Authenticated Users |
| **CAMP-01** | Multi-Step Campaign Setup Wizard | ویزارد ۸ مرحله‌ای راه‌اندازی کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **CAMP-02** | Campaign Profile & Settings Editor | تنظیمات و مشخصات عمومی کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **CAMP-03** | Campaign Membership & Role Assignment | مدیریت اعضا و تعیین نقش‌های کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **CAMP-04** | Campaign Ownership Transfer | واگذاری مالکیت کمپین | Domain 2: Campaign Setup | Complete | Campaign Owner |
| **CAMP-05** | Campaign-Scoped Invite Codes | تولید و مدیریت کدهای دعوت اختصاصی کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **CAMP-06** | Join Campaign via Invite Code | پیوستن به کمپین با کد دعوت | Domain 2: Campaign Setup | Complete | Authenticated Users |
| **CAMP-07** | Campaign Approvals Center | مرکز بررسی و تأیید درخواست‌های کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **CAMP-08** | Campaign Switcher & Multi-Campaign Nav | جابجایی بین کمپین‌ها و انتخاب کمپین فعال | Domain 2: Campaign Setup | Complete | Campaign Members |
| **CAMP-09** | Quick Campaign Creation | ایجاد سریع کمپین جدید | Domain 2: Campaign Setup | Complete | Authenticated (`platform:create_campaign`) |
| **CAMP-10** | Campaign Security Audit Log | گزارش و لاگ امنیتی رویدادهای کمپین | Domain 2: Campaign Setup | Complete | Owner / Co-DM |
| **HOME-01** | Player Hub & Personal Home Dashboard | داشبورد اصلی و میز کار بازیکن | Domain 2: Campaign Setup | Complete | Authenticated Users |
| **NOTIF-01** | Notifications Drawer & Event Center | کشو و فهرست رویدادها و اعلان‌ها | Domain 2: Campaign Setup | Complete | Authenticated Users |
| **NOTIF-02** | Granular Notification Preferences | تنظیمات دسته‌بندی اعلان‌ها | Domain 2: Campaign Setup | Complete | Authenticated Users |
| **NOTIF-03** | Web Push Notification Subscription | اشتراک اعلان‌های وب و مرورگر | Domain 2: Campaign Setup | Complete | Authenticated Users |
| **CHAR-01** | Master Character Creation Wizard | ویزارد گام‌به‌گام ساخت شخصیت اصلی | Domain 3: Character Creation | Complete | Authenticated Users |
| **CHAR-02** | Master Character Hub & Multi-Campaign | میز کار شخصیت اصلی و حضور در چند کمپین | Domain 3: Character Creation | Complete | Authenticated Users |
| **CHAR-03** | Profile & Portrait Management | مدیریت پروفایل و تصویر پرتره کاراکتر | Domain 3: Character Creation | Complete | Character Owner |
| **CHAR-04** | Character Status Management | مدیریت وضعیت حیات شخصیت | Domain 3: Character Creation | Complete | Character Owner |
| **CHAR-05** | Cross-Campaign Timeline & History Ledger | خط زمانی وقایع و تاریخچه شخصیت | Domain 3: Character Creation | Complete | Authenticated Users / DM |
| **CHAR-06** | Backstory Modular Editor & Section Privacy | ویرایشگر بخش‌بندی‌شده‌ی پیشینه داستانی | Domain 3: Character Creation | Complete | Character Owner |
| **CHAR-07** | Backstory Snapshot Versioning & Rollback | تاریخچه نسخه‌ها و بازگردانی پیشینه داستانی | Domain 3: Character Creation | Complete | Character Owner |
| **CHAR-08** | Backstory DM Review & Feedback Workflow | ارسال پیشینه برای بررسی و تایید دانجن مستر | Domain 3: Character Creation | Complete | Character Owner / DM |
| **CHAR-09** | Inline Backstory Paragraph Commentary | ثبت دیدگاه و بازخورد روی پیشینه داستانی | Domain 3: Character Creation | Complete | Owner / Co-DM / Player |
| **CHAR-10** | Campaign Participation & Status Flow | ثبت و مدیریت حضور شخصیت در کمپین | Domain 3: Character Creation | Complete | Campaign Members |
| **CHAR-11** | Participation Approval & Change Requests | بررسی، رد یا درخواست اصلاح ورود به کمپین | Domain 3: Character Creation | Complete | Owner / Co-DM |
| **CHAR-12** | Automated Level-Up Progression Wizard | ویزارد ارتقای سطح و انتخاب ویژگی‌ها | Domain 3: Character Creation | Complete | Player / DM |
| **CHAR-13** | Milestone vs XP-Based Level-Up Triggers | تنظیم شیوه ارتقای سطح: مایلیستون یا امتیاز تجربه | Domain 3: Character Creation | Complete | Owner / Co-DM |
| **CHAR-14** | Level-Up Pre-Snapshot & Rollback | ثبت نسخه پشتیبان خودکار و واگرد ارتقای سطح | Domain 3: Character Creation | Complete | Owner / Co-DM / Player |
| **CHAR-15** | Direct DM Stat & Progression Override | اعمال مستقیم تغییرات توسط DM و ثبت در تاریخچه | Domain 3: Character Creation | Complete | Owner / Co-DM |
| **CHAR-16** | Temporary Respec Window | باز کردن موقت قفل برگه برای اصلاحات ساختار | Domain 3: Character Creation | Complete | Owner / Co-DM |
| **CHAR-17** | Locked Fields & Sheet Change Request Flow | قفل فیلدهای حساس و ثبت درخواست تغییر توسط بازیکن | Domain 3: Character Creation | Complete | Player / DM |
| **CHAR-18** | Granular Time-Limited Edit Grants | مجوزهای موقت و زمان‌دار ویرایش فیلدهای قفل | Domain 3: Character Creation | Complete | Owner / Co-DM |
| **CHAR-19** | Personal Player Notes Notebook | دفترچه یادداشت‌های شخصی و محرمانه بازیکن | Domain 3: Character Creation | Complete | Character Owner |
| **SHEET-01** | Dynamic Combat & Vitals Tab | برگه مبارزه، سلامت و ویژگی‌های تاکتیکی | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-02** | Health, Temp HP & Hit Dice Tracker | سامانه مدیریت جان، جان موقت و تاس‌های جان | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-03** | Death Saving Throws Modal & Counter | نجات از مرگ و شمارنده پرتاب‌های مرگ | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-04** | Rest Execution: Short & Long Rests | موتور استراحت کوتاه و طولانی و بازیابی منابع | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-05** | D&D 5e Conditions & Exhaustion Engine | مدیریت شرایط، ناتوانی‌ها و سطوح خستگی | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-06** | Weapons, Attacks & Spell Attack Rollers | تجهیز سلاح، پرتاب خودکار حمله و محاسبه آسیب | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-07** | Spellbook & Spell Slot Tracker | کتاب جادو، اسلات‌های جادو و مصرف منابع | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-08** | Inventory, Wealth & Encumbrance Manager | کوله پشتی، مدیریت بار و محاسبه خودکار وزن | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-09** | Ability Scores, Modifiers & Saving Throws | امتیازهای توانایی، اصلاح‌کننده‌ها و پرتاب‌های نجات | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-10** | Skills Proficiency & Passive Perception | فهرست مهارت‌ها، مهارت‌های تخصص و ادراک غیرفعال | Domain 4: Character Sheet | Complete | Player / DM |
| **SHEET-11** | Custom Resources & Feature Charges | شمارنده منابع اختصاصی و قابلیت‌های محدود | Domain 4: Character Sheet | Complete | Player / DM |
| **DICE-01** | Interactive Dice Roller Modal | پرتابگر تعاملی و سه‌بعدی تاس‌ها | Domain 5: Collaborative Dice | Complete | Campaign Members |
| **DICE-02** | Live Shared Campaign Dice Feed | تابلوی زنده و برخط پرتاب‌های تاس کمپین | Domain 5: Collaborative Dice | Complete | Campaign Members |
| **DICE-03** | Secret DM Dice Rolls | پرتاب‌های کاملاً محرمانه دانجن مستر | Domain 5: Collaborative Dice | Complete | Owner / Co-DM |
| **DICE-04** | Advantage, Disadvantage & Critical Strike | محاسبه خودکار برتری، نقص و ضربات بحرانی | Domain 5: Collaborative Dice | Complete | Campaign Members |
| **DICE-05** | Custom Dice Formulas & Math Parser | فرمول‌ساز پیشرفته و پرتاب‌های چندتاسی | Domain 5: Collaborative Dice | Complete | Campaign Members |
| **ENC-01** | DM Tactical Encounter Runner | سامانه زنده و تاکتیکی مدیریت نبرد دانجن مستر | Domain 6: Encounters | Complete | Owner / Co-DM |
| **ENC-02** | Automated Initiative Roller & Turn Manager| ترتیب نوبت و پرتاب خودکار ابتکار عمل | Domain 6: Encounters | Complete | Owner / Co-DM |
| **ENC-03** | Live HP, Temp HP & Condition Tracking | کنترل زنده جان، جان موقت و وضعیت مبارزان | Domain 6: Encounters | Complete | Owner / Co-DM |
| **ENC-04** | Combatant Visibility & Stealth Toggle | کنترل آشکارسازی و پنهان‌سازی مبارزان | Domain 6: Encounters | Complete | Owner / Co-DM |
| **ENC-05** | Player Live Encounter View | نمای زنده و تعاملی نبرد برای بازیکنان | Domain 6: Encounters | Complete | Campaign Members |
| **ENC-06** | Combat Event Log & Round Tracker | لاگ زنده وقایع و شمارش راندهای مبارزه | Domain 6: Encounters | Complete | Campaign Members |
| **ENC-07** | Encounter Quick-Add NPCs & Monsters | افزودن سریع دشمنان و کاراکترها به مبارزه | Domain 6: Encounters | Complete | Owner / Co-DM |
| **ENC-08** | Encounter Finalization & XP/Loot Reward | پایان مبارزه و توزیع خودکار غنایم و تجربه | Domain 6: Encounters | Complete | Owner / Co-DM |
| **DM-01** | DM Campaign Master Dashboard | داشبورد جامع نظارت و فرماندهی دانجن مستر | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **DM-02** | NPC & Monster Vault | بانک جامع کاراکترهای غیربازیکن و هیولاها | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **DM-03** | Magical Items & Equipment Vault | خزانه‌ی اشیا، سلاح‌ها و تجهیزات جادویی | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **DM-04** | World Atlas & Regional Locations | اطلس جغرافیایی و موقعیت‌های مکانی جهان | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **DM-05** | Lineage & Species Template Editor | ویرایشگر نژادها و الگوهای تبار | Domain 7: DM & World Content | Complete | Platform Admin / DM |
| **DM-06** | Character Background Template Editor | ویرایشگر پیشینه‌ها و مهارت‌های آغازین | Domain 7: DM & World Content | Complete | Platform Admin / DM |
| **DM-07** | Class Template & Feature Progression | ویرایشگر کلاس‌ها، تاس‌های جان و جدول ویژگی‌ها | Domain 7: DM & World Content | Complete | Platform Admin / DM |
| **DM-08** | DM Private Notes & Plot Outline | یادداشت‌های محرمانه و طرح داستانی دانجن مستر | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **DM-09** | Campaign World Codex & Rules Reference | دانشنامه‌ی جهان و مرجع قوانین بازی | Domain 7: DM & World Content | Complete | Campaign Members |
| **DM-10** | Content Pack Cloning & Reusability | موتور کپی‌برداری عمیق و انتقال محتوا بین کمپین‌ها | Domain 7: DM & World Content | Complete | Owner / Co-DM |
| **SESS-01** | Session Scheduling & Calendar Countdown | زمان‌بندی جلسات و شمارش معکوس رویدادها | Domain 8: Sessions & Calendar | Complete | Owner / Co-DM |
| **SESS-02** | Player Session RSVP & Commitments | اعلام حضور و ثبت پاسخ بازیکنان به زمان جلسه | Domain 8: Sessions & Calendar | Complete | Campaign Members |
| **SESS-03** | Session Scheduling Date Polls | نظرسنجی تاریخ‌های پیشنهادی برای تشکیل جلسه | Domain 8: Sessions & Calendar | Complete | Campaign Members |
| **SESS-04** | Official Session Attendance Tracker | ثبت رسمی حضور و غیاب بازیکنان در جلسه | Domain 8: Sessions & Calendar | Complete | Owner / Co-DM |
| **SESS-05** | Narrative Session Recaps Archive | آرشیو خلاصه‌ی جلسات و وقایع داستانی | Domain 8: Sessions & Calendar | Complete | Campaign Members |
| **SESS-06** | Memorable Highlights & Quotes | ثبت نقل‌قول‌های ماندگار و لحظات برگزیده جلسه | Domain 8: Sessions & Calendar | Complete | Campaign Members |
| **SESS-07** | Structured Session Closing & Rewards Flow | ویزارد بستن جلسه و اعطای خودکار پاداش‌ها | Domain 8: Sessions & Calendar | Complete | Owner / Co-DM |
| **SESS-08** | In-World Campaign Clock & Time Advancement| ساعت درون‌جهانی و پیشروی پیوسته‌ی زمان | Domain 8: Sessions & Calendar | Complete | Owner / Co-DM |
| **SESS-09** | Multi-Calendar with Intercalary Off-Days | سامانه تقویم‌های چندگانه با روزهای برون‌گاه | Domain 8: Sessions & Calendar | Complete | Campaign Members / DM |
| **HAND-01** | Multimedia Handouts Vault | خزانه دست‌نوشته‌ها، اسناد و نامه‌های چندرسانه‌ای | Domain 9: Handouts & Cartography | Complete | Campaign Members / DM |
| **HAND-02** | Granular Handout Revelation & Access | کنترل دقیق دسترسی و آشکارسازی اسناد | Domain 9: Handouts & Cartography | Complete | Owner / Co-DM |
| **HAND-03** | Interactive Map Viewer & Zoom Canvas | نمایشگر تعاملی نقشه‌های جغرافیایی با بزرگنمایی | Domain 9: Handouts & Cartography | Complete | Campaign Members |
| **HAND-04** | Map Pins & Deep Entity Links | نشانه‌گذاری تعاملی نقشه و اتصال به مکان‌ها | Domain 9: Handouts & Cartography | Complete | Campaign Members / DM |
| **QST-01** | Quest Log & Objective Checklist | دفترچه کوئست‌ها، مأموریت‌ها و اهداف مرحله‌ای | Domain 10: Quests & Treasury | Complete | Campaign Members |
| **QST-02** | Quest Rewards Specification | تعیین غنایم، سکه‌ها و امتیاز تجربه برای کوئست | Domain 10: Quests & Treasury | Complete | Owner / Co-DM |
| **QST-03** | Quest Visibility & Party Assignment | آشکارسازی کوئست و انتصاب اعضای گروه | Domain 10: Quests & Treasury | Complete | Owner / Co-DM |
| **TRZ-01** | Shared Party Currency Pouch | کیسه پول و صندوق مشترک ارزی گروه | Domain 10: Quests & Treasury | Complete | Campaign Members |
| **TRZ-02** | Shared Group Inventory & Loot Locker | صندوق تجهیزات، غنایم و اشیای اشتراکی گروه | Domain 10: Quests & Treasury | Complete | Campaign Members |
| **TRZ-03** | Treasury Audit Log & Transfers | لاگ ثبت تراکنش‌های صندوق و انتقال به برگه | Domain 10: Quests & Treasury | Complete | Campaign Members |
| **REP-01** | Political Factions Registry | ثبت و معرفی جناح‌ها، اصناف و خاندان‌های سیاسی | Domain 10: Quests & Treasury | Complete | Campaign Members / DM |
| **REP-02** | Faction Reputation Tracker & History | شمارنده اعتبار گروه نزد جناح‌ها و لاگ تغییرات | Domain 10: Quests & Treasury | Complete | Campaign Members / DM |
| **SYNC-01** | Offline Queue & Stale-While-Revalidate | صف همگام‌سازی آفلاین و صف ارسال | Domain 11: Cross-Cutting | Complete | Authenticated Players & DMs |
| **SYNC-02** | Revision-Based Conflict Resolution | حل تعارض نسخه‌ها با بررسی تضاد | Domain 11: Cross-Cutting | Complete | Authenticated Players & DMs |
| **THEME-01** | Dark/Light Theme & Design Tokens | پوسته تاریک/روشن و توکن‌های طراحی | Domain 11: Cross-Cutting | Complete | All Users |
| **ACC-01** | Accessibility, Persian RTL & Wake Lock | دسترس‌پذیری، راست‌به‌چپ و روشن ماندن صفحه | Domain 11: Cross-Cutting | Complete | All Users |

---

## 9. Known Gaps & Risks Discovered

During this comprehensive codebase audit, the following technical debts, unmapped routes, and architectural boundaries were identified:

1. **Unqueried Server Endpoint (`GET /api/c/:campaignId/xp-awards`):**
   - *Evidence:* Defined in `functions/api/[[route]].ts:2862` and mirrored in `src/services/api.ts:706` (`api.listXpAwards`).
   - *Issue:* No UI component queries this endpoint. Historical XP awards are instead logged and viewed via `character_history_events` and session recaps.
   - *Impact:* Harmless dormant route, but represents slight API clutter.

2. **Redundant Change Request Table (`change_requests`):**
   - *Evidence:* Table `change_requests` defined in `schema.sql:1248` alongside `sheet_change_requests` (`schema.sql:1205`).
   - *Issue:* All UI and server logic operates on `sheet_change_requests`. The `change_requests` table was created in an earlier migration and remains unreferenced by any route or queries.
   - *Impact:* Wasted database schema footprint; should be dropped in a cleanup migration.

3. **Legacy World Tables with Hardcoded Default Semantics:**
   - *Evidence:* `campaign_calendar` (`schema.sql:845`), `campaign_endings` (`schema.sql:856`), and `shanshin_encounters` (`schema.sql:874`).
   - *Issue:* These tables store global or single-campaign records with static structures, whereas modern features utilize campaign-scoped tables (`calendars`, `calendar_states`, `campaign_time`, `encounters`).
   - *Impact:* Endpoints for these legacy tables still exist in `functions/api/[[route]].ts` and should be deprecated and removed.

4. **Character Print Stylesheet Lacks In-App Mobile Trigger:**
   - *Evidence:* Extensive `@media print` rules exist in `src/index.css:252` optimizing character sheet layout for physical paper printing.
   - *Issue:* There is no dedicated "چاپ برگه" (Print Sheet) button in `SheetHeader.tsx` or `MasterCharacterScreen.tsx`. Mobile users on iOS Safari or Chrome must know to use the native browser share sheet → Print option.
   - *Impact:* Feature is present and complete at the CSS level, but discoverability on mobile devices is low.

5. **LocalApi Role-Switching Simulator Bypass (`LocalApi.switchUser`):**
   - *Evidence:* `LocalApi.switchUser` exists in `src/services/api.ts:250` for AI Studio preview testing without real password authentication.
   - *Issue:* In HttpApi mode (`VITE_API_MODE=http`), switching users requires real credentials and cookie exchanges.
   - *Impact:* The preview environment permits instant role switching that is intentionally impossible on production servers.

---

## 10. Open Questions for Owner

1. **Retirement of Legacy Global Tables:**
   - Would you like a clean migration (`021_drop_legacy_tables.sql`) created to safely drop `campaign_calendar`, `campaign_endings`, `shanshin_encounters`, and the redundant `change_requests` table from Cloudflare D1?
2. **Dedicated Mobile Print Sheet Button:**
   - Should a dedicated "چاپ برگه کاراکتر" (Print Character Sheet) action be added to the character sheet header menu to trigger `window.print()` directly on touch devices?
3. **Historical XP Awards Tab:**
   - Should `GET /api/c/:campaignId/xp-awards` be wired into a dedicated "تاریخچه امتیازهای تجربه" (XP Award History) tab inside `DmDashboard.tsx`, or should the endpoint be deprecated in favor of `character_history_events`?

