// ============================================================
//  Wallet Screen — صفحه اصلی مدیریت دارایی
//  شامل 4 تب فرعی:
//   1. ارز دیجیتال (صرافی‌ها)
//   2. دارایی ریالی و فلزات
//   3. پیش‌بینی طلا
//   4. کیف پول بلاکچین
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import colors from '../../constants/colors';
import { createThemedStyles } from '../../utils/themeStyles';
import { fetchUsdtTomanPrice } from '../../utils/nobitexApi';
import LocalAssetsSection from '../../components/LocalAssetsSection';
import GoldPredictionSection from '../../components/GoldPredictionSection';
import BlockchainWalletsSection from '../../components/BlockchainWalletsSection';
import ExchangeAssetsSection from '../../components/ExchangeAssetsSection';
import {
  Landmark,
  Coins,
  Gem,
  Wallet,
  TrendingUp,
} from 'lucide-react-native';

type Tab = 'crypto' | 'rial' | 'gold' | 'blockchain';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'crypto', label: 'ارز دیجیتال', icon: Landmark },
  { id: 'rial', label: 'ریالی و فلزات', icon: Coins },
  { id: 'gold', label: 'پیش‌بینی طلا', icon: Gem },
  { id: 'blockchain', label: 'کیف بلاکچین', icon: Wallet },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('rial');
  const [portfolioUsd, setPortfolioUsd] = useState(0);
  const [blockchainToman, setBlockchainToman] = useState(0);
  const [hasBlockchainWallet, setHasBlockchainWallet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // قیمت USDT/Toman برای تبدیل
  const tomanQuery = useQuery({
    queryKey: ['usdt-toman'],
    queryFn: fetchUsdtTomanPrice,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const usdtToToman = tomanQuery.data?.usdtToToman ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await tomanQuery.refetch();
    setRefreshing(false);
  }, [tomanQuery]);

  const onPortfolioUsd = useCallback((usd: number) => {
    setPortfolioUsd(usd);
  }, []);

  const onBlockchainToman = useCallback((toman: number, hasWallet: boolean) => {
    setBlockchainToman(toman);
    setHasBlockchainWallet(hasWallet);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 40,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || tomanQuery.isFetching}
          onRefresh={onRefresh}
          tintColor={colors.dark.accent}
          colors={[colors.dark.accent]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>مدیریت دارایی</Text>
          <Text style={styles.appSubtitle}>
            {usdtToToman > 0
              ? `تتر: ${usdtToToman.toLocaleString('fa-IR')} ت`
              : 'در حال دریافت قیمت‌ها...'}
          </Text>
        </View>
        <View style={styles.logoCircle}>
          <TrendingUp size={20} color={colors.dark.accent} />
        </View>
      </View>

      {/* Update Banner removed from here - shown only in settings */}

      {/* Tab Selector */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroller}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                ]}
              >
                <Icon
                  size={14}
                  color={isActive ? colors.dark.accent : colors.dark.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Total Portfolio (visible on all tabs) */}
      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>مجموع کل دارایی‌ها</Text>
        <Text style={styles.portfolioValue}>
          ${(portfolioUsd).toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </Text>
        {usdtToToman > 0 && portfolioUsd > 0 && (
          <Text style={styles.portfolioToman}>
            ≈ {(portfolioUsd * usdtToToman).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} تومان
          </Text>
        )}
      </View>

      {/* Active Tab Content */}
      {activeTab === 'crypto' && (
        <ExchangeAssetsSection onPortfolioUsd={onPortfolioUsd} />
      )}

      {activeTab === 'rial' && (
        <LocalAssetsSection
          usdtToToman={usdtToToman}
          totalPortfolioUsd={portfolioUsd}
          blockchainToman={blockchainToman}
          hasBlockchainWallet={hasBlockchainWallet}
        />
      )}

      {activeTab === 'gold' && <GoldPredictionSection />}

      {activeTab === 'blockchain' && (
        <BlockchainWalletsSection
          onBlockchainToman={onBlockchainToman}
          usdtToToman={usdtToToman}
        />
      )}
    </ScrollView>
  );
}

const styles = createThemedStyles(() =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.dark.background,
    },
    header: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    appName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.dark.accent,
      textAlign: 'right',
    },
    appSubtitle: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    logoCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.dark.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabsContainer: {
      marginHorizontal: 12,
      marginBottom: 12,
    },
    tabsScroller: {
      gap: 6,
      paddingHorizontal: 4,
    },
    tab: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.dark.surface,
      borderWidth: 1,
      borderColor: colors.dark.border,
      marginLeft: 6,
    },
    tabActive: {
      backgroundColor: colors.dark.accentDim,
      borderColor: colors.dark.accent,
    },
    tabText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.textSecondary,
    },
    tabTextActive: {
      color: colors.dark.accent,
      fontWeight: '700',
    },
    portfolioCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 16,
      backgroundColor: colors.dark.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.dark.accent + '33',
      alignItems: 'center',
    },
    portfolioLabel: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    portfolioValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.dark.accent,
    },
    portfolioToman: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      marginTop: 4,
    },
  })
);
