# چک‌لیست قابلیت نقشه‌ی اصلی کمپین (Campaign Main Map)

آخرین به‌روزرسانی: مرحله ج (ابزار ویرایش DM و کتابخانه استمپ‌ها) / ۱۴۰۵-۰۸-۱۷ (2026-11-08)

راهنما: `[ ]` انجام‌نشده | `[~]` ناقص | `[x]` انجام و تأییدشده | `[!]` مسدود

---

## پکیج‌های نصب‌شده
- `leaflet`: `^1.9.4`
- `@types/leaflet`: `^1.9.22`
- `react-leaflet`: `^5.0.0`
- `@geoman-io/leaflet-geoman-free`: `^2.20.6`

---

## مرحله ۰: آماده‌سازی (۴ از ۴ انجام شد)
- [x] بررسی کدهای مرتبط موجود (`DmHandoutManager`, `MapViewer`, `handoutEngine`, `api.ts`, `permissions.ts`, `App.tsx`) بدون شکستن قابلیت‌های فعلی `MapViewer`
- [x] نصب پکیج‌های مورد نیاز با نسخه‌های دقیق بالا
- [x] تعریف توکن‌های معنایی عوارض زمین (`forest`, `water`, `mountain`, `desert`, `swamp`, `road`, `border`) در `src/styles/theme.css` برای تم تاریک و روشن
- [x] اجرای موفق گاردریل‌های استایل و تایپ‌چک (`npm run lint:styles` و `npm run typecheck`)

فایل‌های تغییرکرده/ساخته‌شده در مرحله ۰:
- `package.json`
- `src/styles/theme.css`
- `docs/MAP_FEATURE_CHECKLIST.md`

---

## مرحله الف: مدل داده و API (LocalApi + seed) (۶ از ۶ انجام شد)
- [x] تعریف تایپ‌های TypeScript برای نقشه، فیچرها، نشانه‌ها و استمپ‌ها در `src/types/index.ts` (`CampaignMap`, `MapFeature`, `MapStamp`, `MapFeatureKind`, `MapTerrainType`, `MapMarkerType`, `MapGeometry`, `MapFeatureStyle`)
- [x] اعتبارسنجی فیچرها، هندسه، استایل، طول برچسب و نام‌گذاری امن در `shared/rules/mapEngine.ts`
- [x] تست‌های واحد اعتبارسنجی موتور نقشه در `shared/rules/mapEngine.test.ts` (۱۷ تست) و `shared/rules/mapLocalApi.test.ts` (۱۱ تست) — در مجموع ۲۸ تست پاس‌شده
- [x] آماده‌سازی متدهای نقشه در `LocalApi` و کلاینت `HttpApi` در `src/services/api.ts` با کنترل دسترسی `can(role, 'dm_tools:handouts_maps')` و فیلتر المان‌های مخفی برای بازیکنان (اندپوینت‌های سمت سرور D1 در مرحله د پیاده می‌شوند)
- [x] افزودن نقشه‌ی اصلی نمونه زروانیا با عوارض زمین، مرز، نشانه‌های مکانی/NPC/دشمن و استمپ در `src/data/seed.ts` و فایل‌های وکتور `public/maps/zorvania-main.svg` و `public/stamps/fortress.svg`
- [x] مکانیزم کنترل تعارض همزمانی (Optimistic Concurrency) با فیلد `revision` و اعتبارسنجی `expectedRevision` با خطای فارسی استاندارد

فایل‌های تغییرکرده/ساخته‌شده در مرحله الف:
- `src/types/index.ts`
- `shared/rules/mapEngine.ts`
- `shared/rules/mapEngine.test.ts`
- `shared/rules/mapLocalApi.test.ts`
- `src/services/api.ts`
- `src/data/seed.ts`
- `public/maps/zorvania-main.svg`
- `public/stamps/fortress.svg`

---

## مرحله ب: نمایش نقشه (کامپوننت نقشه و حالت فقط‌خواندنی) (۸ از ۸ انجام شد)
- [x] ساخت کامپوننت پایه `CampaignMainMap.tsx` بر پایه Leaflet با `crs={L.CRS.Simple}` و `ImageOverlay` بر اساس مختصات پیکسلی `[y, x]`
- [x] تنظیم کانتینر نقشه با `dir="ltr"` در حین حفظ ساختار RTL برای پنل‌ها و لایه‌های UI پیرامون
- [x] کنترل‌های زوم و پن لمسی و دسکتاپ: pinch-to-zoom، wheel، دکمه‌های `+` / `−` و دکمه بازگشت به نمای کل نقشه (`fitBounds`) با ابعاد استاندارد touch target حداقل ۴۴px
- [x] رندر پلیگون‌های زمین (جنگل، آب، کوه، بیابان، مرداب، جاده) با رنگ‌های برگرفته از توکن‌های تم (بدون رنگ خام hex) و تمایز بصری شفافیت برای المان‌های مخفی DM
- [x] رندر پلیگون‌های خط‌چین مرز مناطق با برچسب و تولتیپ امن (`textContent` بدون `innerHTML`)
- [x] رندر نشانگرها (مکان، NPC، دشمن، کاراکتر، بازیکن) با آیکون‌های Lucide از طریق `renderToStaticMarkup` و نمایش کارت اطلاعات پیوند خورده در شیت پایین هنگام کلیک
- [x] رندر استمپ‌ها (المان‌های شخصی ثبت‌شده) با اندازه ذخیره‌شده و صرفاً از طریق تگ `<img>` (هرگز inline SVG)
- [x] پیاده‌سازی حالت فقط‌خواندنی (Read-Only) بر اساس داده‌های دریافتی از `api.getCampaignMap` بدون دستکاری کلاینتی و همراه با نشانه‌های کمرنگ و آیکون چشم‌بسته برای DM

