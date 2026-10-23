/**
 * iranMarketApi.ts — v1.4.14
 * Live Iranian market prices (gold / silver / coins / mesghal / USD) in TOMAN,
 * from TGJU's public widget API.
 * مطابق پروژه GitHub ostad2fan/pompay
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TGJU_MIRRORS = [
  'https://call1.tgju.org/ajax.json',
  'https://call2.tgju.org/ajax.json',
  'https://call.tgju.org/ajax.json',
];

const TGJU_PROXY_MIRRORS = [
  'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://call1.tgju.org/ajax.json'),
  'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://call2.tgju.org/ajax.json'),
];

const CACHE_KEY = '@iran_market_prices_v1';
const CACHE_TTL = 10 * 60 * 1000;
const MEMORY_TTL = 60 * 1000;

export interface IranMarketPrices {
  gold18: number;
  gold24: number;
  silver999: number;
  silver925: number;
  coinEmami: number;
  coinBahar: number;
  coinNim: number;
  coinRob: number;
  mesghal: number;
  dollar: number;
  updatedAt: number;
  source: string;
}

export function persianToEnglishDigits(str: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  let out = str;
  for (let i = 0; i < 10; i++) {
    out = out.replace(new RegExp(fa[i], 'g'), String(i));
    out = out.replace(new RegExp(ar[i], 'g'), String(i));
  }
  return out;
}

export function parseTomanInput(str: string): number {
  const clean = persianToEnglishDigits(str).replace(/[,،\s]/g, '');
  if (!clean || !/^\d*\.?\d*$/.test(clean)) return NaN;
  return parseFloat(clean);
}

function toToman(raw: string | number | undefined | null): number {
  if (raw === null || raw === undefined) return 0;
  const clean = typeof raw === 'number' ? String(raw) : persianToEnglishDigits(raw).replace(/[,،\s]/g, '');
  const n = parseFloat(clean);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / 10;
}

interface TgjuEntry {
  p?: string;
  h?: string;
  l?: string;
  t?: string;
  dt?: string;
}

function extractPrices(data: { current?: Record<string, TgjuEntry> }): Partial<IranMarketPrices> {
  const cur = data?.current ?? {};
  const pick = (key: string): number => toToman(cur[key]?.p);
  const gold18 = pick('geram18');
  const gold24 = pick('geram24');
  const silver999 = pick('silver_999');
  const silver925 = pick('silver_925');
  const coinEmami = pick('sekee');
  const coinBahar = pick('sekeb');
  const coinNim = pick('nim');
  const coinRob = pick('rob');
  const mesghal = pick('mesghal');
  const dollar = pick('price_dollar_rl');

  if (gold18 < 5_000_000 || gold18 > 100_000_000) return {};
  return {
    gold18,
    gold24: gold24 > 5_000_000 ? gold24 : Math.round((gold18 / 0.75) * 1000) / 1000,
    silver999: silver999 > 10_000 ? silver999 : 0,
    silver925: silver925 > 10_000 ? silver925 : silver999 > 10_000 ? Math.round(silver999 * 0.925) : 0,
    coinEmami: coinEmami > 10_000_000 ? coinEmami : 0,
    coinBahar: coinBahar > 10_000_000 ? coinBahar : 0,
    coinNim: coinNim > 5_000_000 ? coinNim : 0,
    coinRob: coinRob > 2_000_000 ? coinRob : 0,
    mesghal: mesghal > 10_000_000 ? mesghal : 0,
    dollar: dollar > 10_000 ? dollar : 0,
  };
}

let memoryCache: { at: number; prices: IranMarketPrices } | null = null;

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        Referer: 'https://www.tgju.org/',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readCached(): Promise<IranMarketPrices | null> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as IranMarketPrices;
    if (!parsed?.gold18 || Date.now() - parsed.updatedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readStaleCached(maxAgeMs: number): Promise<IranMarketPrices | null> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as IranMarketPrices;
    if (!parsed?.gold18 || Date.now() - parsed.updatedAt > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(prices: IranMarketPrices): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(prices));
  } catch {}
}

function parseTgjuBody(text: string): Partial<IranMarketPrices> | null {
  try {
    const data = JSON.parse(text) as { current?: Record<string, TgjuEntry> };
    const partial = extractPrices(data);
    if (partial.gold18) return partial;
    return null;
  } catch {
    return null;
  }
}

export async function fetchIranMarketPrices(): Promise<IranMarketPrices | null> {
  if (memoryCache && Date.now() - memoryCache.at < MEMORY_TTL) {
    return memoryCache.prices;
  }

  const buildPrices = (partial: Partial<IranMarketPrices>, source: string): IranMarketPrices => ({
    gold18: partial.gold18!,
    gold24: partial.gold24!,
    silver999: partial.silver999 ?? 0,
    silver925: partial.silver925 ?? 0,
    coinEmami: partial.coinEmami ?? 0,
    coinBahar: partial.coinBahar ?? 0,
    coinNim: partial.coinNim ?? 0,
    coinRob: partial.coinRob ?? 0,
    mesghal: partial.mesghal ?? 0,
    dollar: partial.dollar ?? 0,
    updatedAt: Date.now(),
    source,
  });

  for (const url of TGJU_MIRRORS) {
    try {
      const res = await fetchWithTimeout(url, 12000);
      if (!res.ok) continue;
      const partial = parseTgjuBody(await res.text());
      if (partial) {
        const prices = buildPrices(partial, 'TGJU');
        memoryCache = { at: Date.now(), prices };
        await writeCache(prices);
        return prices;
      }
    } catch (e) {
      console.log(`[IranMarket] ${url} failed:`, e instanceof Error ? e.message : e);
    }
  }

  for (const url of TGJU_PROXY_MIRRORS) {
    try {
      const res = await fetchWithTimeout(url, 20000);
      if (!res.ok) continue;
      const partial = parseTgjuBody(await res.text());
      if (partial) {
        const prices = buildPrices(partial, 'TGJU (پروکسی)');
        memoryCache = { at: Date.now(), prices };
        await writeCache(prices);
        return prices;
      }
    } catch (e) {
      console.log(`[IranMarket] proxy failed:`, e instanceof Error ? e.message : e);
    }
  }

  const cached = await readCached();
  if (cached) {
    return cached;
  }

  const stale = await readStaleCached(24 * 60 * 60 * 1000);
  if (stale) {
    return stale;
  }
  return null;
}

export function formatFullToman(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('fa-IR', { maximumFractionDigits: 0 });
}
