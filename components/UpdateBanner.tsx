// ============================================================
//  UpdateBanner - بنر آپدیت درون‌برنامه‌ای
//  بالای برنامه نمایش داده می‌شود
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../constants/colors';
import { createThemedStyles } from '../utils/themeStyles';
import {
  fetchUpdateInfo,
  onUpdateInfoChanged,
  isUpdateDismissed,
  dismissUpdate,
  openApkDownload,
  getInstalledVersion,
  AppUpdateInfo,
} from '../utils/appUpdate';
import { Download, X, Sparkles } from 'lucide-react-native';

export function UpdateBanner() {
  const [info, setInfo] = useState<AppUpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const unsub = onUpdateInfoChanged((i) => {
      if (mounted && i) setInfo(i);
    });

    (async () => {
      const i = await fetchUpdateInfo();
      if (mounted && i) {
        setInfo(i);
        const dismissedVersion = await isUpdateDismissed(i.latestVersion);
        if (mounted) setDismissed(dismissedVersion ? i.latestVersion : null);
      }
      if (mounted) setChecking(false);
    })();

    const interval = setInterval(() => {
      fetchUpdateInfo();
    }, 15 * 60 * 1000);

    return () => {
      mounted = false;
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (checking || !info || !info.available) return null;
  if (dismissed === info.latestVersion) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await openApkDownload(info.apkUrl);
    } catch (e) {
      console.log('[UpdateBanner] download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDismiss = async () => {
    await dismissUpdate(info.latestVersion);
    setDismissed(info.latestVersion);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Sparkles size={18} color={colors.dark.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>نسخه جدید موجود است!</Text>
        <Text style={styles.subtitle}>
          نسخه {info.latestVersion} آماده دانلود است (نسخه فعلی: {getInstalledVersion()})
        </Text>
        {info.notes ? <Text style={styles.notes}>{info.notes}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.7}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.dark.background} />
          ) : (
            <Download size={14} color={colors.dark.background} />
          )}
          <Text style={styles.downloadBtnText}>
            {downloading ? '...' : 'دانلود'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={16} color={colors.dark.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = createThemedStyles(() =>
  StyleSheet.create({
    container: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 12,
      marginVertical: 6,
      padding: 12,
      backgroundColor: colors.dark.accentDim,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.dark.accent + '44',
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.dark.accent + '22',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textWrap: { flex: 1 },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.dark.accent,
      textAlign: 'right',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      color: colors.dark.textSecondary,
      textAlign: 'right',
    },
    notes: {
      fontSize: 10,
      color: colors.dark.textMuted,
      textAlign: 'right',
      marginTop: 4,
      lineHeight: 16,
    },
    actions: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    downloadBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.dark.accent,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    downloadBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.dark.background,
    },
    dismissBtn: { padding: 6 },
  })
);
