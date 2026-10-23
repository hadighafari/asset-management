// ============================================================
//  GoldPredictionSection — «پیش‌بینی قیمت طلا»
//  - پیش‌بینی بر اساس تحلیل تکنیکال (میانگین متحرک)
//  - قیمت از معاملات فیوچرز طلا (GC=F, XAU/USD)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Gem,
  Activity,
  AlertCircle,
  DollarSign,
} from 'lucide-react-native';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import {
  fetchIranMarketPrices,
  formatFullToman,
} from '../utils/iranMarketApi';
import {
  fetchTgjuCloses,
  TgjuHistorySymbol,
  TgjuClosePoint,
} from '../utils/tgjuHistoryApi';

interface Prediction {
  label: string;
  value: number;
  pct: number;
  confidence: 'low' | 'medium' | 'high';
  hint: string;
}

// گرفتن قیمت طلا از معاملات فیوچرز (Yahoo Finance)
async function fetchGoldFuturesPrice(): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    // استفاده از API عمومی برای قیمت طلا (XAU/USD)
    const res = await fetch('https://api.gold-api.com/price/XAU', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = data.price || 0;
    if (price <= 0) return null;
    return {
      price,
      change: 0,
      changePct: 0,
    };
  } catch (e) {
    console.log('[GoldFutures] failed:', e);
    return null;
  }
}

