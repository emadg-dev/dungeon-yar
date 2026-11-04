# معماری تقویم و گاه‌شمار در دانجن‌یار (DungeonYar)
**تحلیل فنی جامع وضعیت موجود، نقاط گسست و نقشه‌ی راه گذار به تقویم قابل‌ویرایش**

---

## ۱. خلاصه‌ی اجرایی (Executive Summary)

تقویم در دانجن‌یار هم‌اکنون در وضعیتی **«دوپاره و نیمه‌داده‌ای» (Hybrid & Disconnected)** قرار دارد:
یک تقویم تاریخی و هاردکدشده به نام «گاه‌شمار شاه‌روزان زروانیا» (۱۲ ماه ۳۰ روزه + ۵ روز برون‌گاه) در فایل‌های کلاینت پیاده شده که توابع پیشبرد زمان و فرمت تاریخ آن کاملاً بر مفروضات ثابت ۳۶۵ روزه استوار است؛ هم‌زمان در فاز دوم پروژه، جداول دیتابیس D1 (`calendars` و `calendar_states`) و تایپ‌های پویا (`GenericCalendarData`) برای تقویم قابل‌شخصی‌سازی طراحی شده‌اند، اما اندپوینت‌های ویرایش سرور ناقص بوده، ارتباط آن‌ها با رابط کاربری قطع است و در سطح جلسات، تاریخ بازی صرفاً به صورت **رشته‌ی متنی آزاد (Free Text)** ذخیره می‌شود.

---

## ۲. روش‌شناسی و دامنه‌ی جست‌وجو

بررسی از طریق تحلیل ایستا، ردگیری جریان داده و استخراج شواهد دقیق کد بر روی شاخه‌های زیر انجام گرفت:
- پایگاه داده: `schema.sql` و تمامی فایل‌های پوشه `migrations/*.sql`
- توابع سرور ابری (Cloudflare Pages Functions): `functions/api/[[route]].ts`
- منطق اشتراکی (Shared): `shared/rules/sessionEngine.ts` و تست‌های `shared/**/*.test.ts`
- سرویس‌ها و شبیه‌سازها: `src/services/api.ts` (شامل `LocalApi` و `HttpApi`) و `src/services/cloneEngine.ts`
- رابط کاربری و داده‌های اولیه: `src/data/calendar.ts`، `src/data/seed.ts`، `src/types/index.ts` و کامپوننت‌های شیت، جلسات، دانشنامه و کتابخانه.

---

## ۳. نقشه‌ی ردپای تقویم در مخزن (Repository Footprint)

