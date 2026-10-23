/**
 * ipCheck.ts — بررسی IP کاربر از طریق سرور Railway
 * اگر IP ایران باشد، بخش کیف پول و ارز دیجیتال غیرفعال می‌شود
 */

const RAILWAY_SERVER = 'https://asset-management65.up.railway.app';

export interface IpInfo {
  ip: string;
  country: string;
  countryCode: string;
  isIran: boolean;
  isAllowed: boolean;
  isVpn: boolean;
  checkedAt: number;
}

let cachedIp: IpInfo | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

export async function checkIp(): Promise<IpInfo | null> {
  // استفاده از کش
  if (cachedIp && Date.now() - cachedIp.checkedAt < CACHE_TTL) {
    return cachedIp;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${RAILWAY_SERVER}/api/ip-check`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const info: IpInfo = {
      ip: data.ip || '',
      country: data.country || '',
      countryCode: (data.countryCode || '').toUpperCase(),
      isIran: data.isIran ?? (data.countryCode || '').toUpperCase() === 'IR',
      isAllowed: data.isAllowed ?? true,
      isVpn: data.isVpn ?? false,
      checkedAt: Date.now(),
    };
    cachedIp = info;
    return info;
  } catch (e) {
    console.log('[IpCheck] failed:', e);
    return null;
  }
}

export function clearIpCache() {
  cachedIp = null;
}
