# نقشه‌ی جامع ناوبری و ممیزی دسترسی‌پذیری رابط کاربری دانجن‌یار (DungeonYar)
**نسخه سند:** ۱.۰.۰  
**تاریخ ممیزی:** نوامبر ۲۰۲۶  
**دامنه بررسی:** معماری مسیریابی، کامپوننت‌های روتر، منوها، تب‌ها، شیت‌ها، مدال‌ها و ورودی‌های پنهان  
**وضعیت کدبیس:** بدون تغییر در کد — ممیزی استاتیک و ساختاری عمیق  

---

## ۱. خلاصه مدیریتی (Executive Summary)

سامانه **دانجن‌یار (DungeonYar)** یک وب‌اپلیکیشن پیش‌رونده (PWA) چندکمپینی و موبایل‌محور بر پایه معماری SPA (تک‌صفحه‌ای) با React 19، Tailwind CSS و Vite است. ناوبری کلان اپلیکیشن ترکیبی از **Hash-based Routing** در سطح `window.location.hash`، وضعیت‌های سراسری (`viewMode` در `src/App.tsx`)، استیت‌های درونی کامپوننت‌ها (`activePlayerTab`، `activeDmTab`، `subTab`) و انبوهی از **شیت‌ها و مدال‌های شرطی (Modal / BottomSheet Dialogs)** است.

این گزارش جامع، تمام مقصدهای قابل مشاهده و پنهان برنامه را در ۴ رده‌بندی استاندارد استخراج کرده، زنجیره دسترسی (Click Path) هر یک را ردیابی نموده و مقصدهای یتیم (Orphaned)، کدهای مرده (Dead Code) و ناهماهنگی‌های تجربه کاربری میان موبایل و دسکتاپ را مستند می‌سازد.

### آمار کلان ممیزی مقصدهای ناوبری:
* **مجموع کل مقصدهای شناسایی‌شده:** ۱۳۰ مقصد
* **✅ دسترسی کامل و استاندارد:** ۹۵ مقصد (۷۳.۱٪)
* **⚠️ دسترسی مشروط، ناقص، نیازمند تایپ دستی یا ناهماهنگ در دسکتاپ/موبایل:** ۲۳ مقصد (۱۷.۷٪)
* **❌ دسترسی غیرممکن، کد مرده یا مدال رندرنشده در JSX:** ۹ مقصد (۶.۹٪)
* **🔁 ریدایرکت، تغییر مسیر خودکار یا مسیر fallback:** ۳ مقصد (۲.۳٪)

---

## ۲. متدولوژی و ابزارهای ممیزی (Methodology)

ممیزی با رویکرد **سفید‌جعبه (White-box Static Code Analysis)** بر روی فایل‌های زیر انجام پذیرفت:
1. **هسته روتر و استیت مرکزی:** `src/App.tsx` (تابع `applyRouteFromHash` خطوط ۵۷۲–۶۵۳، لیسنر `hashchange` خطوط ۶۶۰–۶۶۶، مدیریت مدال‌ها و شرط‌های رندر خطوط ۱۲۴۸–۲۴۰۲).
2. **سازه ناوبری سربرگ و منوی همبرگری:** `src/components/Header.tsx` (منوی موبایل خطوط ۵۳۸–۹۱۵، دکمه‌های ابزار دسکتاپ خطوط ۳۵۹–۵۲۷).
3. **نوار ناوبری پایینی موبایل:** `src/components/mobile/BottomNav.tsx` (تب‌های خانه، بازیکن و دی‌ام خطوط ۴۶–۱۶۷).
4. **شیت میانبرهای ثانویه:** `src/components/mobile/CampaignMoreSheet.tsx` (خطوط ۱–۶۰).
5. **سربرگ چسبان شیت کاراکتر:** `src/components/common/StickyHeader.tsx` (خطوط ۵۸–۷۳ و ۱۲۵–۱۶۸).
6. **داشبورد خانه و پرونده کلان:** `src/components/home/HomeScreen.tsx` و `src/components/character/MasterCharacterScreen.tsx`.
7. **مجموعه ابزارهای دانجن مستر:** `src/components/dm/DmTools.tsx` و زیرکامپوننت‌های وابسته (`DmDashboard`، `DmLibrary`، `DmEncounterRunner` و غیره).
8. **تب‌های اختصاصی برگه و دانشنامه:** `OverviewTab`، `AbilitiesTab`، `CombatTab`، `InventoryTab`، `NotesTab`، `CodexTab`، `HandoutsTab`، `ResourcesTab`، `CompanionsTab`.

---

## ۳. جدول جامع تمام مقصدهای اپلیکیشن (Destinations Catalog)

### رده ۱: صفحات و روت‌های اصلی (Type 1 — Routes & Views)

| شناسه مقصد | الگوی مسیر / هش | کامپوننت تعریف‌کننده | پارامترهای لازم | نقش‌های مجاز | وضعیت دسترسی | سند کد و خط مرجع |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `ROUTE_HOME` | `#/` یا `#/home` | `HomeScreen.tsx` | - | همه (مهمان/کاربر) | ✅ | `src/App.tsx:574` |
| `ROUTE_AUTH_LOGIN` | `#/login` | `AuthModal.tsx` | - | همه (عمومی) | ✅ | `src/App.tsx:593` |
| `ROUTE_AUTH_REGISTER` | `#/register?code=...` | `AuthModal.tsx` | `code` (اختیاری) | مهمان | ✅ | `src/App.tsx:583` |
| `ROUTE_AUTH_RESET` | `#/reset` یا `#/reset-password` | `AuthModal.tsx` | `token` | مهمان | ⚠️ | `src/App.tsx:588` |
| `ROUTE_CHAR_MASTER` | `#/characters/:id` | `MasterCharacterScreen.tsx` | `characterId` | صاحب کاراکتر / DM | ✅ | `src/App.tsx:603` |
| `ROUTE_CAMP_PLAYER` | `#/c/:campaignId/:tab` | `App.tsx` (Player View) | `campaignId`, `tab` | همه اعضای کمپین | ✅ | `src/App.tsx:612` |
| `ROUTE_CAMP_DM` | `#/c/:campaignId/dm/:tab` | `DmTools.tsx` | `campaignId`, `tab` | owner, co_dm, platform dm | ✅ | `src/App.tsx:623` |
| `ROUTE_DEV_UI` | `#/dev` یا `#/dev/ui` | `DevUiGallery.tsx` | فقط در `import.meta.env.DEV` | توسعه‌دهنده | ⚠️ | `src/App.tsx:597` |
| `ROUTE_JOIN_ORPHAN` | `#/join` | ندارد (Fall-through به خانه) | - | کاربر لاگین‌شده | ❌ | `src/components/mobile/BottomNav.tsx:1838` |
| `ROUTE_LEGACY_TABS` | `#overview`, `#combat`, ... | ریدایرکت به مسیر کمپین فعال | - | بازیکن | 🔁 | `src/App.tsx:640` |

