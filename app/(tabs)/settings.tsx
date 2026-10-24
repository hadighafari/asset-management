// ============================================================
//  Settings Screen - صفحه تنظیمات (ساده شده)
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
} from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';
import { createThemedStyles } from '../../utils/themeStyles';
import {
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Info,
  Download,
  CheckCircle2,
  Sun,
  Moon,
  Save,
  ShieldAlert,
  Tag,
} from 'lucide-react-native';
import {
  fetchUpdateInfo,
  getInstalledVersion,
  AppUpdateInfo,
  openApkDownload,
} from '../../utils/appUpdate';
import { checkIp, IpInfo, clearIpCache } from '../../utils/ipCheck';

export default function SettingsScreen() {
  const router = useRouter();

  // state های محلی - بدون context
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hideTotal, setHideTotal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [pinLock, setPinLock] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [checkingIp, setCheckingIp] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const info = await fetchUpdateInfo();
      setUpdateInfo(info);
    } catch (e) {}
    setCheckingUpdate(false);
  };

  const handleCheckIp = async () => {
    setCheckingIp(true);
    try {
      clearIpCache();
      const info = await checkIp();
      setIpInfo(info);
    } catch (e) {}
    setCheckingIp(false);
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    try {
      await openApkDownload(updateInfo.apkUrl);
    } catch (e) {
      Alert.alert('خطا', 'دانلود ناموفق بود');
    }
  };

  const handleSaveSettings = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const togglePinLock = (value: boolean) => {
    if (value) {
      Alert.alert(
        'قفل اپلیکیشن',
        'قفل اپلیکیشن فعال شد. در نسخه بعدی، هنگام ورود به اپ از شما اثر انگشت گرفته می‌شود.',
        [{ text: 'باشه' }]
      );
    }
    setPinLock(value);
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const isIran = ipInfo?.isIran ?? false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: 50, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>تنظیمات</Text>
        <Text style={styles.subtitle}>پیکربندی اپ مدیریت دارایی</Text>
      </View>

      {savedMessage && (
        <View style={styles.savedMessage}>
          <CheckCircle2 size={14} color={colors.dark.green} />
          <Text style={styles.savedMessageText}>تنظیمات ذخیره شد</Text>
        </View>
      )}

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

      {/* بخش تم */}
      <Section title="نمایش و تم">
        <Row
          icon={themeMode === 'dark' ? Moon : Sun}
          title="تم برنامه"
          subtitle={themeMode === 'dark' ? 'تیره (دارک)' : 'روشن (لایت)'}
          toggleValue={themeMode === 'light'}
          onToggle={toggleTheme}
          iconColor={themeMode === 'dark' ? colors.dark.blue : colors.dark.accent}
        />
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
          icon={Lock}
          title="قفل اپلیکیشن با اثر انگشت"
          subtitle="درخواست اثر انگشت هنگام ورود به اپ"
          toggleValue={pinLock}
          onToggle={togglePinLock}
          iconColor={colors.dark.green}
        />
        <Row
          icon={Bell}
          title="اعلان‌ها"
          subtitle="دریافت اعلان درباره تغییرات مهم"
          toggleValue={notifications}
          onToggle={setNotifications}
          iconColor={colors.dark.accent}
          last
        />
      </Section>

      {/* بخش بررسی IP */}
      <Section title="بررسی IP و دسترسی">
        <Row
          icon={Shield}
          title="بررسی IP"
          subtitle={
            ipInfo
              ? `کشور: ${ipInfo.country || ipInfo.countryCode} • ${ipInfo.isIran ? 'ایران ⚠️' : 'مجاز ✓'}`
              : 'بررسی نشده'
          }
          value={checkingIp ? 'در حال بررسی...' : 'بررسی مجدد'}
          onPress={handleCheckIp}
          iconColor={isIran ? colors.dark.red : colors.dark.green}
        />
        {isIran && (
          <View style={styles.ipBlockedBox}>
            <ShieldAlert size={14} color={colors.dark.red} />
            <Text style={styles.ipBlockedText}>
              IP شما از ایران است. بخش «کیف پول» و «ارز دیجیتال» نیاز به روشن کردن فیلترشکن دارند. وقتی فیلترشکن روشن شد و IP مجاز باشد، دسترسی به این بخش‌ها باز می‌شود.
            </Text>
          </View>
        )}
        {ipInfo && !isIran && (
          <Row
            icon={CheckCircle2}
            title="دسترسی کامل"
            subtitle="همه بخش‌های اپ در دسترس هستند"
            iconColor={colors.dark.green}
            last
          />
        )}
        {!ipInfo && !checkingIp && (
          <Row
            icon={Info}
            title="بررسی IP ناموفق بود"
            subtitle="اینترنت خود را بررسی کنید"
            iconColor={colors.dark.red}
            last
          />
        )}
      </Section>

      {/* بخش درباره ما */}
      <Section title="درباره اپلیکیشن">
        <Row
          icon={Info}
          title="درباره ما"
          subtitle="اطلاعات اپلیکیشن"
          onPress={() => router.push('/about')}
          showChevron
          iconColor={colors.dark.blue}
        />
        <Row
          icon={Tag}
          title="نسخه"
          value={getInstalledVersion()}
          iconColor={colors.dark.accent}
          last
        />
      </Section>

      {/* دکمه ذخیره تغییرات */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveSettings}
        activeOpacity={0.7}
      >
        <Save size={16} color={colors.dark.background} />
        <Text style={styles.saveBtnText}>ذخیره تغییرات تنظیمات</Text>
      </TouchableOpacity>

      {/* فوتر */}
      <View style={styles.footer}>
        <Text style={styles.footerApp}>مدیریت دارایی</Text>
        <Text style={styles.footerVersion}>نسخه {getInstalledVersion()}</Text>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.section}>{children}</View>
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
  iconColor,
  last = false,
}: RowProps) {
  const hasSwitch = typeof toggleValue === 'boolean' && !!onToggle;
  const isPressable = !!onPress && !hasSwitch;
  const color = iconColor || colors.dark.accent;

  const inner = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowRight}>
        <View style={[styles.rowIcon, { backgroundColor: color + '22' }]}>
          <Icon size={16} color={color} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.rowLeft}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {hasSwitch ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.dark.surface, true: colors.dark.accent }}
            thumbColor={toggleValue ? colors.dark.background : colors.dark.textSecondary}
          />
        ) : null}
        {(showChevron || isPressable) && !hasSwitch ? (
          <ChevronLeftIcon color={colors.dark.textSecondary} />
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

function ChevronLeftIcon({ color }: { color: string }) {
  const { ChevronLeft } = require('lucide-react-native');
  return <ChevronLeft size={16} color={color} />;
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
    savedMessage: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 12,
      marginBottom: 8,
      padding: 10,
      backgroundColor: colors.dark.greenDim,
      borderRadius: 8,
    },
    savedMessageText: {
      fontSize: 11,
      color: colors.dark.green,
      fontWeight: '600',
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
    ipBlockedBox: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      gap: 8,
      padding: 10,
      backgroundColor: colors.dark.redDim,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    ipBlockedText: {
      fontSize: 10,
      color: colors.dark.red,
      flex: 1,
      textAlign: 'right',
      lineHeight: 16,
      fontWeight: '600',
    },
    saveBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginBottom: 16,
      paddingVertical: 14,
      backgroundColor: colors.dark.accent,
      borderRadius: 12,
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.background,
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
  })
);
