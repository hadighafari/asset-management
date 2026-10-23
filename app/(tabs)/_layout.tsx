// ============================================================
//  Tabs Layout - نوار تب پایین
//  تب‌ها: مدیریت دارایی، تنظیمات
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import colors from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopColor: colors.dark.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.dark.accent,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'مدیریت دارایی',
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'تنظیمات',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