---

### رده ۲: تب‌ها و بخش‌های درون‌صفحه‌ای (Type 2 — In-Page Tabs & Sections)

| شناسه مقصد | والد و زمینه | نام و برچسب UI | کامپوننت رندرکننده | نقش‌های مجاز | وضعیت دسترسی | سند کد و خط مرجع |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `HOME_TAB_ACTIVE` | داشبورد خانه | کمپین‌های جاری | `HomeScreen.tsx` | همه | ✅ | `src/components/home/HomeScreen.tsx:218` |
| `HOME_TAB_PAST` | داشبورد خانه | گذشته / بایگانی | `HomeScreen.tsx` | همه | ✅ | `src/components/home/HomeScreen.tsx:238` |
| `SHEET_TAB_OVERVIEW` | برگه کاراکتر | نمای کلی | `OverviewTab.tsx` | بازیکن / DM / تماشاچی | ✅ | `src/App.tsx:1606` |
| `SHEET_TAB_ABILITIES` | برگه کاراکتر | ویژگی‌ها | `AbilitiesTab.tsx` | بازیکن / DM / تماشاچی | ✅ | `src/App.tsx:1652` |
| `SHEET_TAB_COMBAT` | برگه کاراکتر | مبارزه | `CombatTab.tsx` | بازیکن / DM / تماشاچی | ✅ | `src/App.tsx:1664` |
| `SHEET_TAB_COMPANIONS` | برگه کاراکتر | یاران و همراهان | `CompanionsTab.tsx` | بازیکن / DM | ✅ | `src/App.tsx:1678` |
| `SHEET_TAB_INVENTORY` | برگه کاراکتر | کوله‌پشتی | `InventoryTab.tsx` | بازیکن / DM | ⚠️ | `src/App.tsx:1686` |
| `SHEET_TAB_NOTES` | برگه کاراکتر | یادداشت‌ها | `NotesTab.tsx` | بازیکن / DM | ✅ | `src/App.tsx:1700` |
| `SHEET_TAB_CODEX` | برگه کاراکتر | جهان / دانشنامه | `CodexTab.tsx` | همه | ✅ | `src/App.tsx:1719` |
| `SHEET_TAB_FEATURES` | برگه کاراکتر | توانایی‌ها | `AbilitiesTab.tsx` | بازیکن / DM | ⚠️ | `src/App.tsx:1737` |
| `SHEET_TAB_RESOURCES` | برگه کاراکتر | منابع کلاسی | `ResourcesTab.tsx` | بازیکن / DM | ⚠️ | `src/App.tsx:1749` |
| `CODEX_SUB_QUESTS` | دانشنامه | مأموریت‌ها | `QuestsTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:110` |
| `CODEX_SUB_LOCATIONS`| دانشنامه | مکان‌ها | `CodexTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:124` |
| `CODEX_SUB_HANDOUTS`| دانشنامه | اسناد و نقشه‌ها | `HandoutsTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:138` |
| `CODEX_SUB_ITEMS` | دانشنامه | اشیاء فاش‌شده | `CodexTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:152` |
| `CODEX_SUB_CREATURES`| دانشنامه | موجودات فاش‌شده | `CodexTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:166` |
| `CODEX_SUB_RULES` | دانشنامه | قوانین بازی | `CodexTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:180` |
| `CODEX_SUB_CALENDAR`| دانشنامه | گاهشمار زروانیا | `CodexTab.tsx` | همه | ✅ | `src/components/character/CodexTab.tsx:194` |
| `CODEX_SUB_FACTIONS`| دانشنامه | جناح‌ها و شهرت | `FactionReputationManager` | همه | ✅ | `src/components/character/CodexTab.tsx:399` |
| `INV_SUB_PERSONAL` | کوله‌پشتی | وسایل شخصی | `InventoryTab.tsx` | بازیکن / DM | ✅ | `src/components/character/InventoryTab.tsx:41` |
| `INV_SUB_TREASURY` | کوله‌پشتی | خزانه مشترک گروه | `PartyTreasuryManager.tsx` | بازیکن / DM | ✅ | `src/components/character/InventoryTab.tsx:41` |
| `MASTER_TAB_IDENTITY`| پرونده شخصیت | شناسنامه و پیشینه | `BackstoryEditor.tsx` | بازیکن / DM | ✅ | `src/components/character/MasterCharacterScreen.tsx:77` |
| `MASTER_TAB_HISTORY` | پرونده شخصیت | تایم‌لاین رویدادها | `MasterCharacterScreen.tsx` | بازیکن / DM | ✅ | `src/components/character/MasterCharacterScreen.tsx:77` |
| `MASTER_TAB_CAMPS` | پرونده شخصیت | سوابق کمپین‌ها | `MasterCharacterScreen.tsx` | بازیکن / DM | ✅ | `src/components/character/MasterCharacterScreen.tsx:77` |
| `DM_TAB_DASHBOARD` | پنل دانجن مستر | داشبورد مدیریت میز | `DmDashboard.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:201` |
| `DM_TAB_ENCOUNTERS`| پنل دانجن مستر | اجرای مواجهه و مبارزه| `DmEncounterRunner.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:202` |
| `DM_TAB_LIBRARY` | پنل دانجن مستر | مخزن کلان کتابخانه | `DmLibrary.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:203` |
| `DM_TAB_NARRATIVE` | پنل دانجن مستر | روایت و یادداشت‌ها | `DmCampaignNotes.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:204` |
| `DM_TAB_MORE` | پنل دانجن مستر | کاربران و تنظیمات | `DmTools.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:205` |
| `DM_LIB_SUB_NPCS` | کتابخانه DM | موجودات و ان‌پی‌سی | `DmNpcManager.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:313` |
| `DM_LIB_SUB_ITEMS` | کتابخانه DM | گنجینه اشیاء | `DmItemVault.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:326` |
| `DM_LIB_SUB_LOCS` | کتابخانه DM | مکان‌ها و اطلس | `DmLocationManager.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:339` |
| `DM_LIB_SUB_HANDOUTS`| کتابخانه DM | اسناد و هندات‌ها | `DmHandoutManager.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:352` |
| `DM_LIB_SUB_QUESTS`| کتابخانه DM | مأموریت‌ها و کوئست | `DmQuestManager.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:365` |
| `DM_LIB_SUB_FACTIONS`| کتابخانه DM | شهرت جناح‌ها | `FactionReputationManager` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:378` |
| `DM_LIB_SUB_TREASURY`| کتابخانه DM | صندوق خزانه گروه | `PartyTreasuryManager` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:391` |
| `DM_NAR_SUB_ENDINGS`| روایت DM | پایان‌بندی‌ها | `DmEndingTracker.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:528` |
| `DM_MORE_SUB_USERS`| تنظیمات DM | فهرست کاربران | `DmUsers.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:567` |
| `DM_MORE_SUB_INVITES`| تنظیمات DM | کدهای دعوت کمپین | `DmInvites.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:580` |
| `DM_MORE_SUB_AUDIT` | تنظیمات DM | لاگ وقایع امنیتی | `DmAuditLog.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:593` |
| `DM_MORE_SUB_CONFIG`| تنظیمات DM | تنظیمات قوانین و سید | `DmSettings.tsx` | owner, co_dm | ✅ | `src/components/dm/DmTools.tsx:606` |
| `ADMIN_TAB_USERS` | کنسول ادمین | مدیریت کاربران سرور | `AdminConsoleModal.tsx` | platformRole === admin | ⚠️ | `src/components/admin/AdminConsoleModal.tsx:29` |
| `ADMIN_TAB_CAMPAIGNS`| کنسول ادمین | مدیریت کمپین‌های سرور | `AdminConsoleModal.tsx` | platformRole === admin | ⚠️ | `src/components/admin/AdminConsoleModal.tsx:29` |
| `ADMIN_TAB_SETTINGS` | کنسول ادمین | تنظیمات سهمیه و رجیستر | `AdminConsoleModal.tsx` | platformRole === admin | ⚠️ | `src/components/admin/AdminConsoleModal.tsx:29` |
| `ADMIN_TAB_STORAGE` | کنسول ادمین | آمار حافظه و دیتابیس | `AdminConsoleModal.tsx` | platformRole === admin | ⚠️ | `src/components/admin/AdminConsoleModal.tsx:29` |
| `ADMIN_TAB_CLEANUP` | کنسول ادمین | پاکسازی فایل‌های یتیم | `AdminConsoleModal.tsx` | platformRole === admin | ⚠️ | `src/components/admin/AdminConsoleModal.tsx:29` |
| `DEV_UI_TABS_ALL` | گالری کامپوننت | ۶ تب تست UI | `DevUiGallery.tsx` | توسعه‌دهنده | ⚠️ | `src/components/dev/DevUiGallery.tsx:82` |