| بخش | مسیر فایل | نقش و کاربرد |
|---|---|---|
| پایگاه‌داده | `schema.sql:526-554` | تعریف جداول `calendars` و `calendar_states` (اسکوپ‌بندی شده) |
| پایگاه‌داده | `schema.sql:803-812` | تعریف جدول میراثی تک‌ردیفی `campaign_calendar` (سراسری) |
| پایگاه‌داده | `schema.sql:579` | ستون `in_world_date TEXT` در جدول `sessions` |
| مایگریشن‌ها | `migrations/003_library_wizard.sql:42-46` | افزودن ستون‌های `weekdays`، `start_year`، `era_label`، `tags` به جدول `calendars` |
| مایگریشن‌ها | `migrations/004_restore_legacy_contract.sql:55-66` | ایجاد مجدد جدول میراثی `campaign_calendar` برای تطابق کلاینت اولیه |
| مایگریشن‌ها | `migrations/009_sessions_and_scheduling.sql:10` | ایجاد جدول جلسات با ستون تاریخ درون‌بازی `in_world_date` |
| توابع سرور | `functions/api/[[route]].ts:5735-5767` | روت‌های `/api/calendar` (متدهای GET و PUT روی جدول تک‌ردیفی `campaign_calendar`) |
| توابع سرور | `functions/api/[[route]].ts:6172-6196` | روت `/api/generic-calendar` (متد GET آخرین گاه‌شمار از `calendars`) |
| توابع سرور | `functions/api/[[route]].ts:6506, 6561, 6671` | ذخیره و بازیابی رشته‌ی متنی `in_world_date` برای جلسات |
| تایپ‌ها | `src/types/index.ts:1469-1491` | تایپ‌های سنتی زروانیا: `MonthDef`، `OffDayDef` و `WorldCalendar` |
| تایپ‌ها | `src/types/index.ts:1654-1694` | تایپ‌های عمومی فاز ۲: `CalendarMonth`، `CalendarFestival`، `CalendarOffDay`، `GenericCalendarData` و `CalendarState` |
| تایپ‌ها | `src/types/index.ts:1244, 1871` | پراپرتی `inWorldDate?: string` درون موجودیت `Session` |
| منطق تقویم | `src/data/calendar.ts:1-126` | آرایه‌های ثابت `CALENDAR_MONTHS`، `CALENDAR_OFF_DAYS` و توابع محاسباتی پیشبرد تاریخ |
| داده‌های اولیه | `src/data/seed.ts:2483-2516` | تعریف موجودیت قالب `SEED_GENERIC_CALENDAR` با اسامی ماه‌های زرتشتی/اوستایی |
| داده‌های اولیه | `src/data/seed.ts:3688, 3712, 3731` | نمونه رشته‌های تاریخ درون‌بازی جلسات آزمایشی (`۵ سایه‌باد ۱۱۷۸`) |
| منطق اشتراکی | `shared/rules/sessionEngine.ts:260-274` | تابع `displayInWorldDate` برای فرمت‌بندی تاریخ جلسه |
| کلونینگ | `src/services/cloneEngine.ts:45, 794-803` | کپی و تغییر شناسه‌ی موجودیت `calendar` در پکیج‌ها |
| سرویس API | `src/services/api.ts:608-611, 762-763` | امضای متدهای تقویم در اینترفیس `ApiClient` |
| سرویس API | `src/services/api.ts:2145-2165` | پیاده‌سازی متدهای `getCalendar`، `updateCalendar` و `advanceCalendar` در `LocalApi` |
| سرویس API | `src/services/api.ts:5080, 5819-5832` | پیاده‌سازی `getGenericCalendar` و `updateGenericCalendar` در `LocalApi` |
| سرویس API | `src/services/api.ts:8456-8472` | فراخوانی اندپوینت‌های `/calendar` و `/calendar/advance` در `HttpApi` |
| سرویس API | `src/services/api.ts:9303-9313` | فراخوانی اندپوینت `/generic-calendar` در `HttpApi` |
| کامپوننت | `src/components/calendar/CalendarModal.tsx:1-165` | مدال مستقل نمایش تقویم زروانیا و کنترل‌های پیشبرد زمان توسط DM |
| کامپوننت | `src/components/character/CodexTab.tsx:71-77, 376-396` | تب فرعی تقویم درون دانشنامه با رویدادهای هاردکدشده تقویم شمسی |
| کامپوننت | `src/components/dm/DmLibrary.tsx:122-124, 417-428` | استیت و متد ذخیره‌سازی تقویم در کتابخانه (دیالوگ JSX رندر نشده) |
| کامپوننت | `src/components/campaign/CampaignWizardModal.tsx:84-86, 542-568` | فرم انتخاب منبع تقویم (شاه‌روزان زروانیا / از صفر) در ویزارد ساخت کمپین |
| کامپوننت | `src/components/session/SessionEditorSheet.tsx:53, 189, 391` | فیلد متنی ورود دستی `inWorldDate` برای جلسه |
| کامپوننت | `src/components/session/NextSessionCard.tsx:99` | نمایش رشته‌ی تاریخ درون‌بازی با `displayInWorldDate` |
| کامپوننت | `src/components/session/SessionListSheet.tsx:165` | نمایش رشته‌ی تاریخ درون‌بازی در آرشیو جلسات |

---

## ۴. لایه‌ی داده و وضعیت دیتابیس (Backend & D1 Layer)

در پایگاه داده D1، سه ساختار جدول مجزا و ناهمگن وجود دارد:

### ۱. جدول میراثی تک‌ردیفی (`campaign_calendar`)
* **مشخصات در کد:** `schema.sql:803-812` و `migrations/004_restore_legacy_contract.sql:55-66`.
* **ستون‌ها:**
  - `id TEXT PRIMARY KEY DEFAULT 'zorvania-calendar'`
  - `year INTEGER NOT NULL DEFAULT 1500`
  - `month INTEGER NOT NULL DEFAULT 1`
  - `day INTEGER NOT NULL DEFAULT 1`
  - `is_off_day INTEGER NOT NULL DEFAULT 0`
  - `off_day_index INTEGER DEFAULT 0`
  - `current_festival TEXT`
  - `updated_at INTEGER NOT NULL`
* **ارزیابی معماری:** این جدول به صورت **جهانی (Global Singleton)** ساخته شده و هیچ کلید خارجی یا ارجاعی به `campaign_id` ندارد. تمام کمپین‌ها در صورت استفاده از اندپوینت `/api/calendar` روی همین یک ردیف می‌نویسند.

### ۲. جداول کمپین‌محور فاز دو (`calendars` و `calendar_states`)
* **مشخصات در کد:** `schema.sql:526-554` و `migrations/003_library_wizard.sql:42-46`.
* **جدول `calendars` (تعریف ساختار تقویم):**
  - `id TEXT PRIMARY KEY`
  - `scope_type TEXT CHECK (scope_type IN ('pack', 'campaign')) NOT NULL DEFAULT 'campaign'`
  - `scope_id TEXT NOT NULL DEFAULT 'zorvania-c1'`
  - `source_id TEXT`
  - `name TEXT NOT NULL`
  - `months TEXT NOT NULL` (رشته‌ی JSON شامل نام و طول ماه‌ها)
  - `off_days TEXT NOT NULL` (رشته‌ی JSON شامل نام و یادداشت روزهای خارج از سال‌شمار)
  - `data TEXT NOT NULL` (متادیتای الحاقی JSON)
  - `tags TEXT DEFAULT '[]'`
  - `era_label TEXT DEFAULT 'پ.ر.ن'`
  - `start_year INTEGER DEFAULT 1500`
  - `weekdays TEXT DEFAULT '["شنبه","یکشنبه",...]'` (رشته‌ی JSON نام روزهای هفته)
  - `updated_at INTEGER NOT NULL`
* **جدول `calendar_states` (وضعیت جاری زمان کمپین):**
  - `campaign_id TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE`
  - `calendar_id TEXT NOT NULL`
  - `year INTEGER`, `month INTEGER`, `day INTEGER`, `is_off_day INTEGER`, `off_day_index INTEGER`, `current_festival TEXT`, `updated_at INTEGER`
* **ارزیابی معماری:** طراحی فاز ۲ کاملاً اسکوپ‌بندی شده و چندکمپینی است؛ اما در کدهای ران‌تایم بک‌اند (`functions/api/[[route]].ts`) روت‌های CRUD برای `calendar_states` اصلاً پیاده‌سازی نشده‌اند و جدول `calendar_states` کاملاً دست‌نخورده در دیتابیس رها شده است!

### ۳. نحوه‌ی ذخیره‌سازی تاریخ بازی (In-Game Date)
* **در جلسات:** تاریخ بازی در ستون `sessions.in_world_date` به عنوان `TEXT` آزاد ذخیره می‌شود (`schema.sql:579` و `functions/api/[[route]].ts:6561`).
* **عدم وجود تاریخچه (Audit/History):** هیچ جدولی برای ثبت تغییرات زمان، لاگ پیشبرد تاریخ توسط DM، یا ثبت تایم‌لاین رویدادها بر مبنای تقویم جهان وجود ندارد.

### ۴. وضعیت رویدادها و جشن‌ها
* در `calendar.ts` نام جشن‌ها به ازای روز اول هر ماه در کد هاردکد است (`CALENDAR_MONTHS[i].festival`).
* در `seed.ts` (ردیف `SEED_GENERIC_CALENDAR:2502-2506`) جشن‌ها به صورت آرایه‌ای از اشیاء با `monthIndex` و `day` تعریف شده‌اند.
* در بک‌اند `functions/api/[[route]].ts:6192`، هنگام بازگرداندن گاه‌شمار عمومی، فیلد جشن‌ها صراحتاً خالی فرستاده می‌شود: `festivals: []`.

