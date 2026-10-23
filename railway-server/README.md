# سرور پراکسی Railway - مدیریت دارایی

این فولدر کاملاً جدا و خودکفا برای استقرار روی Railway است.

## نحوه استقرار روی Railway

### روش ۱: آپلود مستقیم (ساده‌ترین)

1. به [railway.app](https://railway.app) بروید و لاگین کنید
2. **New Project → Deploy from GitHub repo** را بزنید
3. یا **Empty Project** بسازید
4. فایل‌های این فولدر را به ریپوی GitHub با نام `asset-management-server` پوش کنید
5. Railway به‌طور خودکار `npm install` و `npm start` را اجرا می‌کند

### روش ۲: GitHub repo

1. ریپوی جدید GitHub بسازید: `asset-management-server`
2. همه فایل‌های این فولدر را push کنید:
   - `package.json`
   - `index.js`
   - `railway.json`
   - `.gitignore`
   - `README.md`
3. در Railway: **New Project → Deploy from GitHub repo → انتخاب ریپو**
4. در تنظیمات Railway:
   - **Root Directory**: خالی بگذارید (یا `/`)
   - **Build Command**: `npm install` (به‌طور خودکار)
   - **Start Command**: `npm start` (به‌طور خودکار)

## تنظیمات پورت

❌ **نیازی به تنظیم دستی پورت نیست!**

Railway به‌طور خودکار متغیر محیطی `PORT` را تنظیم می‌کند. سرور ما از این متغیر استفاده می‌کند:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, ...);
```

پس از دیپلوی، Railway به‌طور خودکار یک دامنه به شما می‌دهد:
- مثال: `https://asset-management65.up.railway.app`
- برای گرفتن دامنه دلخواه: در تنظیمات Railway → **Settings → Networking → Generate Domain**

## endpoint های سرور

| Endpoint | توضیح |
|---|---|
| `GET /health` | بررسی سلامت سرور |
| `GET /api/ip-check` | بررسی IP کاربر (کشور، ایران بودن، VPN) |
| `GET /latest-version` | اطلاعات نسخه جدید اپ (از GitHub می‌خواند) |

## تست سرور

بعد از دیپلوی:

```bash
# تست سلامت
curl https://YOUR-RAILWAY-URL/health

# تست IP
curl https://YOUR-RAILWAY-URL/api/ip-check

# تست نسخه
curl https://YOUR-RAILWAY-URL/latest-version
```

## عیب‌یابی

### خطای `npm install ERESOLVE`
این خطا برای سرور **نباید** رخ دهد چون `package.json` فقط شامل:
- express
- cors
- axios
- express-rate-limit

اگر این خطا را دیدید، احتمالاً کل پروژه (شامل React) را به Railway پوش کرده‌اید. **فقط فایل‌های این فولدر را پوش کنید.**

### سرور بالا نمی‌آید
- در logs Railway چک کنید چه خطایی نشان می‌دهد
- مطمئن شوید `index.js` در root فولدر است
- مطمئن شوید `package.json` فیلد `"start": "node index.js"` دارد

## نسخه
1.0.4
