# راهنمای سبک و معماری کامپوننت‌ها (Style Guide & Component Architecture)
**نسخه:** مرحله A4 — گاردریل‌ها و استانداردسازی کامپوننت‌های رابط کاربری  
**مرجع توکن‌ها:** `/src/styles/tokens.css`  
**کتابخانه کامپوننت‌های پایه:** `/src/components/ui/`  
**آدرس گالری کامپوننت‌ها:** `#/dev/ui` (محیط توسعه)

---

## ۱. فلسفه طراحی و هویت بصری (Visual Identity)
- **پالت رنگی:** زغالی/مرکب عمیق به عنوان پس‌زمینه (`--color-bg`), سطوح شیشه‌ای و چرمی گرم (`--color-surface`, `--color-surface-2`), حاشیه‌های پوست‌نوشت (`--color-border`), و درخشش کهربایی/طلایی گرم (`--color-accent`, `--color-accent-hover`).
- **تایپوگرافی:** فونت رسمی فارسی **Vazirmatn** با مقیاس بدنه ۱۵ پیکسل و حداقل اندازه متن ۱۳ پیکسل.
- **موبایل‌فرست (۳۲۰ تا ۴۳۰ پیکسل):** طراحی ارگونومیک برای کار با یک دست، پدینگ‌های امن (`env(safe-area-inset-*)`) و جلوگیری از زوم خودکار سافاری در موبایل با تنظیم اندازه ورودی‌ها روی ۱۶ پیکسل.

---

## ۲. توکن‌های معنایی طراحی (Design Tokens API)

تمامی رنگ‌ها در کدهای کلاینت باید از طریق متغیرهای CSS معنایی یا کلاس‌های توکن تیلویند استفاده شوند:

### ۲.۱. رنگ‌ها و کانال‌های RGB
| نام توکن CSS | کلاس تیلویند | رنگ معادل | کاربرد |
|---|---|---|---|
| `--color-bg-rgb` | `bg-bg` | `#0E0D0C` | پس‌زمینه سراسری صفحه و مودال‌ها |
| `--color-surface-rgb` | `bg-surface` | `#171513` | پنل‌های اصلی، کارت‌ها و هدر |
| `--color-surface-2-rgb` | `bg-surface-2` | `#201D19` | کارت‌های تو در تو، فیلدها و چیپ‌ها |
| `--color-surface-3-rgb` | `bg-surface-3` | `#2F2A23` | سطوح با ارتفاع بالاتر |
| `--color-border-rgb` | `border-border` | `#2F2A23` | خطوط مرزی استاندارد |
| `--color-border-strong-rgb` | `border-border-strong` | `#3A342B` | جداکننده‌ها و خطوط فعال |
| `--color-text-rgb` | `text-text-primary` | `#EDE6D8` | متن اصلی پوست‌نوشت |
| `--color-text-muted-rgb` | `text-text-muted` | `#A39A89` | متن ثانویه و توضیحات |
| `--color-text-disabled-rgb` | `text-text-disabled` | `#736B5E` | متن فرعی و عناصر غیرفعال |
| `--color-accent-rgb` | `bg-accent`, `text-accent` | `#E0A030` | کهربایی اصلی، دکمه‌های اقدام |
| `--color-accent-hover-rgb` | `text-accent-hover` | `#F2C265` | درخشش طلایی و وضعیت Hover |
| `--color-danger-rgb` | `bg-danger`, `text-danger` | `#C2512B` | اخگر، وضعیت بحرانی، اقدامات حذفی |
| `--color-success-rgb` | `bg-success`, `text-success` | `#6F9E78` | شفا، موفقیت، آنلاین |
| `--color-warning-rgb` | `bg-warning`, `text-warning` | `#D89427` | هشدار |
| `--color-info-rgb` | `bg-info`, `text-info` | `#7FB4D6` | مانا و اطلاعات |

### ۲.۲. مقیاس شعاع گوشه‌ها (Radii Scale)
- `rounded-xs`: 4px
- `rounded-sm`: 8px
- `rounded-md`: 10px
- `rounded-lg`: 12px
- `rounded-xl`: 16px
- `rounded-2xl`: 20px
- `rounded-pill` / `rounded-full`: 9999px