### ۵. مسیرهای API و مجوزها (Endpoints Analysis)
1. `GET /api/calendar` (`functions/api/[[route]].ts:5735`): بدون احراز هویت؛ ردیف ثابت `zorvania-calendar` را بازمی‌گرداند.
2. `PUT /api/calendar` (`functions/api/[[route]].ts:5760`): فقط بررسی میراثی `currentUser.role !== 'dm'` را انجام می‌دهد (نقش‌های کمپین بررسی نمی‌شوند!) و ردیف تک‌ردیفی را آپدیت می‌کند.
3. `POST /api/calendar/advance` (`src/services/api.ts:8468`): در کلاینت `HttpApi` صدا زده می‌شود، اما **در فایل `functions/api/[[route]].ts` وجود خارجی ندارد و خطای 404 برمی‌گرداند!**
4. `GET /api/generic-calendar` (`functions/api/[[route]].ts:6173`): آخرین ردیف جدول `calendars` را بدون فیلتر کمپین بازمی‌گرداند.
5. `PUT /api/generic-calendar` (`src/services/api.ts:9309`): توسط کلاینت فراخوانی می‌شود اما در سرور پیاده‌سازی نشده است.

---

## ۵. لایه‌ی منطق، محاسبات و مفروضات ثابت (Logic Layer & Assumptions)

در لایه‌ی محاسباتی، تناقض بنیادین میان **دو سامانه‌ی نام‌گذاری** و **مفروضات ریاضی سخت‌کدشده** وجود دارد:

### ۱. دوگانگی تعاریف گاه‌شمار زروانیا
| ویژگی | تعریف سنتی در `src/data/calendar.ts` | تعریف فاز ۲ در `src/data/seed.ts:2483` | تعریف در `CodexTab.tsx:71` |
|---|---|---|---|
| **نام ماه‌ها** | فرهان، زروان، ورنان، آریامان، دیوگان، گدازان، پیمان، کندان، مهگان، یخبندان، آذران، واپسان | فرورداد، اردی‌مهر، خورداد، تیرآذر، امرداد، شهریور، مهرآیین، آبان‌داد، آذرپژواک، دی‌مهر، بهمن‌یار، اسفندارمذ | مهر، آبان، آذر، دی، شب یلدا (تقویم هجری خورشیدی) |
| **روزهای برون‌گاه** | روز لرزش، روز گمگشتگی آب، روز بینامی، روز خاموشی آتش، روز بند | گاه اول: اهنود، گاه دوم: اشتود، گاه سوم: سپنتمد، گاه چهارم: وهوخشتر، گاه پنجم: وهیشتوآیشت | وجود ندارد |
| **برچسب مبدأ (Era)** | `پ.ر.ن.` (پیش از روشنایی نو) | `پ.ر.ن` (پس از روز نخست) | نامشخص |
| **جشن‌ها** | روز اول هر ماه به نام خود ماه | نوروز کهن (۱/۱)، مهرگان (۷/۱۶)، آذرخش (۹/۹) | وقایع نجومی پاییز و زمستان |

### ۲. فهرست دقیق مفروضات ثابت ریاضی (Hardcoded Constants)
1. **طول ماه ثابت ۳۰ روزه:** در `src/data/calendar.ts:75` شرط `day < 30` و در خط ۷۶ افزایش روز فرض می‌کند هر ماه دقیقاً ۳۰ روز است.
2. **تعداد ماه‌ها ۱۲:** در `src/data/calendar.ts:79` شرط `month < 12` و در خط ۸۷ تخصیص `month = 13` برای روزهای برون‌گاه نشان می‌دهد سیستم هیچ ماه اضافه‌ای را نمی‌پذیرد.
3. **تعداد روزهای برون‌گاه ۵:** در `src/data/calendar.ts:92` شرط `offDayIndex < 5` به عنوان تنها حالت پایان سال فرض شده است.
4. **طول سال ۳۶۵ روز:** هیچ متغیری برای سال کبیسه یا تغییر طول سال وجود ندارد (`12 * 30 + 5 = 365`).
5. **جشن انحصاری در روز اول ماه:** در `src/data/calendar.ts:110` شرط `else if (day === 1)` تنها مبنای تخصیص خودکار جشن ماهانه است.
6. **دکمه‌های جهش زمان:** در `src/components/calendar/CalendarModal.tsx:102` جهش یک‌ماهه معادل عدد ثابت ۳۰ روز محاسبه شده است (`handleAdvance(30)`).
7. **روزهای هفته:** در `migrations/003_library_wizard.sql:46` و `src/data/seed.ts:2514` تعداد روزهای هفته به ۷ روز ثابت شمسی محدود شده است.
8. **فرمت متنی سال:** عبارت `سال ${cal.year} پ.ر.ن.` در `src/data/calendar.ts:63, 67` به صورت رشته‌ی غیرقابل‌پیکربندی قالب‌بندی می‌شود.

