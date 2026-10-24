// ============================================================
//  Root Layout - لایوت اصلی اپ
//  با SafeAreaProvider برای جلوگیری از crash
// ============================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, I18nManager, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import { AppProvider } from '../contexts/AppContext';

LogBox.ignoreAllLogs(true);
I18nManager.forceRTL(true);

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
  return (
    <SafeAreaProvider>
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
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="+native-intent" />
            </Stack>
          </View>
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
});
