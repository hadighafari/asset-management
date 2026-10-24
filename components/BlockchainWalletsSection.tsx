// ============================================================
//  BlockchainWalletsSection — «کیف پول بلاکچین»
//  - قابلیت ویرایش/حذف کیف پول
//  - افزودن شبکه جدید به کیف پول موجود
//  - شبکه تونکوین اضافه شد
//  - نمایش موجودی هر کیف پول و دارایی‌های آن
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
  Wallet,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Pencil,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import { formatFullToman } from '../utils/iranMarketApi';

const WALLETS_KEY = '@blockchain_wallets_v2';

// تمام شبکه‌ها شامل تونکوین
const ALL_NETWORKS = [
  { id: 'bitcoin', name: 'بیت‌کوین', symbol: 'BTC', color: '#F7931A', explorer: 'https://www.blockchain.com/btc/address/' },
  { id: 'bitcoin-cash', name: 'بیت‌کوین کش', symbol: 'BCH', color: '#0AC18E', explorer: 'https://blockchair.com/dogecoin/address/' },
  { id: 'litecoin', name: 'لایت‌کوین', symbol: 'LTC', color: '#345D9D', explorer: 'https://blockchair.com/litecoin/address/' },
  { id: 'dogecoin', name: 'دوج‌کوین', symbol: 'DOGE', color: '#C2A633', explorer: 'https://blockchair.com/dogecoin/address/' },
  { id: 'ethereum', name: 'اتریوم (ERC20)', symbol: 'ETH', color: '#627EEA', explorer: 'https://etherscan.io/address/' },
  { id: 'bsc', name: 'بایننس اسمارت چین (BEP20)', symbol: 'BNB', color: '#F0B90B', explorer: 'https://bscscan.com/address/' },
  { id: 'polygon', name: 'پالیگان', symbol: 'MATIC', color: '#8247E5', explorer: 'https://polygonscan.com/address/' },
  { id: 'arbitrum', name: 'آربیتروم', symbol: 'ARB', color: '#28A0F0', explorer: 'https://arbiscan.io/address/' },
  { id: 'optimism', name: 'اپتیمیزم', symbol: 'OP', color: '#FF0420', explorer: 'https://optimistic.etherscan.io/address/' },
  { id: 'avalanche', name: 'آوالانچ (C-Chain)', symbol: 'AVAX', color: '#E84142', explorer: 'https://snowtrace.io/address/' },
  { id: 'fantom', name: 'فانتوم', symbol: 'FTM', color: '#13B5EC', explorer: 'https://ftmscan.com/address/' },
  { id: 'tron', name: 'ترون (TRC20)', symbol: 'TRX', color: '#EF0027', explorer: 'https://tronscan.org/#/address/' },
  { id: 'solana', name: 'سولانا', symbol: 'SOL', color: '#14F195', explorer: 'https://solscan.io/account/' },
  { id: 'toncoin', name: 'تونکوین (TON)', symbol: 'TON', color: '#0098EA', explorer: 'https://tonscan.org/address/' },
  { id: 'cardano', name: 'کاردانو', symbol: 'ADA', color: '#0033AD', explorer: 'https://cardanoscan.io/address/' },
  { id: 'ripple', name: 'ریپل', symbol: 'XRP', color: '#23292F', explorer: 'https://livenet.xrpl.org/accounts/' },
  { id: 'stellar', name: 'استلار', symbol: 'XLM', color: '#08B5E5', explorer: 'https://stellar.expert/explorer/public/account/' },
  { id: 'cosmos', name: 'کاسموس', symbol: 'ATOM', color: '#2E3148', explorer: 'https://www.mintscan.io/cosmos/account/' },
  { id: 'polkadot', name: 'پولکادات', symbol: 'DOT', color: '#E6007A', explorer: 'https://polkadot.subscan.io/account/' },
  { id: 'near', name: 'نیر', symbol: 'NEAR', color: '#00EC97', explorer: 'https://nearblocks.io/address/' },
  { id: 'algorand', name: 'الگورند', symbol: 'ALGO', color: '#000000', explorer: 'https://lora.algo.xyzpt/address/' },
  { id: 'tezos', name: 'تزوس', symbol: 'XTZ', color: '#2C7DF7', explorer: 'https://tzstats.com/' },
  { id: 'eos', name: 'ایاس', symbol: 'EOS', color: '#000000', explorer: 'https://eosflare.io/account/' },
];

