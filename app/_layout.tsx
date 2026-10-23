// ============================================================
//  Root Layout - لایوت اصلی اپ
//  splash screen با لوگو تمام صفحه
// ============================================================

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  View,
  StyleSheet,
  I18nManager,
  LogBox,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import colors from '../constants/colors';
import { AppProvider } from '../contexts/AppContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

LogBox.ignoreAllLogs(true);
I18nManager.forceRTL(true);

// جلوگیری از بسته شدن خودکار splash پیش‌فرض
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
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // بستن splash پیش‌فرض expo بلافاصله
    SplashScreen.hideAsync().catch(() => {});

    // نمایش splash سفارشی برای 2.5 ثانیه
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // نمایش splash با لوگو تمام صفحه
  if (!appReady) {
    return <FullScreenSplash />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
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
              <Stack.Screen name="about" />
            </Stack>
          </View>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// splash با لوگو تمام صفحه
function FullScreenSplash() {
  const { width, height } = Dimensions.get('window');

  return (
    <View style={splashStyles.container}>
      {/* لوگو تمام صفحه - با resizeMode cover کل صفحه را پر می‌کند */}
      <Image
        source={require('../assets/icon.png')}
        style={[splashStyles.logo, { width: width, height: height }]}
        resizeMode="cover"
      />
      {/* لایه تیره برای خوانایی loading indicator */}
      <View style={splashStyles.overlay} />
      {/* loading indicator در پایین صفحه */}
      <View style={splashStyles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 14, 17, 0.3)',
  },
  loadingWrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