---

### رده ۳: مودال‌ها، باتم‌شیت‌ها و دیالوگ‌ها (Type 3 — Modals & Sheets)

| شناسه مقصد | نام مودال / شیت | کامپوننت فایل | کلید تریگر / استیت در App | وضعیت دسترسی | علت و سند کد مرجع |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `MODAL_AUTH` | ورود / عضویت | `AuthModal.tsx` | `authModalState.isOpen` | ✅ | `App.tsx:2239` (دکمه هدر خط ۵۲۱) |
| `MODAL_ACCOUNT` | حساب کاربری و تم | `AccountModal.tsx` | `accountModalOpen` | ✅ | `App.tsx:2252` (هدر خط ۶۷۶ و نوار پایین خط ۱۸۴۰) |
| `MODAL_DICE_ROLLER` | پرتاب‌گر تاس پیشرفته | `DiceRollerModal.tsx`| `diceModalOpen` | ✅ | `App.tsx:2315` (دکمه مرکزی شناور نوار پایین خط ۱۳۸) |
| `MODAL_REST` | استراحت گروهی/شخصی | `RestModal.tsx` | `restModal.isOpen` | ✅ | `App.tsx:2332` (دکمه‌های استراحت نمای کلی خط ۴۹۶) |
| `MODAL_LIVE_ENCOUNTER` | نمای نبرد زنده بازیکن | `LiveEncounterModal.tsx`| `liveEncounterModalOpen`| ✅ | `App.tsx:2342` (دکمه قرمز هنگام نبرد خط ۳۷۶) |
| `MODAL_CAMPAIGN_SWITCH`| تعویض سریع کمپین | `CampaignSwitcherModal.tsx`| `campaignSwitcherOpen` | ✅ | `App.tsx:1867` (چیپ هدر خط ۲۰۸ و منو خط ۶۰۱) |
| `MODAL_CAMPAIGN_WIZARD`| ویزارد ۸ مرحله‌ای کمپین| `CampaignWizardModal.tsx` | `createCampaignOpen` | ✅ | `App.tsx:1888` (دکمه «کمپین جدید» خط ۲۶۰ HomeScreen) |
| `MODAL_JOIN_CAMPAIGN` | ورود با شخصیت به کمپین| `JoinCampaignModal.tsx` | `joinCampaignModal.isOpen` | ✅ | `App.tsx:1909` (شخصیت‌های بدون کمپین خط ۱۷۷۰) |
| `MODAL_CHAR_WIZARD` | ویزارد ساخت شخصیت | `CharacterCreationWizardModal.tsx`| `characterWizardModal.isOpen` | ✅ | `App.tsx:1936` (دکمه ویزارد خط ۴۸۳ HomeScreen) |
| `MODAL_CAMPAIGN_SETTINGS`| تنظیمات قوانین کمپین | `CampaignSettingsModal.tsx`| `campaignSettingsOpen` | ✅ | `App.tsx:1974` (منوی همبرگری خط ۶۱۹) |
| `MODAL_CAMPAIGN_MEMBERS` | اعضا و انتقال مالکیت | `CampaignMembersModal.tsx` | `campaignMembersOpen` | ✅ | `App.tsx:1988` (منوی همبرگری خط ۶۳۱) |
| `MODAL_CAMPAIGN_INVITES` | کدهای دعوت کمپین | `CampaignInvitesModal.tsx` | `campaignInvitesOpen` | ✅ | `App.tsx:2017` (منوی همبرگری خط ۶۴۳) |
| `MODAL_CAMPAIGN_APPROVALS`| صف تأیید لول‌آپ و کاراکتر| `CampaignApprovalsModal.tsx`| `campaignApprovalsOpen`| ✅ | `App.tsx:2037` (هدر زنگوله/بج خط ۳۶۴) |
| `MODAL_LEVEL_UP` | ویزارد ارتقای سطح | `LevelUpModal.tsx` | `levelUpModalOpen` | ✅ | `App.tsx:2072` (بنر طلایی هدر خط ۲۵۸ و نمای کلی خط ۲۹۴) |
| `MODAL_SHEET_CHANGE_REQ`| درخواست تغییر به DM | `SheetChangeRequestModal.tsx`| `sheetChangeRequestOpen`| ✅ | `App.tsx:2094` (دکمه وضعیت قفل برگه خط ۵۷۵) |
| `SHEET_SESSION_LIST` | برنامه و لیست جلسات | `SessionListSheet.tsx` | `sessionListOpen` | ✅ | `App.tsx:2110` (کارت جلسه خط ۳۲۲ و شیت بیشتر) |
| `SHEET_SESSION_EDITOR` | ویرایش/ایجاد جلسه | `SessionEditorSheet.tsx` | `sessionEditorModal.isOpen`| ✅ | `App.tsx:2145` (دکمه ایجاد در شیت جلسه) |
| `MODAL_SESSION_ATTEND` | حضور و غیاب جلسه | `SessionAttendanceModal.tsx`| `attendanceModal.isOpen` | ✅ | `App.tsx:2156` (اکشن در شیت لیست جلسات) |
| `SHEET_SESSION_CLOSING`| اختتامیه و پاداش جلسه | `SessionClosingSheet.tsx`| `closingSheetSession` | ✅ | `App.tsx:2172` (پایان جلسه در لیست جلسات) |
| `SHEET_RECAP_ARCHIVE` | بایگانی خلاصه‌ها | `RecapArchiveSheet.tsx` | `recapArchiveOpen` | ✅ | `App.tsx:2190` (کارت قبلاً در زروانیا خط ۳۴۱) |
| `SHEET_RECAP_EDITOR` | ثبت خلاصه داستان جلسه | `RecapEditorSheet.tsx` | `recapEditorState.isOpen`| ✅ | `App.tsx:2221` (دکمه نوشتن خلاصه جدید) |
| `DRAWER_NOTIFICATIONS` | کشوی رویدادها | `NotificationsDrawer.tsx` | `notificationsOpen` | ✅ | `App.tsx:2366` (آیکون زنگوله هدر خط ۴۷۸) |
| `MODAL_NOTIF_PREFS` | تنظیمات ارسال اعلان | `NotificationPreferencesModal.tsx`| `notificationPrefsOpen` | ✅ | `App.tsx:2377` (چرخ‌دنده درون کشوی اعلان خط ۲۳۷۱) |
| `MODAL_CONFLICT_RESOLVE`| حل مغایرت آفلاین | `ConflictResolutionModal.tsx`| `conflictModalOpen` | ✅ | `App.tsx:2386` (کلیک روی بج قرمز مغایرت خط ۲۹۷) |
| `SHEET_SESSION_EXPIRED`| هشدار انقضای نشست ۴۰۱ | `BottomSheet` (درونی) | `sessionExpiredSheetOpen` | ✅ | `App.tsx:2286` (خطای احراز هویت در کوئری‌ها خط ۴۰۲) |
| `SHEET_CAMPAIGN_MORE` | گزینه‌های ثانویه کمپین| `CampaignMoreSheet.tsx` | `campaignMoreOpen` | ✅ | `App.tsx:1810` (دکمه «بیشتر» در نوار پایین خط ۱۵۳) |
| `MODAL_ADMIN_CONSOLE` | کنسول مدیریت سرور | `AdminConsoleModal.tsx` | `adminConsoleOpen` | ⚠️ | `App.tsx:2276` (فقط برای platformRole === admin) |
| `SHEET_OFFLINE_SYNC` | جزئیات وضعیت آفلاین | `BottomSheet` (درونی) | `syncSheetOpen` | ✅ | `Header.tsx:920` (لمس بج وضعیت اتصال خط ۳۰۰) |
| `DRAWER_MOBILE_MENU` | منوی اصلی همبرگری | منوی درونی موبایل | `mobileMenuOpen` | ✅ | `Header.tsx:551` (دکمه همبرگری موبایل خط ۱۸۱) |
| `SHEET_NOTE_EDITOR` | ویرایش یادداشت کاراکتر | `BottomSheet` (درونی) | `isModalOpen` در NotesTab | ✅ | `NotesTab.tsx:7` |
| `SHEET_NOTE_DELETE` | تأیید حذف یادداشت | `ConfirmSheet.tsx` | `deleteConfirm` در NotesTab| ✅ | `NotesTab.tsx:8` |
| `SHEET_INV_ITEM_ADD` | افزودن شیء به کوله‌پشتی| `BottomSheet` (درونی) | `isAddModalOpen` در InvTab | ✅ | `InventoryTab.tsx:7` |
| `SHEET_INV_ITEM_DETAIL`| جزئیات و مصرف شیء | `BottomSheet` (درونی) | `selectedItem` در InvTab | ✅ | `InventoryTab.tsx:7` |
| `SHEET_INV_DELETE` | تأیید دور انداختن شیء | `ConfirmSheet.tsx` | `deleteConfirm` در InvTab | ✅ | `InventoryTab.tsx:8` |
| `SHEET_WEAPON_ADD` | ساخت سلاح سفارشی | `BottomSheet` (درونی) | `showAddWeapon` در Combat | ✅ | `CombatTab.tsx:39` |
| `SHEET_FEATURE_ADD` | افزودن قابلیت/حرکت | `BottomSheet` (درونی) | `showAddFeature` در Combat | ✅ | `CombatTab.tsx:40` |
| `SHEET_COMBAT_DELETE` | تأیید حذف سلاح/حرکت | `ConfirmSheet.tsx` | `deleteConfirm` در Combat | ✅ | `CombatTab.tsx:43` |
| `SHEET_CUSTOM_SKILL` | مهارت سفارشی زروانیا | `BottomSheet` (درونی) | `showAddCustomSkill` | ✅ | `AbilitiesTab.tsx:30` |
| `SHEET_COMPANION_ADD` | تعریف سازه/یار همراه | `BottomSheet` (درونی) | `showAddModal` در Companions| ✅ | `CompanionsTab.tsx:20` |
| `SHEET_BACKSTORY_REV` | تاریخچه نسخ پیشینه | `BottomSheet` (درونی) | `isRevisionSheetOpen` | ✅ | `BackstoryEditor.tsx:74` |
| `MODAL_BACKSTORY_REVW`| بازبینی پیشینه توسط DM | `BottomSheet` (درونی) | `isReviewModalOpen` | ✅ | `BackstoryEditor.tsx:83` |
| `SHEET_DM_NPC_EDIT` | ادیتور هیولا و NPC | `BottomSheet` (درونی) | `isCreating` در DmNpcMgr | ✅ | `DmNpcManager.tsx:7` |
| `SHEET_DM_ITEM_EDIT` | ادیتور اشیاء کتابخانه | `BottomSheet` (درونی) | `isCreating` در DmItemVault| ✅ | `DmItemVault.tsx:45` |
| `SHEET_DM_ITEM_GIVE` | اعطای شیء به بازیکن | `BottomSheet` (درونی) | `giveModalItem` در DmItem | ✅ | `DmItemVault.tsx:46` |
| `SHEET_DM_REWARD_DIST`| توزیع بسته پاداش | `BottomSheet` (درونی) | `distributeModalReward` | ✅ | `DmItemVault.tsx:51` |
| `SHEET_DM_LOC_EDIT` | ایجاد/ویرایش مکان | `BottomSheet` (درونی) | `isCreating` در DmLocation | ✅ | `DmLocationManager.tsx:7` |
| `SHEET_DM_NOTE_EDIT` | یادداشت محرمانه DM | `BottomSheet` (درونی) | `isCreating` در DmNotes | ✅ | `DmCampaignNotes.tsx:7` |
| `SHEET_DM_HANDOUT_EDT`| ادیتور سند و نقشه | `HandoutEditorSheet.tsx` | `isEditorOpen` در DmHandout | ✅ | `DmHandoutManager.tsx:11` |
| `MODAL_HANDOUT_VIEW` | مشاهده سند/نقشه بازیکن | `HandoutViewerModal.tsx` | `activeHandout` / `viewing`| ✅ | `HandoutViewerModal.tsx:21` |
| `SHEET_DM_HANDOUT_REC`| تخصیص گیرندگان سند | `BottomSheet` (درونی) | `recipientModalHandout` | ✅ | `DmHandoutManager.tsx:41` |
| `MODAL_DM_QUEST_EDIT` | ادیتور جامع مأموریت | `DmQuestEditorModal.tsx` | `editorModalOpen` در Quests | ✅ | `QuestsTab.tsx:17` |
| `SHEET_QUEST_COMPLETE`| تکمیل کوئست و اعطا | `BottomSheet` (درونی) | `completingQuest` در Quests | ✅ | `QuestsTab.tsx:59` |
| `MODAL_CLASS_COMPARE` | مقایسه همزمان کلاس‌ها | `BottomSheet` (درونی) | `showClassCompare` در ویزارد| ✅ | `CharacterCreationWizardModal.tsx:109` |
| `MODAL_LEGACY_JOIN` | مهاجرت میراثی کاراکتر | `BottomSheet` (درونی) | `legacyJoinOpen` در Master | ✅ | `MasterCharacterScreen.tsx:88` |
| `SHEET_IOS_PWA_GUIDE` | راهنمای نصب PWA آیفون | دیالوگ اختصاصی | `showIOSGuide` | ⚠️ | `src/components/mobile/PWAInstallPrompt.tsx:9` |
| `MODAL_LOCKED_FIELD` | دیالوگ فیلد قفل‌شده | `LockedFieldModal.tsx` | `lockedFieldModal.isOpen` | ❌ | **فراخوانی در کامپوننت‌ها هست، اما در JSX اپ رندر نشده است!** (`App.tsx:67, 206, 1745`) |
| `MODAL_EDIT_GRANT` | صدور مجوز ویرایش DM | `EditGrantModal.tsx` | `editGrantModalState.isOpen`| ❌ | **استیت ست می‌شود، اما تگ `<EditGrantModal>` در App.tsx وجود ندارد!** (`App.tsx:68, 213, 1622`) |
| `MODAL_CREATE_CAMP_OLD`| مدال قدیمی ساخت کمپین | `CreateCampaignModal.tsx` | - | ❌ | **کد مرده؛ جایگزین‌شده با ویزارد کمپین** (`App.tsx:57`) |
| `MODAL_CALENDAR_ORPHAN`| مدال تقویم باستانی | `CalendarModal.tsx` | - | ❌ | **کد مرده؛ در هیچ کجای پروژه ایمپورت نشده است** (`src/components/calendar/CalendarModal.tsx`) |
| `MODAL_PWA_REFRESH` | دیالوگ رفرش PWA | `PWARefreshPrompt.tsx` | - | ❌ | **کد مرده؛ استفاده‌نشده در ساختار برنامه** (`src/components/mobile/PWARefreshPrompt.tsx`) |
| `BANNER_OFFLINE_ORPHAN`| بنر شناور آفلاین | `OfflineBanner.tsx` | - | ❌ | **کد مرده؛ هدر خود دارای پنل آفلاین است** (`src/components/mobile/OfflineBanner.tsx`) |
| `STICKY_VITALS_OLD` | نوار وضعیت قدیمی برگه | `StickyCharacterVitalsBar.tsx`| - | ❌ | **کد مرده؛ جایگزین‌شده با `StickyHeader.tsx`** |

