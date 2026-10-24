// ============================================================
//  AppContext - مدیریت تم و IP
//  ساده شده - بدون useEffect در startup
//  همه چیز lazy load می‌شود
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setThemeMode, ThemeMode } from '../constants/colors';
import { checkIp, IpInfo, clearIpCache } from '../utils/ipCheck';

const SETTINGS_KEY = '@app_settings_v2';

interface AppSettings {
  themeMode: ThemeMode;
  pinLock: boolean;
  autoRefresh: boolean;
  hideTotal: boolean;
  notifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  pinLock: false,
  autoRefresh: true,
  hideTotal: false,
  notifications: true,
};

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  saveSettings: () => Promise<void>;
  ipInfo: IpInfo | null;
  refreshIp: () => Promise<void>;
  isIran: boolean;
  canAccessCrypto: boolean;
  settingsLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // فقط state های ساده - بدون useEffect در startup
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);

  // updateSettings به‌صورت async
  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    if (patch.themeMode) {
      setThemeMode(patch.themeMode);
    }
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.log('[AppContext] save error:', e);
    }
  }, [settings]);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.log('[AppContext] save error:', e);
    }
  }, [settings]);

  // refreshIp به‌صورت async
  const refreshIp = useCallback(async () => {
    try {
      clearIpCache();
      const info = await checkIp();
      if (info) setIpInfo(info);
    } catch (e) {
      console.log('[AppContext] IP check error:', e);
    }
  }, []);

  const isIran = ipInfo?.isIran ?? false;
  const canAccessCrypto = !isIran;

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettings,
        ipInfo,
        refreshIp,
        isIran,
        canAccessCrypto,
        settingsLoaded: true,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
