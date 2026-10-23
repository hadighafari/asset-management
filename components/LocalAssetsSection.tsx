// ============================================================
//  LocalAssetsSection — «دارایی ریالی و فلزات»
//  مطابق پروژه GitHub ostad2fan/pompay
//
//  شامل:
//   - قیمت‌های لحظه‌ای تومانی (طلا 18/24، نقره 999/925، سکه‌ها، دلار)
//   - ورودی کاربر: ریال نقدی، دلار کاغذی، تتر، طلا (گرم)، نقره، سکه‌ها
//   - محاسبه مجموع کل دارایی به تومان
//   - کارت سود/زیان 7/30/90/180 روزه
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Landmark,
  Banknote,
  DollarSign,
  Gem,
  Medal,
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import {
  fetchIranMarketPrices,
  parseTomanInput,
  formatFullToman,
  IranMarketPrices,
} from '../utils/iranMarketApi';
import { formatToman } from '../utils/nobitexApi';
import {
  fetchTgjuCloses,
  closeAtOrBefore,
  latestClose,
  TgjuHistorySymbol,
  TgjuClosePoint,
} from '../utils/tgjuHistoryApi';

const ASSETS_KEY = '@local_assets_v1';

interface LocalAssets {
  rialCash: string;
  usdCash: string;
  usdtQty: string;
  goldGrams: string;
  goldKarat: '18' | '24';
  silverGrams: string;
  silverType: '999' | '925';
  coinEmami: string;
  coinBahar: string;
  coinNim: string;
  coinRob: string;
}

const EMPTY_ASSETS: LocalAssets = {
  rialCash: '',
  usdCash: '',
  usdtQty: '',
  goldGrams: '',
  goldKarat: '18',
  silverGrams: '',
  silverType: '999',
  coinEmami: '',
  coinBahar: '',
  coinNim: '',
  coinRob: '',
};

async function loadAssets(): Promise<LocalAssets> {
  try {
    const stored = await AsyncStorage.getItem(ASSETS_KEY);
    if (stored) return { ...EMPTY_ASSETS, ...(JSON.parse(stored) as Partial<LocalAssets>) };
  } catch {}
  return EMPTY_ASSETS;
}

async function saveAssets(a: LocalAssets): Promise<void> {
  try {
    await AsyncStorage.setItem(ASSETS_KEY, JSON.stringify(a));
  } catch {}
}

interface Props {
  usdtToToman: number;
  totalPortfolioUsd: number;
  blockchainToman?: number;
  hasBlockchainWallet?: boolean;
  blockchainPnlTomanByPeriod?: Record<number, { pnlToman: number; basisToman: number } | null>;
  blockchainTotalUsd?: number;
}

const EXPANDED_KEY = '@local_assets_expanded_v1';

