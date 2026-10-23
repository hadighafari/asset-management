// ============================================================
//  AppContext - مدیریت تم و IP و قفل اپ
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const newSettings = { ...DEFAULT_SETTINGS, ...parsed };
          setSettings(newSettings);
          setThemeMode(newSettings.themeMode);
        }
      } catch {}
      setSettingsLoaded(true);
    })();
  }, []);

  const refreshIp = useCallback(async () => {
    clearIpCache();
    const info = await checkIp();
    setIpInfo(info);
  }, []);

  useEffect(() => {
    if (settingsLoaded) {
      refreshIp();
      const interval = setInterval(refreshIp, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [settingsLoaded, refreshIp]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    if (patch.themeMode) {
      setThemeMode(patch.themeMode);
    }
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {}
  }, [settings]);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

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
