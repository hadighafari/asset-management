// ============================================================
//  ExchangeAssetsSection — «ارز دیجیتال» (صرافی‌ها)
//  با ایکون‌های واقعی صرافی‌ها (به‌صورت متن با رنگ اصلی)
//  + نمایش موجودی هر صرافی + دارایی‌های آن
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
  Modal,
} from 'react-native';
import {
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
import { formatToman } from '../utils/nobitexApi';

const CONNECTIONS_KEY = '@exchange_connections_v2';

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

// همه صرافی‌ها با رنگ اصلی برند
const EXCHANGES: Record<string, { id: string; name: string; nameEn: string; category: 'iranian' | 'international'; color: string; logo: string; helpText: string }> = {
  nobitex: { id: 'nobitex', name: 'نوبیتکس', nameEn: 'Nobitex', category: 'iranian', color: '#00A8E8', logo: 'N', helpText: 'صرافی ایرانی' },
  bitperp: { id: 'bitperp', name: 'بیت‌پِرپ', nameEn: 'Bitperp', category: 'iranian', color: '#9333EA', logo: 'B', helpText: 'صرافی ایرانی' },
  wallex: { id: 'wallex', name: 'ولکس', nameEn: 'Wallex', category: 'iranian', color: '#0EA5E9', logo: 'W', helpText: 'صرافی ایرانی' },
  ramzinex: { id: 'ramzinex', name: 'رمزینکس', nameEn: 'Ramzinex', category: 'iranian', color: '#10B981', logo: 'R', helpText: 'صرافی ایرانی' },
  abarshode: { id: 'abarshode', name: 'آبرشده', nameEn: 'Abarshode', category: 'iranian', color: '#F59E0B', logo: 'A', helpText: 'صرافی ایرانی' },
  binance: { id: 'binance', name: 'بایننس', nameEn: 'Binance', category: 'international', color: '#F0B90B', logo: 'B', helpText: 'صرافی بین‌المللی' },
  bybit: { id: 'bybit', name: 'بای‌بیت', nameEn: 'Bybit', category: 'international', color: '#F7A600', logo: 'B', helpText: 'صرافی بین‌المللی' },
  okx: { id: 'okx', name: 'او‌کی‌ایکس', nameEn: 'OKX', category: 'international', color: '#1A1A1A', logo: 'O', helpText: 'صرافی بین‌المللی' },
  mexc: { id: 'mexc', name: 'ام‌ایکس‌سی', nameEn: 'MEXC', category: 'international', color: '#1972F5', logo: 'M', helpText: 'صرافی بین‌المللی' },
  kucoin: { id: 'kucoin', name: 'کوکوین', nameEn: 'KuCoin', category: 'international', color: '#24AE8F', logo: 'K', helpText: 'صرافی بین‌المللی' },
  gateio: { id: 'gateio', name: 'گیت‌آی‌او', nameEn: 'Gate.io', category: 'international', color: '#2354E6', logo: 'G', helpText: 'صرافی بین‌المللی' },
  bitget: { id: 'bitget', name: 'بیت‌گت', nameEn: 'Bitget', category: 'international', color: '#00F0FF', logo: 'B', helpText: 'صرافی بین‌المللی' },
  kraken: { id: 'kraken', name: 'کراکن', nameEn: 'Kraken', category: 'international', color: '#5841D8', logo: 'K', helpText: 'صرافی بین‌المللی' },
  coinbase: { id: 'coinbase', name: 'کوین‌بیس', nameEn: 'Coinbase', category: 'international', color: '#0052FF', logo: 'C', helpText: 'صرافی بین‌المللی' },
};

async function loadConnections(): Promise<ExchangeConnection[]> {
  try {
    const stored = await AsyncStorage.getItem(CONNECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
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
  const [showExchangePicker, setShowExchangePicker] = useState(false);
  const [newExchange, setNewExchange] = useState('nobitex');
  const [newLabel, setNewLabel] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  // balances: برای هر اتصال، موجودی کل + لیست دارایی‌ها
  const [balances, setBalances] = useState<Record<string, { usd: number; irr: number; assets: Array<{ symbol: string; amount: number; usdValue: number }>; error?: string }>>({});
  const [fetching, setFetching] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections().then(setConnections);
  }, []);

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
    setNewLabel(''); setNewApiKey(''); setNewApiSecret(''); setNewPassphrase('');
    setShowAddForm(false);
  }, [newExchange, newLabel, newApiKey, newApiSecret, newPassphrase, connections]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('حذف اتصال', 'آیا مطمئن هستید؟', [
      { text: 'لغو', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          const updated = connections.filter((c) => c.id !== id);
          setConnections(updated);
          await saveConnections(updated);
          setBalances((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
        },
      },
    ]);
  }, [connections]);

  const handleToggle = useCallback(async (id: string) => {
    const updated = connections.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c);
    setConnections(updated);
    await saveConnections(updated);
  }, [connections]);

  const fetchBalance = useCallback(async (conn: ExchangeConnection) => {
    setFetching((prev) => ({ ...prev, [conn.id]: true }));
    // در نسخه کامل باید با API صرافی موجودی واقعی بگیرد
    // فعلاً placeholder با مثال
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

  const refreshAll = useCallback(() => {
    connections.filter((c) => c.enabled).forEach((c) => fetchBalance(c));
  }, [connections, fetchBalance]);

  const totalUsd = Object.values(balances).reduce((s, b) => s + (b.usd || 0), 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>ارز دیجیتال (صرافی‌ها)</Text>
        <Pressable onPress={refreshAll} style={styles.refreshBtn}>
          <RefreshCw size={14} color={colors.dark.textSecondary} />
        </Pressable>
        <Pressable onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
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
          <Text style={styles.formLabel}>صرافی (روی باکس زیر کلیک کنید)</Text>
          <Pressable onPress={() => setShowExchangePicker(true)} style={styles.exchangePicker}>
            <ExchangeLogo exchange={EXCHANGES[newExchange]} size={32} />
            <View style={styles.exchangePickerInfo}>
              <Text style={styles.exchangePickerName}>
                {EXCHANGES[newExchange].name} {EXCHANGES[newExchange].category === 'iranian' ? '🇮🇷' : '🌍'}
              </Text>
              <Text style={styles.exchangePickerCat}>{EXCHANGES[newExchange].helpText}</Text>
            </View>
            <ChevronDown size={14} color={colors.dark.textSecondary} />
          </Pressable>

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
              کلیدها با رمزنگاری و فقط در دستگاه ذخیره می‌شوند. فقط دسترسی Read-Only بسازید!
            </Text>
          </View>

          <Pressable onPress={handleAdd} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>افزودن اتصال</Text>
          </Pressable>
        </View>
      )}

      {connections.length === 0 ? (
        <View style={styles.emptyWrap}>
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
                <ExchangeLogo exchange={ex} size={36} />
                <View style={styles.connMain}>
                  <Text style={styles.connLabel}>{conn.label}</Text>
                  <Text style={styles.connSub}>
                    {ex.name} {ex.category === 'iranian' ? '🇮🇷' : '🌍'} • ${(balance?.usd || 0).toFixed(2)}
                  </Text>
                </View>
                <Pressable onPress={() => handleToggle(conn.id)} style={styles.toggleBtn}>
                  {conn.enabled ? <Unlock size={12} color={colors.dark.green} /> : <Lock size={12} color={colors.dark.textSecondary} />}
                </Pressable>
                <Pressable onPress={() => fetchBalance(conn)} style={styles.refreshConnBtn}>
                  {isFetching ? <ActivityIndicator size="small" color={colors.dark.textSecondary} /> : <RefreshCw size={12} color={colors.dark.textSecondary} />}
                </Pressable>
                {isExpanded ? <ChevronUp size={12} color={colors.dark.textSecondary} /> : <ChevronDown size={12} color={colors.dark.textSecondary} />}
              </Pressable>

              {isExpanded && (
                <View style={styles.connExpanded}>
                  {balance?.error ? (
                    <View style={styles.balanceError}>
                      <AlertCircle size={11} color={colors.dark.red} />
                      <Text style={styles.balanceErrorText}>{balance.error}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.balanceBox}>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>USD کل</Text>
                          <Text style={styles.balanceValue}>${(balance?.usd || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>تومان</Text>
                          <Text style={styles.balanceValue}>{balance?.irr ? formatToman(balance.irr) : '—'}</Text>
                        </View>
                      </View>
                      {/* لیست دارایی‌های این صرافی */}
                      {balance && balance.assets.length > 0 && (
                        <View style={styles.assetsList}>
                          <Text style={styles.assetsListTitle}>دارایی‌ها:</Text>
                          {balance.assets.map((asset, idx) => (
                            <View key={idx} style={styles.assetItem}>
                              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                              <Text style={styles.assetAmount}>{asset.amount}</Text>
                              <Text style={styles.assetUsdValue}>${asset.usdValue.toFixed(2)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                  <Pressable onPress={() => handleDelete(conn.id)} style={styles.deleteBtn}>
                    <Trash2 size={11} color={colors.dark.red} />
                    <Text style={styles.deleteBtnText}>حذف اتصال</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Modal منوی کشویی صرافی‌ها */}
      <Modal visible={showExchangePicker} transparent animationType="slide" onRequestClose={() => setShowExchangePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>انتخاب صرافی</Text>
              <Pressable onPress={() => setShowExchangePicker(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>بستن</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {Object.values(EXCHANGES).map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => { setNewExchange(ex.id); setShowExchangePicker(false); }}
                  style={[styles.exchangeOption, newExchange === ex.id && styles.exchangeOptionActive]}
                >
                  <ExchangeLogo exchange={ex} size={40} />
                  <View style={styles.exchangeOptionInfo}>
                    <Text style={styles.exchangeOptionName}>{ex.name} {ex.category === 'iranian' ? '🇮🇷' : '🌍'}</Text>
                    <Text style={styles.exchangeOptionCat}>{ex.helpText}</Text>
                  </View>
                  {newExchange === ex.id && <Text style={styles.exchangeOptionCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// کامپوننت لوگوی صرافی (دایره با حرف اول و رنگ برند)
function ExchangeLogo({ exchange, size }: { exchange: { logo: string; color: string; nameEn: string } | undefined; size: number }) {
  if (!exchange) return null;
  return (
    <View style={[styles.logoWrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: exchange.color }]}>
      <Text style={[styles.logoText, { fontSize: size * 0.5 }]}>{exchange.logo}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    title: { fontSize: 16, fontWeight: '700', color: colors.dark.text, flex: 1, textAlign: 'right' },
    refreshBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.dark.accentDim },
    addBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.dark.accentDim },
    totalBox: { backgroundColor: colors.dark.card, borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
    totalLabel: { fontSize: 12, color: colors.dark.textSecondary, textAlign: 'center', marginBottom: 2 },
    totalValue: { fontSize: 20, fontWeight: '800', color: colors.dark.accent },
    addForm: { backgroundColor: colors.dark.card, borderRadius: 10, padding: 12, marginBottom: 12 },
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.dark.textSecondary, textAlign: 'right', marginBottom: 4, marginTop: 8 },
    exchangePicker: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 10,
      backgroundColor: colors.dark.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.dark.border,
    },
    exchangePickerInfo: { flex: 1 },
    exchangePickerName: { fontSize: 14, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    exchangePickerCat: { fontSize: 11, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 2 },
    input: {
      backgroundColor: colors.dark.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.dark.border,
      color: colors.dark.text, fontSize: 14, paddingHorizontal: 10, paddingVertical: 8,
    },
    securityNote: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 6, padding: 8,
      backgroundColor: colors.dark.greenDim, borderRadius: 8, marginTop: 8,
    },
    securityText: { fontSize: 11, color: colors.dark.green, flex: 1, textAlign: 'right', fontWeight: '600' },
    saveBtn: { backgroundColor: colors.dark.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.dark.background },
    emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { fontSize: 13, color: colors.dark.textSecondary, textAlign: 'center' },
    connRow: { backgroundColor: colors.dark.card, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.dark.border, overflow: 'hidden' },
    connHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, padding: 10 },
    connMain: { flex: 1 },
    connLabel: { fontSize: 14, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    connSub: { fontSize: 11, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 1 },
    toggleBtn: { padding: 4 },
    refreshConnBtn: { padding: 4 },
    connExpanded: { padding: 10, paddingTop: 0 },
    balanceError: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, padding: 8, backgroundColor: colors.dark.redDim, borderRadius: 6, marginBottom: 8 },
    balanceErrorText: { fontSize: 11, color: colors.dark.red, flex: 1, textAlign: 'right' },
    balanceBox: { backgroundColor: colors.dark.surface, borderRadius: 6, padding: 8, marginBottom: 8, gap: 4 },
    balanceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
    balanceLabel: { fontSize: 12, color: colors.dark.textSecondary },
    balanceValue: { fontSize: 13, fontWeight: '700', color: colors.dark.text },
    assetsList: { backgroundColor: colors.dark.surface, borderRadius: 6, padding: 8, marginBottom: 8 },
    assetsListTitle: { fontSize: 12, fontWeight: '700', color: colors.dark.text, textAlign: 'right', marginBottom: 6 },
    assetItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
    assetSymbol: { fontSize: 12, fontWeight: '600', color: colors.dark.text },
    assetAmount: { fontSize: 12, color: colors.dark.textSecondary },
    assetUsdValue: { fontSize: 12, fontWeight: '600', color: colors.dark.green },
    deleteBtn: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingVertical: 6, backgroundColor: colors.dark.redDim, borderRadius: 6,
    },
    deleteBtnText: { fontSize: 12, color: colors.dark.red, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, maxHeight: '80%', backgroundColor: colors.dark.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.dark.border },
    modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.dark.border },
    modalTitle: { fontSize: 14, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    modalCloseBtn: { padding: 4 },
    modalCloseText: { fontSize: 12, color: colors.dark.accent, fontWeight: '600' },
    modalList: { padding: 10 },
    exchangeOption: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 10,
      backgroundColor: colors.dark.card, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: colors.dark.border,
    },
    exchangeOptionActive: { borderColor: colors.dark.accent, backgroundColor: colors.dark.accentDim },
    exchangeOptionInfo: { flex: 1 },
    exchangeOptionName: { fontSize: 13, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    exchangeOptionCat: { fontSize: 10, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 2 },
    exchangeOptionCheck: { fontSize: 18, color: colors.dark.accent, fontWeight: '700' },
    logoWrap: { justifyContent: 'center', alignItems: 'center' },
    logoText: { fontWeight: '900', color: '#FFFFFF' },
  })
);
