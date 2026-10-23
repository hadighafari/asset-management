// ============================================================
//  About Screen - درباره ما
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import { APP_CONFIG } from '../constants/config';
import {
  ChevronRight,
  Github,
  User,
  Tag,
  Globe,
  Shield,
  Heart,
  CheckCircle2,
} from 'lucide-react-native';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronRight size={24} color={colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>درباره اپلیکیشن</Text>
      </View>

      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>مدیریت دارایی</Text>
          <Text style={styles.logoSubtext}>Asset Management</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon={Tag} label="نام اپلیکیشن" value={APP_CONFIG.appName} />
        <InfoRow icon={Tag} label="نام انگلیسی" value={APP_CONFIG.appNameEn} />
        <InfoRow icon={Tag} label="نسخه" value={APP_CONFIG.appVersion} />
        <InfoRow icon={User} label="سازنده" value={APP_CONFIG.appCreator} />
        <InfoRow icon={Globe} label="شناسه پکیج" value="com.trademaster65.assetmanagement" />
        <InfoRow icon={Globe} label="پلتفرم انتشار" value={APP_CONFIG.publisherPlatform} />
        <InfoRow icon={Github} label="سورس کد" value="github.com/trade-master65/asset-management" last />
      </View>

      <View style={styles.descCard}>
        <Text style={styles.descTitle}>درباره اپ</Text>
        <Text style={styles.descText}>
          اپ مدیریت دارایی یک ابزار جامع برای مدیریت همه دارایی‌های شما در یک جاست. با این اپ می‌توانید موجودی خود را در صرافی‌های ایرانی و بین‌المللی ببینید، کیف پول‌های بلاکچینی خود را ردیابی کنید، دارایی‌های فیزیکی (طلا، ارز نقدی، سکه) را ثبت کنید و قیمت‌های لحظه‌ای تومانی ارزها و فلزات را مشاهده کنید.
        </Text>
      </View>

      <View style={styles.techCard}>
        <Text style={styles.techTitle}>تکنولوژی‌ها</Text>
        <Text style={styles.techText}>
          این اپ با React Native و Expo SDK 54 ساخته شده است. قیمت‌ها از API عمومی TGJU دریافت می‌شود. کلیدهای API با AES-256 رمزنگاری و در دستگاه شما ذخیره می‌شوند.
        </Text>
      </View>

      <View style={styles.securityCard}>
        <View style={styles.securityHeader}>
          <Shield size={20} color={colors.dark.green} />
          <Text style={styles.securityTitle}>امنیت شما تضمین شده است</Text>
        </View>
        <View style={styles.securityList}>
          <SecurityItem text="کلیدهای API فقط در دستگاه شما ذخیره می‌شوند" />
          <SecurityItem text="هیچ‌گاه به سرور ارسال نمی‌شوند" />
          <SecurityItem text="فقط آدرس عمومی کیف پول نیاز است" />
          <SecurityItem text="هیچ دسترسی برداشتی وجود ندارد" />
        </View>
      </View>

      <TouchableOpacity
        style={styles.linkCard}
        onPress={() => Linking.openURL('https://github.com/trade-master65/asset-management')}
      >
        <Github size={20} color={colors.dark.accent} />
        <View style={styles.linkTextWrap}>
          <Text style={styles.linkTitle}>سورس کد در GitHub</Text>
          <Text style={styles.linkSubtitle}>github.com/trade-master65/asset-management</Text>
        </View>
        <ChevronRight size={16} color={colors.dark.textSecondary} />
      </TouchableOpacity>

      <View style={styles.creditsCard}>
        <Heart size={18} color={colors.dark.red} />
        <Text style={styles.creditsText}>
          ساخته‌شده با عشق توسط {APP_CONFIG.appCreator}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} {APP_CONFIG.appCreator}
        </Text>
        <Text style={styles.footerVersion}>نسخه {APP_CONFIG.appVersion}</Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIconWrap}>
        <Icon size={14} color={colors.dark.accent} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function SecurityItem({ text }: { text: string }) {
  return (
    <View style={styles.securityItem}>
      <CheckCircle2 size={12} color={colors.dark.green} />
      <Text style={styles.securityItemText}>{text}</Text>
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
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    backBtn: {
      padding: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    logoWrap: {
      alignItems: 'center',
      marginVertical: 20,
    },
    logoCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.dark.accentDim,
      borderWidth: 2,
      borderColor: colors.dark.accent + '44',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.dark.accent,
      textAlign: 'center',
    },
    logoSubtext: {
      fontSize: 10,
      color: colors.dark.textMuted,
      marginTop: 4,
      letterSpacing: 1,
    },
    infoCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.dark.border,
      gap: 8,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.dark.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoLabel: {
      flex: 1,
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
    },
    infoValue: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.dark.text,
      textAlign: 'left',
      flex: 1,
    },
    descCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 14,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    descTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'right',
      marginBottom: 8,
    },
    descText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
    },
    techCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 14,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    techTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.text,
      textAlign: 'right',
      marginBottom: 8,
    },
    techText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
    },
    securityCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 14,
      backgroundColor: colors.dark.greenDim,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.green + '33',
    },
    securityHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    securityTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.green,
      flex: 1,
      textAlign: 'right',
    },
    securityList: {
      gap: 6,
    },
    securityItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    securityItemText: {
      fontSize: 10,
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    linkCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 12,
      backgroundColor: colors.dark.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    linkTextWrap: {
      flex: 1,
    },
    linkTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.dark.text,
      textAlign: 'right',
    },
    linkSubtitle: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    creditsCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 12,
    },
    creditsText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
    },
    footer: {
      alignItems: 'center',
      marginTop: 16,
      gap: 4,
    },
    footerText: {
      fontSize: 10,
      color: colors.dark.textMuted,
    },
    footerVersion: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.dark.accent,
    },
  })
);
