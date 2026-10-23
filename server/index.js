// ============================================================
//  Asset Management Proxy Server
//  Railway deployment for proxying exchange APIs
//
//  Features:
//  1. IP check endpoint - returns client's real IP info
//  2. Exchange proxy endpoints - blocks sanctioned IPs
//  3. Rate limiting
//  4. CORS for the mobile app
//  5. Health check
// ============================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- لیست کشورهای مجاز / تحرامی ----------
const SANCTIONED_COUNTRIES = ['IR', 'KP', 'SY', 'CU', 'SD'];
const ALLOWED_COUNTRIES = [
  'US', 'GB', 'DE', 'FR', 'NL', 'AE', 'TR', 'JP', 'KR', 'SG',
  'CA', 'AU', 'CH', 'SE', 'NO', 'FI', 'DK', 'BE', 'AT', 'IE',
  'PT', 'ES', 'IT', 'PL', 'CZ', 'RO', 'HU', 'GR', 'BG', 'HR',
  'MY', 'TH', 'VN', 'ID', 'PH', 'IN', 'BR', 'MX', 'AR', 'CL',
  'ZA', 'EG', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ',
];

// ---------- Middleware ----------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Client-Source', 'X-App-Version'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Rate Limiting ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 100, // حداکثر 100 درخواست در 15 دقیقه برای هر IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  },
});
app.use(limiter);

// ---------- Helper: Get Client IP ----------
function getClientIp(req) {
  // Railway و Cloudflare معمولاً IP واقعی کاربر را در این هدرها می‌گذارند
  return (
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    ''
  );
}

// ---------- Helper: Check IP Info ----------
async function checkIpInfo(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return {
      ip: 'local',
      country: 'Local',
      countryCode: 'LOCAL',
      isVpn: false,
      isProxy: false,
      isTor: false,
      isIran: false,
      isSanctioned: false,
      isAllowed: true,
    };
  }

  try {
    // استفاده از ipwho.is (رایگان، بدون نیاز به API key)
    const resp = await axios.get(`https://ipwho.is/${ip}`, {
      timeout: 5000,
      params: {
        fields: 'success,country,country_code,region,city,connection,security',
      },
    });

    if (!resp.data || !resp.data.success) {
      throw new Error(resp.data?.message || 'IP lookup failed');
    }

    const countryCode = (resp.data.country_code || '').toUpperCase();
    const isIran = countryCode === 'IR';
    const isSanctioned = SANCTIONED_COUNTRIES.includes(countryCode);
    const security = resp.data.security || {};
    const isVpn = Boolean(security.vpn || security.proxy || security.tor);
    const isProxy = Boolean(security.proxy);
    const isTor = Boolean(security.tor);

    const isAllowed = !isIran && !isSanctioned && !isVpn && !isTor &&
      ALLOWED_COUNTRIES.includes(countryCode);

    return {
      ip,
      country: resp.data.country || '',
      countryCode,
      region: resp.data.region || '',
      city: resp.data.city || '',
      isp: resp.data.connection?.isp || '',
      org: resp.data.connection?.org || '',
      isVpn,
      isProxy,
      isTor,
      isIran,
      isSanctioned,
      isAllowed,
    };
  } catch (e) {
    console.error('IP check failed:', e.message);
    // fallback به ipapi.co
    try {
      const resp2 = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
      const countryCode = (resp2.data?.country_code || '').toUpperCase();
      const isIran = countryCode === 'IR';
      const isSanctioned = SANCTIONED_COUNTRIES.includes(countryCode);
      const isp = resp2.data?.org || '';
      const isVpn = /vpn|proxy|tor|datacenter|hosting|cloud/i.test(isp);
      const isAllowed = !isIran && !isSanctioned && !isVpn &&
        ALLOWED_COUNTRIES.includes(countryCode);

      return {
        ip,
        country: resp2.data?.country_name || '',
        countryCode,
        region: resp2.data?.region || '',
        city: resp2.data?.city || '',
        isp,
        org: isp,
        isVpn,
        isProxy: isVpn,
        isTor: false,
        isIran,
        isSanctioned,
        isAllowed,
      };
    } catch (e2) {
      console.error('IP fallback failed:', e2.message);
      return {
        ip,
        country: '',
        countryCode: '',
        isVpn: false,
        isProxy: false,
        isTor: false,
        isIran: false,
        isSanctioned: false,
        isAllowed: false,
        error: 'IP lookup failed',
      };
    }
  }
}

