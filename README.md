# زروانیا | Zorvania TTRPG - راهنمای سیستم حساب‌های کاربری و استقرار Cloudflare Pages و D1

این اپلیکیشن به صورت کامل برای استقرار سریع و پایدار بر روی پلتفرم ابری **Cloudflare Pages** با دیتابیس رابطه‌ای توزیع‌شده **Cloudflare D1**، موتور بدون سرور **Pages Functions** و سیستم جامع حساب‌های کاربری، کنترل دسترسی مبتنی بر نقش (RBAC)، سشن‌های ایمن و کوکی‌های `__Host-zsession` طراحی شده است.

---

## ۱. ساخت پایگاه‌داده Cloudflare D1
در ترمینال، دستور زیر را اجرا کنید تا دیتابیس D1 ساخته شود:
```bash
wrangler d1 create zorvania-db
```

پس از ساخت، شناسه دیتابیس در خروجی ترمینال نمایش داده می‌شود:
```toml
[[d1_databases]]
binding = "DB"
database_name = "zorvania-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### اجرای اسکریپت ساخت جداول (`schema.sql`):
برای ایجاد جداول `users`, `sessions`, `invites`, `password_resets`, `login_attempts`, `audit_log`, `characters` و ایندکس‌های آن‌ها:

- **محیط توسعه محلی:**
  ```bash
  wrangler d1 execute zorvania-db --local --file=./schema.sql
  ```
- **محیط سرور ابری اصلی (Production):**
  ```bash
  wrangler d1 execute zorvania-db --remote --file=./schema.sql
  ```

---

## ۲. متغیرهای محیطی و سکرت‌ها (Environment Variables & Secrets)

در داشبورد Cloudflare به مسیر **Workers & Pages > Settings > Variables and Secrets** بروید (یا با دستور `wrangler pages secret put` تنظیم کنید):

1. **`DM_EMAILS`** (ضروری):
   - فهرست ایمیل‌های معتبر دانجن مستر که با کاما از هم جدا شده‌اند (مقایسه حساس به بزرگی/کوچکی حروف نیست).
   - مثال:
     ```text
     dm@zorvania.ir,admin@zorvania.ir
     ```
2. **`IP_HASH_SALT`** (ضروری):
   - یک رشته تصادفی طولانی و امن جهت هش کردن یک‌طرفه آدرس‌های IP کاربران در سشن‌ها و لاگ‌های تلاش برای ورود به منظور حفظ حریم خصوصی:
     ```bash
     wrangler pages secret put IP_HASH_SALT
     ```
3. **`REGISTRATION_MODE`** (اختیاری - پیش‌فرض `"invite"`):
   - `"invite"`: ثبت‌نام کاربران عادی فقط با کد دعوت معتبر امکان‌پذیر است.
   - `"open"`: ثبت‌نام برای عموم باز است (نیازی به کد دعوت نیست).
4. **`VITE_API_MODE`** (در متغیرهای فرانت‌اند):
   - مقدار `http` قرار دهید تا کلاینت به جای حالت شبیه‌ساز محلی (LocalApi) با اندپوینت‌های واقعی `/api/*` ارتباط برقرار کند.

---

## ۳. اتصال D1 به Cloudflare Pages
در پنل Cloudflare Pages:
1. پروژه Pages خود را انتخاب کنید.
2. به تب **Settings > Functions > D1 database bindings** بروید.
3. یک Binding جدید ثبت کنید:
   - **Variable name**: `DB`
   - **D1 database**: `zorvania-db`
4. ذخیره کنید.

---

## ۴. راه‌اندازی اولیه و بوت‌استرپ دانجن مستر (Initial DM Bootstrap)
1. نیازی به اجرای اسکریپت‌های پیچیده سید اولیه نیست!
2. ایمیل دانجن مستر خود را در سکرت `DM_EMAILS` ثبت کنید (مثلاً `dm@zorvania.ir`).
3. وارد سایت شوید و در مودال ورود، گزینه «ایجاد حساب جدید» را انتخاب کنید.
4. با ایمیل ثبت‌شده در `DM_EMAILS` اقدام به ثبت‌نام کنید:
   - سیستم ایمیل شما را شناسایی کرده و **بدون نیاز به کد دعوت** ثبت‌نام را انجام می‌دهد.
   - نقش کاربری شما به صورت خودکار و دائمی روی **`dm`** (دانجن مستر) تنظیم می‌شود.
   - این نقش توسط هیچ کاربری در سیستم قابل تنزل یا خلع نیست.

---

## ۵. دعوت بازیکنان و انتساب کاراکتر (Inviting Players & Assigning Characters)
1. دانجن مستر پس از ورود به سیستم، روی دکمه **«ابزارهای دانجن مستر»** کلیک کرده و تب **«دعوت‌نامه‌ها»** را انتخاب می‌کند.
2. بر روی دکمه **«ایجاد کد دعوت جدید»** کلیک کنید:
   - برچسب توضیحی (مثلاً «دعوت علی برای شخصیت رستم») را وارد کنید.
   - تعداد دفعات مجاز استفاده را مشخص کنید (تک‌کاربره یا چندکاربره).
   - مدت زمان اعتبار را تعیین کنید (مثلاً ۷ روز).
   - در صورت تمایل، کاراکتر پیش‌ساخته مدنظر را انتخاب کنید تا هنگام ثبت‌نام به صورت خودکار مالکیت آن به کاربر جدید منتقل و به عنوان کاراکتر فعال او ثبت شود.
3. دکمه **«کپی پیوند دعوت»** را بزنید:
   - پیوند تولیدشده به شکل `https://zorvania.ir/#register?code=INV-XXXXX` خواهد بود.
   - بازیکن با باز کردن پیوند، فرم ثبت‌نام را به صورت خودکار با کد دعوت تکمیل‌شده مشاهده می‌کند.

---

## ۶. اقدامات اضطراری دیتابیس (Emergency Operations via Wrangler)

در صورتی که به پنل وب دسترسی ندارید یا نیاز به اقدامات اضطراری دارید:

### الف) ابطال فوری تمام سشن‌های تمام کاربران:
```bash
wrangler d1 execute zorvania-db --remote --command="UPDATE sessions SET revoked_at = unixepoch() * 1000 WHERE revoked_at IS NULL;"
```

### ب) ابطال تمام نشست‌های یک کاربر خاص:
```bash
wrangler d1 execute zorvania-db --remote --command="UPDATE sessions SET revoked_at = unixepoch() * 1000 WHERE user_id = 'USER_UUID_HERE';"
```

### ج) بازنشانی مستقیم و اجباری رمز عبور یک کاربر/DM:
ابتدا یک هش PBKDF2 با فرمت استاندارد زروانیا بسازید یا از طریق اسکریپت موقت هش تولید کنید، سپس:
```bash
wrangler d1 execute zorvania-db --remote --command="UPDATE users SET password_hash = 'pbkdf2$sha256$100000$SALT$HASH', must_change_password = 1 WHERE email = 'dm@zorvania.ir';"
```
و سشن‌های او را نیز باطل کنید:
```bash
wrangler d1 execute zorvania-db --remote --command="UPDATE sessions SET revoked_at = unixepoch() * 1000 WHERE user_id IN (SELECT id FROM users WHERE email = 'dm@zorvania.ir');"
```

### د) غیرفعال‌سازی فوری یک حساب کاربری مهاجم یا مسدود شده:
```bash
wrangler d1 execute zorvania-db --remote --command="UPDATE users SET status = 'disabled' WHERE email = 'abusive-user@example.com';"
```

---

## ۷. مشخصات امنیتی و معماری سیستم (Security Architecture)

- **الگوریتم رمزنگاری:** PBKDF2-SHA-256 پیاده‌سازی شده با WebCrypto API استاندارد با دقیقاً ۱۰۰,۰۰۰ دور (حداکثر سقف مجاز Cloudflare Workers)، سالت تصادفی ۱۶ بایتی امن و کلید خروجی ۳۲ بایتی. فرمت ذخیره‌سازی: `pbkdf2$sha256$100000$<saltB64>$<hashB64>` با پشتیبانی از ارتقای خودکار پارامترها و مقایسه زمان‌ثابت (Constant-Time).
- **کوکی سشن:** کوکی امن `__Host-zsession` با ویژگی‌های `HttpOnly; Secure; SameSite=Lax; Path=/` بدون اتریبیوت Domain. در دیتابیس صرفاً SHA-256 توکن نگهداری می‌شود (Token Hash).
- **انقضای لغزنده:** مدت سشن ۱۴ روز است که در صورت مراجعه کاربر پس از گذشت ۱ روز به صورت خودکار تمدید می‌شود، تا سقف نهایی و مطلق ۶۰ روز.
- **حفاظت CSRF:** تمام درخواست‌های تغییردهنده وضعیت (POST, PUT, PATCH, DELETE) ملزم به ارسال هدر `X-Requested-With: zorvania` هستند و هدر Origin در صورت حضور با دامنه سایت تطبیق داده می‌شود.
- **محدودسازی نرخ درخواست (Rate Limiting):** حداکثر ۵ تلاش ناموفق ورود در هر ۱۵ دقیقه به ازای ایمیل و ۲۰ تلاش به ازای هر IP، با انجام عملیات هش ساختگی (Dummy Hash) در صورت عدم وجود ایمیل جهت ممانعت از حملات تحلیل زمانی (Timing Attacks). حداکثر ۱۰ ثبت‌نام یا مصرف توکن در هر ساعت به ازای هر IP.
- **کنترل دسترسی چندلایه‌ای (RBAC):** نقش‌ها و وضعیت فعال/غیرفعال همیشه مستقیماً از دیتابیس استعلام می‌شوند و کاراکترهای دیگر بازیکنان برای کلاینت‌های بدون دسترسی خطای 404 برمی‌گردانند.