---

## ۶. بررسی مصرف‌کنندگان تقویم و تاریخ (Consumers Audit)

1. **`SessionListSheet.tsx:165` و `NextSessionCard.tsx:99`:**
   - متغیر `calendar` به عنوان پراپ تعریف شده اما در والدین (`OverviewTab.tsx:322` و `DmDashboard.tsx:183`) اصلاً پاس داده **نمی‌شود** (`undefined`).
   - تابع `displayInWorldDate` (`shared/rules/sessionEngine.ts:269`) شرط زیر را بررسی می‌کند:
     ```ts
     if (calendar && raw === calendar.id) return formatWorldDate(calendar);
     return raw;
     ```
     از آنجا که مقدار ذخیره‌شده‌ی `inWorldDate` در جلسات معمولاً متن دستی است (مانند `۵ سایه‌باد ۱۱۷۸`) و نه شناسه‌ی `'zorvania-calendar'`، تابع همواره رشته‌ی خام را بدون فرمت بازمی‌گرداند.
2. **`SessionEditorSheet.tsx:53, 391`:**
   - فیلد `inWorldDate` یک فیلد متنی معمولی (`<Input>`) است که راوی هر متنی را در آن تایپ می‌کند و هیچ وابستگی به شیء تقویم ندارد.
3. **`CodexTab.tsx:376-396`:**
   - تب دانشنامه مستقیماً آرایه‌ی ثابت ۵ عنصری `calendarEvents` (خط ۷۱) را رندر می‌کند و به هیچ داده‌ای از دیتابیس یا کمپین وصل نیست.
4. **`CampaignWizardModal.tsx:84-86, 542-568`:**
   - راوی در گام ۳ میان دو گزینه‌ی «شاه‌روزان زروانیا» و «از صفر» سوئیچ می‌کند، اما این انتخاب فقط در استیت `answers` پیش‌نویس ذخیره می‌شود و هیچ رکوردی در جدول `calendars` ایجاد نمی‌کند.
5. **`DmLibrary.tsx:123, 418-428`:**
   - استیت `calendarEditorOpen` تعریف شده و کالبک `handleSaveCalendar` برای ذخیره‌ی تقویم وجود دارد، اما رابط کاربری ادیتور تقویم در JSX رندر نشده است.
6. **پرونده شخصیت، کوئست‌ها و رپ‌کپ‌ها:**
   - هیچ‌کدام از فیلدهای `Quest`، `CharacterHistoryEvent` یا `SessionRecap` به تقویم متصل نیستند؛ همگی بر مبنای میلی‌ثانیه یونیکس (`createdAt: number`) یا شناسه‌ی جلسه عمل می‌کنند.

---

## ۷. تحلیل تفصیلی کامپوننت `CalendarModal.tsx`

کامپوننت `src/components/calendar/CalendarModal.tsx` یک شیت شناور ۱۶۵ خطی است:
- **داده‌های ورودی:** پراپ‌های `calendar: WorldCalendar`، `isDm: boolean`، `onAdvanceDays` و `onUpdateCalendar`.
- **بخش‌های قابل استفاده مجدد:**
  - ساختار بصری بنر زمان جاری، نشانگر جشن، کادر هشدار روزهای برون‌گاه، دکمه‌های پیشبرد زمان توسط DM، و گرید نمایش ماه‌ها و روزهای برون‌گاه.
