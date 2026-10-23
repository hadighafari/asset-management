// ============================================================
//  Root Layout - لایوت اصلی اپ
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet, I18nManager, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import colors from '../constants/colors';

// نادیده گرفتن هشدارهای غیرضروری
LogBox.ignoreAllLogs(true);

I18nManager.forceRTL(true);

// جلوگیری از بسته شدن خودکار splash
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // بستن splash screen بلافاصله بعد از mount
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={colors.dark.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.dark.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="help-usage" />
          <Stack.Screen name="help-faq" />
          <Stack.Screen name="help-privacy" />
          <Stack.Screen name="about" />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
});
