// ============================================================
//  BlockchainWalletsSection — «کیف پول بلاکچین»
//  افزودن و مدیریت کیف پول‌های فقط‌خواندنی بلاکچینی
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
  Wallet,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import { formatFullToman } from '../utils/iranMarketApi';

const WALLETS_KEY = '@blockchain_wallets_v1';

interface BlockchainWallet {
  id: string;
  network: string;
  label: string;
  address: string;
  createdAt: number;
}

const NETWORKS = [
  { id: 'bitcoin', name: 'بیت‌کوین', symbol: 'BTC', color: '#F7931A' },
  { id: 'ethereum', name: 'اتریوم', symbol: 'ETH', color: '#627EEA' },
  { id: 'bsc', name: 'بایننس اسمارت چین', symbol: 'BNB', color: '#F0B90B' },
  { id: 'tron', name: 'ترون', symbol: 'TRX', color: '#EF0027' },
  { id: 'solana', name: 'سولانا', symbol: 'SOL', color: '#14F195' },
  { id: 'polygon', name: 'پالیگان', symbol: 'MATIC', color: '#8247E5' },
];

async function loadWallets(): Promise<BlockchainWallet[]> {
  try {
    const stored = await AsyncStorage.getItem(WALLETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveWallets(list: BlockchainWallet[]): Promise<void> {
  await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(list));
}

interface Props {
  onBlockchainToman?: (toman: number, hasWallet: boolean) => void;
  usdtToToman: number;
}

export default function BlockchainWalletsSection({ onBlockchainToman, usdtToToman }: Props) {
  const [wallets, setWallets] = useState<BlockchainWallet[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNetwork, setNewNetwork] = useState(NETWORKS[0].id);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadWallets().then(setWallets);
  }, []);

  const refreshWallets = useCallback(async () => {
    const list = await loadWallets();
    setWallets(list);
    // در نسخه کامل باید موجودی کیف‌ها را از API بلاکچین بگیرد
    // فعلاً 0 گزارش می‌دهیم
    if (onBlockchainToman) onBlockchainToman(0, list.length > 0);
  }, [onBlockchainToman]);

  const handleAdd = useCallback(async () => {
    if (!newAddress.trim()) {
      Alert.alert('خطا', 'آدرس کیف پول الزامی است');
      return;
    }
    if (!newLabel.trim()) setNewLabel(NETWORKS.find((n) => n.id === newNetwork)?.name || 'کیف پول');

    const wallet: BlockchainWallet = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      network: newNetwork,
      label: newLabel.trim() || NETWORKS.find((n) => n.id === newNetwork)?.name || 'کیف پول',
      address: newAddress.trim(),
      createdAt: Date.now(),
    };
    const updated = [...wallets, wallet];
    setWallets(updated);
    await saveWallets(updated);
    setNewLabel('');
    setNewAddress('');
    setShowAddForm(false);
  }, [newNetwork, newLabel, newAddress, wallets]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      'حذف کیف پول',
      'آیا مطمئن هستید؟',
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updated = wallets.filter((w) => w.id !== id);
            setWallets(updated);
            await saveWallets(updated);
          },
        },
      ]
    );
  }, [wallets]);

  const maskAddress = (addr: string) => {
    if (!addr || addr.length < 14) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Wallet size={16} color={colors.dark.blue} />
        <Text style={styles.title}>کیف پول بلاکچین</Text>
        <Pressable onPress={refreshWallets} style={styles.refreshBtn}>
          <RefreshCw size={14} color={colors.dark.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addBtn}
        >
          <Plus size={14} color={colors.dark.accent} />
        </Pressable>
      </View>

      <View style={styles.securityNote}>
        <Lock size={11} color={colors.dark.green} />
        <Text style={styles.securityText}>
          فقط آدرس عمومی وارد کنید — هرگز کلید خصوصی یا Seed Phrase وارد نکنید!
        </Text>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>شبکه</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.networkScroller}>
            {NETWORKS.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => setNewNetwork(n.id)}
                style={[
                  styles.networkChip,
                  newNetwork === n.id && styles.networkChipActive,
                  { borderColor: newNetwork === n.id ? n.color : colors.dark.border },
                ]}
              >
                <Text
                  style={[
                    styles.networkChipText,
                    newNetwork === n.id && { color: n.color },
                  ]}
                >
                  {n.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.formLabel}>نام دلخواه (اختیاری)</Text>
          <TextInput
            style={styles.input}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="مثلاً: کیف پول اصلی بیت‌کوین"
            placeholderTextColor={colors.dark.textSecondary}
            textAlign="right"
          />

          <Text style={styles.formLabel}>آدرس کیف پول</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder="مثلاً: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
            placeholderTextColor={colors.dark.textSecondary}
            textAlign="left"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <Pressable onPress={handleAdd} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>افزودن کیف پول</Text>
          </Pressable>
        </View>
      )}

      {wallets.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Wallet size={32} color={colors.dark.textMuted} />
          <Text style={styles.emptyText}>
            هنوز کیف پولی اضافه نشده. روی دکمه + بزنید.
          </Text>
        </View>
      ) : (
        wallets.map((w) => {
          const network = NETWORKS.find((n) => n.id === w.network);
          const isExpanded = expandedId === w.id;
          return (
            <View key={w.id} style={styles.walletRow}>
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : w.id)}
                style={styles.walletHeader}
              >
                <View style={[styles.walletIcon, { backgroundColor: (network?.color || colors.dark.accent) + '22' }]}>
                  <Text style={[styles.walletSymbol, { color: network?.color || colors.dark.accent }]}>
                    {network?.symbol?.slice(0, 3) || '?'}
                  </Text>
                </View>
                <View style={styles.walletMain}>
                  <Text style={styles.walletLabel}>{w.label}</Text>
                  <Text style={styles.walletAddress}>{maskAddress(w.address)}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={14} color={colors.dark.textSecondary} />
                ) : (
                  <ChevronDown size={14} color={colors.dark.textSecondary} />
                )}
              </Pressable>

              {isExpanded && (
                <View style={styles.walletExpanded}>
                  <View style={styles.walletDetailRow}>
                    <Text style={styles.walletDetailLabel}>آدرس کامل:</Text>
                    <Text style={styles.walletDetailValue}>{w.address}</Text>
                  </View>
                  <View style={styles.walletDetailActions}>
                    <Pressable
                      onPress={() => {
                        const url = network?.id === 'bitcoin'
                          ? `https://www.blockchain.com/btc/address/${w.address}`
                          : network?.id === 'ethereum'
                          ? `https://etherscan.io/address/${w.address}`
                          : `https://www.google.com/search?q=${network?.name}+address+${w.address}`;
                        import('react-native').then(({ Linking }) => Linking.openURL(url));
                      }}
                      style={styles.viewBtn}
                    >
                      <ExternalLink size={12} color={colors.dark.blue} />
                      <Text style={styles.viewBtnText}>مشاهده در بلاکچین</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(w.id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={12} color={colors.dark.red} />
                      <Text style={styles.deleteBtnText}>حذف</Text>
                    </Pressable>
                  </View>
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
      borderColor: colors.dark.blueDim,
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
      backgroundColor: colors.dark.blueDim,
    },
    addBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.dark.accentDim,
    },
    securityNote: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      backgroundColor: colors.dark.greenDim,
      borderRadius: 8,
      marginBottom: 12,
    },
    securityText: {
      fontSize: 10,
      color: colors.dark.green,
      flex: 1,
      textAlign: 'right',
      fontWeight: '600',
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
    networkScroller: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    networkChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.dark.surface,
      borderWidth: 1,
      marginLeft: 6,
    },
    networkChipActive: {
      backgroundColor: colors.dark.accentDim,
    },
    networkChipText: {
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
    addressInput: {
      minHeight: 60,
      textAlignVertical: 'top',
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
    walletRow: {
      backgroundColor: colors.dark.card,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.dark.border,
      overflow: 'hidden',
    },
    walletHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      padding: 10,
    },
    walletIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    walletSymbol: {
      fontSize: 10,
      fontWeight: '700',
    },
    walletMain: {
      flex: 1,
    },
    walletLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'right',
    },
    walletAddress: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    walletExpanded: {
      padding: 10,
      paddingTop: 0,
    },
    walletDetailRow: {
      backgroundColor: colors.dark.surface,
      borderRadius: 6,
      padding: 8,
      marginBottom: 8,
    },
    walletDetailLabel: {
      fontSize: 9,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginBottom: 4,
    },
    walletDetailValue: {
      fontSize: 10,
      color: colors.dark.text,
      textAlign: 'left',
      fontFamily: 'monospace',
    },
    walletDetailActions: {
      flexDirection: 'row-reverse',
      gap: 8,
    },
    viewBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.dark.blueDim,
      borderRadius: 6,
    },
    viewBtnText: {
      fontSize: 10,
      color: colors.dark.blue,
      fontWeight: '600',
    },
    deleteBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
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