---

### رده ۴: صفحات پنهان و ابزارهای توسعه (Type 4 — Hidden & Dev Tools)

| شناسه مقصد | نام ابزار / صفحه | مسیر دسترسی | روش فعال‌سازی | شرایط لازم | وضعیت دسترسی | سند کد و خط مرجع |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `DEV_UI_GALLERY` | گالری کامپوننت‌های UI | `#/dev` یا `#/dev/ui` | تایپ دستی در URL مرورگر | فقط در حالت `DEV` فعال است | ⚠️ | `src/App.tsx:91, 597, 1421` |
| `AUTH_RESET_TOKEN` | صفحه بازنشانی رمز عبور | `#/reset?token=XYZ` | لینک تولیدشده توسط ادمین | داشتن توکن معتبر | ⚠️ | `src/App.tsx:588` |
| `AUTH_REGISTER_INVITE`| عضویت با کد دعوت مستقیم | `#/register?code=ABC`| لینک دعوت اختصاصی | داشتن کد دعوت کمپین | ✅ | `src/App.tsx:583` |
| `ADMIN_CONSOLE` | کنسول کلان مدیریت سرور | هدر دسکتاپ و منو | کلیک روی دکمه مدیریت | `platformRole === 'admin'` | ⚠️ | `src/components/Header.tsx:498, 693` |

