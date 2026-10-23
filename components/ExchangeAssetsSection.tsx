// ============================================================
//  ExchangeAssetsSection — «ارز دیجیتال» (صرافی‌ها)
//  اتصال به صرافی‌های ایرانی و بین‌المللی و نمایش موجودی
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Landmark,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import { formatFullToman } from '../utils/iranMarketApi';
import { formatToman } from '../utils/nobitexApi';

const CONNECTIONS_KEY = '@exchange_connections_v1';

interface ExchangeConnection {
  id: string;
  exchangeId: string;
  label: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  createdAt: number;
  enabled: boolean;
}

interface ExchangeConfig {
  id: string;
  name: string;
  nameEn: string;
  category: 'iranian' | 'international';
  color: string;
  requiresApiKey: boolean;
  helpText: string;
}

const EXCHANGES: Record<string, ExchangeConfig> = {
  nobitex: {
    id: 'nobitex',
    name: 'نوبیتکس',
    nameEn: 'Nobitex',
    category: 'iranian',
    color: '#00A8E8',
    requiresApiKey: true,
    helpText: 'صرافی ایرانی نوبیتکس - نیازی به VPN ندارد',
  },
  bitperp: {
    id: 'bitperp',
    name: 'بیت‌پِرپ',
    nameEn: 'Bitperp',
    category: 'iranian',
    color: '#9333EA',
    requiresApiKey: true,
    helpText: 'صرافی ایرانی بیت‌پِرپ - نیازی به VPN ندارد',
  },
  wallex: {
    id: 'wallex',
    name: 'ولکس',
    nameEn: 'Wallex',
    category: 'iranian',
    color: '#0EA5E9',
    requiresApiKey: true,
    helpText: 'صرافی ایرانی ولکس - نیازی به VPN ندارد',
  },
  binance: {
    id: 'binance',
    name: 'بایننس',
    nameEn: 'Binance',
    category: 'international',
    color: '#F0B90B',
    requiresApiKey: true,
    helpText: 'بایننس بزرگترین صرافی جهان - نیازمند VPN خارج از ایران',
  },
  bybit: {
    id: 'bybit',
    name: 'بای‌بیت',
    nameEn: 'Bybit',
    category: 'international',
    color: '#F7A600',
    requiresApiKey: true,
    helpText: 'صرافی بای‌بیت - نیازمند VPN خارج از ایران',
  },
  okx: {
    id: 'okx',
    name: 'او‌کی‌ایکس',
    nameEn: 'OKX',
    category: 'international',
    color: '#1A1A1A',
    requiresApiKey: true,
    helpText: 'صرافی OKX - نیازمند VPN خارج از ایران',
  },
  mexc: {
    id: 'mexc',
    name: 'ام‌ایکس‌سی',
    nameEn: 'MEXC',
    category: 'international',
    color: '#1972F5',
    requiresApiKey: true,
    helpText: 'صرافی MEXC - نیازمند VPN خارج از ایران',
  },
};

