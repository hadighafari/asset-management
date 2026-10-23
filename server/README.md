# سرور پراکسی Railway - مدیریت دارایی

این سرور روی Railway مستقر می‌شود و دو وظیفه دارد:

1. **بررسی IP کاربر** - برای تشخیص IP تحرامی (ایران و...)
2. **پراکسی API صرافی‌های بین‌المللی** - برای دور زدن تحریم IP

## استقرار روی Railway

### روش 1: از طریق GitHub (توصیه شده)

1. کل فولدر `server/` را به یک ریپوی GitHub جداگانه پوش کنید
   (یا کل پروژه را پوش کنید - Railway می‌تواند فولدر server را تشخیص دهد)

2. به [railway.app](https://railway.app) بروید و لاگین کنید

3. **New Project → Deploy from GitHub repo**

4. ریپوی خود را انتخاب کنید

5. در تنظیمات Railway:
   - **Root Directory**: `server` (اگر کل پروژه را پوش کردید)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Railway به‌طور خودکار `PORT` را تنظیم می‌کند

6. صبر کنید تا استقرار تمام شود

7. آدرس سرور را از Railway بگیرید (مثلاً `https://asset-management-proxy.up.railway.app`)

8. این آدرس را در `app.json` پروژه اپ در فیلد `extra.railwayProxyUrl` قرار دهید:
   ```json
   "railwayProxyUrl": "https://asset-management-proxy.up.railway.app"
   ```

### روش 2: از طریق Railway CLI

```bash
# نصب Railway CLI
npm install -g @railway/cli

# لاگین
railway login

# در فولدر server/
cd server
railway init
railway up
```

## تست سرور

بعد از استقرار، می‌توانید سرور را تست کنید:

```bash
# Health check
curl https://YOUR-RAILWAY-URL/health

# IP check
curl https://YOUR-RAILWAY-URL/api/ip-check
```

## متغیرهای محیطی (اختیاری)

اگر در آینده نیاز به کلید API برای سرویس‌های IP تشخیص VPN داشتید، می‌توانید در Railway متغیرهای محیطی اضافه کنید:

```
IP_API_KEY=your_key_here
```

## محدودیت‌ها

- نسخه فعلی از سرویس رایگان `ipwho.is` استفاده می‌کند (تا ۱۰,۰۰۰ درخواست در ماه)
- برای حجم بالاتر، از سرویس‌های پولی مثل IPQualityScore یا IP2Location استفاده کنید
- Rate limit: ۱۰۰ درخواست در ۱۵ دقیقه برای هر IP

## نکات امنیتی

- این سرور هیچ کلید API کاربری را ذخیره نمی‌کند
- در نسخه نهایی، باید کلیدها را با AES رمزنگاری کنید و فقط در حین درخواست در memory نگه دارید
- لاگ‌ها باید حداقل نگه داشته شوند (۲۴ ساعت)
