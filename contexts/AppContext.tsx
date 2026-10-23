// ============================================================
//  AppContext - مدیریت تم و IP و قفل اپ
//  ساده شده برای جلوگیری از گیر کردن در startup
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
  settingsLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // مهم: تنظیمات پیش‌فرض از همان ابتدا فعال هستند
  // اگر AsyncStorage دیر لود شود، مشکلی نیست - اپ کار می‌کند
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(true); // مهم: default true

  // بارگذاری تنظیمات در background (بدون block کردن اپ)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const newSettings = { ...DEFAULT_SETTINGS, ...parsed };
          setSettings(newSettings);
          if (parsed.themeMode) {
            setThemeMode(parsed.themeMode);
          }
        }
      } catch (e) {
        console.log('[AppContext] settings load error:', e);
      }
      setSettingsLoaded(true);
    })();
  }, []);

  // بررسی IP در background (بدون block کردن اپ)
  const refreshIp = useCallback(async () => {
    try {
      clearIpCache();
      const info = await checkIp();
      setIpInfo(info);
    } catch (e) {
      console.log('[AppContext] IP check error:', e);
    }
  }, []);

  useEffect(() => {
    // IP check را با delay اجرا می‌کنیم تا اپ اول بالا بیاید
    const timer = setTimeout(() => {
      refreshIp();
    }, 1000);
    const interval = setInterval(refreshIp, 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refreshIp]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    if (patch.themeMode) {
      setThemeMode(patch.themeMode);
    }
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.log('[AppContext] settings save error:', e);
    }
  }, [settings]);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.log('[AppContext] settings save error:', e);
    }
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
        settingsLoaded,
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
