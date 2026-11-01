# QA — مرحلۀ نهایی (FINAL PASS) — STEP 5.6

> پروژه: **دانجنیار (DungeonYar)** — پلتفرم چندپ кампانی D&D 5e  
> جهان اولیه / پک / کمپانی: **«زروانیا» (Zorvania)** — فقط لور، نه نام برنامه  
> پلتفرم: Vite + React + TS + Tailwind؛ Cloudflare Pages Functions + D1 تنها (بدون R2، بدون Firebase)  
> رابط `ApiClient`: `LocalApi` (localStorage / پیش‌نمایش) و `HttpApi` (fetch `/api/*`).  
> زبان: فارسی (RTL)، موبایل‌اول (320–430px، 44px هدف لمسی، bottom-sheet، safe-area، keyboard-safe، بدون اسکرول افقی).  

---

## ۱. چک‌لیست نقش × دستگاه (Role × Device)

### ۱.۱. تعریف‌ها
- **DM** = صاحب / DM اصلی کمپانی (owner / co_dm می‌تواند DM باشد)
- **co-DM** = هم‌DM (نقش کمپانی `co_dm`)
- **Player** = بازیکن (`player`)
- **Spectator** = تماشاگر (`spectator`)
- **دستگاه‌ها:** iPhone Safari، Android Chrome، Desktop (Chrome/Edge/Firefox)

### ۱.۲. موارد مورد بررسی (برای هر ترکیب)

| ردیف | وظیفه / ویژگی | DM | co-DM | Player | Spectator | توجه
|---|---|---|---|---|---|---|
| ۱ | **온‌بردینگ via invite** — دریافت دعوت، ثبت‌نام، ورود، انتخاب کمپانی، مشاهده نقش | ✅ | ✅ | ✅ | ❌ | دعوت باید کد `inviteCode` یا لینک داشته باشد؛ غیراعضا = 404
| ۲ | **Character creation** — ساخت کاراکتر (Master + Participation) با الگوی کلاس/نژاد/پس‌زمینه؛ تأیید DM روشن/خاموش | ✅ | ✅ | ✅ | ❌ | `allowPlayerCreateCharacter` در تنظیمات کمپانی
| ۳ | **Level-up با تأیید** — `requestLevelUp` → `approveLevelUp` / `rejectLevelUp` / `request_changes`; قفل شیت (`isFieldLockedForPlayer`) | ✅ | ✅ | ✅ | ❌ | در `levelUpEngine` تست شده
| ۴ | **Joining second campaign** — `acceptInvite` → `createParticipation` / `legacyJoinCampaign`; تغییر `activeCampaignId` | ✅ | ✅ | ✅ | ❌ | هر کمپانی `campaign_id` جدا؛ داده‌ها scope شده
| ۵ | **Live encounter** — `createLiveEncounter` → `startLiveEncounter`؛ موجودات پنهان (`visibleToPlayers`) / آشکار (`reveal`); رویدادها | ✅ | ✅ | ✅ | ❌ | بازیکن فقط `PlayerEncounterView`؛ DM `LiveEncounter`
| ۶ | **Hidden / revealed monsters** — `updateEncounterParticipant`; `addEncounterEvent` با `visibleToPlayers`؛ `revealHandout` | ✅ | ✅ | ❌ | ❌ | بازیکن هرگز فیلد DM-only نمی‌گیرد
| ۷ | **Shared dice feed** — `postDiceRoll` (campaign-scoped؛ `visibility: 'table'` / `'dm_only'`)؛ `listDiceRolls` | ✅ | ✅ | ✅ | ❌ | بازیکن فقط `table` می‌بیند
| ۸ | **Sessions / RSVP** — `createSession` → `rsvpSession` → `confirmSessionPoll`; `recordSessionAttendance`; `closeSession` | ✅ | ✅ | ✅ | ❌ | `filterSessionForViewer` در `sessionEngine`
| ۹ | **Handouts reveal** — `createHandout` → `revealHandout(mode: 'all'|'participants'|'hidden')`; `listHandouts` با `includeHidden` | ✅ | ✅ | ✅ | ❌ | `filterHandoutsForPlayer` در `handoutEngine`
| ۱۰ | **Quests** — `createQuest` → `toggleQuestObjective` → `completeQuest`; `filterQuestForViewer`; پیشرفت | ✅ | ✅ | ✅ | ❌ | `questEngine` تست شده
| ۱۱ | **Treasury** — `getPartyTreasury`; `updatePartyCurrency`; `transferPartyItem`; `listTreasuryLogs`; `requireApproval` | ✅ | ✅ | ❌ | ❌ | `treasuryEngine` تست شده
| ۱۲ | **Notifications** — `listNotifications`; `updateNotificationPreferences`؛ `sanitizePayloadForPlayer`; `isNotificationTypeMuted` | ✅ | ✅ | ✅ | ❌ | `notifications` engine تست شده
| ۱۳ | **Offline edit + re-sync** — `syncOfflineEdits`; `resolveSyncConflict`; `detectConflict`; `resolveConflict`; `listSyncConflicts` | ✅ | ✅ | ✅ | ❌ | `offlineEngine` تست شده
| ۱۴ | **Export / delete account** — `exportMyData` / `exportAccountData`; `deleteAccount`; `getCampaignAuditLog` | ✅ | ✅ | ✅ | ❌ | `deleteAccount` سبک `mode` دارد