export default function LocalAssetsSection({
  usdtToToman,
  totalPortfolioUsd,
  blockchainToman = 0,
  hasBlockchainWallet = false,
  blockchainPnlTomanByPeriod,
  blockchainTotalUsd = 0,
}: Props) {
  const [assets, setAssets] = useState<LocalAssets>(EMPTY_ASSETS);
  const [expanded, setExpanded] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    loadAssets().then((a) => {
      if (mounted) setAssets(a);
    });
    AsyncStorage.getItem(EXPANDED_KEY).then((v) => {
      if (mounted && v === '0') setExpanded(false);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      AsyncStorage.setItem(EXPANDED_KEY, next ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  const pricesQuery = useQuery({
    queryKey: ['iran-market-prices'],
    queryFn: fetchIranMarketPrices,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const p = pricesQuery.data;

  const update = useCallback((patch: Partial<LocalAssets>) => {
    setAssets((prev) => {
      const next = { ...prev, ...patch };
      void saveAssets(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['iran-market-prices'] });
  }, [queryClient]);

  const rialValue = parseTomanInput(assets.rialCash) || 0;
  const usdRate = p && p.dollar > 0 ? p.dollar : usdtToToman;
  const usdQty = parseTomanInput(assets.usdCash) || 0;
  const usdValue = usdQty > 0 && usdRate > 0 ? usdQty * usdRate : 0;
  const goldUnit = assets.goldKarat === '24' ? p?.gold24 ?? 0 : p?.gold18 ?? 0;
  const goldValue = (parseTomanInput(assets.goldGrams) || 0) * goldUnit;
  const silverUnit = assets.silverType === '925' ? p?.silver925 ?? 0 : p?.silver999 ?? 0;
  const silverValue = (parseTomanInput(assets.silverGrams) || 0) * silverUnit;
  const coinValues = {
    emami: (parseTomanInput(assets.coinEmami) || 0) * (p?.coinEmami ?? 0),
    bahar: (parseTomanInput(assets.coinBahar) || 0) * (p?.coinBahar ?? 0),
    nim: (parseTomanInput(assets.coinNim) || 0) * (p?.coinNim ?? 0),
    rob: (parseTomanInput(assets.coinRob) || 0) * (p?.coinRob ?? 0),
  };
  const coinsValue = coinValues.emami + coinValues.bahar + coinValues.nim + coinValues.rob;
  const cryptoToman = usdtToToman > 0 ? totalPortfolioUsd * usdtToToman : 0;
  const usdtQtyVal = parseTomanInput(assets.usdtQty) || 0;
  const usdtManualToman = usdtQtyVal > 0 && usdtToToman > 0 ? usdtQtyVal * usdtToToman : 0;
  const blockchainValue = hasBlockchainWallet ? blockchainToman : 0;

  const grandTotal =
    rialValue + usdValue + usdtManualToman + goldValue + silverValue + coinsValue + cryptoToman + blockchainValue;

  const hasAnyInput =
    rialValue > 0 ||
    usdValue > 0 ||
    usdtManualToman > 0 ||
    goldValue > 0 ||
    silverValue > 0 ||
    coinsValue > 0 ||
    totalPortfolioUsd > 0 ||
    (hasBlockchainWallet && blockchainToman > 0);

  const minutesOld = p ? Math.max(1, Math.round((Date.now() - p.updatedAt) / 60000)) : 0;

  return (
    <View style={styles.card}>
      {/* header */}
      <View style={styles.header}>
        <Landmark size={16} color={colors.dark.accent} />
        <Text style={styles.title}>دارایی ریالی و فلزات</Text>
        <Pressable onPress={refresh} style={styles.refreshBtn}>
          {pricesQuery.isFetching ? (
            <ActivityIndicator size="small" color={colors.dark.accent} />
          ) : (
            <RefreshCw size={14} color={colors.dark.textSecondary} />
          )}
        </Pressable>
        <Pressable onPress={toggleExpanded} style={styles.chevronBtn}>
          {expanded ? (
            <ChevronUp size={14} color={colors.dark.textSecondary} />
          ) : (
            <ChevronDown size={14} color={colors.dark.textSecondary} />
          )}
        </Pressable>
      </View>

      {/* live price list */}
      <Text style={styles.blockLabel}>قیمت‌های لحظه‌ای (تومان)</Text>
      <View style={styles.priceBlock}>
        <View style={styles.priceGrid}>
          <PriceChip label="طلای ۱۸" value={p?.gold18} />
          <PriceChip label="طلای ۲۴" value={p?.gold24} />
          <PriceChip label="مثقال" value={p?.mesghal} />
          <PriceChip label="نقره ۹۹۹" value={p?.silver999} />
          <PriceChip label="نقره ۹۲۵" value={p?.silver925} />
          <PriceChip label="سکه امامی" value={p?.coinEmami} />
          <PriceChip label="سکه بهار" value={p?.coinBahar} />
          <PriceChip label="نیم سکه" value={p?.coinNim} />
          <PriceChip label="ربع سکه" value={p?.coinRob} />
          <PriceChip label="دلار" value={p?.dollar} />
          <PriceChip label="تتر" value={usdtToToman > 0 ? usdtToToman : undefined} />
        </View>
        {p && (
          <Text style={styles.priceNote}>منبع: TGJU • {minutesOld} دقیقه پیش</Text>
        )}
        {!p && !pricesQuery.isFetching && (
          <Text style={styles.priceNote}>قیمت‌ها در دسترس نیست — بعداً تازه‌سازی کنید</Text>
        )}
      </View>

      {/* مجموع کل */}
      <View style={styles.totalBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            مجموع کل دارایی (ریال + دلار + تتر + طلا + نقره + سکه + ارز
            {hasBlockchainWallet ? ' + کیف بلاکچین' : ''})
          </Text>
        </View>
        <Text style={styles.totalAmount}>
          {hasAnyInput ? `${formatToman(grandTotal)} تومان` : '—'}
        </Text>
        {hasAnyInput && grandTotal >= 1000 && (
          <Text style={styles.totalExact}>{formatFullToman(Math.round(grandTotal))} تومان</Text>
        )}
        <View style={styles.totalBreakdown}>
          <Text style={styles.breakdownText}>
            ریال {formatToman(rialValue)} • دلار {formatToman(usdValue)} • تتر{' '}
            {formatToman(usdtManualToman)} • طلا {formatToman(goldValue)} • نقره{' '}
            {formatToman(silverValue)} • سکه {formatToman(coinsValue)} • ارز {formatToman(cryptoToman)}
            {hasBlockchainWallet ? ` • کیف بلاکچین ${formatToman(blockchainValue)}` : ''}
          </Text>
        </View>
      </View>

      {/* PnL card */}
      <LocalAssetsPnl
        assets={assets}
        prices={p ?? undefined}
        usdtToToman={usdtToToman}
        blockchainPnlTomanByPeriod={blockchainPnlTomanByPeriod}
        hasBlockchainWallet={hasBlockchainWallet}
      />

      {/* دارایی‌های من */}
      <Pressable onPress={toggleExpanded} style={styles.myAssetsHeader}>
        <Text style={styles.myAssetsTitle}>دارایی‌های من</Text>
        {expanded ? (
          <ChevronUp size={14} color={colors.dark.textSecondary} />
        ) : (
          <ChevronDown size={14} color={colors.dark.textSecondary} />
        )}
      </Pressable>

      {expanded && (
        <>
          <AssetRow
            icon={<Banknote size={14} color={colors.dark.accent} />}
            label="ریال / تومان نقدی"
            value={assets.rialCash}
            onChangeText={(t) => update({ rialCash: t })}
            placeholder="مثلاً 50000000"
            keyboardType="number-pad"
            unitLabel="تومان"
            tomanValue={rialValue}
            valueHint="مقدار را به تومان وارد کنید"
          />
          <AssetRow
            icon={<DollarSign size={14} color={colors.dark.green} />}
            label="دلار کاغذی (فیزیکی)"
            value={assets.usdCash}
            onChangeText={(t) => update({ usdCash: t })}
            placeholder="مثلاً 500"
            keyboardType="decimal-pad"
            unitLabel="دلار"
            tomanValue={usdValue}
            valueHint={
              usdRate > 0
                ? `نرخ هر دلار: ${formatFullToman(usdRate)} تومان${
                    p && p.dollar > 0 ? '' : ' (تتر)'
                  }`
                : 'نرخ دلار در حال دریافت'
            }
          />
          <AssetRow
            icon={<DollarSign size={14} color={colors.dark.green} />}
            label="تتر (USDT)"
            value={assets.usdtQty}
            onChangeText={(t) => update({ usdtQty: t })}
            placeholder="مثلاً 1000"
            keyboardType="decimal-pad"
            unitLabel="تتر"
            tomanValue={usdtManualToman}
            valueHint={
              usdtToToman > 0
                ? `قیمت هر تتر: ${formatFullToman(usdtToToman)} تومان`
                : 'قیمت تتر در حال دریافت'
            }
          />
          <AssetRow
            icon={<Gem size={14} color={colors.dark.accent} />}
            label="طلا (گرم)"
            value={assets.goldGrams}
            onChangeText={(t) => update({ goldGrams: t })}
            placeholder="مثلاً 12.5"
            keyboardType="decimal-pad"
            unitLabel="گرم"
            tomanValue={goldValue}
            valueHint={
              goldUnit > 0 ? `قیمت هر گرم: ${formatFullToman(goldUnit)}` : 'قیمت در حال دریافت'
            }
          >
            <Selector
              options={[
                { key: '18', label: '۱۸ عیار' },
                { key: '24', label: '۲۴ عیار' },
              ]}
              active={assets.goldKarat}
              onSelect={(k) => update({ goldKarat: k as '18' | '24' })}
            />
          </AssetRow>
          <AssetRow
            icon={<Medal size={14} color={colors.dark.textSecondary} />}
            label="نقره (گرم)"
            value={assets.silverGrams}
            onChangeText={(t) => update({ silverGrams: t })}
            placeholder="مثلاً 100"
            keyboardType="decimal-pad"
            unitLabel="گرم"
            tomanValue={silverValue}
            valueHint={
              silverUnit > 0
                ? `قیمت هر گرم: ${formatFullToman(silverUnit)}`
                : 'قیمت در حال دریافت'
            }
          >
            <Selector
              options={[
                { key: '999', label: '۹۹۹' },
                { key: '925', label: '۹۲۵' },
              ]}
              active={assets.silverType}
              onSelect={(k) => update({ silverType: k as '999' | '925' })}
            />
          </AssetRow>
          <AssetRow
            icon={<Coins size={14} color={colors.dark.accent} />}
            label="سکه امامی (تعداد)"
            value={assets.coinEmami}
            onChangeText={(t) => update({ coinEmami: t })}
            placeholder="مثلاً 2"
            keyboardType="number-pad"
            unitLabel="عدد"
            tomanValue={coinValues.emami}
            valueHint={
              p?.coinEmami ? `قیمت هر عدد: ${formatFullToman(p.coinEmami)}` : 'قیمت در حال دریافت'
            }
          />
          <AssetRow
            icon={<Coins size={14} color={colors.dark.accent} />}
            label="سکه بهار آزادی (تعداد)"
            value={assets.coinBahar}
            onChangeText={(t) => update({ coinBahar: t })}
            placeholder="مثلاً 1"
            keyboardType="number-pad"
            unitLabel="عدد"
            tomanValue={coinValues.bahar}
            valueHint={
              p?.coinBahar ? `قیمت هر عدد: ${formatFullToman(p.coinBahar)}` : 'قیمت در حال دریافت'
            }
          />
          <AssetRow
            icon={<Coins size={14} color={colors.dark.accent} />}
            label="نیم سکه (تعداد)"
            value={assets.coinNim}
            onChangeText={(t) => update({ coinNim: t })}
            placeholder="مثلاً 3"
            keyboardType="number-pad"
            unitLabel="عدد"
            tomanValue={coinValues.nim}
            valueHint={p?.coinNim ? `قیمت هر عدد: ${formatFullToman(p.coinNim)}` : 'قیمت در حال دریافت'}
          />
          <AssetRow
            icon={<Coins size={14} color={colors.dark.accent} />}
            label="ربع سکه (تعداد)"
            value={assets.coinRob}
            onChangeText={(t) => update({ coinRob: t })}
            placeholder="مثلاً 5"
            keyboardType="number-pad"
            unitLabel="عدد"
            tomanValue={coinValues.rob}
            valueHint={p?.coinRob ? `قیمت هر عدد: ${formatFullToman(p.coinRob)}` : 'قیمت در حال دریافت'}
          />

          {/* ردیف کیف بلاکچین فقط خواندنی */}
          {hasBlockchainWallet && (
            <View style={styles.assetRow}>
              <View style={[styles.assetIcon, { backgroundColor: colors.dark.blueDim }]}>
                <Lock size={14} color={colors.dark.blue} />
              </View>
              <View style={styles.assetMain}>
                <Text style={styles.assetLabel}>کیف پول بلاکچین (فقط خواندنی)</Text>
                <Text style={styles.assetHint}>
                  {blockchainTotalUsd > 0
                    ? `≈ $${blockchainTotalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} — موجودی ریالی لحظه‌ای`
                    : 'در حال دریافت موجودی…'}
                </Text>
              </View>
              <View style={styles.assetValueCol}>
                <Text style={[styles.assetValue, !(blockchainValue > 0) && styles.assetValueEmpty]}>
                  {blockchainValue > 0 ? `${formatFullToman(Math.round(blockchainValue))} ت` : '—'}
                </Text>
              </View>
            </View>
          )}

          {/* ردیف ارز دیجیتال */}
          {totalPortfolioUsd > 0 && (
            <View style={styles.assetRow}>
              <View style={[styles.assetIcon, { backgroundColor: colors.dark.orangeDim }]}>
                <Coins size={14} color={colors.dark.orange} />
              </View>
              <View style={styles.assetMain}>
                <Text style={styles.assetLabel}>ارز دیجیتال (صرافی‌ها)</Text>
                <Text style={styles.assetHint}>
                  ≈ ${totalPortfolioUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} — موجودی ریالی لحظه‌ای
                </Text>
              </View>
              <View style={styles.assetValueCol}>
                <Text style={[styles.assetValue, !(cryptoToman > 0) && styles.assetValueEmpty]}>
                  {cryptoToman > 0 ? `${formatFullToman(Math.round(cryptoToman))} ت` : '—'}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// PnL card
const PNL_PERIODS = [1, 7, 30, 90, 180] as const;
type LocalPnlPeriod = (typeof PNL_PERIODS)[number];
const PNL_PERIOD_LABEL: Record<number, string> = {
  1: 'امروز',
  7: '۷ روز',
  30: '۳۰ روز',
  90: '۹۰ روز',
  180: '۱۸۰ روز',
};

interface HeldAssetSpec {
  key: string;
  label: string;
  qty: number;
  symbol: string;
  liveUnit: number;
}

function LocalAssetsPnl({
  assets,
  prices,
  usdtToToman,
  blockchainPnlTomanByPeriod,
  hasBlockchainWallet,
}: {
  assets: LocalAssets;
  prices?: IranMarketPrices;
  usdtToToman: number;
  blockchainPnlTomanByPeriod?: Record<number, { pnlToman: number; basisToman: number } | null>;
  hasBlockchainWallet?: boolean;
}) {
  const [period, setPeriod] = useState<number>(180);
  const goldQty = parseTomanInput(assets.goldGrams) || 0;
  const silverQty = parseTomanInput(assets.silverGrams) || 0;
  const usdQty = parseTomanInput(assets.usdCash) || 0;
  const usdtQty = parseTomanInput(assets.usdtQty) || 0;

  const held: HeldAssetSpec[] = useMemo(() => {
    const list: HeldAssetSpec[] = [];
    if (usdQty > 0) {
      list.push({
        key: 'usd',
        label: 'دلار کاغذی',
        qty: usdQty,
        symbol: TgjuHistorySymbol.dollar,
        liveUnit: prices?.dollar ?? 0,
      });
    }
    if (usdtQty > 0) {
      list.push({
        key: 'usdt',
        label: 'تتر (دستی)',
        qty: usdtQty,
        symbol: TgjuHistorySymbol.dollar,
        liveUnit: usdtToToman,
      });
    }
    if (goldQty > 0) {
      const is24 = assets.goldKarat === '24';
      list.push({
        key: 'gold',
        label: is24 ? 'طلای ۲۴ عیار' : 'طلای ۱۸ عیار',
        qty: goldQty,
        symbol: is24 ? TgjuHistorySymbol.gold24 : TgjuHistorySymbol.gold18,
        liveUnit: (is24 ? prices?.gold24 : prices?.gold18) ?? 0,
      });
    }
    if (silverQty > 0) {
      const is925 = assets.silverType === '925';
      list.push({
        key: 'silver',
        label: is925 ? 'نقره ۹۲۵' : 'نقره ۹۹۹',
        qty: silverQty,
        symbol: is925 ? TgjuHistorySymbol.silver925 : TgjuHistorySymbol.silver999,
        liveUnit: (is925 ? prices?.silver925 : prices?.silver999) ?? 0,
      });
    }
    const coins: Array<[string, string, string, number]> = [
      ['emami', 'سکه امامی', 'sekee', parseTomanInput(assets.coinEmami) || 0],
      ['bahar', 'سکه بهار آزادی', 'sekeb', parseTomanInput(assets.coinBahar) || 0],
      ['nim', 'نیم سکه', 'nim', parseTomanInput(assets.coinNim) || 0],
      ['rob', 'ربع سکه', 'rob', parseTomanInput(assets.coinRob) || 0],
    ];
    const coinLive: Record<string, number> = {
      emami: prices?.coinEmami ?? 0,
      bahar: prices?.coinBahar ?? 0,
      nim: prices?.coinNim ?? 0,
      rob: prices?.coinRob ?? 0,
    };
    for (const [key, label, symbol, qty] of coins) {
      if (qty > 0) list.push({ key, label, qty, symbol, liveUnit: coinLive[key] ?? 0 });
    }
    return list;
  }, [goldQty, silverQty, usdQty, usdtQty, usdtToToman, assets, prices]);

  const symbols = useMemo(() => [...new Set(held.map((h) => h.symbol))], [held]);

  const historyQuery = useQuery({
    queryKey: ['tgju-history', symbols],
    queryFn: async (): Promise<Record<string, TgjuClosePoint[]>> => {
      const entries = await Promise.all(
        symbols.map(async (s) => [s, await fetchTgjuCloses(s)] as const)
      );
      return Object.fromEntries(entries);
    },
    enabled: symbols.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const seriesMap = historyQuery.data;

  const rows = useMemo(() => {
    if (!seriesMap) return [] as Array<{ label: string; pnl: number; basis: number }>;
    const target = Date.now() - period * 86_400_000;
    const out: Array<{ label: string; pnl: number; basis: number }> = [];
    for (const h of held) {
      const series = seriesMap[h.symbol];
      if (!series || series.length === 0) continue;
      const nowUnit = h.liveUnit > 0 ? h.liveUnit : latestClose(series) ?? 0;
      const thenUnit = closeAtOrBefore(series, target);
      if (nowUnit <= 0 || thenUnit === null || thenUnit <= 0) continue;
      out.push({
        label: h.label,
        pnl: h.qty * (nowUnit - thenUnit),
        basis: h.qty * thenUnit,
      });
    }
    return out;
  }, [seriesMap, held, period]);

  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const totalBasis = rows.reduce((s, r) => s + r.basis, 0);
  const bcEntry = blockchainPnlTomanByPeriod?.[period] ?? null;
  const grandPnl = totalPnl + (bcEntry?.pnlToman ?? 0);
  const grandBasis = totalBasis + (bcEntry?.basisToman ?? 0);
  const totalPct = grandBasis > 0 ? (grandPnl / grandBasis) * 100 : 0;

  if (held.length === 0 && !hasBlockchainWallet) return null;

  const positive = grandPnl >= 0;

  return (
    <View style={styles.pnlBox}>
      <View style={styles.pnlHeader}>
        {positive ? (
          <TrendingUp size={16} color={colors.dark.green} />
        ) : (
          <TrendingDown size={16} color={colors.dark.red} />
        )}
        <Text style={styles.pnlTitle}>سود / زیان دارایی‌ها (تغییر قیمت بازار)</Text>
      </View>

      <View style={styles.periodSelector}>
        {PNL_PERIODS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setPeriod(d)}
            style={[styles.periodChip, period === d && styles.periodChipActive]}
          >
            <Text
              style={[
                styles.periodChipText,
                period === d && styles.periodChipTextActive,
              ]}
            >
              {PNL_PERIOD_LABEL[d]}
            </Text>
          </Pressable>
        ))}
      </View>

      {historyQuery.isLoading && held.length > 0 ? (
        <Text style={styles.pnlHint}>دریافت تاریخچه قیمت‌ها…</Text>
      ) : (historyQuery.isError || rows.length === 0) && !bcEntry ? (
        <Text style={styles.pnlHint}>
          تاریخچه قیمت برای این بازه در دسترس نیست — بعداً دوباره تلاش کنید
        </Text>
      ) : (
        <>
          <Text
            style={[
              styles.pnlTotal,
              { color: positive ? colors.dark.green : colors.dark.red },
            ]}
          >
            {positive ? '+' : '−'} {formatFullToman(Math.abs(Math.round(grandPnl)))} تومان
          </Text>
          <Text
            style={[
              styles.pnlPct,
              { color: positive ? colors.dark.green : colors.dark.red },
            ]}
          >
            {positive ? '▲' : '▼'} {Math.abs(totalPct).toLocaleString('fa-IR', {
              maximumFractionDigits: 1,
            })}٪ در {PNL_PERIOD_LABEL[period]}
          </Text>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.pnlRow}>
              <Text style={styles.pnlRowLabel}>{r.label}</Text>
              <Text
                style={[
                  styles.pnlRowValue,
                  { color: r.pnl >= 0 ? colors.dark.green : colors.dark.red },
                ]}
              >
                {r.pnl >= 0 ? '+' : '−'} {formatFullToman(Math.abs(Math.round(r.pnl)))} ت
              </Text>
            </View>
          ))}
          {hasBlockchainWallet && (
            <View style={styles.pnlRow}>
              <Text style={styles.pnlRowLabel}>کیف پول بلاکچین</Text>
              <Text
                style={[
                  styles.pnlRowValue,
                  {
                    color: bcEntry && bcEntry.pnlToman >= 0 ? colors.dark.green : colors.dark.red,
                  },
                ]}
              >
                {!bcEntry
                  ? 'در حال محاسبه…'
                  : `${bcEntry.pnlToman >= 0 ? '+' : '−'} ${formatFullToman(
                      Math.abs(Math.round(bcEntry.pnlToman))
                    )} ت`}
              </Text>
            </View>
          )}
          <Text style={styles.pnlNote}>
            مبنا: قیمت پایان روزِ {PNL_PERIOD_LABEL[period]} پیش تا امروز (منبع: TGJU؛ کیف بلاکچین:
            قیمت بایننس × نرخ تتر). تغییر ارزش بر اساس نوسان بازار است، نه زمان خرید واقعی شما.
          </Text>
        </>
      )}
    </View>
  );
}

// ── sub-components ──
function PriceChip({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.priceChip}>
      <Text style={styles.priceChipLabel}>{label}</Text>
      <Text
        style={[
          styles.priceChipValue,
          !(value && value > 0) && styles.priceChipEmpty,
        ]}
      >
        {value && value > 0 ? formatFullToman(value) : '…'}
      </Text>
    </View>
  );
}

interface AssetRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType: 'number-pad' | 'decimal-pad';
  unitLabel: string;
  tomanValue: number;
  valueHint: string;
  children?: React.ReactNode;
}

function AssetRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  unitLabel,
  tomanValue,
  valueHint,
  children,
}: AssetRowProps) {
  return (
    <View style={styles.assetRow}>
      <View style={styles.assetIcon}>{icon}</View>
      <View style={styles.assetMain}>
        <Text style={styles.assetLabel}>{label}</Text>
        <View style={styles.assetInputRow}>
          <TextInput
            style={styles.assetInput}
            value={value}
            onChangeText={onChangeText}
            onEndEditing={(e) => {
              const n = parseTomanInput(e.nativeEvent.text);
              onChangeText(Number.isFinite(n) && n > 0 ? String(n) : '');
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.dark.textSecondary}
            keyboardType={keyboardType}
            inputMode={keyboardType === 'decimal-pad' ? 'decimal' : 'numeric'}
            returnKeyType="done"
            maxLength={14}
            textAlign="left"
          />
          <Text style={styles.assetUnit}>{unitLabel}</Text>
        </View>
        <Text style={styles.assetHint}>{valueHint}</Text>
        {children}
      </View>
      <View style={styles.assetValueCol}>
        <Text style={[styles.assetValue, !(tomanValue > 0) && styles.assetValueEmpty]}>
          {tomanValue > 0 ? `${formatFullToman(Math.round(tomanValue))} ت` : '—'}
        </Text>
      </View>
    </View>
  );
}

function Selector({
  options,
  active,
  onSelect,
}: {
  options: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={styles.selector}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onSelect(o.key)}
          style={[
            styles.selectorChip,
            active === o.key && styles.selectorChipActive,
          ]}
        >
          <Text
            style={[
              styles.selectorChipText,
              active === o.key && styles.selectorChipTextActive,
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── styles ──
const styles = createThemedStyles(() =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.dark.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.dark.accent + '26',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    refreshBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.dark.accentDim,
    },
    chevronBtn: {
      padding: 6,
      borderRadius: 8,
    },
    myAssetsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    myAssetsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.text,
    },
    blockLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.textSecondary,
      marginBottom: 8,
      textAlign: 'right',
    },
    priceBlock: {
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      padding: 10,
    },
    priceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    priceChip: {
      flexBasis: '31%',
      flexGrow: 1,
      backgroundColor: colors.dark.surface,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    priceChipLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    priceChipValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.dark.text,
      marginTop: 2,
    },
    priceChipEmpty: {
      color: colors.dark.textSecondary,
      fontWeight: '400',
    },
    priceNote: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      marginTop: 6,
      textAlign: 'left',
    },
    totalBox: {
      marginTop: 10,
      backgroundColor: colors.dark.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.dark.green + '33',
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    totalLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.textSecondary,
      flex: 1,
      textAlign: 'right',
    },
    totalAmount: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.dark.green,
      textAlign: 'right',
    },
    totalExact: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    totalBreakdown: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.dark.border,
    },
    breakdownText: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 16,
    },
    pnlBox: {
      marginTop: 12,
      backgroundColor: colors.dark.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    pnlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    pnlTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    periodSelector: {
      flexDirection: 'row-reverse',
      gap: 6,
      marginBottom: 8,
    },
    periodChip: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.dark.surface,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    periodChipActive: {
      backgroundColor: colors.dark.accentDim,
      borderColor: colors.dark.accent,
    },
    periodChipText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.dark.textSecondary,
    },
    periodChipTextActive: {
      color: colors.dark.accent,
      fontWeight: '700',
    },
    pnlHint: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'right',
    },
    pnlTotal: {
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'right',
      marginBottom: 2,
    },
    pnlPct: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'right',
      marginBottom: 8,
    },
    pnlRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    pnlRowLabel: {
      fontSize: 10,
      color: colors.dark.textSecondary,
    },
    pnlRowValue: {
      fontSize: 11,
      fontWeight: '700',
    },
    pnlNote: {
      fontSize: 9,
      color: colors.dark.textMuted,
      textAlign: 'right',
      marginTop: 8,
      lineHeight: 14,
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    assetIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.dark.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    assetMain: {
      flex: 1,
      gap: 4,
    },
    assetLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.dark.text,
      textAlign: 'right',
    },
    assetInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    assetInput: {
      flex: 1,
      backgroundColor: colors.dark.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dark.border,
      color: colors.dark.text,
      fontSize: 13,
      fontWeight: '600',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    assetUnit: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      minWidth: 30,
    },
    assetHint: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      textAlign: 'right',
    },
    assetValueCol: {
      minWidth: 92,
      alignItems: 'flex-start',
    },
    assetValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.green,
    },
    assetValueEmpty: {
      color: colors.dark.textSecondary,
      fontWeight: '400',
    },
    selector: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 2,
    },
    selectorChip: {
      backgroundColor: colors.dark.card,
      borderWidth: 1,
      borderColor: colors.dark.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    selectorChipActive: {
      backgroundColor: colors.dark.accentDim,
      borderColor: colors.dark.accent,
    },
    selectorChipText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.dark.textSecondary,
    },
    selectorChipTextActive: {
      color: colors.dark.accent,
      fontWeight: '700',
    },
  })
);
