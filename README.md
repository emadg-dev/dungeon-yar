# زروانیا | Zorvania TTRPG - راهنمای استقرار Cloudflare Pages و D1

این اپلیکیشن به صورت کامل برای استقرار سریع و رایگان بر روی پلتفرم ابری **Cloudflare Pages** با دیتابیس رابطه‌ای توزیع‌شده **Cloudflare D1** و موتور بدون سرور **Pages Functions** طراحی شده است.

---

## ۱. پیش‌نیازها
1. حساب کاربری در [Cloudflare](https://dash.cloudflare.com)
2. ابزار خط فرمان Wrangler (نصب از طریق npm):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

---

## ۲. ایجاد پایگاه‌داده Cloudflare D1
در ترمینال، دستور زیر را اجرا کنید تا دیتابیس D1 ساخته شود:
```bash
wrangler d1 create zorvania-db
```
پس از اجرا، اطلاعاتی شبیه به زیر دریافت می‌کنید:
```toml
[[d1_databases]]
binding = "DB"
database_name = "zorvania-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## ۳. اجرای اسکریپت ساخت جداول (schema.sql)
برای ساخت جداول و ایندکس‌ها بر روی دیتابیس D1 دستور زیر را اجرا نمایید:

### اجرای محلی (برای تست):
```bash
wrangler d1 execute zorvania-db --local --file=./schema.sql
```

### اجرای بر روی سرور ابری اصلی (Production):
```bash
wrangler d1 execute zorvania-db --remote --file=./schema.sql
```

---

## ۴. تنظیم متغیرهای محیطی و سکرت‌ها (Secrets)
در داشبورد Cloudflare به بخش **Workers & Pages > Settings > Variables and Secrets** بروید (یا از طریق دستورات زیر در wrangler تنظیم کنید):

1. **`JWT_SECRET`**: یک کلید تصادفی امن حداقل ۳۲ کاراکتری برای امضای نشست‌ها
   ```bash
   wrangler pages secret put JWT_SECRET
   ```
2. **`DM_EMAILS`**: ایمیل‌های مجاز دانجن مستر (با کاما جدا شوند):
   ```text
   dm@zorvania.ir,master@zorvania.ir
   ```
3. **`CAMPAIGN_CODE`**: کد دعوت خصوصی کمپین که بازیکنان هنگام ثبت‌نام به آن نیاز دارند:
   ```text
   ZORVANIA-1405
   ```
4. **`VITE_API_MODE`**: در تب Environment Variables مقدار `http` قرار دهید تا کلاینت به جای دیتابیس شبیه‌ساز لوکال با اندپوینت‌های `/api/*` کار کند.

---

## ۵. اتصال دیتابیس D1 به Cloudflare Pages
در پنل Cloudflare Pages:
1. پروژه Pages خود را انتخاب کنید.
2. به تب **Settings > Functions > D1 database bindings** بروید.
3. یک Binding جدید با نام متغیر:
   - **Variable name**: `DB`
   - **D1 database**: `zorvania-db`
   اضافه کرده و Save کنید.

---

## ۶. استقرار از طریق GitHub
1. مخزن کد را در گیت‌هاب Push کنید:
   ```bash
   git init
   git add .
   git commit -m "Zorvania TTRPG release"
   git branch -M main
   git remote add origin https://github.com/your-username/zorvania.git
   git push -u origin main
   ```
2. در داشبورد Cloudflare Pages، دکمه **Create application > Pages > Connect to Git** را بزنید.
3. مخزن خود را انتخاب کنید.
4. تنظیمات ساخت (Build Settings):
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. دکمه **Save and Deploy** را بزنید.

پروژه ظرف کمتر از ۲ دقیقه بیلد شده و روی دامنه اختصاصی رایگان شما (مثل `zorvania.pages.dev`) فعال می‌شود!
در صورت تمایل، می‌توانید دکمه "درون‌ریزی داده‌های پیش‌فرض زروانیا" را در بخش تنظیمات DM بزنید تا شخصیت‌ها، هیولاها، آیتم‌ها و کلاس‌های پیش‌فرض مستقیماً وارد دیتابیس سرور شوند.