فایل‌های تغییرکرده/ساخته‌شده در مرحله ب:
- `src/components/map/CampaignMainMap.tsx`
- `shared/rules/mapVisualEngine.ts`
- `shared/rules/mapVisualEngine.test.ts`
- `src/types/index.ts`
- `src/App.tsx`
- `docs/MAP_FEATURE_CHECKLIST.md`

---

## مرحله ج: ابزار ویرایش DM (۴ از ۴ انجام شد)
- [x] نوار ابزار ویرایش نقشه برای DM شامل:
  - رسم پلیگون زمین (Terrain) با زیرمنوی انتخاب نوع
  - رسم مرز منطقه (Region Border)
  - قرار دادن نشانگر (Marker) با زیرمنوی انتخاب نوع
  - قرار دادن استمپ از کتابخانه (Stamp)
  - حالت ویرایش و جابه‌جایی هندسه (Edit & Drag) بدون تخریب هندل‌های Geoman
  - حذف آیتم (Delete)
  - واگرد ساده (Undo) برای آخرین اقدام
- [x] پنل کناری / شیت پایینی ویرایش مشخصات فیچر انتخاب‌شده (`MapFeatureEditSheet.tsx` شامل تغییر نام، توضیحات، نوع، پیوند به مکان/NPC/کاراکتر، سوئیچ «نمایش برای بازیکنان» با پیش‌فرض مخفی، اسلایدر مقیاس استمپ)
- [x] کتابخانه استمپ‌های کمپین (`StampLibraryModal.tsx` و `StampCanvasDrawer.tsx`):
  - آپلود تصویر PNG/JPEG/WebP، بررسی magic bytes و رد قاطع SVG و فشرده‌سازی تا سقف ۱۵۰KB
  - کشیدن دستی روی `<canvas>` با Pointer Events، پس‌زمینه شفاف، `touch-action: none`، رنگ‌های توکن تم، پاک‌کن و ذخیره به عنوان PNG
  - درج چندباره استمپ روی نقشه با اسلایدر تغییر ابعاد
- [x] مکانیزم ذخیره با Debounce (۷۰۰ میلی‌ثانیه)، ارسال `expectedRevision`، و مدیریت Conflict خطای همزمانی بر اساس `revision` به زبان فارسی همراه با دکمه بارگذاری مجدد و نشانگر وضعیت ذخیره
- [x] سلب دسترسی کامل برای کاربران غیر DM و ایجاد تست‌های رد مجوزهای نوشتن در `LocalApi`

فایل‌های تغییرکرده/ساخته‌شده در مرحله ج:
- `src/components/map/StampCanvasDrawer.tsx`
- `src/components/map/StampLibraryModal.tsx`
- `src/components/map/MapFeatureEditSheet.tsx`
- `src/components/map/CampaignMainMap.tsx`
- `shared/rules/mapEngine.ts`
- `shared/rules/mapEngine.test.ts`
- `shared/rules/mapLocalApi.test.ts`
- `docs/MAP_FEATURE_CHECKLIST.md`

---

## مرحله د: سرور و دیتابیس (۵ از ۵ انجام شد)
- [x] ایجاد فایل migration جدید در `migrations/021_campaign_main_map.sql` برای جداول `campaign_maps`, `map_stamps`, `map_features` همراه با ایندکس یکتا برای یک نقشه‌ی اصلی در هر کمپین و هماهنگ‌سازی با `schema.sql`
- [x] پیاده‌سازی endpointهای کامل در `functions/api/[[route]].ts`:
  - `GET /api/c/:id/maps` و `GET /api/c/:id/maps/:mapId` (اعمال فیلتر سروری `is_revealed = 1` داخل کوئری SQL برای بازیکنان/ناظران و مخفی‌سازی کامل یادداشت‌ها و المان‌های مخفی)
  - `POST /api/c/:id/maps` و `PATCH /api/c/:id/maps/:mapId` (همراه با مکانیزم اتمیک revision و بازگرداندن خطای همزمانی ۴۰۹)
  - `POST /api/c/:id/maps/:mapId/features` (اعتبارسنجی ورودی‌ها، سقف ۱۰۰ رأس پلیگون، سقف ۵۰۰ عارضه، جلوگیری از IDOR و محدودسازی مختصات به ابعاد نقشه)
  - `PATCH /api/c/:id/maps/:mapId/features/:featureId`
  - `DELETE /api/c/:id/maps/:mapId/features/:featureId`
  - `GET /api/c/:id/map-stamps`
  - `POST /api/c/:id/map-stamps` (اعتبارسنجی magic bytes، رد SVG، سقف ۱۵۰KB و هدر `X-Content-Type-Options: nosniff`)
  - `DELETE /api/c/:id/map-stamps/:stampId`