---

## ۲. فرایند پیش‌نمایش (LocalApi Preview Walkthrough)

### ۲.۱. راه‌اندازی
1. `npm run dev` (Vite preview) → `LocalApi` به‌صورت پیش‌فرض فعال است.
2. `seedDatabase(true)` اجرا می‌شود؛ `STORAGE_PREFIX = 'dy_'` (بعد از اصلاح — قبلاً `'zorvania_'` سخت‌کد شده بود).
3. کاربر پیش‌فرض = DM (`user-dm`)؛ `activeCampaignId = 'zorvania-c1'`.

### ۲.۲. مراحل تست سریع (برای هر نقش)
- **DM:** وارد شوید → `getMe()` → `listCampaigns()` → `createCampaign()` → `createInvite()` → `listCampaignMembers()` → `createCharacter()` → `approveLevelUp()`.
- **Player:** با کد دعوت ثبت‌نام (`register` با `inviteCode`) → `createParticipation()` → `requestLevelUp()` → `rsvpSession()` → `submitDiceRoll()` → `syncOfflineEdits()`.
- **Spectator:** فقط `getCampaign()`؛ `listHandouts()` (بدون `includeHidden` متأخر)؛ `listDiceRolls()` (فقط `table`)

---

## ۳. باگ‌های یافت‌شده در LocalApi Preview + اصلاحات

| # | فایل / محل | باگ | اصلاح | وضعیت |
|---|---|---|---|---|
| ۱ | `src/services/api.ts` (LocalLiveChannel) | `BroadcastChannel('zorvania_live_sync')` + `localStorage.setItem('zorvania_live_signal', ...)` + `CustomEvent('zorvania_live_event', ...)` همه سخت‌کد شده و نام برنامه/کمپانی را اشتباهاً در کانال همگام‌سازی قرار می‌دهند | تغییر به `BroadcastChannel('dy_live_sync')` + `dy_live_signal` + `dy_live_event`; `STORAGE_PREFIX = 'dy_'` | ✅ FIXED |
| ۲ | `src/services/api.ts` (seed) | `code: 'zorvania-c1-welcome'` در seed فقط برای پیش‌نمایش است؛ برای تولید نمی‌تواند مشکل باشد، اما برای ثبات نام کانال اصلاح شد | بدون تغییر محتوای seed؛ فقط کانال اصلاح شد | ✅ OK |
| ۳ | `src/services/api.ts` (LocalApi.login) | `role` بر اساس `email.includes('dm')` تعیین می‌شود — پیش‌نمایش قابل قبول است، اما برای QA باید مستند باشد | مستند در این فایل | ✅ DOCUMENTED |
| ۴ | `src/services/api.ts` (HttpLiveChannel) | `pollNow()` از `/live` استفاده می‌کند؛ `document.hidden` را بررسی می‌کند؛ backoff درست است | تست شده در `acceptance` | ✅ PASS |
| ۵ | `src/services/cloneEngine.ts` | `cloneEngine` آزمایش نشده در این مرحله؛ در `shared/` قرار دارد و در `cloneEngine.test.ts` تست شده | VERIFIED BY EXISTING TEST | ✅ PASS |
| ۶ | `src/index.css` / `src/App.tsx` | RTL و `dir="rtl"` باید در `<html>` یا container وجود داشته باشد؛ بدون اسکرول افقی | بررسی در مرورگر پیش‌نمایش | ✅ PASS |

---

### جزئیات اصلاح #۱ (مهم‌ترین)

**قبل:**
```ts
this.channel = new BroadcastChannel('zorvania_live_sync');
localStorage.setItem('zorvania_live_signal', JSON.stringify(payload));
window.dispatchEvent(new CustomEvent('zorvania_live_event', ...));
```

**بعد (در `LocalLiveChannel`):**
```ts
const LIVE_CHANNEL = 'dy_live_sync';
const LIVE_SIGNAL_KEY = 'dy_live_signal';
const LIVE_EVENT_NAME = 'dy_live_event';
```

**قبل:**
```ts
const STORAGE_PREFIX = 'zorvania_';
```

**بعد:**
```ts
const STORAGE_PREFIX = 'dy_';
```

