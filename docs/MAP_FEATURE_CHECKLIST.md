# چک‌لیست قابلیت نقشه‌ی اصلی کمپین (Campaign Main Map)

آخرین به‌روزرسانی: مرحله الف (مدل داده و LocalApi) / ۱۴۰۵-۰۸-۱۷ (2026-11-08)

راهنما: `[ ]` انجام‌نشده | `[~]` ناقص | `[x]` انجام و تأییدشده | `[!]` مسدود

---

## پکیج‌های نصب‌شده
- `leaflet`: `^1.9.4`
- `@types/leaflet`: `^1.9.22`
- `react-leaflet`: `^5.0.0`
- `@geoman-io/leaflet-geoman-free`: `^2.20.6`

---

## مرحله ۰: آماده‌سازی (انجام شد)
- [x] بررسی کدهای مرتبط موجود (`DmHandoutManager`, `MapViewer`, `handoutEngine`, `api.ts`, `permissions.ts`, `App.tsx`) بدون شکستن قابلیت‌های فعلی `MapViewer`
- [x] نصب پکیج‌های مورد نیاز با نسخه‌های دقیق بالا
- [x] تعریف توکن‌های معنایی عوارض زمین (`forest`, `water`, `mountain`, `desert`, `swamp`, `road`, `border`) در `src/styles/theme.css` برای تم تاریک و روشن
- [x] اجرای موفق گاردریل‌های استایل و تایپ‌چک (`npm run lint:styles` و `npm run typecheck`)

فایل‌های تغییرکرده/ساخته‌شده در مرحله ۰:
- `package.json`
- `src/styles/theme.css`
- `docs/MAP_FEATURE_CHECKLIST.md`

---

## مرحله الف: مدل داده و API (LocalApi + seed) (انجام شد)
- [x] تعریف تایپ‌های TypeScript برای نقشه، فیچرها، نشانه‌ها و استمپ‌ها در `src/types/index.ts` (`CampaignMap`, `MapFeature`, `MapStamp`, `MapFeatureKind`, `MapTerrainType`, `MapMarkerType`, `MapGeometry`, `MapFeatureStyle`)
- [x] اعتبارسنجی فیچرها، هندسه، استایل، طول برچسب و نام‌گذاری امن در `shared/rules/mapEngine.ts`
- [x] تست‌های واحد اعتبارسنجی موتور نقشه در `shared/rules/mapEngine.test.ts` (۱۷ تست) و `shared/rules/mapLocalApi.test.ts` (۱۱ تست) — در مجموع ۲۸ تست پاس‌شده
- [x] پیاده‌سازی کامل متدهای نقشه در `LocalApi` و `HttpApi` در `src/services/api.ts` با کنترل دسترسی `can(role, 'dm_tools:handouts_maps')` و فیلتر المان‌های مخفی برای بازیکنان
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

## مرحله ب: نمایش نقشه (کامپوننت نقشه و حالت فقط‌خواندنی) — ۲۱ آیتم کل باقی‌مانده
- [ ] ساخت کامپوننت پایه `CampaignMainMap.tsx` بر پایه Leaflet با `crs={L.CRS.Simple}` و `ImageOverlay` بر اساس مختصات پیکسلی `[y, x]`
- [ ] تنظیم کانتینر نقشه با `dir="ltr"` در حین حفظ ساختار RTL برای پنل‌ها و لایه‌های UI پیرامون
- [ ] کنترل‌های زوم و پن لمسی و دسکتاپ: pinch-to-zoom، wheel، دکمه‌های `+` / `−` و دکمه بازگشت به نمای کل نقشه (`fitBounds`)
- [ ] رندر پلیگون‌های زمین (جنگل، آب، کوه، بیابان، مرداب، جاده) با رنگ‌های برگرفته از توکن‌های تم
- [ ] رندر پلیگون‌های خط‌چین مرز مناطق با برچسب و تولتیپ امن (`textContent` بدون `innerHTML`)
- [ ] رندر نشانگرها (مکان، NPC، دشمن، کاراکتر، بازیکن) با آیکون‌های Lucide و نمایش کارت اطلاعات پیوند خورده در هنگام کلیک
- [ ] رندر استمپ‌ها (المان‌های شخصی ثبت‌شده) با اندازه و زاویه مشخص
- [ ] پیاده‌سازی حالت فقط‌خواندنی (Read-Only) برای بازیکنان و تماشاچیان با فیلتر کامل المان‌های مخفی

---

## مرحله ج: ابزار ویرایش DM
- [ ] نوار ابزار ویرایش نقشه برای DM شامل:
  - رسم پلیگون زمین (Terrain)
  - رسم مرز منطقه (Region Border)
  - قرار دادن نشانگر (Marker)
  - قرار دادن استمپ از کتابخانه (Stamp)
  - حالت ویرایش و جابه‌جایی هندسه (Edit & Drag)
  - حذف آیتم (Delete)
  - واگرد ساده (Undo) برای آخرین اقدام
