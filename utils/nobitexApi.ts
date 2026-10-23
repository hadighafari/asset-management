/**
 * nobitexApi.ts — v1.4.7 (ساده‌شده)
 * USDT/Toman price from Iranian exchanges + formatToman helper.
 * مطابق پروژه GitHub ostad2fan/pompay
 */

const NOBITEX_ORDERBOOK_API = 'https://apiv2.nobitex.ir/v2/orderbook/USDTIRT';
const NOBITEX_STATS_API = 'https://apiv2.nobitex.ir/market/stats';
const WALLEX_API = 'https://api.wallex.ir/v1/markets';
const TETHERLAND_API = 'https://api.tetherland.com/currencies';
const CURRENCY_API = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

export interface TomanPrice {
  usdtToToman: number;
  lastUpdated: number;
  source: string;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function tryNobitexStats(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(NOBITEX_STATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srcCurrency: 'usdt', dstCurrency: 'rls' }),
    });
    if (response.ok) {
      const data = await response.json();
      const stats = data?.stats?.['usdt-rls'];
      if (stats?.latest) {
        const price = parseFloat(stats.latest) / 10;
        if (price > 10000 && price < 500000) return price;
      }
      if (stats?.lastTradePrice) {
        const price = parseFloat(stats.lastTradePrice) / 10;
        if (price > 10000 && price < 500000) return price;
      }
    }
  } catch (e) {
    console.log('[NobitexAPI] Stats error:', e);
  }
  return null;
}

async function tryNobitexOrderbook(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(NOBITEX_ORDERBOOK_API);
    if (response.ok) {
      const data = await response.json();
      if (data?.lastTradePrice) {
        const raw = parseFloat(data.lastTradePrice);
        const price = raw / 10;
        if (price > 10000 && price < 500000) return price;
        if (raw > 10000 && raw < 500000) return raw;
      }
    }
  } catch (e) {
    console.log('[NobitexAPI] Orderbook error:', e);
  }
  return null;
}

async function tryWallex(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(WALLEX_API);
    if (response.ok) {
      const data = await response.json();
      const usdtMarket = data?.result?.symbols?.USDTTMN;
      if (usdtMarket?.stats?.lastPrice) {
        const price = parseFloat(usdtMarket.stats.lastPrice);
        if (price > 10000 && price < 500000) return price;
      }
    }
  } catch (e) {
    console.log('[WallexAPI] Wallex error:', e);
  }
  return null;
}

async function tryTetherland(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(TETHERLAND_API);
    if (response.ok) {
      const data = await response.json();
      const raw = data?.data?.currencies?.USDT?.price;
      if (typeof raw === 'number' && raw > 0) {
        const price = raw > 1000000 && raw < 5000000 ? raw / 10 : raw;
        if (price > 10000 && price < 500000) return price;
      }
    }
  } catch (e) {
    console.log('[TetherlandAPI] Error:', e);
  }
  return null;
}

async function tryCurrencyApi(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(CURRENCY_API);
    if (response.ok) {
      const data = await response.json();
      const irrRate = data?.usd?.irr;
      if (irrRate && typeof irrRate === 'number') {
        const tomanRate = irrRate / 10;
        if (tomanRate > 10000 && tomanRate < 500000) return tomanRate;
      }
    }
  } catch (e) {
    console.log('[CurrencyAPI] Error:', e);
  }
  return null;
}

export async function fetchUsdtTomanPrice(): Promise<TomanPrice> {
  const nobitexStats = await tryNobitexStats();
  if (nobitexStats) {
    return { usdtToToman: nobitexStats, lastUpdated: Date.now(), source: 'Nobitex' };
  }
  const nobitexOB = await tryNobitexOrderbook();
  if (nobitexOB) {
    return { usdtToToman: nobitexOB, lastUpdated: Date.now(), source: 'Nobitex' };
  }
  const wallex = await tryWallex();
  if (wallex) {
    return { usdtToToman: wallex, lastUpdated: Date.now(), source: 'Wallex' };
  }
  const tetherland = await tryTetherland();
  if (tetherland) {
    return { usdtToToman: tetherland, lastUpdated: Date.now(), source: 'Tetherland' };
  }
  const currencyApi = await tryCurrencyApi();
  if (currencyApi) {
    return { usdtToToman: currencyApi, lastUpdated: Date.now(), source: 'CurrencyAPI' };
  }
  return { usdtToToman: 0, lastUpdated: Date.now(), source: 'unavailable' };
}

export function formatToman(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} میلیارد`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} میلیون`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)} هزار`;
  return amount.toFixed(0);
}