// ---------- Helper: Check Access ----------
function checkAccess(ipInfo, exchangeCategory) {
  // صرافی‌های ایرانی از همه IPها مجازند
  if (exchangeCategory === 'iranian') {
    return { allowed: true };
  }

  // صرافی‌های بین‌المللی
  if (ipInfo.isIran) {
    return {
      allowed: false,
      reason: 'IP شما از ایران است. برای اتصال به صرافی‌های بین‌المللی باید از VPN استفاده کنید.',
    };
  }
  if (ipInfo.isSanctioned) {
    return {
      allowed: false,
      reason: `IP شما از کشور تحرامی (${ipInfo.country || ipInfo.countryCode}) است.`,
    };
  }
  if (!ipInfo.isAllowed) {
    return {
      allowed: false,
      reason: `کشور شما (${ipInfo.country || ipInfo.countryCode}) در لیست مجاز نیست.`,
    };
  }
  return { allowed: true };
}

// ============================================================
//  ENDPOINTS
// ============================================================

// ---------- Health Check ----------
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'asset-management-proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'سرور پراکسی فعال است',
  });
});

// ---------- IP Check ----------
app.get('/api/ip-check', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const info = await checkIpInfo(ip);

    res.json({
      ...info,
      checkedAt: Date.now(),
      source: 'server',
    });
  } catch (e) {
    console.error('IP check error:', e);
    res.status(500).json({
      error: 'ip_check_failed',
      message: 'خطا در بررسی IP',
    });
  }
});

// ============================================================
//  Exchange Proxy Endpoints
//  برای هر صرافی یک endpoint مجزا
// ============================================================

// Helper: Get connection from query (در نسخه نهایی باید از DB بخواند)
// فعلاً کلیدها از طریق header یا query پاس داده می‌شوند (در نسخه نهایی امن‌تر شود)
function getConnectionInfo(req) {
  return {
    connId: req.query.conn,
    apiKey: req.headers['x-api-key'] || req.query.api_key,
    apiSecret: req.headers['x-api-secret'] || req.query.api_secret,
    passphrase: req.headers['x-passphrase'] || req.query.passphrase,
  };
}

// Helper: Proxy middleware
async function exchangeProxyMiddleware(req, res, exchangeConfig) {
  const ip = getClientIp(req);
  const ipInfo = await checkIpInfo(ip);

  // بررسی دسترسی
  const access = checkAccess(ipInfo, exchangeConfig.category);
  if (!access.allowed) {
    return res.status(403).json({
      error: 'access_denied',
      message: access.reason,
      ipInfo: {
        country: ipInfo.country,
        countryCode: ipInfo.countryCode,
        isVpn: ipInfo.isVpn,
        isIran: ipInfo.isIran,
      },
    });
  }

  // در نسخه نهایی: کلیدهای API را از DB بخوان و درخواست را با HMAC امضا کن
  // فعلاً placeholder برمی‌گردانیم
  return res.json({
    exchangeId: exchangeConfig.id,
    connectionId: req.query.conn,
    totalUsd: 0,
    totalIrr: 0,
    assets: [],
    ipInfo: {
      country: ipInfo.country,
      countryCode: ipInfo.countryCode,
    },
    message: 'این یک placeholder است. در نسخه نهایی، موجودی واقعی صرافی نمایش داده خواهد شد.',
  });
}

// ---------- Binance ----------
app.get('/api/binance', async (req, res) => {
  await exchangeProxyMiddleware(req, res, {
    id: 'binance',
    category: 'international',
  });
});

// ---------- Bybit ----------
app.get('/api/bybit', async (req, res) => {
  await exchangeProxyMiddleware(req, res, {
    id: 'bybit',
    category: 'international',
  });
});

// ---------- OKX ----------
app.get('/api/okx', async (req, res) => {
  await exchangeProxyMiddleware(req, res, {
    id: 'okx',
    category: 'international',
  });
});

// ---------- MEXC ----------
app.get('/api/mexc', async (req, res) => {
  await exchangeProxyMiddleware(req, res, {
    id: 'mexc',
    category: 'international',
  });
});

// ---------- 404 Handler ----------
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'مسیر یافت نشد',
    path: req.path,
  });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'server_error',
    message: 'خطای داخلی سرور',
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`🚀 Asset Management Proxy Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 IP check: http://localhost:${PORT}/api/ip-check`);
});