- [ ] پنل کناری / شیت پایینی ویرایش مشخصات فیچر انتخاب‌شده (تغییر نام، توضیحات، رنگ/نوع، پیوند به مکان/NPC، سوئیچ «نمایش برای بازیکنان»)
- [ ] کتابخانه استمپ‌های کمپین:
  - آپلود تصویر و فشرده‌سازی کلاینتی تا سقف ۱۵۰KB
  - کشیدن دستی روی `<canvas>` با Pointer Events و ذخیره به عنوان استمپ شفاف
  - درج چندباره استمپ روی نقشه با اسلایدر تغییر ابعاد
- [ ] مکانیزم ذخیره با Debounce و مدیریت Conflict خطای همزمانی بر اساس `revision` به زبان فارسی

---

## مرحله د: سرور و دیتابیس
- [ ] ایجاد فایل migration جدید در `migrations/` برای جداول `campaign_maps`, `map_stamps`, `map_features`
- [ ] پیاده‌سازی endpointهای کامل در `functions/api/[[route]].ts`:
  - `GET /api/c/:id/maps` و `GET /api/c/:id/maps/:mapId` (اعمال فیلتر سروری `is_revealed = 1` برای بازیکنان/ناظران)
  - `POST /api/c/:id/maps` و `PATCH /api/c/:id/maps/:mapId`
  - `POST /api/c/:id/maps/:mapId/features`
  - `PATCH /api/c/:id/maps/:mapId/features/:featureId`
  - `DELETE /api/c/:id/maps/:mapId/features/:featureId`
  - `GET /api/c/:id/map-stamps`
  - `POST /api/c/:id/map-stamps`
  - `DELETE /api/c/:id/map-stamps/:stampId`
- [ ] کنترل دسترسی سروری با `can(role, 'dm_tools:handouts_maps')` و ثبت تغییرات در `audit_log`
- [ ] تطبیق و پیاده‌سازی متدهای متناظر در `HttpApi` در `src/services/api.ts`
- [ ] تست‌های سروری و بررسی یکپارچگی D1 و API

---

## مرحله ه: اتصال به صفحه‌ی اصلی
- [ ] اتصال روت `#c/:id/overview` به عنوان نمای پیش‌فرض DM و بازیکنان برای نقشه‌ی اصلی کمپین
- [ ] مدیریت حالت خالی (Empty State) با دکمه و مودال آپلود نقشه‌ی اصلی برای DM
- [ ] همگام‌سازی دسترسی و نقش کاربر (`owner` / `co_dm` در برابر `player` / `spectator`)
- [ ] تعبیه در `App.tsx` با رعایت ارتفاع کامل و قرارگیری هماهنگ در بالای `BottomNav`

---

## کیفیت و گاردریل‌ها (بررسی مستمر)
- [x] اجرای بدون خطای `npm run check` (شامل typecheck, lint, lint:styles, lint:nav, build) و `npm test` (۴۱۰ تست سبز)
- [ ] رعایت کامل RTL و پراپرتی‌های منطقی (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) در کامپوننت نقشه
- [ ] ابعاد حداقل ۴۴px برای تمام المان‌ها و دکمه‌های کنترلی لمسی
- [ ] عدم استفاده از رنگ‌های خام hex یا کلاس‌های پیش‌فرض پالت تیل‌ویند در کامپوننت‌های نقشه
- [ ] عدم استفاده از `innerHTML` در ساخت برچسب‌ها و متون برای پیشگیری از XSS

---

## وضعیت تأیید
| مرحله | اجرا شد؟ | تست شد؟ | توضیح |
| :--- | :---: | :---: | :--- |
| مرحله ۰: آماده‌سازی | بله | بله | پکیج‌ها نصب شدند، توکن‌های تم اضافه شدند، و تمامی تست‌ها و گاردریل‌ها پاس شدند. |
| مرحله الف: مدل داده و API | بله | بله | مدل داده، mapEngine، seed، LocalApi و ۲۸ تست پاس شدند؛ آماده تأیید برای رفتن به مرحله ب. |
| مرحله ب: نمایش نقشه | خیر | اجرا نشده | در انتظار تأیید کاربر برای شروع. |
| مرحله ج: ابزار ویرایش DM | خیر | اجرا نشده | در انتظار اجرای مرحله ب. |
| مرحله د: سرور و دیتابیس | خیر | اجرا نشده | در انتظار اجرای مرحله ج. |
| مرحله ه: اتصال به صفحه‌ی اصلی | خیر | اجرا نشده | در انتظار اجرای مرحله د. |
