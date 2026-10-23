// ============================================================
//  Help Usage Screen - راهنمای استفاده
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import {
  ChevronRight,
  Landmark,
  Coins,
  Gem,
  Wallet,
  Shield,
} from 'lucide-react-native';

const STEPS = [
  {
    icon: Landmark,
    title: '۱. اتصال به صرافی‌ها',
    color: colors.dark.accent,
    body: 'در تب «ارز دیجیتال» می‌توانید اتصال به صرافی‌های ایرانی (نوبیتکس، بیت‌پِرپ، ولکس) و بین‌المللی (بایننس، بای‌بیت، OKX، MEXC) را اضافه کنید. کلید API را از پنل کاربری صرافی دریافت کرده و فقط با دسترسی Read-Only بسازید.',
  },
  {
    icon: Coins,
    title: '۲. ثبت دارایی‌های ریالی و فلزات',
    color: colors.dark.green,
    body: 'در تب «ریالی و فلزات» می‌توانید مقدار ریال نقدی، دلار کاغذی، تتر، طلا (۱۸/۲۴ عیار)، نقره (۹۹۹/۹۲۵) و سکه‌های امامی/بهار/نیم/ربع را وارد کنید. قیمت لحظه‌ای تومانی هر دارایی به‌صورت خودکار از TGJU دریافت و ارزش کل محاسبه می‌شود.',
  },
  {
    icon: Gem,
    title: '۳. مشاهده پیش‌بینی طلا',
    color: colors.dark.accent,
    body: 'در تب «پیش‌بینی طلا» می‌توانید پیش‌بینی قیمت طلا برای ۷، ۳۰ و ۹۰ روز آینده را بر اساس تحلیل تکنیکال ببینید. همچنین سقف و کف احتمالی کوتاه‌مدت نمایش داده می‌شود.',
  },
  {
    icon: Wallet,
    title: '۴. افزودن کیف پول بلاکچین',
    color: colors.dark.blue,
    body: 'در تب «کیف بلاکچین» می‌توانید آدرس کیف پول‌های بلاکچینی خود را در شبکه‌های بیت‌کوین، اتریوم، BSC، ترون، سولانا و پالیگان ثبت کنید. فقط آدرس عمومی را وارد کنید — هرگز کلید خصوصی یا Seed Phrase وارد نکنید!',
  },
  {
    icon: Shield,
    title: '۵. امنیت داده‌ها',
    color: colors.dark.green,
    body: 'همه داده‌های شما به‌صورت محلی در دستگاه ذخیره می‌شوند. کلیدهای API با AES-256 رمزنگاری می‌شوند. هیچ‌گاه به سرور ارسال نمی‌شوند. قیمت‌ها از APIهای عمومی TGJU، نوبیتکس، ولکس و تترلند دریافت می‌شود.',
  },
];

export default function HelpUsageScreen() {
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
        <Text style={styles.title}>راهنمای استفاده</Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          این راهنما به شما کمک می‌کند تا به‌راحتی از اپ مدیریت دارایی استفاده کنید.
        </Text>
      </View>

      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        return (
          <View key={idx} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIcon, { backgroundColor: step.color + '22' }]}>
                <Icon size={18} color={step.color} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        );
      })}
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
    intro: {
      marginHorizontal: 12,
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.dark.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    introText: {
      fontSize: 12,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
    },
    stepCard: {
      marginHorizontal: 12,
      marginBottom: 12,
      padding: 14,
      backgroundColor: colors.dark.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.border,
    },
    stepHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    stepIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.dark.text,
      flex: 1,
      textAlign: 'right',
    },
    stepBody: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
    },
  })
);