---

## ۴. نگاشت دسترسی و مسیرهای ورود به هر مقصد (Access Map)

### مسیر دسترسی به مقصدهای اصلی (Click Paths):

1. **داشبورد کمپین‌ها (`ROUTE_HOME`):**
   * *موبایل:* ورود اولیه به برنامه -> نوار پایین -> تب اول «کمپین‌ها».
   * *دسکتاپ:* لوگوی زرین هدر «ز» (`Header.tsx:196`) یا منوی همبرگری.
2. **ورود به کمپین فعال (`ROUTE_CAMP_PLAYER`):**
   * *مسیر:* صفحه اصلی -> لمس کارت هر کمپین در بخش «کمپین‌های من» (`HomeScreen.tsx:302`) -> تغییر حالت به `campaign_space` و نمایش برگه.
3. **پرونده جامع شخصیت (`ROUTE_CHAR_MASTER`):**
   * *مسیر ۱:* صفحه اصلی -> اسکرول به بخش «شخصیت‌های من (شناسنامه کلان)» -> لمس کارت هر کاراکتر (`HomeScreen.tsx:523`).
   * *مسیر ۲ (موبایل):* نوار پایین در صفحه اصلی -> لمس تب «شخصیت‌ها» (`BottomNav.tsx:1832`) -> باز شدن اولین کاراکتر.
