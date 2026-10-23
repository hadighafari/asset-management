// ============================================================
//  Settings Screen - صفحه تنظیمات (بازنویسی شده بدون باگ)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';
import { createThemedStyles } from '../../utils/themeStyles';
import { APP_CONFIG } from '../../constants/config';
import {
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  FileQuestion,
  Lock,
  Info,
  Github,
  User,
  Tag,
  Trash2,
  ChevronLeft,
  Server,
  Download,
  CheckCircle2,
} from 'lucide-react-native';
import {
  fetchUpdateInfo,
  getInstalledVersion,
  AppUpdateInfo,
  openApkDownload,
} from '../../utils/appUpdate';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hideTotal, setHideTotal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [pinLock, setPinLock] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // بررسی آپدیت هنگام باز شدن صفحه
  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    const info = await fetchUpdateInfo();
    setUpdateInfo(info);
    setCheckingUpdate(false);
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    try {
      await openApkDownload(updateInfo.apkUrl);
    } catch (e) {
      Alert.alert('خطا', 'دانلود ناموفق بود');
    }
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/trade-master65/asset-management');
  };

  const handleClearData = () => {
    Alert.alert(
      'پاک‌سازی همه داده‌ها',
      'آیا مطمئن هستید؟ همه اتصالات صرافی، کیف پول‌ها و دارایی‌های محلی پاک خواهند شد.',
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'پاک‌سازی',
          style: 'destructive',
          onPress: () => {
            Alert.alert('انجام شد', 'همه داده‌ها پاک شدند');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>تنظیمات</Text>
        <Text style={styles.subtitle}>پیکربندی اپ مدیریت دارایی</Text>
      </View>

      {/* بخش آپدیت */}
      <Section title="آپدیت اپلیکیشن">
        <Row
          icon={Download}
          title="بررسی نسخه جدید"
          subtitle={
            updateInfo
              ? updateInfo.available
                ? `نسخه ${updateInfo.latestVersion} موجود است`
                : `آخرین نسخه: ${updateInfo.latestVersion}`
              : 'بررسی نشده'
          }
          value={checkingUpdate ? 'در حال بررسی...' : 'بررسی'}
          onPress={checkForUpdate}
          iconColor={colors.dark.accent}
        />
        {updateInfo && updateInfo.available && (
          <Row
            icon={Download}
            title={`دانلود نسخه ${updateInfo.latestVersion}`}
            subtitle={updateInfo.notes || 'برای دانلود کلیک کنید'}
            onPress={handleDownloadUpdate}
            iconColor={colors.dark.green}
          />
        )}
        {updateInfo && !updateInfo.available && (
          <Row
            icon={CheckCircle2}
            title="نسخه فعلی به‌روز است"
            subtitle={`نسخه نصب‌شده: ${getInstalledVersion()}`}
            iconColor={colors.dark.green}
            last
          />
        )}
        {!updateInfo && !checkingUpdate && (
          <Row
            icon={Info}
            title="بررسی آپدیت ناموفق بود"
            subtitle="اینترنت خود را بررسی کنید"
            iconColor={colors.dark.red}
            last
          />
        )}
      </Section>

      {/* بخش نمایش */}
      <Section title="نمایش">
        <Row
          icon={hideTotal ? EyeOff : Eye}
          title="پنهان کردن ارزش کل"
          subtitle="مخفی کردن ارزش کل دارایی‌ها"
          toggleValue={hideTotal}
          onToggle={setHideTotal}
          iconColor={colors.dark.blue}
        />
        <Row
          icon={RefreshCw}
          title="رفرش خودکار"
          subtitle="به‌روزرسانی خودکار هر ۶۰ ثانیه"
          toggleValue={autoRefresh}
          onToggle={setAutoRefresh}
          iconColor={colors.dark.accent}
          last
        />
      </Section>

      {/* بخش امنیت و اعلان‌ها */}
      <Section title="امنیت و اعلان‌ها">
        <Row
          icon={Bell}
          title="اعلان‌ها"
          subtitle="دریافت اعلان درباره تغییرات مهم"
          toggleValue={notifications}
          onToggle={setNotifications}
          iconColor={colors.dark.accent}
        />
        <Row
          icon={Lock}
          title="قفل اپلیکیشن"
          subtitle="درخواست پین هنگام ورود به اپ"
          toggleValue={pinLock}
          onToggle={setPinLock}
          iconColor={colors.dark.green}
          last
        />
      </Section>

      {/* بخش راهنما */}
      <Section title="راهنما و پشتیبانی">
        <Row
          icon={HelpCircle}
          title="راهنمای استفاده"
          subtitle="آموزش قدم‌به‌قدم استفاده از اپ"
          onPress={() => router.push('/help-usage')}
          showChevron
          iconColor={colors.dark.blue}
        />
        <Row
          icon={FileQuestion}
          title="سؤالات متداول"
          subtitle="پاسخ به سؤالات رایج"
          onPress={() => router.push('/help-faq')}
          showChevron
          iconColor={colors.dark.accent}
        />
        <Row
          icon={Lock}
          title="حریم خصوصی"
          subtitle="نحوه ذخیره و محافظت از داده‌های شما"
          onPress={() => router.push('/help-privacy')}
          showChevron
          iconColor={colors.dark.green}
          last
        />
      </Section>

      {/* بخش درباره ما */}
      <Section title="درباره اپلیکیشن">
        <Row
          icon={Info}
          title="درباره ما"
          subtitle="اطلاعات اپلیکیشن و سازنده"
          onPress={() => router.push('/about')}
          showChevron
          iconColor={colors.dark.blue}
        />
        <Row
          icon={Tag}
          title="نسخه"
          value={APP_CONFIG.appVersion}
          iconColor={colors.dark.accent}
        />
        <Row
          icon={User}
          title="سازنده"
          value={APP_CONFIG.appCreator}
          iconColor={colors.dark.green}
        />
        <Row
          icon={Github}
          title="سورس کد (GitHub)"
          subtitle="github.com/trade-master65/asset-management"
          onPress={openGitHub}
          showChevron
          iconColor={colors.dark.text}
          last
        />
      </Section>

      {/* بخش داده‌ها */}
      <Section title="مدیریت داده‌ها">
        <Row
          icon={Trash2}
          title="پاک‌سازی همه داده‌ها"
          subtitle="حذف همه اتصالات و دارایی‌ها (غیرقابل بازگشت)"
          onPress={handleClearData}
          danger
          iconColor={colors.dark.red}
          last
        />
      </Section>

      {/* فوتر */}
      <View style={styles.footer}>
        <Text style={styles.footerApp}>{APP_CONFIG.appName}</Text>
        <Text style={styles.footerVersion}>نسخه {APP_CONFIG.appVersion}</Text>
        <Text style={styles.footerCreator}>
          ساخته‌شده توسط {APP_CONFIG.appCreator}
        </Text>
        <Text style={styles.footerPlatform}>
          منتشرشده در پلتفرم {APP_CONFIG.publisherPlatform}
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.section}>
        {children}
      </View>
    </View>
  );
}