### ۲.۳. مقیاس لایه‌بندی (Z-Index Scale)
- محتوا: `0` (`--z-content`)
- هدر چسبان: `20` (`--z-sticky-header`)
- ناوبری داک پایین: `30` (`--z-bottom-nav`)
- دکمه اقدام شناور (FAB): `35` (`--z-fab`)
- پس‌زمینه تیره (Backdrop): `40` (`--z-backdrop`)
- کشوی پایین (Sheet): `41` (`--z-sheet`)
- اعلان‌های توست: `50` (`--z-toast`)

---

## ۳. قوانین حیاتی راست‌به‌چپ (RTL Strict Rules)

1. **ممنوعیت ویژگی‌های فیزیکی:**
   - هرگز از `left-*`, `right-*`, `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right` در کامپوننت‌های فارسی استفاده نکنید.
   - **همواره از ویژگی‌های منطقی استفاده کنید:**
     - `text-start` به جای `text-right`
     - `ps-*` به جای `pl-*` (Padding Start)
     - `pe-*` به جای `pr-*` (Padding End)
     - `ms-*` به جای `ml-*` (Margin Start)
     - `me-*` به جای `mr-*` (Margin End)
     - `start-*` به جای `left-*` (یا `right-*`)
     - `end-*` به جای `right-*` (یا `left-*`)
2. **اعداد و فرمول‌های تاس:**
   - نمایش اعداد انگلیسی و مقادیر فرمول تاس (مانند `2d20+5`) باید دارای کلاس `num-ltr` یا `dice-ltr` با صفت `dir="ltr"` و `unicode-bidi: isolate;` باشند تا ترتیب متنی به هم نریزد.
3. **آیکون‌های جهتی:**
   - فلش‌های ناوبری به جلو (`ChevronLeft`) در زبان فارسی به سمت چپ اشاره می‌کنند. جهت فلش‌ها را متناسب با جریان خواندن فارسی تنظیم کنید.

---

## ۴. استانداردهای دسترسی‌پذیری و لمسی (Accessibility & Mobile Standards)

1. **حداقل تارگت لمسی (Touch Targets):**
   - تمامی دکمه‌ها و عناصر تعاملی باید حداقل ۴۴×۴۴ پیکسل مساحت لمسی داشته باشند (`min-h-[44px]` یا کلاس `touch-target`).
2. **ورودی‌های فرم بدون زوم اجباری سافاری:**
   - تمامی فیلدهای `<input>`, `<textarea>`, `<select>` باید دارای فونت حداقل ۱۶ پیکسل باشند تا سافاری iOS روی صفحه زوم ناخواسته نکند.
3. **حلقه فوکوس کیبورد:**
   - کلیه عناصر تعاملی باید با استفاده از `focus-visible:ring-2 focus-visible:ring-amber-400` برای ناوبری با کیبورد پشتیبانی شوند.
4. **رفتار لمسی:**
   - افزودن `touch-action: manipulation` برای حذف تاخیر ۳۰۰ میلی‌ثانیه‌ای دابل‌تپ در گوشی‌های لمسی.
5. **برچسب‌های دسترسی:**
   - دکمه‌های آیکونی (`IconButton`) باید دارای ویژگی اجباری `aria-label` باشند.
   - فیلدهای ورودی باید دارای برچسب مرتبط (`<label htmlFor>`) یا `aria-label` باشند.

---

## ۵. فهرست کامپوننت‌های پایه (`/src/components/ui/`)