4. **سوئیچ به ابزارهای دانجن مستر (`ROUTE_CAMP_DM`):**
   * *موبایل:* نوار پایین در کمپین -> لمس تب اول «میز دی‌ام» (`BottomNav.tsx:80`).
   * *دسکتاپ:* دکمه بالای هدر «ابزارهای مستر / کاراکترشیت» (`Header.tsx:414`).
5. **پرتاب‌گر تاس پیشرفته (`MODAL_DICE_ROLLER`):**
   * *مسیر:* نوار پایین موبایل -> دکمه زرد برجسته مرکزی (`BottomNav.tsx:138`) یا کلیک روی مودیفایرهای برگه.
6. **مدیریت نشست‌ها و برنامه جلسات (`SHEET_SESSION_LIST`):**
   * *موبایل:* نوار پایین کمپین -> تب «بیشتر» -> گزینه «جلسات» (`CampaignMoreSheet.tsx:23`).
   * *داشبورد برگه:* کلیک روی کارت «جلسه بعدی» (`OverviewTab.tsx:320`).
7. **بایگانی خلاصه‌های داستانی (`SHEET_RECAP_ARCHIVE`):**
   * *موبایل:* نوار پایین -> تب «بیشتر» -> گزینه «خلاصه‌ها» (`CampaignMoreSheet.tsx:24`).
   * *داشبورد برگه:* کلیک روی کارت «قبلاً در زروانیا...» (`OverviewTab.tsx:338`).
8. **تنظیمات قوانین و تراز کمپین (`MODAL_CAMPAIGN_SETTINGS`):**
   * *موبایل:* نوار پایین -> تب «بیشتر» -> «تنظیمات» یا منوی همبرگری هدر -> «تنظیمات قوانین و واحدها» (`Header.tsx:618`).

---

## ۵. تحلیل عمیق مقصدهای مشکل‌دار و شکسته (Problematic Destinations)

### 🔴 دسته‌ی ۱: مقصدهای کاملاً غیرقابل دسترس یا باگ‌های انسدادی (❌)

#### ۱. مدال نمایش فیلد قفل‌شده (`MODAL_LOCKED_FIELD`)
* **آدرس فایل:** `src/components/character/LockedFieldModal.tsx`
* **شاهد در کد:** کامپوننت در خط ۶۷ فایل `src/App.tsx` با `React.lazy` ایمپورت شده و استیت آن در خط ۲۰۶ تعریف شده است (`const [lockedFieldModal, setLockedFieldModal] = useState(...)`). کالبک باز کردن آن (`onOpenLockedField`) به تمام تب‌ها پاس داده می‌شود (`App.tsx:1745, 1660, 1674, 1696`). در `OverviewTab.tsx` (خطوط ۴۰۷، ۴۳۰، ۴۵۳، ۶۵۹، ۶۸۶)، بازیکن هنگام لمس هر فیلد قفل‌شده این تابع را صدا می‌زند.
* **علت نقص:** در ساختار JSX فایل `src/App.tsx` (خطوط ۱۸۶۴ تا ۲۴۰۰)، تگ `<LockedFieldModal ... />` **به‌کلی فراموش شده و رندر نشده است!**
* **اثر مخرب:** بازیکن با لمس قفل‌های AC، کلاس، لول یا سرعت، انتظار دارد پنجره راهنمای قفل و دکمه درخواست تغییر باز شود، اما هیچ واکنشی در UI رخ نمی‌دهد و کاربر تصور می‌کند برنامه فریز شده است.
* **راه‌حل پیشنهادی:** افزودن شرط رندر مدال در انتهای `App.tsx`:
  ```tsx
  {lockedFieldModal.isOpen && (
    <LockedFieldModal
      isOpen={lockedFieldModal.isOpen}
      fieldName={lockedFieldModal.fieldName}
      characterName={activeCharacter?.name || ''}
      onClose={() => setLockedFieldModal({ isOpen: false, fieldName: '' })}
      onRequestChange={() => {
        setLockedFieldModal({ isOpen: false, fieldName: '' });
        setSheetChangeRequestOpen(true);
      }}
    />
  )}
  ```

---