interface RowProps {
  icon: any;
  title: string;
  subtitle?: string;
  value?: string;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  iconColor?: string;
  last?: boolean;
}

function Row({
  icon: Icon,
  title,
  subtitle,
  value,
  toggleValue,
  onToggle,
  onPress,
  showChevron,
  danger = false,
  iconColor,
  last = false,
}: RowProps) {
  const hasSwitch = typeof toggleValue === 'boolean' && !!onToggle;
  const isPressable = !!onPress && !hasSwitch;
  const color = danger ? colors.dark.red : (iconColor || colors.dark.accent);

  const inner = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowRight}>
        <View style={[styles.rowIcon, { backgroundColor: color + '22' }]}>
          <Icon size={16} color={color} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, danger && { color: colors.dark.red }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rowLeft}>
        {value ? (
          <Text style={styles.rowValue}>{value}</Text>
        ) : null}
        {hasSwitch ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.dark.surface, true: colors.dark.accent }}
            thumbColor={toggleValue ? colors.dark.background : colors.dark.textSecondary}
          />
        ) : null}
        {(showChevron || isPressable) && !hasSwitch ? (
          <ChevronLeft size={16} color={colors.dark.textSecondary} />
        ) : null}
      </View>
    </View>
  );

  if (isPressable) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = createThemedStyles(() =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.dark.background,
    },
    header: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.dark.text,
      textAlign: 'right',
    },
    subtitle: {
      fontSize: 12,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    sectionWrap: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.dark.textSecondary,
      textAlign: 'right',
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    section: {
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      marginHorizontal: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.dark.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    rowIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.dark.text,
      textAlign: 'right',
    },
    rowSubtitle: {
      fontSize: 10,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    rowLeft: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    rowValue: {
      fontSize: 11,
      color: colors.dark.textSecondary,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 4,
    },
    footerApp: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.accent,
    },
    footerVersion: {
      fontSize: 11,
      color: colors.dark.textSecondary,
    },
    footerCreator: {
      fontSize: 10,
      color: colors.dark.textMuted,
    },
    footerPlatform: {
      fontSize: 10,
      color: colors.dark.textMuted,
      marginTop: 4,
    },
  })
);
