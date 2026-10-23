// ============================================================
//  Root Layout - لایوت اصلی اپ
//  با splash screen لوگو بزرگ در وسط
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

LogBox.ignoreAllLogs(true);
I18nManager.forceRTL(true);
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
    (async () => {
      // نمایش splash سفارشی برای 2 ثانیه
      setTimeout(() => {
        setAppReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }, 2000);
    })();
  }, []);

  if (!appReady) {
    return <SplashScreen_Logo />;
  }

  return (
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
  );
}

// splash سفارشی با لوگو بزرگ در وسط
function SplashScreen_Logo() {
  const { width, height } = Dimensions.get('window');
  const logoSize = Math.min(width, height) * 0.55; // 55% از کوچکترین بعد

  return (
    <View style={splashStyles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={[splashStyles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
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
    borderRadius: 24,
  },
  loadingWrap: {
    marginTop: 40,
  },
});