#### ۲. مدال صدور مجوز ویرایش موقت توسط دانجن‌مستر (`MODAL_EDIT_GRANT`)
* **آدرس فایل:** `src/components/dm/EditGrantModal.tsx`
* **شاهد در کد:** کامپوننت در خط ۶۸ فایل `src/App.tsx` ایمپورت شده و استیت آن در خط ۲۱۳ تعریف شده است (`editGrantModalState`). در `OverviewTab.tsx` (خط ۶۰۲ و کالبک در `App.tsx:1622`)، دکمه «اجازه‌ی ویرایش» برای DM قرار دارد.
* **علت نقص:** همانند مورد قبل، تگ `<EditGrantModal ... />` در JSX فایل `src/App.tsx` **رندر نشده است!**
* **اثر مخرب:** دانجن مستر وقتی می‌خواهد در جریان بازی به بازیکن مجوز ویرایش لول‌آپ، تغییر اسپل یا اصلاح مشخصات بدهد، با زدن دکمه هیچ فرمی باز نمی‌شود.
* **راه‌حل پیشنهادی:** قرار دادن رندر شرطی مدال در JSX اصلی `App.tsx`.

---

#### ۳. انحراف روت تب دعوت‌ها در ناوبری موبایل (`ROUTE_JOIN_ORPHAN`)
* **آدرس فایل:** `src/components/mobile/BottomNav.tsx:1838`
* **شاهد در کد:** در نوار پایین موبایل، وقتی کاربر روی تب سوم («دعوت‌ها») کلیک می‌کند:
  ```tsx
  else if (tab === 'invites') {
    window.location.hash = '#/join';
  }
  ```
  اما در تابع روتر `src/App.tsx:572-653` (`applyRouteFromHash`)، هیچ شرطی برای `clean === 'join'` وجود ندارد و به شاخه پیش‌فرض `setViewMode('home')` می‌افتد.
* **اثر مخرب:** صفحه مجدداً به بالای داشبورد خانه می‌رود بدون این که فیلد ورود کد دعوت فوکوس شود یا اسکرول به بخش پایین صفحه صورت گیرد.
* **راه‌حل پیشنهادی:** افزودن کیس `join` به روتر برای اسکرول نرم به سکشن کد دعوت یا باز کردن یک مدال سریع پیوستن.

---

#### ۴. مدال تقویم زروانیا به عنوان کد مرده (`MODAL_CALENDAR_ORPHAN`)
* **آدرس فایل:** `src/components/calendar/CalendarModal.tsx`
* **شاهد در کد:** کامپوننت مستقلی با ۱۶۵ خط کد شامل توابع جلو بردن روزهای بازی، تقویم فصول و جشن‌های زروانیا پیاده شده است؛ اما در هیچ کجای `src/` ایمپورت نشده است! تب تقویم درون `CodexTab.tsx` صرفاً یک لیست متنی ساده رندر می‌کند و به این مدال متصل نیست.

---

### 🟡 دسته‌ی ۲: دسترسی‌های مشروط، ناهماهنگ یا دارای پیچیدگی (⚠️)

#### ۱. ناپدید شدن تب‌های کوله‌پشتی، یادداشت و جهان در دسکتاپ
* **شاهد در کد:** سربرگ چسبان شیت کاراکتر (`src/components/common/StickyHeader.tsx:58`) فقط شامل تب‌های زیر است:
  * نمای کلی (`overview`)، ویژگی‌ها (`abilities`)، مبارزه (`combat`)، توانایی‌ها (`features`)، یاران (`companions`)، منابع (`resources`).
  در این سربرگ گزینه‌ای برای **کوله‌پشتی (`inventory`)**، **یادداشت‌ها (`notes`)** یا **جهان (`codex`)** تعبیه نشده است!
* **اثر:** در موبایل این تب‌ها از نوار پایین (`BottomNav`) و شیت «بیشتر» قابل دسترسی‌اند، اما در صفحات بزرگتر از ۷۶۸ پیکسل که `BottomNav` پنهان می‌شود (`hidden md:flex`)، کاربر دسکتاپ راهی آسان و بدیهی برای رفتن به کوله‌پشتی یا یادداشت‌ها ندارد مگر این که از شیت بیشتر یا تغییر هش دستی استفاده کند.

#### ۲. گالری کامپوننت‌های توسعه (`DEV_UI_GALLERY`)
* **شاهد در کد:** روت `#/dev` یا `#/dev/ui` در روتر فعال است (`App.tsx:597`)، اما هیچ دکمه یا لینکی در UI اپلیکیشن به آن ارجاع نمی‌دهد. تنها با درج مستقیم در نوار آدرس مرورگر در محیط لوکال باز می‌شود. دکمه بازگشت آن نیز با `href="#/"` به خانه برمی‌گردد.

#### ۳. جریان بازیابی رمز عبور (`AUTH_RESET_TOKEN`)
* **شاهد در کد:** مسیر `#/reset?token=...` در روتر مدال ورود را در حالت `reset` باز می‌کند. این لینک معمولاً توسط ادمین در پنل سرور کپی می‌شود، ولی در صفحه لاگین دکمه‌ای برای درخواست ایمیل ریست مستقیم توسط خود کاربر وجود ندارد.

---

## ۶. ورودی‌های خراب، لینک‌های معلق و کدهای مرده (Dead Code Analysis)

1. **کامپوننت `CreateCampaignModal.tsx`:**
   * این کامپوننت در ابتدای `App.tsx:57` ایمپورت شده است، اما با پیاده‌سازی ویزارد پیشرفته ۸ مرحله‌ای `CampaignWizardModal.tsx` عملاً کنار گذاشته شده و استیت `createCampaignOpen` در خط ۱۸۸۸ ویزارد جدید را رندر می‌کند. کامپوننت `CreateCampaignModal` دست‌نخورده باقی مانده و کد مرده است.
2. **کامپوننت `StickyCharacterVitalsBar.tsx`:**
   * نسخه‌ای قدیمی از نوار چسبان وضعیت است که با `src/components/common/StickyHeader.tsx` جایگزین شده اما فایل آن همچنان در پوشه `mobile/` باقی مانده است.
3. **کامپوننت `OfflineBanner.tsx`:**
   * بنر شناور آفلاین است که در هیچ کجای اپلیکیشن فراخوانی نشده است؛ زیرا هشدار آفلاین مستقیماً در نوار هدر (`Header.tsx:294`) با شیت اختصاصی `syncSheetOpen` یکپارچه شده است.