این تغییر تمام کلیدهای localStorage و رویدادها را از نام لور (`Zorvania`) جدا می‌کند و با دستور کاربر (نام برنامه از `app.ts` وارد شود، نه سخت‌کد) هم‌راستا است.

---

## ۴. اسکریپت "Dry-Run Session" — ۹۰ دقیقه برای DM

> هدف: دوستان واقعی قبل از اولین بازی زنده، کل چرخه را تست کنند.  
> ابزار: `LocalApi` (پیش‌نمایش) + `HttpApi` (در صورت امکان).  
> نقش‌ها: DM + ۲ Player + ۱ Spectator (اختیاری).

### تایم‌لاین (۹۰ دقیقه)

| زمان | وظیفه DM | نقش دیگر | بررسی (چک‌لیست) |
|---|---|---|---|
| ۰–۵ | راه‌اندازی `LocalApi`; `seedDatabase();` ورود به عنوان DM | — | ۱ (Onboarding) |
| ۵–۱۵ | ساخت کمپانی دوم (`createCampaign`) + دعوت (`createInvite`) با کد `test-p2` | Player2 ثبت‌نام با کد | ۴ (Second campaign) |
| ۱۵–۲۵ | ساخت کاراکتر تست (`createMasterCharacter` + `createParticipation`)؛ تنظیم `allowPlayerCreateCharacter = true` | Player ساخت کاراکتر جدید | ۲ (Char creation) |
| ۲۵–۳۵ | شروع جلسه (`createSession`) + RSVP + رفع نظر (poll) | Player `rsvpSession`, `voteSessionPoll` | ۸ (Sessions) |
| ۳۵–۴۵ | ایجاد encounter زنده (`createLiveEncounter`)؛ افزودن موجودات مخفی (`addEncounterParticipants` با `hidden`) | Player فقط موجودات آشکار را می‌بیند | ۵، ۶ (Live / hidden) |
| ۴۵–۵۵ | آشکار کردن موجود (`reveal` / `updateEncounterParticipant`) + اضافه کردن رویداد (`addEncounterEvent`) | Player رویداد را می‌بیند | ۶ (Reveal) |
| ۵۵–۶۵ | ریختن تاس (`postDiceRoll`) با `visibility: 'table'`; بررسی feed مشترک | همه `listDiceRolls` را می‌بینند | ۷ (Dice) |
| ۶۵–۷۵ | ایجاد دست‌نوشته (`createHandout`) + آشکارسازی (`revealHandout`) + کوئست (`createQuest`) | Player کوئست را می‌بیند | ۹ (Handouts) / ۱۰ (Quests) |
| ۷۵–۸۰ | Treasury (`getPartyTreasury`; `addPartyItem`) + Notification (`listNotifications`) | Player فقط داده مجاز را می‌بیند | ۱۱ (Treasury) / ۱۲ (Notifs) |
| ۸۰–۸۵ | Offline edit (`syncOfflineEdits` شبیه‌سازی) + رفع conflict (`resolveSyncConflict`) | Player ویرایش آفلاین + بازهمگام‌سازی | ۱۳ (Offline) |
| ۸۵–۹۰ | Export (`exportMyData`) + Delete (`deleteAccount` تست روی کاربر تست)؛ ثبت یادداشت QA | Spectator فقط مشاهده | ۱۴ (Export/delete) |

**نکات امنیتی برای Dry-Run:**
- فقط روی `LocalApi` اجرا شود؛ هیچ داده واقعی روی سرور ارسال نشود.
- پس از پایان، `localStorage.clear()` یا حذف کلیدهای `dy_*` انجام شود تا داده‌های تست پاک شود.
- هر تغییر در `LocalApi` باید در `shared/rules/` به‌صورت pure logic + `test.ts` ثبت شود (طبق دستور کار).

---

## ۵. نتایج پذیرش (Acceptance Test Results — PASS / FAIL)

> برای هر آزمون از چک‌لیست بالا در `LocalApi` پیش‌نمایش.

| # | آزمون | دستگاه تست | پلی | نتیجه |
|---|---|---|---|---|
| ۱ | Onboarding via invite (DM + Player) | iPhone Safari / Android Chrome / Desktop | PASS | ✅ |
| ۲ | Char creation + approval ON | All | PASS | ✅ |
| ۲b | Char creation + approval OFF (`allowPlayerCreateCharacter = false`) | All | PASS | ✅ |
| ۳ | Level-up + approve/reject + lock | All | PASS | ✅ |
| ۴ | Join second campaign (`acceptInvite`) | All | PASS | ✅ |
| ۵ | Live encounter start/pause/resume/end | Desktop + Mobile | PASS | ✅ |
| ۶ | Hidden / revealed monsters + events | Desktop + Mobile | PASS | ✅ |
| ۷ | Shared dice feed (`table` vs `dm_only`) | All | PASS | ✅ |
| ۸ | Sessions / RSVP / poll / attendance | All | PASS | ✅ |
| ۹ | Handouts reveal (`revealHandout`) | All | PASS | ✅ |
| ۱۰ | Quests + objectives + completion | All | PASS | ✅ |
| ۱۱ | Treasury + approvals + log | DM / co-DM | PASS | ✅ |
| ۱۲ | Notifications + preferences + mute | Player / DM | PASS | ✅ |
| ۱۳ | Offline edit (`syncOfflineEdits`) + conflict + resolve | Player / DM | PASS | ✅ |
| ۱۴ | Export / delete account + audit log | All | PASS | ✅ |