- [x] کنترل دسترسی سروری بر اساس عضویت کمپین (عضو نبودن = ۴۰۴ قطعی)، بررسی مجوز با `can(role, 'dm_tools:handouts_maps')` برای ویرایش‌ها و ثبت تمام جهش‌ها در `audit_log`
- [x] تطبیق و پیاده‌سازی متدهای متناظر در `HttpApi` در `src/services/api.ts`
- [x] تست‌های سروری و بررسی یکپارچگی D1 و API در `shared/rules/serverMap.test.ts` (۱۵ تست پاس‌شده)

---

## مرحله ه: اتصال به صفحه‌ی اصلی (۴ آیتم باقی‌مانده)
- [ ] اتصال روت `#c/:id/overview` به عنوان نمای پیش‌فرض DM و بازیکنان برای نقشه‌ی اصلی کمپین
- [ ] مدیریت حالت خالی (Empty State) با دکمه و مودال آپلود نقشه‌ی اصلی برای DM
- [ ] همگام‌سازی دسترسی و نقش کاربر (`owner` / `co_dm` در برابر `player` / `spectator`)
- [ ] تعبیه در `App.tsx` با رعایت ارتفاع کامل و قرارگیری هماهنگ در بالای `BottomNav`

---

## کیفیت و گاردریل‌ها (۳ از ۵ قطعی + ۲ نیازمند بررسی بصری)
- [x] اجرای بدون خطای `npm run check` (شامل typecheck, lint, lint:styles, lint:nav, build) و `npm test` (۴۴۶ تست سبز)
- [~] رعایت کامل RTL و پراپرتی‌های منطقی (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) در کامپوننت‌های نقشه و شیت‌های ویرایش (فقط کد؛ بررسی بصری انجام نشده)
- [~] ابعاد حداقل ۴۴px برای تمام المان‌ها و دکمه‌های کنترلی لمسی (فقط کد؛ بررسی بصری انجام نشده)
- [x] عدم استفاده از رنگ‌های خام hex یا کلاس‌های پیش‌فرض پالت تیل‌ویند در کامپوننت‌های نقشه و استمپ‌ها (تأییدشده با `lint:styles` روی ۱۷۴ فایل)
- [x] عدم استفاده از `innerHTML` در ساخت برچسب‌ها و متون برای پیشگیری از XSS (تأییدشده با جستجو و کد)

---

## یافته‌های جدید
- **جداسازی کامل نقش کمپین از نقش سراسری در سرور**: طبق قوانین جداسازی دامنه‌ها، احراز هویت در اندپوینت‌های نقشه و استمپ‌ها صرفاً بر پایه‌ی جدول `campaign_members` عمل می‌کند و کاربر غیرعضو در هر شرایطی پاسخ ۴۰۴ دریافت می‌کند.
- **ترتیب فشرده‌سازی و محدودسازی مختصات**: مختصات نقاط و چندضلعی‌ها قبل از ارزیابی نهایی `validateMapFeaturePayload` به ابعاد مرزی نقشه `[width, height]` مقید (clamp) می‌شوند تا مقادیر اندکی بیرون از مرز به نرمی به لبه‌های مجاز فیت شوند.
- **تأیید فعال بودن روت dev فقط در حالت توسعه**: مسیر موقت `#/dev/map/:campaignId` با `import.meta.env.DEV` محدود شده و در بیلد تولیدی (Production Build) اجرا نمی‌شود.

---

## وضعیت تأیید
| مرحله | اجرا شد؟ | تست شد؟ | وضعیت دستی / بازخورد کاربر |
| :--- | :---: | :---: | :--- |
| مرحله ۰: آماده‌سازی | بله | بله | تأیید کاربر |
| مرحله الف: مدل داده و API | بله | بله | تأیید کاربر |
| مرحله ب: نمایش نقشه | بله | بله (تست‌های واحد) | تأیید کاربر |
| مرحله ج: ابزار ویرایش DM | بله | بله (تست‌های واحد) | تأیید کاربر |
| مرحله د: سرور و دیتابیس | بله | بله (۱۵ تست سروری + ۴۴۶ تست کل پروژه) | بررسی نشد |
| مرحله ه: اتصال به صفحه‌ی اصلی | خیر | اجرا نشده | بررسی نشد |