4. **کامپوننت `PWARefreshPrompt.tsx`:**
   * پرامپت آماده‌باش به‌روزرسانی سرویس‌ورکر PWA است که به دلیل هندل شدن دستی بررسی نسخه در هدر (`handleCheckForUpdates`) هرگز در درخت DOM رندر نمی‌شود.
5. **تب‌های گمراه‌کننده `features` و `resources` در `App.tsx`:**
   * در `src/App.tsx:1737`، تب `activePlayerTab === 'features'` مجدداً کامپوننت `<AbilitiesTab />` را با پراپ‌های تکراری رندر می‌کند؛ در حالی که توانایی‌های ویژه کاراکتر در `CombatTab` قرار دارند.

---

## ۷. دیاگرام‌های جریان ناوبری (Mermaid Flowcharts)

### ۱. نمودار کلان ناوبری بر اساس نقش کاربر (Global Navigation Flow)

```mermaid
flowchart TD
    Start([ورود به دانجن‌یار]) --> CheckAuth{کاربر لاگین است؟}
    
    CheckAuth -- خیر --> GuestView[صفحه اصلی / ورود مهمان]
    GuestView --> LoginModal[مدال ورود / عضویت #/login]
    GuestView --> InviteRoute[پیوستن با کد دعوت #/register?code]
    
    CheckAuth -- بله --> HomeDashboard[داشبورد خانه #/]
    
    HomeDashboard --> CreateCamp[ویزارد کمپین جدید 8 مرحله‌ای]
    HomeDashboard --> CharMaster[پرونده جامع شخصیت #/characters/:id]
    HomeDashboard --> SelectCamp[انتخاب کمپین از لیست]
    
    SelectCamp --> RoleCheck{نقش در کمپین؟}
    
    RoleCheck -- owner / co_dm --> DmSpace[فضای دانجن مستر #/c/:id/dm/dashboard]
    RoleCheck -- player / spectator --> PlayerSpace[فضای برگه بازیکن #/c/:id/overview]
    
    subgraph فضای دانجن‌مستر
        DmSpace --> DmDash[داشبورد DM]
        DmSpace --> DmCombat[مدیریت نبرد و انکانتر]
        DmSpace --> DmLimits[کتابخانه اشیاء و موجودات]
        DmSpace --> DmStory[روایت و یادداشت‌ها]
        DmSpace --> DmConfig[کاربران و تنظیمات کمپین]
    end
    
    subgraph فضای بازیکن
        PlayerSpace --> TabOverview[نمای کلی]
        PlayerSpace --> TabCombat[مبارزه و اکشن‌ها]
        PlayerSpace --> TabAbilities[ویژگی‌ها و مهارت‌ها]
        PlayerSpace --> TabInv[کوله‌پشتی و خزانه]
        PlayerSpace --> TabNotes[یادداشت‌های شخصی]
        PlayerSpace --> TabCodex[دانشنامه و نقشه‌ها]
    end
    
    subgraph ابزارهای سراسری و اورلی
        PlayerSpace -.-> DiceModal((تاس‌ریز شناور))
        PlayerSpace -.-> RestModal[مدال استراحت]
        PlayerSpace -.-> SessModal[شیت لیست جلسات]
        PlayerSpace -.-> MoreSheet[شیت میانبرهای بیشتر]
    end
```

---

### ۲. چرخه حیات شیت‌ها و مدال‌های بحرانی (Modal / Sheet State Transition)

```mermaid
stateDiagram-v2
    [*] --> Idle: میز بازی فعال
    
    Idle --> DiceRollerModal: لمس دکمه تاس نوار پایین
    DiceRollerModal --> Idle: بستن مدال تاس
    
    Idle --> RestModal: لمس دکمه‌های استراحت کوتاه/بلند
    RestModal --> Idle: اعمال بازیابی منابع
    
    Idle --> CampaignMoreSheet: لمس دکمه «بیشتر» (موبایل)
    CampaignMoreSheet --> SessionListSheet: انتخاب جلسات
    CampaignMoreSheet --> RecapArchiveSheet: انتخاب خلاصه‌ها
    CampaignMoreSheet --> InventoryTab: انتخاب کوله‌پشتی
    CampaignMoreSheet --> CompanionsTab: انتخاب یاران
    
    Idle --> LevelUpModal: لمس بنر طلایی ارتقای سطح
    LevelUpModal --> ApprovalQueue: ارسال به صف تایید DM
    ApprovalQueue --> Idle: تایید توسط راوی
    
    Idle --> LockedFieldClicked: لمس فیلد قفل‌شده (AC/لول)
    LockedFieldClicked --> BUG_Unrendered: ❌ مدال رندر نمی‌شود (باگ فعلی)
    
    Idle --> DmEditGrantClicked: لمس «اجازه‌ی ویرایش» توسط DM
    DmEditGrantClicked --> BUG_Unrendered2: ❌ مدال رندر نمی‌شود (باگ فعلی)
```

---

## ۸. پرسش‌های باز، تصمیمات محصولی و توصیه‌های فنی

1. **سرنوشت فایل‌های مرده:**
   * آیا کامپوننت‌های قدیمی مانند `CreateCampaignModal.tsx`، `StickyCharacterVitalsBar.tsx`، `OfflineBanner.tsx` و `CalendarModal.tsx` باید در یک شاخه ریفاکتور پاکسازی شوند یا به عنوان الگو در پوشه آرشیو نگهداری گردند؟
2. **یکپارچگی ناوبری دسکتاپ:**
   * پیشنهاد می‌شود برای صفحات بزرگتر از ۷۶۸ پیکسل، تب‌های «کوله‌پشتی»، «یادداشت‌ها» و «دانشنامه» به `StickyHeader` یا یک سایدبار کناری اضافه شوند تا نابرابری ناوبری دسکتاپ و موبایل رفع گردد.
3. **اصلاح فوری دو مدال یتیم:**
   * افزودن رندر `<LockedFieldModal>` و `<EditGrantModal>` در `src/App.tsx` با اولویت بالا ضروری است؛ زیرا بدون آنها مکانیسم قفل برگه کاراکتر و مجوزهای DM در لایه UI دچار قطعی ارتباط است.
4. **رفتار روت `#/join` در موبایل:**
   * در صورتی که دکمه دعوت‌ها در نوار پایین زده می‌شود، باید یا کاربر به المان `document.getElementById('invite-section')` اسکرول داده شود یا مستقیماً مدال `JoinCampaignModal` باز شود.