- **بخش‌های هاردکدشده:**
  - ایمپورت مستقیم `CALENDAR_MONTHS` و `CALENDAR_OFF_DAYS` از فایل استاتیک `calendar.ts`.
  - پیش‌فرض بودن ۳۰ روز برای دکمه‌ی «+۱ ماه».
  - عنوان ثابت «تقویم باستانی زروانیا» و زیرعنوان مبدأ تاریخ `پ.ر.ن.`.
- **اتصال به API:**
  - دکمه‌های پیشبرد زمان تابع `onAdvanceDays` را فراخوانی می‌کنند که در لایه‌ی کلاینت به `api.advanceCalendar(days)` متصل است. در حالت لوکال کار می‌کند اما در اتصال به سرور ابری با خطای 404 مواجه می‌شود؛ زیرا اندپوینت `/api/calendar/advance` در سرور وجود ندارد.

---

## ۸. تحلیل شکاف تا «تقویم قابل‌ویرایش» (Gap Analysis)

| قابلیت مورد نیاز کاربر | وضعیت فعلی | محل در کد فعلی | نیازمندی برای تکمیل |
|---|---|---|---|
| **تعداد روزهای سال** | هاردکد (۳۶۵ روز) | `calendar.ts:75, 92` | باید از مجموع روزهای ماه‌ها + روزهای خارج از ماه محاسبه شود. |
| **فهرست ماه‌ها (نام، تعداد روز، ترتیب)** | دوگانه و هاردکد در ۲ فایل؛ پویا در اسکیما | `schema.sql:532` (`months TEXT`), `calendar.ts:3`, `seed.ts:2488` | مهاجرت کامل به ستون JSON و حذف فایل‌های استاتیک. |
| **روزهای هفته (نام، ترتیب، طول دلخواه)** | هاردکد ۷ روز شمسی در اسکیما؛ غایب در محاسبات | `schema.sql:539` (`weekdays TEXT`) | افزودن فیلد آرایه به فرم ادیتور و تابع محاسبه‌ی روز هفته. |
| **فصل‌ها (نام، انتساب ماه به فصل)** | هاردکد در فایل استاتیک؛ فیلد اختیاری در تایپ | `calendar.ts:5`, `types/index.ts:1657` | پشتیبانی در فرم تعریف ماه‌ها. |
| **جشن‌ها و تعطیلات** | در فایل استاتیک روز ۱ ماه‌ها؛ در سرور خالی فرستاده می‌شود | `calendar.ts:110`, `[[route]].ts:6192` | پیاده‌سازی مدل کامل رویدادها با قواعد تکرار. |
| **روزهای خارج از ماه (Epagomenal)** | هاردکد ۵ روز در فایل استاتیک | `calendar.ts:22`, `types/index.ts:1667` | امکان افزودن بخش روزهای خارج از سال‌شمار در ادیتور. |
| **تاریخ جاری کمپین** | تک‌ردیفی جهانی در سرور؛ بدون تفکیک کمپین | `campaign_calendar` (تک‌ردیفی) | اتصال به جدول `calendar_states` با کلید `campaign_id`. |
| **تبدیل برگشت‌پذیر روزشمار ↔ تاریخ** | **وجود ندارد** (فقط حلقه `for` گام‌به‌گام با عدد ۳۰) | `calendar.ts:70` | نوشتن الگوریتم ریاضی `epochDaysToDate` و `dateToEpochDays`. |
| **عدم تخریب تاریخ‌ها هنگام تغییر ساختار** | **وجود ندارد** (تغییر ساختار تاریخ‌ها را بی‌معنی می‌کند) | - | پایه‌گذاری تاریخ بر یک مبدأ عددی مطلق (Epoch Days). |

---

## ۹. خطرات، ناسازگاری‌ها و استراتژی مهاجرت داده

