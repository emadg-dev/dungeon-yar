# راهنمای سیستم طراحی دانجن‌یار

> منبع حقیقت تمام استایل‌ها: **`src/styles/theme.css`**
> قانون اصلی: هیچ رنگ، فونت، اندازه یا فاصله‌ای خارج از این فایل تعریف نمی‌شود. برای عوض کردن ظاهر اپ، فقط مقدار توکن‌ها را در همین فایل عوض کن.

---

## ۱. ساختار فایل‌ها

| فایل | نقش |
|---|---|
| `src/styles/theme.css` | توکن‌ها، `@font-face`، تم روشن/تاریک، کلاس‌های کامپوننتی و کمکی |
| `src/styles/tokens.css` | فقط `@import "./theme.css"` (برای سازگاری با کد قدیمی؛ چیزی اینجا تعریف نشود) |
| `src/index.css` | import کردن `theme.css` و اتصال توکن‌ها به Tailwind از طریق `@theme` |
| `src/components/ui/` | کامپوننت‌های پایه (Button، Card، Input و ...)؛ تنها جایی که استایل پایه‌ی اجزا تعریف می‌شود |
| `scripts/lint-styles.mjs` | نگهبان خودکار؛ هر تخلف از قوانین این سند را خطا می‌گیرد |

---

## ۲. «اگر بخواهم X را عوض کنم، کجا بروم؟»

| تغییر مورد نظر | توکن در `theme.css` |
|---|---|
| پس‌زمینه‌ی کل اپ | `--color-bg` / `--color-bg-rgb` |
| کارت‌ها و پنل‌ها | `--color-surface` |
| ورودی‌ها، چیپ‌ها، کارت‌های لایه‌ی دوم | `--color-surface-raised` / `--color-surface-2` |
| کادرها و جداکننده‌ها | `--color-border`, `--color-border-strong`, `--color-border-subtle` |
| متن اصلی | `--color-text` |
| متن ثانویه | `--color-text-muted` |
| متن غیرفعال | `--color-text-disabled` |
| رنگ برند / دکمه‌ی اصلی | `--color-primary`, `--color-primary-hover`, `--color-accent` |
| متن روی دکمه‌ی کهربایی | `--color-on-accent` |
| خطر / حذف | `--color-danger` |
| موفقیت / درمان | `--color-success` |
| هشدار | `--color-warning` |
| اطلاعات | `--color-info` |
| HP و حالت‌هایش | `--stat-hp`, `--stat-hp-hurt`, `--stat-hp-bloodied`, `--stat-hp-critical`, `--stat-hp-dead`, `--stat-temp-hp` |
| AC، ابتکار، سرعت، اسلات جادو | `--stat-ac`, `--stat-initiative`, `--stat-speed`, `--stat-spell-slot` |
| تاس نچرال ۲۰ / ۱ / مخفی | `--dice-nat20`, `--dice-nat1`, `--dice-secret` |
| رنگ نقش‌ها | `--role-owner`, `--role-codm`, `--role-player`, `--role-spectator` |
| فونت متن / عنوان / کد / اعداد | `--font-body`, `--font-heading`, `--font-mono`, `--font-numeric` |
| مقیاس اندازه‌ی متن | `--text-2xs` تا `--text-3xl` (کف ۱۳px) |
| فاصله‌ها | `--space-*` |
| گردی گوشه‌ها | `--radius-*` (کارت: `--radius-card`) |
| سایه و درخشش | `--shadow-*`, `--shadow-glow-amber` |
| ارتفاع هدر / نوار پایین / دکمه / ورودی | `--header-height`, `--bottom-nav-height`, `--btn-height`, `--input-height` |
| ترتیب لایه‌ها | `--z-header`, `--z-modal`, `--z-sheet`, `--z-toast` |

### مثال‌ها

**عوض کردن فونت کل اپ:** در ابتدای `theme.css` `@font-face` فونت جدید را اضافه کن و `--font-body` را به آن اشاره بده.

**رنگ برند از کهربایی به سبز:** مقدار `--color-primary`، `--color-primary-hover` و `--color-accent` (و نسخه‌های `-rgb` آنها) را عوض کن.

**گردتر کردن همه‌ی کارت‌ها:** `--radius-card` را بزرگ‌تر کن.

---

## ۳. تم روشن و تاریک

- تم پیش‌فرض تاریک است (توکن‌ها روی `:root`).
- تم روشن فقط با بازنویسی **مقدار توکن‌ها** در `[data-theme="light"]` ساخته می‌شود؛ هیچ کلاس کامپوننتی برای تم روشن جدا نوشته نمی‌شود.
- هر توکن جدید که اضافه می‌کنی، مقدارش را برای **هر دو تم** تعریف کن، وگرنه در تم روشن خراب می‌شود.
- بعد از هر تغییر رنگ، کنتراست جفت‌های متن/پس‌زمینه را در هر دو تم بررسی کن (حداقل WCAG AA: ۴.۵:۱).

---

## ۴. قوانین نوشتن کامپوننت جدید

