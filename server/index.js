// ============================================================
//  Asset Management Proxy Server
//  Railway deployment
//  - /latest-version: اطلاعات نسخه جدید
//  - /api/ip-check: بررسی IP کاربر
//  - /health: سلامت سرور
// ============================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// لیست کشورهای تحرامی
const SANCTIONED_COUNTRIES = ['IR', 'KP', 'SY', 'CU', 'SD'];

// کشورهای مجاز برای صرافی‌های بین‌المللی
const ALLOWED_COUNTRIES = [
  'US', 'GB', 'DE', 'FR', 'NL', 'AE', 'TR', 'JP', 'KR', 'SG',
  'CA', 'AU', 'CH', 'SE', 'NO', 'FI', 'DK', 'BE', 'AT', 'IE',
  'PT', 'ES', 'IT', 'PL', 'CZ', 'RO', 'HU', 'GR', 'BG', 'HR',
  'MY', 'TH', 'VN', 'ID', 'PH', 'IN', 'BR', 'MX', 'AR', 'CL',
];

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Client-Source', 'X-App-Version'],
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

function getClientIp(req) {
  return (
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    ''
  );
}

async function checkIpInfo(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return {
      ip: 'local',
      country: 'Local',
      countryCode: 'LOCAL',
      isVpn: false,
      isIran: false,
      isAllowed: true,
    };
  }

  try {
    const resp = await axios.get(`https://ipwho.is/${ip}`, {
      timeout: 5000,
      params: { fields: 'success,country,country_code,region,city,connection,security' },
    });

    if (!resp.data || !resp.data.success) {
      throw new Error(resp.data?.message || 'IP lookup failed');
    }

    const countryCode = (resp.data.country_code || '').toUpperCase();
    const isIran = countryCode === 'IR';
    const isSanctioned = SANCTIONED_COUNTRIES.includes(countryCode);
    const security = resp.data.security || {};
    const isVpn = Boolean(security.vpn || security.proxy || security.tor);
    const isAllowed = !isIran && !isSanctioned && !isVpn &&
      (ALLOWED_COUNTRIES.length === 0 || ALLOWED_COUNTRIES.includes(countryCode));

    return {
      ip,
      country: resp.data.country || '',
      countryCode,
      region: resp.data.region || '',
      city: resp.data.city || '',
      isp: resp.data.connection?.isp || '',
      org: resp.data.connection?.org || '',
      isVpn,
      isProxy: Boolean(security.proxy),
      isTor: Boolean(security.tor),
      isIran,
      isSanctioned,
      isAllowed,
    };
  } catch (e) {
    console.error('IP check failed:', e.message);
    // fallback
    try {
      const resp2 = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
      const countryCode = (resp2.data?.country_code || '').toUpperCase();
      const isIran = countryCode === 'IR';
      const isSanctioned = SANCTIONED_COUNTRIES.includes(countryCode);
      const isp = resp2.data?.org || '';
      const isVpn = /vpn|proxy|tor|datacenter|hosting|cloud/i.test(isp);
      const isAllowed = !isIran && !isSanctioned && !isVpn &&
        (ALLOWED_COUNTRIES.length === 0 || ALLOWED_COUNTRIES.includes(countryCode));

      return {
        ip,
        country: resp2.data?.country_name || '',
        countryCode,
        isVpn,
        isProxy: isVpn,
        isTor: false,
        isIran,
        isSanctioned,
        isAllowed,
      };
    } catch (e2) {
      return {
        ip,
        country: '',
        countryCode: '',
        isVpn: false,
        isIran: false,
        isAllowed: false,
        error: 'IP lookup failed',
      };
    }
  }
}

// ---------- Health Check ----------
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'asset-management-proxy',
    version: '1.0.4',
    timestamp: new Date().toISOString(),
  });
});

// ---------- IP Check ----------
app.get('/api/ip-check', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const info = await checkIpInfo(ip);
    res.json({ ...info, checkedAt: Date.now(), source: 'server' });
  } catch (e) {
    console.error('IP check error:', e);
    res.status(500).json({ error: 'ip_check_failed', message: 'خطا در بررسی IP' });
  }
});

// ---------- Latest Version ----------
// اطلاعات نسخه جدید اپ - از فایل version.json در GitHub خوانده می‌شود
app.get('/latest-version', async (req, res) => {
  try {
    const resp = await axios.get(
      'https://raw.githubusercontent.com/trade-master65/asset-management/main/apk/version.json',
      { timeout: 10000, headers: { 'Cache-Control': 'no-cache' } }
    );
    res.json(resp.data);
  } catch (e) {
    console.error('Version check error:', e.message);
    res.status(500).json({
      error: 'version_check_failed',
      message: 'بررسی نسخه ناموفق بود',
    });
  }
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: 'مسیر یافت نشد' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'server_error', message: 'خطای داخلی سرور' });
});

app.listen(PORT, () => {
  console.log(`🚀 Asset Management Proxy Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔍 IP check: http://localhost:${PORT}/api/ip-check`);
  console.log(`📦 Latest version: http://localhost:${PORT}/latest-version`);
});
