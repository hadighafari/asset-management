// ============================================================
//  Wallet Screen — صفحه اصلی مدیریت دارایی
//  4 تب در یک صفحه (نه اسکرول افقی):
//   1. ریالی و فلزات
//   2. پیش‌بینی طلا
//   3. کیف پول بلاکچین
//   4. ارز دیجیتال
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import colors from '../../constants/colors';
import { createThemedStyles } from '../../utils/themeStyles';
import { fetchUsdtTomanPrice } from '../../utils/nobitexApi';
import { UpdateBanner } from '../../components/UpdateBanner';
import LocalAssetsSection from '../../components/LocalAssetsSection';
import GoldPredictionSection from '../../components/GoldPredictionSection';
import BlockchainWalletsSection from '../../components/BlockchainWalletsSection';
import ExchangeAssetsSection from '../../components/ExchangeAssetsSection';
import { useApp } from '../../contexts/AppContext';
import {
  Coins,
  Gem,
  Wallet,
  Landmark,
  TrendingUp,
  Lock,
  ShieldAlert,
} from 'lucide-react-native';

type Tab = 'rial' | 'gold' | 'blockchain' | 'crypto';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('rial');
  const [portfolioUsd, setPortfolioUsd] = useState(0);
  const [blockchainToman, setBlockchainToman] = useState(0);
  const [hasBlockchainWallet, setHasBlockchainWallet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isIran, canAccessCrypto, ipInfo, refreshIp } = useApp();

  const tomanQuery = useQuery({
    queryKey: ['usdt-toman'],
    queryFn: fetchUsdtTomanPrice,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const usdtToToman = tomanQuery.data?.usdtToToman ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([tomanQuery.refetch(), refreshIp()]);
    setRefreshing(false);
  }, [tomanQuery, refreshIp]);

  const onPortfolioUsd = useCallback((usd: number) => {
    setPortfolioUsd(usd);
  }, []);

  const onBlockchainToman = useCallback((toman: number, hasWallet: boolean) => {
    setBlockchainToman(toman);
    setHasBlockchainWallet(hasWallet);
  }, []);

  // تعریف تب‌ها
  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'rial', label: 'ریالی و فلزات', icon: Coins },
    { id: 'gold', label: 'پیش‌بینی طلا', icon: Gem },
    { id: 'blockchain', label: 'کیف پول', icon: Wallet },
    { id: 'crypto', label: 'ارز دیجیتال', icon: Landmark },
  ];

  // عرض هر تب - 4 تب در یک ردیف
  const tabWidth = (SCREEN_WIDTH - 24 - 18) / 4; // 24 padding, 18 gaps

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

      {/* Update Banner */}
      <UpdateBanner />

      {/* Iran IP Warning */}
      {isIran && (
        <View style={styles.ipWarning}>
          <ShieldAlert size={16} color={colors.dark.red} />
          <Text style={styles.ipWarningText}>
            IP شما از ایران است. بخش «کیف پول» و «ارز دیجیتال» نیاز به روشن کردن فیلترشکن دارند.
          </Text>
        </View>
      )}

      {/* 4 تب در یک ردیف */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLocked = (tab.id === 'blockchain' || tab.id === 'crypto') && !canAccessCrypto;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                { width: tabWidth },
                isActive && styles.tabActive,
                isLocked && styles.tabLocked,
              ]}
            >
              <Icon
                size={16}
                color={isLocked ? colors.dark.textMuted : (isActive ? colors.dark.accent : colors.dark.textSecondary)}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                  isLocked && styles.tabTextLocked,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {isLocked && <Lock size={10} color={colors.dark.textMuted} />}
            </Pressable>
          );
        })}
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
        canAccessCrypto ? (
          <BlockchainWalletsSection
            onBlockchainToman={onBlockchainToman}
            usdtToToman={usdtToToman}
          />
        ) : (
          <LockedSection
            title="کیف پول بلاکچین"
            message="برای استفاده از این بخش و خواندن اطلاعات، فیلترشکن را روشن کنید."
          />
        )
      )}

      {activeTab === 'crypto' && (
        canAccessCrypto ? (
          <ExchangeAssetsSection onPortfolioUsd={onPortfolioUsd} />
        ) : (
          <LockedSection
            title="ارز دیجیتال"
            message="برای استفاده از این بخش و خواندن اطلاعات، فیلترشکن را روشن کنید."
          />
        )
      )}
    </ScrollView>
  );
}

// کامپوننت بخش قفل‌شده
function LockedSection({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedIconWrap}>
        <Lock size={32} color={colors.dark.red} />
      </View>
      <Text style={styles.lockedTitle}>{title}</Text>
      <Text style={styles.lockedMessage}>{message}</Text>
    </View>
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
    ipWarning: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginBottom: 8,
      padding: 10,
      backgroundColor: colors.dark.redDim,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.dark.red + '44',
    },
    ipWarningText: {
      fontSize: 10,
      color: colors.dark.red,
      flex: 1,
      textAlign: 'right',
      fontWeight: '600',
    },
    tabsRow: {
      flexDirection: 'row-reverse',
      paddingHorizontal: 12,
      gap: 6,
      marginBottom: 12,
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.dark.surface,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    tabActive: {
      backgroundColor: colors.dark.accentDim,
      borderColor: colors.dark.accent,
    },
    tabLocked: {
      opacity: 0.5,
    },
    tabText: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.dark.textSecondary,
      textAlign: 'center',
    },
    tabTextActive: {
      color: colors.dark.accent,
      fontWeight: '700',
    },
    tabTextLocked: {
      color: colors.dark.textMuted,
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
    lockedCard: {
      marginHorizontal: 12,
      padding: 32,
      backgroundColor: colors.dark.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.dark.red + '33',
      alignItems: 'center',
    },
    lockedIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.dark.redDim,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    lockedTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    lockedMessage: {
      fontSize: 12,
      color: colors.dark.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  })
);