1. **هگز، `rgb()`، `hsl()` و کلاس‌هایی مثل `text-[#...]` ممنوع است.** از کلاس‌های متصل به توکن استفاده کن: `bg-surface`, `bg-surface-2`, `text-text-primary`, `text-text-muted`, `border-border`, `text-primary`, `text-danger` و ...
2. **رنگ جدید لازم شد؟** اول توکن معنایی بساز (مثلاً `--color-warning-bg`، نه `--orange-2`) و برای هر دو تم مقدار بده.
3. **`font-family` فقط در `theme.css`.** در کامپوننت‌ها فقط از `font-body` / `font-heading` / `font-mono` (کلاس‌های متناظر) استفاده کن.
4. **اندازه‌ی متن زیر ۱۳px ممنوع.** از `text-xs` به بالا استفاده کن؛ `text-[10px]` و `text-[11px]` اجازه ندارند.
5. **از کامپوننت‌های مشترک استفاده کن، نه تگ خام:** `Button`/`IconButton` به‌جای `<button>`، `Input`، `Select`، `Textarea`، `Card`، `Badge`، `Chip`، `TabStrip`، `EmptyState`، `ErrorState`.
6. **اگر واریانت جدید لازم است، به کامپوننت پایه اضافه کن** (یا کلاس جدید در `theme.css`)، نه استایل محلی در همان صفحه.
7. **فقط ویژگی‌های منطقی RTL:** `ms-*` / `me-*` / `ps-*` / `pe-*` / `text-start` / `text-end`. استفاده از `ml-` / `mr-` / `pl-` / `pr-` / `text-left` / `text-right` فقط برای محتوای LTR (اعداد، کد، تاس) با `dir="ltr"` یا کلاس‌های `tabular-nums`، `dice-ltr` مجاز است.
8. **استایل inline فقط برای مقدار محاسباتی زمان اجرا.** مثلاً ارتفاع آیتم‌های `VirtualList`، ابعاد `SafeImage` یا رنگ پویای اقلیم (`regionAccent`). موارد دیگر باید در `INLINE_STYLE_ALLOWLIST` داخل `scripts/lint-styles.mjs` با دلیل ثبت شوند.
9. **رنگ وابسته به وضعیت را با `data-*` یا کلاس شرطی بده**، نه با inline style (مثلاً `data-status="pending"`).
10. **اهداف لمسی حداقل ۴۴px:** از `.touch-target` یا `--btn-height` استفاده کن.
11. **رنگ آیکون‌ها و SVG:** `currentColor` یا `var(--...)`؛ هگز مستقیم در `fill`/`stroke` نه.
12. **رنگ‌های برند خارجی** (مثل لوگوی گوگل) رنگ تم نیستند. اگر لازم‌اند، با توکن جدا (`--brand-*`) یا در allowlist مستند ثبت شوند.

---

## ۵. کلاس‌های موجود در `theme.css`

- **دکمه‌ها:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-outline`, `.btn-sm`
- **کارت‌ها:** `.card`, `.card-raised`, `.card-gold-top`, `.surface-card`
- **فرم:** `.input`, `.select`, `.textarea`, `.label`
- **نشان‌ها:** `.badge`, `.badge-owner`, `.badge-codm`, `.badge-player`, `.badge-spectator`
- **تب‌ها:** `.tabs`, `.tab`, `.tab-active`
- **مودال و شیت:** `.modal-backdrop`, `.modal-sheet`, `.sheet-drag-handle`
- **وضعیت‌ها:** `.stat-hp`, `.stat-ac`, `.empty-state`, `.error-state`
- **کمکی:** `.touch-target`, `.text-gold`, `.text-gold-glow`, `.border-fantasy`, `.bg-fantasy-surface`

> نام‌ها از گزارش‌های AI Studio گرفته شده؛ قبل از تکیه کردن، با `theme.css` واقعی تطبیق بده و این فهرست را به‌روز نگه دار.

---

## ۶. چک‌لیست قبل از commit

- [ ] `npm run lint:styles` بدون خطا
- [ ] `npm run typecheck` و `npm run lint` و `npm test` و `npm run build` پاس
- [ ] صفحه‌ی جدید را در **هر دو تم** (تاریک و `data-theme="light"`) دیدم
- [ ] صفحه‌ی جدید را روی موبایل (عرض حدود ۳۶۰px) دیدم
- [ ] هیچ استثنای جدیدی به allowlist اضافه نشده، یا اگر شده دلیلش کنارش نوشته شده

### آزمون سریع «آیا همه‌چیز متمرکز است؟»

مقدار `--color-primary` را موقتاً به یک رنگ بسیار متفاوت (مثلاً سبز فسفری) تغییر بده و چند صفحه را بگرد. هرجا هنوز رنگ قبلی دیده شد، یک استایل پراکنده باقی مانده است. بعد از آزمون، مقدار را برگردان.

---

## ۷. پرامپت ثابت برای AI Studio (هنگام ساخت فیچر جدید)

> این پروژه یک سیستم طراحی متمرکز در `src/styles/theme.css` دارد و قوانین آن در `docs/design-system.md` آمده است. در هر تغییر یا فیچر جدید: هیچ هگز/rgb/hsl، کلاس رنگی `[#...]`، `font-family`، اندازه‌ی متن زیر ۱۳px، استایل inline غیرمحاسباتی یا تگ خام `<button>/<input>/<select>/<textarea>` ننویس. فقط از توکن‌ها، کلاس‌های `theme.css` و کامپوننت‌های `src/components/ui/` استفاده کن و فقط ویژگی‌های منطقی RTL به کار ببر. اگر به رنگ یا واریانت جدید نیاز بود، اول توکن/کلاس را در `theme.css` (برای هر دو تم) اضافه کن و بعد استفاده کن. در پایان `npm run lint:styles` و `npm run check` را اجرا کن.