### خطرات شناسایی‌شده:
1. **تغییر طول سال یا ماه‌ها:** اگر کاربری تاریخی را به صورت متن در جلسه ثبت کرده باشد (`۱۵ زروان ۱۵۰۰`)، با تغییر نام ماه به `اردی‌مهر` یا تغییر طول ماه از ۳۰ به ۲۸، تطابق معنایی از بین می‌رود.
2. **دوگانگی نام ماه‌ها در زروانیا:** در حال حاضر دو نام‌گذاری متفاوت برای زروانیا در پروژه وجود دارد (`فرهان/زروان` در تقویم فعال، و `فرورداد/اردی‌مهر` در سید پکیج فاز ۲). پیش از هر کاری باید نام رسمی زروانیا توسط کاربر تثبیت شود.
3. **شکست کلاینت در حالت HTTP:** کلاینت واقعی به دلیل نبود اندپوینت `/calendar/advance` و عدم ذخیره‌ی `GenericCalendarData` در سرور، در اتصال به دیتابیس واقعی کار نخواهد کرد.

### راهکار پیشنهادی برای ذخیره‌سازی تاریخ‌ها:
- **ذخیره بر مبنای روزشمار مطلق (Absolute Day Index / Epoch Days):**
  به جای ذخیره کردن روز، ماه و سال در رکوردهای وابسته، زمان بازی در جدول کمپین یا جلسات به صورت یک عدد صحیح بزرگ ذخیره شود:
  `in_game_day: INTEGER` (مثلاً روز ۵۴۷۵۰۰ از مبدأ زمان).
- **نگاشت پویا (Projection):**
  هنگام نمایش، ساختار تقویم فعال کمپین فراخوانی شده و با یک تابع خالص، عدد روز به ساختار جاری (سال X، ماه Y، روز Z) نگاشت داده می‌شود. اگر DM ساختار تقویم را تغییر دهد، صرفاً نام‌گذاری و تقسیم‌بندی تغییر می‌کند و ترتیب زمانی رخدادها دست‌نخورده باقی می‌ماند.
- **مهاجرت داده‌های جلسات:**
  فیلد `in_world_date` جلسات موجود حفظ می‌شود؛ یک ستون جدید `in_game_epoch_day INTEGER` به جدول `sessions` اضافه می‌گردد. در صورت خالی بودن، متن دستی نمایش داده می‌شود.

---

## ۱۰. طرح پیشنهادی داده و API (Target Architecture)

### ۱. اصلاح اسکیما در D1:
جدول `calendar_states` و `calendars` استانداردسازی می‌شوند:
```sql
-- ۱. ساختار تقویم (تعریف ماه‌ها، هفته‌ها، جشن‌ها)
CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  era_label TEXT DEFAULT 'پ.ر.ن',
  start_year INTEGER DEFAULT 1500,
  weekdays TEXT NOT NULL DEFAULT '["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه"]',
  months TEXT NOT NULL,       -- JSON: Array<{ id, name, days, season }>
  off_days TEXT NOT NULL,     -- JSON: Array<{ id, name, note }>
  festivals TEXT NOT NULL,    -- JSON: Array<{ id, name, type: 'fixed'|'annual', month, day, note }>
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- ۲. وضعیت زمان جاری کمپین
CREATE TABLE IF NOT EXISTS campaign_calendar_states (
  campaign_id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  current_epoch_day INTEGER NOT NULL DEFAULT 0, -- روزشمار مطلق از مبدأ
  current_year INTEGER NOT NULL,
  current_month INTEGER NOT NULL,
  current_day INTEGER NOT NULL,
  is_off_day INTEGER NOT NULL DEFAULT 0,
  off_day_id INTEGER,
  current_festival TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE RESTRICT
);
```

### ۲. اندپوینت‌های REST مورد نیاز:
- `GET /api/c/:campaignId/calendar` — دریافت تقویم و وضعیت جاری زمان کمپین (مجوز: تمامی اعضای کمپین).
- `PUT /api/c/:campaignId/calendar/structure` — ویرایش ساختار تقویم شامل ماه‌ها، روزها، هفته‌ها و جشن‌ها (مجوز: فقط `owner` و `co_dm`).
- `POST /api/c/:campaignId/calendar/advance` — پیشبرد روزشمار زمان بازی (مثلاً +۱ روز، +۷ روز) و محاسبه‌ی خودکار وضعیت جدید (مجوز: فقط `owner` و `co_dm`).
- `PUT /api/c/:campaignId/calendar/set-date` — تنظیم مستقیم تاریخ بازی به یک روز مشخص (مجوز: فقط `owner` و `co_dm`).