| کامپوننت | خواص اصلی (Props) | کاربرد |
|---|---|---|
| `Button` | `variant`, `size`, `isLoading`, `leftIcon`, `rightIcon` | دکمه‌های اصلی، ثانویه، گست و هشدار با تضمین ۴۴px |
| `IconButton` | `icon`, `aria-label`, `variant`, `size`, `shape` | دکمه‌های آیکونی فشرده با اندازه لمسی استاندارد |
| `Badge` | `variant`, `size`, `dot` | برچسب‌های وضعیت، کمیابی و دسته‌بندی |
| `Chip` | `label`, `selected`, `onClick`, `onRemove`, `badge` | چیپ‌های فیلتر، تگ‌ها و انتخابگرهای دسته‌بندی |
| `Card` | `variant`, `hasGoldTop`, `interactive`, `padding` | کارت‌های پایه، پنل شیشه‌ای و سطوح اطلاعاتی |
| `StatCard` | `label`, `value`, `subValue`, `modifier`, `icon` | نمایش مشخصات ۶ گانه، کلاس زره و سرعت کاراکتر |
| `ListRow` | `title`, `subtitle`, `leading`, `trailing`, `onClick` | ردیف‌های لیستی فشرده با اکشن کلیک |
| `Input` | `label`, `helperText`, `error`, `leftIcon`, `rightIcon` | فیلدهای ورودی متنی با اندازه ۱۶px و وضعیت خطا |
| `Textarea` | `label`, `helperText`, `error`, `rows` | جعبه متنی چندخطی برای یادداشت و پیشینه |
| `Select` | `label`, `options`, `error` | انتخابگر گزینه‌ای با آیکون بازشونده |
| `NumberStepper` | `value`, `onChange`, `min`, `max`, `step` | افزایش/کاهش عددی با دکمه‌های ۴۴px |
| `Switch` | `checked`, `onChange`, `label`, `description` | کلید دووضعیتی کشویی استاندارد موبایل |
| `Checkbox` | `checked`, `onChange`, `label`, `description` | چک‌باکس دسترسی‌پذیر با بازخورد رنگی |
| `RadioGroup` | `value`, `onChange`, `options` | گروه گزینه‌های رادیویی با پشتیبانی کیبورد |
| `TabStrip` | `tabs`, `activeTab`, `onChange`, `variant` | نوار زبانه‌ها با اسکرول افقی نرم در RTL |
| `BottomSheet` | `isOpen`, `onClose`, `title`, `footer` | کشوی پایین صفحه با درگ برای بستن و قفل اسکرول |
| `Dialog` | `isOpen`, `onClose`, `title`, `confirmLabel` | مدال تایید و گفتگوی هشدار وسط صفحه |
| `Toast` | `message`, `type`, `duration`, `onClose` | اعلان‌های گذرا با `aria-live="polite"` |
| `Skeleton` | `variant`, `width`, `height` | اسکلت متحرک خاکستری برای لودینگ پیش‌نمایش |
| `EmptyState` | `icon`, `title`, `description`, `actionLabel` | نمایش گرافیکی و متنی هنگام خالی بودن لیست‌ها |
| `ErrorState` | `title`, `message`, `onRetry`, `retryLabel` | نمایش خطا و دکمه تلاش مجدد |
| `ProgressBar` | `value`, `max`, `color`, `label` | نوار پیشرفت سلامت یا ماموریت با نقش progressbar |
| `PipTracker` | `current`, `max`, `onChange`, `label` | پیپ‌های شمارنده اسلات جادو و نجات از مرگ |
| `Avatar` | `src`, `alt`, `name`, `size`, `shape` | تصویر پرتره کاراکتر یا نماد متنی جایگزین |
| `SectionAccordion` | `title`, `subtitle`, `badge`, `defaultOpen` | بخش تاشوی آکاردئونی برای خلاصه کردن اطلاعات |
| `Spinner` | `size`, `label` | نشانگر چرخان لودینگ برای دکمه‌ها و فرم‌ها |

---

## ۶. نحوه افزودن یک کامپوننت جدید (How to Add a New Primitive)

۱. کامپوننت را در مسیر `/src/components/ui/MyComponent.tsx` بسازید.
۲. خواص کامپوننت را با اینترفیس‌های کامل تایپ‌اسکریپت و مقادیر پیش‌فرض تعریف کنید.
۳. از `forwardRef` در کامپوننت‌های پایه فرم یا دکمه استفاده نمایید.
۴. رنگ‌ها و فاصله‌ها را فقط از توکن‌های `/src/styles/tokens.css` تامین کنید (هیچ رنگ هگز خام ننویسید).
۵. تمام خواص مارجین و پدینگ افقی را به صورت منطقی (`ms`, `me`, `ps`, `pe`, `start`, `end`) بنویسید.
۶. کامپوننت را در `/src/components/ui/index.ts` اکسپورت کنید.
۷. نمونه‌ای از تمام حالات آن را در `/src/components/dev/DevUiGallery.tsx` درج کنید تا در آدرس `#/dev/ui` قابل مشاهده و تست باشد.
۸. دستور `npm run check` را اجرا کنید تا از گذر تایپ‌چک، استایل‌لینت و بیلد اطمینان حاصل فرمایید.
