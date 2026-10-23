// ============================================================
//  FAQ Screen - سؤالات متداول
// ============================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import { ChevronRight, ChevronDown, FileQuestion } from 'lucide-react-native';

const FAQS = [
  {
    q: 'آیا کلیدهای API من امن ذخیره می‌شوند؟',
    a: 'بله. کلیدهای API با الگوریتم AES-256 رمزنگاری و فقط در دستگاه شما ذخیره می‌شوند. هیچ‌گاه به سرور ارسال نمی‌شوند.',
  },
  {
    q: 'آیا باید کلید خصوصی کیف پول را وارد کنم؟',
    a: 'خیر! هرگز کلید خصوصی (Private Key) یا Seed Phrase را وارد نکنید. این اپ فقط آدرس عمومی (Public Address) کیف پول را برای مشاهده موجودی نیاز دارد.',
  },
  {
    q: 'قیمت‌ها از کجا دریافت می‌شوند؟',
    a: 'قیمت طلای ۱۸/۲۴ عیار، نقره، سکه‌ها، دلار و مثقال از API عمومی TGJU دریافت می‌شود. قیمت تتر از چندین صرافی ایرانی (نوبیتکس، ولکس، تترلند) به‌صورت fallback.',
  },
  {
    q: 'چرا قیمت‌ها نمایش داده نمی‌شوند؟',
    a: 'ممکن است اینترنت شما قطع باشد یا API TGJU موقتاً در دسترس نباشد. اپ به‌طور خودکار از چند منبع مختلف استفاده می‌کند و در صورت عدم دسترسی، آخرین قیمت کش‌شده را نمایش می‌دهد.',
  },
  {
    q: 'آیا این اپ می‌تواند معامله انجام دهد؟',
    a: 'خیر. این اپ فقط برای مشاهده موجودی و مدیریت دارایی است. هیچ قابلیت معامله، برداشت یا انتقال وجود ندارد. این برای امنیت شماست.',
  },
  {
    q: 'پیش‌بینی قیمت طلا چقدر دقیق است؟',
    a: 'پیش‌بینی‌ها بر اساس تحلیل تکنیکال ساده (میانگین متحرک) است و نباید به‌عنوان توصیه سرمایه‌گذاری در نظر گرفته شود. بازار طلا تحت تأثیر عوامل متعددی (سیاسی، اقتصادی، جهانی) قرار دارد.',
  },
  {
    q: 'آیا اپ رایگان است؟',
    a: 'بله. این اپ کاملاً رایگان و متن‌باز است. سورس کد در GitHub موجود است.',
  },
  {
    q: 'چگونه می‌توانم بهبود اپ را پیشنهاد دهم؟',
    a: 'از طریق GitHub (لینک در بخش «درباره اپلیکیشن» در تنظیمات) می‌توانید issue جدید باز کنید.',
  },
];

export default function HelpFaqScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(0);

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
        <Text style={styles.title}>سؤالات متداول</Text>
      </View>

      {FAQS.map((faq, idx) => {
        const isExpanded = expanded === idx;
        return (
          <View key={idx} style={styles.faqCard}>
            <Pressable
              style={styles.faqHeader}
              onPress={() => setExpanded(isExpanded ? null : idx)}
            >
              <View style={styles.faqIconWrap}>
                <FileQuestion size={14} color={colors.dark.accent} />
              </View>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <ChevronDown
                size={14}
                color={colors.dark.textSecondary}
                style={{
                  transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>
            {isExpanded ? (
              <View style={styles.faqBody}>
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              </View>
            ) : null}
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
    faqCard: {
      marginHorizontal: 12,
      marginBottom: 8,
      backgroundColor: colors.dark.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.dark.border,
      overflow: 'hidden',
    },
    faqHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      padding: 12,
    },
    faqIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.dark.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    faqQuestion: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: colors.dark.text,
      textAlign: 'right',
    },
    faqBody: {
      padding: 12,
      paddingTop: 0,
    },
    faqAnswer: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
      lineHeight: 20,
      marginTop: 8,
    },
  })
);