export default function GoldPredictionSection() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat');

  const pricesQuery = useQuery({
    queryKey: ['iran-market-prices'],
    queryFn: fetchIranMarketPrices,
    refetchInterval: 5 * 60 * 1000,
  });

  const historyQuery = useQuery({
    queryKey: ['tgju-history', [TgjuHistorySymbol.gold18]],
    queryFn: async (): Promise<TgjuClosePoint[]> => {
      return await fetchTgjuCloses(TgjuHistorySymbol.gold18);
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // قیمت طلا از معاملات فیوچرز (دلاری)
  const futuresQuery = useQuery({
    queryKey: ['gold-futures'],
    queryFn: fetchGoldFuturesPrice,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!historyQuery.data || historyQuery.data.length < 30) {
      setPredictions([]);
      return;
    }
    const series = historyQuery.data;
    const last = series[series.length - 1].close;
    const last7 = series.slice(-7).map((p) => p.close);
    const last30 = series.slice(-30).map((p) => p.close);
    const last90 = series.slice(-90).map((p) => p.close);

    const ma7 = last7.reduce((s, v) => s + v, 0) / last7.length;
    const ma30 = last30.reduce((s, v) => s + v, 0) / last30.length;
    const ma90 = last90.reduce((s, v) => s + v, 0) / last90.length;

    const change1 = ((last - series[series.length - 2]?.close) / (series[series.length - 2]?.close || 1)) * 100; // امروز
    const change7 = ((last - last7[0]) / last7[0]) * 100;
    const change30 = ((last - last30[0]) / last30[0]) * 100;
    const change90 = ((last - last90[0]) / last90[0]) * 100;

    if (ma7 > ma30 && ma30 > ma90) setTrend('up');
    else if (ma7 < ma30 && ma30 < ma90) setTrend('down');
    else setTrend('flat');

    const vol7 = Math.abs(change7);
    const pred1 = last * (1 + (change1 / 100) * 0.3); // امروز
    const pred1Pct = ((pred1 - last) / last) * 100;
    const pred7 = last * (1 + (change7 / 100) * 0.5);
    const pred7Pct = ((pred7 - last) / last) * 100;
    const pred30 = last * (1 + (change30 / 100) * 0.7);
    const pred30Pct = ((pred30 - last) / last) * 100;
    const pred90 = last * (1 + (change90 / 100) * 0.8);
    const pred90Pct = ((pred90 - last) / last) * 100;

    const upperBand = last * (1 + vol7 / 100);
    const lowerBand = last * (1 - vol7 / 100);

    setPredictions([
      {
        label: 'امروز',
        value: pred1,
        pct: pred1Pct,
        confidence: 'high',
        hint: `بر اساس نوسان امروز (${change1.toFixed(1)}%)`,
      },
      {
        label: '۷ روز آینده',
        value: pred7,
        pct: pred7Pct,
        confidence: vol7 < 5 ? 'high' : vol7 < 10 ? 'medium' : 'low',
        hint: `بر اساس نوسان ۷ روز اخیر (${change7.toFixed(1)}%)`,
      },
      {
        label: '۳۰ روز آینده',
        value: pred30,
        pct: pred30Pct,
        confidence: 'medium',
        hint: `بر اساس نوسان ۳۰ روز اخیر (${change30.toFixed(1)}%)`,
      },
      {
        label: '۹۰ روز آینده',
        value: pred90,
        pct: pred90Pct,
        confidence: 'low',
        hint: `بر اساس نوسان ۹۰ روز اخیر (${change90.toFixed(1)}%)`,
      },
      {
        label: 'سقف احتمالی (کوتاه‌مدت)',
        value: upperBand,
        pct: ((upperBand - last) / last) * 100,
        confidence: 'medium',
        hint: 'بر اساس نوسان ۷ روز اخیر',
      },
      {
        label: 'کف احتمالی (کوتاه‌مدت)',
        value: lowerBand,
        pct: ((lowerBand - last) / last) * 100,
        confidence: 'medium',
        hint: 'بر اساس نوسان ۷ روز اخیر',
      },
    ]);
  }, [historyQuery.data]);

  const lastPrice = pricesQuery.data?.gold18 ?? 0;
  const futuresPrice = futuresQuery.data?.price ?? 0;

  const refresh = () => {
    pricesQuery.refetch();
    historyQuery.refetch();
    futuresQuery.refetch();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Gem size={16} color={colors.dark.accent} />
        <Text style={styles.title}>پیش‌بینی قیمت طلا</Text>
        <Pressable onPress={refresh} style={styles.refreshBtn}>
          {pricesQuery.isFetching || historyQuery.isFetching || futuresQuery.isFetching ? (
            <ActivityIndicator size="small" color={colors.dark.accent} />
          ) : (
            <RefreshCw size={14} color={colors.dark.textSecondary} />
          )}
        </Pressable>
      </View>

      {/* قیمت فعلی تومانی */}
      <View style={styles.currentPriceBox}>
        <Text style={styles.currentPriceLabel}>قیمت فعلی طلای ۱۸ عیار (هر گرم)</Text>
        <Text style={styles.currentPrice}>
          {lastPrice > 0 ? `${formatFullToman(lastPrice)} تومان` : '—'}
        </Text>
        {trend !== 'flat' && (
          <View style={styles.trendWrap}>
            {trend === 'up' ? (
              <TrendingUp size={12} color={colors.dark.green} />
            ) : (
              <TrendingDown size={12} color={colors.dark.red} />
            )}
            <Text
              style={[
                styles.trendText,
                { color: trend === 'up' ? colors.dark.green : colors.dark.red },
              ]}
            >
              {trend === 'up' ? 'روند صعودی' : 'روند نزولی'}
            </Text>
          </View>
        )}
      </View>

      {/* قیمت از معاملات فیوچرز (دلاری) */}
      <View style={styles.futuresBox}>
        <View style={styles.futuresHeader}>
          <DollarSign size={14} color={colors.dark.green} />
          <Text style={styles.futuresTitle}>قیمت جهانی طلا (معاملات فیوچرز)</Text>
        </View>
        {futuresQuery.isLoading ? (
          <Text style={styles.futuresLoading}>در حال دریافت...</Text>
        ) : futuresPrice > 0 ? (
          <Text style={styles.futuresPrice}>
            ${futuresPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} / اونس
          </Text>
        ) : (
          <Text style={styles.futuresError}>قیمت جهانی در دسترس نیست</Text>
        )}
      </View>

      {/* پیش‌بینی‌ها */}
      {predictions.length > 0 ? (
        <ScrollView horizontal={false} style={styles.predictionsWrap}>
          {predictions.map((p, idx) => {
            const isUp = p.pct >= 0;
            const confidenceColor =
              p.confidence === 'high'
                ? colors.dark.green
                : p.confidence === 'medium'
                ? colors.dark.accent
                : colors.dark.textSecondary;
            return (
              <View key={idx} style={styles.predictionRow}>
                <View style={styles.predictionLeft}>
                  <Text style={styles.predictionLabel}>{p.label}</Text>
                  <Text style={styles.predictionHint}>{p.hint}</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '22' }]}>
                    <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                      {p.confidence === 'high'
                        ? 'اطمینان بالا'
                        : p.confidence === 'medium'
                        ? 'اطمینان متوسط'
                        : 'اطمینان پایین'}
                    </Text>
                  </View>
                </View>
                <View style={styles.predictionRight}>
                  <Text style={styles.predictionValue}>
                    {formatFullToman(Math.round(p.value))} ت
                  </Text>
                  <View style={styles.predictionPctWrap}>
                    {isUp ? (
                      <TrendingUp size={11} color={colors.dark.green} />
                    ) : (
                      <TrendingDown size={11} color={colors.dark.red} />
                    )}
                    <Text
                      style={[
                        styles.predictionPct,
                        { color: isUp ? colors.dark.green : colors.dark.red },
                      ]}
                    >
                      {isUp ? '+' : ''}{p.pct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : historyQuery.isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.dark.accent} />
          <Text style={styles.loadingText}>در حال دریافت تاریخچه قیمت‌ها…</Text>
        </View>
      ) : historyQuery.isError ? (
        <View style={styles.errorWrap}>
          <AlertCircle size={16} color={colors.dark.red} />
          <Text style={styles.errorText}>
            تاریخچه قیمت در دسترس نیست. بعداً تلاش کنید.
          </Text>
        </View>
      ) : null}

      {/* هشدار */}
      <View style={styles.warningBox}>
        <Activity size={11} color={colors.dark.textMuted} />
        <Text style={styles.warningText}>
          این پیش‌بینی‌ها بر اساس تحلیل تکنیکال ساده (میانگین متحرک) و قیمت معاملات فیوچرز است و نباید به‌عنوان توصیه سرمایه‌گذاری در نظر گرفته شود. بازار طلا تحت تأثیر عوامل متعددی (سیاسی، اقتصادی، جهانی) قرار دارد.
        </Text>
      </View>
    </View>
  );
}

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
    currentPriceBox: {
      backgroundColor: colors.dark.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      alignItems: 'center',
    },
    currentPriceLabel: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    currentPrice: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.dark.accent,
      textAlign: 'center',
    },
    trendWrap: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    trendText: {
      fontSize: 10,
      fontWeight: '700',
    },
    futuresBox: {
      backgroundColor: colors.dark.greenDim,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    futuresHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    futuresTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.dark.green,
      flex: 1,
      textAlign: 'right',
    },
    futuresPrice: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.dark.green,
      textAlign: 'center',
    },
    futuresLoading: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
    },
    futuresError: {
      fontSize: 11,
      color: colors.dark.red,
      textAlign: 'center',
    },
    predictionsWrap: {
      gap: 8,
    },
    predictionRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    predictionLeft: {
      flex: 1,
    },
    predictionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'right',
      marginBottom: 2,
    },
    predictionHint: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginBottom: 4,
    },
    confidenceBadge: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    confidenceText: {
      fontSize: 9,
      fontWeight: '600',
    },
    predictionRight: {
      alignItems: 'flex-end',
    },
    predictionValue: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.dark.text,
    },
    predictionPctWrap: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 2,
      marginTop: 2,
    },
    predictionPct: {
      fontSize: 11,
      fontWeight: '700',
    },
    loadingWrap: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
    },
    errorWrap: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      backgroundColor: colors.dark.redDim,
      borderRadius: 8,
    },
    errorText: {
      fontSize: 11,
      color: colors.dark.red,
      flex: 1,
      textAlign: 'right',
    },
    warningBox: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 12,
      padding: 10,
      backgroundColor: colors.dark.surfaceLight,
      borderRadius: 8,
    },
    warningText: {
      fontSize: 9,
      color: colors.dark.textMuted,
      flex: 1,
      textAlign: 'right',
      lineHeight: 14,
    },
  })
);
