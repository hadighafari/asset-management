/**
 * tgjuHistoryApi.ts — v1.4.14
 * Historical DAILY closes for the Iranian metals market (TGJU),
 * used by the «دارایی ریالی و فلزات» PnL card.
 * مطابق پروژه GitHub ostad2fan/pompay
 */
const HISTORY_BASE = 'https://api.tgju.org/v1/market/indicator/summary-table-data';
const REQUEST_TIMEOUT_MS = 20_000;

export const TgjuHistorySymbol = {
  gold18: 'geram18',
  gold24: 'geram24',
  silver999: 'silver_999',
  silver925: 'silver_925',
  coinEmami: 'sekee',
  coinBahar: 'sekeb',
  coinNim: 'nim',
  coinRob: 'rob',
  dollar: 'price_dollar_rl',
} as const;

export type TgjuHistoryKey = keyof typeof TgjuHistorySymbol;

export interface TgjuClosePoint {
  t: number;
  close: number;
}

interface CacheEntry {
  at: number;
  points: TgjuClosePoint[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;

function cellToToman(raw: unknown): number {
  const s = String(raw ?? '').replace(/<[^>]+>/g, '').replace(/[,،\s]/g, '');
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / 10;
}

function gregorianCellToMs(raw: unknown): number {
  const s = String(raw ?? '').replace(/<[^>]+>/g, '').trim();
  const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!m) return NaN;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

export async function fetchTgjuCloses(symbol: string): Promise<TgjuClosePoint[]> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.points;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${HISTORY_BASE}/${encodeURIComponent(symbol)}?lang=fa&order_dir=desc`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `https://www.tgju.org/profile/${encodeURIComponent(symbol)}`,
        },
      }
    );
    if (!res.ok) throw new Error(`TGJU history HTTP ${res.status}`);
    const body = (await res.json()) as { data?: unknown };
    const rows = body?.data;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('TGJU history خالی است');
    const points: TgjuClosePoint[] = [];
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 8) continue;
      const t = gregorianCellToMs(row[6]);
      const close = cellToToman(row[3]);
      if (!Number.isFinite(t) || close <= 0) continue;
      points.push({ t, close });
    }
    if (points.length === 0) throw new Error('TGJU history قابل تجزیه نبود');
    points.sort((a, b) => a.t - b.t);
    cache.set(symbol, { at: Date.now(), points });
    return points;
  } finally {
    clearTimeout(timer);
  }
}

export function closeAtOrBefore(points: TgjuClosePoint[], targetMs: number): number | null {
  if (points.length === 0) return null;
  if (targetMs <= points[0].t) return points[0].close;
  if (targetMs >= points[points.length - 1].t) return points[points.length - 1].close;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (points[mid].t <= targetMs) lo = mid;
    else hi = mid - 1;
  }
  return points[lo].close;
}

export function latestClose(points: TgjuClosePoint[]): number | null {
  return points.length > 0 ? points[points.length - 1].close : null;
}