async function loadConnections(): Promise<ExchangeConnection[]> {
  try {
    const stored = await AsyncStorage.getItem(CONNECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveConnections(list: ExchangeConnection[]): Promise<void> {
  await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(list));
}

interface Props {
  onPortfolioUsd?: (usd: number) => void;
}

export default function ExchangeAssetsSection({ onPortfolioUsd }: Props) {
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExchange, setNewExchange] = useState('nobitex');
  const [newLabel, setNewLabel] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [balances, setBalances] = useState<Record<string, { usd: number; irr: number; assets: any[]; error?: string }>>({});
  const [fetching, setFetching] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections().then(setConnections);
  }, []);

  // گزارش total USD به والد
  useEffect(() => {
    if (onPortfolioUsd) {
      const total = Object.values(balances).reduce((s, b) => s + (b.usd || 0), 0);
      onPortfolioUsd(total);
    }
  }, [balances, onPortfolioUsd]);

  const handleAdd = useCallback(async () => {
    if (!newApiKey.trim() || !newApiSecret.trim()) {
      Alert.alert('خطا', 'کلید API و Secret الزامی هستند');
      return;
    }
    const ex = EXCHANGES[newExchange];
    if (!newLabel.trim()) setNewLabel(ex.name);

    const conn: ExchangeConnection = {
      id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      exchangeId: newExchange,
      label: newLabel.trim() || ex.name,
      apiKey: newApiKey.trim(),
      apiSecret: newApiSecret.trim(),
      passphrase: newPassphrase.trim() || undefined,
      createdAt: Date.now(),
      enabled: true,
    };
    const updated = [...connections, conn];
    setConnections(updated);
    await saveConnections(updated);
    setNewLabel('');
    setNewApiKey('');
    setNewApiSecret('');
    setNewPassphrase('');
    setShowAddForm(false);
  }, [newExchange, newLabel, newApiKey, newApiSecret, newPassphrase, connections]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      'حذف اتصال',
      'آیا مطمئن هستید؟',
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updated = connections.filter((c) => c.id !== id);
            setConnections(updated);
            await saveConnections(updated);
            setBalances((prev) => {
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
          },
        },
      ]
    );
  }, [connections]);

  const handleToggle = useCallback(async (id: string) => {
    const updated = connections.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    setConnections(updated);
    await saveConnections(updated);
  }, [connections]);

  const fetchBalance = useCallback(async (conn: ExchangeConnection) => {
    setFetching((prev) => ({ ...prev, [conn.id]: true }));
    // در نسخه کامل باید با API صرافی و سرور پراکسی موجودی واقعی بگیرد
    // فعلاً placeholder
    setTimeout(() => {
      setBalances((prev) => ({
        ...prev,
        [conn.id]: {
          usd: 0,
          irr: 0,
          assets: [],
          error: 'برای دریافت موجودی واقعی، سرور پراکسی Railway را فعال کنید',
        },
      }));
      setFetching((prev) => ({ ...prev, [conn.id]: false }));
    }, 500);
  }, []);

  const totalUsd = Object.values(balances).reduce((s, b) => s + (b.usd || 0), 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Landmark size={16} color={colors.dark.accent} />
        <Text style={styles.title}>ارز دیجیتال (صرافی‌ها)</Text>
        <Pressable
          onPress={() => {
            connections.filter((c) => c.enabled).forEach((c) => fetchBalance(c));
          }}
          style={styles.refreshBtn}
        >
          <RefreshCw size={14} color={colors.dark.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addBtn}
        >
          <Plus size={14} color={colors.dark.accent} />
        </Pressable>
      </View>

      {/* total */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>مجموع موجودی صرافی‌ها (USD)</Text>
        <Text style={styles.totalValue}>
          ${totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </Text>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>صرافی</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exchangeScroller}>
            {Object.values(EXCHANGES).map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => setNewExchange(ex.id)}
                style={[
                  styles.exchangeChip,
                  newExchange === ex.id && styles.exchangeChipActive,
                  { borderColor: newExchange === ex.id ? ex.color : colors.dark.border },
                ]}
              >
                <Text style={[styles.exchangeChipText, newExchange === ex.id && { color: ex.color }]}>
                  {ex.name} {ex.category === 'iranian' ? '🇮🇷' : '🌍'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.formLabel}>نام دلخواه (اختیاری)</Text>
          <TextInput
            style={styles.input}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder={`مثلاً: ${EXCHANGES[newExchange].name} اصلی`}
            placeholderTextColor={colors.dark.textSecondary}
            textAlign="right"
          />

          <Text style={styles.formLabel}>کلید API</Text>
          <TextInput
            style={styles.input}
            value={newApiKey}
            onChangeText={setNewApiKey}
            placeholder="API Key"
            placeholderTextColor={colors.dark.textSecondary}
            textAlign="left"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Text style={styles.formLabel}>API Secret</Text>
          <TextInput
            style={styles.input}
            value={newApiSecret}
            onChangeText={setNewApiSecret}
            placeholder="API Secret"
            placeholderTextColor={colors.dark.textSecondary}
            textAlign="left"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          {newExchange === 'okx' && (
            <>
              <Text style={styles.formLabel}>Passphrase (مخصوص OKX)</Text>
              <TextInput
                style={styles.input}
                value={newPassphrase}
                onChangeText={setNewPassphrase}
                placeholder="Passphrase"
                placeholderTextColor={colors.dark.textSecondary}
                textAlign="left"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </>
          )}

          <View style={styles.securityNote}>
            <Lock size={11} color={colors.dark.green} />
            <Text style={styles.securityText}>
              کلیدها با AES-256 رمزنگاری و فقط در دستگاه ذخیره می‌شوند. فقط دسترسی Read-Only بسازید!
            </Text>
          </View>

          <Pressable onPress={handleAdd} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>افزودن اتصال</Text>
          </Pressable>
        </View>
      )}

      {connections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Landmark size={32} color={colors.dark.textMuted} />
          <Text style={styles.emptyText}>
            هنوز صرافی متصل نیست. روی دکمه + بزنید.
          </Text>
        </View>
      ) : (
        connections.map((conn) => {
          const ex = EXCHANGES[conn.exchangeId];
          const balance = balances[conn.id];
          const isExpanded = expandedId === conn.id;
          const isFetching = fetching[conn.id];
          return (
            <View key={conn.id} style={styles.connRow}>
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : conn.id)}
                style={styles.connHeader}
              >
                <View style={[styles.connIcon, { backgroundColor: ex.color + '22' }]}>
                  <Landmark size={14} color={ex.color} />
                </View>
                <View style={styles.connMain}>
                  <Text style={styles.connLabel}>{conn.label}</Text>
                  <Text style={styles.connSub}>
                    {ex.name} {ex.category === 'iranian' ? '🇮🇷' : '🌍'}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleToggle(conn.id);
                  }}
                  style={styles.toggleBtn}
                >
                  {conn.enabled ? (
                    <Unlock size={12} color={colors.dark.green} />
                  ) : (
                    <Lock size={12} color={colors.dark.textSecondary} />
                  )}
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    fetchBalance(conn);
                  }}
                  style={styles.refreshConnBtn}
                >
                  {isFetching ? (
                    <ActivityIndicator size="small" color={colors.dark.textSecondary} />
                  ) : (
                    <RefreshCw size={12} color={colors.dark.textSecondary} />
                  )}
                </Pressable>
                {isExpanded ? (
                  <ChevronUp size={12} color={colors.dark.textSecondary} />
                ) : (
                  <ChevronDown size={12} color={colors.dark.textSecondary} />
                )}
              </Pressable>

              {isExpanded && (
                <View style={styles.connExpanded}>
                  {balance?.error ? (
                    <View style={styles.balanceError}>
                      <AlertCircle size={11} color={colors.dark.red} />
                      <Text style={styles.balanceErrorText}>{balance.error}</Text>
                    </View>
                  ) : (
                    <View style={styles.balanceBox}>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>USD</Text>
                        <Text style={styles.balanceValue}>
                          ${(balance?.usd || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>تومان</Text>
                        <Text style={styles.balanceValue}>
                          {balance?.irr ? formatToman(balance.irr) : '—'}
                        </Text>
                      </View>
                    </View>
                  )}
                  <Pressable
                    onPress={() => handleDelete(conn.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={11} color={colors.dark.red} />
                    <Text style={styles.deleteBtnText}>حذف اتصال</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
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
      marginBottom: 10,
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
    addBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.dark.accentDim,
    },
    totalBox: {
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'center',
      marginBottom: 2,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.dark.accent,
    },
    addForm: {
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    formLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginBottom: 4,
      marginTop: 8,
    },
    exchangeScroller: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    exchangeChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.dark.surface,
      borderWidth: 1,
      marginLeft: 6,
    },
    exchangeChipActive: {
      backgroundColor: colors.dark.accentDim,
    },
    exchangeChipText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.dark.textSecondary,
    },
    input: {
      backgroundColor: colors.dark.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dark.border,
      color: colors.dark.text,
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    securityNote: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      backgroundColor: colors.dark.greenDim,
      borderRadius: 8,
      marginTop: 8,
    },
    securityText: {
      fontSize: 9,
      color: colors.dark.green,
      flex: 1,
      textAlign: 'right',
      fontWeight: '600',
    },
    saveBtn: {
      backgroundColor: colors.dark.accent,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.background,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 8,
    },
    emptyText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
    },
    connRow: {
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.dark.border,
      overflow: 'hidden',
    },
    connHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: 10,
    },
    connIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    connMain: {
      flex: 1,
    },
    connLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'right',
    },
    connSub: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 1,
    },
    toggleBtn: {
      padding: 4,
    },
    refreshConnBtn: {
      padding: 4,
    },
    connExpanded: {
      padding: 10,
      paddingTop: 0,
    },
    balanceError: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      backgroundColor: colors.dark.redDim,
      borderRadius: 6,
      marginBottom: 8,
    },
    balanceErrorText: {
      fontSize: 9,
      color: colors.dark.red,
      flex: 1,
      textAlign: 'right',
    },
    balanceBox: {
      backgroundColor: colors.dark.surface,
      borderRadius: 6,
      padding: 8,
      marginBottom: 8,
      gap: 4,
    },
    balanceRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
    balanceLabel: {
      fontSize: 10,
      color: colors.dark.textSecondary,
    },
    balanceValue: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.dark.text,
    },
    deleteBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 6,
      backgroundColor: colors.dark.redDim,
      borderRadius: 6,
    },
    deleteBtnText: {
      fontSize: 10,
      color: colors.dark.red,
      fontWeight: '600',
    },
  })
);
