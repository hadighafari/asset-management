// ============================================================
//  Privacy Screen - حریم خصوصی
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import {
  ChevronRight,
  Shield,
  Lock,
  Eye,
  Trash2,
  Key,
  Server,
} from 'lucide-react-native';

const SECTIONS = [
  {
    icon: Lock,
    title: 'ذخیره‌سازی محلی',
    color: colors.dark.accent,
    body: 'همه داده‌های شما — کلیدهای API صرافی، آدرس کیف پول‌ها و دارایی‌های محلی — به‌صورت محلی در دستگاه شما ذخیره می‌شوند. این داده‌ها با الگوریتم AES-256 رمزنگاری می‌شوند. هیچ‌گاه به سرور ارسال نمی‌شوند.',
  },
  {
    icon: Server,
    title: 'منابع قیمت',
    color: colors.dark.blue,
    body: 'برای دریافت قیمت‌ها، اپ به APIهای عمومی TGJU، نوبیتکس، ولکس و تترلند متصل می‌شود. این APIها اطلاعات موجودی شما را ذخیره نمی‌کنند — فقط قیمت لحظه‌ای را برمی‌گردانند.',
  },
  {
    icon: Eye,
    title: 'اطلاعاتی که جمع‌آوری می‌شود',
    color: colors.dark.accent,
    body: 'این اپ هیچ اطلاعات شخصی شما را جمع‌آوری نمی‌کند. ما نام، ایمیل یا شماره تلفن نمی‌خواهیم. شناسه دستگاه شما را ذخیره نمی‌کنیم. رفتار شما را ردیابی نمی‌کنیم.',
  },
  {
    icon: Key,
    title: 'کلیدهای API شما',
    color: colors.dark.green,
    body: 'کلیدهای API شما در دستگاه شما رمزنگاری شده و ذخیره می‌شوند. توصیه: فقط کلید API با دسترسی Read-Only بسازید و هرگز دسترسی برداشت را فعال نکنید.',
  },
  {
    icon: Shield,
    title: 'کیف پول بلاکچینی',
    color: colors.dark.blue,
    body: 'برای کیف پول‌های بلاکچینی، ما فقط آدرس عمومی (Public Address) را ذخیره می‌کنیم. این آدرس‌ها اطلاعات حساسی نیستند. هرگز کلید خصوصی (Private Key) یا Seed Phrase را وارد نکنید.',
  },
  {
    icon: Trash2,
    title: 'حذف داده‌ها',
    color: colors.dark.red,
    body: 'شما هر زمان می‌توانید همه داده‌های خود را از تنظیمات → پاک‌سازی همه داده‌ها پاک کنید. یا با حذف اپ از دستگاه. پس از حذف، همه داده‌ها از بین می‌روند و قابل بازیابی نیستند.',
  },
];

export default function HelpPrivacyScreen() {
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
        <Text style={styles.title}>حریم خصوصی</Text>
      </View>

      <View style={styles.introBox}>
        <Shield size={32} color={colors.dark.accent} />
        <Text style={styles.introTitle}>حریم خصوصی شما برای ما مهم است</Text>
        <Text style={styles.introText}>
          این اپ با هدف محافظت از دارایی‌ها و حریم خصوصی شما طراحی شده است.
        </Text>
      </View>

      {SECTIONS.map((section, idx) => {
        const Icon = section.icon;
        return (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '22' }]}>
                <Icon size={18} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        );
      })}

      <View style={styles.commitmentBox}>
        <Text style={styles.commitmentTitle}>تعهد ما</Text>
        <Text style={styles.commitmentText}>
          ما متعهد هستیم که:{'\n\n'}
          ۱. هیچ‌گاه اطلاعات شخصی شما را به third-party نفروشیم{'\n'}
          ۲. هیچ‌گاه بدون رضایت شما اعلان بازاریابی نفرستیم{'\n'}
          ۳. شفاف باشیم درباره نحوه استفاده از داده‌های شما{'\n'}
          ۴. به شما امکان کامل برای کنترل و حذف داده‌هایتان بدهیم
        </Text>
      </View>
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
    introBox: {
      marginHorizontal: 12,
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.accent + '33',
      alignItems: 'center',
    },
    introTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.accent,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    introText: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    sectionCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 14,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    sectionHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    sectionBody: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
    },
    commitmentBox: {
      marginHorizontal: 12,
      marginTop: 8,
      padding: 14,
      backgroundColor: colors.dark.accentDim,
      borderRadius: 12,
    },
    commitmentTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.accent,
      textAlign: 'right',
      marginBottom: 8,
    },
    commitmentText: {
      fontSize: 11,
      color: colors.dark.text,
      textAlign: 'right',
      lineHeight: 20,
    },
  })
);