---

## ۱۱. نقشه‌ی راه ۳ فازی پیاده‌سازی (Implementation Roadmap)

### فاز ۱: انتزاع لایه‌ی داده و یکپارچه‌سازی بک‌اند (بدون تغییر ظاهر UI)
- **هدف:** رفع نقص اندپوینت‌های سرور، ایجاد اندپوینت‌های استاندارد `/api/c/:campaignId/calendar`، پیاده‌سازی توابع تبدیل ریاضی دوطرفه (`epochDaysToDate` و `dateToEpochDays`) در `shared/`.
- **برآورد هزینه:** ۴ تا ۶ ساعت کار مهندسی.
- **سطح ریسک:** کم (رفتار ظاهری کلاینت حفظ می‌شود و فقط زیرساخت همگام می‌شود).

### فاز ۲: فرم و رابط کاربری ویرایش تقویم توسط DM
- **هدف:** طراحی مدال جامع تنظیم تقویم در داشبورد DM (`DmSettings` یا `DmLibrary`):
  - ویرایش نام و تعداد روزهای هر ماه (با امکان کم و زیاد کردن ماه‌ها).
  - ویرایش نام و تعداد روزهای هفته.
  - ویرایش روزهای برون‌گاه (خارج از سال‌شمار).
  - تعیین مبدأ سال و نام دوره‌ی تاریخی.
- **برآورد هزینه:** ۶ تا ۸ ساعت کار مهندسی.
- **سطح ریسک:** متوسط (نیازمند اعتبارسنجی ورودی‌ها و ممانعت از طول ماه صفر یا منفی).

### فاز ۳: سیستم پیشرفته‌ی جشن‌ها، وقایع تقویمی و تطبیق جلسات
- **هدف:** افزودن جشن‌ها با قواعد تکرار (تکرار سالانه، رویداد فصلی، دوره‌ای)، ثبت تاریخ بازی در جلسات با انتخابگر تقویمی (Date Picker اختصاصی مبتنی بر گاه‌شمار کمپین)، و اتصال تقویم به دانشنامه (`CodexTab`).
- **برآورد هزینه:** ۶ تا ۱۰ ساعت کار مهندسی.
- **سطح ریسک:** کم تا متوسط.

---

## ۱۲. سؤالات و ابهامات کلیدی برای تصمیم‌گیری مالک (Open Questions)

۱. **کدام نام‌گذاری برای زروانیا متن رسمی (Canon) است؟**
   - گزینه‌ی ۱: فرهان، زروان، ورنان، آریامان، دیوگان، گدازان، پیمان، کندان، مهگان، یخبندان، آذران، واپسان (همراه با ۵ روز لرزش، گمگشتگی آب، بینامی، خاموشی آتش، بند).
   - گزینه‌ی ۲: فرورداد، اردی‌مهر، خورداد، ... (همراه با گاه‌های اهنود، اشتود، سپنتمد، وهوخشتر، وهیشتوآیشت).
۲. **نحوه‌ی تعامل روزهای برون‌گاه با روزهای هفته چیست؟**
   - آیا ۵ روز برون‌گاه داخل چرخه‌ی روزهای هفته هستند، یا خارج از هفته شمرده می‌شوند (به این معنی که بعد از روزهای برون‌گاه، اولین روز سال نو همیشه اولین روز هفته است)؟
۳. **قواعد سال کبیسه:**
   - آیا جهان بازی نیاز به سیستم کبیسه دارد یا تقویم به صورت مطلق و بدون تغییر حرکت می‌کند؟
۴. **میزان دسترسی بازیکنان:**
   - آیا بازیکنان می‌توانند کل تقویم، جشن‌ها و روزهای سال را مشاهده کنند (حالت پیش‌فرض)، یا بخش‌هایی از آن باید برای DM پنهان باشد؟