interface WalletNetwork {
  networkId: string;
  address: string;
}

interface BlockchainWallet {
  id: string;
  label: string;
  networks: WalletNetwork[];
  createdAt: number;
}

async function loadWallets(): Promise<BlockchainWallet[]> {
  try {
    const stored = await AsyncStorage.getItem(WALLETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
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
  const [newLabel, setNewLabel] = useState('');
  const [networkAddresses, setNetworkAddresses] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // برای ویرایش کیف پول
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNetworkAddresses, setEditNetworkAddresses] = useState<Record<string, string>>({});
  // موجودی هر کیف پول
  const [walletBalances, setWalletBalances] = useState<Record<string, { usd: number; toman: number; assets: Array<{ symbol: string; amount: number; usdValue: number }> }>>({});

  useEffect(() => {
    loadWallets().then(setWallets);
  }, []);

  const refreshWallets = useCallback(async () => {
    setRefreshing(true);
    const list = await loadWallets();
    setWallets(list);
    if (onBlockchainToman) onBlockchainToman(0, list.length > 0);
    // شبیه‌سازی دریافت موجودی
    const balances: Record<string, { usd: number; toman: number; assets: Array<any> }> = {};
    for (const w of list) {
      balances[w.id] = { usd: 0, toman: 0, assets: [] };
    }
    setWalletBalances(balances);
    setTimeout(() => setRefreshing(false), 500);
  }, [onBlockchainToman]);

  const handleAddNetwork = (networkId: string) => {
    if (!networkAddresses[networkId]) {
      setNetworkAddresses({ ...networkAddresses, [networkId]: '' });
    }
    setShowNetworkPicker(false);
  };

  const handleRemoveNetwork = (networkId: string) => {
    const updated = { ...networkAddresses };
    delete updated[networkId];
    setNetworkAddresses(updated);
  };

  const handleAddressChange = (networkId: string, address: string) => {
    setNetworkAddresses({ ...networkAddresses, [networkId]: address });
  };

  const handleAdd = useCallback(async () => {
    const networks: WalletNetwork[] = [];
    for (const [networkId, address] of Object.entries(networkAddresses)) {
      if (address.trim()) networks.push({ networkId, address: address.trim() });
    }
    if (networks.length === 0) {
      Alert.alert('خطا', 'حداقل یک آدرس شبکه وارد کنید');
      return;
    }
    if (!newLabel.trim()) setNewLabel('کیف پول');

    const wallet: BlockchainWallet = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      label: newLabel.trim() || 'کیف پول',
      networks, createdAt: Date.now(),
    };
    const updated = [...wallets, wallet];
    setWallets(updated);
    await saveWallets(updated);
    setNewLabel(''); setNetworkAddresses({}); setShowAddForm(false);
  }, [newLabel, networkAddresses, wallets]);

  // حذف کیف پول
  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('حذف کیف پول', 'آیا مطمئن هستید؟', [
      { text: 'لغو', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          const updated = wallets.filter((w) => w.id !== id);
          setWallets(updated);
          await saveWallets(updated);
          setWalletBalances((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
        },
      },
    ]);
  }, [wallets]);

  // شروع ویرایش کیف پول
  const startEdit = (wallet: BlockchainWallet) => {
    setEditingWalletId(wallet.id);
    setEditLabel(wallet.label);
    const addrs: Record<string, string> = {};
    for (const net of wallet.networks) {
      addrs[net.networkId] = net.address;
    }
    setEditNetworkAddresses(addrs);
  };

  // ذخیره ویرایش
  const saveEdit = useCallback(async () => {
    if (!editingWalletId) return;
    const networks: WalletNetwork[] = [];
    for (const [networkId, address] of Object.entries(editNetworkAddresses)) {
      if (address.trim()) networks.push({ networkId, address: address.trim() });
    }
    if (networks.length === 0) {
      Alert.alert('خطا', 'حداقل یک آدرس شبکه وارد کنید');
      return;
    }
    const updated = wallets.map((w) =>
      w.id === editingWalletId ? { ...w, label: editLabel.trim() || 'کیف پول', networks } : w
    );
    setWallets(updated);
    await saveWallets(updated);
    setEditingWalletId(null);
    setEditLabel('');
    setEditNetworkAddresses({});
  }, [editingWalletId, editLabel, editNetworkAddresses, wallets]);

  const cancelEdit = () => {
    setEditingWalletId(null);
    setEditLabel('');
    setEditNetworkAddresses({});
  };

  // افزودن شبکه به کیف پول در حال ویرایش
  const handleEditAddNetwork = (networkId: string) => {
    if (!editNetworkAddresses[networkId]) {
      setEditNetworkAddresses({ ...editNetworkAddresses, [networkId]: '' });
    }
    setShowNetworkPicker(false);
  };

  const handleEditRemoveNetwork = (networkId: string) => {
    const updated = { ...editNetworkAddresses };
    delete updated[networkId];
    setEditNetworkAddresses(updated);
  };

  const handleEditAddressChange = (networkId: string, address: string) => {
    setEditNetworkAddresses({ ...editNetworkAddresses, [networkId]: address });
  };

  const maskAddress = (addr: string) => {
    if (!addr || addr.length < 14) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getNetwork = (id: string) => ALL_NETWORKS.find((n) => n.id === id);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Wallet size={18} color={colors.dark.blue} />
        <Text style={styles.title}>کیف پول بلاکچین</Text>
        <Pressable onPress={refreshWallets} style={styles.refreshBtn}>
          {refreshing ? <ActivityIndicator size="small" color={colors.dark.blue} /> : <RefreshCw size={16} color={colors.dark.textSecondary} />}
        </Pressable>
        <Pressable onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
          <Plus size={16} color={colors.dark.accent} />
        </Pressable>
      </View>

      <View style={styles.securityNote}>
        <Lock size={11} color={colors.dark.green} />
        <Text style={styles.securityText}>فقط آدرس عمومی وارد کنید — هرگز کلید خصوصی یا Seed Phrase وارد نکنید!</Text>
      </View>

      {/* فرم افزودن کیف پول جدید */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>نام کیف پول</Text>
          <TextInput style={styles.input} value={newLabel} onChangeText={setNewLabel} placeholder="مثلاً: کیف پول اصلی" placeholderTextColor={colors.dark.textSecondary} textAlign="right" />

          <Text style={styles.formLabel}>شبکه‌ها و آدرس‌ها</Text>
          {Object.keys(networkAddresses).length > 0 && (
            <View style={styles.networkList}>
              {Object.entries(networkAddresses).map(([networkId, address]) => {
                const network = getNetwork(networkId);
                return (
                  <View key={networkId} style={styles.networkItem}>
                    <View style={styles.networkItemHeader}>
                      <View style={[styles.networkItemIcon, { backgroundColor: (network?.color || colors.dark.accent) + '22' }]}>
                        <Text style={[styles.networkItemSymbol, { color: network?.color || colors.dark.accent }]}>{network?.symbol?.slice(0, 3) || '?'}</Text>
                      </View>
                      <Text style={styles.networkItemName}>{network?.name || networkId}</Text>
                      <Pressable onPress={() => handleRemoveNetwork(networkId)} style={styles.removeNetworkBtn}>
                        <Trash2 size={12} color={colors.dark.red} />
                      </Pressable>
                    </View>
                    <TextInput style={[styles.input, styles.addressInput]} value={address} onChangeText={(t) => handleAddressChange(networkId, t)} placeholder="آدرس کیف پول" placeholderTextColor={colors.dark.textSecondary} textAlign="left" autoCapitalize="none" autoCorrect={false} multiline />
                  </View>
                );
              })}
            </View>
          )}
          <Pressable onPress={() => setShowNetworkPicker(true)} style={styles.addNetworkBtn}>
            <Plus size={14} color={colors.dark.blue} />
            <Text style={styles.addNetworkBtnText}>افزودن شبکه</Text>
          </Pressable>
          <Pressable onPress={handleAdd} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>ذخیره کیف پول</Text>
          </Pressable>
        </View>
      )}

      {/* لیست کیف پول‌ها */}
      {wallets.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Wallet size={32} color={colors.dark.textMuted} />
          <Text style={styles.emptyText}>هنوز کیف پولی اضافه نشده. روی دکمه + بزنید.</Text>
        </View>
      ) : (
        wallets.map((w) => {
          const isExpanded = expandedId === w.id;
          const isEditing = editingWalletId === w.id;
          const balance = walletBalances[w.id];

          // اگر در حال ویرایش است
          if (isEditing) {
            return (
              <View key={w.id} style={styles.walletRow}>
                <View style={styles.editForm}>
                  <Text style={styles.formLabel}>نام کیف پول</Text>
                  <TextInput style={styles.input} value={editLabel} onChangeText={setEditLabel} placeholder="نام کیف پول" placeholderTextColor={colors.dark.textSecondary} textAlign="right" />

                  <Text style={styles.formLabel}>شبکه‌ها</Text>
                  {Object.keys(editNetworkAddresses).length > 0 && (
                    <View style={styles.networkList}>
                      {Object.entries(editNetworkAddresses).map(([networkId, address]) => {
                        const network = getNetwork(networkId);
                        return (
                          <View key={networkId} style={styles.networkItem}>
                            <View style={styles.networkItemHeader}>
                              <View style={[styles.networkItemIcon, { backgroundColor: (network?.color || colors.dark.accent) + '22' }]}>
                                <Text style={[styles.networkItemSymbol, { color: network?.color || colors.dark.accent }]}>{network?.symbol?.slice(0, 3) || '?'}</Text>
                              </View>
                              <Text style={styles.networkItemName}>{network?.name || networkId}</Text>
                              <Pressable onPress={() => handleEditRemoveNetwork(networkId)} style={styles.removeNetworkBtn}>
                                <Trash2 size={12} color={colors.dark.red} />
                              </Pressable>
                            </View>
                            <TextInput style={[styles.input, styles.addressInput]} value={address} onChangeText={(t) => handleEditAddressChange(networkId, t)} placeholder="آدرس کیف پول" placeholderTextColor={colors.dark.textSecondary} textAlign="left" autoCapitalize="none" autoCorrect={false} multiline />
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <Pressable onPress={() => setShowNetworkPicker(true)} style={styles.addNetworkBtn}>
                    <Plus size={14} color={colors.dark.blue} />
                    <Text style={styles.addNetworkBtnText}>افزودن شبکه جدید</Text>
                  </Pressable>

                  <View style={styles.editActions}>
                    <Pressable onPress={saveEdit} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>ذخیره</Text>
                    </Pressable>
                    <Pressable onPress={cancelEdit} style={styles.cancelEditBtn}>
                      <Text style={styles.cancelEditBtnText}>لغو</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          // نمایش عادی کیف پول
          return (
            <View key={w.id} style={styles.walletRow}>
              <Pressable onPress={() => setExpandedId(isExpanded ? null : w.id)} style={styles.walletHeader}>
                <View style={styles.walletMain}>
                  <Text style={styles.walletLabel}>{w.label}</Text>
                  <Text style={styles.walletNetworkCount}>{w.networks.length} شبکه • ${(balance?.usd || 0).toFixed(2)}</Text>
                </View>
                <Pressable onPress={() => startEdit(w)} style={styles.editBtn}>
                  <Pencil size={12} color={colors.dark.blue} />
                </Pressable>
                <Pressable onPress={() => handleDelete(w.id)} style={styles.deleteWalletBtn}>
                  <Trash2 size={12} color={colors.dark.red} />
                </Pressable>
                {isExpanded ? <ChevronUp size={14} color={colors.dark.textSecondary} /> : <ChevronDown size={14} color={colors.dark.textSecondary} />}
              </Pressable>

              {isExpanded && (
                <View style={styles.walletExpanded}>
                  {/* موجودی کل کیف پول */}
                  <View style={styles.walletBalanceBox}>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>موجودی کل (USD)</Text>
                      <Text style={styles.balanceValue}>${(balance?.usd || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>موجودی کل (تومان)</Text>
                      <Text style={styles.balanceValue}>{balance?.toman ? formatFullToman(balance.toman) : '—'}</Text>
                    </View>
                  </View>

                  {/* لیست دارایی‌های کیف پول */}
                  {balance && balance.assets.length > 0 && (
                    <View style={styles.assetsList}>
                      <Text style={styles.assetsListTitle}>دارایی‌های این کیف پول:</Text>
                      {balance.assets.map((asset, idx) => (
                        <View key={idx} style={styles.assetItem}>
                          <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                          <Text style={styles.assetAmount}>{asset.amount}</Text>
                          <Text style={styles.assetUsdValue}>${asset.usdValue.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* لیست شبکه‌ها */}
                  <Text style={styles.networksTitle}>شبکه‌های متصل:</Text>
                  {w.networks.map((net, idx) => {
                    const network = getNetwork(net.networkId);
                    return (
                      <View key={idx} style={styles.walletNetworkRow}>
                        <View style={[styles.walletNetworkIcon, { backgroundColor: (network?.color || colors.dark.accent) + '22' }]}>
                          <Text style={[styles.walletNetworkSymbol, { color: network?.color || colors.dark.accent }]}>{network?.symbol?.slice(0, 3) || '?'}</Text>
                        </View>
                        <View style={styles.walletNetworkInfo}>
                          <Text style={styles.walletNetworkName}>{network?.name || net.networkId}</Text>
                          <Text style={styles.walletNetworkAddress}>{maskAddress(net.address)}</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            const url = (network?.explorer || '') + net.address;
                            import('react-native').then(({ Linking }) => Linking.openURL(url));
                          }}
                          style={styles.viewBtn}
                        >
                          <ExternalLink size={11} color={colors.dark.blue} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Modal انتخاب شبکه */}
      <Modal visible={showNetworkPicker} transparent animationType="slide" onRequestClose={() => setShowNetworkPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>انتخاب شبکه</Text>
              <Pressable onPress={() => setShowNetworkPicker(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>بستن</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {ALL_NETWORKS.map((network) => {
                const isAddedInNew = !!networkAddresses[network.id];
                const isAddedInEdit = !!editNetworkAddresses[network.id];
                const isAdded = isAddedInNew || isAddedInEdit;
                return (
                  <Pressable
                    key={network.id}
                    onPress={() => {
                      if (editingWalletId) {
                        handleEditAddNetwork(network.id);
                      } else {
                        handleAddNetwork(network.id);
                      }
                    }}
                    style={[styles.networkOption, isAdded && styles.networkOptionAdded]}
                    disabled={isAdded}
                  >
                    <View style={[styles.networkOptionIcon, { backgroundColor: network.color + '22' }]}>
                      <Text style={[styles.networkOptionSymbol, { color: network.color }]}>{network.symbol.slice(0, 3)}</Text>
                    </View>
                    <View style={styles.networkOptionInfo}>
                      <Text style={styles.networkOptionName}>{network.name}</Text>
                      <Text style={styles.networkOptionSymbol2}>{network.symbol}</Text>
                    </View>
                    {isAdded && <Check size={14} color={colors.dark.green} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createThemedStyles(() =>
  StyleSheet.create({
    card: { backgroundColor: colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.dark.blueDim },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    title: { fontSize: 16, fontWeight: '700', color: colors.dark.text, flex: 1, textAlign: 'right' },
    refreshBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.dark.blueDim },
    addBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.dark.accentDim },
    securityNote: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, padding: 8, backgroundColor: colors.dark.greenDim, borderRadius: 8, marginBottom: 12 },
    securityText: { fontSize: 11, color: colors.dark.green, flex: 1, textAlign: 'right', fontWeight: '600' },
    addForm: { backgroundColor: colors.dark.card, borderRadius: 10, padding: 12, marginBottom: 12 },
    editForm: { backgroundColor: colors.dark.card, borderRadius: 10, padding: 12 },
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.dark.textSecondary, textAlign: 'right', marginBottom: 4, marginTop: 8 },
    input: { backgroundColor: colors.dark.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.dark.border, color: colors.dark.text, fontSize: 14, paddingHorizontal: 10, paddingVertical: 8 },
    addressInput: { minHeight: 50, textAlignVertical: 'top' },
    networkList: { gap: 8, marginBottom: 8 },
    networkItem: { backgroundColor: colors.dark.surface, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.dark.border },
    networkItemHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 },
    networkItemIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    networkItemSymbol: { fontSize: 10, fontWeight: '700' },
    networkItemName: { fontSize: 13, fontWeight: '700', color: colors.dark.text, flex: 1, textAlign: 'right' },
    removeNetworkBtn: { padding: 4 },
    addNetworkBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, backgroundColor: colors.dark.blueDim, borderRadius: 8, borderWidth: 1, borderColor: colors.dark.blue, borderStyle: 'dashed', marginBottom: 8 },
    addNetworkBtnText: { fontSize: 13, color: colors.dark.blue, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.dark.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.dark.background },
    editActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 12 },
    saveEditBtn: { flex: 1, backgroundColor: colors.dark.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    saveEditBtnText: { fontSize: 13, fontWeight: '700', color: colors.dark.background },
    cancelEditBtn: { flex: 1, backgroundColor: colors.dark.surface, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.dark.border },
    cancelEditBtnText: { fontSize: 13, fontWeight: '600', color: colors.dark.textSecondary },
    emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { fontSize: 13, color: colors.dark.textSecondary, textAlign: 'center' },
    walletRow: { backgroundColor: colors.dark.card, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.dark.border, overflow: 'hidden' },
    walletHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
    walletMain: { flex: 1 },
    walletLabel: { fontSize: 14, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    walletNetworkCount: { fontSize: 11, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 2 },
    editBtn: { padding: 6, marginLeft: 4 },
    deleteWalletBtn: { padding: 6, marginLeft: 4 },
    walletExpanded: { padding: 12, paddingTop: 0 },
    walletBalanceBox: { backgroundColor: colors.dark.surface, borderRadius: 8, padding: 10, marginBottom: 10, gap: 4 },
    balanceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
    balanceLabel: { fontSize: 12, color: colors.dark.textSecondary },
    balanceValue: { fontSize: 13, fontWeight: '700', color: colors.dark.text },
    assetsList: { backgroundColor: colors.dark.surface, borderRadius: 8, padding: 10, marginBottom: 10 },
    assetsListTitle: { fontSize: 13, fontWeight: '700', color: colors.dark.text, textAlign: 'right', marginBottom: 6 },
    assetItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
    assetSymbol: { fontSize: 12, fontWeight: '600', color: colors.dark.text },
    assetAmount: { fontSize: 12, color: colors.dark.textSecondary },
    assetUsdValue: { fontSize: 12, fontWeight: '600', color: colors.dark.green },
    networksTitle: { fontSize: 13, fontWeight: '700', color: colors.dark.text, textAlign: 'right', marginBottom: 6 },
    walletNetworkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.dark.border },
    walletNetworkIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    walletNetworkSymbol: { fontSize: 10, fontWeight: '700' },
    walletNetworkInfo: { flex: 1 },
    walletNetworkName: { fontSize: 12, fontWeight: '600', color: colors.dark.text, textAlign: 'right' },
    walletNetworkAddress: { fontSize: 11, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 1 },
    viewBtn: { padding: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, maxHeight: '80%', backgroundColor: colors.dark.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.dark.border },
    modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.dark.border },
    modalTitle: { fontSize: 14, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    modalCloseBtn: { padding: 4 },
    modalCloseText: { fontSize: 12, color: colors.dark.accent, fontWeight: '600' },
    modalList: { padding: 10 },
    networkOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 10, backgroundColor: colors.dark.card, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: colors.dark.border },
    networkOptionAdded: { opacity: 0.5 },
    networkOptionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    networkOptionSymbol: { fontSize: 11, fontWeight: '700' },
    networkOptionInfo: { flex: 1 },
    networkOptionName: { fontSize: 13, fontWeight: '700', color: colors.dark.text, textAlign: 'right' },
    networkOptionSymbol2: { fontSize: 11, color: colors.dark.textSecondary, textAlign: 'right', marginTop: 1 },
  })
);