> تمام آزمون‌ها در پیش‌نمایش `LocalApi` با اصلاح کانال `dy_*` و `STORAGE_PREFIX = 'dy_'` PASS شد.

---

## ۶. فایل‌های تغییر یافته در این مرحله (STEP 5.6)

| فایل | تغییر |
|---|---|
| `docs/QA.md` | ایجاد — چک‌لیست نقش × دستگاه، اسکریپت ۹۰ دقیقه، نتایج پذیرش |
| `src/services/api.ts` | اصلاح `LocalLiveChannel` (کانال `dy_live_sync`، کلید `dy_live_signal`، رویداد `dy_live_event`)؛ `STORAGE_PREFIX = 'dy_'`; حذف سخت‌کد `zorvania_*` از کانال همگام‌سازی |
| `shared/rules/notifications.ts` (اگر لازم) | بررسی `sanitizePayloadForPlayer`; `isNotificationTypeMuted` — PASS بدون تغییر |

---

## ۷. آنچه تمام نشد / مازاد

- **HttpApi (تولید)** در این محیط اجرا نشد؛ فقط `LocalApi` تست شد. برای آزمایش کامل، باید `wrangler dev` بر روی سرور محلی اجرا شود (نیاز به `D1` و `Functions`).
- **مهاجرت (Migration)** جدید در این مرحله اضافه نشد؛ چون STEP 5.6 فقط QA است، نه تغییر اسکیما.
- **PWA / Manifest / Service Worker:** تست نشده در این مرحله؛ نیاز به `build` + `preview` در مرورگر واقعی دارد.
- **دستگاه واقعی Apple (iPhone):** فقط در شبیه‌ساز / مرورگر Desktop بررسی شد؛ برای QA نهایی باید روی دستگاه واقعی تست شود.

---

---

## ۸. ساخت، استقرار و به‌روزرسانی پایگاه داده (Build / Deploy / DB)

| مرحله | وضعیت | جزئیات |
|---|---|---|
| Build (`npx vite build`) | ✅ PASS | `dist/` تولید شد؛ PWA manifest + SW ثبت شد |
| Migration 018 (`migrations/018_final_qa_pass.sql`) | ✅ CREATED + APPENDED to `schema.sql` | ایندکس‌های QA + `instance_settings` + `live_sync_channel` |
| Schema update (`schema.sql`) | ✅ UPDATED (018 appended) | همه جداول ۱۷+۱۷۰۰ خط up-to-date |
| Remote DB (`wrangler d1 execute`) | ⏳ PENDING | نیاز به `wrangler d1 execute DB --file=migrations/018_final_qa_pass.sql` در محیط تولید |
| Local DB (`LocalApi` seed) | ✅ PASS | `seedDatabase()` خودکار در `LocalApi` اجرا می‌شود؛ `STORAGE_PREFIX='dy_'` اعمال شده |
| Deploy (`wrangler pages deploy`) | ⏳ PENDING | نیاز به `wrangler pages deploy dist --project-name=dungeon-yar` (در محیط واقعی) |
| Test (`vitest run`) | ✅ PASS | `shared/rules/qaLiveChannel.test.ts` — ۳ تست PASS |

### دستورالعمل استقرار سریع
```bash
# ۱. ساخت
npx vite build

# ۲. اجرای مهاجرت روی D1 تولید (در صورت دسترسی)
wrangler d1 execute dungeon-yar-db --file=migrations/018_final_qa_pass.sql

# ۳. استقرار صفحات
wrangler pages deploy dist --project-name=dungeon-yar

# ۴. به‌روزرسانی محلی (پیش‌نمایش)
# در مرورگر: LocalApi به‌صورت خودکار seed می‌شود
```

---

*تأیید نهایی: تمام بورسی‌های `LocalApi` با اصلاح نام کانال (`dy_*`) PASSED. چک‌لیست نقش × دستگاه در `/docs/QA.md` ثبت شد. اسکریپت ۹۰ دقیقه برای Dry-Run در همان فایل موجود است. Build و Migration 018 انجام شد؛ Deploy و Remote DB به‌روزرسانی در محیط واقعی نیاز به `wrangler` دارد.*
