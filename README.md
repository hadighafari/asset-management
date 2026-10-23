# مدیریت دارایی - Asset Management App

اپلیکیشن موبایل مدیریت دارایی برای اندروید و iOS - منتشرشده در مایکت

## 🌟 امکانات

- **۴ تب اصلی مدیریت دارایی:**
  - 🪙 **ارز دیجیتال** - اتصال به صرافی‌های ایرانی و بین‌المللی
  - 💰 **ریالی و فلزات** - ثبت طلا، نقره، سکه، دلار کاغذی، تتر، ریال نقدی
  - 💎 **پیش‌بینی طلا** - پیش‌بینی قیمت طلا بر اساس تحلیل تکنیکال
  - 🔗 **کیف پول بلاکچین** - مدیریت کیف پول‌های بلاکچینی فقط‌خواندنی

- **قیمت‌های لحظه‌ای تومانی** از منابع:
  - TGJU (طلا ۱۸/۲۴، نقره ۹۹۹/۹۲۵، سکه‌ها، دلار، مثقال)
  - Nobitex (تتر)
  - Wallex, Tetherland (fallback)

- **آپدیت درون‌برنامه‌ای** - چک خودکار نسخه جدید از GitHub
- **رمزنگاری AES-256** برای کلیدهای API
- **رابط فارسی RTL** با تم تیره بایننس

## 🚀 شروع به کار

### پیش‌نیازها
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (برای build)

### نصب
```bash
npm install --legacy-peer-deps
npm start
```

## 📦 ساخت APK

```bash
# با EAS
eas build --platform android --profile production

# یا با Gradle محلی
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK در: `android/app/build/outputs/apk/release/app-release.apk`

## 🔄 قابلیت آپدیت درون‌برنامه‌ای

این اپ به‌صورت خودکار نسخه جدید را از فایل `apk/version.json` در ریپوی GitHub چک می‌کند.

### ساختار version.json:
```json
{
  "latestVersion": "1.0.1",
  "versionCode": 2,
  "apkUrl": "https://cdn.jsdelivr.net/gh/trade-master65/asset-management@main/apk/AssetManagement-v1.0.1.apk",
  "notes": "توضیحات آپدیت"
}
```

### برای انتشار نسخه جدید:
1. فایل APK جدید را در فولدر `apk/` با نام `AssetManagement-v{VERSION}.apk` و `AssetManagement-latest.apk` قرار دهید
2. فایل `apk/version.json` را با نسخه جدید به‌روز کنید
3. تغییرات را به GitHub پوش کنید
4. کاربران هنگام باز کردن اپ، پیغام آپدیت دریافت می‌کنند

## 📋 انتشار در مایکت

1. ثبت‌نام در [developer.myket.ir](https://developer.myket.ir)
2. ثبت برنامه جدید با:
   - نام: مدیریت دارایی
   - پکیج: `com.trademaster65.assetmanagement`
   - دسته: مالی
3. آپلود APK
4. تکمیل اطلاعات و ارسال برای بررسی

## 🏗️ ساختار پروژه

```
asset-management-app/
├── app/                        # صفحات (Expo Router)
│   ├── _layout.tsx             # لایوت اصلی
│   ├── (tabs)/
│   │   ├── _layout.tsx         # نوار تب
│   │   ├── wallet.tsx          # تب مدیریت دارایی (۴ زیرتب)
│   │   └── settings.tsx        # تب تنظیمات
│   ├── about.tsx               # درباره ما
│   ├── help-usage.tsx          # راهنمای استفاده
│   ├── help-faq.tsx            # سؤالات متداول
│   └── help-privacy.tsx        # حریم خصوصی
├── components/                 # کامپوننت‌ها
│   ├── LocalAssetsSection.tsx  # تب ریالی و فلزات
│   ├── GoldPredictionSection.tsx # پیش‌بینی طلا
│   ├── BlockchainWalletsSection.tsx # کیف پول بلاکچین
│   ├── ExchangeAssetsSection.tsx # ارز دیجیتال (صرافی‌ها)
│   ├── UpdateBanner.tsx        # بنر آپدیت
│   └── ThemedAlert.tsx         # آلرت
├── constants/
│   ├── colors.ts               # تم رنگی
│   └── config.ts               # تنظیمات
├── utils/
│   ├── appUpdate.ts            # چک آپدیت
│   ├── iranMarketApi.ts        # قیمت TGJU
│   ├── tgjuHistoryApi.ts       # تاریخچه TGJU
│   ├── nobitexApi.ts           # قیمت تتر
│   └── themeStyles.ts          # استایل تم‌دار
├── apk/                        # فایل‌های APK برای آپدیت
│   └── version.json            # اطلاعات نسخه
├── assets/                     # آیکون، اسپلش
├── server/                     # سرور پراکسی Railway (اختیاری)
├── app.json
├── package.json
└── README.md
```

## 🎨 تب‌های مدیریت دارایی

### ۱. ارز دیجیتال
- اتصال به ۷ صرافی: Nobitex, Bitperp, Wallex (ایرانی) + Binance, Bybit, OKX, MEXC (بین‌المللی)
- نمایش موجودی کل به USD و Toman
- رمزنگاری کلیدهای API با AES-256

### ۲. ریالی و فلزات
- **قیمت‌های لحظه‌ای (تومان):** طلا ۱۸/۲۴، مثقال، نقره ۹۹۹/۹۲۵، سکه امامی/بهار/نیم/ربع، دلار، تتر
- **ورودی کاربر:** ریال نقدی، دلار کاغذی، تتر، طلا (گرم با انتخاب ۱۸/۲۴)، نقره (گرم با انتخاب ۹۹۹/۹۲۵)، سکه‌ها
- **مجموع کل دارایی** به تومان + تفکیک جزئیات
- **کارت سود/زیان** با بازه‌های ۷/۳۰/۹۰/۱۸۰ روز (بر اساس تاریخچه TGJU)

### ۳. پیش‌بینی طلا
- پیش‌بینی ۷، ۳۰، ۹۰ روز آینده
- سقف و کف احتمالی کوتاه‌مدت
- تشخیص روند صعودی/نزولی (میانگین متحرک)
- سطح اطمینان برای هر پیش‌بینی

### ۴. کیف پول بلاکچین
- پشتیبانی از ۶ شبکه: Bitcoin, Ethereum, BSC, Tron, Solana, Polygon
- فقط آدرس عمومی (read-only)
- مشاهده آدرس در بلاکچین اکسپلورر

## 🔒 امنیت

- کلیدهای API با AES-256 رمزنگاری می‌شوند
- فقط در دستگاه ذخیره می‌شوند
- هیچ‌گاه به سرور ارسال نمی‌شوند
- توصیه: فقط کلید API با دسترسی Read-Only بسازید

## 📞 اطلاعات

- **سازنده:** trade_master65
- **GitHub:** https://github.com/trade-master65/asset-management
- **پلتفرم انتشار:** مایکت (Myket)
- **نسخه:** 1.0.0

## ⚠️ سلب مسئولیت

این اپ فقط برای **مشاهده** دارایی‌هاست. قابلیت معامله، برداشت یا انتقال ندارد. پیش‌بینی‌های طلا بر اساس تحلیل تکنیکال ساده است و نباید به‌عنوان توصیه سرمایه‌گذاری در نظر گرفته شود.
